"""Week 10 exercise: a two-dimensional constant-velocity Kalman filter."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


class ConstantVelocityKalman:
    """Track state [x, y, vx, vy] from noisy [x, y] measurements.

    Implement prediction with a white-acceleration process model and correction
    with the Joseph covariance update. Validate dt/noise values and explain how
    an association gate can be computed from innovation covariance.
    """

    def __init__(
        self,
        position: ArrayLike,
        velocity: ArrayLike = (0.0, 0.0),
        position_variance: float = 100.0,
        velocity_variance: float = 100.0,
    ) -> None:
        raise NotImplementedError("Initialize state and covariance")

    def predict(self, dt: float, acceleration_variance: float) -> NDArray[np.float64]:
        raise NotImplementedError("Implement prediction")

    def update(
        self, measurement_xy: ArrayLike, measurement_variance: float
    ) -> NDArray[np.float64]:
        raise NotImplementedError("Implement correction")

