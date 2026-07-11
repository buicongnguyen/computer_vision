# Temporal Vision, Tracking, 3D Perception, and State Estimation

Temporal and 3D systems must preserve geometry across coordinate frames and state across time. Many severe failures come from timestamp, calibration, uncertainty, and lifecycle mistakes rather than the neural model itself.

Suggested study time: 30–40 hours.

## Learning outcomes

You should be able to:

- derive local optical-flow constraints and identify their limitations;
- design a tracking-by-detection pipeline with explicit state and lifecycle;
- apply Kalman filtering and data association with defensible uncertainty;
- construct depth and point clouds from calibrated measurements;
- evaluate tracking, depth, odometry, and 3D detection appropriately;
- reason about ego motion, time synchronization, and sensor fusion;
- diagnose drift, frame errors, and real-time pipeline failures.

## 1. Time is part of the measurement

A sample is not fully described by its tensor. It also has:

- acquisition timestamp;
- clock domain and synchronization quality;
- exposure interval or scan pattern;
- sensor calibration version;
- sequence and frame identifiers;
- latency between acquisition and availability.

Processing timestamps cannot replace acquisition timestamps. A camera frame, LiDAR sweep, and radar scan may represent different intervals. Fusing them at a nominal frame number can create systematic spatial error around moving objects.

## 2. Optical flow

Brightness constancy assumes

$$
I(x+u,y+v,t+\Delta t)=I(x,y,t).
$$

First-order expansion yields

$$
I_xu+I_yv+I_t=0.
$$

One equation cannot determine two velocity components: the aperture problem. Lucas–Kanade assumes approximately constant flow in a local window and solves

$$
\begin{bmatrix}
\sum I_x^2 & \sum I_xI_y\\
\sum I_xI_y & \sum I_y^2
\end{bmatrix}
\begin{bmatrix}u\\v\end{bmatrix}
=
-
\begin{bmatrix}
\sum I_xI_t\\
\sum I_yI_t
\end{bmatrix}.
$$

The matrix is informative when it has two sufficiently large eigenvalues. Image pyramids extend the small-motion assumption but can lose fine structure.

Brightness constancy fails under exposure changes, specularities, shadows, occlusion, motion blur, and non-Lambertian surfaces. Forward–backward consistency is a useful but imperfect confidence check.

## 3. Tracking-by-detection

A common pipeline is:

1. predict track state to the current acquisition time;
2. generate detections;
3. compute gated association costs;
4. solve assignment;
5. update matched tracks;
6. initialize, age, confirm, or delete tracks.

Track state may include position, velocity, box size, orientation, class belief, appearance embedding, and uncertainty. Track lifecycle rules affect false tracks, fragmentation, and re-identification.

Association costs can combine:

- geometric overlap;
- Mahalanobis distance;
- class compatibility;
- appearance distance;
- depth or 3D distance.

Costs need comparable scales. A hard gate should reject physically impossible matches before Hungarian assignment.

## 4. Kalman filtering

For linear dynamics:

$$
x_k=F_kx_{k-1}+w_k,
\qquad
z_k=H_kx_k+v_k,
$$

with \(w_k\sim\mathcal{N}(0,Q_k)\) and \(v_k\sim\mathcal{N}(0,R_k)\).

Prediction:

$$
\hat{x}_{k|k-1}=F_k\hat{x}_{k-1|k-1},
$$

$$
P_{k|k-1}=F_kP_{k-1|k-1}F_k^\top+Q_k.
$$

Update:

$$
S_k=H_kP_{k|k-1}H_k^\top+R_k,
$$

$$
K_k=P_{k|k-1}H_k^\top S_k^{-1},
$$

$$
\hat{x}_{k|k}
=
\hat{x}_{k|k-1}
+K_k(z_k-H_k\hat{x}_{k|k-1}).
$$

The covariance should represent uncertainty, not a tuning decoration. Innovation statistics can reveal inconsistent \(Q\), \(R\), timing, or measurement models.

