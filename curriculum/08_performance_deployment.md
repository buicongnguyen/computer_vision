# Performance and Deployment for Senior Vision Engineers

Verification date: **2026-07-11**

This module turns a working vision model into a measured, reproducible, and
operable system. It supports weeks 15 and 17-20 of the roadmap. Complete the
common labs first, then choose the Google/XR or NVIDIA/GPU extension.

## Evidence boundary

### Official role evidence

- Google's current Senior Software Engineer, Eye Tracking Core posting asks for
  robust, reliable, efficient, testable software on compute-constrained Android
  devices running high-frame-rate, high-bandwidth perception pipelines.
- Google's Senior AI/ML Computer Vision and Staff Geo postings emphasize model
  deployment, evaluation, optimization, data processing, debugging, production
  launches, architecture, multi-source sensor data, and technical leadership.
- NVIDIA's 2026 senior perception postings require productization against
  safety, latency, resource, and software-robustness constraints. Embedded
  real-time deployment and CUDA optimization are explicit differentiators.
- NVIDIA's Metropolis Vision AI posting emphasizes streaming image/video/3D
  pipelines, distributed edge/cloud services, GPU profiling, CUDA/TensorRT,
  concurrent systems, simulation, and synthetic data.
- NVIDIA's official hiring page says technical candidates may receive a coding
  exercise. It does not publish a performance-engineering question bank.

See [official_sources.md](../resources/official_sources.md) for URLs and exact
role snapshots.

### Preparation inference

The lab sequence and likely interview prompts below are **inferences** from the
repeated responsibilities above. Neither company guarantees these exact tasks
or interview questions. They are chosen because they produce the kind of
evidence the official roles request.

## Outcomes

By the end of this module, you should be able to:

1. Define a quality, latency, throughput, memory, and reliability contract.
2. Build a trustworthy baseline before optimizing.
3. Separate model, transfer, preprocessing, inference, and postprocessing cost.
4. Export a model and prove numerical and task-level parity.
5. Profile first, form a bottleneck hypothesis, change one variable, and
   remeasure.
6. Explain batching, concurrency, precision, fusion, memory layout, and hardware
   utilization trade-offs.
7. Design deployment, observability, degradation, canary, and rollback paths.
8. Present the result as a senior-level decision memo rather than a speedup
   screenshot.

## Prerequisites

- A trained image classifier, detector, segmenter, or tracker with a fixed
  evaluation set.
- Python tests and a reproducible environment.
- Familiarity with precision/recall or task-specific quality metrics.
- For the NVIDIA extension: an NVIDIA GPU, CUDA-capable framework, and permission
  to install TensorRT/Nsight. The common path remains valid on CPU.

## The performance contract

Write this contract before opening a profiler.

| Dimension | Required definition | Example only |
|---|---|---|
| Task quality | Metric, slices, allowed regression | mAP drop no more than 0.5 points overall and 1 point on any safety-critical slice |
| Latency | Boundary and percentiles | Camera frame received to published detections; p50/p95/p99 |
| Throughput | Unit and concurrency | Frames/second at 1, 4, and 8 streams |
| Memory | Host/device peak and steady state | Peak GPU memory plus 30-minute steady-state growth |
| Reliability | Failure and recovery behavior | No crash on corrupt frame; bounded queue; timeout and fallback |
| Cost/power | Relevant operating constraint | GPU-seconds per 1,000 frames or watts on target hardware |
| Reproducibility | Hardware/software controls | Device, driver, runtime, model hash, data hash, warm-up policy |

Do not claim “real time” without a deadline, workload, hardware, percentile, and
quality threshold.

## Measurement rules

- Synchronize asynchronous device work before timing it.
- Separate cold start, warm-up, and steady state.
- Report distributions, not only an average.
- Measure end to end and per stage.
- Keep input shapes, precision, concurrency, power/clock conditions, and data
  fixed when comparing variants.
- Include preprocessing, transfers, postprocessing, serialization, and queues
  when they are inside the product boundary.
- Validate every optimization against the quality contract.
- Record negative results. A rejected optimization is useful evidence when its
  trade-off is quantified.

## Lab 1 — Build a trustworthy benchmark

**Goal:** establish a baseline that another engineer can reproduce.

### Tasks

1. Select 200-2,000 representative inputs and define at least four slices such
   as resolution, object size, lighting, motion, geography, or occlusion.
2. Record hardware, OS, driver, framework/runtime versions, model hash, input
   hash, batch size, precision, warm-up count, and measurement count.
3. Measure cold-start latency, steady-state p50/p95/p99, throughput, host memory,
   device memory, and task quality.
4. Decompose the end-to-end path into load/decode, preprocess, host-to-device,
   inference, device-to-host, postprocess, and output.
