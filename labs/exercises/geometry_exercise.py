"""Weeks 3-4 exercise: normalized DLT homography estimation."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def estimate_homography_dlt(
    source_xy: ArrayLike, destination_xy: ArrayLike
) -> NDArray[np.float64]:
    """Estimate H such that destination ~= H @ source.

    Requirements:
    - Accept N >= 4 two-dimensional correspondences.
    - Normalize both point sets before constructing the DLT matrix.
    - Reject non-finite, duplicate/degenerate, or mismatched inputs.
    - Return a 3x3 matrix with a deterministic scale convention.
    """
    raise NotImplementedError("Implement normalized DLT")


def project_points(homography: ArrayLike, points_xy: ArrayLike) -> NDArray[np.float64]:
    """Apply a homography and divide by homogeneous scale safely."""
    raise NotImplementedError("Implement homogeneous projection")

