# Data Engineering, Evaluation, Robustness, and Responsible Deployment

A model score is an estimate produced by a data and evaluation system. If lineage, split policy, labels, metrics, or uncertainty are weak, sophisticated models merely optimize unreliable evidence.

Suggested study time: 22–30 hours.

## Learning outcomes

You should be able to:

- define a versioned data contract and trace samples to their source;
- design group-aware and time-aware splits that prevent leakage;
- measure label quality and distinguish ambiguity from error;
- compute metrics with uncertainty and appropriate slices;
- evaluate calibration and select operating thresholds from costs;
- design reproducible experiments and a data-centric error loop;
- detect distribution shift and plan safe monitoring and rollback;
- create concise data cards, model cards, and risk documentation.

## 1. Data contract and lineage

A dataset is a versioned transformation graph, not a directory of images. Each sample should have, where applicable:

- immutable source identifier and content hash;
- capture time, device, location grouping, and sequence;
- consent, license, retention, and usage constraints;
- calibration and preprocessing versions;
- annotation schema and annotator/review provenance;
- inclusion/exclusion reason;
- split assignment;
- derived-artifact parent identifiers.

A manifest should be sufficient to reconstruct the evaluated dataset without relying on mutable folder contents.

Schema checks belong before training:

- required fields;
- allowed dtypes, ranges, and shapes;
- valid label IDs;
- box and mask validity;
- timestamp monotonicity where expected;
- referenced-file existence and hash;
- duplicate or near-duplicate detection.

## 2. Split design and leakage

Random row splitting is often wrong for vision. Correlated samples include:

- adjacent video frames;
- bursts from one camera;
- the same person, vehicle, scene, route, or facility;
- crops or augmentations derived from one source;
- relabeled versions of the same image.

Use group-aware splitting at the unit that must generalize. Time-based splitting better estimates future deployment when the world or capture stack evolves.

Define the target deployment distribution before selecting a split. A geographic holdout tests a different question from a random route holdout.

Validation supports iteration; test estimates the final selected procedure. Repeated test inspection makes it another validation set.

## 3. Annotation quality

Label quality has several dimensions:

- correctness;
- completeness;
- boundary or localization precision;
- class ontology consistency;
- temporal consistency;
- uncertainty or ambiguity;
- agreement with the intended product definition.

Inter-annotator agreement is useful only when chance agreement and class prevalence are considered. Low agreement can reveal ambiguous instructions rather than careless annotators.

Create a gold set reviewed by domain experts, but also audit the gold set. Use targeted double annotation on difficult slices rather than spending equally on obvious examples.

Missing-positive labels are especially harmful in detection because plausible predictions may be counted as background errors during training and evaluation.

## 4. Metrics and operating points

For binary decisions:

$$
\operatorname{precision}=\frac{TP}{TP+FP},
\qquad
\operatorname{recall}=\frac{TP}{TP+FN},
$$

$$
F_\beta
=
(1+\beta^2)
\frac{\operatorname{precision}\operatorname{recall}}
{\beta^2\operatorname{precision}+\operatorname{recall}}.
$$

The operating threshold should reflect error costs, workload, safety constraints, and downstream behavior. A ranking metric such as AUROC or AP does not choose it.

When negatives dominate, AUROC can look strong even with poor precision. Precision–recall curves are often more informative, but prevalence affects precision and must match or be adjusted to deployment.

Metrics should be accompanied by denominators. “90% recall” on ten examples has different evidential value from the same estimate on ten thousand independent examples.

## 5. Statistical uncertainty

An evaluation score is a random estimate. Bootstrap confidence intervals can capture uncertainty without a closed-form metric variance:

1. sample evaluation units with replacement;
2. recompute the metric;
3. repeat many times;
4. report suitable quantiles.

Resample independent groups, not individual frames, when sequence correlation exists. A frame-level bootstrap can be dramatically overconfident.

For comparing two models, use paired resampling on the same units and examine the distribution of metric differences.

Multiple slice searches create false discoveries. Treat exploratory slices as hypothesis generation and confirm important claims on fresh or held-out data.

## 6. Calibration and uncertainty

For predicted confidence \(p_i\) and binary outcome \(y_i\), Brier score is

$$
\operatorname{Brier}
=
\frac{1}{n}\sum_i(p_i-y_i)^2.
$$

Negative log likelihood is sensitive to confident mistakes:

