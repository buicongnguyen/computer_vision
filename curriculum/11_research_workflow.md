# Module 11 — Research Reading, Reproduction, and Translation

## Outcomes

You should be able to evaluate a claim, reproduce the smallest decisive result,
identify a limitation, and decide whether the idea deserves production work.

## Three-pass reading

### Pass 1: decision (10-15 minutes)

Write the problem, claimed contribution, evidence type, required resources, and
whether the paper is relevant to a current question. Do not read linearly yet.

### Pass 2: evidence map (30-60 minutes)

Trace each major claim to an experiment. Record dataset/split, metric, baseline,
compute/pretraining data, ablations, uncertainty, and missing comparison. Inspect
figures and appendices for conditions hidden by an average.

### Pass 3: reconstruct

Derive the core objective or geometry, follow tensor shapes, estimate compute,
and write the smallest experiment capable of falsifying the claim.

## Claim table

| Claim | Supporting result | Alternative explanation | Reproduction test |
|---|---|---|---|
| Example: augmentation improves occlusion robustness | +2 AP on validation | Different training budget | Same updates/seeds, occlusion slices |

This prevents a paper summary from becoming a list of architecture components.

## Reproduction levels

1. **Mechanism check:** synthetic/toy data validates the central idea.
2. **Directional result:** smaller dataset/model shows the claimed direction.
3. **Table reproduction:** match a named result within a predeclared tolerance.
4. **Robust extension:** test a new slice/dataset, negative result, or production
   constraint and explain why behavior changes.

For portfolio work, level 2 plus a thoughtful level-4 extension often shows more
judgment than an expensive attempt to copy an entire leaderboard table.

## Reproduction protocol

Before running:

- Pin the exact claim and acceptance tolerance.
- Record official code/model/data licenses and versions.
- Freeze baseline, split, metric code, seeds, updates, and compute budget.
- List deviations forced by resources.
- Estimate cost and define a stopping rule.

After running:

- Report all attempts, not only the best seed.
- Compare curves, intermediate statistics, and examples—not just the final score.
- Investigate data/preprocessing/evaluation mismatch before changing the model.
- Separate confirmed, contradicted, inconclusive, and untested claims.
- Publish a limitations section and a command that recreates the small result.

## Production translation questions

- Does the method improve the required operating point and difficult slices?
- What training data or licensing assumptions prevent deployment?
- What are preprocessing, latency, memory, power, and hardware constraints?
- Does the evaluation match streaming/closed-loop behavior?
- How stable is the gain across seeds, domains, and calibration error?
- Can the system abstain, degrade safely, be monitored, and be rolled back?
- Which component owns the complexity for the long term?

## Required artifact

Choose a relevant paper from `resources/paper_reading_list.md` and produce:

- `QUESTION.md`: why the claim matters.
- `CLAIMS.md`: claim/evidence/alternative/test table.
- `PLAN.md`: resources, deviations, metrics, slices, cost, stopping rule.
- Reproducible code/config with a smoke test.
- `RESULTS.md`: all attempts, plots/tables, uncertainty, failure examples.
- `PRODUCTION_DECISION.md`: adopt, test further, or reject—and why.

## Interview drills

1. Present the paper in two minutes without architecture trivia.
2. Which experiment most strongly supports the central claim?
3. What confound or missing baseline concerns you?
4. If compute is cut by 100x, what is the decisive experiment?
5. Why might this result fail on video, edge hardware, or closed-loop driving?
6. Describe a negative result that would still teach the team something.

## Definition of done

A reviewer can connect every conclusion to evidence, reproduce the small
experiment, see deviations and negative results, and understand a concrete
production decision.

