# 24-Week Roadmap

Default load: 15-20 hours each week. Each phase ends with a review that must be
passed by evidence, not time served.

## Phase 0 — Baseline (week 0)

- Run the diagnostic and environment checks.
- Choose primary/secondary learning branches and an applied study.
- Write a one-page dependency map for one familiar vision system. Missing facts
  become questions to answer through derivation or experiment.

**Gate:** honest baseline, working test environment, calendar, and study question.

## Phase 1 — Mathematical and visual foundations (weeks 1-4)

| Week | Focus | Required artifact |
|---|---|---|
| 1 | Linear algebra, probability, estimation | Derivation notebook: SVD/PCA, MLE/MAP, uncertainty |
| 2 | Image formation, filtering, features | NumPy convolution/gradient lab with boundary tests |
| 3 | Projective geometry and calibration | DLT/homography implementation and calibration report |
| 4 | Optimization and robust estimation | RANSAC/least-squares comparison under outliers |

**Gate:** explain coordinate frames, conditioning, uncertainty, and degeneracy;
implement a tested geometry primitive without a library call.

## Phase 2 — Modern 2D vision (weeks 5-8)

| Week | Focus | Required artifact |
|---|---|---|
| 5 | CNNs, normalization, losses, optimization | Controlled training ablation with learning curves |
| 6 | Detection, assignment, NMS, AP | Detection evaluator and slice-based error report |
| 7 | Semantic/instance segmentation | Boundary/rare-class evaluation and qualitative taxonomy |
| 8 | Transformers, self-supervision, adaptation | Paper comparison plus small transfer-learning experiment |

Advance project 01 during this phase.

**Gate:** reproduce a baseline, diagnose at least three failure categories, and
defend a metric choice against product behavior.

## Phase 3 — 3D, temporal vision, and robotics (weeks 9-12)

| Week | Focus | Required artifact |
|---|---|---|
| 9 | Projection, IPM, stereo, depth and point clouds | Perspective/BEV comparison plus depth uncertainty across distance |
| 10 | LiDAR returns, deskew, filtering, voxels and registration | Point-cloud front end plus ICP convergence and representation benchmark |
| 11 | Tracking, dynamic calibration, odometry and SLAM | Factor-graph study with drift, loop closure and calibration-health faults |
| 12 | Multimodal fusion, occupancy, prediction and planning contracts | Sensor-to-trajectory architecture and fault-propagation review |

Advance project 03. Run the first full cross-topic review.

**Gate:** transform points between frames correctly, model temporal uncertainty,
and identify observability/synchronization/calibration failures.

## Phase 4 — Production ML systems (weeks 13-16)

| Week | Focus | Required artifact |
|---|---|---|
| 13 | Data engines, labels, leakage, slices | Dataset contract, lineage diagram, and audit script |
| 14 | Distributed training and experiment design | Scaling plan, ablation matrix, failure-recovery plan |
| 15 | Deployment, quantization, serving | Exported model with correctness and latency checks |
| 16 | Monitoring, drift, rollback, privacy/safety | SLOs, dashboards spec, runbook, postmortem exercise |

Advance project 02.

**Gate:** present an end-to-end design where data/model/service/monitoring choices
are internally consistent and costed.

## Phase 5 — Topic electives (weeks 17-20)

Choose one primary column and at least one assignment from another.

| Week | Representation and data | Accelerated systems | 3D spatial perception |
|---|---|---|---|
| 17 | Large-scale retrieval/multimodal design | GPU execution and memory hierarchy | Localization, maps, online calibration and SLAM |
| 18 | Data quality and weak/self supervision | CUDA kernels, occupancy, memory access | BEV, voxels, occupancy and sensor fusion |
| 19 | Distributed training/inference economics | TensorRT, precision, fusion, dynamic shapes | Prediction, planning, structured E2E and world models |
| 20 | Responsible evaluation and launch | Nsight bottleneck report | Closed-loop simulation, safety, ODD and fallback |

**Gate:** a 30-minute topic review with derivations, comparisons, and measurements.

### Autonomous-driving specialization flow

Follow this order; later stages assume the contracts from earlier stages:

```text
frames and time → camera/stereo/LiDAR signals → calibration and deskew
→ point clouds and registration → localization/SLAM → voxels/BEV/occupancy
→ detection/tracking → multimodal temporal fusion → motion forecasting
→ behavior and motion planning → control → structured end-to-end models
→ world/VLA models → closed-loop robustness and safety validation
```

Start with modular baselines so errors remain observable. Study planning-oriented
joint models next, sensor-to-trajectory policies after that, and language/world
models last. A learned explanation or photoreal future is not a geometry, dynamics,
or safety proof.

## Phase 6 — Integration and synthesis (weeks 21-24)

| Week | Focus | Required artifact |
|---|---|---|
| 21 | Capstone hardening | Reproduction command, tests, model/data cards, demo |
| 22 | Coding and derivation review | Two timed reviews plus corrected error log |
| 23 | System design and trade-offs | Two design reviews and eight evidence-backed decisions |
| 24 | Course synthesis | Project pages, comparison report, source audit, and next-study map |

**Final gate:** complete the project rubric, run a five-part technical review,
and have two readers challenge the applied study's assumptions and conclusions.

## Alternative pacing

### 10 hours/week: 36 weeks

Make each four-week content phase six weeks. Preserve all gates, reviews, and
project artifacts. Do not run more than one large training experiment per week.

### Experienced practitioner: 12 weeks

Pair weeks 1+2, 3+4, 5+6, 7+8, 9+10, 11+12, 13+14, and 15+16. Spend the saved
time on the primary elective and capstone. A paired week passes only if the
diagnostic for both topics begins at level 3.

## Review checkpoints

At weeks 4, 8, 12, 16, 20, and 24 ask:

1. What can I now implement or decide that I could not before?
2. What evidence would persuade a skeptical technical reader?
3. Which failure surprised me, and how did it change the system?
4. Which score improved? Which score stayed low, and why?
5. Should the next phase change based on the failures and dependencies found?
