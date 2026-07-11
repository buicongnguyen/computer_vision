# Project Case Study Template

Target a concise public page with links to deeper design and benchmark reports.

## One-line outcome

What decision/system you built, for whom, and the measured result/constraint.

## Problem and constraints

Downstream behavior, error costs, dataset/sensors, hardware, latency/memory/cost,
privacy/safety/license, and non-goals.

## My contribution

What you personally framed, decided, implemented, reviewed and measured. Name
collaborators or upstream open-source work accurately.

## Design

Small architecture/data-flow diagram; interfaces, coordinate/time convention,
baseline, major decision and rejected alternative.

## Evaluation

Dataset version/split/leakage policy, metrics/operating point, slices,
uncertainty, trusted comparison and reproduction command.

## Results

| Variant | Quality + critical slices | p50/p95/p99 | Throughput/memory | Decision |
|---|---|---|---|---|

Use conditions and units. Include negative/neutral experiments.

## Failure that changed the design

Show the input/scenario, hypothesis, investigation, root cause, change and
regression test. This is often the strongest senior evidence on the page.

## Production design

Versioning, monitoring, SLO, overload/corruption behavior, rollout, rollback,
cost and owner boundaries. Clearly label proposed versus actually implemented.

## Limitations and next decision

Known blind spots, safety/privacy/licensing limits, unsupported conditions and
the next experiment that would change the decision.

## Reproduce / demo

Environment, CPU smoke command, full benchmark prerequisites, demo link and
artifact checksums. Avoid requiring a recruiter to download a giant model just
to understand the outcome.

