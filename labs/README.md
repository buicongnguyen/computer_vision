# Executable Labs

These labs are deliberately small. Their purpose is to expose whether you
understand the mechanics and edge cases hidden by production libraries.

## Workflow

1. Read only the exercise docstring and its linked curriculum module.
2. Add tests for a normal case, edge case, and invalid input.
3. Implement without copying the reference package.
4. Compare numerical output with the reference implementation or a trusted
   library.
5. Benchmark representative input sizes.
6. Write a short note explaining complexity, numerical behavior, and the first
   production change you would make.

The implementations in `labs/reference` are compact review aids, not
production-ready libraries. Read them after completing your attempt.

## Suggested order

| Exercise | Concept | Passing evidence |
|---|---|---|
| `metrics_exercise.py` | IoU and AP | Vectorized, validated, tested on empty/degenerate boxes |
| `geometry_exercise.py` | Homogeneous coordinates and DLT | Stable normalization, degeneracy detection, reprojection test |
| `tracking_exercise.py` | Constant-velocity Kalman filter | Prediction/update tests and uncertainty interpretation |

Run reference tests with:

```powershell
pytest -q
```

Run an exercise test file you create with:

```powershell
pytest -q labs/exercises/test_metrics_exercise.py
```

## Extension labs

After the three starter exercises, implement and test:

- Bilinear sampling with explicit border behavior and a gradient check.
- RANSAC homography with adaptive iteration count and a seeded RNG.
- Hungarian assignment with gating for a multi-object tracker.
- Camera projection with analytic or automatic Jacobian validation.
- Tiled NMS/soft-NMS and a performance comparison.
- INT8 calibration error analysis by layer and data slice.

Each extension should include a profile, a failure example, and a statement of
where you would replace your implementation with a maintained library.

