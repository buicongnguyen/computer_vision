import numpy as np
import pytest

from labs.reference.nms import non_maximum_suppression


def test_nms_suppresses_overlap_and_keeps_score_order() -> None:
    boxes = np.array(
        [[0, 0, 2, 2], [0.1, 0.1, 2.1, 2.1], [10, 10, 11, 11]],
        dtype=float,
    )
    scores = np.array([0.8, 0.9, 0.7])
    np.testing.assert_array_equal(
        non_maximum_suppression(boxes, scores, 0.5), [1, 2]
    )


def test_nms_ties_are_stable() -> None:
    boxes = np.array([[0, 0, 1, 1], [2, 2, 3, 3]], dtype=float)
    np.testing.assert_array_equal(
        non_maximum_suppression(boxes, [0.5, 0.5], 0.5), [0, 1]
    )


def test_nms_validates_threshold() -> None:
    with pytest.raises(ValueError, match="threshold"):
        non_maximum_suppression(np.empty((0, 4)), [], 1.1)

