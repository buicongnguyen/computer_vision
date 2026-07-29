window.CV_CODING_SOLUTIONS = Array.isArray(window.CV_CODING_SOLUTIONS)
  ? window.CV_CODING_SOLUTIONS
  : [];

window.CV_CODING_SOLUTIONS.push(
  {
    id: "img-convolution",
    python: {
      code: `import math
import numpy as np


def convolve2d(image, kernel, stride=1, padding="valid", flip_kernel=True):
    x = np.asarray(image, dtype=np.float64)
    k = np.asarray(kernel, dtype=np.float64)
    if x.ndim == 2:
        x = x[None, ...]
        squeeze = True
    elif x.ndim == 3:
        squeeze = False
    else:
        raise ValueError("image must have shape (H,W) or (N,H,W)")
    if k.ndim != 2 or min(k.shape) == 0 or stride <= 0:
        raise ValueError("kernel must be nonempty 2D and stride must be positive")

    # Convolution flips the kernel; correlation deliberately keeps it unchanged.
    if flip_kernel:
        k = k[::-1, ::-1]
    n, h, w = x.shape
    kh, kw = k.shape
    if padding == "same":
        oh, ow = math.ceil(h / stride), math.ceil(w / stride)
        ph = max((oh - 1) * stride + kh - h, 0)
        pw = max((ow - 1) * stride + kw - w, 0)
        pads = (ph // 2, ph - ph // 2, pw // 2, pw - pw // 2)
    elif padding == "valid":
        if h < kh or w < kw:
            raise ValueError("kernel is larger than an unpadded input")
        pads = (0, 0, 0, 0)
        oh = (h - kh) // stride + 1
        ow = (w - kw) // stride + 1
    else:
        raise ValueError("padding must be 'valid' or 'same'")

    # Padding is separated from accumulation so output-shape reasoning is explicit.
    padded = np.pad(x, ((0, 0), pads[:2], pads[2:]))
    out = np.empty((n, oh, ow), dtype=np.float64)
    for row in range(oh):
        for col in range(ow):
            patch = padded[
                :, row * stride : row * stride + kh,
                col * stride : col * stride + kw
            ]
            out[:, row, col] = np.sum(patch * k, axis=(1, 2))
    return out[0] if squeeze else out`,
      walkthrough: [
        "Normalize single images and batches to one internal N×H×W contract.",
        "Derive asymmetric same-padding from the requested output shape.",
        "Flip only for convolution, then accumulate each explicitly bounded patch."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <string>
#include <vector>
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>

std::vector<cv::Mat> convolve2d(
    const std::vector<cv::Mat>& batch,
    const cv::Mat& kernel_input,
    int stride = 1,
    const std::string& padding = "valid",
    bool flip_kernel = true) {
  if (batch.empty() || kernel_input.empty() || kernel_input.channels() != 1 ||
      stride <= 0) {
    throw std::invalid_argument("nonempty batch/kernel and positive stride required");
  }
  cv::Mat kernel;
  kernel_input.convertTo(kernel, CV_64F);
  if (flip_kernel) {
    cv::flip(kernel, kernel, -1);  // Convolution flips both kernel axes.
  }

  std::vector<cv::Mat> outputs;
  for (const cv::Mat& input : batch) {
    if (input.empty() || input.channels() != 1) {
      throw std::invalid_argument("each image must be nonempty and single-channel");
    }
    cv::Mat image;
    input.convertTo(image, CV_64F);
    int top = 0, bottom = 0, left = 0, right = 0;
    int out_h = 0, out_w = 0;
    if (padding == "same") {
      out_h = static_cast<int>(std::ceil(image.rows / double(stride)));
      out_w = static_cast<int>(std::ceil(image.cols / double(stride)));
      const int pad_h = std::max((out_h - 1) * stride + kernel.rows - image.rows, 0);
      const int pad_w = std::max((out_w - 1) * stride + kernel.cols - image.cols, 0);
      top = pad_h / 2; bottom = pad_h - top;
      left = pad_w / 2; right = pad_w - left;
    } else if (padding == "valid") {
      if (image.rows < kernel.rows || image.cols < kernel.cols) {
        throw std::invalid_argument("kernel is larger than unpadded image");
      }
      out_h = (image.rows - kernel.rows) / stride + 1;
      out_w = (image.cols - kernel.cols) / stride + 1;
    } else {
      throw std::invalid_argument("padding must be valid or same");
    }

    cv::Mat padded;
    cv::copyMakeBorder(image, padded, top, bottom, left, right,
                       cv::BORDER_CONSTANT, 0.0);
    cv::Mat out(out_h, out_w, CV_64F);
    for (int r = 0; r < out_h; ++r) {
      for (int c = 0; c < out_w; ++c) {
        // The ROI bounds are guaranteed by the shape calculation above.
        cv::Mat patch = padded(cv::Rect(c * stride, r * stride,
                                       kernel.cols, kernel.rows));
        out.at<double>(r, c) = cv::sum(patch.mul(kernel))[0];
      }
    }
    outputs.push_back(out);
  }
  return outputs;
}`,
      walkthrough: [
        "Convert inputs once to a declared floating-point representation.",
        "Compute valid or same output geometry before touching image memory.",
        "Use bounded OpenCV views for the explicit multiply-accumulate operation."
      ]
    }
  },
  {
    id: "img-bilinear",
    python: {
      code: `import numpy as np


def bilinear_sample(image, coordinates_uv, border="zero"):
    image = np.asarray(image, dtype=np.float64)
    points = np.asarray(coordinates_uv, dtype=np.float64)
    if image.ndim not in (2, 3) or min(image.shape[:2]) == 0:
        raise ValueError("image must be nonempty HxW or HxWxC")
    if points.ndim != 2 or points.shape[1] != 2 or not np.isfinite(points).all():
        raise ValueError("coordinates must be a finite N×2 array of (u,v)")

    gray = image.ndim == 2
    values = image[..., None] if gray else image
    h, w, channels = values.shape
    u, v = points[:, 0].copy(), points[:, 1].copy()
    if border == "clamp":
        u, v = np.clip(u, 0, w - 1), np.clip(v, 0, h - 1)
    elif border == "reject":
        if np.any((u < 0) | (u > w - 1) | (v < 0) | (v > h - 1)):
            raise ValueError("coordinate lies outside the image")
    elif border != "zero":
        raise ValueError("border must be zero, clamp, or reject")

    u0, v0 = np.floor(u).astype(int), np.floor(v).astype(int)
    u1, v1 = u0 + 1, v0 + 1
    du, dv = u - u0, v - v0

    def fetch(rows, cols):
        valid = (rows >= 0) & (rows < h) & (cols >= 0) & (cols < w)
        out = np.zeros((len(points), channels), dtype=np.float64)
        # Invalid zero-border neighbors contribute zero instead of being clipped.
        out[valid] = values[rows[valid], cols[valid]]
        return out

    # Integer pixel coordinates are pixel centers; weights form a partition of one.
    result = (
        fetch(v0, u0) * ((1 - du) * (1 - dv))[:, None]
        + fetch(v0, u1) * (du * (1 - dv))[:, None]
        + fetch(v1, u0) * ((1 - du) * dv)[:, None]
        + fetch(v1, u1) * (du * dv)[:, None]
    )
    return result[:, 0] if gray else result`,
      walkthrough: [
        "Declare integer coordinates as pixel centers and validate the N×2 coordinate contract.",
        "Choose border behavior before neighbor lookup so zero and clamp remain distinct.",
        "Blend four neighbors with separable fractional-area weights."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <string>
#include <vector>
#include <opencv2/core.hpp>

cv::Mat bilinearSample(
    const cv::Mat& input,
    const std::vector<cv::Point2d>& coordinates,
    const std::string& border = "zero") {
  if (input.empty()) throw std::invalid_argument("image must be nonempty");
  if (border != "zero" && border != "clamp" && border != "reject") {
    throw std::invalid_argument("unknown border policy");
  }
  cv::Mat image;
  input.convertTo(image, CV_MAKETYPE(CV_64F, input.channels()));
  const int channels = image.channels();
  cv::Mat output(static_cast<int>(coordinates.size()), channels, CV_64F, 0.0);

  auto fetch = [&](int row, int col, int channel) {
    if (row < 0 || row >= image.rows || col < 0 || col >= image.cols) {
      return 0.0;  // Zero-border samples never alias an edge pixel.
    }
    return image.ptr<double>(row)[col * channels + channel];
  };

  for (int i = 0; i < static_cast<int>(coordinates.size()); ++i) {
    double u = coordinates[i].x, v = coordinates[i].y;
    if (!std::isfinite(u) || !std::isfinite(v)) {
      throw std::invalid_argument("coordinates must be finite");
    }
    const bool outside = u < 0 || u > image.cols - 1 ||
                         v < 0 || v > image.rows - 1;
    if (border == "reject" && outside) {
      throw std::out_of_range("coordinate lies outside image");
    }
    if (border == "clamp") {
      u = std::clamp(u, 0.0, image.cols - 1.0);
      v = std::clamp(v, 0.0, image.rows - 1.0);
    }
    const int u0 = static_cast<int>(std::floor(u));
    const int v0 = static_cast<int>(std::floor(v));
    const double du = u - u0, dv = v - v0;
    for (int ch = 0; ch < channels; ++ch) {
      // These four bilinear weights sum to one for every finite coordinate.
      output.at<double>(i, ch) =
          (1 - du) * (1 - dv) * fetch(v0, u0, ch) +
          du * (1 - dv) * fetch(v0, u0 + 1, ch) +
          (1 - du) * dv * fetch(v0 + 1, u0, ch) +
          du * dv * fetch(v0 + 1, u0 + 1, ch);
    }
  }
  return output;
}`,
      walkthrough: [
        "Convert any OpenCV depth to a stable double-precision working image.",
        "Apply reject, clamp, or zero semantics before reading neighbors.",
        "Interpolate every channel with the same geometry and independent values."
      ]
    }
  },
  {
    id: "img-sobel",
    python: {
      code: `import numpy as np


def sobel_with_nms(image):
    x = np.asarray(image, dtype=np.float64)
    if x.ndim != 2 or min(x.shape) < 3 or not np.isfinite(x).all():
        raise ValueError("image must be a finite grayscale array at least 3×3")
    kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)
    ky = kx.T
    padded = np.pad(x, 1, mode="reflect")

    def correlate(kernel):
        out = np.empty_like(x)
        for row in range(x.shape[0]):
            for col in range(x.shape[1]):
                out[row, col] = np.sum(
                    padded[row : row + 3, col : col + 3] * kernel
                )
        return out

    gx, gy = correlate(kx), correlate(ky)
    magnitude = np.hypot(gx, gy)
    orientation = np.arctan2(gy, gx)  # atan2 preserves the full signed direction.
    direction = (np.rad2deg(orientation) + 180.0) % 180.0
    nms = np.zeros_like(magnitude)
    offsets = ((0, 1), (1, 1), (1, 0), (1, -1))
    bins = ((direction + 22.5) // 45).astype(int) % 4

    # NMS keeps a response only when it is maximal along the gradient normal.
    for row in range(1, x.shape[0] - 1):
        for col in range(1, x.shape[1] - 1):
            dr, dc = offsets[bins[row, col]]
            value = magnitude[row, col]
            if value >= magnitude[row - dr, col - dc] and value >= magnitude[row + dr, col + dc]:
                nms[row, col] = value
    return gx, gy, magnitude, orientation, nms`,
      walkthrough: [
        "Correlate with explicit Sobel x/y kernels under a declared reflected border.",
        "Use hypot and atan2 so zero and signed directions remain numerically defined.",
        "Quantize only for NMS, comparing along the gradient direction."
      ]
    },
    cpp: {
      code: `#include <cmath>
#include <stdexcept>
#include <tuple>
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>

using SobelResult = std::tuple<cv::Mat, cv::Mat, cv::Mat, cv::Mat, cv::Mat>;

SobelResult sobelWithNms(const cv::Mat& input) {
  if (input.empty() || input.channels() != 1 ||
      input.rows < 3 || input.cols < 3) {
    throw std::invalid_argument("finite grayscale image at least 3x3 required");
  }
  cv::Mat image;
  input.convertTo(image, CV_64F);
  cv::Mat gx, gy;
  cv::Sobel(image, gx, CV_64F, 1, 0, 3, 1.0, 0.0, cv::BORDER_REFLECT_101);
  cv::Sobel(image, gy, CV_64F, 0, 1, 3, 1.0, 0.0, cv::BORDER_REFLECT_101);
  cv::Mat magnitude(image.size(), CV_64F);
  cv::Mat orientation(image.size(), CV_64F);
  cv::Mat nms(image.size(), CV_64F, 0.0);

  for (int r = 0; r < image.rows; ++r) {
    for (int c = 0; c < image.cols; ++c) {
      const double dx = gx.at<double>(r, c), dy = gy.at<double>(r, c);
      magnitude.at<double>(r, c) = std::hypot(dx, dy);
      orientation.at<double>(r, c) = std::atan2(dy, dx);  // Full signed angle.
    }
  }
  const int dr[4] = {0, 1, 1, 1};
  const int dc[4] = {1, 1, 0, -1};
  for (int r = 1; r + 1 < image.rows; ++r) {
    for (int c = 1; c + 1 < image.cols; ++c) {
      double degrees = orientation.at<double>(r, c) * 180.0 / CV_PI;
      if (degrees < 0) degrees += 180.0;
      const int bin = static_cast<int>(std::floor((degrees + 22.5) / 45.0)) % 4;
      const double value = magnitude.at<double>(r, c);
      // Compare along the gradient normal, not along the visible edge.
      if (value >= magnitude.at<double>(r - dr[bin], c - dc[bin]) &&
          value >= magnitude.at<double>(r + dr[bin], c + dc[bin])) {
        nms.at<double>(r, c) = value;
      }
    }
  }
  return {gx, gy, magnitude, orientation, nms};
}`,
      walkthrough: [
        "Use OpenCV only for the declared Sobel derivative under reflected borders.",
        "Compute magnitude and radians explicitly from the two derivative images.",
        "Perform directional suppression manually so its geometric choice is visible."
      ]
    }
  },
  {
    id: "img-components",
    python: {
      code: `from collections import deque
import numpy as np


def connected_components(mask, connectivity=4):
    foreground = np.asarray(mask, dtype=bool)
    if foreground.ndim != 2:
        raise ValueError("mask must be two-dimensional")
    if connectivity not in (4, 8):
        raise ValueError("connectivity must be 4 or 8")
    labels = np.zeros(foreground.shape, dtype=np.int32)
    neighbors = [(-1, 0), (0, -1), (0, 1), (1, 0)]
    if connectivity == 8:
        neighbors += [(-1, -1), (-1, 1), (1, -1), (1, 1)]

    components = []
    next_label = 0
    for start_r, start_c in np.argwhere(foreground):
        if labels[start_r, start_c] != 0:
            continue
        next_label += 1  # Row-major discovery makes label assignment deterministic.
        queue = deque([(int(start_r), int(start_c))])
        labels[start_r, start_c] = next_label
        area = 0
        min_r = max_r = int(start_r)
        min_c = max_c = int(start_c)
        while queue:
            r, c = queue.popleft()  # An explicit queue avoids recursion overflow.
            area += 1
            min_r, max_r = min(min_r, r), max(max_r, r)
            min_c, max_c = min(min_c, c), max(max_c, c)
            for dr, dc in neighbors:
                nr, nc = r + dr, c + dc
                if (0 <= nr < foreground.shape[0] and
                        0 <= nc < foreground.shape[1] and
                        foreground[nr, nc] and labels[nr, nc] == 0):
                    labels[nr, nc] = next_label
                    queue.append((nr, nc))
        components.append({
            "label": next_label,
            "area": area,
            "bbox_xyxy": (min_c, min_r, max_c + 1, max_r + 1)
        })
    return labels, components`,
      walkthrough: [
        "Scan foreground pixels in row-major order for deterministic component IDs.",
        "Mark a pixel when enqueuing it so no pixel can enter the frontier twice.",
        "Accumulate area and a half-open bounding box during the same O(HW) traversal."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <queue>
#include <stdexcept>
#include <utility>
#include <vector>
#include <opencv2/core.hpp>

struct Component {
  int label;
  int area;
  cv::Rect bbox;
};

std::pair<cv::Mat, std::vector<Component>> connectedComponents(
    const cv::Mat& mask, int connectivity = 4) {
  if (mask.dims > 2 || mask.channels() != 1) {
    throw std::invalid_argument("mask must be two-dimensional and single-channel");
  }
  if (connectivity != 4 && connectivity != 8) {
    throw std::invalid_argument("connectivity must be 4 or 8");
  }
  if (mask.empty()) {
    // An empty mask has no foreground components but is still a valid input.
    cv::Mat labels = cv::Mat::zeros(mask.rows, mask.cols, CV_32S);
    return {labels, {}};
  }
  cv::Mat foreground;
  cv::compare(mask, 0, foreground, cv::CMP_NE);
  cv::Mat labels(mask.size(), CV_32S, cv::Scalar(0));
  std::vector<cv::Point> offsets{{-1, 0}, {0, -1}, {1, 0}, {0, 1}};
  if (connectivity == 8) {
    offsets.insert(offsets.end(), {{-1, -1}, {1, -1}, {-1, 1}, {1, 1}});
  }

  std::vector<Component> components;
  int next_label = 0;
  for (int r = 0; r < mask.rows; ++r) {
    for (int c = 0; c < mask.cols; ++c) {
      if (!foreground.at<unsigned char>(r, c) || labels.at<int>(r, c)) continue;
      ++next_label;  // Row-major seeds guarantee deterministic labels.
      std::queue<cv::Point> frontier;
      frontier.push({c, r});
      labels.at<int>(r, c) = next_label;
      int area = 0, min_x = c, max_x = c, min_y = r, max_y = r;
      while (!frontier.empty()) {
        const cv::Point p = frontier.front();
        frontier.pop();  // Iterative BFS is safe for very large components.
        ++area;
        min_x = std::min(min_x, p.x); max_x = std::max(max_x, p.x);
        min_y = std::min(min_y, p.y); max_y = std::max(max_y, p.y);
        for (const cv::Point d : offsets) {
          const cv::Point q = p + d;
          if (q.x >= 0 && q.x < mask.cols && q.y >= 0 && q.y < mask.rows &&
              foreground.at<unsigned char>(q.y, q.x) &&
              labels.at<int>(q.y, q.x) == 0) {
            labels.at<int>(q.y, q.x) = next_label;
            frontier.push(q);
          }
        }
      }
      components.push_back({next_label, area,
                            cv::Rect(min_x, min_y, max_x - min_x + 1,
                                     max_y - min_y + 1)});
    }
  }
  return {labels, components};
}`,
      walkthrough: [
        "Normalize arbitrary nonzero mask values to a binary foreground image.",
        "Use iterative BFS and mark neighbors before enqueueing.",
        "Return labels plus area and OpenCV half-open bounding rectangles."
      ]
    }
  },
  {
    id: "img-pyramid",
    python: {
      code: `import cv2
import numpy as np


def build_laplacian_pyramid(image, levels):
    current = np.asarray(image, dtype=np.float64)
    if current.ndim not in (2, 3) or current.size == 0 or levels < 1:
        raise ValueError("nonempty image and at least one level required")
    gaussian = [current.copy()]
    shapes = [current.shape[:2]]
    for _ in range(levels):
        if min(gaussian[-1].shape[:2]) < 2:
            raise ValueError("too many levels for image size")
        # pyrDown applies a Gaussian low-pass before decimation to limit aliasing.
        gaussian.append(cv2.pyrDown(gaussian[-1]))
        shapes.append(gaussian[-1].shape[:2])

    laplacian = []
    for level in range(levels):
        h, w = shapes[level]
        expanded = cv2.pyrUp(gaussian[level + 1], dstsize=(w, h))
        laplacian.append(gaussian[level] - expanded)
    return laplacian, gaussian[-1], shapes


def reconstruct_laplacian(laplacian, coarsest, shapes):
    current = np.asarray(coarsest, dtype=np.float64)
    if len(shapes) != len(laplacian) + 1:
        raise ValueError("shape metadata does not match pyramid")
    for level in range(len(laplacian) - 1, -1, -1):
        h, w = shapes[level]
        # Stored target shapes remove odd-size alignment ambiguity.
        current = cv2.pyrUp(current, dstsize=(w, h)) + laplacian[level]
    return current`,
      walkthrough: [
        "Low-pass and decimate to form Gaussian levels while storing exact shapes.",
        "Define each Laplacian level as the residual from an aligned expansion.",
        "Reverse the residual relation to reconstruct odd and even image sizes."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>

struct LaplacianPyramid {
  std::vector<cv::Mat> residuals;
  cv::Mat coarsest;
  std::vector<cv::Size> shapes;
};

LaplacianPyramid buildLaplacianPyramid(const cv::Mat& input, int levels) {
  if (input.empty() || levels < 1) {
    throw std::invalid_argument("nonempty image and positive levels required");
  }
  cv::Mat current;
  input.convertTo(current, CV_MAKETYPE(CV_64F, input.channels()));
  std::vector<cv::Mat> gaussian{current};
  std::vector<cv::Size> shapes{current.size()};
  for (int level = 0; level < levels; ++level) {
    if (std::min(gaussian.back().rows, gaussian.back().cols) < 2) {
      throw std::invalid_argument("too many levels for image size");
    }
    cv::Mat down;
    cv::pyrDown(gaussian.back(), down);  // Gaussian filtering precedes decimation.
    gaussian.push_back(down);
    shapes.push_back(down.size());
  }

  std::vector<cv::Mat> residuals;
  for (int level = 0; level < levels; ++level) {
    cv::Mat expanded;
    cv::pyrUp(gaussian[level + 1], expanded, shapes[level]);
    residuals.push_back(gaussian[level] - expanded);
  }
  return {residuals, gaussian.back(), shapes};
}

cv::Mat reconstructLaplacian(const LaplacianPyramid& pyramid) {
  if (pyramid.shapes.size() != pyramid.residuals.size() + 1) {
    throw std::invalid_argument("inconsistent shape metadata");
  }
  cv::Mat current = pyramid.coarsest.clone();
  for (int level = static_cast<int>(pyramid.residuals.size()) - 1;
       level >= 0; --level) {
    cv::Mat expanded;
    // Exact stored sizes resolve every odd-dimension upsampling choice.
    cv::pyrUp(current, expanded, pyramid.shapes[level]);
    current = expanded + pyramid.residuals[level];
  }
  return current;
}`,
      walkthrough: [
        "Convert once to floating point so residuals retain their sign.",
        "Store exact level sizes alongside Gaussian-derived residuals.",
        "Reconstruct from coarse to fine by expansion and residual addition."
      ]
    }
  },
  {
    id: "img-histogram",
    python: {
      code: `import cv2
import numpy as np


def global_equalize_u8(image):
    x = np.asarray(image)
    if x.ndim != 2 or x.dtype != np.uint8 or x.size == 0:
        raise ValueError("expected a nonempty uint8 grayscale image")
    histogram = np.bincount(x.ravel(), minlength=256)
    occupied = np.flatnonzero(histogram)
    if len(occupied) <= 1:
        return x.copy()  # A constant image has no contrast distribution to expand.
    cdf = histogram.cumsum()
    cdf_min = cdf[occupied[0]]
    denominator = x.size - cdf_min
    lookup = np.rint(255.0 * (cdf - cdf_min) / denominator)
    lookup = np.clip(lookup, 0, 255).astype(np.uint8)
    # A cumulative histogram produces a monotone intensity mapping by construction.
    return lookup[x]


def contrast_limited_equalize_u8(image, tile_grid=(8, 8), clip_limit=2.0):
    x = np.asarray(image)
    if x.ndim != 2 or x.dtype != np.uint8 or x.size == 0:
        raise ValueError("expected a nonempty uint8 grayscale image")
    if min(tile_grid) <= 0 or clip_limit <= 0:
        raise ValueError("tile dimensions and clip limit must be positive")
    # OpenCV clips each tile histogram and interpolates neighboring mappings,
    # which avoids hard seams between independently equalized tiles.
    clahe = cv2.createCLAHE(clipLimit=float(clip_limit),
                            tileGridSize=tuple(map(int, tile_grid)))
    return clahe.apply(x)`,
      walkthrough: [
        "Build a monotone global lookup table from the cumulative histogram.",
        "Return constant images unchanged because their CDF has zero useful span.",
        "Use clipped local histograms plus interpolated tile mappings for the local extension."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <array>
#include <cmath>
#include <stdexcept>
#include <utility>
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>

cv::Mat globalEqualizeU8(const cv::Mat& image) {
  if (image.empty() || image.type() != CV_8UC1) {
    throw std::invalid_argument("expected nonempty uint8 grayscale image");
  }
  std::array<int, 256> histogram{};
  for (int r = 0; r < image.rows; ++r)
    for (int c = 0; c < image.cols; ++c)
      ++histogram[image.at<unsigned char>(r, c)];

  int first = 0;
  while (first < 256 && histogram[first] == 0) ++first;
  int distinct = 0;
  for (int count : histogram) distinct += count > 0;
  if (distinct <= 1) return image.clone();  // Constant input remains well-defined.

  std::array<unsigned char, 256> lookup{};
  int cdf = 0;
  const int cdf_min = histogram[first];
  const int denominator = image.rows * image.cols - cdf_min;
  for (int value = 0; value < 256; ++value) {
    cdf += histogram[value];
    const double mapped = 255.0 * (cdf - cdf_min) / denominator;
    // CDF order guarantees a monotone lookup even after rounding and clipping.
    lookup[value] = cv::saturate_cast<unsigned char>(std::round(mapped));
  }
  cv::Mat output(image.size(), image.type());
  for (int r = 0; r < image.rows; ++r)
    for (int c = 0; c < image.cols; ++c)
      output.at<unsigned char>(r, c) = lookup[image.at<unsigned char>(r, c)];
  return output;
}

cv::Mat contrastLimitedEqualizeU8(
    const cv::Mat& image, cv::Size tile_grid = {8, 8},
    double clip_limit = 2.0) {
  if (image.empty() || image.type() != CV_8UC1 ||
      tile_grid.width <= 0 || tile_grid.height <= 0 || clip_limit <= 0) {
    throw std::invalid_argument("invalid CLAHE input or parameters");
  }
  // CLAHE redistributes clipped peaks and interpolates mappings across tiles.
  cv::Ptr<cv::CLAHE> clahe = cv::createCLAHE(clip_limit, tile_grid);
  cv::Mat output;
  clahe->apply(image, output);
  return output;
}`,
      walkthrough: [
        "Count all 256 integer bins and locate the first occupied intensity.",
        "Convert the CDF into a deterministic monotone lookup table.",
        "Use CLAHE for clipped, interpolated local mappings rather than seam-prone independent tiles."
      ]
    }
  }
);

window.CV_CODING_SOLUTIONS.push(
  {
    id: "det-iou-nms",
    python: {
      code: `import numpy as np


def pairwise_iou(boxes_a, boxes_b):
    a, b = np.asarray(boxes_a, float), np.asarray(boxes_b, float)
    if a.ndim != 2 or b.ndim != 2 or a.shape[1:] != (4,) or b.shape[1:] != (4,):
        raise ValueError("boxes must have shape N×4 in xyxy order")
    if not np.isfinite(a).all() or not np.isfinite(b).all():
        raise ValueError("boxes must be finite")
    if np.any(a[:, 2:] < a[:, :2]) or np.any(b[:, 2:] < b[:, :2]):
        raise ValueError("box maximum must not be below its minimum")
    top_left = np.maximum(a[:, None, :2], b[None, :, :2])
    bottom_right = np.minimum(a[:, None, 2:], b[None, :, 2:])
    wh = np.maximum(bottom_right - top_left, 0.0)
    intersection = wh[..., 0] * wh[..., 1]
    area_a = np.prod(a[:, 2:] - a[:, :2], axis=1)
    area_b = np.prod(b[:, 2:] - b[:, :2], axis=1)
    union = area_a[:, None] + area_b[None, :] - intersection
    # Continuous coordinates have no pixel-inclusive +1; zero union maps to zero.
    return np.divide(intersection, union, out=np.zeros_like(intersection), where=union > 0)


def stable_per_class_nms(boxes, scores, classes, threshold):
    boxes, scores, classes = np.asarray(boxes, float), np.asarray(scores, float), np.asarray(classes)
    if boxes.shape != (len(scores), 4) or classes.shape != scores.shape:
        raise ValueError("boxes, scores, and classes must have matching length")
    if not np.isfinite(scores).all() or not 0 <= threshold <= 1:
        raise ValueError("finite scores and threshold in [0,1] required")
    keep = []
    for category in np.unique(classes):
        candidates = np.flatnonzero(classes == category)
        order = candidates[np.argsort(-scores[candidates], kind="stable")]
        while len(order):
            current = int(order[0])
            keep.append(current)
            overlaps = pairwise_iou(boxes[[current]], boxes[order[1:]])[0]
            # Suppress strictly above the threshold; equality is intentionally kept.
            order = order[1:][overlaps <= threshold]
    return np.array(sorted(keep, key=lambda i: (-scores[i], i)), dtype=np.int64)`,
      walkthrough: [
        "Validate a continuous-coordinate xyxy convention and vectorize pairwise intersections.",
        "Sort each class stably so score ties preserve deterministic input order.",
        "Greedily retain the best box and suppress only overlaps above the declared boundary."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <numeric>
#include <stdexcept>
#include <vector>
#include <Eigen/Dense>

double boxIou(const Eigen::Vector4d& a, const Eigen::Vector4d& b) {
  if (!a.allFinite() || !b.allFinite() ||
      a.z() < a.x() || a.w() < a.y() ||
      b.z() < b.x() || b.w() < b.y()) {
    throw std::invalid_argument("invalid finite xyxy box");
  }
  const double width = std::max(0.0, std::min(a.z(), b.z()) - std::max(a.x(), b.x()));
  const double height = std::max(0.0, std::min(a.w(), b.w()) - std::max(a.y(), b.y()));
  const double intersection = width * height;
  const double area_a = (a.z() - a.x()) * (a.w() - a.y());
  const double area_b = (b.z() - b.x()) * (b.w() - b.y());
  const double union_area = area_a + area_b - intersection;
  // Coordinates describe a continuous plane, so no pixel-inclusive +1 is used.
  return union_area > 0 ? intersection / union_area : 0.0;
}

std::vector<int> stablePerClassNms(
    const std::vector<Eigen::Vector4d>& boxes,
    const std::vector<double>& scores,
    const std::vector<int>& classes,
    double threshold) {
  if (boxes.size() != scores.size() || boxes.size() != classes.size() ||
      !std::isfinite(threshold) || threshold < 0 || threshold > 1) {
    throw std::invalid_argument("inconsistent detection arrays or threshold");
  }
  for (int i = 0; i < static_cast<int>(boxes.size()); ++i) {
    if (!boxes[i].allFinite() || !std::isfinite(scores[i]) ||
        boxes[i].z() < boxes[i].x() || boxes[i].w() < boxes[i].y()) {
      throw std::invalid_argument("every detection needs a finite score and valid xyxy box");
    }
  }
  std::vector<int> all_indices(boxes.size());
  std::iota(all_indices.begin(), all_indices.end(), 0);
  std::stable_sort(all_indices.begin(), all_indices.end(), [&](int a, int b) {
    return scores[a] > scores[b];
  });

  std::vector<int> keep;
  std::vector<bool> suppressed(boxes.size(), false);
  for (int current : all_indices) {
    if (suppressed[current]) continue;
    keep.push_back(current);
    for (int candidate : all_indices) {
      if (candidate == current || suppressed[candidate] ||
          classes[candidate] != classes[current] ||
          scores[candidate] > scores[current]) continue;
      // Equality at the IoU threshold survives by explicit contract.
      if (boxIou(boxes[current], boxes[candidate]) > threshold)
        suppressed[candidate] = true;
    }
  }
  return keep;
}`,
      walkthrough: [
        "Compute continuous-coordinate IoU with explicit zero-area behavior.",
        "Stable-sort all candidates by descending confidence.",
        "Suppress only same-class, lower-priority boxes beyond the strict threshold."
      ]
    }
  },
  {
    id: "det-ap",
    python: {
      code: `from collections import defaultdict
import numpy as np


def _overlap(a, b, crowd=False):
    top_left = np.maximum(a[:2], b[:2])
    bottom_right = np.minimum(a[2:], b[2:])
    wh = np.maximum(bottom_right - top_left, 0)
    intersection = wh[0] * wh[1]
    prediction_area = np.prod(np.maximum(a[2:] - a[:2], 0))
    if crowd:
        # Crowd regions may absorb multiple detections; IoA measures the
        # fraction of the prediction covered by the crowd region.
        return float(intersection / prediction_area) if prediction_area > 0 else 0.0
    truth_area = np.prod(np.maximum(b[2:] - b[:2], 0))
    union = prediction_area + truth_area - intersection
    return float(intersection / union) if union > 0 else 0.0


def _all_points_ap(recall, precision):
    recall = np.r_[0.0, recall, 1.0]
    precision = np.r_[0.0, precision, 0.0]
    precision = np.maximum.accumulate(precision[::-1])[::-1]
    changes = np.flatnonzero(recall[1:] != recall[:-1])
    # Integrate the right-to-left precision envelope at every recall change.
    return float(np.sum((recall[changes + 1] - recall[changes]) * precision[changes + 1]))


def detection_average_precision(predictions, ground_truth, iou_threshold=0.5):
    if not 0 <= iou_threshold <= 1:
        raise ValueError("IoU threshold must lie in [0,1]")
    classes = sorted({item["class_id"] for item in predictions + ground_truth})
    per_class = {}
    for category in classes:
        gt = [item for item in ground_truth if item["class_id"] == category]
        pred = [item for item in predictions if item["class_id"] == category]
        positives = sum(
            not item.get("ignore", False) and not item.get("crowd", False)
            for item in gt
        )
        # Stable score order makes equal-confidence matching reproducible.
        pred = sorted(enumerate(pred), key=lambda pair: (-pair[1]["score"], pair[0]))
        used_non_crowd = set()
        tp, fp = [], []
        for _, detection in pred:
            candidates = [
                (index, item, _overlap(
                    np.asarray(detection["box"], float),
                    np.asarray(item["box"], float),
                    crowd=item.get("crowd", False)
                ))
                for index, item in enumerate(gt)
                if item["image_id"] == detection["image_id"]
            ]
            ordinary = sorted(
                (item for item in candidates
                 if not item[1].get("ignore", False)
                 and not item[1].get("crowd", False)
                 and item[0] not in used_non_crowd),
                key=lambda item: (-item[2], item[0])
            )
            ignored = sorted(
                (item for item in candidates
                 if item[1].get("ignore", False)
                 and not item[1].get("crowd", False)
                 and item[0] not in used_non_crowd),
                key=lambda item: (-item[2], item[0])
            )
            if ordinary and ordinary[0][2] >= iou_threshold:
                used_non_crowd.add(ordinary[0][0])
                tp.append(1); fp.append(0)
            elif ignored and ignored[0][2] >= iou_threshold:
                # An ignored non-crowd target can neutralize one detection only.
                used_non_crowd.add(ignored[0][0])
                continue
            elif any(score >= iou_threshold and item.get("crowd", False)
                     for _, item, score in candidates):
                continue  # A crowd region may neutralize multiple detections.
            else:
                tp.append(0); fp.append(1)
        tp, fp = np.cumsum(tp), np.cumsum(fp)
        recall = tp / positives if positives else np.zeros_like(tp, dtype=float)
        precision = tp / np.maximum(tp + fp, 1)
        per_class[category] = _all_points_ap(recall, precision) if positives else None
    valid = [value for value in per_class.values() if value is not None]
    return {"per_class_ap": per_class, "mean_ap": float(np.mean(valid)) if valid else None}`,
      walkthrough: [
        "Partition evaluation by class while matching only within the same image.",
        "Process predictions by stable confidence order and reserve each ordinary target once.",
        "Handle ignored targets once and crowd regions repeatedly with prediction-area overlap, then integrate the precision envelope."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <map>
#include <numeric>
#include <optional>
#include <set>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>
#include <Eigen/Dense>

struct GroundTruth {
  std::string image_id;
  int class_id;
  Eigen::Vector4d box;
  bool ignore{false};
  bool crowd{false};
};
struct Prediction {
  std::string image_id;
  int class_id;
  Eigen::Vector4d box;
  double score;
};
struct ApReport {
  std::map<int, std::optional<double>> per_class;
  std::optional<double> mean_ap;
};

double detectionOverlap(const Eigen::Vector4d& prediction,
                        const Eigen::Vector4d& truth,
                        bool crowd = false) {
  const double w = std::max(
      0.0, std::min(prediction.z(), truth.z()) -
               std::max(prediction.x(), truth.x()));
  const double h = std::max(
      0.0, std::min(prediction.w(), truth.w()) -
               std::max(prediction.y(), truth.y()));
  const double intersection = w * h;
  const double prediction_area =
      std::max(0.0, prediction.z() - prediction.x()) *
      std::max(0.0, prediction.w() - prediction.y());
  if (crowd) {
    // Crowd overlap uses IoA and may neutralize more than one prediction.
    return prediction_area > 0 ? intersection / prediction_area : 0.0;
  }
  const double truth_area =
      std::max(0.0, truth.z() - truth.x()) *
      std::max(0.0, truth.w() - truth.y());
  const double union_area = prediction_area + truth_area - intersection;
  return union_area > 0 ? intersection / union_area : 0.0;
}

double allPointsAp(const std::vector<double>& recall_input,
                   const std::vector<double>& precision_input) {
  std::vector<double> recall{0.0}, precision{0.0};
  recall.insert(recall.end(), recall_input.begin(), recall_input.end());
  precision.insert(precision.end(), precision_input.begin(), precision_input.end());
  recall.push_back(1.0); precision.push_back(0.0);
  for (int i = static_cast<int>(precision.size()) - 2; i >= 0; --i)
    precision[i] = std::max(precision[i], precision[i + 1]);
  double area = 0.0;
  for (int i = 0; i + 1 < static_cast<int>(recall.size()); ++i)
    if (recall[i + 1] != recall[i])
      area += (recall[i + 1] - recall[i]) * precision[i + 1];
  return area;  // Integral of the monotone precision envelope.
}

ApReport detectionAveragePrecision(
    const std::vector<Prediction>& predictions,
    const std::vector<GroundTruth>& ground_truth,
    double threshold = 0.5) {
  if (threshold < 0 || threshold > 1)
    throw std::invalid_argument("IoU threshold must lie in [0,1]");
  std::set<int> classes;
  for (const auto& item : predictions) classes.insert(item.class_id);
  for (const auto& item : ground_truth) classes.insert(item.class_id);
  ApReport report;
  std::vector<double> valid_aps;

  for (int category : classes) {
    std::vector<int> pred_indices;
    int positives = 0;
    for (int i = 0; i < static_cast<int>(predictions.size()); ++i)
      if (predictions[i].class_id == category) pred_indices.push_back(i);
    for (const auto& item : ground_truth)
      if (item.class_id == category && !item.ignore && !item.crowd) ++positives;
    std::stable_sort(pred_indices.begin(), pred_indices.end(), [&](int a, int b) {
      return predictions[a].score > predictions[b].score;
    });
    std::set<int> used_non_crowd;
    std::vector<int> tp, fp;
    for (int pred_index : pred_indices) {
      const auto& prediction = predictions[pred_index];
      int best = -1, best_ignored = -1;
      double best_overlap = -1.0, best_ignored_overlap = -1.0;
      bool crowd_overlap = false;
      for (int i = 0; i < static_cast<int>(ground_truth.size()); ++i) {
        const auto& truth = ground_truth[i];
        if (truth.class_id != category || truth.image_id != prediction.image_id) continue;
        const double overlap =
            detectionOverlap(prediction.box, truth.box, truth.crowd);
        if (truth.crowd) {
          if (overlap >= threshold) crowd_overlap = true;
        } else if (truth.ignore && !used_non_crowd.count(i) &&
                   overlap > best_ignored_overlap) {
          best_ignored = i;
          best_ignored_overlap = overlap;
        } else if (!truth.ignore && !used_non_crowd.count(i) &&
                   overlap > best_overlap) {
          best = i;
          best_overlap = overlap;
        }
      }
      if (best >= 0 && best_overlap >= threshold) {
        used_non_crowd.insert(best); tp.push_back(1); fp.push_back(0);
      } else if (best_ignored >= 0 && best_ignored_overlap >= threshold) {
        // Unlike crowds, an ignored ordinary target can absorb only one detection.
        used_non_crowd.insert(best_ignored);
      } else if (!crowd_overlap) {
        // Duplicate detections become false positives after the target is reserved.
        tp.push_back(0); fp.push_back(1);
      }
    }
    int cumulative_tp = 0, cumulative_fp = 0;
    std::vector<double> recall, precision;
    for (int i = 0; i < static_cast<int>(tp.size()); ++i) {
      cumulative_tp += tp[i]; cumulative_fp += fp[i];
      recall.push_back(positives ? double(cumulative_tp) / positives : 0.0);
      precision.push_back(double(cumulative_tp) /
                          std::max(cumulative_tp + cumulative_fp, 1));
    }
    if (!positives) report.per_class[category] = std::nullopt;
    else {
      const double ap = allPointsAp(recall, precision);
      report.per_class[category] = ap; valid_aps.push_back(ap);
    }
  }
  if (!valid_aps.empty())
    report.mean_ap = std::accumulate(valid_aps.begin(), valid_aps.end(), 0.0) /
                     valid_aps.size();
  return report;
}`,
      walkthrough: [
        "Stable-sort scored detections independently for each category.",
        "Choose the strongest available same-image target and preserve one-to-one ownership.",
        "Treat ignored non-crowd targets as one-use and crowd regions as reusable IoA absorbers before integrating precision–recall."
      ]
    }
  },
  {
    id: "trk-kalman",
    python: {
      code: `import numpy as np


class ConstantVelocityKalman:
    def __init__(self, position, velocity=(0, 0),
                 position_variance=100.0, velocity_variance=100.0):
        self.state = np.r_[np.asarray(position, float), np.asarray(velocity, float)]
        if self.state.shape != (4,) or not np.isfinite(self.state).all():
            raise ValueError("position and velocity must be finite 2-vectors")
        if min(position_variance, velocity_variance) < 0:
            raise ValueError("variances must be nonnegative")
        self.covariance = np.diag(
            [position_variance] * 2 + [velocity_variance] * 2
        )

    def predict(self, dt, acceleration_variance):
        if not np.isfinite(dt) or dt <= 0 or acceleration_variance < 0:
            raise ValueError("positive dt and nonnegative process variance required")
        transition = np.array([
            [1, 0, dt, 0], [0, 1, 0, dt],
            [0, 0, 1, 0], [0, 0, 0, 1]
        ], dtype=float)
        noise_map = np.array([
            [0.5*dt*dt, 0], [0, 0.5*dt*dt], [dt, 0], [0, dt]
        ])
        # White acceleration enters position and velocity through the same noise map.
        process_noise = acceleration_variance * noise_map @ noise_map.T
        self.state = transition @ self.state
        self.covariance = transition @ self.covariance @ transition.T + process_noise
        return self.state.copy()

    def innovation(self, measurement, measurement_variance):
        measurement = np.asarray(measurement, float)
        if measurement.shape != (2,) or measurement_variance <= 0:
            raise ValueError("measurement must be length 2 with positive variance")
        observation = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=float)
        residual = measurement - observation @ self.state
        covariance = observation @ self.covariance @ observation.T + measurement_variance*np.eye(2)
        return residual, covariance, observation

    def update(self, measurement, measurement_variance):
        residual, innovation_covariance, observation = self.innovation(
            measurement, measurement_variance
        )
        gain = np.linalg.solve(
            innovation_covariance, observation @ self.covariance
        ).T  # Solve instead of forming the inverse of S.
        self.state += gain @ residual
        residual_map = np.eye(4) - gain @ observation
        measurement_noise = measurement_variance * np.eye(2)
        self.covariance = (residual_map @ self.covariance @ residual_map.T +
                           gain @ measurement_noise @ gain.T)  # Joseph form preserves PSD.
        self.covariance = 0.5 * (self.covariance + self.covariance.T)
        return self.state.copy()

    def squared_mahalanobis(self, measurement, measurement_variance):
        residual, covariance, _ = self.innovation(measurement, measurement_variance)
        return float(residual @ np.linalg.solve(covariance, residual))`,
      walkthrough: [
        "Propagate state and covariance with variable-time constant-velocity dynamics.",
        "Construct process noise from a shared white-acceleration input.",
        "Correct with linear solves and Joseph covariance form; expose innovation distance for gating."
      ]
    },
    cpp: {
      code: `#include <cmath>
#include <stdexcept>
#include <utility>
#include <Eigen/Dense>

class ConstantVelocityKalman {
 public:
  ConstantVelocityKalman(
      const Eigen::Vector2d& position,
      const Eigen::Vector2d& velocity = Eigen::Vector2d::Zero(),
      double position_variance = 100.0,
      double velocity_variance = 100.0) {
    if (!position.allFinite() || !velocity.allFinite() ||
        position_variance < 0 || velocity_variance < 0)
      throw std::invalid_argument("invalid initial state or variance");
    state_ << position, velocity;
    covariance_ = Eigen::Vector4d(position_variance, position_variance,
                                  velocity_variance, velocity_variance).asDiagonal();
  }

  Eigen::Vector4d predict(double dt, double acceleration_variance) {
    if (!std::isfinite(dt) || dt <= 0 || acceleration_variance < 0)
      throw std::invalid_argument("invalid dt or process variance");
    Eigen::Matrix4d transition;
    transition << 1, 0, dt, 0, 0, 1, 0, dt,
                  0, 0, 1, 0, 0, 0, 0, 1;
    Eigen::Matrix<double, 4, 2> noise_map;
    noise_map << 0.5*dt*dt, 0, 0, 0.5*dt*dt, dt, 0, 0, dt;
    // A single white-acceleration source induces correlated position/velocity noise.
    const Eigen::Matrix4d process_noise =
        acceleration_variance * noise_map * noise_map.transpose();
    state_ = transition * state_;
    covariance_ = transition * covariance_ * transition.transpose() + process_noise;
    return state_;
  }

  Eigen::Vector4d update(const Eigen::Vector2d& measurement,
                         double measurement_variance) {
    const auto [residual, innovation] =
        innovation(measurement, measurement_variance);
    Eigen::Matrix<double, 2, 4> observation;
    observation << 1, 0, 0, 0, 0, 1, 0, 0;
    const Eigen::Matrix<double, 4, 2> gain =
        innovation.ldlt().solve(observation * covariance_).transpose();
    state_ += gain * residual;
    const Eigen::Matrix4d residual_map =
        Eigen::Matrix4d::Identity() - gain * observation;
    // Joseph form is more robust to floating-point loss of covariance PSD.
    covariance_ = residual_map * covariance_ * residual_map.transpose() +
                  gain * (measurement_variance * Eigen::Matrix2d::Identity()) *
                  gain.transpose();
    covariance_ = 0.5 * (covariance_ + covariance_.transpose());
    return state_;
  }

  double squaredMahalanobis(const Eigen::Vector2d& measurement,
                            double measurement_variance) const {
    const auto [residual, covariance] =
        innovation(measurement, measurement_variance);
    return residual.dot(covariance.ldlt().solve(residual));
  }

 private:
  std::pair<Eigen::Vector2d, Eigen::Matrix2d> innovation(
      const Eigen::Vector2d& measurement, double variance) const {
    if (!measurement.allFinite() || variance <= 0)
      throw std::invalid_argument("invalid measurement or variance");
    Eigen::Matrix<double, 2, 4> observation;
    observation << 1, 0, 0, 0, 0, 1, 0, 0;
    return {measurement - observation * state_,
            observation * covariance_ * observation.transpose() +
            variance * Eigen::Matrix2d::Identity()};
  }

  Eigen::Vector4d state_;
  Eigen::Matrix4d covariance_;
};`,
      walkthrough: [
        "Propagate a four-state position/velocity model for arbitrary positive time steps.",
        "Map acceleration noise into both position and velocity covariance.",
        "Use stable LDLT solves and Joseph correction, then expose Mahalanobis gating."
      ]
    }
  },
  {
    id: "trk-assignment",
    python: {
      code: `import numpy as np
from scipy.optimize import linear_sum_assignment  # SciPy supplies the O(n^3) solver.


def gated_assignment(motion_cost, motion_gate, appearance_cost=None,
                     appearance_gate=None, appearance_weight=0.0,
                     unmatched_cost=1e3):
    motion = np.asarray(motion_cost, dtype=np.float64)
    gate = np.asarray(motion_gate, dtype=bool)
    if motion.ndim != 2 or gate.shape != motion.shape or not np.isfinite(motion).all():
        raise ValueError("motion cost/gate must be matching finite matrices")
    if unmatched_cost <= 0 or not 0 <= appearance_weight <= 1:
        raise ValueError("invalid unmatched cost or appearance weight")
    valid = gate.copy()
    cost = motion.copy()
    if appearance_cost is not None:
        appearance = np.asarray(appearance_cost, dtype=np.float64)
        if appearance.shape != motion.shape or not np.isfinite(appearance).all():
            raise ValueError("appearance cost must match motion cost")
        if appearance_gate is not None:
            valid &= np.asarray(appearance_gate, dtype=bool)
        cost = (1 - appearance_weight) * motion + appearance_weight * appearance

    tracks, detections = cost.shape
    if tracks == 0:
        return [], [], list(range(detections))
    # Each track owns a finite dummy column, so all-gated rows remain feasible.
    augmented = np.full((tracks, detections + tracks), np.inf)
    augmented[:, :detections] = np.where(valid, cost, np.inf)
    augmented[np.arange(tracks), detections + np.arange(tracks)] = unmatched_cost
    rows, columns = linear_sum_assignment(augmented)
    matches = [(int(r), int(c)) for r, c in zip(rows, columns)
               if c < detections and valid[r, c]]
    matched_tracks = {r for r, _ in matches}
    matched_detections = {c for _, c in matches}
    return (matches,
            sorted(set(range(tracks)) - matched_tracks),
            sorted(set(range(detections)) - matched_detections))`,
      walkthrough: [
        "Construct motion/appearance cost separately from the Boolean validity gate.",
        "Give every track its own finite unmatched option instead of using a dangerously large invalid cost.",
        "Solve one-to-one assignment and return explicit unmatched sets."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <tuple>
#include <utility>
#include <vector>
#include <Eigen/Dense>

struct AssignmentResult {
  std::vector<std::pair<int, int>> matches;
  std::vector<int> unmatched_tracks;
  std::vector<int> unmatched_detections;
};

std::vector<int> hungarianRowsToColumns(const Eigen::MatrixXd& cost) {
  const int rows = cost.rows(), columns = cost.cols();
  if (rows > columns) throw std::invalid_argument("Hungarian input needs rows<=cols");
  std::vector<double> u(rows + 1), v(columns + 1);
  std::vector<int> p(columns + 1), way(columns + 1);
  for (int i = 1; i <= rows; ++i) {
    p[0] = i;
    int column0 = 0;
    std::vector<double> minimum(columns + 1,
                                std::numeric_limits<double>::infinity());
    std::vector<bool> used(columns + 1, false);
    do {
      used[column0] = true;
      const int row0 = p[column0];
      double delta = std::numeric_limits<double>::infinity();
      int column1 = 0;
      for (int column = 1; column <= columns; ++column) if (!used[column]) {
        const double current = cost(row0 - 1, column - 1) - u[row0] - v[column];
        if (current < minimum[column]) {
          minimum[column] = current; way[column] = column0;
        }
        if (minimum[column] < delta) {
          delta = minimum[column]; column1 = column;
        }
      }
      for (int column = 0; column <= columns; ++column) {
        if (used[column]) { u[p[column]] += delta; v[column] -= delta; }
        else minimum[column] -= delta;
      }
      column0 = column1;
    } while (p[column0] != 0);
    do {
      const int previous = way[column0];
      p[column0] = p[previous]; column0 = previous;
    } while (column0 != 0);
  }
  std::vector<int> assignment(rows, -1);
  for (int column = 1; column <= columns; ++column)
    if (p[column]) assignment[p[column] - 1] = column - 1;
  return assignment;  // Deterministic O(n^3) row-to-column optimum.
}

AssignmentResult gatedAssignment(
    const Eigen::MatrixXd& motion,
    const Eigen::ArrayXX<bool>& motion_gate,
    const Eigen::MatrixXd* appearance = nullptr,
    const Eigen::ArrayXX<bool>* appearance_gate = nullptr,
    double appearance_weight = 0.0, double unmatched_cost = 1e3) {
  if (motion_gate.rows() != motion.rows() || motion_gate.cols() != motion.cols() ||
      !motion.allFinite() || appearance_weight < 0 || appearance_weight > 1 ||
      unmatched_cost <= 0) {
    throw std::invalid_argument("invalid assignment inputs");
  }
  Eigen::MatrixXd combined = motion;
  Eigen::ArrayXX<bool> valid = motion_gate;
  if (appearance) {
    if (appearance->rows() != motion.rows() || appearance->cols() != motion.cols() ||
        !appearance->allFinite()) throw std::invalid_argument("bad appearance cost");
    combined = (1 - appearance_weight) * motion + appearance_weight * *appearance;
    if (appearance_gate) valid = valid && *appearance_gate;
  }
  const int tracks = motion.rows(), detections = motion.cols();
  if (!tracks) {
    AssignmentResult result;
    for (int d = 0; d < detections; ++d) result.unmatched_detections.push_back(d);
    return result;
  }
  const double invalid = 1e12;
  Eigen::MatrixXd augmented =
      Eigen::MatrixXd::Constant(tracks, detections + tracks, invalid);
  for (int t = 0; t < tracks; ++t) {
    for (int d = 0; d < detections; ++d)
      if (valid(t, d)) augmented(t, d) = combined(t, d);
    // A private dummy keeps an all-gated track feasible without accepting invalid data.
    augmented(t, detections + t) = unmatched_cost;
  }
  const std::vector<int> assignment = hungarianRowsToColumns(augmented);
  AssignmentResult result;
  std::vector<bool> detection_used(detections, false);
  for (int t = 0; t < tracks; ++t) {
    const int d = assignment[t];
    if (d >= 0 && d < detections && valid(t, d)) {
      result.matches.push_back({t, d}); detection_used[d] = true;
    } else result.unmatched_tracks.push_back(t);
  }
  for (int d = 0; d < detections; ++d)
    if (!detection_used[d]) result.unmatched_detections.push_back(d);
  return result;
}`,
      walkthrough: [
        "Keep gating Boolean and cost numerical so invalid pairs cannot appear cheap.",
        "Augment the rectangular matrix with one unmatched column per track.",
        "Run a deterministic Hungarian solve and reconstruct matched and unmatched outputs."
      ]
    }
  },
  {
    id: "trk-manager",
    python: {
      code: `from dataclasses import dataclass
from enum import Enum
import numpy as np


class TrackState(Enum):
    TENTATIVE = "tentative"
    CONFIRMED = "confirmed"
    DELETED = "deleted"


@dataclass
class Track:
    track_id: int
    state: TrackState
    position: np.ndarray
    velocity: np.ndarray
    hits: int = 1
    misses: int = 0
    age: int = 1


class TrackManager:
    def __init__(self, minimum_hits=3, maximum_misses=5):
        if minimum_hits < 1 or maximum_misses < 0:
            raise ValueError("invalid lifecycle thresholds")
        self.minimum_hits = minimum_hits
        self.maximum_misses = maximum_misses
        self.next_id = 1  # Monotone allocation guarantees active IDs are never reused.
        self.tracks = {}

    def step(self, detections_xy, matches_by_track_id, dt):
        detections = np.asarray(detections_xy, dtype=float)
        if detections.ndim != 2 or detections.shape[1] != 2 or dt <= 0:
            raise ValueError("detections must be N×2 and dt must be positive")
        previous = {}
        for track in self.tracks.values():
            previous[track.track_id] = track.position.copy()
            track.position = track.position + dt * track.velocity
            track.age += 1

        used_detections = set()
        for track_id, detection_index in matches_by_track_id.items():
            if track_id not in self.tracks or not 0 <= detection_index < len(detections):
                raise ValueError("match references an unknown track or detection")
            if detection_index in used_detections:
                raise ValueError("one detection cannot update two tracks")
            track = self.tracks[track_id]
            measurement = detections[detection_index]
            # Velocity uses the last measured position over the declared time interval.
            track.velocity = (measurement - previous[track_id]) / dt
            track.position = measurement.copy()
            track.hits += 1
            track.misses = 0
            if track.hits >= self.minimum_hits:
                track.state = TrackState.CONFIRMED
            used_detections.add(detection_index)

        for track_id, track in list(self.tracks.items()):
            if track_id not in matches_by_track_id:
                track.misses += 1
                if track.misses > self.maximum_misses:
                    track.state = TrackState.DELETED
                    del self.tracks[track_id]

        for index, detection in enumerate(detections):
            if index in used_detections:
                continue
            state = TrackState.CONFIRMED if self.minimum_hits == 1 else TrackState.TENTATIVE
            self.tracks[self.next_id] = Track(
                self.next_id, state, detection.copy(), np.zeros(2)
            )
            self.next_id += 1

        # Published state is intentionally stricter than internal predicted state.
        return [track for track in self.tracks.values()
                if track.state is TrackState.CONFIRMED and track.misses == 0]`,
      walkthrough: [
        "Predict every internal track with variable time before applying associations.",
        "Promote by hit evidence and delete only after the configured miss budget.",
        "Allocate IDs monotonically and publish only currently observed confirmed tracks."
      ]
    },
    cpp: {
      code: `#include <map>
#include <set>
#include <stdexcept>
#include <utility>
#include <vector>
#include <Eigen/Dense>

enum class TrackState { Tentative, Confirmed, Deleted };
struct Track {
  int id;
  TrackState state;
  Eigen::Vector2d position;
  Eigen::Vector2d velocity{Eigen::Vector2d::Zero()};
  int hits{1}, misses{0}, age{1};
};

class TrackManager {
 public:
  TrackManager(int minimum_hits = 3, int maximum_misses = 5)
      : minimum_hits_(minimum_hits), maximum_misses_(maximum_misses) {
    if (minimum_hits < 1 || maximum_misses < 0)
      throw std::invalid_argument("invalid lifecycle thresholds");
  }

  std::vector<Track> step(
      const std::vector<Eigen::Vector2d>& detections,
      const std::map<int, int>& matches_by_track_id,
      double dt) {
    if (dt <= 0) throw std::invalid_argument("dt must be positive");
    std::map<int, Eigen::Vector2d> previous;
    for (auto& [id, track] : tracks_) {
      previous[id] = track.position;
      track.position += dt * track.velocity;
      ++track.age;
    }
    std::set<int> used_detections;
    for (const auto& [id, detection_index] : matches_by_track_id) {
      if (!tracks_.count(id) || detection_index < 0 ||
          detection_index >= static_cast<int>(detections.size()) ||
          used_detections.count(detection_index))
        throw std::invalid_argument("invalid one-to-one match");
      Track& track = tracks_.at(id);
      // Update velocity from the previous measured position and explicit dt.
      track.velocity = (detections[detection_index] - previous[id]) / dt;
      track.position = detections[detection_index];
      ++track.hits; track.misses = 0;
      if (track.hits >= minimum_hits_) track.state = TrackState::Confirmed;
      used_detections.insert(detection_index);
    }
    for (auto iterator = tracks_.begin(); iterator != tracks_.end();) {
      Track& track = iterator->second;
      if (!matches_by_track_id.count(track.id) &&
          ++track.misses > maximum_misses_) {
        track.state = TrackState::Deleted;
        iterator = tracks_.erase(iterator);
      } else ++iterator;
    }
    for (int index = 0; index < static_cast<int>(detections.size()); ++index) {
      if (used_detections.count(index)) continue;
      const TrackState state =
          minimum_hits_ == 1 ? TrackState::Confirmed : TrackState::Tentative;
      // next_id_ only increases, so a live or deleted identity is never recycled.
      tracks_.emplace(next_id_, Track{next_id_, state, detections[index]});
      ++next_id_;
    }
    std::vector<Track> published;
    for (const auto& [id, track] : tracks_)
      if (track.state == TrackState::Confirmed && track.misses == 0)
        published.push_back(track);
    return published;
  }

 private:
  int minimum_hits_, maximum_misses_, next_id_{1};
  std::map<int, Track> tracks_;
};`,
      walkthrough: [
        "Predict internal state, then apply externally computed one-to-one matches.",
        "Use configurable hit/miss thresholds for tentative, confirmed, and deleted transitions.",
        "Keep monotone identity allocation and a stricter published-state policy."
      ]
    }
  },
  {
    id: "trk-metrics",
    python: {
      code: `from collections import defaultdict


def tracking_failure_report(frames):
    totals = defaultdict(int)
    slices = defaultdict(lambda: defaultdict(int))
    previous_prediction = {}
    seen_matched = set()
    matched_last_frame = defaultdict(bool)

    for frame in frames:
        sequence = frame["sequence_id"]
        ground_truth = frame["ground_truth"]
        predictions = frame["predictions"]
        matches = frame["matches"]  # Prevalidated one-to-one (gt_index, prediction_index).
        matched_gt, matched_pred = set(), set()
        for gt_index, pred_index in matches:
            if not (0 <= gt_index < len(ground_truth)):
                raise ValueError("ground-truth match index is out of range")
            if not (0 <= pred_index < len(predictions)):
                raise ValueError("prediction match index is out of range")
            if gt_index in matched_gt or pred_index in matched_pred:
                raise ValueError("matches must be one-to-one")
            gt, pred = ground_truth[gt_index], predictions[pred_index]
            key = (sequence, gt["track_id"])
            category = gt.get("slice", "all")
            totals["tp"] += 1
            slices[category]["tp"] += 1
            if key in previous_prediction and previous_prediction[key] != pred["track_id"]:
                totals["id_switches"] += 1
                slices[category]["id_switches"] += 1
            if key in seen_matched and not matched_last_frame[key]:
                totals["fragments"] += 1
                slices[category]["fragments"] += 1
            previous_prediction[key] = pred["track_id"]
            seen_matched.add(key)
            matched_last_frame[key] = True
            matched_gt.add(gt_index); matched_pred.add(pred_index)

        for index, gt in enumerate(ground_truth):
            category = gt.get("slice", "all")
            totals["gt"] += 1
            slices[category]["gt"] += 1
            if index not in matched_gt:
                totals["fn"] += 1
                slices[category]["fn"] += 1
                matched_last_frame[(sequence, gt["track_id"])] = False
        for index, pred in enumerate(predictions):
            if index not in matched_pred:
                totals["fp"] += 1
                slices[pred.get("slice", "all")]["fp"] += 1

    def summarize(counts):
        tp, fp, fn, gt = counts["tp"], counts["fp"], counts["fn"], counts["gt"]
        # Counts accompany rates so a tiny slice cannot look as reliable as a large one.
        return {
            **dict(counts),
            "precision": tp / (tp + fp) if tp + fp else 0.0,
            "recall": tp / (tp + fn) if tp + fn else 0.0,
            "mota": 1 - (fn + fp + counts["id_switches"]) / gt if gt else None
        }

    # Sequence is part of every identity key, preventing switches across boundaries.
    return {
        "overall": summarize(totals),
        "by_slice": {name: summarize(counts) for name, counts in sorted(slices.items())}
    }`,
      walkthrough: [
        "Consume prevalidated frame-level matches while preserving sequence boundaries.",
        "Count detection errors, identity changes, and rematch fragmentation separately.",
        "Report counts and rates overall and by an explicit failure-slice label."
      ]
    },
    cpp: {
      code: `#include <map>
#include <optional>
#include <set>
#include <stdexcept>
#include <string>
#include <tuple>
#include <utility>
#include <vector>

struct TrackObject { int track_id; std::string slice{"all"}; };
struct TrackingFrame {
  std::string sequence_id;
  std::vector<TrackObject> ground_truth;
  std::vector<TrackObject> predictions;
  std::vector<std::pair<int, int>> matches;
};
struct MetricCounts {
  int tp{0}, fp{0}, fn{0}, gt{0}, id_switches{0}, fragments{0};
};
struct MetricSummary {
  MetricCounts counts;
  double precision{0}, recall{0};
  std::optional<double> mota;
};
struct TrackingReport {
  MetricSummary overall;
  std::map<std::string, MetricSummary> by_slice;
};

MetricSummary summarizeTracking(const MetricCounts& counts) {
  MetricSummary summary{counts};
  if (counts.tp + counts.fp)
    summary.precision = double(counts.tp) / (counts.tp + counts.fp);
  if (counts.tp + counts.fn)
    summary.recall = double(counts.tp) / (counts.tp + counts.fn);
  if (counts.gt)
    summary.mota = 1.0 - double(counts.fn + counts.fp + counts.id_switches) /
                           counts.gt;
  return summary;  // Keep raw support beside every rate.
}

TrackingReport trackingFailureReport(const std::vector<TrackingFrame>& frames) {
  using Identity = std::pair<std::string, int>;
  std::map<Identity, int> previous_prediction;
  std::set<Identity> seen_matched;
  std::map<Identity, bool> matched_last_frame;
  MetricCounts total;
  std::map<std::string, MetricCounts> sliced;

  for (const auto& frame : frames) {
    std::set<int> matched_gt, matched_prediction;
    for (const auto& [gt_index, prediction_index] : frame.matches) {
      if (gt_index < 0 || gt_index >= static_cast<int>(frame.ground_truth.size()) ||
          prediction_index < 0 ||
          prediction_index >= static_cast<int>(frame.predictions.size()) ||
          !matched_gt.insert(gt_index).second ||
          !matched_prediction.insert(prediction_index).second)
        throw std::invalid_argument("matches must be valid and one-to-one");
      const auto& gt = frame.ground_truth[gt_index];
      const auto& prediction = frame.predictions[prediction_index];
      const Identity identity{frame.sequence_id, gt.track_id};
      ++total.tp; ++sliced[gt.slice].tp;
      if (previous_prediction.count(identity) &&
          previous_prediction[identity] != prediction.track_id) {
        ++total.id_switches; ++sliced[gt.slice].id_switches;
      }
      if (seen_matched.count(identity) && !matched_last_frame[identity]) {
        ++total.fragments; ++sliced[gt.slice].fragments;
      }
      previous_prediction[identity] = prediction.track_id;
      seen_matched.insert(identity);
      matched_last_frame[identity] = true;
    }
    for (int i = 0; i < static_cast<int>(frame.ground_truth.size()); ++i) {
      const auto& gt = frame.ground_truth[i];
      ++total.gt; ++sliced[gt.slice].gt;
      if (!matched_gt.count(i)) {
        ++total.fn; ++sliced[gt.slice].fn;
        matched_last_frame[{frame.sequence_id, gt.track_id}] = false;
      }
    }
    for (int i = 0; i < static_cast<int>(frame.predictions.size()); ++i) {
      if (!matched_prediction.count(i)) {
        ++total.fp; ++sliced[frame.predictions[i].slice].fp;
      }
    }
  }
  // Sequence-prefixed identity keys prevent false switches at sequence boundaries.
  TrackingReport report{summarizeTracking(total), {}};
  for (const auto& [name, counts] : sliced)
    report.by_slice[name] = summarizeTracking(counts);
  return report;
}`,
      walkthrough: [
        "Validate one-to-one matches and scope every ground-truth identity by sequence.",
        "Separate false detections, misses, identity switches, and fragmentation events.",
        "Summarize support and rates for the aggregate and every supplied failure slice."
      ]
    }
  }
);

window.CV_CODING_SOLUTIONS.push(
  {
    id: "geo-transform",
    python: {
      code: `from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class RigidTransform:
    rotation: np.ndarray
    translation: np.ndarray
    destination: str
    source: str
    unit: str = "m"
    timestamp: float = 0.0
    calibration_version: str = "unknown"

    def __post_init__(self):
        r = np.asarray(self.rotation, dtype=np.float64)
        t = np.asarray(self.translation, dtype=np.float64)
        if r.shape != (3, 3) or t.shape != (3,) or not np.isfinite(r).all() or not np.isfinite(t).all():
            raise ValueError("rotation must be 3×3 and translation must be length 3")
        # A rigid rotation must preserve lengths and orientation.
        if not np.allclose(r.T @ r, np.eye(3), atol=1e-7) or not np.isclose(np.linalg.det(r), 1.0, atol=1e-7):
            raise ValueError("rotation is not a proper orthonormal matrix")
        if not self.destination or not self.source or not self.unit:
            raise ValueError("frames and unit must be named")
        object.__setattr__(self, "rotation", r.copy())
        object.__setattr__(self, "translation", t.copy())

    def apply(self, points):
        points = np.asarray(points, dtype=np.float64)
        if points.shape[-1:] != (3,) or not np.isfinite(points).all():
            raise ValueError("points must end in a finite xyz dimension")
        return points @ self.rotation.T + self.translation

    def inverse(self):
        r_inv = self.rotation.T
        return RigidTransform(
            r_inv, -(r_inv @ self.translation),
            self.source, self.destination, self.unit,
            self.timestamp, self.calibration_version
        )

    def compose(self, earlier):
        if earlier.destination != self.source:
            raise ValueError("frame mismatch in transform composition")
        if (earlier.unit != self.unit or
                earlier.calibration_version != self.calibration_version or
                not np.isclose(earlier.timestamp, self.timestamp)):
            raise ValueError("unit, timestamp, or calibration version mismatch")
        # T_destination_source @ T_source_origin maps origin directly to destination.
        return RigidTransform(
            self.rotation @ earlier.rotation,
            self.rotation @ earlier.translation + self.translation,
            self.destination, earlier.source, self.unit,
            self.timestamp, self.calibration_version
        )`,
      walkthrough: [
        "Make frame direction, units, time, and calibration version part of the value.",
        "Reject matrices that cannot preserve rigid Euclidean geometry.",
        "Check metadata before applying the standard inverse or composition equations."
      ]
    },
    cpp: {
      code: `#include <cmath>
#include <stdexcept>
#include <string>
#include <vector>
#include <Eigen/Dense>

struct RigidTransform {
  Eigen::Matrix3d rotation;
  Eigen::Vector3d translation;
  std::string destination;
  std::string source;
  std::string unit{"m"};
  double timestamp{0.0};
  std::string calibration_version{"unknown"};

  void validate() const {
    if (destination.empty() || source.empty() || unit.empty() ||
        !rotation.allFinite() || !translation.allFinite()) {
      throw std::invalid_argument("finite values and named frames/units required");
    }
    // Proper rotations are orthonormal and have determinant +1, not -1.
    if (!rotation.transpose().isApprox(Eigen::Matrix3d::Identity(), 1e-7) ||
        std::abs(rotation.determinant() - 1.0) > 1e-7) {
      throw std::invalid_argument("rotation is not proper orthonormal");
    }
  }

  Eigen::Vector3d apply(const Eigen::Vector3d& point) const {
    validate();
    if (!point.allFinite()) throw std::invalid_argument("point must be finite");
    return rotation * point + translation;
  }

  RigidTransform inverse() const {
    validate();
    const Eigen::Matrix3d inverse_rotation = rotation.transpose();
    return {inverse_rotation, -inverse_rotation * translation,
            source, destination, unit, timestamp, calibration_version};
  }

  RigidTransform compose(const RigidTransform& earlier) const {
    validate();
    earlier.validate();
    if (earlier.destination != source || earlier.unit != unit ||
        earlier.calibration_version != calibration_version ||
        std::abs(earlier.timestamp - timestamp) > 1e-9) {
      throw std::invalid_argument("incompatible transform metadata");
    }
    // T_destination_source * T_source_origin preserves the labeled frame chain.
    return {rotation * earlier.rotation,
            rotation * earlier.translation + translation,
            destination, earlier.source, unit, timestamp, calibration_version};
  }
};`,
      walkthrough: [
        "Validate both numerical geometry and semantic metadata at API boundaries.",
        "Transpose the rotation and transform translation for the inverse.",
        "Compose only when the adjacent frame labels and versioned context agree."
      ]
    }
  },
  {
    id: "geo-dlt",
    python: {
      code: `import numpy as np


def _normalize_points(points):
    points = np.asarray(points, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 2 or len(points) < 4 or not np.isfinite(points).all():
        raise ValueError("at least four finite 2D points required")
    center = points.mean(axis=0)
    centered = points - center
    mean_distance = np.linalg.norm(centered, axis=1).mean()
    if mean_distance <= np.finfo(float).eps:
        raise ValueError("points have no spatial extent")
    # Hartley normalization makes the mean radius sqrt(2), improving conditioning.
    scale = np.sqrt(2.0) / mean_distance
    transform = np.array([
        [scale, 0.0, -scale * center[0]],
        [0.0, scale, -scale * center[1]],
        [0.0, 0.0, 1.0]
    ])
    homogeneous = np.c_[points, np.ones(len(points))]
    return (transform @ homogeneous.T).T[:, :2], transform


def normalized_dlt(source_xy, destination_xy):
    source, ts = _normalize_points(source_xy)
    destination, td = _normalize_points(destination_xy)
    if source.shape != destination.shape:
        raise ValueError("source and destination shapes must match")
    rows = []
    for (x, y), (u, v) in zip(source, destination):
        rows.extend(([-x, -y, -1, 0, 0, 0, u*x, u*y, u],
                     [0, 0, 0, -x, -y, -1, v*x, v*y, v]))
    design = np.asarray(rows, dtype=np.float64)
    if np.linalg.matrix_rank(design) < 8:
        raise ValueError("correspondences are degenerate")
    _, _, vh = np.linalg.svd(design)
    h_normalized = vh[-1].reshape(3, 3)
    # Denormalization reverses the destination transform on the left.
    homography = np.linalg.inv(td) @ h_normalized @ ts
    scale = homography[2, 2]
    if abs(scale) > np.finfo(float).eps:
        return homography / scale
    return homography / np.linalg.norm(homography)`,
      walkthrough: [
        "Center and scale each point set independently before building DLT equations.",
        "Solve the homogeneous system with the right singular vector of smallest singular value.",
        "Reject rank-deficient geometry and denormalize in the correct order."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <utility>
#include <vector>
#include <Eigen/Dense>

struct NormalizedPoints {
  std::vector<Eigen::Vector2d> points;
  Eigen::Matrix3d transform;
};

NormalizedPoints normalizePoints(const std::vector<Eigen::Vector2d>& points) {
  if (points.size() < 4) throw std::invalid_argument("four points required");
  Eigen::Vector2d center = Eigen::Vector2d::Zero();
  for (const auto& point : points) {
    if (!point.allFinite()) throw std::invalid_argument("points must be finite");
    center += point;
  }
  center /= static_cast<double>(points.size());
  double mean_distance = 0.0;
  for (const auto& point : points) mean_distance += (point - center).norm();
  mean_distance /= points.size();
  if (mean_distance <= Eigen::NumTraits<double>::epsilon()) {
    throw std::invalid_argument("points have no spatial extent");
  }
  // Hartley normalization balances coordinates before the SVD.
  const double scale = std::sqrt(2.0) / mean_distance;
  Eigen::Matrix3d transform;
  transform << scale, 0, -scale * center.x(),
               0, scale, -scale * center.y(),
               0, 0, 1;
  std::vector<Eigen::Vector2d> normalized;
  for (const auto& point : points) {
    const Eigen::Vector3d q = transform * point.homogeneous();
    normalized.push_back(q.hnormalized());
  }
  return {normalized, transform};
}

Eigen::Matrix3d normalizedDlt(
    const std::vector<Eigen::Vector2d>& source_input,
    const std::vector<Eigen::Vector2d>& destination_input) {
  if (source_input.size() != destination_input.size()) {
    throw std::invalid_argument("point counts must match");
  }
  const auto source = normalizePoints(source_input);
  const auto destination = normalizePoints(destination_input);
  Eigen::MatrixXd design(2 * source.points.size(), 9);
  for (int i = 0; i < static_cast<int>(source.points.size()); ++i) {
    const double x = source.points[i].x(), y = source.points[i].y();
    const double u = destination.points[i].x(), v = destination.points[i].y();
    design.row(2 * i) << -x, -y, -1, 0, 0, 0, u*x, u*y, u;
    design.row(2 * i + 1) << 0, 0, 0, -x, -y, -1, v*x, v*y, v;
  }
  Eigen::JacobiSVD<Eigen::MatrixXd> svd(design, Eigen::ComputeFullV);
  const double tolerance = svd.singularValues()(0) *
                           std::max(design.rows(), design.cols()) * 1e-12;
  if ((svd.singularValues().array() > tolerance).count() < 8) {
    throw std::invalid_argument("degenerate correspondences");
  }
  const Eigen::VectorXd h = svd.matrixV().col(8);
  Eigen::Matrix3d normalized;
  normalized << h(0), h(1), h(2), h(3), h(4), h(5), h(6), h(7), h(8);
  // Reverse destination normalization and retain source normalization.
  Eigen::Matrix3d homography =
      destination.transform.inverse() * normalized * source.transform;
  if (std::abs(homography(2, 2)) > 1e-12) homography /= homography(2, 2);
  else homography /= homography.norm();
  return homography;
}`,
      walkthrough: [
        "Normalize both coordinate systems to comparable scale.",
        "Construct two homogeneous equations per correspondence and inspect rank.",
        "Take the SVD null-space vector, reshape it, and reverse normalization."
      ]
    }
  },
  {
    id: "geo-ransac",
    python: {
      code: `import math
import numpy as np


def _line_from_pair(a, b):
    line = np.cross([a[0], a[1], 1.0], [b[0], b[1], 1.0])
    norm = np.linalg.norm(line[:2])
    if norm <= np.finfo(float).eps:
        raise ValueError("duplicate minimal sample")
    return line / norm


def adaptive_line_ransac(points, threshold, confidence=0.99,
                         max_iterations=5000, seed=0,
                         minimum_inliers=2, minimum_inlier_ratio=0.0):
    points = np.asarray(points, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 2 or len(points) < 2 or not np.isfinite(points).all():
        raise ValueError("at least two finite 2D points required")
    if threshold <= 0 or not 0 < confidence < 1 or max_iterations < 1:
        raise ValueError("invalid RANSAC controls")
    if (minimum_inliers < 2 or minimum_inliers > len(points)
            or not 0.0 <= minimum_inlier_ratio <= 1.0):
        raise ValueError("invalid minimum consensus support")
    required_inliers = max(
        minimum_inliers,
        int(math.ceil(minimum_inlier_ratio * len(points)))
    )
    rng = np.random.default_rng(seed)
    best_mask, best_cost = None, np.inf
    limit, iteration = max_iterations, 0
    homogeneous = np.c_[points, np.ones(len(points))]

    while iteration < limit:
        iteration += 1
        try:
            line = _line_from_pair(*points[rng.choice(len(points), 2, replace=False)])
        except ValueError:
            continue  # Degenerate samples do not vote for a model.
        residuals = np.abs(homogeneous @ line)
        mask = residuals <= threshold
        cost = residuals[mask].mean() if mask.any() else np.inf
        if best_mask is None or mask.sum() > best_mask.sum() or (
                mask.sum() == best_mask.sum() and cost < best_cost):
            best_mask, best_cost = mask, cost
            inlier_ratio = mask.mean()
            success = inlier_ratio ** 2
            # N = log(1-p)/log(1-w^s); clamp protects log(0) at perfect support.
            if success >= 1.0:
                limit = iteration
            elif success > 0:
                needed = math.ceil(math.log1p(-confidence) / math.log1p(-success))
                limit = min(limit, max(iteration, needed))

    if best_mask is None or best_mask.sum() < required_inliers:
        raise RuntimeError("line consensus is below the required support")
    inliers = points[best_mask]
    center = inliers.mean(axis=0)
    _, _, vh = np.linalg.svd(inliers - center)
    direction = vh[0]
    normal = np.array([-direction[1], direction[0]])
    # Refit from all consensus points instead of returning a noisy minimal model.
    refined = np.r_[normal, -normal @ center]
    return refined / np.linalg.norm(refined[:2]), best_mask, iteration`,
      walkthrough: [
        "Sample reproducibly and reject duplicate minimal pairs.",
        "Score thresholded orthogonal residuals, breaking support ties by residual quality.",
        "Reject consensus below a configured count or ratio, then refit supported inliers using PCA."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <limits>
#include <numeric>
#include <random>
#include <stdexcept>
#include <tuple>
#include <vector>
#include <Eigen/Dense>

struct LineRansacResult {
  Eigen::Vector3d line;
  std::vector<bool> inliers;
  int iterations;
};

LineRansacResult adaptiveLineRansac(
    const std::vector<Eigen::Vector2d>& points, double threshold,
    double confidence = 0.99, int max_iterations = 5000,
    unsigned int seed = 0, int minimum_inliers = 2,
    double minimum_inlier_ratio = 0.0) {
  if (points.size() < 2 || threshold <= 0 || confidence <= 0 ||
      confidence >= 1 || !std::isfinite(threshold) ||
      !std::isfinite(confidence) || max_iterations < 1 ||
      minimum_inliers < 2 ||
      minimum_inliers > static_cast<int>(points.size()) ||
      !std::isfinite(minimum_inlier_ratio) ||
      minimum_inlier_ratio < 0.0 || minimum_inlier_ratio > 1.0) {
    throw std::invalid_argument("invalid points or RANSAC controls");
  }
  for (const auto& point : points)
    if (!point.allFinite()) throw std::invalid_argument("points must be finite");

  std::mt19937 generator(seed);
  const int required_inliers = std::max(
      minimum_inliers,
      static_cast<int>(std::ceil(minimum_inlier_ratio * points.size())));
  std::uniform_int_distribution<int> sample(0, static_cast<int>(points.size()) - 1);
  std::vector<bool> best_mask;
  int best_count = 0, limit = max_iterations, iteration = 0;
  double best_cost = std::numeric_limits<double>::infinity();
  while (iteration < limit) {
    ++iteration;
    int a = sample(generator), b = sample(generator);
    if (a == b || (points[a] - points[b]).norm() <= 1e-12) continue;
    Eigen::Vector3d line =
        points[a].homogeneous().cross(points[b].homogeneous());
    line /= line.head<2>().norm();
    std::vector<bool> mask(points.size(), false);
    int count = 0;
    double cost = 0.0;
    for (int i = 0; i < static_cast<int>(points.size()); ++i) {
      const double residual = std::abs(line.dot(points[i].homogeneous()));
      if (residual <= threshold) {
        mask[i] = true; ++count; cost += residual;
      }
    }
    cost = count ? cost / count : std::numeric_limits<double>::infinity();
    if (count > best_count || (count == best_count && cost < best_cost)) {
      best_count = count; best_cost = cost; best_mask = mask;
      const double success = std::pow(double(count) / points.size(), 2);
      // Adaptive stopping follows N=log(1-p)/log(1-w^sample_size).
      if (success >= 1.0) limit = iteration;
      else if (success > 0) {
        const int needed = static_cast<int>(
            std::ceil(std::log1p(-confidence) / std::log1p(-success)));
        limit = std::min(limit, std::max(iteration, needed));
      }
    }
  }
  if (best_count < required_inliers) {
    throw std::runtime_error("line consensus is below the required support");
  }
  Eigen::MatrixXd inliers(best_count, 2);
  for (int i = 0, row = 0; i < static_cast<int>(points.size()); ++i)
    if (best_mask[i]) inliers.row(row++) = points[i];
  const Eigen::Vector2d center = inliers.colwise().mean();
  Eigen::JacobiSVD<Eigen::MatrixXd> svd(
      inliers.rowwise() - center.transpose(), Eigen::ComputeThinV);
  const Eigen::Vector2d direction = svd.matrixV().col(0);
  Eigen::Vector2d normal(-direction.y(), direction.x());
  // Consensus refitting is less noisy than returning the sampled pair.
  Eigen::Vector3d refined(normal.x(), normal.y(), -normal.dot(center));
  refined /= refined.head<2>().norm();
  return {refined, best_mask, iteration};
}`,
      walkthrough: [
        "Use a seeded generator and discard duplicate point samples.",
        "Select by inlier count and residual quality while reducing the iteration ceiling.",
        "Enforce configurable consensus support, then refit an orthogonal line through every selected inlier."
      ]
    }
  },
  {
    id: "cal-project",
    python: {
      code: `import numpy as np


def project_camera(points_world, transform_camera_world, intrinsics,
                   distortion=(0, 0, 0, 0, 0), image_size=None):
    points = np.asarray(points_world, dtype=np.float64)
    transform = np.asarray(transform_camera_world, dtype=np.float64)
    k = np.asarray(intrinsics, dtype=np.float64)
    coefficients = np.asarray(distortion, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 3 or not np.isfinite(points).all():
        raise ValueError("points_world must be finite N×3")
    if transform.shape != (4, 4) or k.shape != (3, 3) or coefficients.shape != (5,):
        raise ValueError("expected 4×4 transform, 3×3 intrinsics, and five coefficients")
    rotation, translation = transform[:3, :3], transform[:3, 3]
    if not np.allclose(rotation.T @ rotation, np.eye(3), atol=1e-7):
        raise ValueError("extrinsic rotation must be orthonormal")
    camera = points @ rotation.T + translation  # T_camera_world direction is explicit.
    z = camera[:, 2]
    valid = np.isfinite(z) & (z > 1e-9)
    normalized = np.full((len(points), 2), np.nan)
    normalized[valid] = camera[valid, :2] / z[valid, None]

    x, y = normalized[:, 0], normalized[:, 1]
    k1, k2, p1, p2, k3 = coefficients
    radius2 = x*x + y*y
    radial = 1 + k1*radius2 + k2*radius2**2 + k3*radius2**3
    distorted = np.column_stack((
        x*radial + 2*p1*x*y + p2*(radius2 + 2*x*x),
        y*radial + p1*(radius2 + 2*y*y) + 2*p2*x*y
    ))
    homogeneous = np.c_[distorted, np.ones(len(points))]
    pixels = (k @ homogeneous.T).T[:, :2]
    # Visibility combines positive depth with optional half-open image bounds.
    if image_size is not None:
        height, width = image_size
        valid &= ((pixels[:, 0] >= 0) & (pixels[:, 0] < width) &
                  (pixels[:, 1] >= 0) & (pixels[:, 1] < height))
    pixels[~valid] = np.nan
    return pixels, valid, camera`,
      walkthrough: [
        "Transform world points into the named camera frame before dividing by depth.",
        "Apply radial and tangential distortion only in normalized camera coordinates.",
        "Return pixels together with depth/bounds validity instead of inventing projections."
      ]
    },
    cpp: {
      code: `#include <array>
#include <cmath>
#include <limits>
#include <optional>
#include <stdexcept>
#include <vector>
#include <Eigen/Dense>

struct ProjectionResult {
  std::vector<Eigen::Vector2d> pixels;
  std::vector<bool> valid;
  std::vector<Eigen::Vector3d> camera_points;
};

ProjectionResult projectCamera(
    const std::vector<Eigen::Vector3d>& points_world,
    const Eigen::Isometry3d& transform_camera_world,
    const Eigen::Matrix3d& intrinsics,
    const std::array<double, 5>& distortion,
    std::optional<Eigen::Vector2i> image_size = std::nullopt) {
  const Eigen::Matrix3d rotation = transform_camera_world.rotation();
  if (!rotation.transpose().isApprox(Eigen::Matrix3d::Identity(), 1e-7) ||
      !intrinsics.allFinite()) {
    throw std::invalid_argument("invalid rotation or intrinsics");
  }
  ProjectionResult result;
  const auto [k1, k2, p1, p2, k3] = distortion;
  for (const Eigen::Vector3d& world : points_world) {
    if (!world.allFinite()) throw std::invalid_argument("points must be finite");
    // The named transform maps world coordinates into the camera frame.
    const Eigen::Vector3d camera = transform_camera_world * world;
    bool valid = camera.z() > 1e-9;
    Eigen::Vector2d pixel = Eigen::Vector2d::Constant(
        std::numeric_limits<double>::quiet_NaN());
    if (valid) {
      const double x = camera.x() / camera.z(), y = camera.y() / camera.z();
      const double r2 = x*x + y*y;
      const double radial = 1 + k1*r2 + k2*r2*r2 + k3*r2*r2*r2;
      const double xd = x*radial + 2*p1*x*y + p2*(r2 + 2*x*x);
      const double yd = y*radial + p1*(r2 + 2*y*y) + 2*p2*x*y;
      const Eigen::Vector3d projected = intrinsics * Eigen::Vector3d(xd, yd, 1);
      pixel = projected.hnormalized();
      if (image_size) {
        // Image validity uses half-open [0,width) x [0,height) bounds.
        valid = pixel.x() >= 0 && pixel.x() < image_size->x() &&
                pixel.y() >= 0 && pixel.y() < image_size->y();
      }
    }
    if (!valid) pixel.setConstant(std::numeric_limits<double>::quiet_NaN());
    result.pixels.push_back(pixel);
    result.valid.push_back(valid);
    result.camera_points.push_back(camera);
  }
  return result;
}`,
      walkthrough: [
        "Validate the rigid camera transform and transform every world point once.",
        "Distort normalized coordinates with the declared five-coefficient convention.",
        "Keep invalid depth and image visibility explicit in the returned mask."
      ]
    }
  },
  {
    id: "cal-audit",
    python: {
      code: `from collections import defaultdict
import numpy as np


def calibration_residual_audit(point_ids, view_ids, observed_uv, predicted_uv,
                               image_size, held_out=None):
    point_ids = np.asarray(point_ids)
    view_ids = np.asarray(view_ids)
    observed = np.asarray(observed_uv, dtype=np.float64)
    predicted = np.asarray(predicted_uv, dtype=np.float64)
    if observed.shape != predicted.shape or observed.ndim != 2 or observed.shape[1] != 2:
        raise ValueError("observed and predicted pixels must be matching N×2 arrays")
    if len(point_ids) != len(observed) or len(view_ids) != len(observed):
        raise ValueError("point/view identity must be preserved for every residual")
    residual = observed - predicted
    if not np.isfinite(residual).all():
        raise ValueError("pixels and residuals must be finite")
    norms = np.linalg.norm(residual, axis=1)
    median = float(np.median(norms))
    mad = float(np.median(np.abs(norms - median)))

    per_view = {}
    for view in np.unique(view_ids):
        values = norms[view_ids == view]
        per_view[str(view)] = {
            "count": int(len(values)),
            "median": float(np.median(values)),
            "p95": float(np.percentile(values, 95))
        }
    height, width = image_size
    center = np.array([(width - 1) / 2, (height - 1) / 2])
    radius = np.linalg.norm(observed - center, axis=1)
    radial_slope = float(np.polyfit(radius, norms, 1)[0]) if len(norms) > 1 else 0.0

    # Spatial coverage is the occupied fraction of a 4x4 image grid.
    columns = np.clip((4 * observed[:, 0] / width).astype(int), 0, 3)
    rows = np.clip((4 * observed[:, 1] / height).astype(int), 0, 3)
    coverage = len(set(zip(rows.tolist(), columns.tolist()))) / 16.0
    held_out = np.zeros(len(norms), dtype=bool) if held_out is None else np.asarray(held_out, dtype=bool)
    if held_out.shape != (len(norms),):
        raise ValueError("held_out mask must have length N")

    # Keep robust and tail statistics together; a low mean alone can hide one bad view.
    return {
        "rows": [
            {"point_id": str(pid), "view_id": str(vid), "du": float(r[0]), "dv": float(r[1])}
            for pid, vid, r in zip(point_ids, view_ids, residual)
        ],
        "rms": float(np.sqrt(np.mean(norms**2))),
        "median": median, "mad": mad,
        "p95": float(np.percentile(norms, 95)),
        "per_view": per_view,
        "radial_error_slope": radial_slope,
        "coverage_fraction_4x4": coverage,
        "held_out_rms": (float(np.sqrt(np.mean(norms[held_out]**2)))
                         if held_out.any() else None)
    }`,
      walkthrough: [
        "Retain point and view identities beside every two-dimensional residual.",
        "Report robust, tail, and per-view statistics instead of one average.",
        "Measure radial structure, image coverage, and held-out behavior to expose model bias."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>
#include <Eigen/Dense>

struct ResidualRow {
  std::string point_id, view_id;
  Eigen::Vector2d residual;
};
struct ViewStatistics { int count; double median, p95; };
struct CalibrationAudit {
  std::vector<ResidualRow> rows;
  double rms, median, mad, p95, radial_slope, coverage;
  std::map<std::string, ViewStatistics> per_view;
  double held_out_rms;
  bool has_held_out;
};

double percentile(std::vector<double> values, double q) {
  if (values.empty()) throw std::invalid_argument("empty percentile input");
  std::sort(values.begin(), values.end());
  const double index = q * (values.size() - 1);
  const int lower = static_cast<int>(std::floor(index));
  const int upper = static_cast<int>(std::ceil(index));
  return values[lower] + (index - lower) * (values[upper] - values[lower]);
}

CalibrationAudit calibrationResidualAudit(
    const std::vector<std::string>& point_ids,
    const std::vector<std::string>& view_ids,
    const std::vector<Eigen::Vector2d>& observed,
    const std::vector<Eigen::Vector2d>& predicted,
    Eigen::Vector2i image_size,
    const std::vector<bool>& held_out = {}) {
  const int n = static_cast<int>(observed.size());
  if (!n || predicted.size() != observed.size() || point_ids.size() != observed.size() ||
      view_ids.size() != observed.size() || image_size.minCoeff() <= 0 ||
      (!held_out.empty() && held_out.size() != observed.size())) {
    throw std::invalid_argument("inconsistent calibration audit inputs");
  }
  std::vector<double> norms, radii, held_norms;
  std::map<std::string, std::vector<double>> grouped;
  std::set<std::pair<int, int>> occupied;
  std::vector<ResidualRow> rows;
  const Eigen::Vector2d center((image_size.x() - 1) / 2.0,
                               (image_size.y() - 1) / 2.0);
  double squared_sum = 0.0;
  for (int i = 0; i < n; ++i) {
    const Eigen::Vector2d residual = observed[i] - predicted[i];
    if (!residual.allFinite()) throw std::invalid_argument("nonfinite residual");
    const double norm = residual.norm();
    rows.push_back({point_ids[i], view_ids[i], residual});
    norms.push_back(norm); radii.push_back((observed[i] - center).norm());
    grouped[view_ids[i]].push_back(norm); squared_sum += norm * norm;
    if (!held_out.empty() && held_out[i]) held_norms.push_back(norm);
    // A coarse occupancy grid catches weak image-edge coverage.
    const int col = std::clamp(int(4 * observed[i].x() / image_size.x()), 0, 3);
    const int row = std::clamp(int(4 * observed[i].y() / image_size.y()), 0, 3);
    occupied.insert({row, col});
  }
  const double median = percentile(norms, 0.5);
  std::vector<double> deviations;
  for (double value : norms) deviations.push_back(std::abs(value - median));
  Eigen::MatrixXd design(n, 2);
  Eigen::VectorXd target(n);
  for (int i = 0; i < n; ++i) {
    design.row(i) << radii[i], 1.0; target(i) = norms[i];
  }
  const double slope = design.colPivHouseholderQr().solve(target)(0);
  std::map<std::string, ViewStatistics> per_view;
  for (const auto& [view, values] : grouped)
    per_view[view] = {static_cast<int>(values.size()),
                      percentile(values, 0.5), percentile(values, 0.95)};
  double held_sq = 0.0;
  for (double value : held_norms) held_sq += value * value;
  // RMS, robust center, tails, structure, and holdout answer different failures.
  return {rows, std::sqrt(squared_sum / n), median,
          percentile(deviations, 0.5), percentile(norms, 0.95), slope,
          occupied.size() / 16.0, per_view,
          held_norms.empty() ? 0.0 : std::sqrt(held_sq / held_norms.size()),
          !held_norms.empty()};
}`,
      walkthrough: [
        "Build identity-preserving residual rows and view-specific groups.",
        "Calculate RMS, median/MAD, percentile tails, radial slope, and grid coverage.",
        "Keep held-out performance separate so fitting quality cannot masquerade as generalization."
      ]
    }
  },
  {
    id: "geo-triangulate",
    python: {
      code: `import numpy as np


def _project_with_jacobian(projection, point):
    q = projection[:, :3] @ point + projection[:, 3]
    if q[2] <= 1e-10:
        raise ValueError("point is behind a camera or at infinity")
    pixel = q[:2] / q[2]
    jacobian = np.vstack((
        (projection[0, :3] * q[2] - q[0] * projection[2, :3]) / q[2]**2,
        (projection[1, :3] * q[2] - q[1] * projection[2, :3]) / q[2]**2
    ))
    return pixel, jacobian


def triangulate_two_view(projection_a, projection_b, pixel_a, pixel_b,
                         refine_iterations=10):
    pa, pb = np.asarray(projection_a, float), np.asarray(projection_b, float)
    ua, ub = np.asarray(pixel_a, float), np.asarray(pixel_b, float)
    if pa.shape != (3, 4) or pb.shape != (3, 4) or ua.shape != (2,) or ub.shape != (2,):
        raise ValueError("expected two 3×4 cameras and two image points")
    design = np.vstack((
        ua[0] * pa[2] - pa[0], ua[1] * pa[2] - pa[1],
        ub[0] * pb[2] - pb[0], ub[1] * pb[2] - pb[1]
    ))
    _, singular, vh = np.linalg.svd(design)
    homogeneous = vh[-1]
    if abs(homogeneous[3]) <= 1e-12:
        raise ValueError("triangulated point lies at infinity")
    point = homogeneous[:3] / homogeneous[3]  # DLT supplies only the initialization.

    for _ in range(refine_iterations):
        predicted_a, ja = _project_with_jacobian(pa, point)
        predicted_b, jb = _project_with_jacobian(pb, point)
        residual = np.r_[ua - predicted_a, ub - predicted_b]
        jacobian = np.vstack((ja, jb))
        step, _, rank, _ = np.linalg.lstsq(jacobian, residual, rcond=None)
        if rank < 3:
            raise ValueError("triangulation geometry is locally degenerate")
        point += step
        if np.linalg.norm(step) < 1e-10:
            break

    predicted_a, _ = _project_with_jacobian(pa, point)
    predicted_b, _ = _project_with_jacobian(pb, point)
    # The smallest non-null singular value is a useful conditioning warning.
    conditioning = float(singular[-2] / max(singular[0], 1e-12))
    error = float(np.linalg.norm(np.r_[predicted_a - ua, predicted_b - ub]))
    return point, {"reprojection_error": error, "conditioning": conditioning}`,
      walkthrough: [
        "Intersect the two image rays algebraically to obtain a homogeneous DLT seed.",
        "Reject infinite or behind-camera geometry before nonlinear refinement.",
        "Minimize image reprojection error with an analytic projection Jacobian and report conditioning."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <cmath>
#include <stdexcept>
#include <utility>
#include <Eigen/Dense>

struct TriangulationResult {
  Eigen::Vector3d point;
  double reprojection_error;
  double conditioning;
};

std::pair<Eigen::Vector2d, Eigen::Matrix<double, 2, 3>>
projectWithJacobian(const Eigen::Matrix<double, 3, 4>& projection,
                    const Eigen::Vector3d& point) {
  const Eigen::Vector3d q =
      projection.leftCols<3>() * point + projection.col(3);
  if (q.z() <= 1e-10) throw std::invalid_argument("point behind camera");
  Eigen::Matrix<double, 2, 3> jacobian;
  jacobian.row(0) =
      (projection.row(0).head<3>() * q.z() -
       q.x() * projection.row(2).head<3>()) / (q.z() * q.z());
  jacobian.row(1) =
      (projection.row(1).head<3>() * q.z() -
       q.y() * projection.row(2).head<3>()) / (q.z() * q.z());
  return {q.hnormalized(), jacobian};
}

TriangulationResult triangulateTwoView(
    const Eigen::Matrix<double, 3, 4>& pa,
    const Eigen::Matrix<double, 3, 4>& pb,
    const Eigen::Vector2d& ua, const Eigen::Vector2d& ub,
    int refine_iterations = 10) {
  Eigen::Matrix4d design;
  design.row(0) = ua.x() * pa.row(2) - pa.row(0);
  design.row(1) = ua.y() * pa.row(2) - pa.row(1);
  design.row(2) = ub.x() * pb.row(2) - pb.row(0);
  design.row(3) = ub.y() * pb.row(2) - pb.row(1);
  Eigen::JacobiSVD<Eigen::Matrix4d> svd(design, Eigen::ComputeFullV);
  const Eigen::Vector4d homogeneous = svd.matrixV().col(3);
  if (std::abs(homogeneous.w()) <= 1e-12) {
    throw std::invalid_argument("triangulated point lies at infinity");
  }
  Eigen::Vector3d point = homogeneous.hnormalized();  // Linear DLT seed.
  for (int iteration = 0; iteration < refine_iterations; ++iteration) {
    const auto [qa, ja] = projectWithJacobian(pa, point);
    const auto [qb, jb] = projectWithJacobian(pb, point);
    Eigen::Matrix<double, 4, 3> jacobian;
    jacobian << ja, jb;
    Eigen::Vector4d residual;
    residual << ua - qa, ub - qb;
    Eigen::ColPivHouseholderQR<Eigen::Matrix<double, 4, 3>> solver(jacobian);
    if (solver.rank() < 3) throw std::invalid_argument("degenerate geometry");
    const Eigen::Vector3d step = solver.solve(residual);
    point += step;  // Gauss-Newton optimizes the image-space objective.
    if (step.norm() < 1e-10) break;
  }
  const auto [qa, unused_a] = projectWithJacobian(pa, point);
  const auto [qb, unused_b] = projectWithJacobian(pb, point);
  Eigen::Vector4d residual;
  residual << qa - ua, qb - ub;
  const auto singular = svd.singularValues();
  return {point, residual.norm(),
          singular(2) / std::max(singular(0), 1e-12)};
}`,
      walkthrough: [
        "Form four cross-product projection constraints and take the SVD null space.",
        "Check homogeneous scale and positive camera depth before trusting the seed.",
        "Refine the point in pixel space and return residual plus a conditioning signal."
      ]
    }
  }
);

{
  const foundationTaskOrder = [
    "img-convolution",
    "img-bilinear",
    "img-sobel",
    "img-components",
    "img-pyramid",
    "img-histogram",
    "geo-transform",
    "geo-dlt",
    "geo-ransac",
    "cal-project",
    "cal-audit",
    "geo-triangulate",
    "det-iou-nms",
    "det-ap",
    "trk-kalman",
    "trk-assignment",
    "trk-manager",
    "trk-metrics"
  ];
  const foundationRank = new Map(
    foundationTaskOrder.map((taskId, index) => [taskId, index])
  );
  window.CV_CODING_SOLUTIONS.sort((left, right) => {
    const leftRank = foundationRank.has(left.id)
      ? foundationRank.get(left.id)
      : Number.MAX_SAFE_INTEGER;
    const rightRank = foundationRank.has(right.id)
      ? foundationRank.get(right.id)
      : Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}
