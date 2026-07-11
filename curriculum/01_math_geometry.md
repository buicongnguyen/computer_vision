# Mathematics, Optimization, and Multi-View Geometry

Computer vision systems turn measurements into estimates. Senior engineers need enough mathematics to recognize when an estimate is observable, ill-conditioned, biased, or simply expressed in the wrong coordinate frame.

Suggested study time: 20–30 hours.

## Learning outcomes

You should be able to:

- reason about vector spaces, rank, conditioning, eigenvalues, and SVD;
- derive least-squares, maximum-likelihood, and MAP estimators;
- use Jacobians to optimize nonlinear geometric objectives;
- project, unproject, transform, and triangulate points;
- explain homographies, epipolar geometry, PnP, and robust estimation;
- test coordinate-frame and numerical conventions;
- diagnose degeneracy rather than merely call a library again.

## 1. Linear algebra for estimation

### Rank, null spaces, and observability

For a linear system \(Ax=b\):

- full column rank means a unique least-squares minimizer;
- a nontrivial null space contains changes to \(x\) that measurements cannot observe;
- nearly dependent columns make the problem ill-conditioned even when rank is technically full.

The condition number

$$
\kappa(A)=\frac{\sigma_{\max}(A)}{\sigma_{\min}(A)}
$$

estimates how strongly relative input error can be amplified. Forming \(A^\top A\) squares the condition number, which is why QR or SVD is often preferable to explicit normal equations.

For \(A=U\Sigma V^\top\), the pseudoinverse is

$$
A^+ = V\Sigma^+U^\top.
$$

Small singular values should not be inverted blindly. Truncation or regularization makes a bias–variance tradeoff.

### Least squares and weighting

The ordinary least-squares objective is

$$
J(x)=\frac{1}{2}\lVert Ax-b\rVert_2^2,
$$

with gradient \(A^\top(Ax-b)\). A stationary point satisfies

$$
A^\top A x=A^\top b.
$$

If measurement covariance is \(\Sigma\), use

$$
J(x)=\frac{1}{2}(Ax-b)^\top\Sigma^{-1}(Ax-b).
$$

Whitening transforms residuals so that unit error has comparable statistical meaning in every dimension.

Ridge regularization,

$$
\lVert Ax-b\rVert_2^2+\lambda\lVert x\rVert_2^2,
$$

is equivalent to a zero-mean Gaussian prior under standard assumptions.

## 2. Probability and robust estimation

Bayes’ rule is

$$
p(\theta\mid D)=\frac{p(D\mid\theta)p(\theta)}{p(D)}.
$$

Maximum likelihood maximizes \(p(D\mid\theta)\); MAP maximizes the posterior. Minimizing squared error corresponds to Gaussian noise, while minimizing absolute error corresponds to Laplace noise.

Real feature matches have heavy-tailed error. A robust objective replaces the quadratic penalty:

$$
J(\theta)=\sum_i \rho\!\left(\frac{r_i(\theta)}{\sigma}\right).
$$

Huber loss is quadratic near zero and linear for large residuals. It reduces, but does not eliminate, sensitivity to outliers. The scale \(\sigma\) matters.

RANSAC separates hypothesis generation from consensus scoring. It fails when:

- the minimal solver is degenerate;
- outliers form a coherent alternative model;
- the inlier threshold has the wrong physical scale;
- sample independence assumptions are false;
- the inlier ratio is too small.

## 3. Nonlinear optimization

Linearize residual \(r(x+\Delta)\) around \(x\):

$$
r(x+\Delta)\approx r(x)+J\Delta.
$$

Gauss–Newton solves

$$
(J^\top WJ)\Delta=-J^\top Wr.
$$

It approximates the Hessian by \(J^\top WJ\). Levenberg–Marquardt adds damping:

$$
(J^\top WJ+\lambda D)\Delta=-J^\top Wr.
$$

Large \(\lambda\) behaves more like gradient descent; small \(\lambda\) behaves more like Gauss–Newton.

Always verify analytic Jacobians with finite differences at several random, non-degenerate states. A useful relative check is

