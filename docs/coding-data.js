window.CV_CODING_TASKS = [
  {
    id: "img-convolution", title: "2D Convolution with Explicit Borders",
    track: "Image Ops", difficulty: "Foundation", minutes: 45, language: "Python/NumPy",
    prompt: "Implement batched or single-channel 2D correlation/convolution without calling a library convolution. Make kernel flipping, stride, padding, and output shape explicit.",
    contract: ["Reject invalid shapes and nonpositive stride", "Support valid and same padding", "Document whether the kernel is flipped", "Return float output without mutating inputs"],
    tests: ["3x3 hand-computed example", "Identity and zero kernels", "Odd/even kernel policy", "Empty or too-small input", "Compare with a trusted library"],
    hints: ["Derive output dimensions before loops", "Separate padding from the accumulation kernel"],
    evidence: "Unit tests, complexity analysis, and a vectorized/im2col comparison."
  },
  {
    id: "img-bilinear", title: "Bilinear Sampler",
    track: "Image Ops", difficulty: "Intermediate", minutes: 60, language: "Python/NumPy",
    prompt: "Sample an image at floating-point coordinates with bilinear interpolation and a declared pixel-center convention.",
    contract: ["Support an N by 2 coordinate array", "Choose clamp, zero, or reject border behavior", "Handle grayscale and multi-channel images", "State align-corners behavior"],
    tests: ["Integer coordinates return exact pixels", "Center of four pixels returns weighted average", "Border and out-of-range points", "Numerical comparison with OpenCV or PyTorch"],
    hints: ["Compute floor/ceil neighbors and fractional weights", "Most bugs are coordinate-convention bugs"],
    evidence: "A diagram, golden tests, and a note on differentiability."
  },
  {
    id: "img-sobel", title: "Gradient Magnitude and Orientation",
    track: "Image Ops", difficulty: "Foundation", minutes: 40, language: "Python/NumPy",
    prompt: "Compute Sobel x/y derivatives, magnitude, and orientation; apply non-maximum suppression along the gradient direction.",
    contract: ["Make border handling explicit", "Use atan2 for orientation", "Keep units/ranges documented", "Avoid division by zero"],
    tests: ["Horizontal and vertical ramps", "Constant image", "Synthetic diagonal edge", "Compare gradient direction, not only magnitude"],
    hints: ["An x derivative responds to a vertical edge", "Quantize orientation only for the NMS step"],
    evidence: "Visual failure comparison across noise levels and smoothing scales."
  },
  {
    id: "img-components", title: "Connected Components on a Mask",
    track: "Image Ops", difficulty: "Intermediate", minutes: 50, language: "Python or C++",
    prompt: "Label connected foreground components and return area and bounding box for each.",
    contract: ["Support selectable 4- or 8-connectivity", "Use deterministic label order", "Handle an empty mask", "Do not revisit pixels indefinitely"],
    tests: ["Single pixel and empty mask", "Diagonal pixels under both connectivities", "Donut-shaped region", "Large component for stack-depth safety"],
    hints: ["BFS/DFS is sufficient; union-find is an extension", "Use an explicit queue for large images"],
    evidence: "Correctness tests plus O(HW) time and memory explanation."
  },
  {
    id: "img-pyramid", title: "Gaussian and Laplacian Pyramids",
    track: "Image Ops", difficulty: "Intermediate", minutes: 75, language: "Python/NumPy",
    prompt: "Build Gaussian and Laplacian pyramids, then reconstruct the input within a declared tolerance.",
    contract: ["Low-pass before downsampling", "Handle odd image sizes", "Define upsample alignment", "Return level metadata"],
    tests: ["Constant and impulse images", "Odd dimensions", "Reconstruction error bound", "Aliasing comparison without prefilter"],
    hints: ["Store exact target shapes for reconstruction", "The Laplacian level is a residual between adjacent scales"],
    evidence: "Reconstruction test and an aliasing visualization."
  },
  {
    id: "img-histogram", title: "Contrast-Limited Histogram Mapping",
    track: "Image Ops", difficulty: "Advanced", minutes: 90, language: "Python/NumPy",
    prompt: "Implement global histogram equalization, then design a tiled contrast-limited extension and analyze seams/noise amplification.",
    contract: ["Define integer and float input policy", "Preserve monotonic mapping", "Handle constant images", "Limit local histogram peaks before redistribution"],
    tests: ["Constant and bimodal images", "Monotonicity", "Range preservation", "Tile-boundary interpolation"],
    hints: ["Start with a CDF lookup table", "CLAHE needs interpolation between neighboring tile mappings"],
    evidence: "Before/after histograms and failure analysis on low-light noise."
  },

  {
    id: "geo-transform", title: "Frame-Labeled SE(3) Transform Library",
    track: "Geometry & Calibration", difficulty: "Intermediate", minutes: 90, language: "Python or C++",
    prompt: "Create a rigid-transform type whose API names source/destination frames, units, timestamp, and calibration version.",
    contract: ["Validate rotation orthonormality", "Implement compose, inverse, and point transform", "Reject incompatible frame composition", "Avoid ambiguous anonymous matrices"],
    tests: ["Identity/inverse round trip", "Known 90-degree rotation and translation", "Associativity within tolerance", "Mismatched frames fail"],
    hints: ["Use T_destination_source notation consistently", "Metadata checks prevent errors that matrix math cannot"],
    evidence: "Typed API, property tests, and a frame-tree diagram."
  },
  {
    id: "geo-dlt", title: "Normalized DLT Homography",
    track: "Geometry & Calibration", difficulty: "Intermediate", minutes: 75, language: "Python/NumPy",
    prompt: "Estimate a planar homography from four or more correspondences using normalized DLT.",
    contract: ["Center/scale both point sets", "Solve the homogeneous system with SVD", "Use a deterministic scale convention", "Reject rank-deficient configurations"],
    tests: ["Exact synthetic homography", "Noisy overdetermined points", "Collinear and duplicate points", "Round-trip reprojection"],
    hints: ["Mean distance after normalization is usually sqrt(2)", "Denormalize in the correct order"],
    evidence: "Reprojection plot and conditioning comparison with unnormalized DLT."
  },
  {
    id: "geo-ransac", title: "Adaptive RANSAC",
    track: "Geometry & Calibration", difficulty: "Advanced", minutes: 100, language: "Python/NumPy",
    prompt: "Wrap a line or homography estimator in seeded RANSAC with adaptive iteration count and model refinement.",
    contract: ["Inject an RNG/seed", "Reject degenerate samples", "Use an explicit residual and threshold", "Refit from consensus", "Stop from target confidence/inlier estimate"],
    tests: ["Known outlier ratio", "All outliers", "Degenerate minimal samples", "Deterministic repeated run"],
    hints: ["Update N from log(1-p)/log(1-w^s)", "Score quality should break consensus-size ties"],
    evidence: "Success-rate experiment versus outlier rate and threshold."
  },
  {
    id: "cal-project", title: "Camera Projection and Distortion",
    track: "Geometry & Calibration", difficulty: "Intermediate", minutes: 75, language: "Python/NumPy",
    prompt: "Project world points into pixels using labeled extrinsics, intrinsics, and radial/tangential distortion.",
    contract: ["Define transform direction", "Reject or flag points behind/at camera plane", "Separate normalized and pixel coordinates", "Document distortion coefficient convention"],
    tests: ["Principal-axis point", "Known pose", "Zero distortion parity", "Finite-difference Jacobian check"],
    hints: ["Transform world to camera before dividing by z", "Apply distortion in normalized camera coordinates"],
    evidence: "Projection tests and an overlay on a synthetic calibration scene."
  },
  {
    id: "cal-audit", title: "Calibration Residual Auditor",
    track: "Geometry & Calibration", difficulty: "Advanced", minutes: 90, language: "Python",
    prompt: "Build a report that goes beyond mean reprojection error: residual vector maps, radial trend, per-view statistics, coverage, and held-out checks.",
    contract: ["Preserve point/view identity", "Report robust and percentile statistics", "Visualize spatial structure", "Flag poor pose/image coverage"],
    tests: ["Injected focal error", "Injected radial distortion", "One bad view", "Accurate low-noise calibration"],
    hints: ["Systematic residual direction is more informative than one mean", "Hold out some board poses from fitting"],
    evidence: "HTML/Markdown report that correctly diagnoses injected faults."
  },
  {
    id: "geo-triangulate", title: "Linear and Nonlinear Triangulation",
    track: "Geometry & Calibration", difficulty: "Advanced", minutes: 100, language: "Python/NumPy",
    prompt: "Triangulate a point from two calibrated views, test cheirality, then refine by reprojection minimization.",
    contract: ["Use consistent camera matrices", "Normalize homogeneous result", "Reject points at infinity/behind cameras", "Return uncertainty or conditioning signal"],
    tests: ["Exact synthetic point", "Noisy pixels", "Small baseline/distant point", "Mismatched correspondence"],
    hints: ["DLT gives an initialization, not necessarily the optimal image-space solution", "Triangulation angle predicts conditioning"],
    evidence: "Depth error versus distance, baseline, and pixel noise."
  },

  {
    id: "det-iou-nms", title: "Vectorized IoU and Stable NMS",
    track: "Detection & Tracking", difficulty: "Foundation", minutes: 60, language: "Python/NumPy",
    prompt: "Implement continuous-coordinate pairwise IoU and deterministic per-class hard NMS.",
    contract: ["Validate xyxy boxes", "Define zero-area behavior", "Preserve stable order on score ties", "Define threshold boundary"],
    tests: ["Identical/disjoint/partial boxes", "Zero-area and empty arrays", "Score ties", "Cross-class overlap"],
    hints: ["Broadcast top-left maxima and bottom-right minima", "Do not add one unless using an explicitly pixel-inclusive convention"],
    evidence: "Tests plus O(N squared) scaling plot and soft-NMS discussion."
  },
  {
    id: "det-ap", title: "Detection Matching and Average Precision",
    track: "Detection & Tracking", difficulty: "Advanced", minutes: 120, language: "Python/NumPy",
    prompt: "Match scored predictions one-to-one to ground truth and compute a documented all-points AP.",
    contract: ["Process predictions by descending score", "Match within class and image", "Handle ignore/crowd explicitly", "Prevent one ground truth from matching twice"],
    tests: ["Perfect, duplicate, false-positive, and missed cases", "Score ties", "Empty prediction/ground truth", "Hand-integrated PR curve"],
    hints: ["Separate matching from PR integration", "Validate against an official evaluator on a tiny fixture"],
    evidence: "Tiny oracle dataset and parity report."
  },
  {
    id: "trk-kalman", title: "Constant-Velocity Kalman Filter",
    track: "Detection & Tracking", difficulty: "Intermediate", minutes: 80, language: "Python/NumPy",
    prompt: "Track x, y, vx, vy from noisy position measurements using white-acceleration process noise.",
    contract: ["Support variable positive dt", "Propagate covariance", "Use a stable correction form", "Expose innovation and Mahalanobis distance"],
    tests: ["Known constant motion", "Missing measurement sequence", "High/low measurement noise", "Covariance symmetry and PSD"],
    hints: ["Build Q from an acceleration-noise mapping", "Solve linear systems rather than explicitly inverting S"],
    evidence: "Trajectory/uncertainty plot and gating explanation."
  },
  {
    id: "trk-assignment", title: "Gated One-to-One Association",
    track: "Detection & Tracking", difficulty: "Advanced", minutes: 100, language: "Python or C++",
    prompt: "Associate tracks and detections using motion and optional appearance cost, gating invalid pairs before one-to-one assignment.",
    contract: ["Handle unmatched tracks/detections", "Prevent invalid pairs from becoming cheap", "Return deterministic mapping", "Separate cost construction from solver"],
    tests: ["Crossing objects", "No detections", "More tracks than detections", "All pairs gated", "Tied costs"],
    hints: ["A huge finite invalid cost can still be chosen; represent gating carefully", "Compare greedy with Hungarian on a counterexample"],
    evidence: "Synthetic crossing sequence and ID-switch analysis."
  },
  {
    id: "trk-manager", title: "Track Lifecycle Manager",
    track: "Detection & Tracking", difficulty: "Advanced", minutes: 90, language: "Python or C++",
    prompt: "Implement tentative/confirmed/deleted tracks with hit, miss, output, and ID-allocation policies.",
    contract: ["Separate internal and published state", "Handle dropped frames/variable dt", "Never reuse an active ID", "Make thresholds configurable"],
    tests: ["Single detection blip", "Long occlusion", "Dropped frame", "Duplicate detections", "End-of-stream cleanup"],
    hints: ["Confirmation controls false tracks; deletion controls fragmentation and stale tracks", "Test lifecycle independently from the detector"],
    evidence: "State-transition diagram and ablation of lifecycle thresholds."
  },
  {
    id: "trk-metrics", title: "Tracking Failure Slice Report",
    track: "Detection & Tracking", difficulty: "Advanced", minutes: 90, language: "Python",
    prompt: "Produce detection and identity metrics plus slices by range, occlusion, density, speed, and track age.",
    contract: ["Keep sequence boundaries", "Use an official metric implementation where possible", "Separate detector and association errors", "Report counts with rates"],
    tests: ["Hand-worked ID switch", "Track fragmentation", "Perfect sequence", "Empty frame and empty sequence"],
    hints: ["Aggregate metrics can hide one dangerous scenario", "Keep the evaluation unit consistent when bootstrapping uncertainty"],
    evidence: "Report that changes one tracker design decision."
  },

  {
    id: "bev-depth-points", title: "Depth Map to Point Cloud",
    track: "BEV & 3D", difficulty: "Foundation", minutes: 60, language: "Python/NumPy",
    prompt: "Back-project valid depth pixels to 3D camera coordinates and optionally transform them to an ego/world frame.",
    contract: ["Declare whether depth is z-depth or ray distance", "Use pixel-center convention", "Mask invalid depth", "Preserve units and frame labels"],
    tests: ["Principal point", "Known pixel/depth", "Invalid/zero depth", "Transform round trip"],
    hints: ["For z-depth, X=(u-cx)Z/fx and Y=(v-cy)Z/fy", "Do not silently mix millimeters and meters"],
    evidence: "Synthetic plane reconstruction and frame-convention note."
  },
  {
    id: "bev-ipm", title: "Ground-Plane Inverse Perspective Mapping",
    track: "BEV & 3D", difficulty: "Intermediate", minutes: 90, language: "Python/NumPy or OpenCV",
    prompt: "Warp camera imagery or semantic scores to a metric ground-plane BEV using calibration and a declared ROI/grid.",
    contract: ["Derive image-ground homography", "Map BEV cells to source pixels safely", "Define meters per cell and axes", "Return an invalid/visibility mask"],
    tests: ["Synthetic checkerboard plane", "Identity-like top-down camera", "Changed pitch/height", "Off-plane object failure"],
    hints: ["Backward warping avoids holes", "Use four known ground points as an independent homography check"],
    evidence: "Calibration sensitivity study and tall-object failure gallery."
  },
  {
    id: "bev-lift-splat", title: "Frustum Lift and BEV Splat",
    track: "BEV & 3D", difficulty: "Advanced", minutes: 150, language: "PyTorch",
    prompt: "Lift image features over discrete depth bins, transform frustum points to ego coordinates, and pool features into a BEV grid.",
    contract: ["Vectorize camera/batch/depth dimensions", "Define depth-bin parameterization", "Mask outside-grid points", "Use deterministic sum or mean pooling"],
    tests: ["One camera/one depth bin", "Known synthetic projection", "Two cameras hitting one cell", "Calibration perturbation"],
    hints: ["First validate geometry with scalar loops", "Keep a shape table beside every tensor operation"],
    evidence: "Geometry oracle, memory profile, and depth-bin ablation."
  },
  {
    id: "bev-voxelize", title: "Point-Cloud Voxelization",
    track: "BEV & 3D", difficulty: "Intermediate", minutes: 80, language: "Python/NumPy or CUDA",
    prompt: "Convert metric 3D points and features into bounded voxel or pillar indices with deterministic aggregation.",
    contract: ["Declare inclusive/exclusive bounds", "Handle boundary points and NaNs", "Return counts/valid mask", "Support sum/mean/max policy"],
    tests: ["Points at min/max bounds", "Multiple points per voxel", "Empty cloud", "Negative coordinates"],
    hints: ["Index is floor((point-min)/voxel_size)", "Floating-point max-bound behavior needs an explicit policy"],
    evidence: "Occupancy visualization and scaling with point count/grid size."
  },
  {
    id: "bev-temporal", title: "Temporal BEV Ego-Motion Warp",
    track: "BEV & 3D", difficulty: "Advanced", minutes: 100, language: "Python/PyTorch",
    prompt: "Warp a previous metric BEV feature map into the current ego frame using timestamped SE(2)/SE(3) motion.",
    contract: ["Name transform direction", "Convert metric coordinates to grid sampling coordinates", "Return validity mask", "Define interpolation/alignment"],
    tests: ["Zero motion identity", "Known translation/rotation", "Round trip", "Out-of-bounds region"],
    hints: ["For backward sampling, ask where each current cell came from", "Separate metric transform from normalized grid coordinates"],
    evidence: "Synthetic landmark alignment and timestamp-offset experiment."
  },
  {
    id: "bev-fusion-audit", title: "Multi-Sensor Alignment Auditor",
    track: "BEV & 3D", difficulty: "Advanced", minutes: 100, language: "Python",
    prompt: "Project LiDAR or radar points into camera views and BEV, then quantify alignment versus range, image region, motion, and timestamp.",
    contract: ["Preserve sensor time/frame metadata", "Deskew or declare no deskew", "Report visibility/occlusion limitations", "Support injected calibration/time faults"],
    tests: ["Static target", "Moving ego", "Known extrinsic offset", "Known time offset"],
    hints: ["Spatial and temporal faults can imitate each other", "Use structured residual direction, not only nearest-neighbor mean"],
    evidence: "Fault-injection report that distinguishes at least two causes."
  },

  {
    id: "sys-bounded-queue", title: "Bounded Video Pipeline",
    track: "Production & GPU", difficulty: "Advanced", minutes: 120, language: "C++ or Python",
    prompt: "Build capture, inference, and sink stages connected by bounded queues with explicit overload and shutdown behavior.",
    contract: ["No unbounded growth", "Carry frame/stream/event timestamps", "Define block/drop/coalesce policy", "Propagate errors and cleanly stop"],
    tests: ["Slow sink", "Corrupt frame", "Producer burst", "Shutdown with queued work", "Multiple streams"],
    hints: ["Backpressure is product behavior, not only a container choice", "Measure queue delay separately from service time"],
    evidence: "Load test with p50/p95/p99, drops, throughput, and memory."
  },
  {
    id: "sys-latency", title: "Honest Latency Harness",
    track: "Production & GPU", difficulty: "Intermediate", minutes: 70, language: "Python or C++",
    prompt: "Create a benchmark harness that reports cold/warm end-to-end latency, percentiles, throughput, and peak memory.",
    contract: ["Named timing boundary", "Warm-up and repeated samples", "Synchronize asynchronous GPU work", "Record hardware/software/workload"],
    tests: ["Known sleep workload", "Asynchronous mock", "Empty/invalid samples", "Multiple concurrency levels"],
    hints: ["Throughput is completed work divided by wall time", "A GPU API call returning is not proof work completed"],
    evidence: "Machine-readable raw samples and benchmark report."
  },
  {
    id: "sys-parity", title: "Training-to-Serving Parity Test",
    track: "Production & GPU", difficulty: "Advanced", minutes: 90, language: "Python",
    prompt: "Run golden raw inputs through training and exported-serving preprocessing/model/postprocessing, then bound differences stage by stage.",
    contract: ["Version golden inputs and artifacts", "Compare intermediate tensors", "Handle dynamic shapes", "Use task-aware output matching"],
    tests: ["Color-order mismatch", "Resize-coordinate mismatch", "FP16 tolerance", "Class-map or NMS mismatch"],
    hints: ["Start before the model; preprocessing bugs dominate many parity failures", "Use absolute and relative tolerances with slice checks"],
    evidence: "A test that catches at least three deliberately injected skews."
  },
  {
    id: "sys-int8", title: "INT8 Calibration and Slice Audit",
    track: "Production & GPU", difficulty: "Advanced", minutes: 120, language: "Python/TensorRT",
    prompt: "Quantize a small vision model, compare layer/output drift, and audit quality by class and scenario slice.",
    contract: ["Representative calibration manifest", "Exact FP baseline", "Critical-slice quality gates", "Named hardware/runtime"],
    tests: ["Narrow calibration distribution", "Outlier activation", "Mixed-precision sensitive layer", "Repeatable engine build where possible"],
    hints: ["Aggregate accuracy can hide class collapse", "Inspect activation ranges and operation sensitivity before retraining"],
    evidence: "Accuracy-latency-memory table and adopt/reject decision."
  },
  {
    id: "gpu-normalize", title: "Fused CUDA Image Preprocessing",
    track: "Production & GPU", difficulty: "Advanced", minutes: 150, language: "CUDA C++",
    prompt: "Fuse uint8 layout conversion, normalization, and optional resize into a CUDA kernel with a CPU oracle.",
    contract: ["Bounds-safe arbitrary image sizes", "Declared layout/color/coordinate convention", "Asynchronous stream parameter", "Error checking outside timed region"],
    tests: ["Odd dimensions", "Channel-order sentinel", "Border sampling", "FP16/FP32 tolerance"],
    hints: ["Start with correctness and a timeline", "Coalescing, occupancy, and arithmetic intensity must be measured, not guessed"],
    evidence: "Nsight before/after profile, parity result, and new bottleneck."
  },
  {
    id: "sys-monitor", title: "Perception Monitoring Simulator",
    track: "Production & GPU", difficulty: "Advanced", minutes: 100, language: "Python",
    prompt: "Simulate service, input, prediction, and delayed-quality signals for a model rollout; implement alerts with windows and actions.",
    contract: ["Separate event and ingestion time", "Define SLO population/window", "Avoid alerting on drift as proof of quality loss", "Include rollback/canary state"],
    tests: ["Latency spike", "Camera schema change", "Prediction shift without quality loss", "Delayed critical-slice regression"],
    hints: ["Each alert needs an owner and response", "Use a state machine to avoid flapping"],
    evidence: "Dashboard specification, incident timeline, and revised regression gate."
  },

  {
    id: "auto-lidar-cloud", title: "LiDAR Returns to a Metadata-Rich Point Cloud",
    track: "Autonomous Driving", difficulty: "Intermediate", minutes: 90, language: "Python/NumPy or C++",
    prompt: "Convert LiDAR range, azimuth, elevation, intensity, ring, and acquisition-time records into Cartesian points while retaining the metadata needed for later calibration, deskew, and filtering.",
    contract: ["Declare angle units, axis convention, output frame, and range units", "Preserve intensity, ring, return identity, and per-point acquisition time", "Define invalid, saturated, zero, and out-of-range policies", "Return a validity mask instead of silently manufacturing geometry"],
    tests: ["Returns on each declared coordinate axis", "Degree/radian and meter/unit sentinels", "Invalid and non-finite ranges", "Multiple rings, returns, and unsorted timestamps"],
    hints: ["Write the spherical-to-Cartesian convention beside the implementation", "A point without its frame and acquisition time is incomplete sensor evidence"],
    evidence: "Round-trip angle/range checks, a colored point-cloud plot, and a metadata-loss audit."
  },
  {
    id: "auto-lidar-deskew", title: "Per-Point LiDAR Motion Deskew",
    track: "Autonomous Driving", difficulty: "Advanced", minutes: 120, language: "Python/NumPy or C++",
    prompt: "Transform every point in a moving LiDAR sweep from its acquisition pose to one declared reference time using an interpolated ego-pose trajectory.",
    contract: ["Name every source, destination, sensor, ego, and reference-time frame", "Interpolate translation and rotation with an explicit SE(3) policy", "Reject or flag unsupported extrapolation and pose gaps", "Preserve all point metadata and return deskew validity"],
    tests: ["Stationary-platform identity", "Known constant translation", "Known constant yaw rate", "Irregular point times and a missing pose interval"],
    hints: ["Compose the sensor extrinsic on the correct side of the time-varying ego pose", "First generate a synthetic wall that should become straight at the reference time"],
    evidence: "Before/after wall residuals plus error curves for pose-rate and clock-offset perturbations."
  },
  {
    id: "auto-icp-point-plane", title: "Robust Point-to-Plane ICP",
    track: "Autonomous Driving", difficulty: "Advanced", minutes: 150, language: "Python/NumPy or C++",
    prompt: "Implement coarse-to-fine point-to-plane ICP with nearest-neighbor correspondence filtering, a robust residual weight, an SE(3) update, and explicit convergence and degeneracy reports.",
    contract: ["Validate or normalize target normals", "Gate correspondence distance and reject invalid matches", "Use a declared robust loss and numerically stable linear solve", "Report conditioning, inlier support, convergence reason, and final transform direction"],
    tests: ["Exact synthetic transform with adequate 3D structure", "Outliers and partial overlap", "Planar geometry with an unobservable motion component", "Bad normals and poor initialization"],
    hints: ["Derive the small-angle point-to-plane Jacobian before vectorizing", "A low residual on degenerate geometry is not a trustworthy six-degree pose"],
    evidence: "Convergence plots, basin-of-initialization study, and a failure table separating mismatch from geometric degeneracy."
  },
  {
    id: "auto-rgb-lidar-project", title: "Time-Aware RGB–LiDAR Projection",
    track: "Autonomous Driving", difficulty: "Advanced", minutes: 120, language: "Python/NumPy or C++",
    prompt: "Project timestamped LiDAR points into a calibrated RGB image, resolve multiple points per pixel with a depth buffer, and expose spatial, temporal, and visibility validity separately.",
    contract: ["Use frame-labeled extrinsics and an acquisition-time alignment policy", "Reject points behind the camera and outside the image", "Apply the declared distortion model or require rectified imagery", "Use nearest-depth visibility while retaining collision and validity diagnostics"],
    tests: ["Hand-computed projection through a known transform", "Two depths landing on one pixel", "Behind-camera and border points", "Moving-platform fixture with a known time offset"],
    hints: ["Projection agreement cannot distinguish every time error from every extrinsic error", "Raster visibility is not the same as LiDAR return visibility at occlusion boundaries"],
    evidence: "Colored overlay, z-buffer collision audit, and residual-versus-range plots under independent time and extrinsic perturbations."
  },
  {
    id: "auto-trajectory-collision", title: "Occupancy–Trajectory Collision Checker",
    track: "Autonomous Driving", difficulty: "Intermediate", minutes: 100, language: "Python/NumPy or C++",
    prompt: "Check a timestamped ego trajectory and oriented vehicle footprint against static or time-indexed occupancy while reporting first contact, clearance, unknown-space exposure, and out-of-grid state.",
    contract: ["Declare world-to-grid axes, origin, resolution, cell-center convention, and time basis", "Define separate occupied, free, unknown, and outside policies", "Interpolate densely enough to prevent tunneling between waypoints", "Support footprint inflation and return the complete collision trace"],
    tests: ["Clear path and direct collision", "Obstacle between sparse waypoints", "Rotated footprint at a grid boundary", "Unknown cells and a moving obstacle in temporal occupancy"],
    hints: ["Transform footprint samples into grid coordinates at every evaluated pose", "Unknown is an evidence state, not automatically free or occupied"],
    evidence: "Trajectory/occupancy visualization and a resolution, interpolation-step, and inflation sensitivity table."
  },
  {
    id: "auto-closed-loop-eval", title: "Replayable Closed-Loop Scenario Evaluator",
    track: "Autonomous Driving", difficulty: "Advanced", minutes: 150, language: "Python",
    prompt: "Build a deterministic closed-loop simulator harness that repeatedly observes, invokes a policy, advances a simple vehicle/world model, injects configured perception faults, and scores behavior until termination.",
    contract: ["Version scenario initial state, variation axes, random seed, policy, and dynamics", "Separate collision, progress, rule, comfort, intervention, fallback, and timeout metrics", "Record observations, actions, states, faults, and termination cause for replay", "Compare closed-loop outcomes with an open-loop action or trajectory metric on the same scenarios"],
    tests: ["Nominal route completion", "Delayed obstacle observation with recovery or collision", "Seeded stochastic actor with exact replay", "Timeout, invalid action, and fallback termination"],
    hints: ["The policy action must influence the next observation for the test to be closed loop", "Keep scenario success criteria independent of the policy under evaluation"],
    evidence: "Scenario matrix showing at least one case where similar open-loop error produces different closed-loop outcomes, with a replayable incident trace."
  }
];
