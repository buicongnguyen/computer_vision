# 42dot Senior Computer Vision / Perception — Korea Application Guide

Role snapshot verified **2026-07-11 (Asia/Seoul)**.

At verification time, 42dot's live careers board listed **Senior Computer
Vision Engineer (Autonomous Driving)** in Pangyo, South Korea. A recent official
Senior AI Perception role supplies a second, closely related view of the senior
perception bar. Re-open the live posting before applying: role content,
headcount, and interview steps can change.

## How to read this guide

- **Official** means stated on a 42dot or Hyundai source linked below.
- **Preparation inference** means a reasonable way to prepare from the stated
  work, but it is not a disclosed interview question or hiring rule.
- **Hyundai comparison** describes Hyundai Motor's broader experienced-hiring
  process. Do not assume it automatically applies to 42dot.

## Current senior bar

| Area | Official signal | Evidence your packet should make easy to find |
|---|---|---|
| Seniority | Senior CV: 7+ relevant years. Senior AI Perception: PhD or 6+ years. | Scope, ownership, decisions, and shipped impact; years alone are weak evidence. |
| Education | CV/robotics/ML MS or PhD, or equivalent practical experience. | Degree or concise explanation of equivalent depth through work and research. |
| 3D vision | Shape modeling, pose, tracking, depth, reconstruction, SLAM and physics-based vision. | One geometry-heavy project with equations, tests, degeneracy and quantitative error. |
| Perception | 2D/3D/BEV, occupancy, occlusion, depth ambiguity and generalization. | Reproducible benchmark with range/occlusion/environment slices and ablations. |
| Sensors | Camera, radar, LiDAR, GPS and IMU; calibration, projection and spatial/temporal alignment. | Sensor contract, calibration/timing experiments and a degradation test. |
| Data loop | Large unlabeled data, self-supervision, data quality, sampling and failure analysis. | Failure miner, data-selection rule, leakage protection and measured retraining result. |
| Production | C++/Python, parallel/GPU optimization, C++ inference, cloud deployment and resource trade-offs. | Named hardware, end-to-end p50/p95 latency, peak memory, correctness checks and profile. |
| Future autonomy | World models and closed-loop simulation appear in the Senior CV responsibilities. | A simulation/world-model experiment or a careful closed-loop-readiness design. |
| Research | Top CV conferences/journals are preferred, not listed as a universal requirement. | Publication, paper reproduction, patent, or a technically defensible novel experiment. |
| Collaboration | 42dot Way emphasizes impact, detail, fast execution, cross-team delivery, self-motivation and transparent communication. | Stories that name disagreement, decision, stakeholders, result and what changed afterward. |

## Tailor the application thesis

Your first page should answer this in under 20 seconds:

> What autonomy/perception problem can this person own, at what scale, under
> which vehicle constraints, and what evidence shows they can ship it safely?

Choose one primary thesis rather than presenting every CV topic equally:

1. **3D perception and fusion:** calibration, BEV/occupancy, sensor fusion,
   tracking, difficult-scene robustness.
2. **Geometry and localization:** SLAM/VIO/SfM, state estimation, optimization,
   calibration, production C++.
3. **Efficient vehicle inference:** model/system co-design, CUDA/TensorRT,
   memory and latency, numerical validation.
4. **Data-centric perception:** failure mining, active learning, distillation,
   large-scale evaluation and model deployment.

Support the thesis with two deep projects and one breadth project.

## Resume and career-description packet

### Official 42dot submission points

The recent Senior AI Perception posting asks applicants to exclude the
following from the resume:

- Korean resident-registration number (`주민등록번호`);
- family relationships and marital status;
- current or previous salary;
- photo and physical characteristics; and
- region of origin.

It requests PDF files under 30 MB. The Senior CV snapshot requests PDF files,
and keeping the complete packet below 30 MB is the safe practical choice. If an
upload fails, the perception posting directs applicants to email the resume and
position URL to `recruit@42dot.ai`.

42dot notes statutory preference for veterans/employment-protection candidates
and registered candidates with disabilities. Include such status only in the
appropriate application field when applicable; it is not a technical resume
signal.

### Recommended packet — preparation guidance

1. **Resume, 2 pages:** English or Korean; use a text-based PDF.
2. **Technical project appendix, 6-10 pages:** diagrams, metrics, slices,
   runtime, failures, ownership, and links.
3. **Publication/patent list, optional:** title, venue/year, contribution and
   link; do not reproduce copyrighted papers.
4. **Portfolio links:** stable Git repository, short demo, and reproducibility
   command. Never expose confidential employer data, code, metrics, or system
   architecture.

The postings are bilingual but do not state an interview language or require a
specific English score. Preparing a concise project explanation in both Korean
and English is sensible for a global engineering team, but that is advice, not
an official eligibility rule.

### Bullet formula

Use this structure:

