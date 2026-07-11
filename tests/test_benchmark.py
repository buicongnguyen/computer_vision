import pytest

from labs.reference.benchmark import latency_statistics_ms


def test_latency_statistics_report_percentiles_and_throughput() -> None:
    stats = latency_statistics_ms([0.001, 0.002, 0.003])
    assert stats["count"] == 3
    assert stats["mean_ms"] == pytest.approx(2.0)
    assert stats["p50_ms"] == pytest.approx(2.0)
    assert stats["throughput_per_second"] == pytest.approx(500.0)


def test_latency_statistics_rejects_empty_or_zero_samples() -> None:
    with pytest.raises(ValueError):
        latency_statistics_ms([])
    with pytest.raises(ValueError):
        latency_statistics_ms([0.0])