5. Repeat the run three times and report variability.

### Required artifact

- `benchmark_contract.md`
- Machine-readable raw timings.
- A one-page baseline report containing a stage breakdown and slice quality.
- One command that reproduces the run.

### Checkpoint A

Pass only when a reviewer can answer: “What exactly was timed, on which system,
under which load, and how variable was it?”

## Lab 2 — Export and prove parity

**Goal:** move from the training framework to a deployment representation
without silently changing behavior.

### Tasks

1. Export the model through the path relevant to your target, for example
   PyTorch to ONNX, then ONNX Runtime or TensorRT.
2. Test minimum, typical, and maximum supported shapes. Decide whether shapes
   are static, bounded dynamic, or fully dynamic.
3. Compare intermediate or final tensors using absolute/relative tolerances.
4. Compare task-level predictions and aggregate quality on the fixed set.
5. Test malformed input, empty detections, maximum detections, and unsupported
   shapes.
6. Record unsupported operators, graph rewrites, custom plugins, and fallback
   behavior.

### Required artifact

- Automated parity test.
- Export manifest with model/runtime versions and shape/precision contract.
- Short failure note for every manual graph rewrite or plugin.

### Gate

No performance result is valid until parity passes. If lower precision changes
quality, report it as a trade-off rather than relaxing the test after the fact.

## Lab 3 — Profile and form a bottleneck hypothesis

**Goal:** explain where time and memory go before changing the system.

### Tasks

1. Capture a CPU/framework trace. On NVIDIA hardware, also capture an Nsight
   Systems timeline or equivalent GPU trace.
2. Identify synchronization gaps, host stalls, copies, allocator activity,
   serialization, small kernels, and expensive operators.
3. Distinguish compute-bound, memory-bandwidth-bound, launch-bound, I/O-bound,
   and queueing-bound behavior.
4. Write three ranked hypotheses. Each must predict which metric will change and
   what counter-evidence would disprove it.
5. Select one hypothesis for the next lab.

### Required artifact

- Annotated trace screenshot or exported report.
- Bottleneck table: evidence, hypothesis, proposed change, risk, predicted gain.

### Checkpoint B

Give a ten-minute review without saying “the GPU is slow.” Name the stage,
resource, evidence, and expected effect.

## Lab 4 — Optimize with a quality budget

**Goal:** make measured changes and show why the bottleneck moved.

Choose at least three changes, one from three different groups:

| Group | Candidate changes |
|---|---|
| Workload | Resize/crop policy, batch size, bounded dynamic shapes, frame skipping with explicit semantics |
| Graph/runtime | Operator or layer fusion, constant folding, TensorRT engine, CUDA Graphs, compiled execution |
| Precision | FP16/BF16, TF32 where appropriate, calibrated INT8, quantization-aware training |
| Memory/data path | Pinned buffers, buffer reuse, layout changes, fewer copies, asynchronous decode/transfer |
| Concurrency | Pipeline stages, streams, worker count, backpressure, micro-batching |
| Algorithm | Cheaper backbone/head, proposal limits, NMS/top-k changes, distillation |

For each change:

1. State the hypothesis and quality risk.
2. Change one primary variable.
3. Run the same benchmark three times.
4. Re-run parity and slice quality.
5. Explain whether the bottleneck moved.

### Required artifact

| Variant | Quality | p50 | p95 | p99 | Throughput | Peak memory | Decision |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline | | | | | | | |
| Variant A | | | | | | | |
| Variant B | | | | | | | |
| Final | | | | | | | |

Report both absolute results and percentage change. Keep unsuccessful variants.

## Lab 5 — Build an operable inference component

**Goal:** show that the optimized model can live inside a product.

### Tasks

- Expose a versioned CLI, library boundary, or service endpoint.
- Add startup/readiness and liveness checks.
- Bound request/frame size, queue depth, batch delay, and memory growth.
- Implement timeouts, cancellation, backpressure, and malformed-input handling.
- Emit request count, error count, queue time, stage latency, quality proxy,
  model version, runtime version, and resource usage.
- Add deterministic replay for a captured request or frame sequence.
- Define degraded behavior: smaller model, heuristic fallback, dropped frame, or
  safe unavailable response. Explain product implications.
- Add integration, load, soak, and restart tests.

### Required artifact

- Deployment diagram.
- SLO and error-budget table.
- Load/soak test report.
- Operator runbook with failure detection and first actions.

## Lab 6 — Canary, drift, and rollback exercise

**Goal:** make model replacement safe and observable.

### Scenario

A new engine is 28% faster overall, but p99 latency rises on large images and
recall falls at night. Design the response.

### Tasks

