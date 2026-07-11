"""Constant-velocity Kalman filter used by the tracking exercise."""

from __future__ import annotations

import numpy as np
from numpy.typing import ArrayLike, NDArray


def _vector2(value: ArrayLike, name: str) -> NDArray[np.float64]:
    vector = np.asarray(value, dtype=np.float64)
    if vector.shape != (2,) or not np.all(np.isfinite(vector)):
        raise ValueError(f"{name} must be a finite vector of shape (2,)")
    return vector


class ConstantVelocityKalman:
    """Track [x, y, vx, vy] with a white-acceleration process model."""

    def __init__(
        self,
        position: ArrayLike,
        velocity: ArrayLike = (0.0, 0.0),
        position_variance: float = 100.0,
        velocity_variance: float = 100.0,
    ) -> None:
        position_v = _vector2(position, "position")
        velocity_v = _vector2(velocity, "velocity")
        if position_variance < 0 or velocity_variance < 0:
            raise ValueError("initial variances must be nonnegative")
        self.state = np.concatenate((position_v, velocity_v))
        self.covariance = np.diag(
            [position_variance, position_variance, velocity_variance, velocity_variance]
        ).astype(np.float64)

    def predict(self, dt: float, acceleration_variance: float) -> NDArray[np.float64]:
        if not np.isfinite(dt) or dt <= 0:
            raise ValueError("dt must be finite and positive")
        if not np.isfinite(acceleration_variance) or acceleration_variance < 0:
            raise ValueError("acceleration_variance must be finite and nonnegative")
        transition = np.array(
            [
                [1.0, 0.0, dt, 0.0],
                [0.0, 1.0, 0.0, dt],
                [0.0, 0.0, 1.0, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ]
        )
        noise_map = np.array(
            [
                [0.5 * dt * dt, 0.0],
                [0.0, 0.5 * dt * dt],
                [dt, 0.0],
                [0.0, dt],
            ]
        )
        process_noise = acceleration_variance * noise_map @ noise_map.T
        self.state = transition @ self.state
        self.covariance = (
            transition @ self.covariance @ transition.T + process_noise
        )
        return self.state.copy()

    def innovation(
        self, measurement_xy: ArrayLike, measurement_variance: float
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        measurement = _vector2(measurement_xy, "measurement_xy")
        if not np.isfinite(measurement_variance) or measurement_variance <= 0:
            raise ValueError("measurement_variance must be finite and positive")
        observation = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])
        residual = measurement - observation @ self.state
        innovation_covariance = (
            observation @ self.covariance @ observation.T
            + measurement_variance * np.eye(2)
        )
        return residual, innovation_covariance

    def update(
        self, measurement_xy: ArrayLike, measurement_variance: float
    ) -> NDArray[np.float64]:
        residual, innovation_covariance = self.innovation(
            measurement_xy, measurement_variance
        )
        observation = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])
        # solve(S, H P).T avoids explicitly forming inv(S)
        gain = np.linalg.solve(
            innovation_covariance, observation @ self.covariance
        ).T
        self.state = self.state + gain @ residual
        identity = np.eye(4)
        residual_map = identity - gain @ observation
        measurement_noise = measurement_variance * np.eye(2)
        self.covariance = (
            residual_map @ self.covariance @ residual_map.T
            + gain @ measurement_noise @ gain.T
        )
        self.covariance = 0.5 * (self.covariance + self.covariance.T)
        return self.state.copy()

    def squared_mahalanobis(
        self, measurement_xy: ArrayLike, measurement_variance: float
    ) -> float:
        """Return innovation distance useful for probabilistic association gates."""
        residual, innovation_covariance = self.innovation(
            measurement_xy, measurement_variance
        )
        return float(residual @ np.linalg.solve(innovation_covariance, residual))

