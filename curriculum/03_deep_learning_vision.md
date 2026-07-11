# Deep Learning for Vision

Deep-learning competence at senior level means more than selecting an architecture. It includes understanding the objective, controlling experiments, diagnosing data and optimization problems, and turning a research model into a dependable component.

Suggested study time: 25–35 hours.

## Learning outcomes

You should be able to:

- derive and implement the core pieces of a supervised training loop;
- reason about gradients, initialization, normalization, optimization, and regularization;
- explain the inductive biases of CNNs and vision transformers;
- fine-tune pretrained models without leaking evaluation information;
- design reproducible ablations and interpret learning curves;
- diagnose numerical, data, and train/serve failures;
- profile training and inference without sacrificing correctness silently.

## 1. Learning objective and data distribution

Given samples \((x_i,y_i)\), empirical risk minimization uses

$$
\hat{\theta}=\arg\min_\theta
\frac{1}{n}\sum_{i=1}^{n}\ell(f_\theta(x_i),y_i)
+\lambda\Omega(\theta).
$$

The training objective is a proxy for product behavior. A lower loss does not guarantee better decisions under distribution shift, class imbalance, asymmetric costs, or poor labels.

Separate:

- training data used for gradient updates;
- validation data used for model and hyperparameter choices;
- test data used once for an unbiased final estimate;
- challenge or slice sets used to characterize specific risks.

Near-duplicate video frames, shared subjects, locations, devices, or capture sessions can leak across nominally separate rows.

## 2. Logits, softmax, and cross entropy

For logits \(z\), stable softmax is computed after subtracting \(\max_j z_j\):

$$
p_k=\frac{\exp(z_k-\max_j z_j)}
{\sum_l \exp(z_l-\max_j z_j)}.
$$

For one-hot target \(y\), cross entropy is

$$
\ell=-\sum_k y_k\log p_k.
$$

Its logit gradient is

$$
\frac{\partial \ell}{\partial z_k}=p_k-y_k.
$$

Cross entropy encourages probability assigned to the observed label but does not guarantee calibration. Label smoothing changes both regularization and the meaning of predicted probabilities.

For severe imbalance, class weighting changes the optimization target. It should not be added without checking calibration and threshold behavior.

## 3. Backpropagation and gradient behavior

Backpropagation is repeated application of the chain rule on a computation graph. For \(y=f(g(x))\):

$$
\frac{\partial y}{\partial x}
=
\frac{\partial y}{\partial g}
\frac{\partial g}{\partial x}.
$$

Useful diagnostics include:

- activation mean, variance, saturation, and sparsity;
- gradient norm by layer;
- update-to-weight norm;
- non-finite activation and gradient checks;
- loss on a tiny batch that the model should overfit.

Vanishing and exploding gradients arise from repeated Jacobian multiplication. Initialization, normalization, activation choice, and residual paths change signal propagation.

Finite-difference gradient checks are useful on small deterministic networks in float64. They are unreliable around nondifferentiable points or with stochastic layers enabled.

## 4. Optimization

Stochastic gradient descent updates

$$
\theta_{t+1}=\theta_t-\eta_t\hat{g}_t.
$$

Momentum accumulates a velocity; adaptive methods rescale updates using running gradient moments. Optimizer choice interacts with batch size, normalization, weight decay, and schedule.

Decoupled weight decay applies shrinkage separately from the adaptive gradient update. It is not generally identical to adding an L2 penalty to the loss.

Learning-rate warm-up protects early optimization when representations and normalization statistics are unstable. Cosine decay is common, but a schedule should be justified by validation behavior and compute budget.

Gradient accumulation approximates a larger batch for some operations, but it does not reproduce batch-normalization statistics and can change optimizer-update frequency.

## 5. Convolutional networks

A multi-channel cross-correlation layer is

$$
y_{o,u,v}
=b_o+
\sum_c\sum_{i,j}
w_{o,c,i,j}\,x_{c,u+i,v+j}.
$$

Weight sharing gives translation equivariance away from boundaries and sampling artifacts. Pooling and stride build invariance while discarding spatial detail.

The effective receptive field depends on kernel size, dilation, stride, and depth. The theoretical receptive field may be much larger than the region that materially influences a prediction.

Depthwise-separable convolution reduces multiply-accumulate count but may not reduce latency on every device. Memory movement, kernel launch overhead, tensor layout, and library support matter.

Residual blocks learn

$$
y=x+F(x),
$$

which provides a short gradient path and makes identity-like behavior easy to express. The addition requires compatible shapes and scales.

## 6. Normalization and train/evaluation modes

Batch normalization uses minibatch statistics during training:

$$
\hat{x}=\frac{x-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},
\qquad
y=\gamma\hat{x}+\beta.
$$

At evaluation it normally uses running estimates. Small, nonrepresentative, or correlated batches can make those estimates poor.

Layer normalization uses statistics within each sample and is common in transformers. Group normalization is often stable for small vision batches.

Dropout, stochastic depth, batch normalization, and some augmentations behave differently in training and evaluation. Exported models must preserve intended mode and statistics.

## 7. Transfer learning and augmentation

Transfer learning works when pretrained features overlap the target domain. Common strategies:

- linear probe to test representation usefulness;
- partial unfreezing;
- full fine-tuning with a smaller backbone learning rate;
- domain-specific normalization recalibration.

Augmentation encodes invariances. A horizontal flip is not harmless when handedness, text, traffic side, or camera geometry matters. Geometric augmentation must transform images, boxes, masks, keypoints, and calibration consistently.

Mixup and CutMix regularize strongly but alter target semantics and calibration. Evaluate their effect on the actual decision rule.

## 8. Vision transformers and attention

Images can be partitioned into patches and projected to tokens. Scaled dot-product attention is

