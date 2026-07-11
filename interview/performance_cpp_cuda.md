# C++, GPU, and Performance Interview Track

This track is especially important for NVIDIA and performance-sensitive
perception roles. Answers should connect hardware behavior to a measurement,
not stop at vocabulary.

## C++ oral questions

1. Explain RAII and how it changes error paths in a camera/GPU pipeline.
2. When do copy and move constructors run? What does “moved-from” guarantee?
3. `unique_ptr`, `shared_ptr`, reference, or value: how do you choose?
4. What invalidates iterators/references in common standard containers?
5. Why can `shared_ptr` be a performance or ownership smell?
6. Explain object lifetime in asynchronous work and a use-after-free failure.
7. Mutex, atomic, lock-free queue: which problem does each solve?
8. What are false sharing, cache locality, alignment, and structure-of-arrays?
9. How would you make a C++ inference wrapper exception-safe?
10. How do ABI, compiler flags, and dependency versions break deployment?

## GPU/CUDA oral questions

1. Describe grid, block, warp, thread, and SIMT execution.
2. What hides memory latency, and what limits occupancy?
3. Coalesced global access versus shared-memory bank conflicts?
4. When does branch divergence matter?
5. What requires synchronization? Why is timing asynchronous work tricky?
6. Pinned memory, unified memory, device memory: trade-offs?
7. How do streams overlap transfers and compute, and what dependencies stop it?
8. Arithmetic intensity and roofline: memory-bound or compute-bound?
9. How do registers, shared memory, and block size interact with occupancy?
10. Why can a kernel become slower after reducing instruction count?
11. FP32/TF32/FP16/BF16/INT8: range, precision, accumulation, and validation?
12. What can kernel fusion improve, and when can it hurt?
13. Nsight Systems versus Nsight Compute: what question does each answer?
14. TensorRT engines, optimization profiles, dynamic shapes, and tactic choice?
15. Why can a fast model still have slow end-to-end latency?

## Hands-on performance exercise

Optimize preprocessing plus NMS for a multi-stream detector.

Required report:

- Correctness oracle and numerical tolerance.
- Exact hardware/software/workload, warm-up and synchronization method.
- CPU/GPU timeline before changes; p50/p95/p99 and throughput.
- Ranked bottleneck hypotheses.
- One change at a time with profile evidence.
- Accuracy, latency, throughput, peak memory, power if available.
- Behavior across batch sizes, resolutions, stream counts, and empty/dense scenes.
- Final bottleneck: optimization moves a limit; it rarely removes all limits.

## Debug scenarios

- GPU utilization is 30% but latency is high.
- Kernel time is low, yet end-to-end throughput is poor.
- FP16 is slower than FP32 on the target workload.
- INT8 average accuracy is acceptable but a critical class regresses.
- Performance improves in a microbenchmark but worsens in the application.
- A CUDA error appears several API calls after the faulty kernel.
- Dynamic input shapes cause intermittent engine rebuild or tactic changes.

For each, describe the first measurement, likely categories, isolation experiment,
and safe remediation—not a single guessed cause.

## Passing bar

You can read a timeline/profile, distinguish host/device and latency/throughput
bottlenecks, explain correctness/precision risks, and present a reproducible
optimization rather than an unmeasured code change.

