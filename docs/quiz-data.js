window.CV_QUIZ_QUESTIONS = [
  // Image formation and signals
  {
    id: "sig-01", topic: "Image & Signals", difficulty: "Foundation",
    question: "In an ideal pinhole camera, what happens to the image coordinates of a fixed 3D point if its distance from the camera doubles while X/Z and Y/Z stay unchanged?",
    choices: ["They double", "They halve", "They stay unchanged", "They rotate around the principal point"],
    answer: 2,
    explanation: "Projection uses x = fX/Z and y = fY/Z. Scaling X, Y, and Z by the same factor preserves the ratios, so the projected coordinates stay unchanged."
  },
  {
    id: "sig-02", topic: "Image & Signals", difficulty: "Foundation",
    question: "Why should an image be low-pass filtered before downsampling by a factor of two?",
    choices: ["To increase contrast", "To remove frequencies that would alias above the new Nyquist limit", "To make pixels independent", "To correct lens distortion"],
    answer: 1,
    explanation: "Downsampling lowers the Nyquist frequency. Components above it fold into lower frequencies unless an anti-aliasing low-pass filter removes them first."
  },
  {
    id: "sig-03", topic: "Image & Signals", difficulty: "Intermediate",
    question: "For a linear shift-invariant image operator, which representation turns convolution into elementwise multiplication?",
    choices: ["Histogram space", "Fourier space", "Homogeneous-coordinate space", "Logit space"],
    answer: 1,
    explanation: "The convolution theorem states that convolution in the spatial domain becomes multiplication in the Fourier domain."
  },
  {
    id: "sig-04", topic: "Image & Signals", difficulty: "Intermediate",
    question: "A Sobel filter produces a large horizontal derivative at a pixel. What is the most direct interpretation?",
    choices: ["There is likely a vertical edge", "There is likely a horizontal edge", "The pixel is saturated", "The camera moved horizontally"],
    answer: 0,
    explanation: "A large derivative with respect to x means intensity changes while moving horizontally; the corresponding edge is oriented approximately vertically."
  },
  {
    id: "sig-05", topic: "Image & Signals", difficulty: "Senior",
    question: "A training pipeline decodes JPEG images in sRGB and averages pixel values as if they were linear light. What is the main conceptual problem?",
    choices: ["sRGB values are gamma encoded, so arithmetic does not correspond to radiance", "JPEG has no color channels", "Averages require integer pixels", "Linear light cannot be represented by floating point"],
    answer: 0,
    explanation: "sRGB values are nonlinear display-encoded signals. Photometric operations that assume light additivity should work in an appropriate linear-light representation."
  },
  {
    id: "sig-06", topic: "Image & Signals", difficulty: "Intermediate",
    question: "What does a Gaussian pyramid primarily provide?",
    choices: ["A set of images at successively lower spatial scales", "A sequence of increasing bit depths", "Camera poses at multiple timestamps", "Class probabilities at multiple thresholds"],
    answer: 0,
    explanation: "A Gaussian pyramid repeatedly smooths and downsamples an image, creating a multi-scale representation useful for detection, matching, and coarse-to-fine estimation."
  },
  {
    id: "sig-07", topic: "Image & Signals", difficulty: "Senior",
    question: "Which boundary policy is most likely to introduce a strong artificial edge when convolving a bright image near its border?",
    choices: ["Reflect padding", "Replicate padding", "Zero padding", "Circular padding on a truly periodic image"],
    answer: 2,
    explanation: "Zero padding creates an abrupt transition from bright image values to zero. The best policy depends on the signal model, but that transition commonly creates a false edge."
  },
  {
    id: "sig-08", topic: "Image & Signals", difficulty: "Foundation",
    question: "Why is cross-correlation often called convolution in deep-learning libraries?",
    choices: ["They are identical for every kernel", "The learned kernel can absorb the missing spatial flip", "Convolution cannot run on GPUs", "Cross-correlation requires no multiplication"],
    answer: 1,
    explanation: "True convolution flips the kernel; cross-correlation does not. With learned weights, the parameterization can learn the flipped form, so libraries commonly use correlation while calling it convolution."
  },

  // Projective geometry
  {
    id: "geo-01", topic: "Geometry", difficulty: "Foundation",
    question: "What is the key advantage of homogeneous coordinates in 2D projective geometry?",
    choices: ["They remove measurement noise", "They express translation and projective transforms as matrix multiplication", "They guarantee Euclidean distance is preserved", "They make every matrix invertible"],
    answer: 1,
    explanation: "Adding a scale coordinate lets translation and perspective transformations be represented by a single matrix product. Homogeneous vectors are defined only up to nonzero scale."
  },
  {
    id: "geo-02", topic: "Geometry", difficulty: "Intermediate",
    question: "A single homography can exactly map two views of a scene when which condition holds?",
    choices: ["All scene points are on one plane, or the camera undergoes pure rotation", "The baseline is very large", "Every object is moving", "Both cameras have different focal lengths"],
    answer: 0,
    explanation: "Planar scenes induce a plane homography, and pure rotation induces an image homography independent of depth. General 3D translation creates parallax that one homography cannot model."
  },
  {
    id: "geo-03", topic: "Geometry", difficulty: "Intermediate",
    question: "Why are image points normalized before applying the DLT algorithm?",
    choices: ["To force all points onto a plane", "To improve numerical conditioning by centering and scaling coordinates", "To remove outliers automatically", "To recover metric scale"],
    answer: 1,
    explanation: "Centering points and scaling their mean distance to a standard value reduces scale imbalance in the design matrix and makes the SVD solution more stable."
  },
  {
    id: "geo-04", topic: "Geometry", difficulty: "Senior",
    question: "Four point correspondences used for homography estimation are all collinear. What should a robust implementation do?",
    choices: ["Return the identity", "Add random noise and continue", "Reject the configuration as degenerate", "Estimate a fundamental matrix instead"],
    answer: 2,
    explanation: "Collinear correspondences do not constrain a full planar projective transform. The design matrix is rank deficient, so the estimator should report degeneracy."
  },
  {
    id: "geo-05", topic: "Geometry", difficulty: "Intermediate",
    question: "What does the epipolar constraint x2^T F x1 = 0 state?",
    choices: ["The two image points have equal intensity", "A point in one view maps to an epipolar line containing its match in the other view", "The cameras have the same intrinsics", "The 3D point lies on the ground plane"],
    answer: 1,
    explanation: "The fundamental matrix maps a point in one image to its epipolar line in the other. A correct correspondence lies on that line."
  },
  {
    id: "geo-06", topic: "Geometry", difficulty: "Senior",
    question: "Why is absolute translation scale unavailable from a calibrated monocular two-view essential matrix alone?",
    choices: ["Rotation consumes all degrees of freedom", "The same images are consistent with proportionally scaled scene depth and translation", "Essential matrices ignore focal length", "Triangulation always returns zero depth"],
    answer: 1,
    explanation: "Two-view monocular geometry recovers translation direction but not magnitude: scaling both the scene and translation produces the same image projections."
  },
  {
    id: "geo-07", topic: "Geometry", difficulty: "Intermediate",
    question: "Which change most directly improves stereo depth precision for a distant point, assuming matching remains reliable?",
    choices: ["Reduce the baseline", "Increase the baseline", "Reduce focal length to zero", "Crop both images after matching"],
    answer: 1,
    explanation: "Depth is approximately fB/disparity. A larger baseline B produces more disparity for the same depth, improving sensitivity, though it can make correspondence and overlap harder."
  },
  {
    id: "geo-08", topic: "Geometry", difficulty: "Senior",
    question: "Bundle adjustment jointly refines which quantities?",
    choices: ["Only image brightness and contrast", "Camera parameters/poses and 3D structure by minimizing reprojection error", "Only class labels", "GPU kernels and memory layout"],
    answer: 1,
    explanation: "Bundle adjustment is nonlinear least squares over camera and scene parameters, normally with gauge handling, robust losses, and exploitation of sparse structure."
  },

  // Camera and sensor calibration
  {
    id: "cal-01", topic: "Calibration", difficulty: "Foundation",
    question: "Which parameters are normally contained in a pinhole camera intrinsic matrix K?",
    choices: ["Camera position and rotation", "Focal lengths, skew, and principal point", "Radial velocity and exposure time", "Scene depth and surface normals"],
    answer: 1,
    explanation: "K maps normalized camera coordinates to pixels using focal scale, optional skew, and principal-point offset. Pose belongs to the extrinsics."
  },
  {
    id: "cal-02", topic: "Calibration", difficulty: "Foundation",
    question: "What do camera extrinsics describe?",
    choices: ["The mapping between a chosen world/sensor frame and the camera frame", "The sensor color response", "The CNN architecture", "The distortion polynomial only"],
    answer: 0,
    explanation: "Extrinsics are a rigid pose: rotation and translation between coordinate frames. The direction convention must be named explicitly."
  },
  {
    id: "cal-03", topic: "Calibration", difficulty: "Intermediate",
    question: "Radial barrel distortion most commonly causes which appearance?",
    choices: ["Straight lines bend outward from the image center", "All colors swap channels", "Objects translate at constant speed", "The principal point disappears"],
    answer: 0,
    explanation: "With barrel distortion, magnification decreases toward the periphery, so straight lines bow outward. The exact sign depends on the coefficient convention."
  },
  {
    id: "cal-04", topic: "Calibration", difficulty: "Intermediate",
    question: "Why should a planar calibration board be observed at varied orientations and image locations?",
    choices: ["To make every image identical", "To constrain parameters and reduce degeneracy/correlation between them", "To remove the need for corner detection", "To guarantee zero reprojection error"],
    answer: 1,
    explanation: "Diverse tilts, distances, and positions excite different parts of the projection and distortion model. Frontoparallel, centered images alone poorly constrain several parameters."
  },
  {
    id: "cal-05", topic: "Calibration", difficulty: "Senior",
    question: "A calibration reports very low mean reprojection error, but lane overlays drift near image edges. What is the best next step?",
    choices: ["Declare calibration perfect", "Inspect spatial residuals, model choice, board coverage, and held-out geometric checks", "Increase the detector threshold", "Average the camera pose with zero"],
    answer: 1,
    explanation: "A single mean can hide structured edge residuals or overfitting. Residual maps, coverage, independent measurements, and model adequacy are more diagnostic."
  },
  {
    id: "cal-06", topic: "Calibration", difficulty: "Senior",
    question: "Why can a 30 ms camera-LiDAR timestamp offset look like an extrinsic calibration error?",
    choices: ["Timestamps change focal length", "Ego or object motion moves measurements between capture times, creating a systematic spatial offset", "LiDAR has no coordinate frame", "Time offsets only affect color"],
    answer: 1,
    explanation: "Spatial and temporal calibration interact in a moving system. Without motion compensation, an accurate rigid transform can still produce misaligned observations."
  },
  {
    id: "cal-07", topic: "Calibration", difficulty: "Intermediate",
    question: "For a rectified stereo pair, where should a correct correspondence lie?",
    choices: ["On approximately the same image row", "At the same radial distance from each image corner", "Anywhere in the image", "On the same image column only"],
    answer: 0,
    explanation: "Rectification transforms epipolar lines to horizontal scanlines, reducing the correspondence search largely to one dimension."
  },
  {
    id: "cal-08", topic: "Calibration", difficulty: "Senior",
    question: "What is the safest public API convention for rigid transforms in a multi-sensor system?",
    choices: ["Pass anonymous 4x4 arrays everywhere", "Name source and destination frames, units, timestamp, and calibration version", "Assume every matrix maps to world coordinates", "Store only Euler angles"],
    answer: 1,
    explanation: "Explicit frame direction and metadata prevent silent composition errors. Typed or labeled transforms plus identity/inverse/composition tests are strong engineering controls."
  },

  // Classical perception and motion
  {
    id: "cls-01", topic: "Classical & Motion", difficulty: "Foundation",
    question: "What makes a Harris-style corner useful for tracking compared with a straight edge?",
    choices: ["Intensity varies strongly in two independent directions", "It has zero gradient everywhere", "It is always scale invariant", "It requires no local window"],
    answer: 0,
    explanation: "A corner produces substantial gradient energy in two directions, so its displacement is better constrained. Along a single edge, motion parallel to the edge is ambiguous."
  },
  {
    id: "cls-02", topic: "Classical & Motion", difficulty: "Intermediate",
    question: "Which property does a SIFT-like orientation normalization mainly improve?",
    choices: ["Rotation invariance", "Metric depth", "Timestamp synchronization", "Lens focus"],
    answer: 0,
    explanation: "Assigning a dominant local orientation and expressing the descriptor relative to it reduces sensitivity to in-plane image rotation."
  },
  {
    id: "cls-03", topic: "Classical & Motion", difficulty: "Intermediate",
    question: "RANSAC is most appropriate when which condition holds?",
    choices: ["All observations are exact", "A model can be fit from a small sample and the data contain outliers", "There is no measurable residual", "The model has infinitely many parameters"],
    answer: 1,
    explanation: "RANSAC repeatedly proposes a model from a minimal sample and scores its consensus. It is useful when a meaningful residual separates many inliers from outliers."
  },
  {
    id: "cls-04", topic: "Classical & Motion", difficulty: "Senior",
    question: "For a RANSAC minimal sample size s, why does required iteration count grow rapidly as the inlier rate falls?",
    choices: ["The chance that all s sampled points are inliers falls as w^s", "SVD becomes impossible", "The image gains more channels", "Every outlier increases focal length"],
    answer: 0,
    explanation: "If inlier rate is w, a random minimal set is all-inlier with probability w^s. Low w or large s therefore requires many trials to reach a target success probability."
  },
  {
    id: "cls-05", topic: "Classical & Motion", difficulty: "Intermediate",
    question: "The basic optical-flow brightness-constancy equation provides one constraint for two velocity components. What resolves this aperture problem locally?",
    choices: ["Assume neighboring pixels share motion and solve over a window", "Delete one velocity component", "Use a larger class vocabulary", "Normalize logits"],
    answer: 0,
    explanation: "Lucas-Kanade assumes approximately constant motion in a local window, contributing multiple gradient constraints. It still fails when the window lacks two-dimensional texture."
  },
  {
    id: "cls-06", topic: "Classical & Motion", difficulty: "Senior",
    question: "Why does coarse-to-fine optical flow help with large displacement?",
    choices: ["Downsampling makes the apparent displacement smaller, allowing local linearization before refinement", "It creates exact ground truth", "It removes all occlusions", "It changes camera intrinsics to identity"],
    answer: 0,
    explanation: "At a coarse pyramid level, a large full-resolution motion occupies fewer pixels. The estimate can then be upsampled and refined, though small fast objects may disappear."
  },
  {
    id: "cls-07", topic: "Classical & Motion", difficulty: "Foundation",
    question: "What does the Hough transform trade for robustness in line detection?",
    choices: ["It maps evidence into a parameter-space accumulator, using additional memory and computation", "It removes all parameters", "It only works on color histograms", "It guarantees subpixel accuracy"],
    answer: 0,
    explanation: "Image points vote for compatible model parameters. Peaks tolerate broken edges and noise, but discretization and accumulator cost introduce trade-offs."
  },
  {
    id: "cls-08", topic: "Classical & Motion", difficulty: "Senior",
    question: "A feature matcher passes a ratio test but produces repeated-structure mismatches on a building facade. Which addition most directly tests geometric consistency?",
    choices: ["RANSAC with an appropriate geometric model", "A higher JPEG quality", "Global histogram equalization only", "Randomly permuting descriptors"],
    answer: 0,
    explanation: "Descriptor distinctiveness alone is insufficient in repeated patterns. Robustly fitting a homography, essential matrix, or other appropriate model checks whether matches agree geometrically."
  },

  // Deep learning foundations
  {
    id: "dl-01", topic: "Deep Learning", difficulty: "Foundation",
    question: "Why are convolutional layers parameter efficient for images?",
    choices: ["They share local filters across spatial locations", "They assign a separate model to every pixel", "They require no nonlinearities", "They remove all spatial information"],
    answer: 0,
    explanation: "Local connectivity and weight sharing encode a translation-oriented inductive bias and avoid a fully connected parameter for every input-output pixel pair."
  },
  {
    id: "dl-02", topic: "Deep Learning", difficulty: "Intermediate",
    question: "Why should cross-entropy usually receive logits rather than probabilities produced by a separate softmax?",
    choices: ["A fused log-softmax calculation is more numerically stable", "Softmax has no derivatives", "Logits must sum to one", "Probabilities cannot be stored"],
    answer: 0,
    explanation: "Fused implementations use log-sum-exp identities and avoid underflow or taking the logarithm of rounded zero probabilities."
  },
  {
    id: "dl-03", topic: "Deep Learning", difficulty: "Intermediate",
    question: "What is the main optimization benefit of a residual connection?",
    choices: ["It provides an identity path for information and gradients", "It guarantees the global optimum", "It removes the need for data", "It makes every layer linear"],
    answer: 0,
    explanation: "Residual blocks can represent an identity mapping easily and provide a direct route across layers, improving optimization of deep networks without guaranteeing an optimum."
  },
  {
    id: "dl-04", topic: "Deep Learning", difficulty: "Senior",
    question: "A model cannot overfit a clean set of 32 training examples. What is the highest-value first interpretation?",
    choices: ["The model is definitely too small", "There may be a correctness problem in data, labels, loss, optimization, or evaluation", "More regularization is required", "The validation set is too large"],
    answer: 1,
    explanation: "Failure to fit a tiny set is a powerful pipeline smoke test. Inspect samples and labels, remove augmentation/regularization, verify loss and metric, and check gradients before scaling up."
  },
  {
    id: "dl-05", topic: "Deep Learning", difficulty: "Intermediate",
    question: "During batch-normalization inference, which statistics are normally used?",
    choices: ["Statistics of the single current example only", "Running population estimates accumulated during training", "Random statistics", "Statistics from the validation labels"],
    answer: 1,
    explanation: "Inference normally uses stored running mean and variance. Small or shifted batches and incorrect train/eval mode can therefore cause production discrepancies."
  },
  {
    id: "dl-06", topic: "Deep Learning", difficulty: "Senior",
    question: "What is the important distinction between decoupled weight decay and adding an L2 penalty when using adaptive optimizers?",
    choices: ["They are always numerically identical", "Decoupled decay shrinks parameters separately from the gradient-scaled loss update", "L2 cannot be differentiated", "Weight decay changes labels"],
    answer: 1,
    explanation: "For adaptive methods, adding L2 to the gradient passes the penalty through per-parameter scaling. AdamW-style decay applies shrinkage separately, so the behaviors differ."
  },
  {
    id: "dl-07", topic: "Deep Learning", difficulty: "Intermediate",
    question: "What does data augmentation assume?",
    choices: ["The chosen transformation should preserve or predictably transform the target", "Every transformed image must be physically impossible", "More pixels always improve accuracy", "Labels are unnecessary"],
    answer: 0,
    explanation: "Augmentation encodes invariance or equivariance. A transformation that changes the true label or geometry without updating the target injects label noise."
  },
  {
    id: "dl-08", topic: "Deep Learning", difficulty: "Senior",
    question: "When using mixed precision, why may some reductions and accumulations remain in higher precision?",
    choices: ["To reduce overflow/rounding error while retaining faster low-precision operands", "Because GPUs cannot multiply low-precision values", "To make the model larger", "To eliminate validation"],
    answer: 0,
    explanation: "Products may use FP16/BF16 while accumulation uses FP32 to protect dynamic range and numerical accuracy. Correctness must still be measured by operation and slice."
  },

  // Detection and segmentation
  {
    id: "det-01", topic: "Detection & Segmentation", difficulty: "Foundation",
    question: "What problem does non-maximum suppression address in an object detector?",
    choices: ["Multiple highly overlapping predictions for one object", "Missing camera calibration", "Class imbalance during data collection", "Slow image decoding"],
    answer: 0,
    explanation: "Dense detectors often emit several boxes around the same object. NMS keeps a high-score box and suppresses sufficiently overlapping alternatives."
  },
  {
    id: "det-02", topic: "Detection & Segmentation", difficulty: "Senior",
    question: "Why can hard NMS reduce recall in a crowded pedestrian scene?",
    choices: ["Different true objects can overlap enough that one suppresses another", "NMS changes image exposure", "NMS cannot compare scores", "Pedestrians have no bounding boxes"],
    answer: 0,
    explanation: "An overlap threshold cannot always distinguish duplicate hypotheses from distinct heavily overlapping objects. Soft-NMS, learned/set prediction, or better association can help."
  },
  {
    id: "det-03", topic: "Detection & Segmentation", difficulty: "Intermediate",
    question: "What does average precision primarily summarize?",
    choices: ["The ranked precision-recall trade-off under a defined matching and IoU protocol", "Only model latency", "Calibration reprojection error", "Pixel color accuracy"],
    answer: 0,
    explanation: "AP integrates an interpolated precision-recall curve. Its meaning depends on class, matching rules, IoU thresholds, ignore policy, and averaging scheme."
  },
  {
    id: "det-04", topic: "Detection & Segmentation", difficulty: "Senior",
    question: "Model B has higher overall mAP than Model A. Which missing information is most important before a safety-related launch decision?",
    choices: ["Critical scenario slices, operating threshold, uncertainty, latency, and error costs", "The alphabetic order of model names", "The training file size alone", "The number of dashboard colors"],
    answer: 0,
    explanation: "Aggregate AP can hide regressions at the deployed operating point or in rare critical conditions. System constraints and confidence in the difference are part of the decision."
  },
  {
    id: "det-05", topic: "Detection & Segmentation", difficulty: "Intermediate",
    question: "Why can pixel accuracy be misleading for segmentation with a dominant background class?",
    choices: ["Predicting background everywhere may score highly while missing foreground", "Pixels cannot have labels", "Accuracy is always lower than IoU", "Background has no area"],
    answer: 0,
    explanation: "Class imbalance lets the majority background dominate pixel accuracy. Per-class IoU, Dice, boundary metrics, and critical-class recall reveal more."
  },
  {
    id: "det-06", topic: "Detection & Segmentation", difficulty: "Intermediate",
    question: "What problem is focal loss designed to reduce in dense detection?",
    choices: ["Dominance of numerous easy examples by down-weighting them", "Camera radial distortion", "Incorrect frame timestamps", "GPU memory fragmentation"],
    answer: 0,
    explanation: "Focal loss multiplies cross-entropy by a factor that reduces the contribution of well-classified examples, focusing optimization on hard examples."
  },
  {
    id: "det-07", topic: "Detection & Segmentation", difficulty: "Senior",
    question: "Why can IoU-based box losses be preferable to coordinate-wise L1 alone?",
    choices: ["They better align optimization with overlap geometry and scale", "They make boxes rotation invariant automatically", "They remove ground truth", "They always have nonzero gradient for every formulation"],
    answer: 0,
    explanation: "IoU-family losses directly reflect spatial overlap and normalize some scale effects. Variants such as GIoU address the zero-overlap gradient limitation of plain IoU."
  },
  {
    id: "det-08", topic: "Detection & Segmentation", difficulty: "Senior",
    question: "A segmentation model improves mean IoU but damages thin lane boundaries. What is the best evaluation response?",
    choices: ["Add boundary/tolerance and lane-specific metrics plus qualitative failure slices", "Ignore the change because mean IoU rose", "Measure only training loss", "Increase image compression"],
    answer: 0,
    explanation: "A task-specific structure may contribute little area and therefore little mean IoU. Boundary and topology-aware measures connect the evaluation to downstream behavior."
  },

  // Tracking and sensor fusion
  {
    id: "trk-01", topic: "Tracking & Fusion", difficulty: "Foundation",
    question: "What are the two conceptual steps of a Kalman filter?",
    choices: ["Predict from dynamics, then update with a measurement", "Encode, then decode JPEG", "Train, then delete labels", "Quantize, then calibrate a camera"],
    answer: 0,
    explanation: "The prediction propagates state and covariance through a motion model; the correction combines that prior with a measurement according to uncertainty."
  },
  {
    id: "trk-02", topic: "Tracking & Fusion", difficulty: "Intermediate",
    question: "What does innovation covariance represent in a Kalman filter?",
    choices: ["Expected uncertainty of the measurement residual", "Only model file size", "The number of tracks", "Camera focal length"],
    answer: 0,
    explanation: "Innovation covariance combines projected state uncertainty and measurement noise. It scales the Kalman gain and supports Mahalanobis association gates."
  },
  {
    id: "trk-03", topic: "Tracking & Fusion", difficulty: "Senior",
    question: "Why is the Joseph form useful for covariance update?",
    choices: ["It better preserves symmetry and positive semidefiniteness under finite precision", "It makes every motion linear", "It removes measurement noise", "It sets velocity to zero"],
    answer: 0,
    explanation: "The Joseph stabilized expression is algebraically equivalent in exact arithmetic but is less likely to produce a nonsymmetric or invalid covariance numerically."
  },
  {
    id: "trk-04", topic: "Tracking & Fusion", difficulty: "Intermediate",
    question: "Why use Mahalanobis distance rather than Euclidean distance for association gating?",
    choices: ["It accounts for directional and scale-dependent uncertainty", "It ignores covariance", "It always returns an integer", "It uses color only"],
    answer: 0,
    explanation: "Mahalanobis distance normalizes the residual by its covariance, allowing a larger gate along uncertain directions and a tighter gate along confident ones."
  },
  {
    id: "trk-05", topic: "Tracking & Fusion", difficulty: "Senior",
    question: "Which metric best exposes identity continuity when detections are reasonably accurate?",
    choices: ["IDF1 or association components of HOTA", "Image PSNR only", "Top-1 classification accuracy", "Calibration mean error only"],
    answer: 0,
    explanation: "Identity-focused metrics reveal switches and fragmentation that a detection-dominated aggregate such as MOTA can obscure. Metric selection still depends on the task."
  },
  {
    id: "trk-06", topic: "Tracking & Fusion", difficulty: "Intermediate",
    question: "What is a major advantage of late sensor fusion?",
    choices: ["Modular fault isolation and easier operation when one sensor is missing", "Perfect preservation of all raw information", "No need for calibration", "Zero latency"],
    answer: 0,
    explanation: "Combining object- or decision-level outputs creates modular boundaries and can simplify sensor dropout, though it discards some fine cross-sensor information."
  },
  {
    id: "trk-07", topic: "Tracking & Fusion", difficulty: "Senior",
    question: "A tracker has many ID switches during crossings but good per-frame detection AP. Which component should be investigated first?",
    choices: ["Association cost, gating, motion/appearance uncertainty, and one-to-one assignment", "JPEG metadata", "Classifier vocabulary size only", "Camera white balance only"],
    answer: 0,
    explanation: "Crossings stress the association model. Inspect ambiguous costs, covariance/gates, temporal state, appearance embeddings, and assignment behavior while keeping detector inputs fixed."
  },
  {
    id: "trk-08", topic: "Tracking & Fusion", difficulty: "Senior",
    question: "What is the main danger of evaluating a temporal model on randomly shuffled video frames?",
    choices: ["It can destroy temporal semantics or leak near-duplicate context across splits", "It makes matrix multiplication impossible", "It forces all boxes to overlap", "It removes timestamps from the file system"],
    answer: 0,
    explanation: "Temporal order and scene grouping are part of the data-generating process. Random frame splits can give unrealistically similar train/test content and invalidate stateful evaluation."
  },

  // 3D perception and bird's-eye view
  {
    id: "bev-01", topic: "BEV & 3D", difficulty: "Foundation",
    question: "What does a bird's-eye-view representation provide for autonomous perception?",
    choices: ["A common ground-aligned spatial frame for reasoning across sensors and time", "A guarantee of perfect depth", "A replacement for calibration", "A lossless copy of every image pixel"],
    answer: 0,
    explanation: "BEV organizes information in a metric or pseudo-metric top-down frame, simplifying spatial relations, mapping, fusion, and downstream planning interfaces."
  },
  {
    id: "bev-02", topic: "BEV & 3D", difficulty: "Intermediate",
    question: "Classical inverse perspective mapping from a camera image to the road plane relies most directly on what assumption?",
    choices: ["Relevant points lie on a known plane", "Every object has the same color", "The camera has no rotation", "Depth is independent of pixel position"],
    answer: 0,
    explanation: "A plane plus calibrated camera pose induces a homography between image and ground plane. Elevated objects violate the model and become stretched or misplaced."
  },
  {
    id: "bev-03", topic: "BEV & 3D", difficulty: "Senior",
    question: "Why do tall objects appear distorted in ground-plane IPM?",
    choices: ["Pixels from off-plane surfaces are projected as if they lay on the ground", "IPM changes exposure", "Tall objects have no depth", "Homographies require grayscale"],
    answer: 0,
    explanation: "A single planar homography is exact only for points on its reference plane. Projecting elevated surfaces to that plane creates characteristic radial stretching."
  },
  {
    id: "bev-04", topic: "BEV & 3D", difficulty: "Intermediate",
    question: "In a Lift-Splat style camera-to-BEV pipeline, what does lifting mean?",
    choices: ["Distributing image features along candidate depth bins into a 3D frustum", "Increasing camera height", "Sorting detections by score", "Rotating the final map 180 degrees"],
    answer: 0,
    explanation: "The model predicts or weights depth for image features, forming 3D frustum features. Splatting aggregates those features into BEV cells."
  },
  {
    id: "bev-05", topic: "BEV & 3D", difficulty: "Senior",
    question: "Why is camera calibration error especially dangerous for multi-camera BEV fusion?",
    choices: ["Features from different views are written to inconsistent spatial cells", "It only changes class names", "It makes GPU clocks slower", "Calibration affects images but never geometry"],
    answer: 0,
    explanation: "BEV fusion assumes a shared geometric frame. Small pose or intrinsic errors can create duplicated, blurred, shifted, or temporally unstable features and objects."
  },
  {
    id: "bev-06", topic: "BEV & 3D", difficulty: "Senior",
    question: "What must be done before fusing a previous BEV state with the current frame on a moving platform?",
    choices: ["Warp or align the previous state using ego motion and timestamps", "Randomly crop both states", "Set all velocities to zero", "Convert both states to JPEG"],
    answer: 0,
    explanation: "Temporal BEV features live in different ego poses. They need motion compensation in a consistent time/frame convention, with residual error for dynamic objects handled separately."
  },
  {
    id: "bev-07", topic: "BEV & 3D", difficulty: "Intermediate",
    question: "What is a central trade-off of increasing BEV grid resolution?",
    choices: ["Finer localization but higher memory and compute", "Lower accuracy with lower cost in every case", "No effect on the model", "Removal of depth ambiguity"],
    answer: 0,
    explanation: "Smaller cells retain more spatial detail but increase the number of BEV tokens/cells, memory traffic, and downstream compute."
  },
  {
    id: "bev-08", topic: "BEV & 3D", difficulty: "Senior",
    question: "Why can occupancy prediction complement object detection?",
    choices: ["It represents occupied/free/unknown space without requiring every structure to fit a known object class", "It guarantees object identity across time", "It removes all sensor noise", "It needs no coordinate frame"],
    answer: 0,
    explanation: "Occupancy covers amorphous, open-set, or partially observed space important for motion planning. Object representations remain useful for semantics, identity, and compact tracking."
  },

  // Modern vision and production systems
  {
    id: "mod-01", topic: "Modern & Production", difficulty: "Intermediate",
    question: "What replaces convolution's strong locality bias in a basic vision transformer?",
    choices: ["Token interactions through self-attention plus positional information", "A fixed Hough accumulator", "Camera distortion coefficients", "Only global average pooling"],
    answer: 0,
    explanation: "Self-attention permits content-dependent interactions among tokens. Positional encodings or related mechanisms are needed because attention alone does not know spatial order."
  },
  {
    id: "mod-02", topic: "Modern & Production", difficulty: "Senior",
    question: "What is a common failure mode of contrastive self-supervised learning if positive and negative definitions are poorly chosen?",
    choices: ["The objective can enforce harmful invariances or treat semantically similar samples as negatives", "It calibrates every camera automatically", "It eliminates representation collapse under all conditions", "It requires object boxes"],
    answer: 0,
    explanation: "The sampling and augmentation policy define what the representation should ignore or separate. False negatives and invalid augmentations can teach the wrong geometry or semantics."
  },
  {
    id: "mod-03", topic: "Modern & Production", difficulty: "Intermediate",
    question: "What is the central idea of masked image modeling?",
    choices: ["Learn representations by predicting or reconstructing hidden image content", "Delete labels after inference", "Mask gradients permanently", "Use only one visible pixel"],
    answer: 0,
    explanation: "A subset of patches or tokens is hidden, and the model learns structure needed to reconstruct pixels, features, or discrete targets from visible context."
  },
  {
    id: "mod-04", topic: "Modern & Production", difficulty: "Senior",
    question: "An open-vocabulary detector recognizes a rare class by text prompt but produces poorly localized boxes. What does this reveal?",
    choices: ["Semantic transfer and spatial localization are separate capabilities that need separate evaluation", "Text prompts guarantee box quality", "Localization has no metric", "The image has no pixels"],
    answer: 0,
    explanation: "Vision-language alignment can transfer class semantics without solving precise spatial grounding. Evaluate category generalization, localization, calibration, and prompt sensitivity separately."
  },
  {
    id: "mod-05", topic: "Modern & Production", difficulty: "Intermediate",
    question: "What does a NeRF-like model primarily learn?",
    choices: ["A continuous scene function relating 3D position/view direction to density and appearance", "A list of 2D boxes only", "Camera exposure without geometry", "A fixed BEV grid with no rendering"],
    answer: 0,
    explanation: "Neural radiance fields represent a scene continuously and render views by integrating density and radiance along camera rays, assuming known or optimized camera poses."
  },
  {
    id: "mod-06", topic: "Modern & Production", difficulty: "Senior",
    question: "A quantized model preserves overall accuracy but sharply regresses one safety-critical class. What is the right decision?",
    choices: ["Block or constrain release and diagnose calibration data, sensitive operations, and per-class numerical drift", "Launch because the average passed", "Delete the class", "Raise every threshold blindly"],
    answer: 0,
    explanation: "Quality gates should protect critical slices. Inspect activation ranges, representative calibration samples, layer/operator sensitivity, mixed precision, or quantization-aware training."
  },
  {
    id: "mod-07", topic: "Modern & Production", difficulty: "Senior",
    question: "Which latency report is sufficiently specified to support an engineering comparison?",
    choices: ["12 ms", "12 ms p95 end-to-end after warm-up on named hardware, workload, batch/concurrency, synchronization, and software versions", "Fast on my machine", "100 FPS calculated as 1 divided by one kernel time"],
    answer: 1,
    explanation: "A meaningful claim defines the measured boundary, percentile, hardware/software, workload, warm-up, synchronization, and concurrency. Throughput is not generally reciprocal percentile latency."
  },
  {
    id: "mod-08", topic: "Modern & Production", difficulty: "Senior",
    question: "Input-feature drift is detected in production. What can be concluded immediately?",
    choices: ["The input distribution changed under the chosen detector, but quality impact still needs evidence", "The model is certainly wrong", "Retraining will certainly fix it", "The service is unavailable"],
    answer: 0,
    explanation: "Drift is an investigation signal, not proof of degraded task quality. Correlate with delayed labels, proxies, slices, model disagreement, and product or safety outcomes before choosing a response."
  }
];
