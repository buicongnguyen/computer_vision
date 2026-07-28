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
- An autonomous-driving systems lesson with six responsive system graphs for
  the closed loop, sensor fusion, frame transforms, representation choice,
  SLAM, and prediction-to-control feedback, plus a visual reasoning companion
  with data-flow, code-trace, sequence, state-machine, logic-decision, and
  fault-propagation diagrams.
- 80 explained multiple-choice questions and 36 progressive coding exercises.
- Thirteen numbered course chapters plus a study hub, with 11 completion
  checkpoints that track progress through the core learning path.
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
npm ci --ignore-scripts
npx --no-install playwright install chromium
npm test
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

## Tests and GitHub Pages

The dependency-free site source lives in `docs/`. GitHub Pages receives that
directory through the gated workflow in `.github/workflows/pages.yml`; it is
not published directly from the branch before validation.

- Repository: <https://github.com/buicongnguyen/computer_vision>
- Course: <https://buicongnguyen.github.io/computer_vision/>
- Local preview: `python -m http.server 8942 --directory docs`
- Site validation: `python tools/validate_site.py`

The reader shell is generated by `docs/site.js` and styled in
`docs/styles.css`. It provides a fixed chapter index on wide screens, an
accessible chapter drawer on small screens, per-page outlines, previous/next
chapter links, persistent bookmarks, reading progress, and a persistent
dark/light theme. The lesson HTML remains dependency-free and readable without
the enhanced shell.

The reader contains 13 numbered chapters and the progress model exposes 11
completion checkpoints. Pull requests run the reusable `Course quality`
workflow, which:

- validates workflow syntax, site structure, local links, learning materials,
  JavaScript, 80 MCQs, and 36 coding tasks;
- runs the Python suite through both `pytest` and `python -m pytest`, then runs
  Ruff;
- installs the lockfile-pinned browser tooling and exercises the reader in a
  real Chromium browser at desktop and mobile sizes.

A push to `main` starts `Deploy GitHub Pages`. That workflow calls the same
quality gate against the exact pushed revision. Only after it succeeds does a
separate job package the exact `docs/` tree, including `.nojekyll`; deployment
starts only after that artifact is ready. This dependency chain prevents a
failed validation run from publishing a new site.
