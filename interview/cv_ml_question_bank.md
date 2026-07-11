# Computer Vision and ML Question Bank

Use these as oral drills. A strong answer includes the signals in the right
column and can survive follow-up questions; do not memorize the wording.

## Geometry and estimation

| Question | Strong-answer signal |
|---|---|
| What do camera intrinsics and extrinsics represent? | Coordinate frames, units, projection equation, distortion separate from pinhole model |
| Why are homogeneous coordinates useful? | Translation/projective transforms, scale equivalence, points at infinity |
| Derive the epipolar constraint. | Back-projected rays, relative pose, essential/fundamental matrix and calibration |
| When is homography appropriate? | Planar scene or pure rotation; parallax failure and degeneracy |
| How does DLT estimate a homography? | Linear cross-product constraints, normalization, SVD null space, rank/degeneracy |
| PnP versus essential-matrix pose? | 3D-2D versus 2D-2D, scale, minimal solvers, outliers |
| Why is triangulation uncertain at long range? | Small disparity/angle, depth sensitivity, baseline/focal length and calibration error |
| What does bundle adjustment optimize? | Joint reprojection objective, poses/landmarks, gauge freedom, robust loss, sparse structure |
| Explain RANSAC iteration count. | Inlier rate, sample size, target confidence; adaptive estimate and model verification |
| How do you validate calibration? | Reprojection plus independent geometry, spatial/temporal slices, physical plausibility, drift |

## Deep learning mechanics

| Question | Strong-answer signal |
|---|---|
| Why do residual connections help? | Optimization/gradient path and identity mapping; not a claim that gradients can never vanish |
| Batch norm train versus inference behavior? | Batch statistics, running estimates, small/distributed batch issues, alternatives |
| Cross-entropy with logits: why not softmax first? | Log-sum-exp stability and fused implementation |
| What causes training loss to become NaN? | Data, scale/precision, loss math, gradients/optimizer, localization strategy |
| Weight decay versus L2 regularization? | Equivalence conditions and decoupled decay in adaptive optimizers |
| How does mixed precision work? | Low-precision ops, higher-precision accumulation/weights, loss scaling, overflow and quality checks |
| CNN versus vision transformer? | Inductive bias, data/compute, resolution scaling, global/local interaction, deployment—not slogans |
| What does self-supervised learning buy? | Representation from unlabeled data, pretext/objective bias, transfer protocol and false negatives/collapse |
| Fine-tuning versus adapters/LoRA? | Data, memory, latency/merge, forgetting, multi-tenant and quality trade-offs |
| How do you debug a model that cannot overfit 50 samples? | Verify labels/path/metric, simplify, inspect gradients/activations, remove augmentation/regularization |

## Detection, segmentation, and tracking

| Question | Strong-answer signal |
|---|---|
| One-stage versus two-stage detection? | Proposal/dense formulation, latency/accuracy, object scale and system context |
| What problem does NMS solve and when does it fail? | Duplicate hypotheses, crowded/overlapping objects, threshold/class handling; soft/learned/set alternatives |
| Explain detector assignment. | Anchor/point/query matching, positive definition, imbalance, instability and train/test behavior |
| IoU, GIoU, DIoU: why alternatives? | No-overlap gradient and geometry; metric/loss distinction |
| What is AP actually measuring? | Ranked PR integration, IoU/class settings, matching, interpolation; hides operating point and slices |
| Pixel accuracy versus IoU? | Dominant background problem, class averaging, boundary and rare-class behavior |
| How would you evaluate thin structures? | Boundary/tolerance/topology measures and annotation ambiguity |
| Explain Kalman filtering assumptions. | State/transition/observation, Gaussian noise, covariance, predict/update; EKF/UKF/particle alternatives |
| How does data association fail? | Occlusion, crossings, appearance shift, gating, one-to-one assignment and ID switches |
| MOTA, IDF1, HOTA trade-offs? | Detection versus association contributions and scenario/metric interpretation |

## 3D, fusion, and autonomy

| Question | Strong-answer signal |
|---|---|
| Camera versus LiDAR strengths? | Texture/density/cost versus direct sparse range; weather/range/calibration and fusion implications |
| Early, middle, or late fusion? | Information preservation, alignment, compute, fault isolation, missing sensors and training data |
| Why use BEV? | Common metric frame, spatial reasoning/map fusion; projection/depth ambiguity and resolution cost |
| How do time offsets affect fusion? | Ego/object motion creates spatial error; clock models, interpolation/deskew and measurement |
| What is observability in localization? | Whether state can be inferred; motion/environment degeneracies and covariance |
| Open-loop versus closed-loop evaluation? | Prediction metric versus downstream trajectory/state distribution; feedback and simulation validity |
| How would you test sensor degradation? | Fault model, graceful behavior, observability/alerts, scenario coverage, fallback and regression gates |
| What makes long-tail data selection hard? | Rarity, definition, capture bias, label cost, feedback loops and diversity |
| Occupancy versus object representation? | Open-set/spatial coverage versus semantics/tracking compactness; downstream interface |
| What is a world model useful for? | Predictive latent/state dynamics, simulation/planning/data; fidelity, compounding error and evaluation |

## Evaluation and production

| Question | Strong-answer signal |
|---|---|
| Model A has higher mAP; should it launch? | Operating point, slices/uncertainty, latency/cost, regressions, online/closed-loop and rollout |
| How do you choose a threshold? | Error costs/constraints, calibrated validation population, per-class/slice implications, monitoring |
| What is calibration? | Probability-frequency alignment, reliability/ECE limitations, temperature scaling and shift |
| Aleatoric versus epistemic uncertainty? | Data noise versus knowledge/model uncertainty, imperfect estimators and actionable use |
| How do you detect dataset leakage? | Entity/scene/time/source grouping, duplicates, preprocessing/labels/future information and audits |
| What is training-serving skew? | Differences in feature/preprocess/runtime/postprocess; shared/versioned code and golden tests |
| How do you measure latency correctly? | End-to-end boundary, warm-up, synchronization, workload, hardware, batch/concurrency and percentiles |
| Quantization hurts one class badly. Next steps? | Slice/layer diagnostics, calibration-set coverage, sensitive ops, mixed precision/QAT and regression policy |
| What should trigger retraining? | Verified quality/data change and expected value, not drift alone; labels, gates, rollback |
| Offline labels arrive late. How monitor now? | Input/prediction/service proxies, sampled review, shadow/champion comparison, later backfill validation |

## Research and senior judgment

| Question | Strong-answer signal |
|---|---|
| How do you choose a paper to reproduce? | Relevant claim, decisive affordable test, credible baseline/code/data/license and production value |
| A result improves 0.2 points. Is it real? | Variance/independent unit, paired uncertainty, multiple comparisons, cost and practical significance |
| Tell me about a technically attractive idea you rejected. | Constraints, evidence, alternatives, decision ownership and downstream outcome |
| When would you build versus use a library? | Differentiation, correctness, maintenance, performance/interface gap, licensing and exit plan |
| How do you review a risky perception change? | Requirements, data/metrics/slices, architecture, failure modes, tests, rollout, observability, owners |
| How do you mentor someone through a model failure? | Questions and diagnostic structure, psychological safety, appropriate ownership, durable learning |
| What changes at senior level? | Scope/ambiguity, architecture, cross-team leverage, reliability, mentorship and accountable outcomes |

## Practice rule

Mark an answer passed only if it contains an equation/mechanism where relevant,
one failure case, one measurement, and one concrete engineering example in under
three minutes.

