"""Small projective-geometry reference implementations."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def _points(value: ArrayLike, name: str, minimum: int = 0) -> NDArray[np.float64]:
    points = np.asarray(value, dtype=np.float64)
    if points.ndim != 2 or points.shape[1:] != (2,):
        raise ValueError(f"{name} must have shape (N, 2), got {points.shape}")
    if len(points) < minimum:
        raise ValueError(f"{name} requires at least {minimum} points")
    if not np.all(np.isfinite(points)):
        raise ValueError(f"{name} must contain only finite values")
    return points


def _normalize_points(
    points: NDArray[np.float64],
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    centroid = np.mean(points, axis=0)
    centered = points - centroid
    mean_distance = float(np.mean(np.linalg.norm(centered, axis=1)))
    if mean_distance <= np.finfo(np.float64).eps:
        raise ValueError("point configuration has no spatial extent")
    scale = np.sqrt(2.0) / mean_distance
    transform = np.array(
        [
            [scale, 0.0, -scale * centroid[0]],
            [0.0, scale, -scale * centroid[1]],
            [0.0, 0.0, 1.0],
        ]
    )
    homogeneous = np.column_stack((points, np.ones(len(points))))
    normalized = (transform @ homogeneous.T).T[:, :2]
    return normalized, transform


def estimate_homography_dlt(
    source_xy: ArrayLike, destination_xy: ArrayLike
) -> NDArray[np.float64]:
    """Estimate a homography using normalized direct linear transformation."""
    source = _points(source_xy, "source_xy", minimum=4)
    destination = _points(destination_xy, "destination_xy", minimum=4)
    if source.shape != destination.shape:
        raise ValueError("source and destination must have the same shape")

    source_n, source_transform = _normalize_points(source)
    destination_n, destination_transform = _normalize_points(destination)
    x, y = source_n.T
    u, v = destination_n.T
    zeros = np.zeros_like(x)
    ones = np.ones_like(x)
    rows_u = np.column_stack((-x, -y, -ones, zeros, zeros, zeros, u * x, u * y, u))
    rows_v = np.column_stack((zeros, zeros, zeros, -x, -y, -ones, v * x, v * y, v))
    design = np.empty((2 * len(source), 9), dtype=np.float64)
    design[0::2] = rows_u
    design[1::2] = rows_v

    if np.linalg.matrix_rank(design) < 8:
        raise ValueError("correspondences are degenerate for homography estimation")
    _, _, vh = np.linalg.svd(design, full_matrices=True)
    normalized_h = vh[-1].reshape(3, 3)
    homography = (
        np.linalg.inv(destination_transform)
        @ normalized_h
        @ source_transform
    )
    scale = homography[2, 2]
    if abs(scale) > np.finfo(np.float64).eps:
        homography = homography / scale
    else:
        homography = homography / np.linalg.norm(homography)
    return homography


def project_points(homography: ArrayLike, points_xy: ArrayLike) -> NDArray[np.float64]:
    """Apply a 3x3 homography to 2D points."""
    h = np.asarray(homography, dtype=np.float64)
    points = _points(points_xy, "points_xy")
    if h.shape != (3, 3) or not np.all(np.isfinite(h)):
        raise ValueError("homography must be a finite 3x3 array")
    homogeneous = np.column_stack((points, np.ones(len(points))))
    projected = (h @ homogeneous.T).T
    denominator = projected[:, 2]
    if np.any(np.abs(denominator) <= np.finfo(np.float64).eps):
        raise ValueError("a projected point lies at infinity")
    return projected[:, :2] / denominator[:, None]