$$
\frac{\lVert J_{\text{analytic}}-J_{\text{numeric}}\rVert}
{\max(1,\lVert J_{\text{analytic}}\rVert,\lVert J_{\text{numeric}}\rVert)}.
$$

Finite differences also fail when the step is too large, too small, or crosses a discontinuity.

## 4. Coordinate frames and rigid transforms

Use an explicit naming convention. Let \(T_{ab}\) map coordinates from frame \(b\) into frame \(a\):

$$
\begin{bmatrix}p_a\\1\end{bmatrix}
=
T_{ab}
\begin{bmatrix}p_b\\1\end{bmatrix},
\qquad
T_{ab}=
\begin{bmatrix}R_{ab}&t_{ab}\\0&1\end{bmatrix}.
$$

Then

$$
T_{ac}=T_{ab}T_{bc},
\qquad
T_{ba}=T_{ab}^{-1}.
$$

A rotation satisfies \(R^\top R=I\) and \(\det(R)=1\). Euler angles are readable but convention-dependent and singular. Rotation matrices are redundant. Unit quaternions are compact but have a sign ambiguity. Lie algebra updates are useful in optimization because they provide a local minimal perturbation.

Never add translation and rotation residuals without choosing meaningful units or weights.

## 5. Camera model

For a world point \(X_w\), camera extrinsics \(R_{cw},t_{cw}\), and intrinsics \(K\):

$$
\tilde{x}=K(R_{cw}X_w+t_{cw}),
\qquad
(u,v)=\left(\frac{\tilde{x}_1}{\tilde{x}_3},
\frac{\tilde{x}_2}{\tilde{x}_3}\right).
$$

With

$$
K=
\begin{bmatrix}
f_x&s&c_x\\
0&f_y&c_y\\
0&0&1
\end{bmatrix},
$$

the ideal pinhole model discards absolute scale along a viewing ray.

A common radial-tangential distortion model uses normalized coordinates:

$$
r^2=x^2+y^2,
$$

$$
x_d=x(1+k_1r^2+k_2r^4+k_3r^6)+2p_1xy+p_2(r^2+2x^2),
$$

$$
y_d=y(1+k_1r^2+k_2r^4+k_3r^6)+p_1(r^2+2y^2)+2p_2xy.
$$

Projection order, distortion convention, image origin, and pixel-center convention must be documented.

## 6. Projective and epipolar geometry

Homogeneous points are equivalent up to nonzero scale. A planar homography obeys

$$
\tilde{x}'\sim H\tilde{x}.
$$

It describes a plane-induced mapping or pure camera rotation, not arbitrary 3D parallax.

For corresponding normalized points \(x_1,x_2\):

$$
x_2^\top E x_1=0,
\qquad
E=[t]_\times R.
$$

For pixel coordinates:

$$
\tilde{x}_2^\top F\tilde{x}_1=0,
\qquad
F=K_2^{-\top}EK_1^{-1}.
$$

Both \(E\) and \(F\) have rank two. An essential matrix has additional singular-value structure. Estimated matrices should be projected back to the valid constraint set before pose recovery.

The symmetric epipolar distance or Sampson approximation is generally more meaningful than raw algebraic error because algebraic error depends on arbitrary scaling.

## 7. Triangulation and pose

Triangulation estimates a 3D point from intersecting viewing rays. With noise, rays do not intersect exactly. Poor baseline, distant points, and nearly parallel rays produce high depth uncertainty.

Cheirality requires reconstructed points to lie in front of the cameras. It helps choose among the four pose decompositions of an essential matrix.

PnP estimates camera pose from 3D–2D correspondences. Planar points, repeated structure, limited field of view, and poor spatial distribution can make the estimate ambiguous or unstable. RANSAC removes gross correspondence outliers; nonlinear reprojection refinement improves a valid initial pose.

Bundle adjustment jointly minimizes reprojection residuals over camera and point parameters. Gauge freedom must be fixed, for example by anchoring one camera and setting scale when scale is otherwise unobservable.

