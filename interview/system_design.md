# CV/ML System Design Practice

Use the detailed framework in `../curriculum/10_system_design_leadership.md`.
This file supplies prompts, challenge cards, and a score sheet.

## Common response skeleton

```text
1. User/vehicle behavior and scope
2. Functional/nonfunctional requirements and estimates
3. Data, labels, privacy/license, split and lineage
4. Baseline model and evaluation/operating point
5. Training architecture and experiment workflow
6. Serving/data flow, interfaces, state, queues and hardware
7. Rollout, monitoring, feedback, rollback and incident behavior
8. Bottleneck/cost, alternatives, 10x evolution and unresolved risks
```

## Prompt 1 — Billion-image visual search

Support image-to-image and text-to-image search, fresh uploads within ten
minutes, regional deletion within one day, and 200 ms p95 response time.

Challenge cards:

- Traffic grows 20x during an event.
- A new embedding improves recall but requires re-indexing everything.
- Private images appear in public results.
- Head queries are fast but rare filters time out.
- A user requests complete deletion while backups and derived embeddings exist.

## Prompt 2 — Multi-stream video analytics

Design detection/tracking for 10,000 concurrent 1080p streams with per-stream
alerts, bounded cost, and graceful overload.

Challenge cards:

- Streams have variable FPS/codecs and burst reconnects.
- One tenant sends corrupt frames that crash a decoder.
- Batching improves throughput but violates alert latency.
- A model update doubles GPU memory.
- Ground truth is available for only 0.01% of frames.

## Prompt 3 — Autonomous perception data engine

Find, label, train on, and validate rare pedestrian/cyclist interactions from a
large multi-sensor fleet.

Challenge cards:

- Detector-based mining misses exactly the cases the detector cannot see.
- Calibration changes halfway through collection.
- Privacy policy forbids retaining some raw imagery.
- Aggregate recall rises while rainy-night recall falls.
- Simulation gains do not transfer to closed-loop vehicle tests.

## Prompt 4 — On-device tracking

Design hand/eye tracking at high frame rate on a power-constrained device.

Challenge cards:

- Thermal throttling begins after eight minutes.
- Users wear reflective glasses or gloves unseen during training.
- A cloud fallback is unavailable.
- Quantization introduces temporal jitter.
- Camera and IMU clocks drift.

## Prompt 5 — Shared model evaluation platform

Fifty teams need reproducible evaluation across petabyte-scale vision datasets,
custom slices, expensive metrics, and protected data.

Challenge cards:

- Teams define incompatible class ontologies.
- A metric implementation changes after a launch decision.
- Duplicate evaluation jobs exhaust GPUs.
- Results must be deleted when source data consent is revoked.
- A malicious model artifact must not execute arbitrary code.

## Prompt 6 — Fleet model release

Release a new multi-sensor perception model to heterogeneous vehicle hardware
while maintaining safe fallback and rapid rollback.

Challenge cards:

- Only some vehicles support the required operator.
- The shadow model changes timing of the primary pipeline.
- A canary region does not cover target weather.
- Rollback model expects the old calibration schema.
- An incident appears only after several minutes of temporal state.

## Score sheet (0-4 each)

| Dimension | Questions |
|---|---|
| Clarification | Were behavior, scope, non-goals, and error costs explicit? |
| Estimates | Were scale, data rate, latency/cost budgets internally consistent? |
| ML/data | Were contracts, leakage, metrics, slices and experiment rigor credible? |
| Architecture | Were interfaces, state, queues and ownership boundaries clear? |
| Reliability | Were overload, corruption, monitoring, rollout and rollback concrete? |
| Judgment | Were alternatives compared and deepest risks prioritized? |
| Leadership | Was the explanation structured, decisive, and responsive to challenge? |

Pass threshold: average 3.0, no category below 2. Repeat the same prompt after
48 hours and show which design decisions changed.