Use a numerically stable covariance update such as the Joseph form when appropriate. Never form a matrix inverse when a solve is available.

## 5. Tracking metrics

Metrics emphasize different failures:

- IDF1 emphasizes identity consistency;
- HOTA balances detection, association, and localization components;
- MOTA combines misses, false positives, and identity switches but can be dominated by detection;
- track fragmentation and latency may matter operationally even when headline metrics look good.

Evaluation must define ignored regions, class matching, confidence thresholds, interpolation, and frame-rate assumptions.

## 6. Stereo depth and point clouds

For rectified stereo with focal length \(f\), baseline \(B\), and disparity \(d\):

$$
Z=\frac{fB}{d}.
$$

Depth sensitivity is

$$
\left|\frac{\partial Z}{\partial d}\right|
=
\frac{fB}{d^2}.
$$

Thus a fixed disparity error causes much larger depth error for distant points. Zero or very small disparity is unstable.

For pixel \((u,v)\) and depth \(Z\):

$$
X=Z\frac{u-c_x}{f_x},
\qquad
Y=Z\frac{v-c_y}{f_y}.
$$

Depth may be axial distance \(Z\), range along a ray, inverse depth, disparity, or a normalized network output. Never assume the representation.

A point cloud should carry frame, timestamp, units, invalid-value policy, and possibly per-point acquisition time and uncertainty.

## 7. 3D boxes and autonomous-driving geometry

A 3D box requires center, dimensions, orientation, frame, and convention. Ambiguities include:

- dimensions ordered as length/width/height or another order;
- center at geometric center or ground contact;
- yaw axis and positive direction;
- radians or degrees;
- camera, ego, map, or sensor frame.

Bird’s-eye-view IoU and full 3D IoU measure different errors. Camera-only depth uncertainty often grows with range, so equal metric thresholds do not imply equal difficulty.

Ego motion must be compensated before interpreting persistent objects in a common frame. Calibration and time-offset error can resemble object velocity.

## 8. Visual odometry and SLAM

A feature-based visual-odometry front end typically:

- detects and tracks or matches features;
- estimates relative pose robustly;
- triangulates or uses existing landmarks;
- refines pose by reprojection error;
- selects keyframes.

Monocular geometry has an unobservable global scale without additional information. Pure rotation, low parallax, repeated texture, and dynamic scenes are difficult.

SLAM adds a persistent map and often loop closure. Loop closure reduces accumulated drift but a false loop can corrupt the map globally. Pose-graph optimization requires a gauge anchor and uncertainty-aware constraints.

Evaluate trajectories after stating alignment:

- absolute trajectory error measures global consistency;
- relative pose error measures local drift;
- alignment may remove translation, rotation, and sometimes scale.

## 9. Multi-sensor fusion

Fusion can happen at:

- raw or early feature level;
- intermediate representation level;
- object or track level.

Early fusion preserves information but requires tight calibration and synchronization. Late fusion is modular and easier to debug but may discard complementary evidence.

Sensor errors are often correlated. Treating correlated estimates as independent makes covariance too confident. Delayed and out-of-sequence measurements require buffering, state rewind, smoothing, or an explicit approximation.

## Practical labs

### Lab 1 — Sparse optical flow

- Implement pyramidal Lucas–Kanade or a simplified version.
- Select features using the second-moment matrix.
- Add forward–backward consistency.
- Evaluate endpoint error on synthetic translated and affine images.
- Test blur, exposure change, occlusion, and motion larger than one pyramid level.

### Lab 2 — Multi-object tracker

Build a tracker around recorded detections.

- Use a constant-velocity Kalman filter.
- Gate by Mahalanobis distance and class.
- Compare IoU-only and combined appearance/geometric association.
- Define tentative, confirmed, lost, and deleted lifecycle states.
- Evaluate IDF1/HOTA or an appropriate equivalent.

