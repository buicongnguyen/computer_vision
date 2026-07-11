# Classical Computer Vision and Image Processing

Classical vision remains essential for calibration, preprocessing, feature pipelines, debugging, and low-latency systems. It also provides the vocabulary needed to understand what learned systems exploit or fail to preserve.

Suggested study time: 18–25 hours.

## Learning outcomes

You should be able to:

- reason about sampling, aliasing, color, convolution, and scale;
- implement and test filtering, gradients, edge detection, and morphology;
- select features and matching strategies for a geometric task;
- build a robust image alignment or panorama pipeline;
- benchmark classical operators fairly;
- identify silent preprocessing and image-representation bugs.

## 1. Image representation and sampling

An image is a sampled measurement, not a matrix of abstract colors. Sensor response includes optics, exposure, shot noise, read noise, demosaicing, white balance, tone mapping, compression, and possibly unknown postprocessing.

Before processing an image, define:

- color space and channel order;
- transfer function or gamma;
- numeric dtype and valid range;
- image origin and coordinate convention;
- pixel-center convention;
- whether values are raw, display-referred, or normalized model inputs.

Sampling a signal above the Nyquist limit causes aliasing. Downsampling should therefore include a low-pass filter matched to the scale change. Nearest-neighbor or unfiltered decimation can turn high-frequency texture into stable false structure.

Quantization maps a continuous or high-precision measurement to discrete levels. More bits do not recover information lost to clipping.

## 2. Correlation, convolution, and linear filters

For image \(I\) and kernel \(K\), discrete cross-correlation is

$$
(I \star K)[u,v]=\sum_{i,j}I[u+i,v+j]K[i,j],
$$

while convolution flips the kernel:

$$
(I*K)[u,v]=\sum_{i,j}I[u-i,v-j]K[i,j].
$$

For symmetric Gaussian kernels the two are identical. For derivative filters the sign or orientation changes.

A 2D Gaussian is separable:

$$
G_\sigma(x,y)=G_\sigma(x)G_\sigma(y),
$$

reducing a \(k^2\) operation per pixel to roughly \(2k\). The Gaussian composes across scales:

$$
G_{\sigma_1}*G_{\sigma_2}=G_{\sqrt{\sigma_1^2+\sigma_2^2}}.
$$

Border handling is part of the algorithm. Zero, reflection, replication, wrap, and valid-only modes yield different values and can create downstream artifacts.

Linear smoothing reduces independent noise but blurs boundaries. Median filtering is nonlinear and effective for impulse noise. Bilateral filtering combines spatial and intensity similarity but is sensitive to range scale and can be expensive.

## 3. Gradients and edges

Image gradient is

$$
\nabla I=
\begin{bmatrix}
I_x\\I_y
\end{bmatrix},
\qquad
\lVert\nabla I\rVert=\sqrt{I_x^2+I_y^2}.
$$

Differentiation amplifies high-frequency noise, so derivative estimation is usually paired with smoothing. Sobel filters combine both approximately.

A Canny-style edge detector consists of:

1. noise smoothing;
2. gradient estimation;
3. non-maximum suppression along gradient direction;
4. high/low threshold classification;
5. hysteresis linking.

Thresholds should be related to the image distribution or application, not copied blindly from a demonstration.

Laplacian-of-Gaussian and Difference-of-Gaussians identify scale-dependent blob-like structure. A feature has a meaningful scale only relative to the observed image resolution.

## 4. Morphology and connected structure

For binary image set \(A\) and structuring element \(B\):

- erosion removes positions where \(B\) does not fit inside \(A\);
- dilation adds positions where \(B\) intersects \(A\);
- opening is erosion followed by dilation;
- closing is dilation followed by erosion.

Morphology encodes a shape and scale assumption. A kernel described only as “3 by 3” is incomplete without connectivity, anchor, and iteration count.

Connected-component labeling depends on 4- or 8-connectivity. Area, centroid, bounding box, eccentricity, and contour statistics provide simple but interpretable region features.

## 5. Corners, descriptors, and matching

For local gradients, the second-moment matrix is

$$
M=\sum_{q\in W}w(q)
\begin{bmatrix}
I_x(q)^2&I_x(q)I_y(q)\\
I_x(q)I_y(q)&I_y(q)^2
\end{bmatrix}.
$$

Two large eigenvalues indicate intensity change in two directions: a corner. Harris uses

$$
R=\det(M)-k\,\operatorname{trace}(M)^2.
$$

FAST tests a circle of pixels efficiently but does not itself produce scale or orientation invariance.

Descriptors trade distinctiveness, invariance, memory, and compute:

- SIFT-like descriptors aggregate oriented gradients and use Euclidean distance;
- binary descriptors such as ORB use intensity comparisons and Hamming distance;
- learned descriptors can be more robust but add model and deployment dependencies.

Nearest-neighbor matching alone accepts ambiguous repeats. Useful filters include:

- absolute descriptor-distance threshold;
- ratio between best and second-best matches;
- mutual or cross-check matching;
- geometric verification with RANSAC.

