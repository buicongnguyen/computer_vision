# Senior Computer Vision Engineer Preparation Lab

An applied, evidence-driven program for preparing for senior computer vision,
perception, and ML systems roles at companies such as Google, NVIDIA, and
42dot. The goal is not to collect notes. The goal is to produce the evidence a
senior hiring loop looks for: sound fundamentals, production-quality code,
measured trade-offs, system judgment, and clear technical leadership stories.

**Interactive course:** [CV Systems Lab](https://buicongnguyen.github.io/computer_vision/)

The site provides an organized theory-development flow, perception and
calibration lessons, camera-to-BEV methods, modern computer vision, 72 explained
MCQs, 30 coding exercises, progress tracking, and portfolio project gates.

## What you will build

- A reproducible 2D perception benchmark with slice-based error analysis.
- A real-time inference pipeline with latency, throughput, and memory evidence.
- A calibrated 3D multi-object tracking system with sensor-fusion experiments.
- An autonomy capstone with a design review, safety cases, and failure analysis.
- A portfolio packet: concise project pages, architecture diagrams, demo clips,
  engineering reports, resume bullets, and interview stories.

## Choose your emphasis

| Target | Emphasize | Portfolio signal |
|---|---|---|
| Google / Google DeepMind | ML depth, large-scale data/evaluation, clean coding, system design | Strong experiment design and a scalable vision system |
| NVIDIA | CUDA/TensorRT, GPU architecture, profiling, numerical precision, deployment | A measured optimization report with Nsight/TensorRT evidence |
| 42dot / autonomous driving | 3D geometry, tracking, camera-LiDAR-IMU fusion, SLAM, safety and closed-loop evaluation | A reproducible perception/tracking stack with scenario failures |

The common core is the same. Use the role-specific electives in weeks 17-20.

## Start here

1. Read [START_HERE.md](START_HERE.md).
2. Run the baseline assessment in [curriculum/00_diagnostic.md](curriculum/00_diagnostic.md).
3. Select a weekly time budget in [ROADMAP.md](ROADMAP.md).
4. Record the baseline in [progress/scorecard.md](progress/scorecard.md).
5. Begin the first lab and commit work in small, reviewable changes.

### Local setup (PowerShell)

```powershell
cd C:\Users\n\source\repos\computer_vision
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
python tools/check_env.py
pytest -q
```

The core exercises use NumPy and pytest. Install the optional stacks only when a
project needs them; see [SETUP.md](SETUP.md). This keeps the first day fast and
makes dependency choices explicit.

For a one-command Windows setup and validation, run:

```powershell
powershell -ExecutionPolicy Bypass -File tools\bootstrap.ps1
```

## Repository map

```text
curriculum/   Senior-level lessons, outcomes, drills, and assessments
docs/         Dependency-free interactive GitHub Pages course
labs/         Implement-from-scratch exercises plus reference implementations
projects/     Four portfolio projects with milestones and acceptance criteria
interview/    Coding, ML/CV, system design, behavioral, and mock-loop material
application/  Role selection, resume, portfolio, networking, and tracking tools
resources/    Official sources, papers, datasets, courses, and reading workflow
progress/     Scorecard, weekly log, and evidence ledger
tools/        Environment and repository validation scripts
tests/        Tests for the reference implementations
```

## Definition of “senior-ready”

You are ready to start serious applications when you can do all of the
following without hand-waving:

- Derive and implement core geometry, metrics, filtering, and optimization
  ideas, then explain their assumptions and failure modes.
- Turn a vague product objective into measurable offline and online criteria.
- Profile a pipeline and defend accuracy/latency/cost trade-offs with data.
- Design data, training, evaluation, deployment, monitoring, and rollback as one
  system rather than isolated model code.
- Lead a technical review, identify risks early, and communicate a decision to
  researchers, platform engineers, and product/safety partners.
- Solve representative coding problems in 35-45 minutes while narrating tests,
  complexity, and edge cases.

Use the rubric in [SKILL_MATRIX.md](SKILL_MATRIX.md) to make that judgment.

## Recommended cadence

The default program is 24 weeks at 15-20 focused hours per week. A working
engineer can use the 36-week schedule; an experienced CV engineer can use the
12-week compression rules. Do not compress by skipping artifacts or reviews.

Every week should produce at least one durable artifact: code, an experiment,
an engineering memo, a design document, a talk, or a mock-interview recording.

## Interactive course structure

The theory is taught as an evolving dependency chain:

```text
image physics → signal processing → geometric invariants → projective geometry
→ 3D and motion → statistical recognition → CNNs → transformers/foundation models
→ neural 3D → BEV/autonomous perception → production systems
```

Each module follows:

```text
problem → idea → assumptions → failure → improvement → modern production form
```

University course topic selection and attribution are documented in
[resources/university_course_sources.md](resources/university_course_sources.md).
All site explanations, MCQs, diagrams, labs, and solutions are original; active
university course assignments and solutions are not reproduced.

## GitHub Pages

The static site is served from `docs/` on the `main` branch:

- Repository: <https://github.com/buicongnguyen/computer_vision>
- Course: <https://buicongnguyen.github.io/computer_vision/>
- Local preview: `python -m http.server 8942 --directory docs`
- Site validation: `python tools/validate_site.py`

## Important note

Job descriptions and interview loops change. The role notes in this repository
are snapshots with source links and verification dates. Re-check a specific job
before applying, and never include confidential employer code or data in a
portfolio.
