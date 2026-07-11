# Portfolio Projects

Build one flagship project deeply and one or two smaller projects well. Four
half-finished repositories are weaker evidence than one system another engineer
can reproduce, challenge, and operate.

## Recommended selection

| Primary role | Flagship | Supporting project |
|---|---|---|
| Google-style CV/ML | 01 Perception benchmark or a visual-search adaptation | 02 Real-time pipeline |
| NVIDIA | 02 Real-time edge pipeline | 01 evaluation or 03 tracking |
| 42dot | 04 Autonomy capstone | 03 3D tracking and 02 deployment |

## Required contents of a polished project

- Problem statement, user/downstream decision, scope, non-goals, constraints.
- Environment and one-command CPU smoke test from a clean checkout.
- Data card: source/license, schema, versions, splits, leakage, slices, limits.
- Baseline before improvement and a trusted metric sanity check.
- Experiments with hypotheses, fixed budgets, negative results, uncertainty.
- Tests for geometry, preprocessing, metrics, serialization, and key interfaces.
- Benchmark: hardware/software, workload, warm-up, p50/p95/p99, throughput,
  memory, accuracy/quality and profiling evidence.
- Failure taxonomy with representative examples and priority by impact.
- Design review: alternatives, interfaces, failure modes, monitoring, rollback.
- Short demo and a two-minute/ten-minute explanation.
- Honest limitations, safety/privacy/license considerations, and next decisions.

Use the two templates in this folder and the rubric in `PORTFOLIO_RUBRIC.md`.

## Scope rule

Start with a thin vertical slice that goes from a small legal dataset through
evaluation to a saved report. Add model complexity only after that path is
reproducible. Do not download data automatically or commit data/model weights;
document acceptance of dataset/model terms and verify downloaded artifacts.

## Portfolio publishing

Never publish former-employer code, internal diagrams, data, exact proprietary
metrics, credentials, customer information, or restricted model artifacts.
Replace confidential context with a personal/open-data implementation and label
which parts are newly built.

