"""Reference hard non-maximum suppression."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray

from .metrics import _boxes, box_iou


def non_maximum_suppression(
    boxes: ArrayLike, scores: ArrayLike, iou_threshold: float
) -> NDArray[np.int64]:
    """Return kept indices in descending score order.

    Score ties preserve input order. Boxes with IoU strictly greater than the
    threshold are suppressed, which makes the boundary behavior explicit.
    """
    parsed_boxes = _boxes(boxes, "boxes")
    parsed_scores = np.asarray(scores, dtype=np.float64)
    if parsed_scores.shape != (len(parsed_boxes),):
        raise ValueError("scores must have shape (N,)")
    if not np.all(np.isfinite(parsed_scores)):
        raise ValueError("scores must be finite")
    if not np.isfinite(iou_threshold) or not 0 <= iou_threshold <= 1:
        raise ValueError("iou_threshold must lie in [0, 1]")

    order = np.argsort(-parsed_scores, kind="stable")
    keep: list[int] = []
    while order.size:
        current = int(order[0])
        keep.append(current)
        remaining = order[1:]
        if remaining.size == 0:
            break
        overlaps = box_iou(parsed_boxes[[current]], parsed_boxes[remaining])[0]
        order = remaining[overlaps <= iou_threshold]
    return np.asarray(keep, dtype=np.int64)

