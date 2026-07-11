# Module 10 — Senior System Design and Technical Leadership

## Outcomes

You should be able to turn ambiguity into an explicit design, run a review that
surfaces the important risks, make a reversible or well-supported decision, and
align multiple teams through delivery and operations.

## A 45-minute design structure

| Minutes | Work |
|---:|---|
| 0-5 | Clarify user/vehicle behavior, scope, constraints, and success/failure |
| 5-10 | Estimate scale, traffic/data rates, latency and availability budgets |
| 10-18 | Draw data/control flow and define component interfaces |
| 18-28 | Deep dive into the highest-risk ML and systems choices |
| 28-35 | Evaluation, rollout, monitoring, safety/privacy, failure recovery |
| 35-40 | Bottlenecks, costs, alternatives, evolution to 10x |
| 40-45 | Summarize decisions, unknowns, experiments, and next steps |

The drawing is not the design. The design is the set of decisions, constraints,
interfaces, failure behavior, and evidence that make the drawing credible.

## Requirement checklist

- Functional behavior and explicit non-goals.
- Input/output schemas, rates, ordering, freshness, and consistency.
- Latency budget by stage, throughput, availability, hardware and cost ceiling.
- Quality targets by operating point and important slices.
- Security, privacy, retention, safety, interpretability, and human override.
- Launch size, expected growth, regional/vehicle/device differences.

Back-of-the-envelope calculations should expose impossible assumptions. Estimate
camera bytes/second, retained storage, annotation volume, GPU-hours, network
bandwidth, QPS, queue depth, and worst-case in-flight memory.

## Architecture principles to defend, not recite

- Keep a bounded queue between stages; define drop/backpressure behavior.
- Make event time, frame ID, calibration version, and model version observable.
- Use idempotency where retries can duplicate expensive or state-changing work.
- Isolate the safety/availability fallback from the learned component when the
  risk analysis requires it.
- Prefer a simple baseline and measurable evolution over speculative scale.
- Place an interface at a rate, ownership, failure, or deployment boundary—not
  merely between boxes on a diagram.

## Architecture Decision Record

For each consequential choice, write:

```text
Context and forces
Decision and owner/date
Alternatives considered
Evidence and assumptions
Positive/negative consequences
Validation and rollback plan
Conditions that trigger revisiting the decision
```

This separates disagreement about goals, facts, and risk tolerance.

## Senior leadership is observable behavior

Strong examples show that you:

- Converted an ambiguous objective into a measurable plan.
- Chose technical direction while making uncertainty visible.
- Invited the right disagreement early and changed course when evidence won.
- Coordinated research, data, platform, product, hardware, and safety boundaries.
- Raised engineering quality through reviews, tools, mentoring, or standards.
- Handled an incident without blame and changed the system afterward.
- Delivered through others without hiding their contributions.

Use `application/evidence_inventory.md` to recover exact facts before writing
stories. “We” describes teamwork; “I” must make your own decision and action
clear without taking credit from others.

## Conflict and influence framework

1. State the shared outcome.
2. Identify whether disagreement is about facts, goals, constraints, or risk.
3. Make options and trade-offs comparable.
4. Propose the cheapest evidence that can resolve uncertainty.
5. Record the decision, owner, and revisit trigger.
6. Disagree transparently, then execute the decision unless ethics/safety demand
   escalation.

## Incident exercise

Scenario: after a camera firmware rollout, night-time pedestrian recall falls,
queue latency rises, and only aggregate dashboards look healthy.

Produce a one-page incident timeline, containment plan, communication cadence,
root-cause tree, missing observability, rollback decision, corrective actions,
and verification/ownership dates. Separate proximal trigger from systemic causes.

## System-design prompts

- Design visual search over one billion images with deletion and freshness.
- Design real-time multi-camera analytics for 10,000 concurrent streams.
- Design an autonomous-driving perception data engine for rare scenarios.
- Design on-device eye/hand tracking within a strict power and latency budget.
- Design a model evaluation platform for 50 teams and petabyte-scale data.
- Design an over-the-air perception release with fleet canary and rollback.

For every prompt, cover data, model, serving, evaluation, operations, cost,
security/privacy, and organizational ownership.

## Review rubric

Score 0-4:

- Requirements and estimates are explicit and internally consistent.
- Architecture meets the stated behavior and has clear boundaries.
- ML evaluation connects to user/safety outcomes and important slices.
- Failure modes, observability, rollout, rollback, and incident response exist.
- Alternatives and costs are compared rather than mentioned.
- Communication is structured, receptive to challenge, and decisive.

## Definition of done

Pass two adversarial reviews with no category below 2 and average at least 3.
After each review, update the design and keep a decision log showing what changed
and why.

