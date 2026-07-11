# Autonomy Perception and Sensor Fusion

Estimated effort: 18-24 focused hours plus capstone work.

This module turns computer-vision knowledge into the system judgment expected
in a senior autonomous-driving perception role. The central question is not
"Which fusion model is newest?" It is: **Can the system create a trustworthy,
timely spatial representation when sensors, labels, calibration, weather, and
compute are imperfect?**

The module is aligned with the 42dot Senior Computer Vision and Senior AI
Perception role snapshots verified on **2026-07-11 (Asia/Seoul)**. Official job
requirements are cited at the end. Assignment and interview advice is clearly
marked as preparation guidance; 42dot does not publish its coding-test topics
or detailed interview rubric.

## Outcomes

By the end, you should be able to:

- define a frame convention and transform camera, LiDAR, radar, IMU, and ego
  data without silently reversing a transform;
- diagnose intrinsic, extrinsic, synchronization, observability, and data-
  association failures;
- compare early, feature-level, BEV-level, and late fusion using explicit
  accuracy, robustness, latency, and memory criteria;
- build and evaluate a temporal perception/tracking pipeline by scenario, not
  only by a global leaderboard metric;
- inject realistic sensor faults and specify degraded behavior;
- connect failure mining, data selection, retraining, validation, deployment,
  and monitoring as a continuous-learning loop; and
- defend a production design to perception, platform, vehicle, and safety
  reviewers.

## Prerequisites

- Homogeneous coordinates, camera projection, least squares, probability, and
  basic optimization.
- Detection metrics, assignment, Kalman filtering, and PyTorch familiarity.
- Ability to write tested Python. C++ is strongly recommended for the runtime
  portion.

If you cannot derive a pinhole projection or explain covariance propagation,
return to the geometry and estimation modules before attempting Assignment 2.

## 1. Start with a coordinate contract

Never begin fusion code with an unnamed `4x4` matrix. Record:

- frame name and axis directions;
- handedness and rotation convention;
- timestamp source, clock domain, and units;
- whether a transform is active or passive; and
- the direction encoded by its name.

This module uses column vectors and names a transform by destination and source:

```text
p_camera = T_camera_from_ego @ T_ego_from_lidar @ p_lidar
```

For rigid transforms:

```text
T_b_from_a = [R_b_from_a  t_b_from_a]
             [    0            1     ]

T_a_from_b = inverse(T_b_from_a)
```

For a calibrated camera:

```text
z * [u, v, 1]^T = K [R_camera_from_world | t_camera_from_world] p_world
```

Required checks include identity, inverse, round-trip, composition, and a point
with a hand-computed answer. A visualization is useful but cannot replace the
numeric tests.

### Timing is geometry

A spatially correct transform at the wrong time is still wrong. To first order,
a time offset `dt` produces translation error near `||v|| * dt` and angular
error near `||omega|| * dt`. Rolling shutter, scan motion, CAN latency, dropped
frames, sensor buffering, and clock drift require explicit modeling.

For every signal, write down:

1. capture time versus arrival time;
2. exposure or scan interval;
3. interpolation/extrapolation method;
4. maximum tolerated age; and
5. behavior when the tolerance is exceeded.

## 2. Know what each sensor contributes

| Sensor | Strong signal | Important weaknesses | Failure probes |
|---|---|---|---|
| Camera | Texture, class, lane/light semantics, dense angular resolution | Depth ambiguity, lighting/weather, exposure, blur | Darkness, glare, rain, occlusion, dirty lens |
| LiDAR | Metric range and shape, sparse 3D geometry | Sparsity at range, reflectivity/weather, moving scan | Point dropout, range bins, calibration/time offset |
| Radar | Range and radial velocity, weather robustness | Multipath, low angular resolution, ghost targets | Stationary objects, metal structures, sparse returns |
| IMU | High-rate angular velocity and acceleration | Bias, drift, vibration, temperature | Bias step, saturation, time drift |
| GNSS/GPS | Global position outdoors | Urban canyon, multipath, outages, frame conversion | Tunnel, offset jump, stale fix |

A senior design states what information is observable from the available
sensors and what remains ambiguous. Adding sensors does not automatically add
reliable information if calibration, timing, coverage, or training data is poor.

## 3. Choose a fusion location deliberately

| Pattern | Benefit | Cost/risk | Use when |
|---|---|---|---|
| Raw/early fusion | Preserves low-level information | Alignment-sensitive and expensive | Sensors have compatible sampling and excellent calibration |
| Feature fusion | Learns cross-sensor relationships | Harder to debug; missing-sensor behavior must be trained | Large paired datasets and sufficient compute exist |
| BEV/intermediate fusion | Common spatial frame; useful for planning | Projection/depth errors can be hidden | Spatial reasoning and multi-camera coverage dominate |
| Object/late fusion | Modular, testable, easier degradation | Discards information before fusion | Independent sensor stacks or safety decomposition matter |
| Filter/track fusion | Explicit uncertainty and temporal state | Model mismatch and association errors | State estimation and interpretable uncertainty are important |

