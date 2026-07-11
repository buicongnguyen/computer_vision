"""Compact, dependency-light detection metric references."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def _boxes(value: ArrayLike, name: str) -> NDArray[np.float64]:
    boxes = np.asarray(value, dtype=np.float64)
    if boxes.ndim != 2 or boxes.shape[1:] != (4,):
        raise ValueError(f"{name} must have shape (N, 4), got {boxes.shape}")
    if not np.all(np.isfinite(boxes)):
        raise ValueError(f"{name} must contain only finite values")
    if np.any(boxes[:, 2:] < boxes[:, :2]):
        raise ValueError(f"{name} contains a box with max < min")
    return boxes


def box_iou(boxes_a: ArrayLike, boxes_b: ArrayLike) -> NDArray[np.float64]:
    """Return pairwise IoU for continuous-coordinate xyxy boxes.

    Zero-area boxes are allowed and have zero IoU. Coordinates represent a
    continuous plane, so no pixel-inclusive ``+1`` convention is used.
    """
    a = _boxes(boxes_a, "boxes_a")
    b = _boxes(boxes_b, "boxes_b")

    top_left = np.maximum(a[:, None, :2], b[None, :, :2])
    bottom_right = np.minimum(a[:, None, 2:], b[None, :, 2:])
    intersection_wh = np.maximum(bottom_right - top_left, 0.0)
    intersection = intersection_wh[..., 0] * intersection_wh[..., 1]

    area_a = np.prod(a[:, 2:] - a[:, :2], axis=1)
    area_b = np.prod(b[:, 2:] - b[:, :2], axis=1)
    union = area_a[:, None] + area_b[None, :] - intersection
    return np.divide(
        intersection,
        union,
        out=np.zeros_like(intersection),
        where=union > 0,
    )


def average_precision(recall: ArrayLike, precision: ArrayLike) -> float:
    """Compute all-points interpolated area under a precision-recall curve.

    Inputs are operating points ordered by nondecreasing recall. Sentinel points
    at recall 0 and 1 are added, and precision is replaced by its right-to-left
    envelope before integration.
    """
    r = np.asarray(recall, dtype=np.float64)
    p = np.asarray(precision, dtype=np.float64)
    if r.ndim != 1 or p.ndim != 1 or r.shape != p.shape:
        raise ValueError("recall and precision must be same-length 1D arrays")
    if not np.all(np.isfinite(r)) or not np.all(np.isfinite(p)):
        raise ValueError("recall and precision must be finite")
    if np.any((r < 0) | (r > 1)) or np.any((p < 0) | (p > 1)):
        raise ValueError("recall and precision must lie in [0, 1]")
    if np.any(np.diff(r) < 0):
        raise ValueError("recall must be nondecreasing")
    if r.size == 0:
        return 0.0

    extended_r = np.concatenate(([0.0], r, [1.0]))
    extended_p = np.concatenate(([0.0], p, [0.0]))
    extended_p = np.maximum.accumulate(extended_p[::-1])[::-1]
    change = np.flatnonzero(extended_r[1:] != extended_r[:-1])
    return float(
        np.sum(
            (extended_r[change + 1] - extended_r[change])
            * extended_p[change + 1]
        )
    )