$$
\operatorname{NLL}
=
-\frac{1}{n}\sum_i
\left[y_i\log p_i+(1-y_i)\log(1-p_i)\right].
$$

Expected calibration error bins predictions:

$$
\operatorname{ECE}
=
\sum_b \frac{|B_b|}{n}
\left|\operatorname{acc}(B_b)-\operatorname{conf}(B_b)\right|.
$$

ECE depends on binning and can conceal local or class-specific miscalibration. Include reliability diagrams, Brier/NLL, and task-specific calibration views.

Temperature scaling fits a scalar on validation logits. It can improve global calibration without changing ranking, but it may not fix subgroup or distribution-shift calibration.

Epistemic and aleatoric uncertainty are useful conceptual distinctions, but many practical “uncertainty scores” are not calibrated probabilities. Validate any abstention or escalation rule directly.

## 7. Slice-based evaluation and error taxonomy

Aggregate metrics can hide systematic harm or product failure. Useful slices may include:

- device or camera;
- lighting and weather;
- range and object size;
- motion and blur;
- occlusion and crowding;
- geography or route;
- class and rare subclass;
- data age and software version;
- demographic or accessibility attributes when justified and handled responsibly.

Choose slices from known risks and product requirements, not only after seeing failures. Record sample size and uncertainty. Avoid publishing sensitive slices without a legitimate purpose and safeguards.

An actionable error taxonomy separates:

- data/label errors;
- representation/model errors;
- threshold and postprocessing errors;
- system/preprocessing errors;
- out-of-scope cases;
- genuine ambiguity.

## 8. Experiment design

Before running an experiment, record:

- hypothesis;
- primary metric and guardrails;
- data and split version;
- treatment and control;
- compute and training budget;
- expected mechanism;
- stopping rule;
- decision criterion.

An ablation changes one factor. A benchmark comparison may change many factors but must not claim causal attribution.

Check whether metric differences exceed:

- run-to-run variation;
- evaluation sampling uncertainty;
- annotation uncertainty;
- operationally meaningful effect size.

Do not choose a model only because it wins a leaderboard metric. Consider latency, memory, energy, reliability, calibration, maintainability, and data requirements.

## 9. Data-centric improvement loop

A disciplined loop is:

1. freeze a reproducible baseline;
2. inspect errors and slices;
3. quantify the dominant actionable category;
4. form a hypothesis;
5. change data, labels, model, or system deliberately;
6. evaluate primary and guardrail metrics;
7. document outcome, including negative results;
8. update tests and monitoring.

Active-learning acquisition can use uncertainty, diversity, expected impact, or coverage. Uncertainty-only sampling may overselect noise, outliers, or systematically unlabelable cases.

Hard-negative mining changes the training distribution. Retain representative sampling or correct weighting so the model does not overfit a curated stream of failures.

## 10. Deployment monitoring

Monitor four layers:

1. system health: latency, drops, errors, resource use;
2. input health: schema, missingness, ranges, embedding or feature shift;
3. prediction health: class rates, confidence, calibration proxies, abstentions;
4. outcome quality: delayed labels, audited samples, product and safety metrics.

Covariate shift does not prove quality degradation; stable inputs do not prove stable semantics. Drift signals should trigger investigation, not automatic retraining by default.

A rollout plan should define:

- shadow or offline evaluation;
- canary population;
- quality and system guardrails;
- rollback mechanism;
- model, data, code, and calibration versions;
- incident ownership;
- retention and replay policy.

## 11. Responsible use and autonomy safety

Document intended use, excluded use, foreseeable misuse, and human oversight. For road perception work, keep experiments in simulation or offline replay unless an authorized safety process governs on-road testing.

Identify:

- people affected by false positives and false negatives;
- sensitive data and minimization opportunities;
- retention, deletion, and access controls;
- geographic and environmental coverage gaps;
- degraded and unknown states;
- safe fallback behavior;
- validation limits.

A model card is not a substitute for engineering controls, review, or incident response.

## Practical labs

### Lab 1 — Dataset audit

Build a tool that produces:

- schema and file-integrity report;
- class and attribute distributions;
- exact and perceptual duplicate candidates;
- invalid boxes, masks, and labels;
- sequence/group counts by split;
- image shape, dtype, range, and corruption summary;
- a browsable sample of anomalies.

Inject known faults and show that the audit catches them.

### Lab 2 — Leakage-resistant split

Using a video or grouped image dataset:

