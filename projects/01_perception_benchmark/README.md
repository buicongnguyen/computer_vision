# Project 01 — Reproducible Perception Benchmark

## Mission

Build an evaluation system that tells an engineer *why* a detector or segmenter
changed, not merely whether one aggregate number moved. This is a strong general
CV/ML project and a foundation for the other projects.

## Recommended scope

Choose one legally accessible dataset and one task:

- COCO subset or Pascal VOC for general object detection.
- BDD100K for road-scene 2D detection/segmentation after accepting its terms.
- A small owned/synthetic dataset for a domain-specific problem.

Start with a pretrained open model whose license permits your use. The project’s
original contribution is the evaluator, experimental reasoning, and failure/data
work—not pretending to train a foundation model from scratch.

## System outline

```text
immutable manifest -> schema/quality audit -> deterministic inference cache
-> matching/metrics -> slice engine -> failure taxonomy -> HTML/Markdown report
```

Each prediction must retain sample ID, model/config version, class, score,
coordinates/mask convention, preprocessing metadata, and inference timing.

## Milestones

### M1 — Contract and tiny oracle

- Data card, ontology/ignore policy, grouped split and leakage checks.
- Hand-worked 3-5 image dataset covering TP, duplicate, localization error,
  class confusion, FP, FN, ignored/crowd and empty image.
- Unit tests proving matching, IoU and AP behavior on the tiny dataset.

### M2 — Baseline

- Versioned inference cache and deterministic evaluation command.
- Trusted-library comparison within a declared tolerance.
- PR curves and class/size/image-condition metrics with uncertainty over the
  correct independent unit.

### M3 — Diagnosis

- Error categories: classification, localization, duplicate, background,
  missed, annotation ambiguity.
- Slices such as size, occlusion, brightness, density, geography/source and
  class frequency where available.
- At least 30 inspected failures linked to hypotheses, not a screenshot dump.

### M4 — One evidence-driven improvement

Choose data sampling, augmentation, loss/assignment, calibration, threshold,
postprocessing, or fine-tuning based on the diagnosis. Pre-register primary
metric, guardrail slices, compute budget and stopping condition. Include the
negative or neutral result if the hypothesis fails.

### M5 — Review and publish

- Reproduction/smoke commands, tests, design and experiment report.
- Two-minute demo and ten-minute technical walkthrough.
- Model card, limitations, license/privacy notes and production monitoring plan.

## Required questions to answer

- Which metric behavior did your hand-worked oracle expose?
- What does aggregate AP hide for the downstream decision?
- Is the observed change larger than evaluation/training variance?
- Which error category should receive the next labeling or modeling hour?
- Could data leakage, annotation policy, resizing or coordinate conventions
  explain the result?

## Acceptance criteria

- Clean CPU smoke evaluation completes without network access.
- Metric tests cover empty prediction/ground-truth, ties, ignore, duplicate,
  class mismatch, boundary IoU and invalid boxes.
- Dataset and model artifacts are identified by version/checksum, not committed.
- One claimed improvement survives key slices and uncertainty analysis.
- An independent reviewer reproduces a result and finds no unmeasured headline
  claim.

## Senior extensions

- Distributed/sharded evaluation with deterministic reduction.
- Human review queue prioritized by expected error value and diversity.
- Dataset/model comparison with ontology mapping and drift report.
- Shadow/canary monitoring specification and delayed-label backfill.

