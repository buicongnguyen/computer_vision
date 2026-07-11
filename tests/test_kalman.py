import numpy as np
import pytest

from labs.reference.kalman import ConstantVelocityKalman


def test_prediction_uses_velocity_and_grows_uncertainty() -> None:
    tracker = ConstantVelocityKalman(
        [0, 0], [1, -2], position_variance=1, velocity_variance=1
    )
    prior_trace = np.trace(tracker.covariance)
    state = tracker.predict(dt=0.5, acceleration_variance=2.0)
    np.testing.assert_allclose(state, [0.5, -1.0, 1.0, -2.0])
    assert np.trace(tracker.covariance) > prior_trace


def test_measurement_update_reduces_position_error_and_covariance() -> None:
    tracker = ConstantVelocityKalman([0, 0], position_variance=10)
    prior_error = np.linalg.norm(tracker.state[:2] - [2, 1])
    prior_trace = np.trace(tracker.covariance[:2, :2])
    state = tracker.update([2, 1], measurement_variance=0.5)
    assert np.linalg.norm(state[:2] - [2, 1]) < prior_error
    assert np.trace(tracker.covariance[:2, :2]) < prior_trace
    np.testing.assert_allclose(tracker.covariance, tracker.covariance.T)
    assert np.linalg.eigvalsh(tracker.covariance).min() >= -1e-12


def test_mahalanobis_distance_respects_measurement_uncertainty() -> None:
    tracker = ConstantVelocityKalman([0, 0], position_variance=1)
    tight = tracker.squared_mahalanobis([3, 0], measurement_variance=0.1)
    loose = tracker.squared_mahalanobis([3, 0], measurement_variance=10)
    assert tight > loose


def test_predict_rejects_nonpositive_dt() -> None:
    tracker = ConstantVelocityKalman([0, 0])
    with pytest.raises(ValueError, match="dt"):
        tracker.predict(0, 1)