- compare random row, sequence-grouped, and time-based splits;
- measure duplicate and metadata similarity across splits;
- train the same small baseline on each;
- explain why performance changes;
- choose the split that answers a stated deployment question.

### Lab 3 — Evaluation harness

Create a versioned evaluator with:

- deterministic sample selection;
- per-sample predictions and outcomes;
- aggregate and slice metrics;
- paired bootstrap intervals by independent group;
- operating-threshold analysis;
- machine-readable output and a compact report.

Test metric functions on hand-computed examples.

### Lab 4 — Calibration and selective prediction

- Plot reliability diagrams.
- Compute NLL, Brier, ECE, and class/slice variants.
- Fit temperature scaling only on validation data.
- Evaluate on untouched test data.
- Define an abstention rule and plot coverage versus risk.
- Show one case where ECE improves but a critical slice does not.

### Lab 5 — Annotation study

Sample errors from a detector or segmenter.

- Blindly re-annotate a stratified subset.
- Classify disagreement as mistake, ambiguity, ontology problem, or missing label.
- Estimate disagreement by slice.
- Revise one guideline and run a small second pass.
- Report whether expected evaluation uncertainty changes.

### Lab 6 — Data-centric iteration

Choose one dominant error category and compare:

- a data or label intervention;
- a model or loss intervention;
- a threshold/postprocessing intervention.

Hold evaluation constant. Recommend the smallest change that meets primary and guardrail metrics.

### Lab 7 — Monitoring and incident replay design

Design telemetry and an offline replay for:

- a camera firmware change;
- increased night-time blur;
- class-frequency shift;
- rising p95 latency with stable model compute;
- delayed ground-truth arrival.

Specify alerts, triage queries, ownership, rollback, and what cannot be inferred from each signal.

## Production failure modes

- Randomly splitting correlated frames, identities, routes, or scenes.
- Mutable filenames standing in for dataset versions.
- Evaluation preprocessing differing from deployment.
- Repeatedly choosing models using the test set.
- Missing annotations counted as false positives or training negatives.
- Label ontology changing without dataset and model version changes.
- Aggregate metrics hiding rare or safety-critical slices.
- Confidence treated as calibrated probability.
- Frame-level confidence intervals on highly correlated sequences.
- Thresholds selected on test data or after inspecting production incidents.
- Metric code changing between candidates.
- Active learning selecting only noisy, unlabelable edge cases.
- Hard-negative mining destroying prevalence and calibration.
- Drift alert interpreted as automatic proof of model failure.
- Automatic retraining amplifying feedback loops.
- Logging sensitive images without access, retention, or deletion controls.
- Inability to reconstruct which model, calibration, and data produced an incident.
- Rollout without a tested rollback path.

## Oral interview questions

1. What is the correct unit of independence for a video-dataset split?
2. How would you find near-duplicate leakage?
3. What is the difference between label error and label ambiguity?
4. When is AUROC misleading?
5. Why should a deployment threshold not be chosen from AP alone?
6. How would you estimate uncertainty for a metric on correlated sequences?
7. Compare Brier score, NLL, and ECE.
8. Can a model be calibrated globally and miscalibrated for every important slice?
9. How would you determine whether a one-point gain is real and useful?
10. Design an error taxonomy for a road-object detector.
11. Why can uncertainty sampling be a poor active-learning strategy?
12. Which drift signals demonstrate a quality regression?
13. What is required for exact incident replay?
14. How would you roll out a model whose average quality improves but night performance declines?
15. What belongs in a data card versus a model card?
16. When should a system abstain or degrade instead of returning a prediction?

## Definition of done

- [ ] The dataset is reconstructible from an immutable manifest and source lineage.
- [ ] Split grouping matches the claimed deployment generalization.
- [ ] Schema, integrity, duplicate, and annotation audits are automated.
- [ ] Metric implementations pass hand-computed tests.
- [ ] Results include denominators and group-aware uncertainty.
- [ ] Calibration is measured with more than one summary statistic.
- [ ] Operating thresholds are tied to costs and guardrails.
- [ ] Critical slices are defined before final model selection.
- [ ] At least one data intervention is compared fairly with a model intervention.
- [ ] Experiment records include hypotheses, budgets, versions, and negative results.
- [ ] Monitoring covers system, input, prediction, and delayed outcome health.
- [ ] Rollback and incident replay are designed and tested offline.
- [ ] Intended use, exclusions, data risks, and safe fallback are documented.
- [ ] You can answer at least 13 of the 16 oral questions without notes.
