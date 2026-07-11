# Module 09 — Production ML and Data Systems

## Outcomes

You should be able to design the path from a product requirement to collected
data, labels, training, evaluation, release, monitoring, and retraining. You
should also be able to identify which failures are model failures and which are
system or policy failures.

## Start with the decision

A model is useful only through a decision or user-visible behavior. Before
choosing an architecture, write:

```text
Decision: what downstream component does with the prediction
Error costs: cost(FP), cost(FN), latency/staleness cost, unknown-state cost
Operating conditions: users, geography, sensors, hardware, ODD
SLO: metric + threshold + window + population + response when violated
```

Accuracy is not an SLO until its population and measurement process are clear.

## The data contract

Define one sample precisely:

- Stable ID, event time, ingestion time, source, consent/license, schema version.
- Sensor calibration and time base where applicable.
- Label definition, ambiguity/ignore policy, ontology version, annotator/QC data.
- Group/slice fields used to expose rare or safety-relevant conditions.
- Train/validation/test grouping key that prevents entity, scene, or time leakage.
- Retention, deletion, privacy, and security constraints.

For video or driving scenes, a random frame split is usually leakage: adjacent
frames share content. Group by drive, sequence, geography, capture period, or
another unit that represents future generalization.

## Experiment design

An experiment record should contain hypothesis, primary metric, guardrails,
slices, stopping rule, seeds/repetitions, compute budget, code/data/environment
versions, and a conclusion that distinguishes observation from interpretation.

Useful uncertainty checks include bootstrap confidence intervals over the
correct independent unit (often scene or user, not frame), paired comparisons,
and repeated seeds when training variance is material. More decimal places do
not replace an uncertainty analysis.

## Distributed training reasoning

For data-parallel training with `N` workers, global batch is normally

`B_global = N * B_per_worker * gradient_accumulation_steps`.

Changing global batch can change optimization, not just speed. Track examples
processed, optimizer updates, learning-rate policy, communication time,
straggler behavior, checkpoint semantics, and reproducibility. A strong scaling
report fixes total work; a weak scaling report grows work with resources.

Common failures: silent sample duplication, uneven shards, stale checkpoints,
nondeterministic resumption, communication dominating compute, one slow input
worker, and metrics reduced incorrectly across workers.

## Training-serving consistency

Make preprocessing a versioned component. Test representative raw inputs through
both training and serving paths and compare tensors within a justified tolerance.
Validate color order, resizing/cropping, coordinate conventions, normalization,
token/class maps, quantization, postprocessing, and dynamic-shape behavior.

Release with shadow or canary traffic when possible. A model registry entry is
not a safe deployment by itself; the release must bind model, code, config,
features, data/schema expectations, hardware/runtime, and rollback target.

## Monitoring layers

1. **Service:** availability, queue delay, end-to-end latency percentiles,
   throughput, errors, saturation, memory, restarts.
2. **Input:** schema violations, missing sensors, resolution/rate changes,
   calibration age, feature/data drift.
3. **Prediction:** score/class/box distributions, unknown/abstain rate, temporal
   instability, disagreement with a shadow model.
4. **Quality:** delayed labels, sampled review, slice metrics, incident proxies,
   calibration and business/safety outcomes.
5. **Data loop:** capture bias, annotation queues, retraining triggers,
   regression suite health.

Drift is a signal to investigate, not automatic proof that quality fell.

## Required production exercise

Design a two-camera, 30-FPS perception service for 100,000 devices or vehicles.
Produce:

- Requirements and explicit non-goals.
- Capacity calculation from raw input through storage/training/serving.
- Data and label contracts, split policy, version/lineage model.
- Offline metrics, scenario slices, online/SLO metrics, human review plan.
- Training topology and failure/resume behavior.
- Release stages, compatibility test, canary criteria, rollback runbook.
- Monitoring and incident response for missing/corrupt/out-of-distribution input.
- Cost levers and the first three load tests.

Challenge the design at 10x load, 1% corrupt calibration, delayed labels, a new
camera firmware, and a privacy deletion request.

## Oral interview drills

1. When can improving mAP make a product worse?
2. How would you detect leakage in a video dataset?
3. Design a hard-negative mining loop without amplifying annotation bias.
4. What must be versioned to reproduce a production prediction?
5. A new model is better offline but worse in canary. How do you investigate?
6. How do you monitor quality when ground truth arrives weeks later?
7. When is edge inference preferable to cloud inference, and vice versa?
8. How do you compare the cost of a larger model with better recall?
9. What changes when the system is safety-related?
10. How do you make a distributed training job resilient to preemption?

## Definition of done

- A reviewer can reconstruct one result from a clean checkout and named data.
- Tests catch preprocessing and coordinate drift across training/serving.
- The design names owners, SLOs, release/rollback criteria, and incident actions.
- Metrics cover service, input, prediction, delayed quality, and key slices.
- You can defend the design at 10x scale and identify the first bottleneck to
  measure instead of guessing it.

