import numpy as np
import pytest

from labs.reference.geometry import estimate_homography_dlt, project_points


def test_dlt_recovers_projective_mapping() -> None:
    source = np.array(
        [[0, 0], [2, 0], [2, 1], [0, 1], [0.5, 0.25], [1.5, 0.75]],
        dtype=float,
    )
    expected_h = np.array(
        [[1.2, 0.2, 3.0], [-0.1, 0.9, 2.0], [0.01, -0.02, 1.0]]
    )
    destination = project_points(expected_h, source)
    estimated_h = estimate_homography_dlt(source, destination)
    np.testing.assert_allclose(
        project_points(estimated_h, source), destination, atol=1e-9
    )


def test_dlt_rejects_collinear_correspondences() -> None:
    points = np.array([[0, 0], [1, 0], [2, 0], [3, 0]], dtype=float)
    with pytest.raises(ValueError, match="degenerate"):
        estimate_homography_dlt(points, points)


def test_projection_rejects_point_at_infinity() -> None:
    h = np.diag([1.0, 1.0, 0.0])
    with pytest.raises(ValueError, match="infinity"):
        project_points(h, [[1, 2]])