Create scenarios with crossings, missed detections, false positives, and timestamp jitter.

### Lab 3 — Stereo and uncertainty

- Rectify or use pre-rectified stereo data.
- Estimate disparity and apply left–right consistency.
- Convert disparity to depth and point cloud.
- Propagate a one-pixel disparity uncertainty to depth.
- Evaluate by distance bins and valid-pixel coverage.

Visualize confidence and failure around occlusion boundaries and repetitive texture.

### Lab 4 — Coordinate-frame test harness

Implement a small transform graph.

- Use explicit source/destination frame names.
- Verify inverse and composition identities.
- Project LiDAR or synthetic 3D points into an image.
- Inject a small rotation, translation, and time offset separately.
- Measure their image-space effects by depth and object velocity.

### Lab 5 — Visual odometry

- Track or match features across a sequence.
- Estimate motion with robust geometry.
- Apply cheirality and parallax checks.
- Triangulate and refine.
- Compare relative and absolute trajectory error.
- Detect and report tracking failure instead of emitting an arbitrary pose.

### Lab 6 — Asynchronous fusion simulation

Simulate a moving object with camera-like position and radar-like velocity observations at different rates.

- Use acquisition timestamps.
- Compare naive frame-index fusion with timestamp-aware prediction.
- Introduce clock offset and delayed observations.
- Plot innovation and covariance consistency.
- Define behavior for stale or missing sensors.

## Production failure modes

- Using processing time instead of acquisition time.
- Assuming sensors share a clock because timestamps have the same units.
- Applying a current calibration to historical replay.
- Mixing ego, sensor, camera, and map frames.
- Confusing axial depth, Euclidean range, disparity, and inverse depth.
- Treating an invalid depth value as zero-distance geometry.
- Ignoring rolling shutter or per-point LiDAR acquisition time.
- Associating before ego-motion compensation.
- Tuning process noise to hide a bad motion or timestamp model.
- Covariance becoming asymmetric, non-positive, or unjustifiably small.
- Unbounded track retention causing ghosts and state growth.
- Detector threshold changes invalidating tracker tuning.
- Optimizing MOTA while identity behavior degrades.
- Monocular odometry reporting metric scale without a scale source.
- A false loop closure corrupting the complete map.
- Queueing stale frames until latency becomes unsafe.
- Evaluating a pipeline on frames it silently dropped.

## Oral interview questions

1. Derive the optical-flow constraint and explain the aperture problem.
2. Why do image pyramids help optical flow, and when do they hurt?
3. Design association costs for two objects crossing.
4. What do \(Q\) and \(R\) mean in a Kalman filter?
5. How would innovation statistics reveal a bad model?
6. Compare IDF1, HOTA, and MOTA.
7. Why does stereo depth uncertainty grow rapidly with distance?
8. What metadata must accompany a point cloud?
9. Explain how a 50 ms time offset appears for a moving object.
10. Why is monocular scale unobservable?
11. Compare ATE and relative pose error.
12. What can cause a low-reprojection-error but wrong trajectory?
13. Compare early and late sensor fusion.
14. How should a real-time perception system react to overload?
15. How would you validate calibration and synchronization before deployment?

## Definition of done

- [ ] Every temporal measurement retains acquisition time and clock provenance.
- [ ] Optical flow is evaluated on controlled motion and known violations.
- [ ] Tracker lifecycle and association gates are explicit and tested.
- [ ] Kalman covariance and innovation consistency are inspected.
- [ ] Tracking results include identity and detection-oriented metrics.
- [ ] Stereo depth reports error and coverage by distance.
- [ ] All point clouds and boxes document frame, units, and conventions.
- [ ] Transform composition/inversion has property-style tests.
- [ ] Odometry states its alignment and detects degenerate motion.
- [ ] Timestamp-aware fusion outperforms naive fusion in simulation.
- [ ] At least eight production failures are reproduced or tested.
- [ ] You can answer at least 12 of the 15 oral questions without notes.

