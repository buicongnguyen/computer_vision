import numpy as np
import pytest

from labs.reference.metrics import average_precision, box_iou


def test_box_iou_known_values_and_symmetry() -> None:
    boxes_a = np.array([[0, 0, 2, 2], [0, 0, 0, 1]], dtype=float)
    boxes_b = np.array([[1, 1, 3, 3], [0, 0, 2, 2]], dtype=float)
    actual = box_iou(boxes_a, boxes_b)
    expected = np.array([[1 / 7, 1.0], [0.0, 0.0]])
    np.testing.assert_allclose(actual, expected)
    np.testing.assert_allclose(actual, box_iou(boxes_b, boxes_a).T)


def test_box_iou_supports_empty_inputs() -> None:
    actual = box_iou(np.empty((0, 4)), np.ones((2, 4)))
    assert actual.shape == (0, 2)


def test_box_iou_rejects_inverted_boxes() -> None:
    with pytest.raises(ValueError, match="max < min"):
        box_iou([[2, 0, 1, 1]], [[0, 0, 1, 1]])


def test_average_precision_uses_precision_envelope() -> None:
    assert average_precision([0.5, 1.0], [1.0, 0.5]) == pytest.approx(0.75)
    assert average_precision([], []) == 0.0


def test_average_precision_rejects_decreasing_recall() -> None:
    with pytest.raises(ValueError, match="nondecreasing"):
        average_precision([0.8, 0.4], [0.5, 0.5])

