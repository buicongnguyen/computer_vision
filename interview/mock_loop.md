# Mock Interview Loop and Scorecard

## Full loop

Run this across one or two days. Use different interviewers where possible.

| Round | Time | Material |
|---|---:|---|
| Coding | 45 min | Unseen general or CV implementation prompt |
| CV/ML depth | 45 min | 6-8 questions plus one derivation/debug case |
| System design | 50 min | One prompt plus two challenge cards |
| Project deep dive | 45 min | Flagship project with adversarial follow-ups |
| Leadership | 45 min | 3-4 themes plus detailed follow-ups |
| Role elective | 45 min | GPU/C++ or autonomy/3D/fusion |

## Universal 0-4 scale

| Score | Observable behavior |
|---:|---|
| 0 | Missing or substantially incorrect; cannot progress with hints |
| 1 | Recognizes topic but answer/implementation needs major guidance |
| 2 | Independently correct on normal case; some gaps in edge cases/trade-offs |
| 3 | Correct, structured, tested/measured, handles important follow-ups |
| 4 | Exceptional synthesis: anticipates ambiguity/failure and teaches clearly |

## Round sheet

```text
Date / interviewer / target role:
Prompt(s):

Scores (0-4)
- Clarification and structure:
- Technical correctness:
- Depth and trade-offs:
- Testing/evidence:
- Production/failure awareness:
- Communication and response to hints:

Hire signal: strong no | no | mixed | yes | strong yes
Three strongest observed behaviors:
Three gaps with timestamp/example:
First wrong assumption:
Highest-value remediation:
Retest prompt and date:
```

For coding, additionally score contract, approach, implementation, tests, and
complexity. For leadership, score ownership, impact, influence, learning, and
credit. For design, use the dimensions in `system_design.md`.

## Project deep-dive challenge set

- Draw the production/data architecture and identify the highest-risk boundary.
- Reconstruct the baseline and prove the improvement was not leakage/noise.
- Show a failure that changed the design.
- Explain latency measurement and the current bottleneck.
- What did you personally decide? Who disagreed?
- What happens at 10x data/traffic or half the compute?
- How does the system detect degradation and roll back?
- Which assumption is least supported?
- What would you remove if shipping in four weeks?
- What did a reviewer teach you?

## Remediation rule

Do not respond to a poor mock by doing many unrelated problems. Classify the
failure, practice the smallest missing behavior, then retest under the same
constraint after 2-7 days. Keep both scores; improvement is part of the evidence.

## Application readiness

Before a priority application, aim for two consecutive loops with:

- No round below 2.
- Average at least 3.
- No repeated critical correctness failure.
- A role-specific round at least 3.
- Project and leadership answers supported by verifiable evidence.

This is a practice gate, not a guarantee of a hiring outcome.

