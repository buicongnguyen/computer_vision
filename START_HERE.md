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

- **Primary target:** Google-style ML systems, NVIDIA performance, or 42dot
  autonomy/perception.
- **Secondary target:** one adjacent track that improves your breadth.
- **Capstone:** the problem you will carry from data specification to design
  review and postmortem.
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
| 1 x 60 min | Interview practice | Timed coding or verbal CV round |
| 1 x 60 min | Review | Error log, score update, next-week plan |
| 3-6 hours | Portfolio project | Demoable project increment |

If you have only ten hours, keep the review and project sessions; reduce the
number of resources, not the requirement to implement and measure.

## Rules that prevent fake progress

- Never report only a headline metric. Include data version, conditions,
  uncertainty, important slices, latency measurement method, and known failures.
- Never claim “real time” without hardware, batch size, warm-up, percentiles,
  preprocessing/postprocessing, and end-to-end timing.
- Never put a copied tutorial in a portfolio. Add a decision, experiment, or
  system contribution that is unambiguously yours.
- Read papers to answer a question; do not optimize for paper count.
- Keep an `I was wrong because...` section in each weekly log.
- Re-run the diagnostic in weeks 8, 16, and 24.

## When to apply

Start networking and low-stakes applications around week 12 if you already have
relevant professional experience. Begin target applications when the scorecard
has no critical area below level 2 and at least six target-relevant areas at
level 3. Applications and preparation should overlap; real interviews expose
gaps no private study plan can predict.

