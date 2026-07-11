# Environment Setup

## Supported baseline

- Windows 11 or Linux
- Python 3.10-3.12
- Git
- NVIDIA GPU optional for weeks 1-12; strongly recommended for the NVIDIA track

The repository deliberately starts with a small NumPy environment. Large GPU
packages should match your driver, CUDA toolkit, and project deployment target.

## Core environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
python tools/check_env.py
pytest -q
```

Linux activation uses `source .venv/bin/activate`.

## Optional computer-vision stack

```powershell
pip install -e ".[vision]"
```

This adds OpenCV, Pillow, Matplotlib, pandas, and scikit-learn. For PyTorch,
TensorRT, CUDA, ONNX Runtime GPU, and NVIDIA profiling tools, follow the official
compatibility instructions linked from `resources/official_sources.md`. Avoid a
blind `pip install` because driver and runtime compatibility matters.

## Reproducibility checklist

- Record OS, Python, package lock or exported environment, GPU model, driver,
  CUDA/cuDNN/TensorRT versions, and random seeds.
- Keep raw data immutable and identify each dataset/model artifact by version or
  checksum.
- Separate configuration from code and save the exact evaluation command.
- Run warm-up iterations before performance measurements; report p50, p95, and
  p99 as well as throughput.
- Add a CPU smoke test even when the full model needs a GPU.

## Suggested project tooling

These are choices to evaluate, not mandatory dependencies:

- Training: PyTorch, Lightning only if its abstraction helps the project.
- Configuration: plain dataclasses or Hydra for genuinely multi-run projects.
- Tracking: MLflow or Weights & Biases; keep a portable local summary.
- Data/versioning: DVC, lakeFS, or immutable object-store paths.
- Serving: Triton Inference Server, ONNX Runtime, TensorRT, or a minimal service.
- Quality: ruff, mypy/pyright, pytest, pre-commit, and CI.
- Profiling: Python profiler, PyTorch profiler, Nsight Systems, Nsight Compute.

Choose tools after writing the operational requirement. Senior judgment includes
knowing when a simple script is the more reliable system.