```text
Owned [safety/product problem] across [data/sensors/system scope]; changed
[model/geometry/data/runtime decision], improving [metric and critical slice]
from [baseline] to [result] while meeting [latency/memory/cost constraint];
led [cross-team decision, launch or recovery].
```

Example:

```text
Owned camera-radar BEV detection for dense urban scenes; corrected a 42 ms
clock-domain mismatch and redesigned temporal alignment, reducing pedestrian
position error 18% at 30-50 m while holding batch-1 p95 latency to 87 ms on
the named target device; coordinated sensor, data and vehicle validation.
```

Only use values you can substantiate. If employer results are confidential,
describe scope and decision quality without inventing or leaking numbers.

### Career-entry precision for Korean systems

Hyundai's official application-entry guidance warns that automated parsing may
omit experience when company, department, employment dates, title, duties, or
major achievements are unclear. It also notes a 1,000-character limit for
duties/achievements in its system. That is Hyundai-specific, but it is good
discipline for any Korean large-company application:

- use exact `YYYY.MM-YYYY.MM` dates;
- distinguish company, department, title and employment type;
- separate responsibility from measured achievement;
- spell out your contribution when work was shared; and
- keep a compact Korean version of each project entry ready for form fields.

## Official 42dot process

The Senior CV and recent Senior AI Perception snapshots state:

```text
Resume screening
    -> Coding test
    -> Virtual interview (about 1 hour)
    -> Onsite or virtual interview (about 3 hours)
    -> Final offer
```

The procedure can vary by position and scheduling. Results and scheduling are
sent to the email registered in the application.

The Senior AI Perception posting additionally says:

- a reference check may occur after the interview process with the applicant's
  consent; and
- a three-month probationary period may apply.

## Stage-by-stage preparation

42dot does not publish the test syllabus or panel composition. Everything below
this heading is **preparation inference**, not inside information.

### 1. Resume screen

Make the first half-page prove role fit:

- years and domain scope;
- strongest 3D/perception/fusion specialty;
- C++ and Python production evidence;
- one scale or vehicle-deployment result;
- one leadership/cross-team result; and
- publication or paper-reproduction evidence when relevant.

**Gate:** A reviewer can map at least eight current JD signals to a page, bullet,
repository, or report in less than five minutes.

### 2. Coding test

Prepare general coding because the official page only says "coding test."

- Solve in both Python and modern C++.
- Practice arrays, hashing, graphs, heaps, intervals, binary search, dynamic
  programming and basic concurrency-safe reasoning.
- Add CV-adjacent exercises: IoU/NMS, Hungarian-cost construction, transform
  composition, bilinear sampling, point-cloud voxelization and a Kalman update.
- Narrate complexity, numeric precision, invalid input, tests and memory.

**Gate:** Complete two unfamiliar medium problems in 90 minutes with compiling
code, explicit tests and correct complexity. Complete one geometry primitive in
45 minutes without relying on a CV library implementation.

### 3. One-hour virtual interview

Prepare:

- a 90-second role thesis;
- a 10-minute deep dive on the strongest project;
- a whiteboard derivation for geometry/estimation;
- a failure that changed your technical decision; and
- a concise reason for 42dot tied to production autonomy, not generic AI hype.

Likely high-value domains based on the JD are coordinate frames, calibration,
tracking, BEV/occupancy, multi-sensor alignment, generalization, data quality,
and deployment trade-offs.

**Gate:** Deliver the project explanation in 10 minutes, then answer 20 minutes
of interruption without losing assumptions, metrics, ownership, or failure
modes.

### 4. Three-hour onsite or virtual interview

Prepare for multiple deep discussions even though the official page does not
specify the panel format:

- algorithm/research depth;
- production C++/GPU/runtime judgment;
- autonomy system design and safety/degraded operation;
- data/evaluation and failure analysis; and
- technical leadership and 42dot Way.

Bring a clean, non-confidential architecture diagram and be ready to redesign
it under a new constraint such as missing radar, a 30% compute cut, calibration
drift, a new geography, or a stricter pedestrian-recall requirement.

**Gate:** Run a three-hour mock containing coding, CV fundamentals, system
design and behavioral evidence. No critical rubric area may score below 2/4,
and the role specialty must score at least 3/4.

## Technical question bank

These are generated practice questions, not reported 42dot questions.

1. Derive `T_camera_from_lidar` through an ego frame and show how you test the
   direction.
2. What does a `100 ms` time offset do at 15 m/s while turning?
3. Choose camera-radar fusion points for BEV occupancy and defend the choice.
4. Why can an occupancy model outperform boxes for unknown obstacles yet be
   harder to deploy?
5. A new model raises global AP but lowers distant-pedestrian recall. Ship or
   block? What evidence is missing?
6. Design a failure miner for duplicated pedestrians in dense scenes.
7. Explain how to distinguish label error, calibration error, and model error.
8. Set and measure a 10 Hz end-to-end runtime budget, including preprocessing
   and postprocessing.
