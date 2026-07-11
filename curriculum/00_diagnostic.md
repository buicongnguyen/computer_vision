# Week 0 — Senior Computer Vision Readiness Diagnostic

This diagnostic establishes a baseline before the 24-week program. It is not an exam to “pass.” Its purpose is to reveal which skills are available under time pressure, which skills exist only with reference material, and which skills need to be built.

Recommended time: 6–8 hours, split across two days.

## Learning outcomes

After completing the diagnostic, you should be able to:

- describe your current strengths with evidence rather than intuition;
- distinguish theory gaps from implementation, systems, or communication gaps;
- choose an initial Google-, NVIDIA-, or 42dot-oriented emphasis;
- create a measurable remediation plan;
- identify whether your current portfolio demonstrates senior scope.

## Rules

1. Use no external help during timed sections.
2. You may use either Python or C++ for the main coding task. Record the choice.
3. Record start and stop times, assumptions, failed approaches, and tests.
4. Do not hide incomplete work. A clear diagnosis is more valuable than a polished fiction.
5. After scoring, revisit the work with references and write what you would change.

Record the machine, operating system, compiler, Python version, GPU, driver, and major library versions. Performance numbers without environment information are not comparable.

## Scoring scale

Use the same 0–4 scale throughout the curriculum.

| Score | Evidence |
|---:|---|
| 0 | No workable approach or no evidence |
| 1 | Recognizes terminology but needs a tutorial to proceed |
| 2 | Produces an independent baseline with important gaps |
| 3 | Correct, tested, measured, and clearly explained work |
| 4 | Anticipates edge cases, alternatives, scale, and operational tradeoffs |

Suggested weighted domains:

| Domain | Weight |
|---|---:|
| Mathematics, probability, and geometry | 15% |
| Classical and deep computer vision | 20% |
| Coding and software engineering | 15% |
| Systems design and reliability | 15% |
| Temporal, 3D, and autonomous-driving perception | 10% |
| GPU and performance reasoning | 10% |
| Data and evaluation rigor | 10% |
| Leadership evidence and communication | 5% |

## Part A — Written fundamentals

Time box: 75 minutes. Answer without a search engine.

1. Let \(A \in \mathbb{R}^{m \times n}\), with \(m \ge n\). Derive the normal equations for

   $$
   x^\star = \arg\min_x \lVert Ax-b\rVert_2^2.
   $$

   Explain why solving with an SVD or QR factorization may be safer than explicitly forming \(A^\top A\).

2. A camera has intrinsics \(K\), rotation \(R\), translation \(t\), and a world point \(X_w\). Write the projection into image coordinates and state what information is lost during projection.

3. Explain the difference between the fundamental matrix and essential matrix. State their inputs, coordinate systems, rank, and a practical failure case.

4. A binary classifier has 99% accuracy on a dataset whose positive prevalence is 0.5%. Explain why accuracy is inadequate. Propose decision and calibration metrics for a safety-relevant detector.

5. Derive the gradient of binary cross entropy with respect to the logit. Explain why the “log-sum-exp trick” matters.

6. RANSAC samples \(s\) points per hypothesis. If the inlier probability is \(w\), derive the number of trials needed for success probability \(p\):

   $$
   N \ge \frac{\log(1-p)}{\log(1-w^s)}.
   $$

   Explain why the result can still be misleading in real images.

7. Compare convolution and cross-correlation. Why do deep-learning libraries usually implement the latter while calling it convolution?

8. Explain bias and variance in three distinct settings: model capacity, metric estimation, and runtime latency.

9. Contrast IoU, Dice, AP, and expected calibration error. Give one situation in which each can conceal a serious problem.

10. Explain coalesced memory access, arithmetic intensity, and synchronization overhead to an engineer who knows C++ but not CUDA.

### Written-section scoring

Give one point per question for a correct central idea and one additional point for equations, constraints, or counterexamples. Convert the total to the 0–4 scale:

- 0: fewer than 5 points;
- 1: 5–9;
- 2: 10–14;
- 3: 15–18;
- 4: 19–20.

Do not award a 4 for memorized vocabulary without correct assumptions and failure cases.

## Part B — Timed coding task

Time box: 90 minutes.

Implement a small detection postprocessor:

- input: class scores and boxes in a documented coordinate convention;
- remove invalid or non-finite boxes;
- apply a configurable confidence threshold;
- implement pairwise IoU;
- implement per-class greedy non-maximum suppression;
- return results in deterministic order.

Required tests:

- no boxes;
- one box;
- disjoint boxes;
- identical boxes;
- zero-area and inverted boxes;
- boxes touching at an edge;
- multiple classes;
- NaN and infinity;
- stable behavior when scores tie.

After the timer, measure complexity and profile at 100, 1,000, and 10,000 boxes. Explain the likely bottleneck and propose a production alternative.