1. Define offline acceptance gates and protected slices.
2. Define shadow/canary population, duration, success metrics, and stop rules.
3. Separate data-quality drift, concept drift, service regression, and sensor or
   upstream changes.
4. Define artifact versioning and one-action rollback.
5. Write a five-whys postmortem for a failed launch.

### Checkpoint C

Run a 30-minute design review. One reviewer plays product/safety and another
plays infrastructure. Pass only if the rollback and degraded mode are concrete.

## Google/XR extension

**Official signal:** current Google XR perception work explicitly targets
compute-constrained Android devices at high frame rate and bandwidth.

**Preparation inference:** a useful portfolio simulation is a 30/60/90 FPS
camera pipeline with a strict device budget.

1. Create a frame-time budget including sensor arrival, conversion, inference,
   postprocessing, and consumer handoff.
2. Test variable resolution, thermal throttling simulation, frame bursts, and a
   slow downstream consumer.
3. Compare an ML method with a heuristic or hybrid path.
4. Write an architecture decision record for accuracy versus power/latency.
5. Demonstrate bounded queues and timestamp preservation.

**Pass evidence:** stable p99 within the selected frame deadline, bounded memory,
slice quality, and a design memo suitable for cross-team review.

## NVIDIA/GPU extension

**Official signal:** current NVIDIA roles repeatedly name CUDA, TensorRT,
embedded/real-time deployment, profiling, mixed resource constraints, and
production C++/Python.

**Preparation inference:** a custom CUDA kernel is not mandatory for every role,
but being able to decide when one is justified is strong evidence.

1. Use TensorRT's measure-then-optimize workflow and `trtexec` or equivalent.
2. Compare FP32 with at least one reduced-precision path and validate accuracy.
3. Inspect layer fusion, Tensor Core eligibility, transfers, and stream usage.
4. Optimize one pre/postprocessing operation. Compare library, framework, and
   custom-kernel implementations if hardware permits.
5. Explain occupancy, memory coalescing, divergence, launch overhead, and the
   roofline limit relevant to the measured kernel.
6. Re-run end-to-end profiling: a faster kernel that does not improve the
   product boundary is not a product win.

**Pass evidence:** before/after traces, reproducible commands, correctness tests,
quality results, and a written explanation of the new bottleneck.

## Senior review rubric

| Dimension | Not ready | Independent | Senior-ready |
|---|---|---|---|
| Benchmark | Single average, unclear boundary | Reproducible percentiles | Controlled variability, slices, end-to-end and stage evidence |
| Correctness | Visual spot check | Automated output parity | Numeric, task, slice, and degraded-path validation |
| Profiling | Optimization by intuition | Identifies expensive stages | Tests ranked hypotheses and explains resource limits |
| Optimization | Reports a speedup | Reports speed/quality/memory | Defends rejected options and moved bottleneck |
| Deployment | Demo script | Service/CLI with tests | SLOs, load/soak, backpressure, observability, rollback |
| Leadership | Describes personal code | Explains design | Leads trade-off review across ML, platform, and product/safety |

## Likely interview drills — inferred

- Design a video perception service for millions of streams with bounded cost.
- Fit a detector into a 16 ms frame budget without violating recall targets.
- Diagnose why GPU utilization is low while latency is high.
- Explain an FP16/INT8 quality regression and how you would isolate it.
- Design model/version/data observability and rollback.
- Decide between a larger batch, more concurrent streams, and lower precision.
- Review a proposed custom CUDA kernel: when is it justified, and how is it
  validated?
- Tell a story where an optimization failed or moved the bottleneck.

## Completion checklist

- [ ] Performance contract and fixed dataset/slices.
- [ ] Reproducible baseline with distributions and stage breakdown.
- [ ] Automated export/parity checks.
- [ ] Annotated profile and ranked bottleneck hypotheses.
- [ ] At least three controlled optimization experiments.
- [ ] End-to-end result with quality, latency, throughput, and memory.
- [ ] Operable component with metrics, bounds, failure handling, and tests.
- [ ] Canary/rollback plan and incident exercise.
- [ ] Google/XR or NVIDIA/GPU extension.
- [ ] Thirty-minute senior design review recording and reviewer notes.

## Primary documentation

- Google Rules of ML: https://developers.google.com/machine-learning/guides/rules-of-ml
- Google production ML systems:
  https://developers.google.com/machine-learning/crash-course/production-ml-systems
- NVIDIA CUDA Programming Guide:
  https://docs.nvidia.com/cuda/cuda-programming-guide/
- NVIDIA TensorRT performance workflow:
  https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/best-practices.html
- NVIDIA TensorRT benchmarking:
  https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/benchmarking.html
- NVIDIA DeepStream SDK:
  https://docs.nvidia.com/metropolis/deepstream/dev-guide/

