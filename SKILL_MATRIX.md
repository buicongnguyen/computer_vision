# Senior Computer Vision Skill Matrix

## Rating scale

| Level | Evidence |
|---|---|
| 0 — Unknown | Cannot explain the concept accurately. |
| 1 — Familiar | Can define it or follow a tutorial; needs help to apply it. |
| 2 — Independent | Can implement/use it, test it, and debug normal failures. |
| 3 — Senior | Can choose among alternatives, quantify trade-offs, handle edge cases, and review others' work. |
| 4 — Organizational | Has shaped architecture/practice across teams, handled novel failure modes, and taught the topic. |

Use a link to code, a report, shipped impact, design review, or recorded mock as
evidence. Years of exposure are not evidence by themselves.

## Common core

| Competency | Ready target | Evidence to produce |
|---|---:|---|
| Linear algebra, probability, optimization | 3 | Derivations plus robust estimation experiment |
| Image formation and projective geometry | 3 | Calibration/pose implementation with degeneracy tests |
| Classical CV and signal processing | 2 | From-scratch operations and failure comparisons |
| Deep learning architectures and training | 3 | Reproducible ablations and training diagnosis |
| Detection and segmentation | 3 | Correct metrics, assignment, slices, taxonomy |
| Representation/self-supervised learning | 2 | Adaptation experiment and paper comparison |
| 3D vision and temporal estimation | 3 for autonomy | Depth/pose/tracking system and uncertainty analysis |
| Data quality and evaluation | 3 | Dataset contract, leakage audit, metric-to-product argument |
| Performance and deployment | 3 | Profile, optimize, export, validate, and monitor |
| ML system design | 3 | End-to-end design with SLOs, costs, failure recovery |
| Python and C++ engineering | 3 | Tested, profiled, reviewable project code |
| Algorithms and data structures | 2-3 | Timed interview log with complexity/test reasoning |
| Technical leadership | 3 | Decisions, mentorship, conflict, failure, and influence stories |
| Communication | 3 | Clear design memo, talk, review response, executive summary |

## Track differentiators

### Google-style ML systems

- Large-scale training/inference, distributed systems, data engines, retrieval,
  multimodal modeling, experiment/statistical rigor, privacy and responsible AI.
- Demonstrate general algorithms/coding strength in addition to ML expertise.

### NVIDIA-style performance

- GPU architecture, parallel algorithms, CUDA, memory access, numerical
  precision, kernel and graph optimization, TensorRT/Triton, Nsight workflows,
  C++ systems engineering.
- The strongest evidence is a reproducible before/after profile with correctness
  thresholds and an explanation of why the bottleneck moved.

### 42dot-style autonomy

- 3D vision/ML, pose and tracking, camera/LiDAR/GPS/IMU fusion, calibration and
  synchronization, SLAM/depth/reconstruction, scalable or self-supervised
  learning, world models, simulation, closed-loop and safety evaluation.
- The strongest evidence is scenario-level analysis across distance, weather,
  motion, occlusion, geography, and sensor degradation.

## Senior evidence audit

For each level-3 claim, answer:

- What decision did you own?
- What alternatives did you reject and why?
- What metric moved, by how much, under what conditions?
- What broke in production or realistic testing?
- How did you respond to uncertainty or missing data?
- Whom did you influence, mentor, or unblock?
- What would you do differently now?

If the answer is only “we used model X,” rate the skill no higher than level 1.

