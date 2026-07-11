# Google and NVIDIA Role Playbooks

Verification date: **2026-07-11**

Use this document to translate a job description into preparation and portfolio
evidence. Re-check the live posting immediately before applying; job pages and
team needs change.

## Evidence labels

- **Official fact:** stated on an official careers page, company hiring page, or
  official technical documentation listed in
  [official_sources.md](../resources/official_sources.md).
- **Inference:** a preparation recommendation derived from repeated official
  requirements. It is not a promise about an interview loop.
- **Candidate evidence:** an artifact or story that demonstrates the skill.

Do not present an inference as an inside description of a company's interview.

## Shared senior baseline

Both companies' postings reward engineers who can connect research, software,
data, evaluation, and deployment.

| Capability | Candidate evidence |
|---|---|
| Python/C++ engineering | Tested project with clear APIs, profiling, code review, and failure handling |
| CV/ML depth | Derivations, correct metrics, ablations, slice analysis, and failure taxonomy |
| Production ownership | Data-to-deployment design, SLOs, monitoring, rollback, and an incident story |
| Architecture judgment | Design memo with alternatives, constraints, costs, and rejected options |
| Technical leadership | Specific decision, people influenced, conflict handled, and measured outcome |
| Communication | Five-minute overview, 30-minute deep dive, and one-page executive summary |

## Playbook A — Google Senior CV / Perception SWE

### Official facts from current role snapshots

The 2026 Senior Software Engineer, Eye Tracking Core posting includes:

- Five years of software development.
- Three years testing, maintaining, or launching products and one year of
  software design/architecture.
- Experience with computer vision, imaging, or augmented-reality platforms.
- Preferred depth in data structures/algorithms, technical leadership, camera
  sensor pipelines, Android data flow, Python, and Java.
- Responsibility for robust, reliable, efficient, testable software on
  compute-constrained Android devices running high-frame-rate perception.
- Architecture/design communication, code review, and cross-team performance
  work.

The current Staff Software Engineer, Roads Data Quality, Geo posting includes:

- Eight years of software development and five years leading ML design and
  production ML infrastructure.
- CV/ML/GenAI experience, with five years of CV or related specialization
  preferred.
- Data curation, multi-source sensor fusion, evaluation, vision transformers,
  translating current research to production, mentorship, and cross-functional
  leadership.
- Publications at CVPR/ICCV/ECCV/NeurIPS/ICLR and TensorFlow/JAX are preferred,
  not universal minimums.

Google's official interview-tips article advises engineering candidates to know
algorithms, practice explaining solutions aloud, and show their reasoning. It
does not specify a CV-team round structure.

### Role interpretation — inference

Google Senior SWE CV roles are still software-engineering roles. A candidate
who only trains models but cannot design, test, debug, and operate a scalable or
on-device system has an avoidable gap. Staff-level readiness additionally
requires owning ambiguous outcomes and influencing multiple teams.

### Preparation priority

| Priority | Senior target | Staff extension |
|---|---|---|
| Coding | Timed DSA in Python/C++; tests, complexity, clean narration | Same bar; demonstrate codebase and API judgment |
| CV | Imaging, tracking, detection/segmentation, 3D/spatial fundamentals | Choose a deep specialization and teach it |
| ML | Training diagnosis, metrics, transformers, multimodal basics | Lead model/data/evaluation strategy at scale |
| Systems | On-device or distributed inference; production ML lifecycle | Multi-team architecture, cost, reliability, migration |
| Leadership | Mentor, own a design, resolve a production problem | Set direction and influence across organizations |

### Portfolio packet

1. **Scalable evaluation project:** dataset contract, protected slices,
   reproducible training/evaluation, error taxonomy, and model card.
2. **Production vision system:** deployment boundary, load test, monitoring,
   fallback, and rollback.
3. **XR/on-device option:** high-frame-rate camera pipeline with a frame-time
   budget, bounded queues, sensor timestamps, and quality/latency trade-offs.
4. **Staff option:** technical strategy memo showing how several teams adopt a
   shared data/evaluation or model platform.

### Likely interview areas — inference

- General coding/data structures and algorithms.
- CV/ML foundations and a project/research deep dive.
- ML system design: data, labels, evaluation, deployment, monitoring, and cost.
- Role-specific mobile/XR, imaging, tracking, or large-scale Geo questions.
- Architecture and senior leadership stories.

