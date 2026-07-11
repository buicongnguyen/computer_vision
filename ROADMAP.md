# 24-Week Roadmap

Default load: 15-20 hours each week. Each phase ends with a review that must be
passed by evidence, not time served.

## Phase 0 — Baseline (week 0)

- Run the diagnostic and environment checks.
- Choose primary/secondary role tracks and a capstone.
- Write a one-page account of your strongest shipped system and its measurable
  impact. Missing facts become questions to recover before interviews.

**Gate:** honest scorecard, working test environment, calendar, target role.

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
| 9 | Stereo, depth, point clouds, 3D boxes | Depth/point-cloud error analysis across distance |
| 10 | Optical flow, tracking, Kalman filtering | Multi-object tracker with association ablations |
| 11 | Pose, PnP, SLAM, bundle adjustment | Factor/pose graph design memo and toy optimizer |
| 12 | Camera/LiDAR/IMU fusion and timing | Frame/time-alignment test and fusion design review |

Advance project 03. Run the first full mock loop.

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

## Phase 5 — Role electives (weeks 17-20)

Choose one primary column and at least one assignment from another.

| Week | Google / ML systems | NVIDIA / performance | 42dot / autonomy |
|---|---|---|---|
| 17 | Large-scale retrieval/multimodal design | GPU execution and memory hierarchy | HD maps, localization, coordinate frames |
| 18 | Data quality and weak/self supervision | CUDA kernels, occupancy, memory access | BEV/occupancy/world models |
| 19 | Distributed training/inference economics | TensorRT, precision, fusion, dynamic shapes | Closed-loop simulation and scenario mining |
| 20 | Responsible evaluation and launch | Nsight bottleneck report | Safety, redundancy, ODD and fallback |

**Gate:** a 30-minute role-specific technical review with quantitative evidence.

## Phase 6 — Senior loop and application sprint (weeks 21-24)

| Week | Focus | Required artifact |
|---|---|---|
| 21 | Capstone hardening | Reproduction command, tests, model/data cards, demo |
| 22 | Coding and CV interview loop | Two timed mocks plus corrected error log |
| 23 | System design and leadership | Two design mocks and eight evidence-backed stories |
| 24 | Portfolio/application launch | Targeted resume, project pages, outreach, application batch |

**Final gate:** complete the rubric in `projects/PORTFOLIO_RUBRIC.md`, run a
five-part mock loop, and have two qualified reviewers challenge the capstone.

## Alternative pacing

### 10 hours/week: 36 weeks

Make each four-week content phase six weeks. Preserve all gates, mocks, and
project artifacts. Do not run more than one large training experiment per week.

### Experienced practitioner: 12 weeks

Pair weeks 1+2, 3+4, 5+6, 7+8, 9+10, 11+12, 13+14, and 15+16. Spend the saved
time on the primary elective and capstone. A paired week passes only if the
diagnostic for both topics begins at level 3.

## Review checkpoints

At weeks 4, 8, 12, 16, 20, and 24 ask:

1. What can I now implement or decide that I could not before?
2. What evidence would persuade a skeptical staff engineer?
3. Which failure surprised me, and how did it change the system?
4. Which score improved? Which score stayed low, and why?
5. Should the next phase change based on current job descriptions?

