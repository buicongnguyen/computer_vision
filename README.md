# Computer Vision Systems Study Lab

A structured, source-linked course for learning computer vision from image
formation to modern 3D perception and deployment. The material is organized as
a study guide: theory, visual reasoning flows, method comparisons, MCQs, coding
practice, and reproducible experiments.

**Interactive course:** [CV Systems Lab](https://buicongnguyen.github.io/computer_vision/)

The public course is subject-focused. It contains no personal profile, résumé,
skills self-assessment, or private information.

## What is included

- Theory development from camera physics and signals to geometry, learning,
  temporal fusion, and production systems.
- Perception, calibration, coordinate frames, BEV conversion, occupancy,
  tracking, and multi-sensor reasoning.
- Modern CNNs, transformers, self-supervision, diffusion, vision-language
  models, neural rendering, world models, and efficient inference.
- A detailed YOLO family tree that separates the original lineage,
  Ultralytics releases, and independent research branches.
- A current-topics lesson on LingBot-Map, monocular streaming reconstruction,
  3D detection, 3D Gaussian Splatting, and recent NVIDIA reconstruction work.
- 80 explained multiple-choice questions and 36 progressive coding exercises.
- Six applied projects with baselines, comparison gates, failure tests, and
  reproducibility requirements.
- Official university course references and primary research sources.

## How the material is organized

The theory follows a dependency chain:

```text
physical scene
  → sensing and image formation
  → signal processing and features
  → projective and multi-view geometry
  → estimation and uncertainty
  → learned representations
  → spatial and temporal fusion
  → deployment and validation
```

Every important method choice uses the same reasoning flow:

```text
required output
  → observability and sensors
  → accuracy / latency / memory constraints
  → viable method families
  → common operating point
  → failure-slice experiment
  → simplest method that passes
```

Each module asks:

1. What problem does the method solve?
2. What assumptions make the output observable?
3. Which alternatives exist, and what does each trade away?
4. Which metric actually tests the required behavior?
5. What counterexample would falsify the conclusion?

## Start here

1. Open the [interactive study guide](https://buicongnguyen.github.io/computer_vision/).
2. Read [START_HERE.md](START_HERE.md).
3. Follow the schedule in [ROADMAP.md](ROADMAP.md).
4. Use [curriculum/00_diagnostic.md](curriculum/00_diagnostic.md) as a baseline.
5. Work through MCQs, coding tasks, and one applied project per topic cluster.

## Local setup on Windows

```powershell
cd C:\Users\n\source\repos\computer_vision
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
python tools/check_env.py
pytest -q
```

For one-command setup and validation:

```powershell
powershell -ExecutionPolicy Bypass -File tools\bootstrap.ps1
```

The core exercises use NumPy and pytest. Optional stacks are installed only
when a project needs them; see [SETUP.md](SETUP.md).

## Repository map

```text
curriculum/   Lessons, derivations, drills, and assessments
docs/         Dependency-free interactive GitHub Pages course
labs/         Implement-from-scratch exercises and reference implementations
projects/     Applied perception and systems studies
resources/    Official courses, papers, datasets, and reading workflow
progress/     Optional local study log and scorecard
tools/        Environment and site validation scripts
tests/        Tests for implementations and site content
```

## Source and reuse policy

University course topic selection is documented in
[resources/university_course_sources.md](resources/university_course_sources.md).
The site links to official course pages and primary papers instead of copying
their slides, assignments, recordings, or solutions. Site explanations, MCQs,
diagrams, labs, and solution code are original unless a file states otherwise.

## GitHub Pages

The static site is served from `docs/` on the `main` branch:

- Repository: <https://github.com/buicongnguyen/computer_vision>
- Course: <https://buicongnguyen.github.io/computer_vision/>
- Local preview: `python -m http.server 8942 --directory docs`
- Site validation: `python tools/validate_site.py`