$$
\operatorname{Attention}(Q,K,V)
=
\operatorname{softmax}
\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

Dense attention has quadratic cost in token count. Higher image resolution can therefore increase memory much faster than expected.

Transformers have weaker built-in locality and translation bias than CNNs. They often benefit from large-scale pretraining, suitable augmentation, and careful optimization. Hybrid designs add convolutional stems, local windows, hierarchies, or multiscale features.

Self-supervised objectives learn representations from transformations, masked content, or teacher–student agreement. Their success depends on avoiding shortcut solutions and selecting evaluations that reflect downstream usefulness.

## 9. Reproducibility and experiment design

A reproducible run records:

- source revision and uncommitted changes;
- full configuration;
- dataset manifest and split identifiers;
- random seeds and deterministic settings;
- environment, hardware, driver, and library versions;
- checkpoint, optimizer, and scheduler state;
- evaluation code version;
- raw and summarized metrics.

Determinism is not the same as validity. Run multiple seeds when training variance is large. Compare methods under matched compute, data, preprocessing, and evaluation.

A useful ablation changes one causal factor and states a hypothesis before running. If five settings change simultaneously, the result is a new system comparison, not an ablation.

## Practical labs

### Lab 1 — Minimal training engine

Build a compact image-classification training loop with:

- explicit train/evaluation modes;
- stable loss computation;
- optimizer and scheduler;
- checkpoint/resume including random and optimizer state;
- gradient and non-finite-value monitoring;
- deterministic evaluation;
- structured configuration and metrics.

First overfit 32 examples. If that fails, do not launch a long run.

### Lab 2 — Gradient and optimizer investigation

On a small network:

- verify selected gradients with finite differences;
- log activation and gradient distributions;
- compare SGD with momentum and AdamW under a matched search budget;
- test three learning rates and two batch sizes;
- explain behavior using evidence rather than optimizer folklore.

### Lab 3 — CNN architecture experiment

Implement a simple residual network, then compare:

- plain and residual blocks;
- batch, group, or layer normalization;
- standard and depthwise-separable convolution;
- two input resolutions.

Report parameter count, approximate operations, p50/p95 latency, peak memory, accuracy, and calibration. Do not infer device latency from operation count alone.

### Lab 4 — Transfer-learning study

Fine-tune a pretrained model on a modest dataset.

- Start with a linear probe.
- Unfreeze progressively.
- Use separate learning rates for head and backbone.
- Compare frozen versus recalculated normalization statistics.
- Build domain or class slices.
- Run at least three seeds for the final comparison.

Write a one-page decision memo recommending a deployment candidate.

### Lab 5 — CNN versus transformer

Compare a small CNN and small vision transformer under a documented compute budget.

- Match input resolution and augmentation as closely as possible.
- Track wall time, memory, convergence, and data efficiency.
- Inspect attention or saliency only as a diagnostic, not as proof of causality.
- Test resolution scaling and an out-of-domain slice.

### Lab 6 — Export and parity

Export one trained model to an inference runtime.

- Freeze preprocessing in a versioned specification.
- Compare outputs layer-by-layer or at key boundaries.
- Define absolute and relative tolerances.
- Test dynamic shapes if supported.
- Compare FP32 and lower precision.
- Benchmark end-to-end, including transfer and preprocessing.

## Production failure modes

- Duplicate subjects or adjacent video frames across train and validation sets.
- Tuning repeatedly on the test set.
- Forgetting model evaluation mode for batch normalization or dropout.
- Resuming weights but not optimizer, scheduler, scaler, or random state.
- Comparing architectures with different preprocessing or training budgets.
- Using augmentations that violate label or geometry semantics.
- Silent class-index or label-map mismatch.
- Resizing or letterboxing differently in training and serving.
- Normalizing twice or using wrong channel statistics.
- Mixed-precision overflow hidden by skipped optimizer steps.
- A dataloader bottleneck mistaken for a slow GPU model.
- Timing asynchronous kernels without synchronization.
- Quantization or export changing unsupported operators silently.
- Treating one random seed as a reliable improvement.
- Selecting a model by aggregate accuracy while a critical slice regresses.
- Saving metrics without the dataset and code version that produced them.

## Oral interview questions

1. Derive the cross-entropy gradient with respect to logits.
2. Why should a model be able to overfit a tiny batch?
3. Compare L2 regularization and decoupled weight decay.
4. How does batch size affect optimization and batch normalization differently?
5. Why do residual connections help train deep networks?
6. Why can fewer floating-point operations still produce higher latency?
7. When would you choose group normalization over batch normalization?
8. What invariance does a proposed augmentation encode, and when is it invalid?
9. Compare CNN and transformer inductive biases.
10. Design an ablation that tests whether pretraining helps.
11. How would you debug notebook/export prediction disagreement?
12. What evidence is required before claiming a 0.5-point accuracy gain?
13. Explain the difference between reproducibility and determinism.
14. How would you decide whether to optimize the model, data pipeline, or runtime?

## Definition of done

- [ ] The training engine can overfit a tiny dataset and resume exactly.
- [ ] Selected analytic/autograd gradients pass finite-difference checks.
- [ ] Experiments record code, data, configuration, seed, and environment.
- [ ] Final comparisons use multiple seeds or justify why not.
- [ ] CNN experiments report quality, calibration, latency, and memory.
- [ ] Transfer-learning choices are supported by controlled evidence.
- [ ] At least one invalid augmentation is demonstrated.
- [ ] Exported and native predictions pass documented parity tolerances.
- [ ] End-to-end timing includes preprocessing and transfer costs.
- [ ] At least eight production failure modes have tests or monitoring.
- [ ] You can answer at least 11 of the 14 oral questions without notes.

