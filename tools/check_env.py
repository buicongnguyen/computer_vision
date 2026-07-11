"""Print a concise environment report without modifying the machine."""

from __future__ import annotations

import importlib.util
import platform
import shutil
import sys

import numpy as np


def status(name: str, available: bool, detail: str = "") -> None:
    marker = "OK" if available else "--"
    suffix = f" ({detail})" if detail else ""
    print(f"[{marker:>2}] {name}{suffix}")


def main() -> int:
    print("Senior CV preparation environment")
    print(f"Python: {sys.version.split()[0]} at {sys.executable}")
    print(f"OS: {platform.platform()}")
    print(f"NumPy: {np.__version__}")
    status("Git", shutil.which("git") is not None, shutil.which("git") or "")
    for package in ("pytest", "cv2", "torch", "onnxruntime"):
        status(package, importlib.util.find_spec(package) is not None)

    if importlib.util.find_spec("torch") is not None:
        import torch

        status("CUDA visible to PyTorch", torch.cuda.is_available())
        if torch.cuda.is_available():
            print(f"GPU: {torch.cuda.get_device_name(0)}")
            print(f"PyTorch CUDA runtime: {torch.version.cuda}")

    compatible = sys.version_info >= (3, 10)
    status("Python >= 3.10", compatible)
    print("\nOptional packages marked -- are needed only in later modules.")
    return 0 if compatible else 1


if __name__ == "__main__":
    raise SystemExit(main())

