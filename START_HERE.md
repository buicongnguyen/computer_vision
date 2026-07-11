# Start Here

## The first 90 minutes

1. Create and activate the environment described in `README.md`.
2. Run `python tools/check_env.py` and `pytest -q`.
3. Read `curriculum/00_diagnostic.md` without looking at reference solutions.
4. Block two uninterrupted diagnostic sessions on your calendar.
5. Copy `progress/weekly_log_template.md` to `progress/week_00.md`.

## Week 0: establish the truth

Complete the diagnostic under time pressure. Mark every item using the rubric in
`SKILL_MATRIX.md`; do not turn familiarity into a passing score. A skill counts
only when you can apply it and explain the trade-offs.

At the end of week 0, choose:

- **Primary learning branch:** representation and data, accelerated systems, or
  3D spatial perception.
- **Secondary branch:** one adjacent topic that exposes different assumptions.
- **Applied study:** the problem you will carry from data specification to
  design review and postmortem.
- **Weekly budget:** 10, 15, or 20+ hours you can sustain.

Record the choices at the top of `progress/scorecard.md`.

## The learning loop

Use the same loop for every topic:

1. **Predict:** write what you expect before running an experiment.
2. **Derive:** reconstruct the key equation and name its assumptions.
3. **Implement:** build the smallest correct version from scratch.
4. **Measure:** choose metrics and slices before comparing models.
5. **Break:** create adversarial or edge cases; explain the failure.
6. **Optimize:** profile first, change one bottleneck, report the trade-off.
7. **Teach:** give a five-minute explanation with no notes.
8. **Ship:** turn the work into a reproducible artifact another engineer can run.

## Weekly operating system

| Session | Purpose | Typical output |
|---|---|---|
| 2 x 90 min | Theory and derivation | One-page derivation plus flash questions |
| 2 x 90 min | Implementation | Tested code and benchmark |
| 1 x 90 min | Paper/design reading | Structured paper or design review |
| 1 x 60 min | Retrieval practice | Timed coding, derivation, or verbal explanation |
| 1 x 60 min | Review | Error log, score update, next-week plan |
| 3-6 hours | Applied project | Reproducible project increment |

If you have only ten hours, keep the review and project sessions; reduce the
number of resources, not the requirement to implement and measure.

## Rules that prevent fake progress

- Never report only a headline metric. Include data version, conditions,
  uncertainty, important slices, latency measurement method, and known failures.
- Never claim “real time” without hardware, batch size, warm-up, percentiles,
  preprocessing/postprocessing, and end-to-end timing.
- Never treat a copied tutorial as completed learning. Add a decision,
  experiment, or comparison that tests your own understanding.
- Read papers to answer a question; do not optimize for paper count.
- Keep an `I was wrong because...` section in each weekly log.
- Re-run the diagnostic in weeks 8, 16, and 24.

## When to advance

Advance to a dependent topic when you can explain the current topic without
model-name shorthand, implement its smallest useful baseline, pass the core
tests, compare at least two alternatives, and name a falsifying experiment. If
one dependency fails, return to that dependency instead of adding more papers.