9. Describe missing-sensor training and a runtime fallback.
10. Compare self-supervised large-scene pretraining with supervised scaling.
11. Design a closed-loop evaluation that exposes errors hidden by open-loop AP.
12. When should a senior engineer reject a newer model with a better benchmark?

## 42dot Way story bank

The following mappings use official culture language; the prompts are practice
guidance.

| 42dot signal | Story to prepare | Evidence required |
|---|---|---|
| Impact-driven, mission-aligned | Chose a safety/product metric over an attractive research metric | Decision, customer/vehicle effect, outcome |
| Detail-oriented agile execution with grit | Found a low-level data, timing or runtime issue and drove it to closure | Diagnosis trail, iterations, final guardrail |
| Cross-team execution | Joined sensor, data, platform and validation work into one result | Interfaces, conflict, decision and shared result |
| Competency is fundamental | Made a deep technical judgment others relied on | Alternatives, mechanism and review evidence |
| Self-motivation | Defined an ambiguous problem and obtained missing evidence | Initial ambiguity, actions and measurable result |
| Open/humble communication | Changed your view after a rigorous disagreement | Original position, new evidence and resulting decision |
| Disagree now but align | Raised a material risk, then supported the final decision | How risk was recorded, mitigation and team outcome |
| Deliver with agility | Shipped a safe incremental improvement before a perfect redesign | Scope boundary, safeguards, learning and next step |

Use `Situation -> Constraint -> Decision -> Actions -> Result -> Reflection`.
Name your decision and influence; do not hide behind "we."

## Korea-specific context: 42dot versus Hyundai Motor

Hyundai Motor's official experienced-hire page currently describes monthly
recruiting and this general process:

```text
Application -> interviews/personality test -> medical exam/onboarding
```

It says a pre-interview during document review or an interview assignment may
be added for general/research roles. General eligibility includes a bachelor's
degree or higher, meeting the posting's experience/qualifications, no overseas-
travel restriction, and completed/exempt military service for men.

Those are **Hyundai Motor** rules, not automatically 42dot rules. The current
42dot senior pages should be the source of truth for a 42dot application. In
particular:

- do not add a personality test or medical exam to your assumed 42dot loop;
- do not assume an English test is required—the current 42dot senior pages do
  not list one, and Hyundai's general experienced-hire qualifications do not
  list the speaking-score rule shown for entry-level candidates; and
- ask the recruiter when a requirement or stage is not in the actual posting.

## Final application gate

Do not send the target application until all required items pass.

- [ ] The live role was re-checked within seven days.
- [ ] The first half-page establishes specialty, seniority, C++/Python, scale,
  deployment and ownership.
- [ ] At least eight JD requirements map to explicit evidence.
- [ ] Two projects include baseline, metric definitions, slices, runtime and
  failure analysis.
- [ ] One project covers geometry/calibration/timing or 3D perception.
- [ ] One artifact covers deployment or system optimization.
- [ ] Resume contains none of the prohibited personal information listed above.
- [ ] PDF text can be selected, links work, and the total is under 30 MB.
- [ ] Dates, departments, titles, responsibilities and achievements are exact.
- [ ] No confidential code, data, architecture, names or unreleased metrics are
  exposed.
- [ ] Two coding mocks and one full technical mock meet their gates.
- [ ] Six 42dot Way stories contain decisions and measured outcomes.
- [ ] Korean and English project summaries have been rehearsed if you choose
  the bilingual-preparation recommendation.

## Sources

Verified **2026-07-11**.

### 42dot primary sources

- [Live open roles](https://www.42dot.ai/careers/openroles)
- [Senior Computer Vision Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d7f9e679-a018-4ab8-933c-3399995f9da8)
- [Senior AI Perception Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d03cec6d-f885-4d4a-bfce-76fd81994731)
- [42dot Way](https://www.42dot.ai/careers/way)
- [Active Learning for Continuous Model Improvement](https://www.42dot.ai/blog/180)
- [42dot research](https://www.42dot.ai/research)
- [Autonomous-driving datasets](https://42dot.ai/openDataset/ad/overview)

The `stage.42dot.ai` links are official 42dot indexed mirrors used because the
live detail page can render dynamically. Confirm vacancy status on the live
open-roles page before applying.

### Hyundai primary sources for comparison

- [Hyundai Motor hiring process](https://talent.hyundai.com/apply/applyProcess.hc)
- [Hyundai Motor application-entry guidance](https://talent.hyundai.com/apply/applyWrite.hc)
- [HMG Tech Talent Forum 2026: Minwoo Park](https://www.hyundai.com/worldwide/en/newsroom/detail/0000001193)

The HMG article is strategic context about production-scale AI, data flywheels,
sensor standardization, collaboration, and automotive reliability. It is not a
published 42dot interview scorecard.