A ratio test is not a probability and needs validation for the chosen descriptor and scene.

## 6. Histograms, thresholding, and templates

Histogram equalization remaps intensities using the empirical cumulative distribution. Global equalization can amplify noise and alter photometric meaning. CLAHE limits local contrast amplification but introduces tile and interpolation parameters.

Otsu thresholding chooses a threshold that maximizes between-class variance. It assumes a roughly bimodal scalar distribution and can fail under illumination gradients or class imbalance.

Normalized cross-correlation reduces sensitivity to affine brightness changes but remains sensitive to scale, rotation, occlusion, and repeated texture. Template matching is reliable only when those nuisance variables are controlled.

## Practical labs

### Lab 1 — Filtering from first principles

Implement correlation with explicit border modes, then:

- compare to a trusted library;
- verify an impulse image returns the kernel under the documented convention;
- verify a constant image behaves as expected;
- compare direct and separable Gaussian filtering;
- benchmark by image size, kernel size, dtype, and memory layout.

Include numerical-tolerance tests rather than relying on visual similarity.

### Lab 2 — Sampling and scale

Create synthetic gratings and checkerboards.

- Downsample with and without prefiltering.
- Measure frequency-domain energy and visualize aliasing.
- Resize an image and correctly update camera intrinsics.
- Show a case where aliasing changes feature detections.

Explain which information cannot be recovered after sampling.

### Lab 3 — Canny-style edge detector

Implement gradient magnitude/orientation, non-maximum suppression, and hysteresis.

- Compare L1 and L2 gradient magnitude.
- Test flat images, ramps, noise, thin lines, and borders.
- Report precision and recall against synthetic known edges.
- Analyze sensitivity to smoothing scale and thresholds.

### Lab 4 — Morphological document or lane-mask cleanup

Build a pipeline for a noisy binary mask.

- Choose structuring elements using physical feature size.
- Compare opening, closing, and connected-component filtering.
- Measure both pixel metrics and object-count errors.
- Demonstrate a setting that improves IoU but deletes a safety-relevant thin object.

### Lab 5 — Feature matching and panorama

- Detect keypoints at multiple scales.
- Compute descriptors and candidate matches.
- Apply ambiguity filtering.
- Estimate a homography with normalized DLT and RANSAC.
- Warp and blend images.
- Report inlier count, spatial coverage, transfer error, and runtime.

Test repeated texture, low texture, exposure change, motion parallax, and moving objects. Explicitly reject cases that violate the homography model.

### Lab 6 — Production benchmark

For one pipeline, compare:

- pure reference implementation;
- optimized library implementation;
- CPU thread counts;
- contiguous and non-contiguous input;
- uint8 and float32;
- cold and warmed-up runs.

Report p50 and p95 latency, throughput, memory use, correctness delta, and environment. Verify that timing does not accidentally exclude asynchronous work.

## Production failure modes

- Reading BGR as RGB or applying normalization for the wrong channel order.
- Computing on uint8 and silently overflowing or truncating.
- Applying display gamma before an operation that assumes linear intensity.
- Resizing masks with bilinear interpolation and inventing class labels.
- Downsampling without anti-aliasing.
- Changing border mode between training, evaluation, and deployment.
- Assuming OpenCV and a deep-learning framework use identical interpolation conventions.
- Comparing coordinates after crop, letterbox, or rotation without inverting the transform.
- Using global thresholds across cameras with different exposure behavior.
- Selecting morphology by visual appeal rather than physical object scale.
- Accepting feature matches clustered in one small image region.
- Fitting a homography to a scene with strong depth parallax.
- Benchmarking Python loop overhead instead of the intended operator.
- Omitting warm-up, thread settings, or memory-transfer cost.

## Oral interview questions

1. Why is anti-alias filtering required before downsampling?
2. When are correlation and convolution identical?
3. Why does differentiation amplify noise?
4. Explain Canny hysteresis and what it contributes over one threshold.
5. What do the eigenvalues of the second-moment matrix mean geometrically?
6. Compare Harris, FAST, SIFT-like, and ORB-like choices for an embedded system.
7. What does the descriptor ratio test assume?
8. How would you detect that an image pipeline has a color-space bug?
9. Why can morphology improve IoU but worsen product behavior?
10. Under what assumptions is a panorama homography valid?
11. What would make a classical pipeline preferable to a neural model?
12. How do you benchmark a filter without measuring irrelevant overhead?

## Definition of done

- [ ] Sampling and anti-aliasing are demonstrated on synthetic ground truth.
- [ ] Correlation/convolution convention and every border mode are tested.
- [ ] Dtype, range, color order, and transfer-function assumptions are documented.
- [ ] Edge detection is evaluated quantitatively, not only visually.
- [ ] Morphology choices are tied to physical or pixel-scale requirements.
- [ ] Feature matches undergo ambiguity and geometric checks.
- [ ] Panorama code rejects at least two model-violation cases.
- [ ] Benchmarks include warm-up, p50/p95, memory, and correctness.
- [ ] At least six production failure modes have regression tests.
- [ ] You can answer at least 9 of the 12 oral questions without notes.
