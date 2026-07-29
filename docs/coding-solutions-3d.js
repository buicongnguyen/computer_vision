(() => {
  "use strict";

  const solutions = [];

  solutions.push(
    {
      id: "bev-depth-points",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def depth_to_points(depth_m, K, depth_kind="z", T_dst_cam=None):
    """Back-project a metric depth map from camera frame C to an optional frame D.

    Pixel coordinates use OpenCV's convention: integer (u, v) is the pixel center.
    depth_kind is either "z" (optical-axis depth) or "ray" (Euclidean range).
    """
    depth = np.asarray(depth_m, dtype=np.float64)
    K = np.asarray(K, dtype=np.float64)
    if depth.ndim != 2 or K.shape != (3, 3):
        raise ValueError("depth must be HxW and K must be 3x3")
    if depth_kind not in {"z", "ray"}:
        raise ValueError("depth_kind must be 'z' or 'ray'")

    h, w = depth.shape
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    pixels_h = np.stack((u, v, np.ones_like(u)), axis=-1).reshape(-1, 3)
    rays_c = (np.linalg.inv(K) @ pixels_h.T).T

    # K^-1 [u,v,1] has z=1, so multiplying by z-depth preserves camera geometry.
    if depth_kind == "z":
        scale = depth.reshape(-1)
    else:
        # Ray-range must be divided by ray length; treating it as z biases oblique pixels.
        scale = depth.reshape(-1) / np.linalg.norm(rays_c, axis=1)
    points_c = rays_c * scale[:, None]

    valid = np.isfinite(depth.reshape(-1)) & (depth.reshape(-1) > 0.0)
    valid &= np.all(np.isfinite(points_c), axis=1)
    points_dst = points_c
    dst_frame = "camera"
    if T_dst_cam is not None:
        T_dst_cam = np.asarray(T_dst_cam, dtype=np.float64)
        if T_dst_cam.shape != (4, 4):
            raise ValueError("T_dst_cam must map camera coordinates into destination")
        ph = np.c_[points_c, np.ones(len(points_c))]
        points_dst = (T_dst_cam @ ph.T).T[:, :3]
        valid &= np.all(np.isfinite(points_dst), axis=1)
        dst_frame = "destination"

    return {
        "points_m": points_dst[valid],
        "pixels_uv": pixels_h[valid, :2].astype(np.int32),
        "valid_mask": valid.reshape(h, w),
        "frame": dst_frame,
        "depth_kind": depth_kind,
    }`,
        walkthrough: [
          "Name the depth convention first: z-depth scales a ray with z=1, while ray range scales a unit-length ray.",
          "Back-project pixel centers with K inverse, then reject non-finite and nonpositive measurements before downstream geometry.",
          "Apply only a direction-labeled transform, T_destination_camera, and return frame and unit metadata with the points."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <stdexcept>
#include <string>
#include <vector>

struct DepthCloud {
  std::vector<Eigen::Vector3d> points_m;
  std::vector<Eigen::Vector2i> pixels_uv;
  std::vector<unsigned char> valid_mask;
  std::string frame;
  int height = 0;
  int width = 0;
};

DepthCloud depthToPoints(const std::vector<double>& depth_m, int h, int w,
                         const Eigen::Matrix3d& K, bool ray_distance,
                         const Eigen::Matrix4d* T_dst_cam = nullptr) {
  if (h <= 0 || w <= 0 || static_cast<int>(depth_m.size()) != h * w) {
    throw std::invalid_argument("depth size does not match HxW");
  }
  if (std::abs(K.determinant()) < 1e-12) {
    throw std::invalid_argument("K is singular");
  }

  DepthCloud out;
  out.height = h;
  out.width = w;
  out.frame = T_dst_cam ? "destination" : "camera";
  out.valid_mask.assign(h * w, 0);
  const Eigen::Matrix3d K_inv = K.inverse();

  for (int v = 0; v < h; ++v) {
    for (int u = 0; u < w; ++u) {
      const int i = v * w + u;
      const double d = depth_m[i];
      if (!std::isfinite(d) || d <= 0.0) continue;

      // Integer (u,v) denotes the pixel center; K^-1 maps it to a z=1 camera ray.
      Eigen::Vector3d ray_c = K_inv * Eigen::Vector3d(u, v, 1.0);
      double scale = d;
      if (ray_distance) {
        // Euclidean range uses a unit ray, unlike optical-axis z-depth.
        const double norm = ray_c.norm();
        if (!(norm > 0.0) || !std::isfinite(norm)) continue;
        scale /= norm;
      }
      Eigen::Vector3d p = ray_c * scale;
      if (T_dst_cam) {
        const Eigen::Vector4d ph =
            (*T_dst_cam) * Eigen::Vector4d(p.x(), p.y(), p.z(), 1.0);
        p = ph.head<3>();
      }
      if (!p.allFinite()) continue;

      out.valid_mask[i] = 1;
      out.points_m.push_back(p);
      out.pixels_uv.emplace_back(u, v);
    }
  }
  return out;
}`,
        walkthrough: [
          "Invert K once and back-project every valid pixel center into a camera ray.",
          "Use a different scale for optical-axis depth and Euclidean ray range; this is the key semantic branch.",
          "Transform with T_destination_camera only after back-projection and retain a dense validity mask."
        ]
      }
    },
    {
      id: "bev-ipm",
      python: {
        code: `# Dependencies: NumPy and OpenCV
import cv2
import numpy as np


def inverse_perspective_map(image, K, T_cam_ground, roi_xy, resolution_m):
    """Backward-warp ground z=0 into a metric BEV.

    Ground frame G: x forward, y left, z up.  T_cam_ground maps G -> camera.
    BEV row 0 is x_max (far); column 0 is y_max (left).
    """
    if resolution_m <= 0:
        raise ValueError("resolution_m must be positive")
    x_min, x_max, y_min, y_max = map(float, roi_xy)
    if not (x_max > x_min and y_max > y_min):
        raise ValueError("invalid metric ROI")

    K = np.asarray(K, np.float64)
    T_cam_ground = np.asarray(T_cam_ground, np.float64)
    h_bev = int(np.ceil((x_max - x_min) / resolution_m))
    w_bev = int(np.ceil((y_max - y_min) / resolution_m))
    rows, cols = np.meshgrid(np.arange(h_bev), np.arange(w_bev), indexing="ij")
    x = x_max - (rows + 0.5) * resolution_m
    y = y_max - (cols + 0.5) * resolution_m
    pg = np.stack((x, y, np.zeros_like(x), np.ones_like(x)), axis=-1)

    # Backward mapping asks where each BEV cell center came from in the source image.
    pc = (T_cam_ground @ pg.reshape(-1, 4).T).T[:, :3]
    z = pc[:, 2]
    uvw = (K @ pc.T).T
    uv = uvw[:, :2] / np.where(z[:, None] > 1e-9, z[:, None], 1.0)
    map_x = uv[:, 0].reshape(h_bev, w_bev).astype(np.float32)
    map_y = uv[:, 1].reshape(h_bev, w_bev).astype(np.float32)

    src_h, src_w = image.shape[:2]
    # A ground cell is observable only if it lies in front of the camera and in-image.
    valid = (z > 1e-9)
    valid &= (uv[:, 0] >= 0) & (uv[:, 0] <= src_w - 1)
    valid &= (uv[:, 1] >= 0) & (uv[:, 1] <= src_h - 1)
    valid = valid.reshape(h_bev, w_bev)
    bev = cv2.remap(
        image, map_x, map_y, cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT, borderValue=0
    )
    if bev.ndim == 3:
        bev[~valid] = 0
    else:
        bev = np.where(valid, bev, 0)
    return bev, valid, {
        "frame": "ground", "origin_xy_m": (x_min, y_min),
        "resolution_m": resolution_m, "shape": (h_bev, w_bev)
    }`,
        walkthrough: [
          "Define the ground frame, ROI, BEV axis directions, and cell-center convention before deriving a warp.",
          "For every destination BEV cell, transform its z=0 ground point into the camera and project with K.",
          "Backward sampling avoids holes; the visibility mask separates real observations from border-filled pixels."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and OpenCV 4
#include <Eigen/Dense>
#include <opencv2/imgproc.hpp>
#include <cmath>
#include <stdexcept>

struct IpmResult {
  cv::Mat bev;
  cv::Mat valid;  // CV_8U; 255 means geometrically observable.
  double resolution_m = 0.0;
  Eigen::Vector2d origin_xy_m;
};

IpmResult inversePerspectiveMap(const cv::Mat& image,
                                const Eigen::Matrix3d& K,
                                const Eigen::Matrix4d& T_cam_ground,
                                double x_min, double x_max,
                                double y_min, double y_max,
                                double resolution_m) {
  if (image.empty() || resolution_m <= 0.0 ||
      x_max <= x_min || y_max <= y_min) {
    throw std::invalid_argument("invalid image, ROI, or resolution");
  }
  const int hb = static_cast<int>(std::ceil((x_max - x_min) / resolution_m));
  const int wb = static_cast<int>(std::ceil((y_max - y_min) / resolution_m));
  cv::Mat map_x(hb, wb, CV_32F, cv::Scalar(-1));
  cv::Mat map_y(hb, wb, CV_32F, cv::Scalar(-1));
  cv::Mat valid(hb, wb, CV_8U, cv::Scalar(0));

  for (int r = 0; r < hb; ++r) {
    for (int c = 0; c < wb; ++c) {
      // Row/column centers map to metric ground x-forward/y-left coordinates.
      const double x = x_max - (r + 0.5) * resolution_m;
      const double y = y_max - (c + 0.5) * resolution_m;
      const Eigen::Vector4d pc_h =
          T_cam_ground * Eigen::Vector4d(x, y, 0.0, 1.0);
      const Eigen::Vector3d pc = pc_h.head<3>();
      if (pc.z() <= 1e-9 || !pc.allFinite()) continue;

      const Eigen::Vector3d q = K * pc;
      const double u = q.x() / q.z();
      const double v = q.y() / q.z();
      // Invalid cells remain marked instead of masquerading as measured black pixels.
      if (u < 0.0 || u > image.cols - 1.0 ||
          v < 0.0 || v > image.rows - 1.0) continue;
      map_x.at<float>(r, c) = static_cast<float>(u);
      map_y.at<float>(r, c) = static_cast<float>(v);
      valid.at<unsigned char>(r, c) = 255;
    }
  }

  IpmResult out;
  cv::remap(image, out.bev, map_x, map_y, cv::INTER_LINEAR,
            cv::BORDER_CONSTANT, cv::Scalar::all(0));
  out.valid = valid;
  out.resolution_m = resolution_m;
  out.origin_xy_m = Eigen::Vector2d(x_min, y_min);
  return out;
}`,
        walkthrough: [
          "Lay out metric BEV cell centers in a documented ground coordinate system.",
          "Transform each ground point with T_camera_ground and project only positive-depth points.",
          "Use OpenCV backward remapping and carry a separate observability mask through the pipeline."
        ]
      }
    },
    {
      id: "bev-lift-splat",
      python: {
        code: `# Dependencies: PyTorch
import torch


def _deterministic_segment_sum(indices, values, output_size):
    """Sum rows with equal integer index after sorting."""
    order = torch.argsort(indices, stable=True)
    idx = indices[order]
    val = values[order]
    unique, counts = torch.unique_consecutive(idx, return_counts=True)
    prefix = torch.cat((torch.zeros_like(val[:1]), torch.cumsum(val, dim=0)), dim=0)
    ends = torch.cumsum(counts, dim=0)
    starts = ends - counts
    sums = prefix[ends] - prefix[starts]
    out = values.new_zeros((output_size, values.shape[1]))
    out[unique] = sums
    return out, unique, counts


def lift_splat(features, depth_prob, rays_cam, depth_bins_m,
               T_ego_cam, bounds_xy, resolution_m, reduction="mean"):
    """Lift image features and pool them into x-forward/y-left ego BEV.

    features: [B,N,C,H,W], depth_prob: [B,N,D,H,W],
    rays_cam: [B,N,H,W,3] with z=1, T_ego_cam: [B,N,4,4].
    """
    if reduction not in {"sum", "mean"} or resolution_m <= 0:
        raise ValueError("reduction must be sum/mean and resolution must be positive")
    B, N, C, H, W = features.shape
    D = depth_prob.shape[2]
    if depth_prob.shape != (B, N, D, H, W):
        raise ValueError("depth probability shape mismatch")
    if rays_cam.shape != (B, N, H, W, 3) or len(depth_bins_m) != D:
        raise ValueError("ray or depth-bin shape mismatch")

    xmin, xmax, ymin, ymax = map(float, bounds_xy)
    hb = int((xmax - xmin + resolution_m - 1e-9) // resolution_m)
    wb = int((ymax - ymin + resolution_m - 1e-9) // resolution_m)
    depths = torch.as_tensor(depth_bins_m, device=features.device, dtype=features.dtype)

    # z=1 camera rays times a depth bin produce camera points at optical-axis depth z.
    pc = rays_cam[:, :, None] * depths[None, None, :, None, None, None]
    pc_h = torch.cat((pc, torch.ones_like(pc[..., :1])), dim=-1)
    pe = torch.einsum("bnij,bndhwj->bndhwi", T_ego_cam, pc_h)[..., :3]
    weighted = (
        features[:, :, None].permute(0, 1, 2, 4, 5, 3)
        * depth_prob[..., None]
    )

    bev = features.new_zeros((B, C, hb, wb))
    counts = features.new_zeros((B, 1, hb, wb))
    for b in range(B):
        p = pe[b].reshape(-1, 3)
        f = weighted[b].reshape(-1, C)
        ix = torch.floor((p[:, 0] - xmin) / resolution_m).long()
        iy = torch.floor((p[:, 1] - ymin) / resolution_m).long()
        valid = torch.isfinite(p).all(1)
        valid &= (ix >= 0) & (ix < hb) & (iy >= 0) & (iy < wb)
        linear = ix[valid] * wb + iy[valid]
        if linear.numel() == 0:
            continue

        # Sorted segmented reduction is deterministic, including when many rays hit one cell.
        sums, unique, hit_counts = _deterministic_segment_sum(
            linear, f[valid], hb * wb
        )
        cell_count = features.new_zeros(hb * wb)
        cell_count[unique] = hit_counts.to(features.dtype)
        if reduction == "mean":
            sums = sums / cell_count.clamp_min(1)[:, None]
        bev[b] = sums.reshape(hb, wb, C).permute(2, 0, 1)
        counts[b, 0] = cell_count.reshape(hb, wb)
    return bev, counts`,
        walkthrough: [
          "Lift each image feature along its calibrated camera ray at every discrete depth, weighted by the predicted depth probability.",
          "Transform lifted points with T_ego_camera and quantize ego x/y into bounded metric BEV cells.",
          "Sort cell indices before segmented sum or mean so collisions are deterministic and expose hit counts for debugging."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <map>
#include <stdexcept>
#include <utility>
#include <vector>

struct LiftPixel {
  Eigen::Vector3f ray_cam_z1;
  Eigen::VectorXf feature;
  std::vector<float> depth_probability;
  int camera_index = 0;
};

struct LiftSplatResult {
  int height = 0;
  int width = 0;
  std::vector<Eigen::VectorXf> bev;
  std::vector<int> counts;
};

LiftSplatResult liftSplat(const std::vector<LiftPixel>& pixels,
                          const std::vector<float>& depth_bins_m,
                          const std::vector<Eigen::Matrix4f>& T_ego_cam,
                          float xmin, float xmax, float ymin, float ymax,
                          float resolution_m, bool mean_pool) {
  if (pixels.empty() || depth_bins_m.empty() || resolution_m <= 0.0f ||
      xmax <= xmin || ymax <= ymin) {
    throw std::invalid_argument("invalid lift-splat inputs");
  }
  const int channels = pixels.front().feature.size();
  const int hb = static_cast<int>(std::ceil((xmax - xmin) / resolution_m));
  const int wb = static_cast<int>(std::ceil((ymax - ymin) / resolution_m));
  std::map<int, std::pair<Eigen::VectorXf, int>> bins;

  for (const LiftPixel& px : pixels) {
    if (px.feature.size() != channels ||
        px.depth_probability.size() != depth_bins_m.size() ||
        px.camera_index < 0 || px.camera_index >= static_cast<int>(T_ego_cam.size())) {
      throw std::invalid_argument("inconsistent pixel feature/depth/camera");
    }
    for (int d = 0; d < static_cast<int>(depth_bins_m.size()); ++d) {
      // A z=1 ray multiplied by the bin gives a camera point at z-depth d.
      const Eigen::Vector3f pc = px.ray_cam_z1 * depth_bins_m[d];
      const Eigen::Vector4f pe_h =
          T_ego_cam[px.camera_index] * Eigen::Vector4f(pc.x(), pc.y(), pc.z(), 1.0f);
      const Eigen::Vector3f pe = pe_h.head<3>();
      const int ix = static_cast<int>(std::floor((pe.x() - xmin) / resolution_m));
      const int iy = static_cast<int>(std::floor((pe.y() - ymin) / resolution_m));
      if (!pe.allFinite() || ix < 0 || ix >= hb || iy < 0 || iy >= wb) continue;

      const int key = ix * wb + iy;
      auto it = bins.find(key);
      if (it == bins.end()) {
        it = bins.emplace(key, std::make_pair(Eigen::VectorXf::Zero(channels), 0)).first;
      }
      // std::map iteration and fixed input order make feature collisions reproducible.
      it->second.first += px.depth_probability[d] * px.feature;
      it->second.second += 1;
    }
  }

  LiftSplatResult out;
  out.height = hb;
  out.width = wb;
  out.bev.assign(hb * wb, Eigen::VectorXf::Zero(channels));
  out.counts.assign(hb * wb, 0);
  for (const auto& kv : bins) {
    Eigen::VectorXf value = kv.second.first;
    if (mean_pool && kv.second.second > 0) value /= kv.second.second;
    out.bev[kv.first] = value;
    out.counts[kv.first] = kv.second.second;
  }
  return out;
}`,
        walkthrough: [
          "Represent every image location by a z-normalized calibrated ray, a feature vector, and a probability over depth bins.",
          "Lift and transform into ego coordinates, then reject cells outside the declared metric bounds.",
          "Accumulate in an ordered map for deterministic sum or mean pooling and report collision counts."
        ]
      }
    },
    {
      id: "bev-voxelize",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def voxelize(points_xyz_m, features, bounds_min, bounds_max,
             voxel_size_m, reduction="mean"):
    """Aggregate points into [z,y,x] voxels; max bounds are exclusive."""
    points = np.asarray(points_xyz_m, dtype=np.float64)
    feats = np.asarray(features, dtype=np.float64)
    lo = np.asarray(bounds_min, dtype=np.float64)
    hi = np.asarray(bounds_max, dtype=np.float64)
    size = np.asarray(voxel_size_m, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 3:
        raise ValueError("points must be Nx3")
    if feats.ndim != 2 or feats.shape[0] != points.shape[0]:
        raise ValueError("features must be NxC")
    if np.any(size <= 0) or np.any(hi <= lo):
        raise ValueError("invalid bounds or voxel size")
    if reduction not in {"sum", "mean", "max"}:
        raise ValueError("reduction must be sum, mean, or max")

    shape_xyz = np.ceil((hi - lo) / size).astype(np.int64)
    # Half-open [lo, hi) bounds make a point exactly at max unambiguously invalid.
    valid = np.isfinite(points).all(1) & np.isfinite(feats).all(1)
    valid &= ((points >= lo) & (points < hi)).all(1)
    index_xyz = np.floor((points[valid] - lo) / size).astype(np.int64)
    linear = (
        index_xyz[:, 2] * shape_xyz[1] * shape_xyz[0]
        + index_xyz[:, 1] * shape_xyz[0] + index_xyz[:, 0]
    )
    cells = int(np.prod(shape_xyz))
    counts = np.zeros(cells, dtype=np.int64)
    np.add.at(counts, linear, 1)

    if reduction == "max":
        pooled = np.full((cells, feats.shape[1]), -np.inf, dtype=np.float64)
        np.maximum.at(pooled, linear, feats[valid])
        pooled[counts == 0] = 0.0
    else:
        pooled = np.zeros((cells, feats.shape[1]), dtype=np.float64)
        # add.at handles repeated indices instead of silently dropping collisions.
        np.add.at(pooled, linear, feats[valid])
        if reduction == "mean":
            pooled /= np.maximum(counts, 1)[:, None]

    shape_zyx = tuple(shape_xyz[::-1])
    return {
        "features_zyxc": pooled.reshape(*shape_zyx, feats.shape[1]),
        "counts_zyx": counts.reshape(shape_zyx),
        "valid_point_mask": valid,
        "valid_indices_xyz": index_xyz,
        "origin_xyz_m": lo,
        "voxel_size_xyz_m": size,
    }`,
        walkthrough: [
          "Use finite checks and half-open metric bounds so NaNs and maximum-boundary points have deterministic behavior.",
          "Floor normalized coordinates to x/y/z indices, then flatten indices only for aggregation.",
          "Return counts and the original point-validity mask; empty voxels must remain distinguishable from measured zeros."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <limits>
#include <map>
#include <stdexcept>
#include <tuple>
#include <vector>

enum class VoxelReduction { Sum, Mean, Max };

struct Voxel {
  Eigen::Vector3i index_xyz;
  Eigen::VectorXf feature;
  int count = 0;
};

struct Voxelization {
  std::vector<Voxel> occupied;
  std::vector<unsigned char> valid_point_mask;
  Eigen::Vector3i shape_xyz;
};

Voxelization voxelize(const std::vector<Eigen::Vector3f>& points_m,
                      const std::vector<Eigen::VectorXf>& features,
                      const Eigen::Vector3f& lo, const Eigen::Vector3f& hi,
                      const Eigen::Vector3f& voxel_size_m,
                      VoxelReduction reduction) {
  if (points_m.size() != features.size() ||
      !lo.allFinite() || !hi.allFinite() || !voxel_size_m.allFinite() ||
      (voxel_size_m.array() <= 0.0f).any() || (hi.array() <= lo.array()).any()) {
    throw std::invalid_argument("invalid points, features, bounds, or voxel size");
  }
  const Eigen::Vector3i shape =
      ((hi - lo).cwiseQuotient(voxel_size_m).array().ceil()).cast<int>();
  using Key = std::tuple<int, int, int>;
  struct Accum { Eigen::VectorXf value; int count; };
  std::map<Key, Accum> bins;
  Voxelization out;
  out.valid_point_mask.assign(points_m.size(), 0);
  out.shape_xyz = shape;
  // An empty sweep is valid evidence: return shape plus empty occupied/mask arrays.
  if (points_m.empty()) return out;
  const int channels = features.front().size();

  for (int i = 0; i < static_cast<int>(points_m.size()); ++i) {
    if (features[i].size() != channels) throw std::invalid_argument("feature width mismatch");
    const Eigen::Vector3f& p = points_m[i];
    // [lo, hi) gives a single policy for NaNs, negatives, and exact max boundaries.
    if (!p.allFinite() || !features[i].allFinite() ||
        (p.array() < lo.array()).any() || (p.array() >= hi.array()).any()) continue;
    const Eigen::Vector3i idx =
        ((p - lo).cwiseQuotient(voxel_size_m).array().floor()).cast<int>();
    const Key key(idx.x(), idx.y(), idx.z());
    auto it = bins.find(key);
    if (it == bins.end()) {
      Eigen::VectorXf init = reduction == VoxelReduction::Max
          ? Eigen::VectorXf::Constant(channels, -std::numeric_limits<float>::infinity())
          : Eigen::VectorXf::Zero(channels);
      it = bins.emplace(key, Accum{init, 0}).first;
    }
    // Repeated points are explicitly reduced; no point is overwritten by its neighbor.
    if (reduction == VoxelReduction::Max) {
      it->second.value = it->second.value.cwiseMax(features[i]);
    } else {
      it->second.value += features[i];
    }
    ++it->second.count;
    out.valid_point_mask[i] = 1;
  }

  for (auto& kv : bins) {
    auto [ix, iy, iz] = kv.first;
    if (reduction == VoxelReduction::Mean) kv.second.value /= kv.second.count;
    out.occupied.push_back({Eigen::Vector3i(ix, iy, iz),
                            kv.second.value, kv.second.count});
  }
  return out;
}`,
        walkthrough: [
          "Validate aligned point/feature arrays and define an exclusive upper metric bound.",
          "Quantize with floor in xyz order and aggregate repeated keys rather than overwriting them.",
          "Return each occupied voxel with its count plus a per-input validity mask for auditability."
        ]
      }
    }
  );

  solutions.push(
    {
      id: "bev-temporal",
      python: {
        code: `# Dependencies: PyTorch
import torch
import torch.nn.functional as F


def warp_previous_bev(previous_bev, T_prev_from_curr,
                      previous_origin_xy_m, current_origin_xy_m,
                      resolution_m, previous_time_s, current_time_s,
                      max_age_s=0.5):
    """Backward-warp [B,C,Hx,Wy] previous BEV into the current ego grid.

    BEV rows increase with ego x; columns increase with ego y.
    T_prev_from_curr maps current-ego planar coordinates into previous ego.
    """
    if previous_bev.ndim != 4 or resolution_m <= 0:
        raise ValueError("BEV must be BCHW and resolution must be positive")
    if not (0.0 <= current_time_s - previous_time_s <= max_age_s):
        raise ValueError("stale, reversed, or unsupported BEV timestamp")
    B, _, H, W = previous_bev.shape
    T = torch.as_tensor(
        T_prev_from_curr, dtype=previous_bev.dtype, device=previous_bev.device
    )
    if T.shape == (3, 3):
        T = T.expand(B, -1, -1)
    if T.shape != (B, 3, 3):
        raise ValueError("T_prev_from_curr must be 3x3 or Bx3x3")

    rows, cols = torch.meshgrid(
        torch.arange(H, device=previous_bev.device, dtype=previous_bev.dtype),
        torch.arange(W, device=previous_bev.device, dtype=previous_bev.dtype),
        indexing="ij",
    )
    x_curr = current_origin_xy_m[0] + (rows + 0.5) * resolution_m
    y_curr = current_origin_xy_m[1] + (cols + 0.5) * resolution_m
    p_curr = torch.stack((x_curr, y_curr, torch.ones_like(x_curr)), dim=-1)

    # Backward sampling maps every current cell center into the previous ego frame.
    p_prev = torch.einsum("bij,hwj->bhwi", T, p_curr)
    p_prev = p_prev[..., :2] / p_prev[..., 2:].clamp_min(1e-9)
    prev_row = (p_prev[..., 0] - previous_origin_xy_m[0]) / resolution_m - 0.5
    prev_col = (p_prev[..., 1] - previous_origin_xy_m[1]) / resolution_m - 0.5

    # align_corners=False maps pixel-center coordinate c to 2(c+0.5)/size-1.
    grid_x = 2.0 * (prev_col + 0.5) / W - 1.0
    grid_y = 2.0 * (prev_row + 0.5) / H - 1.0
    grid = torch.stack((grid_x, grid_y), dim=-1)
    valid = (
        (prev_row >= 0) & (prev_row <= H - 1)
        & (prev_col >= 0) & (prev_col <= W - 1)
        & torch.isfinite(grid).all(-1)
    )
    warped = F.grid_sample(
        previous_bev, grid, mode="bilinear",
        padding_mode="zeros", align_corners=False
    )
    warped = warped * valid[:, None]
    return warped, valid, {
        "transform": "T_previous_ego_from_current_ego",
        "age_s": current_time_s - previous_time_s,
    }`,
        walkthrough: [
          "Treat time as part of the geometry: reject reversed or stale feature maps before warping.",
          "Map current cell centers through T_previous_from_current because a backward sampler needs source coordinates.",
          "Convert metric x/y to the exact align-corners-false convention and return an interpolation-validity mask."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and OpenCV 4
#include <Eigen/Dense>
#include <opencv2/imgproc.hpp>
#include <cmath>
#include <stdexcept>

struct TemporalBev {
  cv::Mat warped;
  cv::Mat valid;
  double age_s = 0.0;
};

TemporalBev warpPreviousBev(const cv::Mat& previous_bev,
                            const Eigen::Matrix3d& T_prev_from_curr,
                            const Eigen::Vector2d& previous_origin_xy_m,
                            const Eigen::Vector2d& current_origin_xy_m,
                            double resolution_m,
                            double previous_time_s, double current_time_s,
                            double max_age_s = 0.5) {
  const double age = current_time_s - previous_time_s;
  if (previous_bev.empty() || resolution_m <= 0.0 ||
      age < 0.0 || age > max_age_s) {
    throw std::invalid_argument("invalid BEV, resolution, or timestamps");
  }
  cv::Mat map_x(previous_bev.rows, previous_bev.cols, CV_32F, cv::Scalar(-1));
  cv::Mat map_y(previous_bev.rows, previous_bev.cols, CV_32F, cv::Scalar(-1));
  cv::Mat valid(previous_bev.rows, previous_bev.cols, CV_8U, cv::Scalar(0));

  for (int r = 0; r < previous_bev.rows; ++r) {
    for (int c = 0; c < previous_bev.cols; ++c) {
      const double x = current_origin_xy_m.x() + (r + 0.5) * resolution_m;
      const double y = current_origin_xy_m.y() + (c + 0.5) * resolution_m;
      // The destination cell is mapped current->previous for backward interpolation.
      const Eigen::Vector3d hp = T_prev_from_curr * Eigen::Vector3d(x, y, 1.0);
      if (!hp.allFinite() || std::abs(hp.z()) < 1e-12) continue;
      const double xp = hp.x() / hp.z();
      const double yp = hp.y() / hp.z();
      const double source_row =
          (xp - previous_origin_xy_m.x()) / resolution_m - 0.5;
      const double source_col =
          (yp - previous_origin_xy_m.y()) / resolution_m - 0.5;
      // OpenCV remap uses x=column and y=row, which is easy to swap accidentally.
      if (source_row < 0.0 || source_row > previous_bev.rows - 1.0 ||
          source_col < 0.0 || source_col > previous_bev.cols - 1.0) continue;
      map_x.at<float>(r, c) = static_cast<float>(source_col);
      map_y.at<float>(r, c) = static_cast<float>(source_row);
      valid.at<unsigned char>(r, c) = 255;
    }
  }

  TemporalBev out;
  cv::remap(previous_bev, out.warped, map_x, map_y, cv::INTER_LINEAR,
            cv::BORDER_CONSTANT, cv::Scalar::all(0));
  out.valid = valid;
  out.age_s = age;
  return out;
}`,
        walkthrough: [
          "Check feature age before doing any spatial alignment.",
          "Map current x/y cell centers through a direction-labeled planar transform into the previous ego frame.",
          "Feed OpenCV source column/row maps in the correct order and preserve a valid-support mask."
        ]
      }
    },
    {
      id: "bev-fusion-audit",
      python: {
        code: `# Dependencies: NumPy and OpenCV
import cv2
import numpy as np


def fusion_alignment_audit(points_lidar_m, point_time_s, metadata,
                           pose_world_ego, T_ego_lidar, T_cam_ego, K,
                           image_time_s, distance_to_edge_px,
                           bev_origin_xy_m, bev_resolution_m, bev_shape_hw,
                           injected_time_offset_s=0.0,
                           T_injected_cam=None, visibility_tolerance_m=0.05):
    """Project a motion-compensated sweep and measure image-edge residuals.

    pose_world_ego(t) returns T_world_ego. T_cam_ego and T_ego_lidar are
    direction-labeled extrinsics. T_injected_cam intentionally simulates a fault.
    """
    points = np.asarray(points_lidar_m, np.float64)
    times = np.asarray(point_time_s, np.float64)
    if points.shape != (len(times), 3):
        raise ValueError("points and per-point timestamps must align")
    bev_origin = np.asarray(bev_origin_xy_m, np.float64)
    bev_h, bev_w = bev_shape_hw
    if (
        bev_origin.shape != (2,) or not np.isfinite(bev_origin).all()
        or not np.isfinite(bev_resolution_m) or bev_resolution_m <= 0
        or bev_h <= 0 or bev_w <= 0
    ):
        raise ValueError("BEV needs finite x/y origin, positive resolution and shape")
    K = np.asarray(K, np.float64)
    T_ego_lidar = np.asarray(T_ego_lidar, np.float64)
    T_cam_ego = np.asarray(T_cam_ego, np.float64)
    fault = np.eye(4) if T_injected_cam is None else np.asarray(T_injected_cam)
    camera_time = image_time_s + injected_time_offset_s
    T_world_ego_camera = np.asarray(pose_world_ego(camera_time), np.float64)
    T_ego_camera_world = np.linalg.inv(T_world_ego_camera)
    T_cam_world = fault @ T_cam_ego @ np.linalg.inv(T_world_ego_camera)

    pc = np.full_like(points, np.nan)
    pe = np.full_like(points, np.nan)
    motion_m = np.full(len(points), np.nan)
    for i, (point_l, t) in enumerate(zip(points, times)):
        if not np.isfinite(point_l).all() or not np.isfinite(t):
            continue
        T_world_ego_point = np.asarray(pose_world_ego(float(t)), np.float64)
        # Per-return world transport deskews the sweep to the image timestamp.
        point_w = T_world_ego_point @ T_ego_lidar @ np.r_[point_l, 1.0]
        pc[i] = (T_cam_world @ point_w)[:3]
        pe[i] = (T_ego_camera_world @ point_w)[:3]
        motion_m[i] = np.linalg.norm(
            T_world_ego_point[:3, 3] - T_world_ego_camera[:3, 3]
        )

    z = pc[:, 2]
    projected = (K @ pc.T).T
    uv = projected[:, :2] / np.where(z[:, None] > 1e-9, z[:, None], 1.0)
    h, w = distance_to_edge_px.shape
    valid = np.isfinite(uv).all(1) & np.isfinite(z) & (z > 1e-9)
    valid &= (uv[:, 0] >= 0) & (uv[:, 0] <= w - 1)
    valid &= (uv[:, 1] >= 0) & (uv[:, 1] <= h - 1)

    # A pixel z-buffer prevents hidden returns from polluting calibration residuals.
    ui = np.rint(uv[:, 0]).astype(np.int64, copy=False)
    vi = np.rint(uv[:, 1]).astype(np.int64, copy=False)
    ui_safe = np.clip(ui, 0, w - 1)
    vi_safe = np.clip(vi, 0, h - 1)
    flat = vi_safe * w + ui_safe
    z_buffer = np.full(h * w, np.inf)
    np.minimum.at(z_buffer, flat[valid], z[valid])
    visible = valid & (z <= z_buffer[flat] + visibility_tolerance_m)

    residual = np.full(len(points), np.nan)
    if np.any(visible):
        sampled = cv2.remap(
            np.asarray(distance_to_edge_px, np.float32),
            uv[:, 0].astype(np.float32)[None, :],
            uv[:, 1].astype(np.float32)[None, :],
            cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT,
            borderValue=float("nan"),
        )[0]
        residual[visible] = sampled[visible]

    range_m = np.linalg.norm(points, axis=1)
    region = (uv[:, 0] >= w / 2).astype(np.int8) + 2 * (uv[:, 1] >= h / 2)
    # BEV rows increase with ego x-forward; columns increase with ego y-left.
    bev_row = np.floor((pe[:, 0] - bev_origin[0]) / bev_resolution_m)
    bev_col = np.floor((pe[:, 1] - bev_origin[1]) / bev_resolution_m)
    bev_valid = np.isfinite(pe).all(1)
    bev_valid &= (bev_row >= 0) & (bev_row < bev_h)
    bev_valid &= (bev_col >= 0) & (bev_col < bev_w)
    bev_index = np.full((len(points), 2), -1, dtype=np.int64)
    bev_index[bev_valid, 0] = bev_row[bev_valid].astype(np.int64)
    bev_index[bev_valid, 1] = bev_col[bev_valid].astype(np.int64)
    time_offset_s = times - camera_time

    def summarize(labels):
        output = {}
        for label in np.unique(labels):
            selected = labels == label
            scored = selected & np.isfinite(residual)
            values = residual[scored]
            output[str(label)] = {
                "input_count": int(selected.sum()),
                "projected_count": int((selected & valid).sum()),
                "visible_count": int((selected & visible).sum()),
                "residual_count": int(len(values)),
                "median_edge_residual_px": (
                    float(np.median(values)) if len(values) else None
                ),
                "p95_edge_residual_px": (
                    float(np.percentile(values, 95)) if len(values) else None
                ),
            }
        return output

    range_band = np.where(
        np.isfinite(range_m),
        np.select(
            [range_m < 20.0, range_m < 50.0],
            ["0-20m", "20-50m"], default="50m+"
        ),
        "unsupported",
    )
    motion_band = np.where(
        np.isfinite(motion_m),
        np.select(
            [motion_m < 0.1, motion_m < 0.5],
            ["0-0.1m", "0.1-0.5m"], default="0.5m+"
        ),
        "unsupported",
    )
    time_band = np.where(
        np.isfinite(time_offset_s),
        np.select(
            [np.abs(time_offset_s) < 0.02, np.abs(time_offset_s) < 0.05],
            ["0-20ms", "20-50ms"], default="50ms+"
        ),
        "unsupported",
    )
    return {
        "uv": uv, "depth_m": z, "valid": valid, "visible": visible,
        "edge_residual_px": residual, "range_m": range_m,
        "image_quadrant": region, "ego_motion_m": motion_m,
        "xyz_ego_at_image_time_m": pe,
        "bev_index_row_x_col_y": bev_index, "bev_valid": bev_valid,
        "bev_origin_xy_m": bev_origin, "bev_resolution_m": bev_resolution_m,
        "slice_summary": {
            "range": summarize(range_band),
            "image_quadrant": summarize(region.astype(str)),
            "ego_motion": summarize(motion_band),
            "absolute_time_offset": summarize(time_band),
        },
        "point_to_camera_time_offset_s": time_offset_s,
        "point_time_s": times, "metadata": metadata,
        "injected_time_offset_s": injected_time_offset_s,
    }`,
        walkthrough: [
          "Deskew each return through world coordinates from its own timestamp to the camera timestamp; never hide this timing assumption.",
          "Project with an optional injected time or extrinsic fault, then z-buffer collisions so only visible returns score alignment.",
          "Project the same deskewed evidence into an x-forward/y-left BEV and report residual counts, median, and p95 by range, image region, motion, and time."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3, OpenCV 4, and the C++ standard library
#include <Eigen/Dense>
#include <opencv2/core.hpp>
#include <algorithm>
#include <cmath>
#include <functional>
#include <limits>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>

struct AuditPoint {
  Eigen::Vector3d xyz_lidar_m;
  double time_s = 0.0;
  float intensity = 0.0f;
  int ring = -1;
  int return_id = -1;
};

struct AuditRow {
  Eigen::Vector2d uv = Eigen::Vector2d::Constant(
      std::numeric_limits<double>::quiet_NaN());
  double depth_m = std::numeric_limits<double>::quiet_NaN();
  double edge_residual_px = std::numeric_limits<double>::quiet_NaN();
  double range_m = 0.0;
  double ego_motion_m = std::numeric_limits<double>::quiet_NaN();
  double point_to_camera_time_offset_s =
      std::numeric_limits<double>::quiet_NaN();
  Eigen::Vector3d xyz_ego_at_image_time_m = Eigen::Vector3d::Constant(
      std::numeric_limits<double>::quiet_NaN());
  int bev_row_x = -1;
  int bev_col_y = -1;
  int quadrant = -1;
  bool valid = false;
  bool visible = false;
  bool bev_valid = false;
  AuditPoint source;
};
struct SliceStats {
  int input_count = 0;
  int projected_count = 0;
  int visible_count = 0;
  int residual_count = 0;
  double median_edge_residual_px =
      std::numeric_limits<double>::quiet_NaN();
  double p95_edge_residual_px =
      std::numeric_limits<double>::quiet_NaN();
};
struct AuditResult {
  std::vector<AuditRow> rows;
  std::map<std::string, SliceStats> slice_summary;
};

double bilinearAt(const cv::Mat& image32f, double u, double v) {
  const int x0 = static_cast<int>(std::floor(u));
  const int y0 = static_cast<int>(std::floor(v));
  const int x1 = std::min(x0 + 1, image32f.cols - 1);
  const int y1 = std::min(y0 + 1, image32f.rows - 1);
  if (x0 < 0 || y0 < 0 || x1 >= image32f.cols || y1 >= image32f.rows) {
    return std::numeric_limits<double>::quiet_NaN();
  }
  const double ax = u - x0, ay = v - y0;
  return (1 - ax) * (1 - ay) * image32f.at<float>(y0, x0)
       + ax * (1 - ay) * image32f.at<float>(y0, x1)
       + (1 - ax) * ay * image32f.at<float>(y1, x0)
       + ax * ay * image32f.at<float>(y1, x1);
}

AuditResult fusionAlignmentAudit(
    const std::vector<AuditPoint>& returns,
    const std::function<Eigen::Matrix4d(double)>& pose_world_ego,
    const Eigen::Matrix4d& T_ego_lidar,
    const Eigen::Matrix4d& T_cam_ego,
    const Eigen::Matrix3d& K,
    double image_time_s, const cv::Mat& distance_to_edge_px,
    const Eigen::Vector2d& bev_origin_xy_m,
    double bev_resolution_m, int bev_rows_x, int bev_cols_y,
    double injected_time_offset_s = 0.0,
    const Eigen::Matrix4d& T_injected_cam = Eigen::Matrix4d::Identity(),
    double visibility_tolerance_m = 0.05) {
  if (distance_to_edge_px.type() != CV_32F ||
      !T_ego_lidar.allFinite() || !T_cam_ego.allFinite() || !K.allFinite() ||
      !bev_origin_xy_m.allFinite() || !std::isfinite(bev_resolution_m) ||
      bev_resolution_m <= 0.0 || bev_rows_x <= 0 || bev_cols_y <= 0) {
    throw std::invalid_argument("invalid calibration, distance map, or BEV grid");
  }
  const double tc = image_time_s + injected_time_offset_s;
  const Eigen::Matrix4d T_world_ego_camera = pose_world_ego(tc);
  const Eigen::Matrix4d T_ego_camera_world =
      T_world_ego_camera.inverse();
  const Eigen::Matrix4d T_cam_world =
      T_injected_cam * T_cam_ego * T_ego_camera_world;
  AuditResult result;
  result.rows.resize(returns.size());
  std::map<std::pair<int, int>, double> z_buffer;

  for (int i = 0; i < static_cast<int>(returns.size()); ++i) {
    AuditRow& row = result.rows[i];
    row.source = returns[i];
    row.range_m = returns[i].xyz_lidar_m.norm();
    row.point_to_camera_time_offset_s = returns[i].time_s - tc;
    if (!returns[i].xyz_lidar_m.allFinite() || !std::isfinite(returns[i].time_s)) continue;
    const Eigen::Matrix4d T_world_ego_point = pose_world_ego(returns[i].time_s);
    // Per-return transport into world deskews motion before projection at camera time.
    const Eigen::Vector4d pw = T_world_ego_point * T_ego_lidar *
        Eigen::Vector4d(returns[i].xyz_lidar_m.x(), returns[i].xyz_lidar_m.y(),
                        returns[i].xyz_lidar_m.z(), 1.0);
    const Eigen::Vector3d pc = (T_cam_world * pw).head<3>();
    row.xyz_ego_at_image_time_m =
        (T_ego_camera_world * pw).head<3>();
    row.ego_motion_m =
        (T_world_ego_point.block<3, 1>(0, 3) -
         T_world_ego_camera.block<3, 1>(0, 3)).norm();
    if (row.xyz_ego_at_image_time_m.allFinite()) {
      row.bev_row_x = static_cast<int>(std::floor(
          (row.xyz_ego_at_image_time_m.x() - bev_origin_xy_m.x()) /
          bev_resolution_m));
      row.bev_col_y = static_cast<int>(std::floor(
          (row.xyz_ego_at_image_time_m.y() - bev_origin_xy_m.y()) /
          bev_resolution_m));
      row.bev_valid = row.bev_row_x >= 0 && row.bev_row_x < bev_rows_x &&
          row.bev_col_y >= 0 && row.bev_col_y < bev_cols_y;
    }
    if (!pc.allFinite() || pc.z() <= 1e-9) continue;
    const Eigen::Vector3d q = K * pc;
    const double u = q.x() / q.z(), v = q.y() / q.z();
    if (u < 0 || u > distance_to_edge_px.cols - 1 ||
        v < 0 || v > distance_to_edge_px.rows - 1) continue;
    row.uv = Eigen::Vector2d(u, v);
    row.depth_m = pc.z();
    row.valid = true;
    row.quadrant = (u >= distance_to_edge_px.cols / 2.0)
                     + 2 * (v >= distance_to_edge_px.rows / 2.0);
    const auto key = std::make_pair(static_cast<int>(std::lround(u)),
                                    static_cast<int>(std::lround(v)));
    auto it = z_buffer.find(key);
    if (it == z_buffer.end()) z_buffer[key] = pc.z();
    else it->second = std::min(it->second, pc.z());
  }

  for (AuditRow& row : result.rows) {
    if (!row.valid) continue;
    const auto key = std::make_pair(static_cast<int>(std::lround(row.uv.x())),
                                    static_cast<int>(std::lround(row.uv.y())));
    // Only the nearest return at a pixel contributes an image alignment residual.
    row.visible = row.depth_m <= z_buffer.at(key) + visibility_tolerance_m;
    if (row.visible) row.edge_residual_px =
        bilinearAt(distance_to_edge_px, row.uv.x(), row.uv.y());
  }
  std::map<std::string, std::vector<double>> residuals;
  const auto add = [&](const std::string& key, const AuditRow& row) {
    SliceStats& stats = result.slice_summary[key];
    ++stats.input_count;
    if (row.valid) ++stats.projected_count;
    if (row.visible) ++stats.visible_count;
    if (std::isfinite(row.edge_residual_px)) {
      residuals[key].push_back(row.edge_residual_px);
      ++stats.residual_count;
    }
  };
  for (const AuditRow& row : result.rows) {
    const std::string range = !std::isfinite(row.range_m) ? "unsupported"
        : row.range_m < 20.0 ? "0-20m"
        : row.range_m < 50.0 ? "20-50m" : "50m+";
    const std::string motion = !std::isfinite(row.ego_motion_m) ? "unsupported"
        : row.ego_motion_m < 0.1 ? "0-0.1m"
        : row.ego_motion_m < 0.5 ? "0.1-0.5m" : "0.5m+";
    const double age = std::abs(row.point_to_camera_time_offset_s);
    const std::string time = !std::isfinite(age) ? "unsupported"
        : age < 0.02 ? "0-20ms" : age < 0.05 ? "20-50ms" : "50ms+";
    add("range/" + range, row);
    add("image_quadrant/" + std::to_string(row.quadrant), row);
    add("ego_motion/" + motion, row);
    add("absolute_time_offset/" + time, row);
  }
  for (auto& [key, values] : residuals) {
    std::sort(values.begin(), values.end());
    const std::size_t middle = values.size() / 2;
    result.slice_summary[key].median_edge_residual_px =
        values.size() % 2 ? values[middle]
                          : 0.5 * (values[middle - 1] + values[middle]);
    const std::size_t p95 = static_cast<std::size_t>(
        std::ceil(0.95 * values.size())) - 1;
    result.slice_summary[key].p95_edge_residual_px = values[p95];
  }
  return result;
}`,
        walkthrough: [
          "Use each LiDAR return time and the camera time to transport the point through a common world frame.",
          "Apply explicit time/extrinsic fault parameters, project, and build a nearest-depth visibility test.",
          "Project into x-forward/y-left BEV and return metadata-rich rows plus support, median, and p95 residuals by range, quadrant, motion, and time."
        ]
      }
    },
    {
      id: "auto-lidar-cloud",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def spherical_returns_to_cloud(range_m, azimuth_rad, elevation_rad,
                               intensity=None, return_id=None,
                               time_offset_s=None, min_range_m=0.1,
                               max_range_m=300.0):
    """Convert [ring, azimuth] returns to x-forward/y-left/z-up LiDAR XYZ."""
    ranges = np.asarray(range_m, np.float64)
    az = np.asarray(azimuth_rad, np.float64)
    el = np.asarray(elevation_rad, np.float64)
    if ranges.ndim != 2 or az.shape != (ranges.shape[1],):
        raise ValueError("range must be RxA and azimuth must have A values")
    if el.shape != (ranges.shape[0],):
        raise ValueError("one elevation angle is required per ring")
    rr, aa = ranges.shape
    AZ = np.broadcast_to(az[None, :], (rr, aa))
    EL = np.broadcast_to(el[:, None], (rr, aa))

    # Positive azimuth rotates from x-forward toward y-left; elevation is positive up.
    cos_el = np.cos(EL)
    xyz = np.stack((
        ranges * cos_el * np.cos(AZ),
        ranges * cos_el * np.sin(AZ),
        ranges * np.sin(EL),
    ), axis=-1)
    valid = np.isfinite(ranges) & (ranges >= min_range_m) & (ranges <= max_range_m)
    valid &= np.isfinite(xyz).all(-1)

    def field_or_default(value, default, dtype):
        if value is None:
            return np.full((rr, aa), default, dtype=dtype)
        arr = np.asarray(value, dtype=dtype)
        return np.broadcast_to(arr, (rr, aa))

    # Keep sensor evidence beside XYZ; dropping timing/ring data prevents later deskew.
    ring = np.broadcast_to(np.arange(rr)[:, None], (rr, aa))
    output = {
        "xyz_lidar_m": xyz[valid],
        "range_m": ranges[valid],
        "azimuth_rad": AZ[valid],
        "elevation_rad": EL[valid],
        "intensity": field_or_default(intensity, np.nan, np.float32)[valid],
        "ring": ring[valid].astype(np.int32),
        "return_id": field_or_default(return_id, -1, np.int16)[valid],
        "time_offset_s": field_or_default(time_offset_s, np.nan, np.float64)[valid],
        "valid_mask": valid,
        "frame": "lidar_x_forward_y_left_z_up",
    }
    return output`,
        walkthrough: [
          "Declare angle units and the LiDAR axis convention before applying the spherical-to-Cartesian equations.",
          "Filter invalid and out-of-range returns without losing the original dense validity mask.",
          "Preserve intensity, ring, return number, and per-return time because later fusion and deskew depend on them."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <vector>

struct SphericalReturn {
  double range_m = 0.0;
  double azimuth_rad = 0.0;
  double elevation_rad = 0.0;
  float intensity = std::numeric_limits<float>::quiet_NaN();
  int ring = -1;
  int return_id = -1;
  double time_offset_s = std::numeric_limits<double>::quiet_NaN();
};

struct LidarPoint {
  Eigen::Vector3d xyz_lidar_m;
  SphericalReturn source;
};

struct LidarCloud {
  std::vector<LidarPoint> points;
  std::vector<unsigned char> valid_mask;
};

LidarCloud sphericalReturnsToCloud(const std::vector<SphericalReturn>& returns,
                                   double min_range_m = 0.1,
                                   double max_range_m = 300.0) {
  if (min_range_m < 0.0 || max_range_m <= min_range_m) {
    throw std::invalid_argument("invalid range limits");
  }
  LidarCloud out;
  out.valid_mask.assign(returns.size(), 0);
  for (int i = 0; i < static_cast<int>(returns.size()); ++i) {
    const auto& s = returns[i];
    if (!std::isfinite(s.range_m) || !std::isfinite(s.azimuth_rad) ||
        !std::isfinite(s.elevation_rad) ||
        s.range_m < min_range_m || s.range_m > max_range_m) continue;

    // Frame L is x-forward, y-left, z-up; positive azimuth turns toward the left.
    const double ce = std::cos(s.elevation_rad);
    Eigen::Vector3d p(s.range_m * ce * std::cos(s.azimuth_rad),
                      s.range_m * ce * std::sin(s.azimuth_rad),
                      s.range_m * std::sin(s.elevation_rad));
    if (!p.allFinite()) continue;
    // The original return is retained so ring/time/intensity survive cloud generation.
    out.points.push_back(LidarPoint{p, s});
    out.valid_mask[i] = 1;
  }
  return out;
}`,
        walkthrough: [
          "Validate metric range and radian angles before computing trigonometry.",
          "Convert using an explicit x-forward, y-left, z-up sign convention.",
          "Attach the entire sensor return to each XYZ point and retain input validity."
        ]
      }
    }
  );

  solutions.push(
    {
      id: "auto-stereo-cloud",
      python: {
        code: `# Dependencies: NumPy and OpenCV
import cv2
import numpy as np


def stereo_to_cloud(disparity_left_px, disparity_right_px, K, baseline_m,
                    disparity_sigma_px=0.5, lr_threshold_px=1.0,
                    right_disparity_convention="left_minus_right",
                    color_left=None):
    """Reconstruct a rectified left-camera cloud from positive disparity."""
    dl = np.asarray(disparity_left_px, np.float64)
    dr = np.asarray(disparity_right_px, np.float64)
    K = np.asarray(K, np.float64)
    if dl.shape != dr.shape or dl.ndim != 2:
        raise ValueError("disparities must share an HxW shape")
    if K.shape != (3, 3) or not np.isfinite(K).all():
        raise ValueError("K must be a finite 3x3 intrinsic matrix")
    if baseline_m <= 0 or disparity_sigma_px < 0 or lr_threshold_px < 0:
        raise ValueError("baseline must be positive; uncertainty and gate non-negative")
    if right_disparity_convention not in {
        "left_minus_right", "right_minus_left"
    }:
        raise ValueError("declare whether right disparity is positive or signed")
    h, w = dl.shape
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    u_right = u - dl

    # Rectified correspondence lies on the same row at u_right = u_left - disparity.
    sampled_right = cv2.remap(
        dr.astype(np.float32), u_right.astype(np.float32), v.astype(np.float32),
        cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    ).astype(np.float64)
    # Canonicalize common APIs to d = u_left - u_right before comparison.
    sampled_right_canonical = (
        sampled_right if right_disparity_convention == "left_minus_right"
        else -sampled_right
    )
    lr_error = np.abs(dl - sampled_right_canonical)
    candidate = np.isfinite(dl) & (dl > 0.0)
    right_supported = (
        np.isfinite(sampled_right) & (u_right >= 0) & (u_right <= w - 1)
    )
    consistent = right_supported & (lr_error <= lr_threshold_px)
    occluded_or_mismatched = candidate & ~consistent
    valid = candidate & consistent

    fx, fy, cx, cy = K[0, 0], K[1, 1], K[0, 2], K[1, 2]
    if fx <= 0 or fy <= 0:
        raise ValueError("focal lengths must be positive")
    Z = np.full_like(dl, np.nan)
    Z[valid] = fx * baseline_m / dl[valid]
    X = (u - cx) * Z / fx
    Y = (v - cy) * Z / fy
    xyz = np.stack((X, Y, Z), axis=-1)

    # First-order propagation shows depth uncertainty grows quadratically with range.
    sigma_z = np.full_like(dl, np.inf)
    sigma_z[valid] = fx * baseline_m * disparity_sigma_px / (dl[valid] ** 2)
    confidence = np.zeros_like(dl)
    confidence[valid] = np.exp(-lr_error[valid] / max(lr_threshold_px, 1e-9))
    pixels = np.stack((u, v), axis=-1)
    result = {
        "xyz_left_camera_m": xyz[valid],
        "pixels_uv": pixels[valid].astype(np.int32),
        "sigma_z_m": sigma_z[valid],
        "confidence": confidence[valid],
        "valid_mask": valid,
        "occluded_or_mismatched_mask": occluded_or_mismatched,
        "left_right_error_px": lr_error,
        "frame": "rectified_left_camera",
    }
    if color_left is not None:
        color = np.asarray(color_left)
        if color.shape[:2] != dl.shape:
            raise ValueError("color image must align with left disparity")
        result["color"] = color[valid]
    return result`,
        walkthrough: [
          "Declare the right-disparity sign convention, canonicalize it, and use u_right = u_left minus left disparity.",
          "Reject invalid disparity and left-right inconsistency before applying Z = focal_length times baseline divided by disparity.",
          "Propagate disparity noise to depth uncertainty and retain pixels, confidence, occlusion state, and optional color."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3, OpenCV 4, and the C++ standard library
#include <Eigen/Dense>
#include <opencv2/core.hpp>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <vector>

struct StereoPoint {
  Eigen::Vector3d xyz_left_camera_m;
  Eigen::Vector2i pixel_uv;
  double sigma_z_m = 0.0;
  double confidence = 0.0;
};

struct StereoCloud {
  std::vector<StereoPoint> points;
  cv::Mat valid;
  cv::Mat occluded_or_mismatched;
  cv::Mat left_right_error_px;
};
enum class RightDisparityConvention {
  LeftMinusRightPositive,
  RightMinusLeftSigned
};

double sampleDisparity(const cv::Mat& d, double u, int v) {
  if (v < 0 || v >= d.rows || u < 0.0 || u > d.cols - 1.0) {
    return std::numeric_limits<double>::quiet_NaN();
  }
  const int x0 = static_cast<int>(std::floor(u));
  const int x1 = std::min(x0 + 1, d.cols - 1);
  const double a = u - x0;
  return (1.0 - a) * d.at<double>(v, x0) + a * d.at<double>(v, x1);
}

StereoCloud stereoToCloud(const cv::Mat& disparity_left_px,
                          const cv::Mat& disparity_right_px,
                          const Eigen::Matrix3d& K, double baseline_m,
                          double disparity_sigma_px = 0.5,
                          double lr_threshold_px = 1.0,
                          RightDisparityConvention right_convention =
                              RightDisparityConvention::LeftMinusRightPositive) {
  if (disparity_left_px.type() != CV_64F ||
      disparity_right_px.type() != CV_64F ||
      disparity_left_px.size() != disparity_right_px.size() ||
      !K.allFinite() || K(0, 0) <= 0.0 || K(1, 1) <= 0.0 ||
      baseline_m <= 0.0 || disparity_sigma_px < 0.0 ||
      lr_threshold_px < 0.0) {
    throw std::invalid_argument(
        "use aligned CV_64F disparity, finite positive intrinsics/baseline, "
        "and non-negative uncertainty/gate");
  }
  StereoCloud out;
  out.valid = cv::Mat(disparity_left_px.size(), CV_8U, cv::Scalar(0));
  out.occluded_or_mismatched =
      cv::Mat(disparity_left_px.size(), CV_8U, cv::Scalar(0));
  out.left_right_error_px =
      cv::Mat(disparity_left_px.size(), CV_64F,
              cv::Scalar(std::numeric_limits<double>::quiet_NaN()));

  const double fx = K(0, 0), fy = K(1, 1);
  const double cx = K(0, 2), cy = K(1, 2);
  for (int v = 0; v < disparity_left_px.rows; ++v) {
    for (int u = 0; u < disparity_left_px.cols; ++u) {
      const double dl = disparity_left_px.at<double>(v, u);
      if (!std::isfinite(dl) || dl <= 0.0) continue;
      // Rectification constrains the match to the same row in the right image.
      const double ur = u - dl;
      const double dr = sampleDisparity(disparity_right_px, ur, v);
      if (!std::isfinite(dr)) {
        out.occluded_or_mismatched.at<unsigned char>(v, u) = 255;
        continue;
      }
      // Canonical disparity is u_left-u_right; some right matchers store -d.
      const double canonical_dr =
          right_convention == RightDisparityConvention::LeftMinusRightPositive
          ? dr : -dr;
      const double error = std::abs(dl - canonical_dr);
      out.left_right_error_px.at<double>(v, u) = error;
      if (error > lr_threshold_px) {
        out.occluded_or_mismatched.at<unsigned char>(v, u) = 255;
        continue;
      }

      const double z = fx * baseline_m / dl;
      Eigen::Vector3d p((u - cx) * z / fx, (v - cy) * z / fy, z);
      if (!p.allFinite()) continue;
      // sigma_Z = |dZ/dd| sigma_d exposes far-range stereo uncertainty.
      const double sigma_z =
          fx * baseline_m * disparity_sigma_px / (dl * dl);
      const double confidence =
          std::exp(-error / std::max(lr_threshold_px, 1e-9));
      out.points.push_back({p, Eigen::Vector2i(u, v), sigma_z, confidence});
      out.valid.at<unsigned char>(v, u) = 255;
    }
  }
  return out;
}`,
        walkthrough: [
          "Sample at the rectified correspondence and canonicalize the right matcher’s positive-magnitude or signed convention.",
          "Convert only consistent positive disparity into the rectified left-camera frame.",
          "Attach an analytic depth uncertainty and dense failure masks to the sparse valid cloud."
        ]
      }
    },
    {
      id: "auto-lidar-deskew",
      python: {
        code: `# Dependencies: NumPy and SciPy
import numpy as np
from scipy.spatial.transform import Rotation, Slerp


def _interpolate_pose(t, trajectory_time_s, T_world_ego, max_gap_s):
    times = np.asarray(trajectory_time_s, np.float64)
    poses = np.asarray(T_world_ego, np.float64)
    if (
        not np.isfinite(t) or not np.isfinite(max_gap_s) or max_gap_s <= 0
        or len(times) < 2 or not np.isfinite(times).all()
        or not np.isfinite(poses).all()
    ):
        return None
    if t < times[0] or t > times[-1]:
        return None
    exact = np.flatnonzero(np.isclose(times, t, rtol=0.0, atol=1e-12))
    if len(exact):
        return poses[exact[0]]
    j = int(np.searchsorted(times, t, side="right"))
    i = j - 1
    gap = times[j] - times[i]
    if gap <= 0.0 or gap > max_gap_s:
        return None
    alpha = (t - times[i]) / gap
    rotation = Slerp(
        [0.0, 1.0],
        Rotation.from_matrix(np.stack((poses[i, :3, :3], poses[j, :3, :3]))),
    )([alpha]).as_matrix()[0]
    translation = (1.0 - alpha) * poses[i, :3, 3] + alpha * poses[j, :3, 3]
    result = np.eye(4)
    result[:3, :3] = rotation
    result[:3, 3] = translation
    return result


def deskew_lidar(points_lidar_m, point_time_s, reference_time_s,
                 trajectory_time_s, T_world_ego, T_ego_lidar,
                 metadata=None, max_pose_gap_s=0.1):
    """Deskew returns into ego frame E_ref at reference_time_s."""
    points = np.asarray(points_lidar_m, np.float64)
    point_times = np.asarray(point_time_s, np.float64)
    trajectory_times = np.asarray(trajectory_time_s, np.float64)
    poses = np.asarray(T_world_ego, np.float64)
    if points.shape != (len(point_times), 3):
        raise ValueError("points and per-return time must align")
    if poses.shape != (len(trajectory_times), 4, 4):
        raise ValueError("trajectory poses must be Mx4x4")
    if (
        len(trajectory_times) < 2
        or not np.isfinite(trajectory_times).all()
        or not np.isfinite(poses).all()
        or np.any(np.diff(trajectory_times) <= 0)
        or np.asarray(T_ego_lidar).shape != (4, 4)
        or not np.isfinite(T_ego_lidar).all()
        or not np.isfinite(reference_time_s)
        or not np.isfinite(max_pose_gap_s) or max_pose_gap_s <= 0
    ):
        raise ValueError("poses/transforms/times must be finite, valid, and ordered")

    T_world_ego_ref = _interpolate_pose(
        reference_time_s, trajectory_times, poses, max_pose_gap_s
    )
    if T_world_ego_ref is None:
        raise ValueError("reference time is outside a supported pose interval")
    T_ego_ref_world = np.linalg.inv(T_world_ego_ref)
    output = np.full_like(points, np.nan)
    valid = np.zeros(len(points), dtype=bool)
    for i, (point_l, t) in enumerate(zip(points, point_times)):
        if not np.isfinite(point_l).all() or not np.isfinite(t):
            continue
        T_world_ego_t = _interpolate_pose(t, trajectory_times, poses, max_pose_gap_s)
        if T_world_ego_t is None:
            continue
        # L(t) -> E(t) -> W -> E(reference); this direction prevents inverse-order bugs.
        point_ref = (
            T_ego_ref_world @ T_world_ego_t @ T_ego_lidar
            @ np.r_[point_l, 1.0]
        )[:3]
        if np.isfinite(point_ref).all():
            output[i] = point_ref
            valid[i] = True

    return {
        "xyz_ego_reference_m": output,
        "valid_mask": valid,
        "point_time_s": point_times,
        "reference_time_s": reference_time_s,
        "metadata": {} if metadata is None else metadata,
        "frame": "ego_at_reference_time",
    }`,
        walkthrough: [
          "Interpolate translation linearly and rotation on SO(3) with quaternion slerp; reject extrapolation and large pose gaps.",
          "For each return, compose LiDAR-at-return-time to world to ego-at-reference-time in a written frame order.",
          "Keep invalid points and sensor metadata aligned with the input rather than silently shortening the sweep."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <Eigen/Geometry>
#include <algorithm>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <vector>

struct TimedLidarPoint {
  Eigen::Vector3d xyz_lidar_m;
  double time_s = 0.0;
  float intensity = 0.0f;
  int ring = -1;
};

struct DeskewedSweep {
  std::vector<Eigen::Vector3d> xyz_ego_reference_m;
  std::vector<unsigned char> valid;
  std::vector<TimedLidarPoint> source;
  double reference_time_s = 0.0;
};

bool interpolatePose(double t, const std::vector<double>& times,
                     const std::vector<Eigen::Matrix4d>& T_world_ego,
                     double max_gap_s, Eigen::Matrix4d* out) {
  if (!out || !std::isfinite(t) || !std::isfinite(max_gap_s) ||
      max_gap_s <= 0.0 || times.size() != T_world_ego.size() ||
      times.size() < 2) return false;
  if (t < times.front() || t > times.back()) return false;
  if (std::abs(t - times.front()) <= 1e-12) {
    *out = T_world_ego.front();
    return true;
  }
  if (std::abs(t - times.back()) <= 1e-12) {
    *out = T_world_ego.back();
    return true;
  }
  const auto upper = std::upper_bound(times.begin(), times.end(), t);
  const int j = static_cast<int>(upper - times.begin());
  const int i = j - 1;
  const double gap = times[j] - times[i];
  if (gap <= 0.0 || gap > max_gap_s) return false;
  const double a = (t - times[i]) / gap;

  // Quaternion slerp follows SO(3); linear matrix interpolation would leave rotation space.
  Eigen::Quaterniond q0(T_world_ego[i].block<3, 3>(0, 0));
  Eigen::Quaterniond q1(T_world_ego[j].block<3, 3>(0, 0));
  Eigen::Quaterniond q = q0.normalized().slerp(a, q1.normalized());
  out->setIdentity();
  out->block<3, 3>(0, 0) = q.normalized().toRotationMatrix();
  out->block<3, 1>(0, 3) =
      (1.0 - a) * T_world_ego[i].block<3, 1>(0, 3)
      + a * T_world_ego[j].block<3, 1>(0, 3);
  return true;
}

DeskewedSweep deskewLidar(
    const std::vector<TimedLidarPoint>& points,
    double reference_time_s,
    const std::vector<double>& trajectory_time_s,
    const std::vector<Eigen::Matrix4d>& T_world_ego,
    const Eigen::Matrix4d& T_ego_lidar,
    double max_pose_gap_s = 0.1) {
  if (trajectory_time_s.size() != T_world_ego.size() ||
      trajectory_time_s.size() < 2 ||
      !std::isfinite(reference_time_s) ||
      !std::isfinite(max_pose_gap_s) || max_pose_gap_s <= 0.0 ||
      !T_ego_lidar.allFinite() ||
      !std::is_sorted(trajectory_time_s.begin(), trajectory_time_s.end())) {
    throw std::invalid_argument("trajectory, transforms, and times must be valid");
  }
  for (int i = 0; i < static_cast<int>(trajectory_time_s.size()); ++i) {
    if (!std::isfinite(trajectory_time_s[i]) ||
        !T_world_ego[i].allFinite() ||
        (i > 0 && trajectory_time_s[i] <= trajectory_time_s[i - 1])) {
      throw std::invalid_argument("trajectory samples must be finite and ordered");
    }
  }
  Eigen::Matrix4d T_world_ego_ref;
  if (!interpolatePose(reference_time_s, trajectory_time_s, T_world_ego,
                       max_pose_gap_s, &T_world_ego_ref)) {
    throw std::invalid_argument("unsupported reference time");
  }

  DeskewedSweep out;
  out.reference_time_s = reference_time_s;
  out.source = points;
  out.valid.assign(points.size(), 0);
  out.xyz_ego_reference_m.assign(
      points.size(), Eigen::Vector3d::Constant(
          std::numeric_limits<double>::quiet_NaN()));
  const Eigen::Matrix4d T_ego_ref_world = T_world_ego_ref.inverse();
  for (int i = 0; i < static_cast<int>(points.size()); ++i) {
    Eigen::Matrix4d T_world_ego_t;
    if (!points[i].xyz_lidar_m.allFinite() ||
        !interpolatePose(points[i].time_s, trajectory_time_s, T_world_ego,
                         max_pose_gap_s, &T_world_ego_t)) continue;
    // Explicit chain: L(t) -> E(t) -> W -> E(reference).
    const Eigen::Vector4d pref = T_ego_ref_world * T_world_ego_t * T_ego_lidar *
        Eigen::Vector4d(points[i].xyz_lidar_m.x(), points[i].xyz_lidar_m.y(),
                        points[i].xyz_lidar_m.z(), 1.0);
    if (!pref.head<3>().allFinite()) continue;
    out.xyz_ego_reference_m[i] = pref.head<3>();
    out.valid[i] = 1;
  }
  return out;
}`,
        walkthrough: [
          "Bracket every return time with trajectory poses and reject extrapolation or large gaps.",
          "Interpolate translation and quaternion rotation, then compose the named transform chain.",
          "Return an aligned validity array and retain each original timed return for later diagnosis."
        ]
      }
    },
    {
      id: "auto-icp-point-plane",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def _skew(v):
    return np.array([[0.0, -v[2], v[1]],
                     [v[2], 0.0, -v[0]],
                     [-v[1], v[0], 0.0]])


def _rotation_exp(omega):
    theta = np.linalg.norm(omega)
    if theta < 1e-12:
        return np.eye(3) + _skew(omega)
    axis = omega / theta
    K = _skew(axis)
    return np.eye(3) + np.sin(theta) * K + (1.0 - np.cos(theta)) * (K @ K)


def point_to_plane_icp(source_m, target_m, target_normals,
                       initial_T_target_source=None,
                       distance_levels_m=(1.0, 0.3),
                       huber_delta_m=0.1, iterations_per_level=15,
                       min_inliers=20, condition_limit=1e8):
    """Robust coarse-to-fine ICP; returns T_target_source."""
    source = np.asarray(source_m, np.float64)
    target = np.asarray(target_m, np.float64)
    normals = np.asarray(target_normals, np.float64)
    if source.ndim != 2 or source.shape[1] != 3 or target.shape != normals.shape:
        raise ValueError("source, target, normals must be Nx3 arrays")
    T = np.eye(4) if initial_T_target_source is None else np.array(
        initial_T_target_source, np.float64, copy=True
    )
    report = {"converged": False, "degenerate": False}

    for gate in distance_levels_m:
        for iteration in range(iterations_per_level):
            x = (T[:3, :3] @ source.T).T + T[:3, 3]
            # Brute-force nearest neighbor is exact for this reference; a KD-tree changes speed only.
            distance2 = ((x[:, None, :] - target[None, :, :]) ** 2).sum(2)
            nearest = np.argmin(distance2, axis=1)
            d = np.sqrt(distance2[np.arange(len(x)), nearest])
            q, n = target[nearest], normals[nearest]
            n_norm = np.linalg.norm(n, axis=1)
            valid = np.isfinite(x).all(1) & np.isfinite(q).all(1)
            valid &= np.isfinite(n).all(1) & (n_norm > 1e-9) & (d < gate)
            if valid.sum() < min_inliers:
                report.update({"degenerate": True, "reason": "too_few_inliers"})
                return T, report

            xv, qv = x[valid], q[valid]
            nv = n[valid] / n_norm[valid, None]
            residual = np.einsum("ij,ij->i", nv, xv - qv)
            weight = np.ones_like(residual)
            large = np.abs(residual) > huber_delta_m
            weight[large] = huber_delta_m / np.abs(residual[large])
            J = np.c_[np.cross(xv, nv), nv]
            sw = np.sqrt(weight)
            A = J * sw[:, None]
            b = -residual * sw
            H = A.T @ A
            eigenvalues = np.linalg.eigvalsh(H)
            condition = eigenvalues[-1] / max(eigenvalues[0], 1e-15)
            if eigenvalues[0] < 1e-10 or condition > condition_limit:
                report.update({"degenerate": True, "condition": condition})
                return T, report

            delta = np.linalg.solve(H, A.T @ b)
            dT = np.eye(4)
            dT[:3, :3] = _rotation_exp(delta[:3])
            dT[:3, 3] = delta[3:]
            # Left perturbation is consistent with J=[x cross n, n].
            T = dT @ T
            report = {
                "converged": np.linalg.norm(delta) < 1e-6,
                "degenerate": False,
                "level_gate_m": gate,
                "iteration": iteration + 1,
                "inliers": int(valid.sum()),
                "rmse_m": float(np.sqrt(np.mean(residual ** 2))),
                "condition": float(condition),
            }
            if report["converged"]:
                break
    return T, report`,
        walkthrough: [
          "Transform source points, find gated nearest target points, and form signed residuals along target normals.",
          "Use Huber weights and the point-to-plane Jacobian for a small left-multiplicative SE(3) update.",
          "Run wide-to-tight correspondence gates and report inliers, RMSE, conditioning, convergence, and degeneracy."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <vector>

struct IcpReport {
  bool converged = false;
  bool degenerate = false;
  int inliers = 0;
  int iterations = 0;
  double rmse_m = std::numeric_limits<double>::quiet_NaN();
  double condition = std::numeric_limits<double>::infinity();
};

Eigen::Matrix3d rotationExp(const Eigen::Vector3d& w) {
  const double theta = w.norm();
  Eigen::Matrix3d W;
  W << 0.0, -w.z(), w.y(), w.z(), 0.0, -w.x(), -w.y(), w.x(), 0.0;
  if (theta < 1e-12) return Eigen::Matrix3d::Identity() + W;
  return Eigen::Matrix3d::Identity()
      + std::sin(theta) / theta * W
      + (1.0 - std::cos(theta)) / (theta * theta) * W * W;
}

std::pair<Eigen::Matrix4d, IcpReport> pointToPlaneIcp(
    const std::vector<Eigen::Vector3d>& source_m,
    const std::vector<Eigen::Vector3d>& target_m,
    const std::vector<Eigen::Vector3d>& target_normals,
    Eigen::Matrix4d T_target_source = Eigen::Matrix4d::Identity(),
    const std::vector<double>& distance_levels_m = {1.0, 0.3},
    double huber_delta_m = 0.1, int iterations_per_level = 15,
    int min_inliers = 20, double condition_limit = 1e8) {
  if (source_m.empty() || target_m.size() != target_normals.size()) {
    throw std::invalid_argument("invalid ICP clouds or normals");
  }
  IcpReport report;
  for (double gate : distance_levels_m) {
    for (int iter = 0; iter < iterations_per_level; ++iter) {
      Eigen::Matrix<double, 6, 6> H =
          Eigen::Matrix<double, 6, 6>::Zero();
      Eigen::Matrix<double, 6, 1> g =
          Eigen::Matrix<double, 6, 1>::Zero();
      double squared_error = 0.0;
      int inliers = 0;

      for (const Eigen::Vector3d& p : source_m) {
        const Eigen::Vector3d x =
            T_target_source.block<3, 3>(0, 0) * p
            + T_target_source.block<3, 1>(0, 3);
        int best = -1;
        double best_d2 = std::numeric_limits<double>::infinity();
        // Exact brute-force correspondence keeps this reference self-contained.
        for (int j = 0; j < static_cast<int>(target_m.size()); ++j) {
          const double d2 = (x - target_m[j]).squaredNorm();
          if (d2 < best_d2) { best_d2 = d2; best = j; }
        }
        if (best < 0 || std::sqrt(best_d2) >= gate ||
            !target_normals[best].allFinite() ||
            target_normals[best].norm() <= 1e-9) continue;
        const Eigen::Vector3d n = target_normals[best].normalized();
        const double r = n.dot(x - target_m[best]);
        const double weight = std::abs(r) <= huber_delta_m
            ? 1.0 : huber_delta_m / std::abs(r);
        Eigen::Matrix<double, 1, 6> J;
        J << x.cross(n).transpose(), n.transpose();
        H += weight * J.transpose() * J;
        g += weight * J.transpose() * r;
        squared_error += r * r;
        ++inliers;
      }
      if (inliers < min_inliers) {
        report.degenerate = true;
        report.inliers = inliers;
        return {T_target_source, report};
      }

      Eigen::SelfAdjointEigenSolver<Eigen::Matrix<double, 6, 6>> solver(H);
      const auto eigenvalues = solver.eigenvalues();
      report.condition = eigenvalues.maxCoeff() /
                         std::max(eigenvalues.minCoeff(), 1e-15);
      if (eigenvalues.minCoeff() < 1e-10 ||
          report.condition > condition_limit) {
        report.degenerate = true;
        return {T_target_source, report};
      }
      const Eigen::Matrix<double, 6, 1> delta = H.ldlt().solve(-g);
      Eigen::Matrix4d dT = Eigen::Matrix4d::Identity();
      dT.block<3, 3>(0, 0) = rotationExp(delta.head<3>());
      dT.block<3, 1>(0, 3) = delta.tail<3>();
      // This left update matches the Jacobian built from transformed point x.
      T_target_source = dT * T_target_source;
      report.inliers = inliers;
      report.rmse_m = std::sqrt(squared_error / inliers);
      ++report.iterations;
      report.converged = delta.norm() < 1e-6;
      if (report.converged) break;
    }
  }
  return {T_target_source, report};
}`,
        walkthrough: [
          "Find the nearest target for each transformed source point and enforce a coarse-to-fine distance gate.",
          "Accumulate the robust normal residual Jacobian into a six-degree-of-freedom normal equation.",
          "Stop safely on insufficient inliers or weak conditioning; otherwise left-compose the SE(3) increment and report diagnostics."
        ]
      }
    }
  );

  solutions.push(
    {
      id: "auto-rgb-lidar-project",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def _distort_normalized(xy, distortion):
    if distortion is None:
        return xy
    d = np.asarray(distortion, np.float64)
    if d.shape != (5,):
        raise ValueError("distortion must be [k1,k2,p1,p2,k3] or None for rectified")
    k1, k2, p1, p2, k3 = d
    x, y = xy[:, 0], xy[:, 1]
    r2 = x * x + y * y
    radial = 1.0 + k1 * r2 + k2 * r2 ** 2 + k3 * r2 ** 3
    xd = x * radial + 2.0 * p1 * x * y + p2 * (r2 + 2.0 * x * x)
    yd = y * radial + p1 * (r2 + 2.0 * y * y) + 2.0 * p2 * x * y
    return np.c_[xd, yd]


def project_timed_lidar(points_lidar_m, point_time_s, metadata,
                        pose_world_ego, T_ego_lidar, T_cam_ego, K,
                        image_time_s, image_shape_hw, distortion=None,
                        max_time_delta_s=0.2, visibility_tolerance_m=0.05):
    """Project a timed sweep into a raw distorted or rectified camera image."""
    points = np.asarray(points_lidar_m, np.float64)
    times = np.asarray(point_time_s, np.float64)
    K = np.asarray(K, np.float64)
    if points.shape != (len(times), 3):
        raise ValueError("points and per-point timestamps must align")
    h, w = map(int, image_shape_hw)
    T_world_ego_cam = np.asarray(pose_world_ego(image_time_s), np.float64)
    T_cam_world = np.asarray(T_cam_ego) @ np.linalg.inv(T_world_ego_cam)

    pc = np.full_like(points, np.nan)
    temporal_valid = np.isfinite(times) & (
        np.abs(times - image_time_s) <= max_time_delta_s
    )
    for i in np.flatnonzero(temporal_valid):
        if not np.isfinite(points[i]).all():
            temporal_valid[i] = False
            continue
        T_world_ego_point = np.asarray(pose_world_ego(float(times[i])), np.float64)
        # Point time -> world -> camera time removes rolling LiDAR sweep motion.
        pw = T_world_ego_point @ T_ego_lidar @ np.r_[points[i], 1.0]
        pc[i] = (T_cam_world @ pw)[:3]

    z = pc[:, 2]
    normalized = pc[:, :2] / np.where(z[:, None] > 1e-9, z[:, None], 1.0)
    normalized = _distort_normalized(normalized, distortion)
    uv_h = (K @ np.c_[normalized, np.ones(len(points))].T).T
    uv = uv_h[:, :2] / uv_h[:, 2:3]
    projection_valid = temporal_valid & np.isfinite(uv).all(1)
    projection_valid &= np.isfinite(z) & (z > 1e-9)
    projection_valid &= (uv[:, 0] >= 0) & (uv[:, 0] <= w - 1)
    projection_valid &= (uv[:, 1] >= 0) & (uv[:, 1] <= h - 1)

    # Rounded-pixel z-buffer distinguishes front surfaces from occluded collisions.
    ui = np.clip(np.rint(uv[:, 0]).astype(np.int64, copy=False), 0, w - 1)
    vi = np.clip(np.rint(uv[:, 1]).astype(np.int64, copy=False), 0, h - 1)
    flat = vi * w + ui
    z_buffer = np.full(h * w, np.inf)
    hits = np.zeros(h * w, dtype=np.int32)
    np.minimum.at(z_buffer, flat[projection_valid], z[projection_valid])
    np.add.at(hits, flat[projection_valid], 1)
    visible = projection_valid & (z <= z_buffer[flat] + visibility_tolerance_m)
    return {
        "uv": uv, "camera_depth_m": z,
        "temporal_valid": temporal_valid,
        "projection_valid": projection_valid,
        "visible": visible,
        "pixel_collision_count": hits[flat],
        "point_time_s": times, "image_time_s": image_time_s,
        "metadata": metadata,
        "image_model": "rectified" if distortion is None else "brown_conrady",
    }`,
        walkthrough: [
          "Transport each LiDAR return from its own acquisition time through world into the ego pose at the image timestamp.",
          "Apply either the declared Brown-Conrady distortion model or a declared rectified model, then reject behind-camera and out-of-image points.",
          "Resolve many-to-one pixels with a z-buffer and return temporal, projection, visibility, collision, and sensor metadata separately."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++ standard library
#include <Eigen/Dense>
#include <cmath>
#include <functional>
#include <limits>
#include <map>
#include <stdexcept>
#include <vector>

struct ProjectInput {
  Eigen::Vector3d xyz_lidar_m;
  double time_s = 0.0;
  float intensity = 0.0f;
  int ring = -1;
};

struct ProjectOutput {
  Eigen::Vector2d uv = Eigen::Vector2d::Constant(
      std::numeric_limits<double>::quiet_NaN());
  double camera_depth_m = std::numeric_limits<double>::quiet_NaN();
  bool temporal_valid = false;
  bool projection_valid = false;
  bool visible = false;
  int pixel_collision_count = 0;
  ProjectInput source;
};

Eigen::Vector2d distortBrownConrady(const Eigen::Vector2d& xy,
                                    const std::vector<double>& d) {
  if (d.empty()) return xy;  // Empty coefficients explicitly mean rectified image.
  if (d.size() != 5) throw std::invalid_argument("distortion needs five values");
  const double x = xy.x(), y = xy.y(), r2 = x * x + y * y;
  const double radial = 1.0 + d[0] * r2 + d[1] * r2 * r2
                      + d[4] * r2 * r2 * r2;
  return Eigen::Vector2d(
      x * radial + 2.0 * d[2] * x * y + d[3] * (r2 + 2.0 * x * x),
      y * radial + d[2] * (r2 + 2.0 * y * y) + 2.0 * d[3] * x * y);
}

std::vector<ProjectOutput> projectTimedLidar(
    const std::vector<ProjectInput>& points,
    const std::function<Eigen::Matrix4d(double)>& pose_world_ego,
    const Eigen::Matrix4d& T_ego_lidar,
    const Eigen::Matrix4d& T_cam_ego,
    const Eigen::Matrix3d& K,
    double image_time_s, int image_height, int image_width,
    const std::vector<double>& distortion = {},
    double max_time_delta_s = 0.2,
    double visibility_tolerance_m = 0.05) {
  if (image_height <= 0 || image_width <= 0) {
    throw std::invalid_argument("invalid image shape");
  }
  const Eigen::Matrix4d T_world_ego_cam = pose_world_ego(image_time_s);
  const Eigen::Matrix4d T_cam_world =
      T_cam_ego * T_world_ego_cam.inverse();
  std::vector<ProjectOutput> out(points.size());
  std::map<std::pair<int, int>, std::pair<double, int>> pixels;

  for (int i = 0; i < static_cast<int>(points.size()); ++i) {
    out[i].source = points[i];
    out[i].temporal_valid = std::isfinite(points[i].time_s) &&
        std::abs(points[i].time_s - image_time_s) <= max_time_delta_s;
    if (!out[i].temporal_valid || !points[i].xyz_lidar_m.allFinite()) continue;
    const Eigen::Matrix4d T_world_ego_point = pose_world_ego(points[i].time_s);
    // Direction-labeled transport deskews L(t) through W into C(image time).
    const Eigen::Vector4d pw = T_world_ego_point * T_ego_lidar *
        Eigen::Vector4d(points[i].xyz_lidar_m.x(), points[i].xyz_lidar_m.y(),
                        points[i].xyz_lidar_m.z(), 1.0);
    const Eigen::Vector3d pc = (T_cam_world * pw).head<3>();
    if (!pc.allFinite() || pc.z() <= 1e-9) continue;
    const Eigen::Vector2d xy =
        distortBrownConrady(pc.head<2>() / pc.z(), distortion);
    const Eigen::Vector3d q = K * Eigen::Vector3d(xy.x(), xy.y(), 1.0);
    const Eigen::Vector2d uv(q.x() / q.z(), q.y() / q.z());
    if (!uv.allFinite() || uv.x() < 0 || uv.x() > image_width - 1 ||
        uv.y() < 0 || uv.y() > image_height - 1) continue;
    out[i].uv = uv;
    out[i].camera_depth_m = pc.z();
    out[i].projection_valid = true;
    const auto key = std::make_pair(static_cast<int>(std::lround(uv.x())),
                                    static_cast<int>(std::lround(uv.y())));
    auto it = pixels.find(key);
    if (it == pixels.end()) pixels[key] = {pc.z(), 1};
    else {
      it->second.first = std::min(it->second.first, pc.z());
      ++it->second.second;
    }
  }
  for (ProjectOutput& row : out) {
    if (!row.projection_valid) continue;
    const auto key = std::make_pair(static_cast<int>(std::lround(row.uv.x())),
                                    static_cast<int>(std::lround(row.uv.y())));
    const auto& z_and_count = pixels.at(key);
    // Visibility and collision multiplicity remain separate diagnostic signals.
    row.visible = row.camera_depth_m <=
                  z_and_count.first + visibility_tolerance_m;
    row.pixel_collision_count = z_and_count.second;
  }
  return out;
}`,
        walkthrough: [
          "Reject temporally unsupported returns and transport supported ones from LiDAR time to camera time.",
          "Project with either empty rectified coefficients or an explicit Brown-Conrady model.",
          "Report positive-depth/in-image validity independently from z-buffer visibility and collision multiplicity."
        ]
      }
    },
    {
      id: "auto-object-fusion",
      python: {
        code: `# Dependencies: NumPy and SciPy
import numpy as np
from scipy.optimize import linear_sum_assignment


def _box_iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1])
    x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    intersection = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    return intersection / max(area_a + area_b - intersection, 1e-12)


def _project_3d_box(corners_lidar_m, T_cam_lidar, K, image_shape_hw):
    corners = np.asarray(corners_lidar_m, np.float64)
    if corners.shape != (8, 3):
        raise ValueError("each 3D box needs eight LiDAR-frame corners")
    pc = (T_cam_lidar @ np.c_[corners, np.ones(8)].T).T[:, :3]
    # Reject a box crossing the camera plane; clipping its 3D edges is a separate policy.
    if not np.isfinite(pc).all() or np.any(pc[:, 2] <= 1e-6):
        return None
    q = (K @ pc.T).T
    uv = q[:, :2] / q[:, 2:3]
    h, w = image_shape_hw
    box = np.array([
        np.clip(uv[:, 0].min(), 0, w - 1),
        np.clip(uv[:, 1].min(), 0, h - 1),
        np.clip(uv[:, 0].max(), 0, w - 1),
        np.clip(uv[:, 1].max(), 0, h - 1),
    ])
    if box[2] <= box[0] or box[3] <= box[1]:
        return None
    return box, float(np.median(pc[:, 2]))


def fuse_camera_lidar(camera_detections, lidar_objects,
                      T_cam_lidar, K, image_shape_hw,
                      reference_time_s, max_time_offset_s=0.05,
                      min_iou=0.05, max_center_fraction=0.25,
                      depth_gate_m=8.0, unmatched_cost=0.95,
                      ambiguity_margin=0.08):
    """Associate observations already motion-compensated to reference_time_s."""
    T_cam_lidar = np.asarray(T_cam_lidar, np.float64)
    K = np.asarray(K, np.float64)
    h, w = image_shape_hw
    if (
        T_cam_lidar.shape != (4, 4) or K.shape != (3, 3)
        or not np.isfinite(T_cam_lidar).all() or not np.isfinite(K).all()
        or h < 2 or w < 2 or K[0, 0] <= 0 or K[1, 1] <= 0
    ):
        raise ValueError("finite 4x4 extrinsic, 3x3 intrinsics, and image size required")
    if (
        not np.isfinite([
            reference_time_s, max_time_offset_s, min_iou,
            max_center_fraction, depth_gate_m, unmatched_cost,
            ambiguity_margin,
        ]).all()
        or max_time_offset_s < 0
        or not 0 <= min_iou <= 1 or max_center_fraction <= 0
        or depth_gate_m <= 0 or unmatched_cost < 0 or ambiguity_margin < 0
    ):
        raise ValueError("invalid time, gate, or unmatched-cost configuration")

    def unit_score(item):
        score = float(item.get("score", 1.0))
        if not np.isfinite(score) or not 0.0 <= score <= 1.0:
            raise ValueError("camera and LiDAR scores must be finite in [0, 1]")
        return score

    projected = []
    time_rejected_lidar = 0
    for lidar_index, obj in enumerate(lidar_objects):
        lidar_time = float(obj.get("timestamp_s", np.nan))
        if (
            not np.isfinite(lidar_time)
            or abs(lidar_time - reference_time_s) > max_time_offset_s
        ):
            time_rejected_lidar += 1
            continue
        result = _project_3d_box(
            obj["corners_lidar_m"], T_cam_lidar, K, image_shape_hw
        )
        if result is not None:
            projected.append({
                "lidar_index": lidar_index, "box": result[0],
                "depth_m": result[1], "class_id": obj["class_id"],
                "score": unit_score(obj), "timestamp_s": lidar_time,
            })

    nc, nl = len(camera_detections), len(projected)
    cost = np.full((nc, nl), np.inf)
    diagonal = np.hypot(h, w)
    diagnostics = []
    for i, cam in enumerate(camera_detections):
        a = np.asarray(cam["box_xyxy"], np.float64)
        if (
            a.shape != (4,) or not np.isfinite(a).all()
            or a[2] <= a[0] or a[3] <= a[1]
        ):
            raise ValueError("each camera box must be a finite positive-area xyxy box")
        camera_score = unit_score(cam)
        camera_time = float(cam.get("timestamp_s", np.nan))
        center_a = 0.5 * (a[:2] + a[2:])
        for j, lidar in enumerate(projected):
            b = lidar["box"]
            iou = _box_iou(a, b)
            center_fraction = np.linalg.norm(
                center_a - 0.5 * (b[:2] + b[2:])
            ) / diagonal
            class_ok = cam["class_id"] == lidar["class_id"]
            camera_depth = float(cam.get("depth_m", np.nan))
            depth_error = (
                abs(camera_depth - lidar["depth_m"])
                if np.isfinite(camera_depth) else 0.0
            )
            time_error = abs(camera_time - lidar["timestamp_s"])
            time_ok = (
                np.isfinite(camera_time)
                and abs(camera_time - reference_time_s) <= max_time_offset_s
                and time_error <= max_time_offset_s
            )
            gated = (
                time_ok and class_ok and iou >= min_iou
                and center_fraction <= max_center_fraction
                and depth_error <= depth_gate_m
            )
            if gated:
                depth_term = depth_error / max(depth_gate_m, 1e-9)
                score_term = 1.0 - np.sqrt(
                    camera_score * lidar["score"]
                )
                cost[i, j] = (
                    0.55 * (1.0 - iou)
                    + 0.25 * center_fraction / max(max_center_fraction, 1e-9)
                    + 0.10 * depth_term + 0.10 * score_term
                )
            diagnostics.append({
                "camera_index": i, "lidar_index": lidar["lidar_index"],
                "iou": iou, "center_fraction": center_fraction,
                "depth_error_m": depth_error, "class_compatible": class_ok,
                "time_error_s": time_error, "time_compatible": time_ok,
                "gated_in": gated,
            })

    # One private dummy column per camera lets the global solver choose unmatched.
    augmented = np.full((nc, nl + nc), 1e6)
    if nl:
        augmented[:, :nl] = cost
    for i in range(nc):
        augmented[i, nl + i] = unmatched_cost
    # An index-scaled epsilon makes exact ties reproducible without changing reports.
    tie_break = 1e-12 * np.arange(augmented.size).reshape(augmented.shape)
    row_ind, col_ind = linear_sum_assignment(augmented + tie_break)
    matches, used_lidar = [], set()
    for i, j in zip(row_ind, col_ind):
        if j < nl and np.isfinite(cost[i, j]) and cost[i, j] < unmatched_cost:
            matches.append({
                "camera_index": int(i),
                "lidar_index": projected[j]["lidar_index"],
                "cost": float(cost[i, j]),
                "depth_m": projected[j]["depth_m"],
            })
            used_lidar.add(projected[j]["lidar_index"])

    ambiguous_camera = []
    for i in range(nc):
        finite = np.sort(cost[i, np.isfinite(cost[i])])
        if len(finite) >= 2 and finite[1] - finite[0] < ambiguity_margin:
            ambiguous_camera.append(i)
    matched_camera = {m["camera_index"] for m in matches}
    fused_objects = []
    for match in matches:
        cam = camera_detections[match["camera_index"]]
        lidar = lidar_objects[match["lidar_index"]]
        fused_objects.append({
            "camera_index": match["camera_index"],
            "lidar_index": match["lidar_index"],
            "class_id": lidar["class_id"],
            "box_xyxy": np.asarray(cam["box_xyxy"], np.float64).copy(),
            "corners_lidar_m": np.asarray(lidar["corners_lidar_m"], np.float64).copy(),
            "depth_m": match["depth_m"],
            "camera_score": unit_score(cam),
            "lidar_score": unit_score(lidar),
            "reference_time_s": float(reference_time_s),
        })
    accepted_keys = {
        (match["camera_index"], match["lidar_index"]) for match in matches
    }
    accepted_diagnostics = [
        item for item in diagnostics
        if (item["camera_index"], item["lidar_index"]) in accepted_keys
    ]
    return {
        "matches": matches,
        "fused_objects": fused_objects,
        "unmatched_camera": sorted(set(range(nc)) - matched_camera),
        "unmatched_lidar": sorted(set(range(len(lidar_objects))) - used_lidar),
        "ambiguous_camera": ambiguous_camera,
        "candidate_diagnostics": diagnostics,
        "calibration_health_evidence": {
            "projected_lidar_count": len(projected),
            "time_rejected_lidar_count": time_rejected_lidar,
            "gated_pair_count": int(sum(
                item["gated_in"] for item in diagnostics
            )),
            "median_matched_iou": (
                float(np.median([item["iou"] for item in accepted_diagnostics]))
                if accepted_diagnostics else None
            ),
            "median_matched_center_fraction": (
                float(np.median([
                    item["center_fraction"] for item in accepted_diagnostics
                ])) if accepted_diagnostics else None
            ),
            "interpretation": (
                "Residuals can flag drift, but cannot identify clock versus "
                "extrinsic error from one frame."
            ),
        },
    }`,
        walkthrough: [
          "Require observations already motion-compensated to a declared reference time, then gate stale camera–LiDAR pairs.",
          "Project all eight corners and gate candidates by class, overlap, center distance, optional depth, timing, and confidence.",
          "Use reproducible global assignment with private unmatched choices; return fused evidence, ambiguity, residuals, and calibration-health indicators."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++17 standard library
#include <Eigen/Dense>
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <functional>
#include <limits>
#include <map>
#include <stdexcept>
#include <vector>

struct Box2d { double x1, y1, x2, y2; };
struct CameraDetection {
  Box2d box;
  int class_id = -1;
  double score = 1.0;
  double depth_m = std::numeric_limits<double>::quiet_NaN();
  double timestamp_s = std::numeric_limits<double>::quiet_NaN();
};
struct LidarObject {
  std::array<Eigen::Vector3d, 8> corners_lidar_m;
  int class_id = -1;
  double score = 1.0;
  double timestamp_s = std::numeric_limits<double>::quiet_NaN();
};
struct FusionMatch {
  int camera_index = -1;
  int lidar_index = -1;
  double cost = 0.0;
  double depth_m = 0.0;
};
struct FusedObject {
  int camera_index = -1;
  int lidar_index = -1;
  int class_id = -1;
  Box2d camera_box{};
  std::array<Eigen::Vector3d, 8> corners_lidar_m{};
  double depth_m = 0.0;
  double camera_score = 0.0;
  double lidar_score = 0.0;
  double reference_time_s = 0.0;
};
struct CandidateDiagnostic {
  int camera_index = -1;
  int lidar_index = -1;
  double iou = 0.0;
  double center_fraction = 0.0;
  double depth_error_m = 0.0;
  double time_error_s = 0.0;
  bool class_compatible = false;
  bool time_compatible = false;
  bool gated_in = false;
};
struct CalibrationHealthEvidence {
  int projected_lidar_count = 0;
  int time_rejected_lidar_count = 0;
  int gated_pair_count = 0;
  double median_matched_iou = std::numeric_limits<double>::quiet_NaN();
  double median_matched_center_fraction =
      std::numeric_limits<double>::quiet_NaN();
};
struct FusionResult {
  std::vector<FusionMatch> matches;
  std::vector<FusedObject> fused_objects;
  std::vector<int> unmatched_camera;
  std::vector<int> unmatched_lidar;
  std::vector<int> ambiguous_camera;
  std::vector<CandidateDiagnostic> candidate_diagnostics;
  CalibrationHealthEvidence calibration_health_evidence;
};

double boxIou(const Box2d& a, const Box2d& b) {
  const double x1 = std::max(a.x1, b.x1), y1 = std::max(a.y1, b.y1);
  const double x2 = std::min(a.x2, b.x2), y2 = std::min(a.y2, b.y2);
  const double inter = std::max(0.0, x2 - x1) * std::max(0.0, y2 - y1);
  const double aa = std::max(0.0, a.x2 - a.x1) * std::max(0.0, a.y2 - a.y1);
  const double ab = std::max(0.0, b.x2 - b.x1) * std::max(0.0, b.y2 - b.y1);
  return inter / std::max(aa + ab - inter, 1e-12);
}

struct ProjectedObject {
  Box2d box;
  double depth_m;
  int source;
  int class_id;
  double score;
  double timestamp_s;
};

bool projectBox(const LidarObject& object,
                const Eigen::Matrix4d& T_cam_lidar,
                const Eigen::Matrix3d& K, int h, int w,
                int source_index, ProjectedObject* output) {
  double umin = std::numeric_limits<double>::infinity();
  double vmin = umin, umax = -umin, vmax = -umin;
  std::array<double, 8> depths{};
  for (int corner = 0; corner < 8; ++corner) {
    const Eigen::Vector3d& p = object.corners_lidar_m[corner];
    const Eigen::Vector3d pc = (T_cam_lidar *
        Eigen::Vector4d(p.x(), p.y(), p.z(), 1.0)).head<3>();
    // Conservative policy rejects a box crossing the camera plane.
    if (!pc.allFinite() || pc.z() <= 1e-6) return false;
    const Eigen::Vector3d q = K * pc;
    const double u = q.x() / q.z(), v = q.y() / q.z();
    umin = std::min(umin, u); umax = std::max(umax, u);
    vmin = std::min(vmin, v); vmax = std::max(vmax, v);
    depths[corner] = pc.z();
  }
  Box2d box{std::clamp(umin, 0.0, w - 1.0),
            std::clamp(vmin, 0.0, h - 1.0),
            std::clamp(umax, 0.0, w - 1.0),
            std::clamp(vmax, 0.0, h - 1.0)};
  if (box.x2 <= box.x1 || box.y2 <= box.y1) return false;
  std::sort(depths.begin(), depths.end());
  const double median_depth = 0.5 * (depths[3] + depths[4]);
  *output = {box, median_depth, source_index, object.class_id,
             object.score, object.timestamp_s};
  return true;
}

FusionResult fuseCameraLidar(
    const std::vector<CameraDetection>& camera,
    const std::vector<LidarObject>& lidar,
    const Eigen::Matrix4d& T_cam_lidar, const Eigen::Matrix3d& K,
    int image_height, int image_width, double reference_time_s,
    double max_time_offset_s = 0.05,
    double min_iou = 0.05, double max_center_fraction = 0.25,
    double depth_gate_m = 8.0, double unmatched_cost = 0.95,
    double ambiguity_margin = 0.08) {
  if (!T_cam_lidar.allFinite() || !K.allFinite() ||
      K(0, 0) <= 0.0 || K(1, 1) <= 0.0 ||
      image_height < 2 || image_width < 2 ||
      !std::isfinite(reference_time_s) ||
      !std::isfinite(max_time_offset_s) || max_time_offset_s < 0.0 ||
      !std::isfinite(min_iou) || !std::isfinite(max_center_fraction) ||
      !std::isfinite(depth_gate_m) || !std::isfinite(unmatched_cost) ||
      !std::isfinite(ambiguity_margin) ||
      min_iou < 0.0 || min_iou > 1.0 ||
      max_center_fraction <= 0.0 || depth_gate_m <= 0.0 ||
      unmatched_cost < 0.0 || ambiguity_margin < 0.0) {
    throw std::invalid_argument("invalid calibration, image, time, or gate");
  }
  for (const auto& item : camera) {
    if (!std::isfinite(item.score) || item.score < 0.0 || item.score > 1.0) {
      throw std::invalid_argument("camera scores must be finite in [0, 1]");
    }
    if (!std::isfinite(item.box.x1) || !std::isfinite(item.box.y1) ||
        !std::isfinite(item.box.x2) || !std::isfinite(item.box.y2) ||
        item.box.x2 <= item.box.x1 || item.box.y2 <= item.box.y1) {
      throw std::invalid_argument("camera boxes must be finite positive-area xyxy");
    }
  }
  for (const auto& item : lidar) {
    if (!std::isfinite(item.score) || item.score < 0.0 || item.score > 1.0) {
      throw std::invalid_argument("LiDAR scores must be finite in [0, 1]");
    }
  }

  std::vector<ProjectedObject> projected;
  int time_rejected_lidar = 0;
  for (int j = 0; j < static_cast<int>(lidar.size()); ++j) {
    if (!std::isfinite(lidar[j].timestamp_s) ||
        std::abs(lidar[j].timestamp_s - reference_time_s) >
            max_time_offset_s) {
      ++time_rejected_lidar;
      continue;
    }
    ProjectedObject p;
    if (projectBox(lidar[j], T_cam_lidar, K, image_height, image_width, j, &p)) {
      projected.push_back(p);
    }
  }
  if (projected.size() > 20) {
    throw std::invalid_argument("reference bitmask solver supports at most 20 projected objects");
  }
  const double inf = std::numeric_limits<double>::infinity();
  const double diagonal = std::hypot(image_height, image_width);
  std::vector<std::vector<double>> cost(
      camera.size(), std::vector<double>(projected.size(), inf));
  std::vector<CandidateDiagnostic> diagnostics;
  for (int i = 0; i < static_cast<int>(camera.size()); ++i) {
    const Eigen::Vector2d ca((camera[i].box.x1 + camera[i].box.x2) / 2.0,
                             (camera[i].box.y1 + camera[i].box.y2) / 2.0);
    for (int j = 0; j < static_cast<int>(projected.size()); ++j) {
      const double iou = boxIou(camera[i].box, projected[j].box);
      const Eigen::Vector2d cb(
          (projected[j].box.x1 + projected[j].box.x2) / 2.0,
          (projected[j].box.y1 + projected[j].box.y2) / 2.0);
      const double center = (ca - cb).norm() / diagonal;
      const double depth_error = std::isfinite(camera[i].depth_m)
          ? std::abs(camera[i].depth_m - projected[j].depth_m) : 0.0;
      const double time_error =
          std::abs(camera[i].timestamp_s - projected[j].timestamp_s);
      const bool class_ok = camera[i].class_id == projected[j].class_id;
      const bool time_ok = std::isfinite(camera[i].timestamp_s) &&
          std::abs(camera[i].timestamp_s - reference_time_s) <=
              max_time_offset_s &&
          time_error <= max_time_offset_s;
      const bool gated = time_ok && class_ok && iou >= min_iou &&
          center <= max_center_fraction && depth_error <= depth_gate_m;
      diagnostics.push_back({
          i, projected[j].source, iou, center, depth_error, time_error,
          class_ok, time_ok, gated});
      if (gated) {
        const double score_term =
            1.0 - std::sqrt(camera[i].score * projected[j].score);
        cost[i][j] = 0.55 * (1.0 - iou)
            + 0.25 * center / std::max(max_center_fraction, 1e-9)
            + 0.10 * depth_error / std::max(depth_gate_m, 1e-9)
            + 0.10 * score_term;
      }
    }
  }

  // Dynamic programming gives exact one-to-one assignment with unmatched choices.
  // Index epsilon makes exact ties deterministic in input order.
  const int solver_columns =
      static_cast<int>(projected.size() + camera.size());
  const auto tie = [solver_columns](int row, int column) {
    return 1e-12 * (row * solver_columns + column);
  };
  using State = std::pair<int, std::uint64_t>;
  std::map<State, std::pair<double, int>> memo;
  std::function<double(int, std::uint64_t)> solve =
      [&](int i, std::uint64_t used) -> double {
    if (i == static_cast<int>(camera.size())) return 0.0;
    const State state{i, used};
    auto found = memo.find(state);
    if (found != memo.end()) return found->second.first;
    double best = unmatched_cost +
        tie(i, static_cast<int>(projected.size()) + i) +
        solve(i + 1, used);
    int choice = -1;
    for (int j = 0; j < static_cast<int>(projected.size()); ++j) {
      if ((used & (std::uint64_t{1} << j)) || !std::isfinite(cost[i][j])) continue;
      const double candidate = cost[i][j] + tie(i, j) +
          solve(i + 1, used | (std::uint64_t{1} << j));
      if (candidate < best) { best = candidate; choice = j; }
    }
    memo[state] = {best, choice};
    return best;
  };
  solve(0, 0);

  FusionResult out;
  out.candidate_diagnostics = diagnostics;
  out.calibration_health_evidence.projected_lidar_count =
      static_cast<int>(projected.size());
  out.calibration_health_evidence.time_rejected_lidar_count =
      time_rejected_lidar;
  out.calibration_health_evidence.gated_pair_count =
      static_cast<int>(std::count_if(
          diagnostics.begin(), diagnostics.end(),
          [](const CandidateDiagnostic& item) { return item.gated_in; }));
  std::uint64_t used = 0;
  for (int i = 0; i < static_cast<int>(camera.size()); ++i) {
    const int j = memo.at({i, used}).second;
    if (j < 0) out.unmatched_camera.push_back(i);
    else {
      out.matches.push_back({i, projected[j].source, cost[i][j], projected[j].depth_m});
      used |= std::uint64_t{1} << j;
    }
    std::vector<double> candidates;
    for (double value : cost[i]) if (std::isfinite(value)) candidates.push_back(value);
    std::sort(candidates.begin(), candidates.end());
    if (candidates.size() >= 2 &&
        candidates[1] - candidates[0] < ambiguity_margin) {
      out.ambiguous_camera.push_back(i);
    }
  }
  std::vector<bool> matched_lidar(lidar.size(), false);
  std::vector<double> accepted_iou, accepted_center;
  for (const auto& match : out.matches) {
    matched_lidar[match.lidar_index] = true;
    const auto& cam = camera[match.camera_index];
    const auto& object = lidar[match.lidar_index];
    out.fused_objects.push_back({
        match.camera_index, match.lidar_index, object.class_id, cam.box,
        object.corners_lidar_m, match.depth_m, cam.score, object.score,
        reference_time_s});
    const auto found = std::find_if(
        diagnostics.begin(), diagnostics.end(),
        [&](const CandidateDiagnostic& item) {
          return item.camera_index == match.camera_index &&
              item.lidar_index == match.lidar_index;
        });
    if (found != diagnostics.end()) {
      accepted_iou.push_back(found->iou);
      accepted_center.push_back(found->center_fraction);
    }
  }
  for (int j = 0; j < static_cast<int>(lidar.size()); ++j) {
    if (!matched_lidar[j]) out.unmatched_lidar.push_back(j);
  }
  const auto median = [](std::vector<double> values) {
    if (values.empty()) return std::numeric_limits<double>::quiet_NaN();
    std::sort(values.begin(), values.end());
    const std::size_t middle = values.size() / 2;
    return values.size() % 2
        ? values[middle]
        : 0.5 * (values[middle - 1] + values[middle]);
  };
  out.calibration_health_evidence.median_matched_iou =
      median(accepted_iou);
  out.calibration_health_evidence.median_matched_center_fraction =
      median(accepted_center);
  // Residual summaries can flag drift; one frame cannot identify clock vs extrinsic.
  return out;
}`,
        walkthrough: [
          "Accept only observations already motion-compensated near a declared reference time, then conservatively project each LiDAR cuboid.",
          "Gate by timing, class, overlap, center, optional depth, and score before optimization so numerical cost cannot override evidence.",
          "Use deterministic global assignment with unmatched choices; return fused objects, residual diagnostics, near ties, and calibration-health indicators."
        ]
      }
    }
  );

  solutions.push(
    {
      id: "auto-trajectory-collision",
      python: {
        code: `# Dependencies: NumPy
import numpy as np


def _wrap_angle(angle):
    return np.arctan2(np.sin(angle), np.cos(angle))


def _densify_trajectory(trajectory_txyyaw, resolution_m, occupancy_times_s):
    trajectory = np.asarray(trajectory_txyyaw, np.float64)
    dense = []
    temporal_step = np.inf
    if occupancy_times_s is not None and len(occupancy_times_s) > 1:
        temporal_step = 0.5 * np.min(np.diff(occupancy_times_s))
    for a, b in zip(trajectory[:-1], trajectory[1:]):
        dt = b[0] - a[0]
        distance = np.linalg.norm(b[1:3] - a[1:3])
        dyaw = _wrap_angle(b[3] - a[3])
        # Spatial, angular, and temporal subdivision prevents tunneling between samples.
        pieces = max(
            1, int(np.ceil(distance / (0.5 * resolution_m))),
            int(np.ceil(abs(dyaw) / np.deg2rad(5.0))),
            0 if not np.isfinite(temporal_step) else int(np.ceil(dt / temporal_step)),
        )
        for k in range(pieces):
            alpha = k / pieces
            dense.append(np.array([
                a[0] + alpha * dt,
                *(a[1:3] + alpha * (b[1:3] - a[1:3])),
                _wrap_angle(a[3] + alpha * dyaw),
            ]))
    dense.append(trajectory[-1])
    return np.asarray(dense)


def trajectory_collision(trajectory_txyyaw, occupancy, grid_origin_xy_m,
                         resolution_m, footprint_length_m, footprint_width_m,
                         occupancy_times_s=None, inflation_m=0.0,
                         unknown_policy="collision",
                         outside_policy="collision"):
    """Check an oriented vehicle footprint against 0=free, 1=occupied, -1=unknown."""
    trajectory = np.asarray(trajectory_txyyaw, np.float64)
    grid = np.asarray(occupancy)
    if trajectory.ndim != 2 or trajectory.shape[1] != 4 or len(trajectory) < 2:
        raise ValueError("trajectory must be Nx[t,x,y,yaw] with N>=2")
    if (
        not np.isfinite(trajectory).all()
        or np.any(np.diff(trajectory[:, 0]) <= 0)
        or not np.isfinite(resolution_m) or resolution_m <= 0
    ):
        raise ValueError("trajectory time must increase and resolution must be positive")
    if grid.ndim == 2:
        grid = grid[None]
        occ_times = None
    elif grid.ndim == 3:
        occ_times = np.asarray(occupancy_times_s, np.float64)
        if (
            occ_times.shape != (len(grid),)
            or not np.isfinite(occ_times).all()
            or np.any(np.diff(occ_times) <= 0)
        ):
            raise ValueError("time-indexed occupancy needs sorted layer times")
    else:
        raise ValueError("occupancy must be HxW or TxHxW")
    if unknown_policy not in {"collision", "free"} or outside_policy not in {"collision", "free"}:
        raise ValueError("unknown/outside policy must be collision or free")
    origin = np.asarray(grid_origin_xy_m, np.float64)
    if (
        grid.shape[1] <= 0 or grid.shape[2] <= 0
        or origin.shape != (2,) or not np.isfinite(origin).all()
        or not np.isfinite([footprint_length_m, footprint_width_m, inflation_m]).all()
        or footprint_length_m <= 0 or footprint_width_m <= 0 or inflation_m < 0
    ):
        raise ValueError("grid, origin, footprint, and non-negative inflation required")

    dense = _densify_trajectory(trajectory, resolution_m, occ_times)
    half_l = 0.5 * footprint_length_m + inflation_m
    half_w = 0.5 * footprint_width_m + inflation_m
    cell_half_diagonal = resolution_m / np.sqrt(2.0)
    occupied_centers = []
    for layer in grid:
        rows, cols = np.nonzero(layer > 0)
        occupied_centers.append(np.c_[
            origin[0] + (cols + 0.5) * resolution_m,
            origin[1] + (rows + 0.5) * resolution_m,
        ])
    trace = []
    first_contact = None

    for sample_index, (t, x, y, yaw) in enumerate(dense):
        c, s = np.cos(yaw), np.sin(yaw)
        R = np.array([[c, -s], [s, c]])
        corners_local = np.array([
            [-half_l, -half_w], [half_l, -half_w],
            [half_l, half_w], [-half_l, half_w],
        ])
        corners_world = corners_local @ R.T + np.array([x, y])
        col_min = int(np.floor((corners_world[:, 0].min() - origin[0]) / resolution_m)) - 1
        col_max = int(np.floor((corners_world[:, 0].max() - origin[0]) / resolution_m)) + 1
        row_min = int(np.floor((corners_world[:, 1].min() - origin[1]) / resolution_m)) - 1
        row_max = int(np.floor((corners_world[:, 1].max() - origin[1]) / resolution_m)) + 1
        row, col = np.meshgrid(
            np.arange(row_min, row_max + 1),
            np.arange(col_min, col_max + 1),
            indexing="ij",
        )
        row, col = row.ravel(), col.ravel()
        cell_centers = np.c_[
            origin[0] + (col + 0.5) * resolution_m,
            origin[1] + (row + 0.5) * resolution_m,
        ]
        local_centers = (cell_centers - np.array([x, y])) @ R
        delta = np.maximum(
            np.abs(local_centers) - np.array([half_l, half_w]), 0.0
        )
        # Circumscribed cell circles conservatively include every rectangle-cell overlap.
        intersects = np.linalg.norm(delta, axis=1) <= cell_half_diagonal
        row, col = row[intersects], col[intersects]
        outside = (row < 0) | (row >= grid.shape[1]) | (col < 0) | (col >= grid.shape[2])
        layer = 0 if occ_times is None else int(np.argmin(np.abs(occ_times - t)))
        values = np.full(len(row), -2, dtype=np.int16)
        inside = ~outside
        values[inside] = grid[layer, row[inside], col[inside]]
        occupied = values > 0
        unknown = values == -1
        centers = occupied_centers[layer]
        if len(centers):
            occupied_local = (centers - np.array([x, y])) @ R
            occupied_delta = np.maximum(
                np.abs(occupied_local) - np.array([half_l, half_w]), 0.0
            )
            clearance_m = max(
                0.0,
                float(np.linalg.norm(occupied_delta, axis=1).min())
                - cell_half_diagonal,
            )
        else:
            clearance_m = float("inf")
        collision = bool(
            occupied.any()
            or (unknown_policy == "collision" and unknown.any())
            or (outside_policy == "collision" and outside.any())
        )
        state = (
            "occupied" if occupied.any()
            else "unknown" if unknown.any()
            else "outside" if outside.any()
            else "free"
        )
        record = {
            "sample_index": sample_index, "time_s": float(t),
            "pose_xyyaw": [float(x), float(y), float(yaw)],
            "occupancy_layer": layer, "state": state,
            "collision": collision,
            "clearance_m": clearance_m,
            "occupied_cells": int(occupied.sum()),
            "unknown_cells": int(unknown.sum()),
            "outside_samples": int(outside.sum()),
        }
        trace.append(record)
        if collision and first_contact is None:
            first_contact = record
    return {
        "collision": first_contact is not None,
        "first_contact": first_contact,
        "trace": trace,
        "minimum_clearance_m": min(record["clearance_m"] for record in trace),
        "inflated_footprint_m": [2 * half_l, 2 * half_w],
    }`,
        walkthrough: [
          "Densify trajectory segments by translation, yaw, and occupancy time so the footprint cannot tunnel through a cell.",
          "Conservatively intersect candidate grid cells with the inflated oriented rectangle in row-y/column-x coordinates.",
          "Return first contact, per-pose and minimum occupied-cell clearance, unknown/outside exposure, and the full trace."
        ]
      },
      cpp: {
        code: `// Dependencies: OpenCV 4 and the C++17 standard library
#include <opencv2/core.hpp>
#include <algorithm>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

struct TrajectoryPose { double time_s, x_m, y_m, yaw_rad; };
struct GridSequence {
  std::vector<cv::Mat> layers;  // CV_8S: -1 unknown, 0 free, positive occupied.
  std::vector<double> times_s;   // Empty means a static single layer.
  double origin_x_m = 0.0;
  double origin_y_m = 0.0;
  double resolution_m = 0.0;
};
struct CollisionRecord {
  int sample_index = -1;
  TrajectoryPose pose{};
  int layer = 0;
  std::string state;
  bool collision = false;
  double clearance_m = std::numeric_limits<double>::infinity();
  int occupied_cells = 0;
  int unknown_cells = 0;
  int outside_samples = 0;
};
struct CollisionResult {
  bool collision = false;
  CollisionRecord first_contact;
  std::vector<CollisionRecord> trace;
  double minimum_clearance_m = std::numeric_limits<double>::infinity();
};

double wrapAngle(double a) { return std::atan2(std::sin(a), std::cos(a)); }

std::vector<TrajectoryPose> densify(
    const std::vector<TrajectoryPose>& path, const GridSequence& grid) {
  std::vector<TrajectoryPose> dense;
  double temporal_step = std::numeric_limits<double>::infinity();
  for (int i = 1; i < static_cast<int>(grid.times_s.size()); ++i) {
    temporal_step = std::min(
        temporal_step, 0.5 * (grid.times_s[i] - grid.times_s[i - 1]));
  }
  for (int i = 0; i + 1 < static_cast<int>(path.size()); ++i) {
    const auto& a = path[i];
    const auto& b = path[i + 1];
    const double dt = b.time_s - a.time_s;
    const double distance = std::hypot(b.x_m - a.x_m, b.y_m - a.y_m);
    const double dyaw = wrapAngle(b.yaw_rad - a.yaw_rad);
    int pieces = std::max(1, static_cast<int>(
        std::ceil(distance / (0.5 * grid.resolution_m))));
    pieces = std::max(pieces, static_cast<int>(
        std::ceil(std::abs(dyaw) / (5.0 * 3.14159265358979323846 / 180.0))));
    if (std::isfinite(temporal_step)) {
      pieces = std::max(pieces,
          static_cast<int>(std::ceil(dt / temporal_step)));
    }
    // These subdivisions stop the swept footprint from jumping over narrow obstacles.
    for (int k = 0; k < pieces; ++k) {
      const double a01 = static_cast<double>(k) / pieces;
      dense.push_back({
          a.time_s + a01 * dt,
          a.x_m + a01 * (b.x_m - a.x_m),
          a.y_m + a01 * (b.y_m - a.y_m),
          wrapAngle(a.yaw_rad + a01 * dyaw)});
    }
  }
  dense.push_back(path.back());
  return dense;
}

CollisionResult trajectoryCollision(
    const std::vector<TrajectoryPose>& trajectory,
    const GridSequence& grid, double footprint_length_m,
    double footprint_width_m, double inflation_m = 0.0,
    bool unknown_is_collision = true, bool outside_is_collision = true) {
  if (trajectory.size() < 2 || grid.layers.empty() ||
      !std::isfinite(grid.resolution_m) || grid.resolution_m <= 0.0 ||
      !std::isfinite(grid.origin_x_m) || !std::isfinite(grid.origin_y_m) ||
      !std::isfinite(footprint_length_m) || footprint_length_m <= 0.0 ||
      !std::isfinite(footprint_width_m) || footprint_width_m <= 0.0 ||
      !std::isfinite(inflation_m) || inflation_m < 0.0) {
    throw std::invalid_argument("invalid trajectory, occupancy, or footprint");
  }
  for (int i = 0; i < static_cast<int>(trajectory.size()); ++i) {
    const auto& pose = trajectory[i];
    if (!std::isfinite(pose.time_s) || !std::isfinite(pose.x_m) ||
        !std::isfinite(pose.y_m) || !std::isfinite(pose.yaw_rad) ||
        (i > 0 && pose.time_s <= trajectory[i - 1].time_s)) {
      throw std::invalid_argument("trajectory values must be finite and ordered");
    }
  }
  if ((grid.times_s.empty() && grid.layers.size() != 1) ||
      (!grid.times_s.empty() && grid.times_s.size() != grid.layers.size())) {
    throw std::invalid_argument("occupancy layer times do not align");
  }
  for (int i = 0; i < static_cast<int>(grid.times_s.size()); ++i) {
    if (!std::isfinite(grid.times_s[i]) ||
        (i > 0 && grid.times_s[i] <= grid.times_s[i - 1])) {
      throw std::invalid_argument("occupancy times must be finite and ordered");
    }
  }
  for (const cv::Mat& layer : grid.layers) {
    if (layer.type() != CV_8S || layer.empty() ||
        layer.size() != grid.layers.front().size()) {
      throw std::invalid_argument("occupancy layers must be aligned CV_8S");
    }
  }

  const auto dense = densify(trajectory, grid);
  const double half_l = footprint_length_m / 2.0 + inflation_m;
  const double half_w = footprint_width_m / 2.0 + inflation_m;
  const double cell_half_diagonal =
      grid.resolution_m / std::sqrt(2.0);
  CollisionResult result;
  for (int k = 0; k < static_cast<int>(dense.size()); ++k) {
    const auto& pose = dense[k];
    int layer_index = 0;
    if (!grid.times_s.empty()) {
      double best = std::numeric_limits<double>::infinity();
      for (int q = 0; q < static_cast<int>(grid.times_s.size()); ++q) {
        const double error = std::abs(grid.times_s[q] - pose.time_s);
        if (error < best) { best = error; layer_index = q; }
      }
    }
    CollisionRecord record;
    record.sample_index = k;
    record.pose = pose;
    record.layer = layer_index;
    const double c = std::cos(pose.yaw_rad), s = std::sin(pose.yaw_rad);
    double min_x = std::numeric_limits<double>::infinity();
    double min_y = min_x, max_x = -min_x, max_y = -min_x;
    for (double lx : {-half_l, half_l}) {
      for (double ly : {-half_w, half_w}) {
        const double wx = pose.x_m + c * lx - s * ly;
        const double wy = pose.y_m + s * lx + c * ly;
        min_x = std::min(min_x, wx); max_x = std::max(max_x, wx);
        min_y = std::min(min_y, wy); max_y = std::max(max_y, wy);
      }
    }
    const int col_min = static_cast<int>(std::floor(
        (min_x - grid.origin_x_m) / grid.resolution_m)) - 1;
    const int col_max = static_cast<int>(std::floor(
        (max_x - grid.origin_x_m) / grid.resolution_m)) + 1;
    const int row_min = static_cast<int>(std::floor(
        (min_y - grid.origin_y_m) / grid.resolution_m)) - 1;
    const int row_max = static_cast<int>(std::floor(
        (max_y - grid.origin_y_m) / grid.resolution_m)) + 1;
    for (int row = row_min; row <= row_max; ++row) {
      for (int col = col_min; col <= col_max; ++col) {
        const double wx =
            grid.origin_x_m + (col + 0.5) * grid.resolution_m;
        const double wy =
            grid.origin_y_m + (row + 0.5) * grid.resolution_m;
        const double dx = wx - pose.x_m, dy = wy - pose.y_m;
        const double lx = c * dx + s * dy;
        const double ly = -s * dx + c * dy;
        const double rx = std::max(std::abs(lx) - half_l, 0.0);
        const double ry = std::max(std::abs(ly) - half_w, 0.0);
        // Circumscribed cell circles conservatively cover corner intersections.
        if (std::hypot(rx, ry) > cell_half_diagonal) continue;
        if (row < 0 || row >= grid.layers[layer_index].rows ||
            col < 0 || col >= grid.layers[layer_index].cols) {
          ++record.outside_samples;
          continue;
        }
        const signed char value =
            grid.layers[layer_index].at<signed char>(row, col);
        if (value > 0) ++record.occupied_cells;
        else if (value == -1) ++record.unknown_cells;
      }
    }
    for (int row = 0; row < grid.layers[layer_index].rows; ++row) {
      for (int col = 0; col < grid.layers[layer_index].cols; ++col) {
        if (grid.layers[layer_index].at<signed char>(row, col) <= 0) continue;
        const double wx =
            grid.origin_x_m + (col + 0.5) * grid.resolution_m;
        const double wy =
            grid.origin_y_m + (row + 0.5) * grid.resolution_m;
        const double dx = wx - pose.x_m, dy = wy - pose.y_m;
        const double lx = c * dx + s * dy;
        const double ly = -s * dx + c * dy;
        const double rx = std::max(std::abs(lx) - half_l, 0.0);
        const double ry = std::max(std::abs(ly) - half_w, 0.0);
        record.clearance_m = std::min(
            record.clearance_m,
            std::max(0.0, std::hypot(rx, ry) - cell_half_diagonal));
      }
    }
    result.minimum_clearance_m =
        std::min(result.minimum_clearance_m, record.clearance_m);
    if (record.occupied_cells > 0) record.state = "occupied";
    else if (record.unknown_cells > 0) record.state = "unknown";
    else if (record.outside_samples > 0) record.state = "outside";
    else record.state = "free";
    record.collision = record.occupied_cells > 0
        || (unknown_is_collision && record.unknown_cells > 0)
        || (outside_is_collision && record.outside_samples > 0);
    if (record.collision && !result.collision) {
      result.collision = true;
      result.first_contact = record;
    }
    result.trace.push_back(record);
  }
  return result;
}`,
        walkthrough: [
          "Interpolate time, position, and shortest-angle yaw finely enough for both spatial and temporal occupancy resolution.",
          "Conservatively intersect candidate grid cells with the inflated oriented rectangle in row-y/column-x coordinates.",
          "Return collision state, first contact, per-pose/minimum clearance, and explicit unknown/outside exposure."
        ]
      }
    },
    {
      id: "auto-closed-loop-eval",
      python: {
        code: `# Dependencies: NumPy and Python standard library
from dataclasses import asdict, dataclass
import numpy as np


@dataclass(frozen=True)
class SimulatorConfig:
    simulator_version: str = "cv-closed-loop-v2"
    dynamics_version: str = "kinematic-bicycle-euler-v1"
    world_model_version: str = "point-actor-constant-acceleration-v1"
    actor_noise_version: str = "seeded-gaussian-clipped-v1"
    dt_s: float = 0.1
    max_steps: int = 300
    wheelbase_m: float = 2.8
    target_speed_mps: float = 8.0
    max_steer_rad: float = 0.55
    max_accel_mps2: float = 3.0
    vehicle_radius_m: float = 1.2
    route_half_width_m: float = 2.0
    route_completion_radius_m: float = 1.0
    observation_noise_std_m: float = 0.03
    actor_acceleration_noise_std_mps2: float = 0.25
    actor_max_acceleration_mps2: float = 1.0


def _angle_wrap(angle):
    return np.arctan2(np.sin(angle), np.cos(angle))


def _validate_inputs(route, obstacles, actors, state, config):
    if route.ndim != 2 or route.shape[1] != 2 or len(route) < 2:
        raise ValueError("route must contain at least two finite xy points")
    if state.shape != (4,) or not np.isfinite(state).all() or state[3] < 0:
        raise ValueError("initial state must be finite [x,y,yaw,speed>=0]")
    if obstacles.ndim != 2 or obstacles.shape[1] != 3:
        raise ValueError("obstacles must be Nx[x,y,radius]")
    if (not np.isfinite(route).all() or not np.isfinite(obstacles).all()
            or np.any(obstacles[:, 2] < 0)):
        raise ValueError("route and obstacle geometry must be finite")
    if (actors.ndim != 2 or actors.shape[1] != 5
            or not np.isfinite(actors).all()
            or np.any(actors[:, 2] < 0)):
        raise ValueError("dynamic actors must be Nx[x,y,radius,vx,vy]")
    if np.any(np.sum(np.diff(route, axis=0) ** 2, axis=1) <= 1e-12):
        raise ValueError("route contains a zero-length segment")
    numeric = [
        config.dt_s, config.wheelbase_m, config.target_speed_mps,
        config.max_steer_rad, config.max_accel_mps2, config.vehicle_radius_m,
        config.route_half_width_m, config.route_completion_radius_m,
        config.observation_noise_std_m,
        config.actor_acceleration_noise_std_mps2,
        config.actor_max_acceleration_mps2,
    ]
    if (not np.isfinite(numeric).all() or config.max_steps <= 0
            or config.dt_s <= 0 or config.wheelbase_m <= 0
            or config.route_completion_radius_m <= 0
            or min(numeric[2:]) < 0):
        raise ValueError("invalid simulator configuration")


def _route_error(state, route_xy):
    point = state[:2]
    start, end = route_xy[:-1], route_xy[1:]
    segment = end - start
    length2 = np.sum(segment * segment, axis=1)
    alpha = np.clip(
        np.sum((point - start) * segment, axis=1) / length2, 0.0, 1.0
    )
    projection = start + alpha[:, None] * segment
    index = int(np.argmin(np.sum((projection - point) ** 2, axis=1)))
    tangent = segment[index] / np.sqrt(length2[index])
    offset = point - projection[index]
    cross_track = tangent[0] * offset[1] - tangent[1] * offset[0]
    heading = np.arctan2(tangent[1], tangent[0])
    cumulative = np.r_[0.0, np.cumsum(np.sqrt(length2))]
    progress = cumulative[index] + alpha[index] * np.sqrt(length2[index])
    return cross_track, _angle_wrap(state[2] - heading), progress


def _clearance_m(xy, obstacles, actors, vehicle_radius_m):
    candidates = []
    if len(obstacles):
        candidates.append(
            np.linalg.norm(obstacles[:, :2] - xy, axis=1)
            - obstacles[:, 2] - vehicle_radius_m
        )
    if len(actors):
        candidates.append(
            np.linalg.norm(actors[:, :2] - xy, axis=1)
            - actors[:, 2] - vehicle_radius_m
        )
    return float(np.min(np.concatenate(candidates))) if candidates else np.inf


def _advance_actors(actors, acceleration_xy_mps2, config):
    """Advance [x,y,radius,vx,vy] with logged constant acceleration."""
    next_actors = np.array(actors, np.float64, copy=True)
    dt = config.dt_s
    # Position and velocity use the same sampled acceleration for exact replay.
    next_actors[:, :2] += (
        actors[:, 3:5] * dt + 0.5 * acceleration_xy_mps2 * dt * dt
    )
    next_actors[:, 3:5] += acceleration_xy_mps2 * dt
    return next_actors


def _reference_action(observation, config):
    # This deterministic reference is used only for the fixed open-loop dataset.
    steer = np.clip(
        -0.8 * observation["cross_track_m"]
        - 1.2 * observation["heading_error_rad"],
        -config.max_steer_rad, config.max_steer_rad
    )
    stopping_margin = max(3.0, 1.5 * observation["speed_mps"])
    desired_speed = (
        0.0 if observation["obstacle_clearance_m"] < stopping_margin
        else config.target_speed_mps
    )
    acceleration = np.clip(
        0.8 * (desired_speed - observation["speed_mps"]),
        -config.max_accel_mps2, config.max_accel_mps2
    )
    return np.array([steer, acceleration], dtype=np.float64)


def _build_fixed_open_loop_dataset(route, obstacles, actors, config):
    """Materialize scenario cases before rollout, independent of evaluated state."""
    cases = []
    for index, (start, end) in enumerate(zip(route[:-1], route[1:])):
        tangent = (end - start) / np.linalg.norm(end - start)
        normal = np.array([-tangent[1], tangent[0]])
        midpoint = 0.5 * (start + end)
        for offset in (-0.75, 0.0, 0.75):
            xy = midpoint + offset * normal
            observation = {
                "cross_track_m": float(offset),
                "heading_error_rad": float(0.1 * np.sign(offset)),
                "speed_mps": float(0.8 * config.target_speed_mps),
                "obstacle_clearance_m": _clearance_m(
                    xy, obstacles, actors, config.vehicle_radius_m
                ),
            }
            cases.append({
                "case_id": f"segment-{index}-offset-{offset:+.2f}",
                "observation": observation,
                "reference_action": _reference_action(observation, config),
            })
    return cases


def _parse_policy_decision(decision):
    fallback = isinstance(decision, dict) and bool(
        decision.get("fallback", False)
    )
    if fallback:
        return None, "fallback"
    value = decision.get("action") if isinstance(decision, dict) else decision
    try:
        action = np.asarray(value, dtype=np.float64)
    except (TypeError, ValueError):
        return None, "invalid_action"
    if action.shape != (2,) or not np.isfinite(action).all():
        return None, "invalid_action"
    return action, "ok"


def _clip_action(action, config):
    return np.array([
        np.clip(action[0], -config.max_steer_rad, config.max_steer_rad),
        np.clip(
            action[1], -config.max_accel_mps2, config.max_accel_mps2
        ),
    ])


def _evaluate_open_loop(open_loop_policy, dataset, config):
    """Evaluate a separate policy instance on immutable, policy-independent cases."""
    squared_error, fallback_count, invalid_count = [], 0, 0
    for case in dataset:
        try:
            proposed, status = _parse_policy_decision(
                open_loop_policy(dict(case["observation"]))
            )
        except Exception:
            proposed, status = None, "invalid_action"
        if status == "fallback":
            fallback_count += 1
            continue
        if status == "invalid_action":
            invalid_count += 1
            continue
        applied = _clip_action(proposed, config)
        squared_error.extend(
            ((applied - case["reference_action"]) ** 2).tolist()
        )
    return {
        "action_mse": (
            float(np.mean(squared_error)) if squared_error else None
        ),
        "valid_cases": len(squared_error) // 2,
        "total_cases": len(dataset),
        "fallback_cases": fallback_count,
        "invalid_action_cases": invalid_count,
    }


def bicycle_step(state, action, config):
    x, y, yaw, speed = map(float, state)
    steer, acceleration = map(float, action)
    dt = config.dt_s
    # This exact, versioned integration rule is shared by rollout and replay.
    return np.array([
        x + speed * np.cos(yaw) * dt,
        y + speed * np.sin(yaw) * dt,
        _angle_wrap(
            yaw + speed / config.wheelbase_m * np.tan(steer) * dt
        ),
        max(0.0, speed + acceleration * dt),
    ])


def replay_world(initial_state, initial_actors, action_log,
                 actor_acceleration_log, config):
    if len(action_log) != len(actor_acceleration_log):
        raise ValueError("ego actions and actor accelerations must align")
    states = [np.asarray(initial_state, np.float64).copy()]
    actor_states = [np.asarray(initial_actors, np.float64).copy()]
    for action, acceleration in zip(action_log, actor_acceleration_log):
        states.append(bicycle_step(states[-1], action, config))
        actor_states.append(
            _advance_actors(actor_states[-1], acceleration, config)
        )
    return np.asarray(states), np.asarray(actor_states)


def run_closed_loop(closed_loop_policy, open_loop_policy, route_xy,
                    obstacles_xyr, initial_state, config=SimulatorConfig(),
                    dynamic_actors_xyrvxvy=None,
                    scenario_version="scenario-v1",
                    policy_version="policy-v1", variation_axes=None,
                    seed=0, fault_fn=None):
    """Run a deterministic observe->fault->decide->advance state machine.

    closed_loop_policy and open_loop_policy must be independent policy instances.
    Dynamic actors use [x,y,radius,vx,vy] and are optional; an empty set preserves
    the original static-world behavior.
    A policy returns [steer, acceleration] or {"action": ..., "fallback": bool}.
    fault_fn(step, observation, rng) may return observation or
    (observation, {"active": bool, "kind": str, ...}).
    """
    route = np.asarray(route_xy, np.float64)
    obstacles = np.asarray(obstacles_xyr, np.float64).reshape(-1, 3)
    initial_actors = (
        np.empty((0, 5), dtype=np.float64)
        if dynamic_actors_xyrvxvy is None
        else np.asarray(dynamic_actors_xyrvxvy, np.float64).reshape(-1, 5)
    )
    initial = np.asarray(initial_state, np.float64).copy()
    _validate_inputs(route, obstacles, initial_actors, initial, config)
    if not callable(closed_loop_policy) or not callable(open_loop_policy):
        raise ValueError("independent closed/open-loop policy callables required")
    variations = {} if variation_axes is None else dict(variation_axes)
    if not all(np.isfinite(float(value)) for value in variations.values()):
        raise ValueError("variation axes must have finite numeric values")

    # This dataset is frozen before policy rollout, so its observations never
    # depend on states visited by the evaluated closed-loop policy.
    open_loop_dataset = _build_fixed_open_loop_dataset(
        route, obstacles, initial_actors, config
    )
    open_loop_report = _evaluate_open_loop(
        open_loop_policy, open_loop_dataset, config
    )

    rng = np.random.default_rng(seed)
    route_length = float(np.linalg.norm(np.diff(route, axis=0), axis=1).sum())
    state = initial.copy()
    actors = initial_actors.copy()
    logs, applied_actions, applied_actor_accelerations = [], [], []
    termination_cause = None
    minimum_clearance = np.inf
    maximum_progress = 0.0
    collision_events = rule_violations = intervention_events = 0
    fallback_events = invalid_action_events = fault_events = 0
    steering_rate_squared, jerk_squared = [], []
    previous_action = None

    for step in range(config.max_steps):
        cross_track, heading_error, progress = _route_error(state, route)
        clearance_before = _clearance_m(
            state[:2], obstacles, actors, config.vehicle_radius_m
        )
        minimum_clearance = min(minimum_clearance, clearance_before)
        maximum_progress = max(maximum_progress, progress)
        if clearance_before <= 0.0:
            collision_events += 1
            termination_cause = "collision"
            break
        if (np.linalg.norm(state[:2] - route[-1])
                <= config.route_completion_radius_m):
            termination_cause = "route_completed"
            break

        base_observation = {
            "cross_track_m": float(cross_track),
            "heading_error_rad": float(heading_error),
            "speed_mps": float(state[3]),
            "obstacle_clearance_m": float(clearance_before),
        }
        observation = dict(base_observation)
        observation["cross_track_m"] += float(
            rng.normal(0.0, config.observation_noise_std_m)
        )
        fault = {"active": False, "kind": "none"}
        if fault_fn is not None:
            result = fault_fn(step, dict(observation), rng)
            if isinstance(result, tuple) and len(result) == 2:
                observation, supplied_fault = result
                fault = (
                    dict(supplied_fault) if isinstance(supplied_fault, dict)
                    else {"active": True, "kind": str(supplied_fault)}
                )
            elif result is not None:
                observation = result
                fault = {"active": True, "kind": "custom"}
            observation = dict(observation)
            fault.setdefault("active", True)
            fault.setdefault("kind", "custom")
        fault_events += int(bool(fault["active"]))

        observation_finite = set(base_observation).issubset(observation)
        if observation_finite:
            ordinary_values = [
                observation["cross_track_m"],
                observation["heading_error_rad"],
                observation["speed_mps"],
            ]
            clearance_value = float(observation["obstacle_clearance_m"])
            observation_finite = (
                np.isfinite(ordinary_values).all()
                and (np.isfinite(clearance_value)
                     or np.isposinf(clearance_value))
            )
        proposed, decision_status = None, "fallback"
        policy_error = None
        if observation_finite:
            try:
                proposed, decision_status = _parse_policy_decision(
                    closed_loop_policy(dict(observation))
                )
            except Exception as error:
                decision_status = "invalid_action"
                policy_error = type(error).__name__
        else:
            policy_error = "nonfinite_observation"

        if decision_status in {"fallback", "invalid_action"}:
            if decision_status == "fallback":
                fallback_events += 1
            else:
                invalid_action_events += 1
            intervention_events += 1
            termination_cause = decision_status
            # No phantom action is applied after a terminal policy decision.
            logs.append({
                "step": step, "time_s": step * config.dt_s,
                "state_before": state.tolist(),
                "base_observation": base_observation,
                "observation": dict(observation),
                "fault": dict(fault),
                "decision_status": decision_status,
                "policy_error": policy_error,
                "proposed_action": None,
                "applied_action": None,
                "actor_state_before_xyrvxvy": actors.tolist(),
                "actor_acceleration_xy_mps2": None,
                "actor_state_after_xyrvxvy": actors.tolist(),
                "state_after": state.tolist(),
                "clearance_m": float(clearance_before),
                "progress_m": float(progress),
                "collision": False,
                "rule_violation": abs(cross_track) > config.route_half_width_m,
                "termination_cause": termination_cause,
            })
            break

        action = _clip_action(proposed, config)
        clamped = not np.array_equal(action, proposed)
        intervention_events += int(clamped)
        actor_acceleration = np.clip(
            rng.normal(
                0.0, config.actor_acceleration_noise_std_mps2,
                size=(len(actors), 2)
            ),
            -config.actor_max_acceleration_mps2,
            config.actor_max_acceleration_mps2,
        )
        next_actors = _advance_actors(
            actors, actor_acceleration, config
        )
        next_state = bicycle_step(state, action, config)
        next_cross_track, _, next_progress = _route_error(next_state, route)
        next_clearance = _clearance_m(
            next_state[:2], obstacles, next_actors,
            config.vehicle_radius_m
        )
        collision = next_clearance <= 0.0
        completed = (
            np.linalg.norm(next_state[:2] - route[-1])
            <= config.route_completion_radius_m
        )
        rule_violation = abs(next_cross_track) > config.route_half_width_m
        rule_violations += int(rule_violation)
        collision_events += int(collision)
        minimum_clearance = min(minimum_clearance, next_clearance)
        maximum_progress = max(maximum_progress, next_progress)
        if previous_action is not None:
            steering_rate_squared.append(
                ((action[0] - previous_action[0]) / config.dt_s) ** 2
            )
            jerk_squared.append(
                ((action[1] - previous_action[1]) / config.dt_s) ** 2
            )
        previous_action = action.copy()
        applied_actions.append(action.copy())
        applied_actor_accelerations.append(actor_acceleration.copy())
        tick_termination = (
            "collision" if collision
            else "route_completed" if completed
            else None
        )
        logs.append({
            "step": step, "time_s": step * config.dt_s,
            "state_before": state.tolist(),
            "base_observation": base_observation,
            "observation": dict(observation),
            "fault": dict(fault),
            "decision_status": "ok",
            "policy_error": None,
            "proposed_action": proposed.tolist(),
            "applied_action": action.tolist(),
            "action_was_clamped": clamped,
            "actor_state_before_xyrvxvy": actors.tolist(),
            "actor_acceleration_xy_mps2": actor_acceleration.tolist(),
            "actor_state_after_xyrvxvy": next_actors.tolist(),
            "state_after": next_state.tolist(),
            "clearance_m": float(next_clearance),
            "progress_m": float(next_progress),
            "collision": bool(collision),
            "rule_violation": bool(rule_violation),
            "termination_cause": tick_termination,
        })
        state = next_state
        actors = next_actors
        if tick_termination is not None:
            termination_cause = tick_termination
            break

    if termination_cause is None:
        termination_cause = "timeout"
        if logs:
            logs[-1]["termination_cause"] = "timeout"

    actions = (
        np.asarray(applied_actions, dtype=np.float64).reshape(-1, 2)
        if applied_actions else np.empty((0, 2), dtype=np.float64)
    )
    if not applied_actor_accelerations:
        actor_accelerations = np.empty(
            (0, len(initial_actors), 2), dtype=np.float64
        )
    elif not len(initial_actors):
        # NumPy cannot infer the -1 dimension when the other dimension is zero.
        actor_accelerations = np.empty(
            (len(applied_actor_accelerations), 0, 2), dtype=np.float64
        )
    else:
        actor_accelerations = np.asarray(
            applied_actor_accelerations, dtype=np.float64
        ).reshape(-1, len(initial_actors), 2)
    replayed, replayed_actors = replay_world(
        initial, initial_actors, actions, actor_accelerations, config
    )
    metrics = {
        "collision": {
            "events": collision_events,
            "minimum_clearance_m": float(minimum_clearance),
        },
        "progress": {
            "maximum_progress_m": float(maximum_progress),
            "route_completion": float(np.clip(
                maximum_progress / route_length, 0.0, 1.0
            )),
        },
        "rule": {
            "violations": rule_violations,
            "violation_rate": rule_violations / max(len(actions), 1),
        },
        "comfort": {
            "steering_rate_rms_rad_s": (
                float(np.sqrt(np.mean(steering_rate_squared)))
                if steering_rate_squared else 0.0
            ),
            "jerk_rms_mps3": (
                float(np.sqrt(np.mean(jerk_squared)))
                if jerk_squared else 0.0
            ),
        },
        "intervention": {"events": intervention_events},
        "fallback": {"events": fallback_events},
        "invalid_action": {"events": invalid_action_events},
        "timeout": {"events": int(termination_cause == "timeout")},
        "fault": {"active_ticks": fault_events},
        "open_loop": open_loop_report,
    }
    return {
        "run_metadata": {
            "simulator_version": config.simulator_version,
            "dynamics_version": config.dynamics_version,
            "world_model_version": config.world_model_version,
            "actor_noise_version": config.actor_noise_version,
            "scenario_version": scenario_version,
            "policy_version": policy_version,
            "variation_axes": variations,
            "seed": int(seed),
        },
        "scenario": {
            "initial_state": initial.tolist(),
            "route_xy": route.tolist(),
            "obstacles_xyr": obstacles.tolist(),
            "dynamic_actors_xyrvxvy": initial_actors.tolist(),
            "config": asdict(config),
        },
        "termination_cause": termination_cause,
        "metrics": metrics,
        "logs": logs,
        "action_log": actions,
        "actor_acceleration_log": actor_accelerations,
        "final_state": state,
        "final_actor_states_xyrvxvy": actors,
        "replayed_states": replayed,
        "replayed_actor_states_xyrvxvy": replayed_actors,
        "replay_exact": bool(
            np.array_equal(replayed[-1], state)
            and np.array_equal(replayed_actors[-1], actors)
        ),
        "open_loop_dataset": open_loop_dataset,
    }`,
        walkthrough: [
          "Freeze simulator, ego dynamics, actor world/noise model, scenario, policy, variation, seed, and a policy-independent open-loop dataset.",
          "Advance optional actors with seeded, clipped acceleration while logging actor state/acceleration beside the observe → fault → decide → advance transition.",
          "Replay applied ego actions and logged actor accelerations exactly; keep five terminal causes and all metric families separate."
        ]
      },
      cpp: {
        code: `// Dependencies: Eigen 3 and the C++17 standard library
#include <Eigen/Dense>
#include <algorithm>
#include <cmath>
#include <functional>
#include <limits>
#include <map>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct SimulatorConfig {
  std::string simulator_version = "cv-closed-loop-v2";
  std::string dynamics_version = "kinematic-bicycle-euler-v1";
  std::string world_model_version = "point-actor-constant-acceleration-v1";
  std::string actor_noise_version = "seeded-gaussian-clipped-v1";
  double dt_s = 0.1;
  int max_steps = 300;
  double wheelbase_m = 2.8;
  double target_speed_mps = 8.0;
  double max_steer_rad = 0.55;
  double max_accel_mps2 = 3.0;
  double vehicle_radius_m = 1.2;
  double route_half_width_m = 2.0;
  double route_completion_radius_m = 1.0;
  double observation_noise_std_m = 0.03;
  double actor_acceleration_noise_std_mps2 = 0.25;
  double actor_max_acceleration_mps2 = 1.0;
};
struct VehicleState { double x_m, y_m, yaw_rad, speed_mps; };
struct Observation {
  double cross_track_m;
  double heading_error_rad;
  double speed_mps;
  double obstacle_clearance_m;
};
struct Action { double steer_rad, acceleration_mps2; };
struct DynamicActor {
  double x_m, y_m, radius_m, vx_mps, vy_mps;
};
struct ActorAcceleration { double ax_mps2, ay_mps2; };
struct PolicyDecision {
  Action action{};
  bool fallback = false;
};
struct FaultRecord {
  bool active = false;
  std::string kind = "none";
  std::string detail;
};
struct OpenLoopCase {
  std::string case_id;
  Observation observation{};
  Action reference_action{};
};
struct OpenLoopReport {
  double action_mse = std::numeric_limits<double>::quiet_NaN();
  int valid_cases = 0;
  int total_cases = 0;
  int fallback_cases = 0;
  int invalid_action_cases = 0;
};
struct SimulationLog {
  int step = 0;
  double time_s = 0.0;
  VehicleState state_before{};
  Observation base_observation{};
  Observation observation{};
  FaultRecord fault{};
  std::string decision_status;
  std::string policy_error;
  Action proposed_action{};
  bool has_proposed_action = false;
  Action applied_action{};
  bool action_applied = false;
  bool action_was_clamped = false;
  std::vector<DynamicActor> actor_state_before;
  std::vector<ActorAcceleration> actor_acceleration;
  std::vector<DynamicActor> actor_state_after;
  VehicleState state_after{};
  double clearance_m = std::numeric_limits<double>::infinity();
  double progress_m = 0.0;
  bool collision = false;
  bool rule_violation = false;
  std::string termination_cause;
};
struct SimulationMetrics {
  int collision_events = 0;
  double minimum_clearance_m = std::numeric_limits<double>::infinity();
  double maximum_progress_m = 0.0;
  double route_completion = 0.0;
  int rule_violations = 0;
  double rule_violation_rate = 0.0;
  double steering_rate_rms_rad_s = 0.0;
  double jerk_rms_mps3 = 0.0;
  int intervention_events = 0;
  int fallback_events = 0;
  int invalid_action_events = 0;
  int timeout_events = 0;
  int fault_active_ticks = 0;
  OpenLoopReport open_loop;
};
struct SimulationResult {
  std::string simulator_version;
  std::string dynamics_version;
  std::string world_model_version;
  std::string actor_noise_version;
  std::string scenario_version;
  std::string policy_version;
  std::map<std::string, double> variation_axes;
  unsigned int seed = 0;
  SimulatorConfig config;
  VehicleState initial_state{};
  std::vector<Eigen::Vector2d> route_xy;
  std::vector<Eigen::Vector3d> obstacles_xyr;
  std::vector<DynamicActor> initial_actor_states;
  std::string termination_cause;
  SimulationMetrics metrics;
  std::vector<SimulationLog> logs;
  std::vector<Action> action_log;
  std::vector<std::vector<ActorAcceleration>> actor_acceleration_log;
  std::vector<VehicleState> replayed_states;
  std::vector<std::vector<DynamicActor>> replayed_actor_states;
  std::vector<OpenLoopCase> open_loop_dataset;
  VehicleState final_state{};
  std::vector<DynamicActor> final_actor_states;
  bool replay_exact = false;
};

using Policy = std::function<PolicyDecision(const Observation&)>;
using FaultFunction =
    std::function<void(int, Observation&, FaultRecord&, std::mt19937&)>;

double angleWrap(double angle) {
  return std::atan2(std::sin(angle), std::cos(angle));
}

bool finiteState(const VehicleState& state) {
  return std::isfinite(state.x_m) && std::isfinite(state.y_m)
      && std::isfinite(state.yaw_rad) && std::isfinite(state.speed_mps);
}

bool finiteObservation(const Observation& observation) {
  return std::isfinite(observation.cross_track_m)
      && std::isfinite(observation.heading_error_rad)
      && std::isfinite(observation.speed_mps)
      && (std::isfinite(observation.obstacle_clearance_m)
          || observation.obstacle_clearance_m
             == std::numeric_limits<double>::infinity());
}

bool finiteAction(const Action& action) {
  return std::isfinite(action.steer_rad)
      && std::isfinite(action.acceleration_mps2);
}

bool finiteActor(const DynamicActor& actor) {
  return std::isfinite(actor.x_m) && std::isfinite(actor.y_m)
      && std::isfinite(actor.radius_m) && actor.radius_m >= 0.0
      && std::isfinite(actor.vx_mps) && std::isfinite(actor.vy_mps);
}

struct RouteError { double cross_track, heading_error, progress; };
RouteError routeError(const VehicleState& state,
                      const std::vector<Eigen::Vector2d>& route) {
  const Eigen::Vector2d point(state.x_m, state.y_m);
  double cumulative = 0.0;
  double best_distance2 = std::numeric_limits<double>::infinity();
  RouteError best{};
  for (int i = 0; i + 1 < static_cast<int>(route.size()); ++i) {
    const Eigen::Vector2d segment = route[i + 1] - route[i];
    const double length = segment.norm();
    if (!std::isfinite(length) || length <= 1e-9) {
      throw std::invalid_argument("route contains invalid segment");
    }
    const double alpha = std::clamp(
        (point - route[i]).dot(segment) / segment.squaredNorm(), 0.0, 1.0);
    const Eigen::Vector2d projection = route[i] + alpha * segment;
    const double distance2 = (point - projection).squaredNorm();
    if (distance2 < best_distance2) {
      const Eigen::Vector2d tangent = segment / length;
      const Eigen::Vector2d offset = point - projection;
      best = {
          tangent.x() * offset.y() - tangent.y() * offset.x(),
          angleWrap(
              state.yaw_rad - std::atan2(tangent.y(), tangent.x())),
          cumulative + alpha * length};
      best_distance2 = distance2;
    }
    cumulative += length;
  }
  return best;
}

double clearanceAt(const Eigen::Vector2d& xy,
                   const std::vector<Eigen::Vector3d>& obstacles_xyr,
                   const std::vector<DynamicActor>& actors,
                   double vehicle_radius_m) {
  double clearance = std::numeric_limits<double>::infinity();
  for (const Eigen::Vector3d& obstacle : obstacles_xyr) {
    clearance = std::min(
        clearance, (xy - obstacle.head<2>()).norm()
                   - obstacle.z() - vehicle_radius_m);
  }
  for (const DynamicActor& actor : actors) {
    clearance = std::min(
        clearance,
        std::hypot(xy.x() - actor.x_m, xy.y() - actor.y_m)
        - actor.radius_m - vehicle_radius_m);
  }
  return clearance;
}

std::vector<DynamicActor> advanceActors(
    const std::vector<DynamicActor>& actors,
    const std::vector<ActorAcceleration>& acceleration,
    const SimulatorConfig& config) {
  if (actors.size() != acceleration.size()) {
    throw std::invalid_argument("actor states and accelerations must align");
  }
  std::vector<DynamicActor> next = actors;
  const double dt = config.dt_s;
  for (int i = 0; i < static_cast<int>(actors.size()); ++i) {
    // Logged constant acceleration drives both position and velocity.
    next[i].x_m += actors[i].vx_mps * dt
        + 0.5 * acceleration[i].ax_mps2 * dt * dt;
    next[i].y_m += actors[i].vy_mps * dt
        + 0.5 * acceleration[i].ay_mps2 * dt * dt;
    next[i].vx_mps += acceleration[i].ax_mps2 * dt;
    next[i].vy_mps += acceleration[i].ay_mps2 * dt;
  }
  return next;
}

Action clipAction(const Action& action, const SimulatorConfig& config) {
  return {
      std::clamp(
          action.steer_rad, -config.max_steer_rad, config.max_steer_rad),
      std::clamp(
          action.acceleration_mps2,
          -config.max_accel_mps2, config.max_accel_mps2)};
}

Action referenceAction(const Observation& observation,
                       const SimulatorConfig& config) {
  const double steer = std::clamp(
      -0.8 * observation.cross_track_m
      - 1.2 * observation.heading_error_rad,
      -config.max_steer_rad, config.max_steer_rad);
  const double stopping_margin = std::max(3.0, 1.5 * observation.speed_mps);
  const double desired_speed =
      observation.obstacle_clearance_m < stopping_margin
      ? 0.0 : config.target_speed_mps;
  const double acceleration = std::clamp(
      0.8 * (desired_speed - observation.speed_mps),
      -config.max_accel_mps2, config.max_accel_mps2);
  return {steer, acceleration};
}

std::vector<OpenLoopCase> buildFixedOpenLoopDataset(
    const std::vector<Eigen::Vector2d>& route,
    const std::vector<Eigen::Vector3d>& obstacles,
    const std::vector<DynamicActor>& actors,
    const SimulatorConfig& config) {
  // These cases depend only on the versioned scenario, never policy-visited states.
  std::vector<OpenLoopCase> cases;
  const double offsets[] = {-0.75, 0.0, 0.75};
  for (int i = 0; i + 1 < static_cast<int>(route.size()); ++i) {
    const Eigen::Vector2d tangent =
        (route[i + 1] - route[i]).normalized();
    const Eigen::Vector2d normal(-tangent.y(), tangent.x());
    const Eigen::Vector2d midpoint = 0.5 * (route[i] + route[i + 1]);
    for (double offset : offsets) {
      const Eigen::Vector2d xy = midpoint + offset * normal;
      Observation observation{
          offset, 0.1 * ((offset > 0.0) - (offset < 0.0)),
          0.8 * config.target_speed_mps,
          clearanceAt(xy, obstacles, actors, config.vehicle_radius_m)};
      cases.push_back({
          "segment-" + std::to_string(i) + "-offset-"
              + std::to_string(offset),
          observation, referenceAction(observation, config)});
    }
  }
  return cases;
}

OpenLoopReport evaluateOpenLoop(
    const Policy& open_loop_policy,
    const std::vector<OpenLoopCase>& dataset,
    const SimulatorConfig& config) {
  OpenLoopReport report;
  report.total_cases = static_cast<int>(dataset.size());
  double squared_error = 0.0;
  int scalar_count = 0;
  for (const OpenLoopCase& test : dataset) {
    PolicyDecision decision;
    try {
      decision = open_loop_policy(test.observation);
    } catch (...) {
      ++report.invalid_action_cases;
      continue;
    }
    if (decision.fallback) {
      ++report.fallback_cases;
      continue;
    }
    if (!finiteAction(decision.action)) {
      ++report.invalid_action_cases;
      continue;
    }
    const Action applied = clipAction(decision.action, config);
    const double steer_error =
        applied.steer_rad - test.reference_action.steer_rad;
    const double acceleration_error =
        applied.acceleration_mps2
        - test.reference_action.acceleration_mps2;
    squared_error += steer_error * steer_error
        + acceleration_error * acceleration_error;
    scalar_count += 2;
    ++report.valid_cases;
  }
  if (scalar_count) report.action_mse = squared_error / scalar_count;
  return report;
}

VehicleState bicycleStep(VehicleState state, Action action,
                         const SimulatorConfig& config) {
  // Rollout and replay share this exact, versioned integration rule.
  const double dt = config.dt_s;
  return {
      state.x_m + state.speed_mps * std::cos(state.yaw_rad) * dt,
      state.y_m + state.speed_mps * std::sin(state.yaw_rad) * dt,
      angleWrap(
          state.yaw_rad + state.speed_mps / config.wheelbase_m
          * std::tan(action.steer_rad) * dt),
      std::max(
          0.0, state.speed_mps + action.acceleration_mps2 * dt)};
}

struct WorldReplay {
  std::vector<VehicleState> ego_states;
  std::vector<std::vector<DynamicActor>> actor_states;
};

WorldReplay replayWorld(
    VehicleState initial,
    const std::vector<DynamicActor>& initial_actors,
    const std::vector<Action>& actions,
    const std::vector<std::vector<ActorAcceleration>>& actor_accelerations,
    const SimulatorConfig& config) {
  if (actions.size() != actor_accelerations.size()) {
    throw std::invalid_argument("ego and actor replay inputs must align");
  }
  WorldReplay replay{{initial}, {initial_actors}};
  for (int i = 0; i < static_cast<int>(actions.size()); ++i) {
    replay.ego_states.push_back(
        bicycleStep(replay.ego_states.back(), actions[i], config));
    replay.actor_states.push_back(advanceActors(
        replay.actor_states.back(), actor_accelerations[i], config));
  }
  return replay;
}

bool exactlyEqual(const VehicleState& a, const VehicleState& b) {
  return a.x_m == b.x_m && a.y_m == b.y_m
      && a.yaw_rad == b.yaw_rad && a.speed_mps == b.speed_mps;
}

bool exactlyEqual(const std::vector<DynamicActor>& a,
                  const std::vector<DynamicActor>& b) {
  if (a.size() != b.size()) return false;
  for (int i = 0; i < static_cast<int>(a.size()); ++i) {
    if (a[i].x_m != b[i].x_m || a[i].y_m != b[i].y_m
        || a[i].radius_m != b[i].radius_m
        || a[i].vx_mps != b[i].vx_mps
        || a[i].vy_mps != b[i].vy_mps) return false;
  }
  return true;
}

SimulationResult runClosedLoop(
    const Policy& closed_loop_policy,
    const Policy& open_loop_policy,
    const std::vector<Eigen::Vector2d>& route_xy,
    const std::vector<Eigen::Vector3d>& obstacles_xyr,
    VehicleState initial_state,
    const SimulatorConfig& config = SimulatorConfig{},
    const std::vector<DynamicActor>& dynamic_actors = {},
    const std::string& scenario_version = "scenario-v1",
    const std::string& policy_version = "policy-v1",
    const std::map<std::string, double>& variation_axes = {},
    unsigned int seed = 0,
    const FaultFunction& fault_fn = {}) {
  if (!closed_loop_policy || !open_loop_policy || route_xy.size() < 2
      || !finiteState(initial_state) || initial_state.speed_mps < 0.0
      || config.max_steps <= 0 || !std::isfinite(config.dt_s)
      || config.dt_s <= 0.0 || !std::isfinite(config.wheelbase_m)
      || config.wheelbase_m <= 0.0
      || !std::isfinite(config.max_steer_rad)
      || config.max_steer_rad < 0.0
      || !std::isfinite(config.max_accel_mps2)
      || config.max_accel_mps2 < 0.0
      || !std::isfinite(config.vehicle_radius_m)
      || config.vehicle_radius_m < 0.0
      || !std::isfinite(config.route_half_width_m)
      || config.route_half_width_m < 0.0
      || !std::isfinite(config.route_completion_radius_m)
      || config.route_completion_radius_m <= 0.0
      || !std::isfinite(config.observation_noise_std_m)
      || config.observation_noise_std_m < 0.0
      || !std::isfinite(config.actor_acceleration_noise_std_mps2)
      || config.actor_acceleration_noise_std_mps2 < 0.0
      || !std::isfinite(config.actor_max_acceleration_mps2)
      || config.actor_max_acceleration_mps2 < 0.0) {
    throw std::invalid_argument("invalid policy, scenario, or configuration");
  }
  double route_length = 0.0;
  for (int i = 0; i + 1 < static_cast<int>(route_xy.size()); ++i) {
    if (!route_xy[i].allFinite()) {
      throw std::invalid_argument("route points must be finite");
    }
    const double length = (route_xy[i + 1] - route_xy[i]).norm();
    if (!std::isfinite(length) || length <= 1e-9) {
      throw std::invalid_argument("route segments must be finite and nonzero");
    }
    route_length += length;
  }
  if (!route_xy.back().allFinite()) {
    throw std::invalid_argument("route points must be finite");
  }
  for (const Eigen::Vector3d& obstacle : obstacles_xyr) {
    if (!obstacle.allFinite() || obstacle.z() < 0.0) {
      throw std::invalid_argument("obstacles need finite xy and radius>=0");
    }
  }
  for (const DynamicActor& actor : dynamic_actors) {
    if (!finiteActor(actor)) {
      throw std::invalid_argument(
          "dynamic actors need finite x,y,radius>=0,vx,vy");
    }
  }
  for (const auto& item : variation_axes) {
    if (!std::isfinite(item.second)) {
      throw std::invalid_argument("variation values must be finite");
    }
  }

  SimulationResult out;
  out.simulator_version = config.simulator_version;
  out.dynamics_version = config.dynamics_version;
  out.world_model_version = config.world_model_version;
  out.actor_noise_version = config.actor_noise_version;
  out.scenario_version = scenario_version;
  out.policy_version = policy_version;
  out.variation_axes = variation_axes;
  out.seed = seed;
  out.config = config;
  out.initial_state = initial_state;
  out.route_xy = route_xy;
  out.obstacles_xyr = obstacles_xyr;
  out.initial_actor_states = dynamic_actors;
  // Materialize and score a separate policy instance before closed-loop state exists.
  out.open_loop_dataset =
      buildFixedOpenLoopDataset(
          route_xy, obstacles_xyr, dynamic_actors, config);
  out.metrics.open_loop =
      evaluateOpenLoop(open_loop_policy, out.open_loop_dataset, config);

  std::mt19937 rng(seed);
  std::normal_distribution<double> noise(
      0.0, config.observation_noise_std_m);
  std::normal_distribution<double> actor_noise(
      0.0, config.actor_acceleration_noise_std_mps2);
  VehicleState state = initial_state;
  std::vector<DynamicActor> actors = dynamic_actors;
  double maximum_progress = 0.0;
  double steering_rate_squared = 0.0, jerk_squared = 0.0;
  int steering_rate_count = 0, jerk_count = 0;
  Action previous_action{};
  bool has_previous_action = false;

  for (int step = 0; step < config.max_steps; ++step) {
    const RouteError before_error = routeError(state, route_xy);
    const double clearance_before = clearanceAt(
        Eigen::Vector2d(state.x_m, state.y_m),
        obstacles_xyr, actors, config.vehicle_radius_m);
    out.metrics.minimum_clearance_m =
        std::min(out.metrics.minimum_clearance_m, clearance_before);
    maximum_progress = std::max(maximum_progress, before_error.progress);
    if (clearance_before <= 0.0) {
      ++out.metrics.collision_events;
      out.termination_cause = "collision";
      break;
    }
    if ((Eigen::Vector2d(state.x_m, state.y_m) - route_xy.back()).norm()
        <= config.route_completion_radius_m) {
      out.termination_cause = "route_completed";
      break;
    }

    Observation base{
        before_error.cross_track, before_error.heading_error,
        state.speed_mps, clearance_before};
    Observation observation = base;
    observation.cross_track_m += noise(rng);
    FaultRecord fault;
    bool fault_failed = false;
    if (fault_fn) {
      try {
        // A delayed/masked perception callback must describe its mutation here.
        fault_fn(step, observation, fault, rng);
      } catch (...) {
        fault = {true, "fault_callback_exception", ""};
        fault_failed = true;
      }
    }
    out.metrics.fault_active_ticks += fault.active;

    PolicyDecision decision;
    std::string status;
    std::string policy_error;
    if (fault_failed || !finiteObservation(observation)) {
      status = "fallback";
      policy_error = fault_failed
          ? "fault_callback_exception" : "nonfinite_observation";
    } else {
      try {
        decision = closed_loop_policy(observation);
        if (decision.fallback) status = "fallback";
        else if (!finiteAction(decision.action)) status = "invalid_action";
        else status = "ok";
      } catch (...) {
        status = "invalid_action";
        policy_error = "policy_exception";
      }
    }

    if (status == "fallback" || status == "invalid_action") {
      if (status == "fallback") ++out.metrics.fallback_events;
      else ++out.metrics.invalid_action_events;
      ++out.metrics.intervention_events;
      out.termination_cause = status;
      // Terminal decisions are logged, but no phantom action changes the state.
      SimulationLog log;
      log.step = step;
      log.time_s = step * config.dt_s;
      log.state_before = state;
      log.base_observation = base;
      log.observation = observation;
      log.fault = fault;
      log.decision_status = status;
      log.policy_error = policy_error;
      log.actor_state_before = actors;
      log.actor_state_after = actors;
      log.state_after = state;
      log.clearance_m = clearance_before;
      log.progress_m = before_error.progress;
      log.rule_violation =
          std::abs(before_error.cross_track) > config.route_half_width_m;
      log.termination_cause = status;
      out.logs.push_back(log);
      break;
    }

    const Action action = clipAction(decision.action, config);
    const bool clamped =
        action.steer_rad != decision.action.steer_rad
        || action.acceleration_mps2 != decision.action.acceleration_mps2;
    out.metrics.intervention_events += clamped;
    std::vector<ActorAcceleration> actor_acceleration(actors.size());
    for (ActorAcceleration& acceleration : actor_acceleration) {
      acceleration.ax_mps2 = std::clamp(
          actor_noise(rng), -config.actor_max_acceleration_mps2,
          config.actor_max_acceleration_mps2);
      acceleration.ay_mps2 = std::clamp(
          actor_noise(rng), -config.actor_max_acceleration_mps2,
          config.actor_max_acceleration_mps2);
    }
    const std::vector<DynamicActor> next_actors =
        advanceActors(actors, actor_acceleration, config);
    const VehicleState next = bicycleStep(state, action, config);
    const RouteError after_error = routeError(next, route_xy);
    const double next_clearance = clearanceAt(
        Eigen::Vector2d(next.x_m, next.y_m),
        obstacles_xyr, next_actors, config.vehicle_radius_m);
    const bool collision = next_clearance <= 0.0;
    const bool completed =
        (Eigen::Vector2d(next.x_m, next.y_m) - route_xy.back()).norm()
        <= config.route_completion_radius_m;
    const bool rule_violation =
        std::abs(after_error.cross_track) > config.route_half_width_m;
    out.metrics.collision_events += collision;
    out.metrics.rule_violations += rule_violation;
    out.metrics.minimum_clearance_m =
        std::min(out.metrics.minimum_clearance_m, next_clearance);
    maximum_progress = std::max(maximum_progress, after_error.progress);
    if (has_previous_action) {
      const double steering_rate =
          (action.steer_rad - previous_action.steer_rad) / config.dt_s;
      const double jerk =
          (action.acceleration_mps2
           - previous_action.acceleration_mps2) / config.dt_s;
      steering_rate_squared += steering_rate * steering_rate;
      jerk_squared += jerk * jerk;
      ++steering_rate_count;
      ++jerk_count;
    }
    previous_action = action;
    has_previous_action = true;

    SimulationLog log;
    log.step = step;
    log.time_s = step * config.dt_s;
    log.state_before = state;
    log.base_observation = base;
    log.observation = observation;
    log.fault = fault;
    log.decision_status = "ok";
    log.proposed_action = decision.action;
    log.has_proposed_action = true;
    log.applied_action = action;
    log.action_applied = true;
    log.action_was_clamped = clamped;
    log.actor_state_before = actors;
    log.actor_acceleration = actor_acceleration;
    log.actor_state_after = next_actors;
    log.state_after = next;
    log.clearance_m = next_clearance;
    log.progress_m = after_error.progress;
    log.collision = collision;
    log.rule_violation = rule_violation;
    if (collision) log.termination_cause = "collision";
    else if (completed) log.termination_cause = "route_completed";
    out.logs.push_back(log);
    out.action_log.push_back(action);
    out.actor_acceleration_log.push_back(actor_acceleration);
    state = next;
    actors = next_actors;
    if (!log.termination_cause.empty()) {
      out.termination_cause = log.termination_cause;
      break;
    }
  }

  if (out.termination_cause.empty()) {
    out.termination_cause = "timeout";
    ++out.metrics.timeout_events;
    if (!out.logs.empty()) out.logs.back().termination_cause = "timeout";
  }
  out.final_state = state;
  out.final_actor_states = actors;
  out.metrics.maximum_progress_m = maximum_progress;
  out.metrics.route_completion =
      std::clamp(maximum_progress / route_length, 0.0, 1.0);
  out.metrics.rule_violation_rate =
      static_cast<double>(out.metrics.rule_violations)
      / std::max<std::size_t>(out.action_log.size(), 1);
  out.metrics.steering_rate_rms_rad_s = steering_rate_count
      ? std::sqrt(steering_rate_squared / steering_rate_count) : 0.0;
  out.metrics.jerk_rms_mps3 = jerk_count
      ? std::sqrt(jerk_squared / jerk_count) : 0.0;
  const WorldReplay replay = replayWorld(
      initial_state, dynamic_actors, out.action_log,
      out.actor_acceleration_log, config);
  out.replayed_states = replay.ego_states;
  out.replayed_actor_states = replay.actor_states;
  out.replay_exact =
      exactlyEqual(out.replayed_states.back(), out.final_state)
      && exactlyEqual(
          out.replayed_actor_states.back(), out.final_actor_states);
  return out;
}`,
        walkthrough: [
          "Version ego dynamics plus the optional actor world/noise model, and freeze scenario, policy, variation, seed, and open-loop cases.",
          "Sample and clip actor acceleration from the seeded generator, then log actor before/after state with every policy transition and terminal cause.",
          "Replay both applied ego actions and logged actor accelerations exactly while keeping safety, rule, comfort, intervention, and open-loop metrics separate."
        ]
      }
    }
  );

  window.CV_CODING_SOLUTIONS = [
    ...(Array.isArray(window.CV_CODING_SOLUTIONS)
      ? window.CV_CODING_SOLUTIONS
      : []),
    ...solutions
  ];
})();
