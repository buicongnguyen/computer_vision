# Benchmark Report

## Claim and acceptance threshold

State one falsifiable claim and the correctness/quality tolerance that all
variants must pass before performance is compared.

## Reproduction environment

- Commit/config/data/model checksum:
- OS, CPU, RAM, GPU, driver, CUDA/cuDNN/TensorRT/runtime:
- Power/clock mode and competing workload:
- Build/compiler/package versions:

## Workload and method

- Input resolution/distribution, batch, streams/concurrency, sequence length:
- Warm-up, repetitions, synchronization and timed boundary:
- Cold versus steady state, preprocessing/postprocessing and transfers:
- Sampling/profiling tools and raw result location:

## Correctness and quality

| Variant | Numerical difference | Primary quality | Critical slices | Pass? |
|---|---:|---:|---:|---|

## Performance

| Variant | p50 | p95 | p99 | Throughput | Peak CPU/GPU memory | Power/cost |
|---|---:|---:|---:|---:|---:|---:|

Report units and uncertainty/variation. Do not use reciprocal p50 latency as
multi-stream throughput.

## Profile and explanation

Timeline before/after, ranked bottleneck, evidence for each change, regressions,
scaling across workload dimensions, and the new limiting component.

## Decision

Adopt/reject/test further, operating region, risks, monitoring, rollback, and
next experiment.

