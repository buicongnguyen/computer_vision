# Project 03 — Calibrated 3D Multi-Object Tracking

## Mission

Build a temporal 3D perception system whose coordinate frames, timestamps,
uncertainty, association and evaluation can be audited. This is a bridge from
general CV to autonomous-driving perception.

## Dataset choices

Use an accessible subset whose terms you accept, for example KITTI tracking,
nuScenes mini, Waymo Open Dataset, or 42dot’s published multi-camera dataset.
Pick only the sensors/task needed for a thin vertical slice. Do not commit the
raw dataset or derived artifacts if its terms prohibit redistribution.

## Minimum system

- Typed/labeled coordinate transforms with unit and composition tests.
- Dataset adapter preserving scene/frame IDs, timestamps, calibration and ego
  pose versions.
- A 3D detection source (published predictions or permitted pretrained model).
- Constant-velocity Kalman or EKF state with explicit process/measurement noise.
- Association using geometric gating plus a one-to-one algorithm.
- Track birth, confirmation, missed-update, deletion and output policy.
- Evaluation and replay visualization.

## Milestones

### M1 — Geometry and time contract

- Frame tree diagram and notation such as `T_destination_source`.
- Tests for identity, inverse, composition, units, projection and known points.
- Timestamp alignment/maximum skew policy and an injected-offset experiment.

### M2 — Tracking baseline

- Hand-created crossing/occlusion sequence with expected association behavior.
- Kalman predict/update and innovation covariance tests.
- Greedy/IoU baseline followed by gated Hungarian or justified alternative.

### M3 — Evaluation

- Detection versus association metrics appropriate to the dataset (for example
  AMOTA/MOTA, IDF1, HOTA and ID switches), with official evaluator comparison.
- Range, class, speed, occlusion, density, turning/ego-motion and scene slices.
- Uncertainty/gating calibration and failure taxonomy.

### M4 — Ablations

At minimum: process noise, measurement noise, gate, association cost, track
confirmation/deletion and time offset. Keep detector inputs fixed so tracking
effects are identifiable.

### M5 — Senior review

- Design, benchmark and failure report; CPU smoke replay; reproducible config.
- Missing/delayed detection, dropped frame, corrupt calibration and timestamp
  offset fault tests.
- Deployment/monitoring interface and safety limitations.

## Acceptance criteria

- No unlabeled raw transform matrix crosses a public interface.
- Synthetic geometry and association oracles pass before dataset metrics run.
- Metric implementation is compared with the dataset’s official evaluator.
- Results include track quality and latency by important scenario slices.
- At least one failure caused a documented design or data/evaluation change.

## Senior extensions

- Camera/LiDAR/radar fusion with missing-sensor training and evaluation.
- Appearance embeddings with domain/lighting analysis.
- Multi-camera global tracking using 42dot MCMOT if terms fit.
- Learned motion/association compared against the interpretable filter baseline.
- C++/TensorRT streaming implementation with temporal-state compatibility tests.