The 42dot Senior AI Perception snapshot specifically emphasizes sensor
characteristics, spatial/temporal alignment, calibration, projection, BEV/3D/
occupancy representations, multi-sensor fusion, and the accuracy-resource
trade-off in a deployed system. Treat those as first-class design axes.

## 4. Separate representation from task head

Compare at least three environment representations:

- object lists or 3D boxes;
- BEV semantic/detection features; and
- occupancy or scene completion.

Boxes are efficient for known agents but omit fine geometry and unusual
obstacles. Occupancy retains free/occupied structure but can be memory-heavy and
requires careful treatment of unknown versus free space. BEV quality depends on
depth, calibration, visibility, and temporal aggregation. Ask:

- What does the representation make easy for planning?
- What information does it discard?
- How are occluded and unobserved cells represented?
- How is uncertainty calibrated?
- Does temporal accumulation create stale or duplicated evidence?

## 5. Track uncertainty, not only objects

A minimal track state might contain position, velocity, yaw, object dimensions,
class belief, and covariance. The tracker must make explicit choices about:

- motion model and process noise;
- measurement model per sensor;
- gating distance and assignment cost;
- birth, confirmation, coasting, and deletion;
- class consistency and duplicate suppression; and
- ego-motion compensation.

Report IDF1/ID switches or an equivalent identity metric alongside detection
quality. Slice by range, occlusion, class, motion, camera overlap, and track age.
The official 42dot MCMOT dataset assigns consistent identities across three
front cameras and includes visibility annotations, making it a useful
company-relevant tracking exercise.

## 6. Evaluate the system as a safety-relevant pipeline

Define metrics before training. At minimum include:

- task accuracy: class/range AP, IoU, position/yaw/velocity error, IDF1;
- calibration: reliability or expected calibration error where applicable;
- robustness: delta under sensor loss, time shift, extrinsic perturbation,
  weather/lighting, and data corruption;
- systems: batch size, hardware, warm-up, p50/p95/p99 end-to-end latency,
  throughput, peak memory, and failed-frame rate; and
- operational slices: distance, occlusion, speed, scene density, geography,
  weather, time of day, and sensor condition.

Global averages can hide unsafe regressions. A fusion model that improves the
overall score but loses distant pedestrians or fails when radar is stale is not
an acceptable launch decision without a mitigation.

## 7. Build a data flywheel

42dot's official active-learning article describes a useful pattern:

1. observe a concrete production-like failure, such as duplicate pedestrian
   predictions in dense scenes;
2. quantify the safety-relevant precision/recall trade-off;
3. mine and curate similar cases;
4. train a higher-capacity offline model;
5. distill knowledge into a real-time vehicle model; and
6. validate the change before deployment.

Your loop must version the raw data, labels, split, selection rule, model,
configuration, and evaluation report. Prevent hard-case mining from leaking
validation or test cases into training.

## Assignment 1 — Transform and timing fault laboratory

**Build**

- A small `SE(3)` transform library or wrapper with explicit frame names.
- Camera projection and unprojection for synthetic points.
- Ego-pose interpolation between timestamped states.
- Fault injectors for translation, rotation, and sensor-time offset.

**Required experiments**

1. Clean transform chain.
2. `+5 cm` extrinsic translation.
3. `+1 degree` extrinsic rotation.
4. `+50 ms` timestamp shift at two ego speeds and two yaw rates.
5. Reversed-transform bug that a test must catch.

**Acceptance criteria**

- Identity, inverse, composition, and round-trip tests pass with maximum
  synthetic error `<= 1e-8` in double precision.
- A hand-computed projection case matches within `1e-6` pixels.
- The test suite fails when the intentional reversed transform is enabled.
- The report plots reprojection/position error against injected fault magnitude
  and explains why error changes with range, speed, and yaw rate.
- Every figure records units, frame convention, random seed, and data version.

## Assignment 2 — Fusion ablation and degradation review

Use a public multi-sensor subset such as nuScenes mini, or a documented
synthetic alternative when compute/data access is limited.

**Build and compare**

- a declared single-sensor baseline;
- a two-sensor fusion model or estimator; and
- the same fusion system with missing-sensor training or a documented degraded
  mode.

**Required ablations**

- single sensor versus fusion;
- feature/BEV fusion versus late fusion, or a justified equivalent;
- correct calibration versus two perturbation levels;
- synchronized versus `50 ms` and `100 ms` shifts;
- all sensors versus one dropped or stale sensor; and
- at least four scenario slices, including range and occlusion.