## Practical labs

### Lab 1 — Conditioning and solver choice

Generate linear systems with controlled singular values.

- Solve using explicit normal equations, QR, and SVD.
- Add noise at several magnitudes.
- Plot solution error against condition number.
- Repeat in float32 and float64.
- Add ridge regularization and explain the bias introduced.

Deliver a test that exposes when normal equations become unreliable.

### Lab 2 — Projection and Jacobians

Implement:

- rigid-transform composition and inverse;
- pinhole projection;
- radial-tangential distortion;
- analytic Jacobian of projection with respect to a 3D point.

Compare the Jacobian against central finite differences. Test points behind the camera, at nearly zero depth, and near image corners.

### Lab 3 — Homography with normalized DLT and RANSAC

- Normalize point coordinates before DLT.
- Reject degenerate samples.
- Fit a homography inside RANSAC.
- Score with geometric transfer error.
- Refit using all inliers.
- Create synthetic data with known ground truth before using real images.

Report accuracy as outlier ratio, noise, and threshold vary.

### Lab 4 — Two-view reconstruction

- Estimate \(F\) from correspondences.
- Enforce rank two.
- Convert to \(E\) when intrinsics are known.
- Recover candidate poses and apply cheirality.
- Triangulate points.
- Report reprojection error and triangulation angle.

Visualize cases where low reprojection error still gives poor depth.

### Lab 5 — Pose-only nonlinear refinement

Optimize a camera pose from noisy 3D–2D correspondences.

- Compare plain least squares and Huber loss.
- Verify Jacobians.
- Track objective, step norm, and accepted/rejected updates.
- Test initialization sensitivity.

An advanced extension uses an \(SE(3)\) local update rather than six unconstrained matrix parameters.

## Production failure modes

- Mixing \(T_{world,camera}\) with \(T_{camera,world}\).
- Using row vectors in one library and column vectors in another.
- Treating degrees as radians or milliseconds as seconds.
- Forgetting that image resize changes focal lengths and principal point.
- Applying distortion twice or comparing distorted observations with undistorted predictions.
- Trusting a low algebraic residual that has no physical interpretation.
- Accepting a pose with points behind the camera.
- Ignoring rolling shutter, focus-dependent intrinsics, thermal drift, or time offset.
- Calibrating with poses that do not excite all degrees of freedom.
- Inverting a matrix when a factorization or linear solve is more stable.
- Optimizing a gauge freedom and interpreting singularity as a library bug.
- Reporting average reprojection error without tails or image-location slices.

## Oral interview questions

1. Why does forming \(A^\top A\) make conditioning worse?
2. What is physically observable from one calibrated image of an unknown scene?
3. When can a homography model two images correctly?
4. Why is the essential matrix rank two, and why are its two nonzero singular values constrained?
5. Explain triangulation uncertainty using ray geometry rather than formulas.
6. How would you detect a camera/frame convention error from logged data?
7. Compare Gauss–Newton, Levenberg–Marquardt, and gradient descent.
8. Why can RANSAC return a confident but wrong model?
9. What is gauge freedom in bundle adjustment?
10. How would you validate a new calibration before deploying it to a fleet?
11. Why might low reprojection error coexist with poor metric localization?
12. When is float64 worth its cost in a vision pipeline?

## Definition of done

- [ ] You can derive weighted least squares and connect it to Gaussian noise.
- [ ] You can use SVD to explain rank, null space, and conditioning.
- [ ] Transform direction and frame notation are explicit in all code and tests.
- [ ] Projection and distortion pass synthetic ground-truth tests.
- [ ] Analytic Jacobians agree with numerical checks within a justified tolerance.
- [ ] Homography RANSAC rejects degenerate samples and refits on inliers.
- [ ] Two-view reconstruction checks rank, cheirality, and triangulation angle.
- [ ] At least three degeneracies are demonstrated, not only described.
- [ ] Reports include units, conventions, data precision, and uncertainty.
- [ ] You can answer at least 9 of the 12 oral questions without notes.