No official source found guarantees these exact rounds.

### Google application checklist

- [ ] Job-specific top line: CV problem, production scale, and outcome.
- [ ] At least two quantified shipped-system bullets.
- [ ] Python/C++ and system design evidence, not a framework inventory.
- [ ] Metric includes workload and protected quality slice.
- [ ] One architecture decision and one failure/recovery story.
- [ ] Publication listed only if personal contribution is explainable.
- [ ] Live role re-verified and exact minimum qualifications satisfied.

### Official source URLs

- Eye Tracking Core:
  https://www.google.com/about/careers/applications/jobs/results/133121001712952006-senior-software-engineer-eye-tracking-core
- Staff Roads Data Quality, Geo:
  https://www.google.com/about/careers/applications/jobs/results/81147441402782406-staff-software-engineer-roads-data-quality-geo
- Senior AI/ML Computer Vision, Google Cloud snapshot:
  https://www.google.com/about/careers/applications/jobs/results/133462330280157894-senior-software-engineer-aiml-computer-vision-google-cloud
- Official Google technical-interview tips:
  https://blog.google/company-news/inside-google/life-at-google/google-engineer-shares-her-technical-interview-tips/

## Playbook B — NVIDIA Senior Perception / Vision ML Engineer

### Official facts from current 2026 role snapshots

The Senior Machine Learning Engineer, Perception — Autonomous Driving posting
includes:

- PhD plus four, MS plus six, or BS/equivalent plus eight years of relevant
  experience.
- Hands-on deep learning for complex real-world problems, PyTorch, Python/C++,
  and collaboration with data/ground-truth teams.
- End-to-end road/lane/static-world perception, data collection and labeling
  prioritization, simulation/augmentation, and product requirements for safety,
  latency, and software robustness.
- Technical leadership, camera-based AV/robotics perception, embedded real-time
  deployment, publications, transformers, and BEV are differentiators.

The Senior Perception Engineer, Obstacle Foundation Models posting adds:

- Architecture/roadmap ownership for multi-camera and multi-sensor 3D detection
  and tracking.
- CNN/transformer, multimodal and VLM techniques; large-scale pretraining,
  distillation, LoRA/PEFT, self-supervised learning, active learning, and
  auto-labeling where useful.
- KPI frameworks, real and synthetic data, systematic failure analysis, and
  latency/memory/compute constraints.
- CUDA kernels and GPU-accelerated training/inference as differentiators.

The Metropolis Vision AI snapshot adds production C++/Python on Linux,
concurrency/distributed systems, edge/cloud streaming, containers/microservices,
PyTorch deployment, CUDA/TensorRT, synthetic data, and mentoring.

NVIDIA's official hiring page states that candidates may have several 30-60
minute interviews and technical prospects may receive a coding exercise, often
via HackerRank, whiteboard, or provided laptop. Team-specific processes vary.

### Role interpretation — inference

NVIDIA vision roles split into overlapping profiles:

1. **Perception algorithm/ML:** strongest in 3D geometry, model/data/evaluation,
   robustness, and AV or robotics deployment.
2. **Vision systems/performance:** strongest in modern C++, Linux, concurrency,
   CUDA/TensorRT, profiling, and streaming/distributed services.
3. **Research-to-product:** publication-quality novelty plus an ability to ship
   reliable code and transfer ideas to products.

Choose one as the primary story and show credible breadth across the other two.

### Preparation priority

| Priority | Perception/ML | Systems/performance |
|---|---|---|
| Coding | Python/C++; clean data/model code | Modern C++, concurrency, memory, Linux debugging |
| CV | Calibration, multi-view geometry, BEV, detection/tracking, fusion | Pre/postprocessing, image/video/3D data paths |
| ML | PyTorch, losses, transformers, VLMs, data-centric iteration | Export, quantization, TensorRT, correctness parity |
| Evaluation | KPIs, ODD/slices, synthetic/real data, long-tail failures | Latency distributions, throughput, memory, load/soak |
| Hardware | Embedded constraints and model trade-offs | CUDA model, profiling, streams, kernels, CPU/GPU memory |
| Leadership | Roadmap and cross-functional data/safety decisions | Architecture reviews, reusable platform, mentoring |

### Portfolio packet

