window.CV_CODING_SOLUTIONS = [
  ...(Array.isArray(window.CV_CODING_SOLUTIONS)
    ? window.CV_CODING_SOLUTIONS
    : []),
  {
    id: "sys-bounded-queue",
    python: {
      code: `from collections import deque
from dataclasses import dataclass, replace
from threading import Condition
from time import monotonic_ns

@dataclass(frozen=True)
class Frame:
    stream_id: str
    frame_id: int
    event_ns: int
    payload: object
    enqueued_ns: int = 0

class BoundedStage:
    def __init__(self, capacity: int, overload: str = "drop_oldest"):
        if capacity <= 0 or overload not in {"block", "drop_oldest"}:
            raise ValueError("invalid queue contract")
        self.capacity = capacity
        self.overload = overload
        self._items = deque()
        self._cv = Condition()
        self._closed = False
        self._error: BaseException | None = None
        self.dropped = 0

    def put(self, frame: Frame) -> bool:
        with self._cv:
            if self.overload == "block":
                # The close-aware predicate wakes a blocked producer on shutdown.
                self._cv.wait_for(
                    lambda: self._closed or len(self._items) < self.capacity
                )
                if self._closed:
                    return False
            elif len(self._items) == self.capacity:
                # Pop and append occur under one lock: no producer/consumer race.
                self._items.popleft()
                self.dropped += 1
            if self._closed:
                return False
            # Event time remains unchanged; enqueue time starts queue residency.
            self._items.append(replace(frame, enqueued_ns=monotonic_ns()))
            self._cv.notify_all()
            return True

    def get(self) -> Frame | None:
        with self._cv:
            self._cv.wait_for(lambda: self._items or self._closed)
            if self._items:
                frame = self._items.popleft()
                self._cv.notify_all()
                return frame
            if self._error is not None:
                raise RuntimeError("upstream stage failed") from self._error
            return None

    def close(self) -> None:
        with self._cv:
            self._closed = True
            self._cv.notify_all()  # Wake blocked producers and consumers.

    def fail(self, error: BaseException) -> None:
        with self._cv:
            self._error = error
            self._closed = True
            self._cv.notify_all()  # Drain accepted frames, then surface the cause.

def queue_delay_ms(frame: Frame) -> float:
    return (monotonic_ns() - frame.enqueued_ns) / 1e6`,
      walkthrough: [
        "A condition-protected deque makes the capacity check, drop, and append one atomic operation.",
        "Event time travels with the frame; enqueue time measures residency without corrupting sensor timing.",
        "Close and failure wake every waiter, drain accepted work, and then return end-of-stream or propagate the cause."
      ]
    },
    cpp: {
      code: `#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <deque>
#include <exception>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>

struct Frame {
  std::string stream_id;
  std::uint64_t frame_id{};
  std::int64_t event_ns{};
  std::int64_t enqueued_ns{};
};

enum class Overload { Block, DropOldest };

class BoundedQueue {
 public:
  BoundedQueue(std::size_t capacity, Overload policy)
      : capacity_(capacity), policy_(policy) {
    if (capacity_ == 0) throw std::invalid_argument("capacity must be positive");
  }

  bool push(Frame frame) {
    std::unique_lock lock(mu_);
    if (policy_ == Overload::Block) {
      not_full_.wait(lock, [&] { return closed_ || q_.size() < capacity_; });
      if (closed_) return false;
    } else if (q_.size() == capacity_) {
      q_.pop_front();              // Bounded latency: discard the stalest frame.
      ++dropped_;
    }
    frame.enqueued_ns = now_ns();  // Preserve event time; start queue residency.
    q_.push_back(std::move(frame));
    not_empty_.notify_one();
    return true;
  }

  std::optional<Frame> pop() {
    std::unique_lock lock(mu_);
    not_empty_.wait(lock, [&] { return closed_ || !q_.empty(); });
    if (q_.empty()) {
      if (error_) std::rethrow_exception(error_);
      return std::nullopt;
    }
    Frame frame = std::move(q_.front());
    q_.pop_front();
    not_full_.notify_one();
    return frame;
  }

  void close() {
    std::lock_guard lock(mu_);
    closed_ = true;                // Wake both producers and consumers on shutdown.
    not_empty_.notify_all();
    not_full_.notify_all();
  }

  void fail(std::exception_ptr error) {
    std::lock_guard lock(mu_);
    error_ = std::move(error);
    closed_ = true;                // Drain queued frames, then rethrow in pop().
    not_empty_.notify_all();
    not_full_.notify_all();
  }

  std::size_t dropped() const {
    std::lock_guard lock(mu_);      // Monitoring reads cannot race with push().
    return dropped_;
  }

 private:
  static std::int64_t now_ns() {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();
  }
  std::size_t capacity_, dropped_{};
  Overload policy_;
  bool closed_{};
  std::exception_ptr error_;
  std::deque<Frame> q_;
  mutable std::mutex mu_;
  std::condition_variable not_empty_, not_full_;
};`,
      walkthrough: [
        "The condition predicates include the closed state so shutdown cannot strand a waiting thread.",
        "Drop-oldest bounds age for a live stream; block is appropriate only when loss is less acceptable than delay.",
        "Frame and enqueue timestamps support separate service-time and queue-delay histograms."
      ]
    }
  },
  {
    id: "sys-latency",
    python: {
      code: `from dataclasses import asdict, dataclass
from math import ceil
from time import perf_counter_ns
from typing import Callable

@dataclass(frozen=True)
class Benchmark:
    boundary: str
    concurrency: int
    cold_ms: float
    warm_ms: list[float]
    throughput_hz: float
    peak_memory_bytes: int
    metadata: dict[str, str]

    def percentile(self, q: float) -> float:
        if not self.warm_ms or not 0.0 <= q <= 1.0:
            raise ValueError("q must be in [0, 1] and samples must be nonempty")
        xs = sorted(self.warm_ms)
        # Nearest-rank convention; Python and C++ use the same definition.
        i = max(0, ceil(q * len(xs)) - 1)
        return xs[i]

    def report(self) -> dict:
        return asdict(self)  # Raw samples make the report machine-readable.

def benchmark(run_batch: Callable[[int], None],
              synchronize: Callable[[], None],
              reset_peak_memory: Callable[[], None],
              read_peak_memory: Callable[[], int],
              metadata: dict[str, str],
              boundary: str = "decoded input -> task output",
              concurrency: int = 1, warmup: int = 10,
              repeats: int = 100) -> Benchmark:
    required = {"hardware", "software", "workload"}
    if (warmup < 0 or repeats <= 0 or concurrency <= 0 or not boundary
            or not required.issubset(metadata)):
        raise ValueError("invalid benchmark contract")

    def timed_once() -> float:
        synchronize()               # Empty the previous asynchronous work.
        start = perf_counter_ns()
        run_batch(concurrency)
        synchronize()               # API return is not GPU completion.
        return (perf_counter_ns() - start) / 1e6

    reset_peak_memory()
    cold = timed_once()
    for _ in range(warmup):
        run_batch(concurrency)
    synchronize()

    wall_start = perf_counter_ns()
    samples = [timed_once() for _ in range(repeats)]
    wall_s = (perf_counter_ns() - wall_start) / 1e9
    completed = repeats * concurrency
    return Benchmark(boundary, concurrency, cold, samples,
                     completed / wall_s, read_peak_memory(), dict(metadata))

def benchmark_matrix(run_batch, synchronize, reset_peak_memory,
                     read_peak_memory, metadata,
                     concurrency_levels=(1, 2, 4)) -> list[Benchmark]:
    # Compare latency, throughput, and memory at every declared load level.
    return [benchmark(run_batch, synchronize, reset_peak_memory,
                      read_peak_memory, metadata, concurrency=level)
            for level in concurrency_levels]`,
      walkthrough: [
        "Cold latency is separate, while a named boundary and raw warm samples make every percentile auditable.",
        "Synchronization brackets device completion; peak-memory callbacks use the runtime’s own high-water mark.",
        "Concurrency is explicit, throughput counts completed items, and hardware/software/workload metadata travels with the report."
      ]
    },
    cpp: {
      code: `#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <functional>
#include <map>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct Benchmark {
  std::string boundary;
  std::size_t concurrency{};
  double cold_ms{};
  std::vector<double> warm_ms;
  double throughput_hz{};
  std::uint64_t peak_memory_bytes{};
  std::map<std::string, std::string> metadata;

  double percentile(double q) const {
    if (warm_ms.empty() || q < 0.0 || q > 1.0) {
      throw std::invalid_argument("q/samples");
    }
    auto values = warm_ms;
    std::sort(values.begin(), values.end());
    // Nearest-rank convention, identical to the Python answer.
    const auto rank = static_cast<std::size_t>(
        std::ceil(q * static_cast<double>(values.size())));
    const auto i = rank == 0 ? 0 : rank - 1;
    return values.at(i);
  }
};

Benchmark run_benchmark(const std::function<void(std::size_t)>& run_batch,
                        const std::function<void()>& synchronize,
                        const std::function<void()>& reset_peak_memory,
                        const std::function<std::uint64_t()>& read_peak_memory,
                        std::map<std::string, std::string> metadata,
                        std::string boundary = "decoded input -> task output",
                        std::size_t concurrency = 1,
                        int warmup = 10, int repeats = 100) {
  if (warmup < 0 || repeats <= 0 || concurrency == 0 || boundary.empty() ||
      metadata.count("hardware") == 0 || metadata.count("software") == 0 ||
      metadata.count("workload") == 0) {
    throw std::invalid_argument("benchmark contract");
  }
  using Clock = std::chrono::steady_clock;

  auto timed_once = [&] {
    synchronize();                  // Drain work from the previous iteration.
    const auto begin = Clock::now();
    run_batch(concurrency);
    synchronize();                  // Include actual device completion.
    return std::chrono::duration<double, std::milli>(
        Clock::now() - begin).count();
  };

  Benchmark out;
  out.boundary = std::move(boundary);
  out.concurrency = concurrency;
  out.metadata = std::move(metadata);
  reset_peak_memory();
  out.cold_ms = timed_once();
  for (int i = 0; i < warmup; ++i) run_batch(concurrency);
  synchronize();

  const auto wall_begin = Clock::now();
  out.warm_ms.reserve(repeats);
  for (int i = 0; i < repeats; ++i) out.warm_ms.push_back(timed_once());
  const double wall_s =
      std::chrono::duration<double>(Clock::now() - wall_begin).count();
  out.throughput_hz = (repeats * concurrency) / wall_s;
  out.peak_memory_bytes = read_peak_memory();
  return out;
}`,
      walkthrough: [
        "A monotonic clock and an explicit synchronization boundary prevent asynchronous under-reporting.",
        "Nearest-rank percentiles, raw samples, and concurrency use the same convention as the Python answer.",
        "Peak memory plus named hardware, software, workload, and boundary metadata make runs reproducible."
      ]
    }
  },
  {
    id: "sys-parity",
    python: {
      code: `from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class StageTolerance:
    atol: float
    rtol: float

def compare_stage(name: str, train: np.ndarray, serve: np.ndarray,
                  tol: StageTolerance) -> dict:
    if train.shape != serve.shape:
        raise AssertionError(f"{name}: shape {train.shape} != {serve.shape}")
    if not np.isfinite(train).all() or not np.isfinite(serve).all():
        raise AssertionError(f"{name}: non-finite tensor")
    delta = np.abs(train.astype(np.float64) - serve.astype(np.float64))
    allowed = tol.atol + tol.rtol * np.abs(train)
    # Report the first broken boundary instead of blaming the final model output.
    if np.any(delta > allowed):
        i = np.unravel_index(np.argmax(delta - allowed), delta.shape)
        raise AssertionError(
            f"{name}: index={i}, train={train[i]}, serve={serve[i]}, "
            f"abs_error={delta[i]:.6g}, allowed={allowed[i]:.6g}"
        )
    return {"stage": name, "max_abs": float(delta.max(initial=0.0))}

def parity_report(train_stages: dict, serve_stages: dict) -> list[dict]:
    tolerances = {
        "decoded_rgb": StageTolerance(0.0, 0.0),
        "resized_normalized": StageTolerance(2e-5, 2e-5),
        "logits": StageTolerance(2e-3, 2e-3),
    }
    # Stable stage names catch color, resize, precision, and export drift early.
    return [compare_stage(k, train_stages[k], serve_stages[k], tolerances[k])
            for k in tolerances]`,
      walkthrough: [
        "Golden raw inputs pass through both pipelines so the comparison includes decoding and preprocessing.",
        "Stage-specific tolerances keep exact byte/layout checks separate from FP16 numerical checks.",
        "The first failing tensor and index make color-order or resize-coordinate drift diagnosable."
      ]
    },
    cpp: {
      code: `#include <opencv2/core.hpp>
#include <cmath>
#include <stdexcept>
#include <string>

struct StageTolerance { double abs; double rel; };
struct StageReport { std::string name; double max_abs; };

bool same_shape_and_channels(const cv::Mat& a, const cv::Mat& b) {
  if (a.dims != b.dims || a.channels() != b.channels()) return false;
  for (int axis = 0; axis < a.dims; ++axis) {
    if (a.size[axis] != b.size[axis]) return false;
  }
  return true;
}

StageReport compare_stage(const std::string& name,
                          const cv::Mat& train, const cv::Mat& serve,
                          StageTolerance tolerance) {
  if (!same_shape_and_channels(train, serve)) {
    throw std::runtime_error(name + ": shape/channel mismatch");
  }
  cv::Mat a, b;
  // Different numeric depths (for example FP32 vs FP16) are intentional here.
  train.convertTo(a, CV_64F);
  serve.convertTo(b, CV_64F);
  if (!cv::checkRange(a, true, nullptr) || !cv::checkRange(b, true, nullptr)) {
    throw std::runtime_error(name + ": non-finite tensor");
  }
  cv::Mat delta = cv::abs(a - b);
  cv::Mat allowed = tolerance.abs + tolerance.rel * cv::abs(a);

  cv::Mat failed = delta > allowed;
  if (cv::countNonZero(failed.reshape(1)) != 0) {
    // Stop at the earliest named stage; final-output parity hides root causes.
    double max_error = 0.0;
    cv::minMaxLoc(delta.reshape(1), nullptr, &max_error);
    throw std::runtime_error(name + ": tolerance exceeded, max=" +
                             std::to_string(max_error));
  }
  double max_error = 0.0;
  cv::minMaxLoc(delta.reshape(1), nullptr, &max_error);
  return {name, max_error};         // Persist this with artifact versions.
}

// Call in order: decoded RGB (0,0), normalized input, logits, then task output.`,
      walkthrough: [
        "OpenCV matrices provide a compact C++ oracle for byte, layout, resize, and tensor comparisons.",
        "Both absolute and relative bounds matter near zero and at large activation magnitudes.",
        "Task-aware box/NMS matching should run only after intermediate tensor parity succeeds."
      ]
    }
  },
  {
    id: "sys-int8",
    python: {
      code: `from collections import defaultdict
from dataclasses import dataclass
from typing import Callable
import numpy as np

@dataclass(frozen=True)
class Sample:
    path: str
    label: int
    slice_name: str

@dataclass(frozen=True)
class Observation:
    layers: dict[str, np.ndarray]
    task_score: float

@dataclass(frozen=True)
class Engine:
    artifact_hash: str
    precision: str
    hardware: str
    runtime: str
    latency_ms: float
    peak_memory_bytes: int
    infer: Callable[[Sample], Observation]

def interleaved_manifest(samples: list[Sample], per_slice: int) -> list[Sample]:
    groups = defaultdict(list)
    for sample in samples:
        groups[sample.slice_name].append(sample)
    keys = sorted(groups)
    if not keys or any(len(groups[key]) < per_slice for key in keys):
        raise ValueError("calibration set does not cover every declared slice")
    # Round-robin ordering avoids long, slice-clustered calibration batches.
    return [groups[key][i] for i in range(per_slice) for key in keys]

def relative_drift(fp: np.ndarray, quantized: np.ndarray) -> float:
    if fp.shape != quantized.shape:
        raise ValueError("layer shape mismatch")
    a, b = fp.astype(np.float64), quantized.astype(np.float64)
    if not np.isfinite(a).all() or not np.isfinite(b).all():
        raise ValueError("non-finite activation")
    scale = np.maximum(np.abs(a), 1e-6)
    return float(np.max(np.abs(a - b) / scale, initial=0.0))

def audit(samples: list[Sample], fp: Engine, int8: Engine,
          max_drop: dict[str, float],
          max_layer_drift: dict[str, float],
          max_latency_ms: float = float("inf"),
          max_peak_memory_bytes: int = 2**63 - 1) -> dict:
    if not samples or fp.hardware != int8.hardware or fp.runtime != int8.runtime:
        raise ValueError("paired artifacts must share hardware/runtime")

    paired = [(sample, fp.infer(sample), int8.infer(sample))
              for sample in samples]  # Exact same inputs, in the same order.
    layer_drift = defaultdict(float)
    slice_scores = defaultdict(lambda: {"fp": [], "int8": []})
    for sample, base, quantized in paired:
        if base.layers.keys() != quantized.layers.keys():
            raise ValueError("debug-layer contract mismatch")
        for name in base.layers:
            layer_drift[name] = max(
                layer_drift[name],
                relative_drift(base.layers[name], quantized.layers[name]),
            )
        slice_scores[sample.slice_name]["fp"].append(base.task_score)
        slice_scores[sample.slice_name]["int8"].append(quantized.task_score)

    slices = {}
    for name, scores in slice_scores.items():
        if name not in max_drop:
            raise ValueError(f"missing quality gate for slice {name}")
        fp_score = float(np.mean(scores["fp"]))
        int8_score = float(np.mean(scores["int8"]))
        drop = fp_score - int8_score
        slices[name] = {"fp": fp_score, "int8": int8_score, "drop": drop,
                        "passed": drop <= max_drop[name]}

    sensitive = sorted(
        name for name, drift in layer_drift.items()
        if drift > max_layer_drift.get(name, float("inf"))
    )
    system_passed = (int8.latency_ms <= max_latency_ms and
                     int8.peak_memory_bytes <= max_peak_memory_bytes)
    # Rebuild with these layers forced to FP16, then rerun this entire audit.
    return {
        "adopt": (all(row["passed"] for row in slices.values())
                  and not sensitive and system_passed),
        "slices": slices,
        "layer_relative_drift": dict(layer_drift),
        "force_fp16_layers": sensitive,
        "system": {
            "hardware": fp.hardware, "runtime": fp.runtime,
            "fp_hash": fp.artifact_hash, "int8_hash": int8.artifact_hash,
            "fp_latency_ms": fp.latency_ms, "int8_latency_ms": int8.latency_ms,
            "fp_peak_bytes": fp.peak_memory_bytes,
            "int8_peak_bytes": int8.peak_memory_bytes,
            "passed": system_passed,
        },
    }

# Build the INT8 TensorRT engine from interleaved_manifest(...); inject its
# exact callable and metadata above. A failed layer gate is a mixed-precision
# rebuild recommendation, never permission to hide a critical-slice collapse.`,
      walkthrough: [
        "A deterministic round-robin manifest prevents narrow or slice-clustered data from dominating TensorRT calibration ranges.",
        "Exact FP and INT8 artifacts run the same inputs while named debug tensors localize activation drift.",
        "Critical-slice quality, sensitive-layer drift, latency, memory, artifact hashes, hardware, and runtime all enter the adoption record."
      ]
    },
    cpp: {
      code: `#include <opencv2/core.hpp>
#include <algorithm>
#include <cmath>
#include <functional>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

struct Sample { std::string path, slice; int label{}; };

struct Observation {
  std::map<std::string, cv::Mat> layers;
  double task_score{};
};

struct Engine {
  std::string artifact_hash, precision, hardware, runtime;
  double latency_ms{};
  std::size_t peak_memory_bytes{};
  std::function<Observation(const Sample&)> infer;
};

struct Audit {
  bool adopt{true};
  std::map<std::string, double> layer_relative_drift;
  std::map<std::string, double> quality_drop;
  std::map<std::string, double> system_metrics;
  std::map<std::string, std::string> metadata;
  std::vector<std::string> force_fp16_layers;
};

std::vector<std::string> interleave_calibration(
    const std::map<std::string, std::vector<std::string>>& by_slice,
    std::size_t count_per_slice) {
  if (by_slice.empty()) throw std::invalid_argument("no calibration slices");
  std::vector<std::string> manifest;
  for (const auto& [slice, paths] : by_slice) {
    if (paths.size() < count_per_slice) {
      throw std::runtime_error("under-covered slice: " + slice);
    }
  }
  // Round-robin, deterministic order avoids slice-clustered batches.
  for (std::size_t i = 0; i < count_per_slice; ++i)
    for (const auto& [slice, paths] : by_slice) manifest.push_back(paths[i]);
  return manifest;
}

double relative_drift(const cv::Mat& fp, const cv::Mat& quantized) {
  if (fp.dims != quantized.dims || fp.channels() != quantized.channels()) {
    throw std::runtime_error("layer shape mismatch");
  }
  for (int axis = 0; axis < fp.dims; ++axis)
    if (fp.size[axis] != quantized.size[axis])
      throw std::runtime_error("layer shape mismatch");
  cv::Mat a, b;
  fp.convertTo(a, CV_64F);
  quantized.convertTo(b, CV_64F);
  if (!cv::checkRange(a, true, nullptr) ||
      !cv::checkRange(b, true, nullptr)) {
    throw std::runtime_error("non-finite activation");
  }
  a = a.reshape(1, 1);
  b = b.reshape(1, 1);
  double worst = 0.0;
  for (int i = 0; i < a.cols; ++i) {
    const double av = a.at<double>(0, i), bv = b.at<double>(0, i);
    const double scale = std::max(std::abs(av), 1e-6);
    worst = std::max(worst, std::abs(av - bv) / scale);
  }
  return worst;
}

Audit audit_int8(const std::vector<Sample>& samples,
                 const Engine& fp, const Engine& int8,
                 const std::map<std::string, double>& max_drop,
                 const std::map<std::string, double>& max_layer_drift,
                 double max_latency_ms,
                 std::size_t max_peak_memory_bytes) {
  if (samples.empty() || fp.hardware != int8.hardware ||
      fp.runtime != int8.runtime || !fp.infer || !int8.infer) {
    throw std::invalid_argument("unpaired engine contract");
  }
  std::map<std::string, std::pair<double, double>> score_sums;
  std::map<std::string, std::size_t> score_counts;
  Audit result;
  result.metadata = {
      {"hardware", fp.hardware}, {"runtime", fp.runtime},
      {"fp_hash", fp.artifact_hash}, {"int8_hash", int8.artifact_hash}};
  result.system_metrics = {
      {"fp_latency_ms", fp.latency_ms}, {"int8_latency_ms", int8.latency_ms},
      {"fp_peak_bytes", static_cast<double>(fp.peak_memory_bytes)},
      {"int8_peak_bytes", static_cast<double>(int8.peak_memory_bytes)}};
  result.adopt = int8.latency_ms <= max_latency_ms &&
                 int8.peak_memory_bytes <= max_peak_memory_bytes;
  for (const auto& sample : samples) {
    const auto base = fp.infer(sample);
    const auto quantized = int8.infer(sample);  // Exact same sample and order.
    if (base.layers.size() != quantized.layers.size())
      throw std::runtime_error("debug-layer contract mismatch");
    for (const auto& [name, tensor] : base.layers) {
      const double drift = relative_drift(tensor, quantized.layers.at(name));
      result.layer_relative_drift[name] =
          std::max(result.layer_relative_drift[name], drift);
    }
    score_sums[sample.slice].first += base.task_score;
    score_sums[sample.slice].second += quantized.task_score;
    ++score_counts[sample.slice];
  }
  for (const auto& [slice, sums] : score_sums) {
    const double drop = (sums.first - sums.second) / score_counts.at(slice);
    result.quality_drop[slice] = drop;
    result.adopt = result.adopt && drop <= max_drop.at(slice);
  }
  for (const auto& [name, drift] : result.layer_relative_drift) {
    const auto limit = max_layer_drift.find(name);
    if (limit != max_layer_drift.end() && drift > limit->second) {
      result.force_fp16_layers.push_back(name);
      result.adopt = false;  // Rebuild mixed precision, then rerun all gates.
    }
  }
  return result;
}`,
      walkthrough: [
        "The manifest validates every declared slice and truly interleaves them before TensorRT consumes batches.",
        "Paired inference compares named layer tensors and per-slice task scores on identical versioned samples.",
        "A sensitive layer becomes an explicit FP16 override candidate; the rebuilt engine must still pass every quality, latency, memory, and metadata gate."
      ]
    }
  },
  {
    id: "gpu-normalize",
    python: {
      code: `import torch
import torch.nn.functional as F

def preprocess(image_hwc_u8: torch.Tensor, out_hw: tuple[int, int],
               mean=(0.485, 0.456, 0.406),
               std=(0.229, 0.224, 0.225),
               require_cuda: bool = True) -> torch.Tensor:
    if image_hwc_u8.dtype != torch.uint8 or image_hwc_u8.ndim != 3:
        raise ValueError("expected HWC uint8")
    if image_hwc_u8.shape[2] != 3:
        raise ValueError("expected three RGB channels")
    if require_cuda and not image_hwc_u8.is_cuda:
        raise ValueError("expected CUDA tensor")

    # Contract: input RGB/HWC/u8; output RGB/NCHW/f32, align_corners=False.
    x = image_hwc_u8.permute(2, 0, 1).unsqueeze(0).float().div_(255.0)
    x = F.interpolate(x, size=out_hw, mode="bilinear",
                      align_corners=False, antialias=False)
    mean_t = x.new_tensor(mean).view(1, 3, 1, 1)
    std_t = x.new_tensor(std).view(1, 3, 1, 1)
    return (x - mean_t) / std_t

def cpu_oracle(image_hwc_u8: torch.Tensor, out_hw, mean, std):
    # The same function on CPU is the correctness oracle before kernel fusion.
    return preprocess(image_hwc_u8.cpu(), out_hw, mean, std, require_cuda=False)

# Time only after torch.cuda.synchronize(); compare odd sizes and channel sentinels.`,
      walkthrough: [
        "The layout, color order, dtype, scale, and resize-coordinate convention are declared in one place.",
        "PyTorch operations give a readable GPU baseline whose output can be compared with the fused CUDA kernel.",
        "Synchronization belongs in the benchmark harness, not inside an asynchronous preprocessing function."
      ]
    },
    cpp: {
      code: `#include <cuda_runtime.h>
#include <cstdint>
#include <stdexcept>

__global__ void resize_normalize_rgb(
    const std::uint8_t* src, int in_h, int in_w,
    float* dst, int out_h, int out_w,
    float3 mean, float3 inv_std) {
  const int x = blockIdx.x * blockDim.x + threadIdx.x;
  const int y = blockIdx.y * blockDim.y + threadIdx.y;
  if (x >= out_w || y >= out_h) return;  // Odd image sizes remain bounds-safe.

  // Half-pixel bilinear convention matches common align_corners=false runtimes.
  const float sx = (x + 0.5f) * in_w / out_w - 0.5f;
  const float sy = (y + 0.5f) * in_h / out_h - 0.5f;
  const int raw_x0 = static_cast<int>(floorf(sx));
  const int raw_y0 = static_cast<int>(floorf(sy));
  // Clamp each raw neighbor independently; clamping before +1 breaks borders.
  const int x0 = max(0, min(in_w - 1, raw_x0));
  const int y0 = max(0, min(in_h - 1, raw_y0));
  const int x1 = max(0, min(in_w - 1, raw_x0 + 1));
  const int y1 = max(0, min(in_h - 1, raw_y0 + 1));
  const float ax = sx - raw_x0, ay = sy - raw_y0;

  for (int c = 0; c < 3; ++c) {
    const float p00 = src[(y0 * in_w + x0) * 3 + c];
    const float p01 = src[(y0 * in_w + x1) * 3 + c];
    const float p10 = src[(y1 * in_w + x0) * 3 + c];
    const float p11 = src[(y1 * in_w + x1) * 3 + c];
    const float top = p00 * (1 - ax) + p01 * ax;
    const float bot = p10 * (1 - ax) + p11 * ax;
    const float unit = (top * (1 - ay) + bot * ay) / 255.0f;
    const float m = c == 0 ? mean.x : (c == 1 ? mean.y : mean.z);
    const float s = c == 0 ? inv_std.x : (c == 1 ? inv_std.y : inv_std.z);
    dst[(c * out_h + y) * out_w + x] = (unit - m) * s;  // RGB HWC -> CHW.
  }
}

void launch(const std::uint8_t* src, int ih, int iw, float* dst,
            int oh, int ow, float3 mean, float3 inv_std,
            cudaStream_t stream) {
  dim3 block(16, 16), grid((ow + 15) / 16, (oh + 15) / 16);
  resize_normalize_rgb<<<grid, block, 0, stream>>>(
      src, ih, iw, dst, oh, ow, mean, inv_std);
  // Check launch status here; synchronize only outside the timed async path.
  if (cudaPeekAtLastError() != cudaSuccess) throw std::runtime_error("launch");
}`,
      walkthrough: [
        "A two-dimensional launch maps one thread to one output pixel and guards arbitrary dimensions.",
        "The kernel fuses bilinear sampling, uint8 scaling, normalization, and HWC-to-CHW conversion.",
        "A CPU/PyTorch oracle must verify border, channel-order, and FP tolerance before profiling."
      ]
    }
  },
  {
    id: "sys-monitor",
    python: {
      code: `from dataclasses import dataclass
from enum import Enum, auto

class Rollout(Enum):
    HEALTHY = auto()
    SUSPECT = auto()
    ROLLBACK = auto()

@dataclass(frozen=True)
class Window:
    event_start_s: int
    event_end_s: int
    requests: int
    p99_ms: float
    schema_ok: bool
    quality_drop: float | None

def transition(state: Rollout, w: Window,
               latency_slo_ms=80.0, max_quality_drop=0.02) -> Rollout:
    if state is Rollout.ROLLBACK:
        return state                    # Latched until an explicit redeploy/reset.
    if w.requests < 100:
        return state                    # Insufficient population: keep collecting.
    service_bad = w.p99_ms > latency_slo_ms or not w.schema_ok
    quality_bad = (w.quality_drop is not None and
                   w.quality_drop > max_quality_drop)

    if quality_bad or (state is Rollout.SUSPECT and service_bad):
        return Rollout.ROLLBACK         # Delayed labels can still veto the canary.
    if service_bad:
        return Rollout.SUSPECT
    if w.quality_drop is None:
        return state                    # Prediction drift alone is not quality loss.
    return Rollout.HEALTHY

def reset_after_redeploy(state: Rollout, approved: bool) -> Rollout:
    # Ordinary monitoring windows cannot resurrect a rolled-back canary.
    return Rollout.HEALTHY if state is Rollout.ROLLBACK and approved else state

# Build windows by event time; ingestion time is retained only for label-delay SLOs.`,
      walkthrough: [
        "Service, schema, prediction, and delayed-quality signals remain separate rather than becoming one opaque health score.",
        "A suspect intermediate state prevents alert flapping while a second bad window triggers rollback.",
        "Rollback is latched until an approved redeploy/reset; missing delayed labels never become an unsupported quality claim."
      ]
    },
    cpp: {
      code: `#include <cstddef>
#include <optional>

enum class Rollout { Healthy, Suspect, Rollback };

struct Window {
  long long event_start_s{};
  long long event_end_s{};
  std::size_t requests{};
  double p99_ms{};
  bool schema_ok{};
  std::optional<double> quality_drop;
};

Rollout transition(Rollout state, const Window& w,
                   double latency_slo_ms = 80.0,
                   double max_quality_drop = 0.02) {
  if (state == Rollout::Rollback) return state;  // Explicit reset is required.
  if (w.requests < 100) return state;  // Do not alert on an undersized window.
  const bool service_bad = w.p99_ms > latency_slo_ms || !w.schema_ok;
  const bool quality_bad =
      w.quality_drop && *w.quality_drop > max_quality_drop;

  if (quality_bad || (state == Rollout::Suspect && service_bad)) {
    return Rollout::Rollback;          // Each transition needs an owned action.
  }
  if (service_bad) return Rollout::Suspect;
  if (!w.quality_drop) return state;   // Drift is evidence to inspect, not failure.
  return Rollout::Healthy;
}

Rollout reset_after_redeploy(Rollout state, bool approved) {
  // A normal good window cannot silently resurrect a rolled-back canary.
  return state == Rollout::Rollback && approved ? Rollout::Healthy : state;
}

// Aggregate by event time; track ingestion time separately for delayed labels.`,
      walkthrough: [
        "The enum makes rollout behavior testable as a deterministic state machine.",
        "Population and window semantics are checked before any alert transition.",
        "A delayed critical-slice regression can latch rollback; only an explicit approved redeploy resets it."
      ]
    }
  }
];
