# Project 02 — Real-Time Edge Vision Pipeline

## Mission

Build and optimize an end-to-end multi-stream detection/tracking pipeline under
an explicit latency, throughput, memory, power or cost constraint. This is the
strongest NVIDIA-oriented project when the performance work is measured well.

## Pipeline

```text
decode/capture -> color/resize/normalize -> inference -> decode/NMS -> tracking
-> overlay/event sink
```

Use bounded queues and name the overflow policy. Carry frame/event timestamps,
sequence ID, stream ID, model/config version and timing trace through all stages.

Possible implementations:

- Portable baseline: OpenCV + ONNX Runtime CPU/GPU.
- NVIDIA path: CUDA preprocessing, TensorRT engine, optional Triton/GStreamer.
- C++ path: RAII wrappers and a bounded concurrent pipeline.

## Milestones

### M1 — Correct synchronous baseline

- Small recorded input with legal provenance and expected outputs.
- Single-stream pipeline, golden preprocessing/postprocessing tests, complete
  end-to-end timing, and a simple baseline model.
- No performance claim before correctness equivalence is defined.

### M2 — Observability and load

- Per-stage traces, queue depth/drop count, CPU/GPU utilization and peak memory.
- Load generator across resolution, FPS, batch, streams and object density.
- Warm/cold p50/p95/p99 latency and actual completed-frame throughput.

### M3 — Bounded concurrent design

- Decode, inference and output stages with bounded queues/backpressure.
- Ordering and state rules for tracking; graceful end-of-stream/corrupt frame.
- Shutdown, timeout, resource cleanup and overload tests.

### M4 — Profile-driven optimization

Rank bottlenecks, then test at least three such as pinned/asynchronous transfer,
layout/vectorization, CUDA preprocessing, batching, graph/kernel fusion, FP16,
INT8, engine optimization profiles, zero-copy decode or C++ integration.

Make one change at a time and use `../BENCHMARK_REPORT_TEMPLATE.md`.

### M5 — Operational design

- Health metrics/SLOs, compatible artifact manifest, canary and rollback.
- Behavior for memory pressure, lost stream, corrupt input, GPU reset, model
  mismatch and slow downstream consumer.
- Demo and review on the exact profiled hardware.

## Acceptance criteria

- Golden tests bound numerical/model-output drift for every optimized variant.
- Report includes exact hardware/software, workload, warm-up, synchronization,
  p50/p95/p99, throughput, peak memory and relevant quality metrics.
- No unbounded queue and no silent frame drop.
- At least one optimization is explained by a before/after system or kernel
  profile, and the report identifies the new bottleneck.
- An automated CPU smoke test runs even if the full benchmark requires a GPU.

## Challenge experiments

- Batching improves throughput: find the latency/queueing breakpoint.
- INT8 preserves aggregate AP: identify worst-regressed class/slice.
- Inference is only 30% of end-to-end latency: optimize the actual critical path.
- One stream becomes slow/corrupt: prove isolation from other streams.
- Thermal or shared-load throttling: report steady-state rather than a short burst.

## Senior extensions

- Implement and profile a fused CUDA kernel with a correctness oracle.
- Compare TensorRT direct, Triton dynamic batching and ONNX Runtime under the
  same workload.
- Add power/energy-per-frame and cost-per-million-frame analysis.
- Cross-compile/deploy to an embedded NVIDIA target and analyze host differences.