1. **3D/BEV perception project:** calibrated inputs, explicit coordinate frames,
   detection/tracking metrics, geography/weather/occlusion slices, and failure
   videos.
2. **Data engine:** collection/labeling priorities, synthetic augmentation,
   active-learning experiment, and KPI dashboard specification.
3. **GPU deployment report:** PyTorch/ONNX/TensorRT comparison, FP32 versus
   reduced precision, Nsight trace, before/after latency/throughput/memory, and
   correctness thresholds.
4. **Production wrapper:** bounded queues, concurrency, observability, degraded
   mode, and rollback.

### Likely interview areas — inference

- Coding in Python or C++, including data structures, debugging, and tests.
- Camera geometry, calibration, transforms, 3D detection/tracking, and fusion.
- CNN/transformer/BEV model trade-offs, losses, training failures, and metrics.
- Data and labeling strategy, simulation, long-tail failures, and KPI design.
- Real-time deployment, quantization, CUDA/TensorRT, profiling, and concurrency.
- Architecture, roadmap, cross-team communication, and research-to-product
  ownership.

Only the possibility of a coding exercise and general interview format are
officially confirmed; the technical topic list is inferred from role content.

### NVIDIA application checklist

- [ ] Choose perception/ML, systems/performance, or research-to-product as the
  primary fit.
- [ ] Quantify both quality and system performance on named hardware/workload.
- [ ] Show Python/C++ production evidence.
- [ ] Show a data/ground-truth/failure-analysis decision.
- [ ] Explain a latency, memory, precision, or safety trade-off.
- [ ] Provide profiling evidence if claiming CUDA/TensorRT expertise.
- [ ] Be ready to distinguish personal contribution from team outcome.
- [ ] Re-verify the exact role and application status.

### Official source URLs

- Senior ML Engineer, Perception — Autonomous Driving:
  https://jobs.nvidia.com/careers/job/893394160632
- Senior Perception Engineer, Obstacle Foundation Models:
  https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/Senior-Perception-Engineer--Obstacle-Foundation-Models---Autonomous-Vehicles_JR2014462
- Senior Software Engineer, Metropolis Vision AI:
  https://jobs.nvidia.com/careers/job/893392976047
- NVIDIA How We Hire:
  https://www.nvidia.com/en-eu/about-nvidia/careers/how-we-hire/

## Comparison and choice

| Question | Lean Google | Lean NVIDIA |
|---|---|---|
| Strongest evidence | Large-scale ML/data/system design or polished on-device product | GPU performance, 3D perception, embedded/real-time, or AV/robotics |
| Preferred technical identity | Versatile SWE with deep ML/CV specialization | Perception specialist or GPU-aware vision systems engineer |
| Best portfolio differentiator | End-to-end system with experiment rigor and organizational clarity | Reproducible profiling plus 3D/data/safety failure analysis |
| Common risk | Model-only resume without general SWE/system evidence | Research-only resume without production/performance evidence |

Score every target from 0-2 on each dimension:

- Minimum qualifications satisfied.
- Domain match.
- Production evidence match.
- Coding/language match.
- Leadership scope match.
- Location/work authorization match.
- Genuine motivation and a credible first-year contribution.

Apply first to roles scoring at least 10/14. A lower score may still be useful,
but state the gap honestly and do not spray unrelated openings.

## Evidence-backed bullet formula

Use:

> Owned **decision/system** for **workload and constraints**, changed
> **technical mechanism**, improved **quality/performance/reliability metric**
> from **baseline to result**, and coordinated **stakeholders or launch**.

Weak: “Optimized a computer vision model with TensorRT.”

Stronger: “Owned FP16 TensorRT deployment of a multi-camera detector on [named
hardware]; cut p95 end-to-end latency from X to Y ms at N streams while keeping
night/rain recall within Z points; added parity, load, and rollback gates with
platform and validation teams.”

Use real numbers only. Replace confidential values with approved ranges or
percentages and explain the measurement boundary.

## Re-verification checklist

Before each application:

1. Open the live official posting and record date, job ID, level, location, and
   minimum/preferred qualifications.
2. Mark every resume claim that maps to a requirement.
3. Remove stale technology assumptions not present in the target role.
4. Ask the recruiter which interview areas and coding environment are current.
5. Keep recruiter guidance separate from public, official source notes.