Score separately for correctness, tests, API clarity, complexity reasoning, and explanation. A fast but untested implementation cannot score above 2.

## Part C — Model debugging exercise

Time box: 90 minutes.

Consider this observation:

- training loss falls smoothly;
- validation mAP rises for three epochs, then falls;
- validation images from camera A perform much better than camera B;
- evaluation changes by up to two AP points between runs;
- exported-model predictions differ from notebook predictions;
- half of the “false positives” are plausible objects with no annotation.

Write a debugging plan that orders hypotheses by information value. It should address:

- train/validation leakage and duplicate frames;
- annotation completeness and class policy;
- preprocessing and coordinate transforms;
- training/evaluation mode;
- randomness and nondeterministic kernels;
- camera-domain shift;
- confidence/NMS settings;
- export precision and operator differences;
- overfitting and inappropriate augmentation;
- metric implementation.

For each hypothesis, specify an observation that would support or reject it. Avoid changing several variables at once.

## Part D — Senior system-design prompt

Time box: 45 minutes to prepare and 20 minutes to present.

Design an offline-replay and online-inference platform for eight 1080p camera streams at 30 frames per second. A perception result should normally be available within 100 ms. The system must tolerate a slow downstream consumer and allow exact replay of a production incident.

Cover:

- requirements and explicitly excluded scope;
- ingest, decode, preprocessing, batching, inference, tracking, and output;
- ownership of CPU and GPU buffers;
- queue bounds, backpressure, and load shedding;
- model and calibration versioning;
- observability and latency decomposition;
- failure isolation and degraded operation;
- reproducibility and incident replay;
- accuracy, latency, cost, and complexity tradeoffs;
- test strategy and rollout plan.

The important signal is not a particular architecture. It is whether requirements drive the design and whether tradeoffs are visible.

## Part E — Senior evidence inventory

For each category, write one concrete example using situation, decision, action, measurable result, and lesson:

- ambiguous problem framing;
- architecture or technical direction;
- production reliability ownership;
- measurable quality, latency, or cost improvement;
- cross-team influence;
- mentoring or raising engineering standards;
- disagreement and conflict resolution;
- failed project or incident;
- responsible handling of data, privacy, or safety.

Mark an item “missing” if you do not have real evidence. Course projects can demonstrate technical judgment, but they do not replace multi-year organizational impact.

## Baseline practical lab

Create a reproducible baseline that:

1. loads ten images;
2. validates shape, dtype, range, color order, and missing files;
3. performs resize, normalization, and a simple model or filter;
4. records cold-start and warmed-up latency;
5. reports p50, p95, throughput, and peak memory;
6. writes machine-readable results with environment metadata;
7. produces identical output on a second run within stated numerical tolerance.

This lab becomes the reference pattern for later benchmarks.

## Common diagnostic failure modes

- Looking up answers during a baseline and measuring reference skill instead of recall.
- Selecting only familiar questions and creating survivor bias.
- Timing GPU work without synchronization.
- Reporting mean latency while ignoring warm-up and tail latency.
- Treating a notebook result as evidence of software-engineering skill.
- Giving yourself a senior score for breadth without deep evidence.
- Mistaking years of experience for examples of ownership and impact.
- Building a remediation plan with goals such as “learn CUDA” instead of observable outputs.

## Oral interview prompts

Answer each in two to five minutes:

1. What is the weakest assumption in your system-design answer?
2. Describe a CV metric that improved while user-visible quality became worse.
3. How would you determine whether a model problem is actually a data problem?
4. When should a team optimize a kernel rather than change the model or pipeline?
5. Explain a technically correct decision that would still be poor product judgment.
6. What evidence distinguishes a senior engineer from an excellent individual implementer?
7. If given two more weeks, which diagnostic gap would you attack first and why?

## Routing the curriculum

- Domain score below 2: complete all core notes and labs.
- Score 2: complete the primary lab and oral checkpoint.
- Score 3: attempt the production extension before reading the solution notes.
- Score 4: write or review an extension, mentor another learner, or substitute a harder capstone task.

Suggested emphasis:

- Google-oriented: algorithms, distributed ML, experiment design, system design, and product impact.
- NVIDIA-oriented: C++, CUDA, profiling, TensorRT, numerical accuracy, and GPU systems.
- 42dot-oriented: geometry, 3D perception, tracking, sensor fusion, real-time C++, autonomy safety, and data replay.

## Definition of done

- [ ] All timed sections were completed under recorded conditions.
- [ ] Every domain has a 0–4 score supported by evidence.
- [ ] Coding work includes edge-case tests and a complexity analysis.
- [ ] System design includes capacity estimates and failure behavior.
- [ ] At least three weak assumptions were identified after review.
- [ ] A prioritized six-week remediation plan exists.
- [ ] Senior-impact gaps are explicitly recorded rather than disguised.
- [ ] The diagnostic is committed so progress can be compared at Weeks 12 and 24.