**Acceptance criteria**

- Split, preprocessing, metric implementation, seed, and hardware are fixed or
  the differences are explicitly controlled.
- Results include absolute metrics and deltas, not only percent improvement.
- The submission identifies at least three failure clusters with saved example
  IDs and a reproducible command to render them.
- The degraded-mode policy states detection, logging, fallback, and recovery.
- If fusion does not beat the baseline, the assignment can still pass only
  with a supported root-cause analysis and a discriminating next experiment.

## Assignment 3 — Tracking and active-learning iteration

Use the 42dot MCMOT training data or another licensed tracking dataset.

**Build**

- a reproducible association/tracking baseline;
- an error miner for ID switches, fragmentation, duplicates, and long
  occlusion; and
- one targeted improvement based on the mined cases.

**Acceptance criteria**

- Report IDF1 plus IDTP/IDFN or an equivalent decomposed metric.
- Slice by visibility level, class, camera overlap, and track length.
- Compare at least two association costs or gating strategies.
- Keep a locked evaluation split and prove mined evaluation cases were not
  added to training.
- The improvement changes a predeclared target slice in the expected direction
  or the report falsifies the hypothesis and explains the next action.

## Assignment 4 — Senior design review

Prepare a 12-slide, 25-minute review titled:

> Production perception under calibration drift, sensor loss, and compute
> pressure

The review must include requirements, ODD assumptions, transform/timing
contract, architecture, data loop, metric tree, failure-mode table, runtime
budget, degraded operation, rollout/rollback, and two rejected alternatives.

**Acceptance criteria**

- Reserve 20 minutes for challenge questions.
- A reviewer can trace every launch claim to an experiment or explicit open
  risk.
- At least one reviewer challenges geometry and one challenges deployment or
  safety.
- Record decisions and action items in a one-page review log.

## Interview drills

These are preparation inferences from the responsibilities, not disclosed
42dot interview questions.

1. Derive the camera-LiDAR projection chain and name every frame.
2. Explain how a `100 ms` offset appears in a turning vehicle.
3. Choose between BEV boxes and occupancy for an urban planner.
4. Diagnose why fusion beats camera-only overall but loses distant pedestrians.
5. Design missing-radar behavior without retraining every model.
6. Explain an ID switch that occurs only in camera-overlap regions.
7. Set an accuracy/latency/memory budget for a 10 Hz perception stack.
8. Describe a failed experiment and the evidence that changed your decision.

You pass the verbal portion when you can answer each in five minutes with
assumptions, equations or diagrams, measurable tests, and failure modes.

## Evidence rubric

| Level | Evidence |
|---|---|
| 1 — Familiar | Can name sensors and fusion patterns but cannot debug alignment. |
| 2 — Independent | Implements a calibrated baseline, evaluates it, and fixes normal failures. |
| 3 — Senior | Chooses a representation/fusion architecture, quantifies robustness and runtime trade-offs, and leads a failure review. |
| 4 — Organizational | Defines cross-team sensor/data/runtime contracts and changes validation or launch practice across systems. |

Do not claim level 3 from a tutorial reproduction alone.

## Official role mapping and sources

Verified **2026-07-11**. Re-check before applying because vacancies and loops
change.

- [42dot live open roles](https://www.42dot.ai/careers/openroles) — confirmed a
  Senior Computer Vision Engineer (Autonomous Driving) vacancy in Pangyo at
  verification time.
- [Senior Computer Vision Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d7f9e679-a018-4ab8-933c-3399995f9da8)
  — 3D vision, pose/tracking, scalable vision, self-supervised learning, world
  models, closed-loop simulation, C++/Python, sensors, optimization, research,
  and cloud deployment.
- [Senior AI Perception Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d03cec6d-f885-4d4a-bfce-76fd81994731)
  — end-to-end perception, alignment/calibration/projection, BEV/3D/occupancy,
  fusion, failure analysis, deployment, and resource trade-offs.
- [Active Learning for Continuous Model Improvement](https://www.42dot.ai/blog/180)
  — hard-case collection, offline teacher, distillation, transformer queries,
  failure diagnosis, and vehicle deployment.
- [42dot research](https://www.42dot.ai/research) — current publication themes
  include scene completion, 3D multi-object tracking, depth, occupancy, lanes,
  and motion.
- [42dot autonomous-driving datasets](https://42dot.ai/openDataset/ad/overview)
  and [MCMOT](https://42dot.ai/openDataset/ad/mcmot) — official data and
  evaluation material.
- [HMG Tech Talent Forum 2026: Minwoo Park](https://www.hyundai.com/worldwide/en/newsroom/detail/0000001193)
  — leadership direction on data flywheels, sensor standardization, E2E
  autonomy, cross-functional execution, and production-scale safety and
  reliability. This is strategic context, not an interview rubric.

