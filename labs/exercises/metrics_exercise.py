"""Week 6 exercise: detection metrics.

Implement these functions without reading ``labs.reference.metrics`` first.
Write tests before implementation. Decide and document how invalid boxes,
empty inputs, and tied scores are handled.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def box_iou(boxes_a: ArrayLike, boxes_b: ArrayLike) -> NDArray[np.float64]:
    """Return pairwise IoU for two ``(N, 4)`` arrays of ``x1,y1,x2,y2`` boxes."""
    raise NotImplementedError("Implement pairwise IoU and its validation")


def average_precision(recall: ArrayLike, precision: ArrayLike) -> float:
    """Integrate an interpolated precision-recall curve on recall in [0, 1]."""
    raise NotImplementedError("Implement all-points interpolated AP")

