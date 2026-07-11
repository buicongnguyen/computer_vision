"""Helpers that make latency reports less misleading."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike


def latency_statistics_ms(samples_seconds: ArrayLike) -> dict[str, float]:
    """Summarize positive end-to-end latency samples.

    Throughput is reported as completed samples divided by total measured time;
    it is not the reciprocal of a percentile.
    """
    samples = np.asarray(samples_seconds, dtype=np.float64)
    if samples.ndim != 1 or samples.size == 0:
        raise ValueError("samples_seconds must be a nonempty 1D array")
    if not np.all(np.isfinite(samples)) or np.any(samples <= 0):
        raise ValueError("latency samples must be finite and positive")
    milliseconds = samples * 1000.0
    return {
        "count": float(samples.size),
        "mean_ms": float(np.mean(milliseconds)),
        "p50_ms": float(np.percentile(milliseconds, 50)),
        "p95_ms": float(np.percentile(milliseconds, 95)),
        "p99_ms": float(np.percentile(milliseconds, 99)),
        "throughput_per_second": float(samples.size / np.sum(samples)),
    }

