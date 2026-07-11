# Senior Project Rubric

Score each category 0-4 using the scale in `../SKILL_MATRIX.md`. A flagship is
ready for applications at average 3, no category below 2, and no critical
correctness, licensing, privacy, or safety issue.

| Category | Level-3 evidence |
|---|---|
| Problem framing | Downstream decision, constraints, error costs, scope/non-goals and success criteria are explicit |
| Data | Legal source, version/schema, split/leakage policy, quality checks, slices and limitations |
| Theory/correctness | Core assumptions are explained; metrics/geometry/preprocessing have oracle or unit tests |
| Baseline | Simple credible baseline and metric sanity checks precede improvements |
| Experiments | Hypotheses, controlled comparisons, uncertainty/seeds, negative results and resource record |
| Failure analysis | Actionable taxonomy across important slices with representative examples |
| Software quality | Clear interfaces, types/contracts, tests, reproducible setup, useful logs and reviewable changes |
| Performance | Correct end-to-end timing, percentiles, workload/hardware, profile, memory and quality trade-off |
| System design | Capacity, interfaces, data/control flow, bottleneck, alternatives and cost are defended |
| Operations | Versioning, monitoring/SLOs, rollout, rollback, corruption/overload behavior and runbook |
| Responsibility | Privacy, security, bias, safety and licensing are addressed in proportion to risk |
| Communication | README, design/benchmark reports, demo and 2/10/30-minute explanations are clear |
| Leadership | Decisions, review feedback, prioritization, collaboration and learning are visible |

## Reviewer challenge

Ask two reviewers to select at least five:

- Reproduce one result from a clean environment.
- Introduce an empty/corrupt/large/unseen input.
- Challenge the split for leakage.
- Recalculate a metric from a tiny hand-worked example.
- Inspect one coordinate or resize convention end to end.
- Change batch/resolution/stream count and explain scaling.
- Identify an unmeasured claim in the README.
- Challenge the most consequential rejected alternative.
- Simulate dependency/sensor/model failure and follow the runbook.
- Ask which result would reverse the launch recommendation.

Record feedback and the resulting change; review quality is itself senior
evidence.

