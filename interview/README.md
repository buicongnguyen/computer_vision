# Interview Preparation

This section prepares capabilities commonly implied by senior CV job
descriptions. It is not a collection of leaked company questions, and no prompt
should be interpreted as an official interview format.

## The five-round practice loop

1. **Coding (45 min):** algorithm, tests, complexity, clear implementation.
2. **CV/ML depth (45 min):** derivation, model/evaluation choices, debugging.
3. **ML or autonomy system design (50 min):** requirements through operations.
4. **Project deep dive (45 min):** your decisions, evidence, failures, leadership.
5. **Behavioral/leadership (45 min):** structured examples and follow-up depth.

NVIDIA-focused loops should add C++/GPU performance. 42dot-focused loops should
add 3D geometry, fusion, tracking, and autonomy scenario reasoning. Always check
the recruiter’s description of the actual loop.

## Weekly cadence

- Weeks 1-8: one coding round and ten oral questions per week.
- Weeks 9-16: add one alternating system design/project deep dive each week.
- Weeks 17-20: add the primary role-specific round.
- Weeks 21-24: run a full loop every two weeks plus targeted remediation.

Use a human interviewer when possible. If practicing alone, record video, keep a
strict timer, and score only observable behavior using `mock_loop.md`.

## Files

- `coding.md` — patterns, progression, and CV-flavored implementation prompts.
- `cv_ml_question_bank.md` — foundational, modern, evaluation, and debugging
  questions with the signal a strong answer should contain.
- `system_design.md` — design prompts and a repeatable answer framework.
- `performance_cpp_cuda.md` — NVIDIA-weighted production and GPU preparation.
- `behavioral.md` — evidence recovery and senior leadership stories.
- `mock_loop.md` — score sheets and remediation workflow.

## Answer discipline

For a technical question:

1. Define the object and assumptions.
2. Give the core equation or mechanism.
3. Compare alternatives against a stated constraint.
4. Name failure modes and how you would observe them.
5. Connect the answer to a real implementation or experiment.

For a project question:

```text
Context -> target metric/constraint -> your decision -> alternatives/evidence
-> implementation and collaboration -> measured outcome -> failure/lesson
```

An interviewer should always be able to distinguish team outcome from your
specific contribution.

