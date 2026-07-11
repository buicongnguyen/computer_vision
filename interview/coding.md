# Coding Preparation

Senior CV candidates still need general coding fluency. The target is not
memorized tricks; it is a clear, correct solution with explicit invariants,
complexity, tests, and maintainable code under time pressure.

## Round protocol (45 minutes)

| Time | Action |
|---:|---|
| 0-5 | Restate the problem, clarify contract/constraints, work examples |
| 5-10 | Propose baseline and improved approach; state invariant/complexity |
| 10-32 | Implement in small coherent units while explaining decisions |
| 32-40 | Test normal, boundary, invalid, and adversarial cases |
| 40-45 | Re-check complexity, improve names/API, discuss production changes |

If stuck, shrink the problem, write the brute-force solution, and use its
bottleneck to derive the next data structure. Silent guessing is worse than an
honest, testable partial solution.

## Pattern curriculum: 60 prompts

Implement ten per fortnight; repeat failed prompts from a blank editor.

### Arrays, hashing, intervals, and scanning

1. Find two timestamped detections whose scores sum to a target.
2. Return the longest run of frames without a missing sequence number.
3. Merge overlapping annotated time intervals.
4. Insert a maintenance interval into a sorted non-overlapping schedule.
5. Compute products except self without division.
6. Find the smallest image crop covering one point from each class list.
7. Maintain the median latency of a growing stream.
8. Find the top-k most frequent predicted labels with stable tie handling.
9. Rotate an image buffer in place by 90 degrees.
10. Find all maximal contiguous regions whose sum is below a memory budget.

### Two pointers, windows, stacks, and queues

11. Longest substring/label stream with at most k distinct values.
12. Minimum window containing all required event types.
13. Remove duplicates from a sorted detection ID stream in place.
14. Compute trapped volume in a 1D depth profile.
15. Find the largest rectangle in a binary mask histogram.
16. Validate nested configuration delimiters while preserving error positions.
17. Implement a queue using two stacks and analyze amortized cost.
18. Implement a bounded queue with explicit overflow policy.
19. Sliding-window maximum for per-frame object counts.
20. Simplify a filesystem-like model artifact path safely.

### Linked structures, heaps, and selection

21. Detect and locate a cycle in a linked frame chain.
22. Merge k sorted timestamp streams.
23. Implement an LRU cache with O(1) get/put.
24. Return the kth largest confidence without fully sorting.
25. Schedule GPU jobs to minimize active machines under interval constraints.
26. Maintain k closest landmarks to the origin.
27. Deep-copy a graph-like annotation with random references.
28. Reverse nodes in fixed-size groups with a partial-tail policy.
29. Build a min/max structure supporting O(1) extrema.
30. Merge streaming detections while honoring event-time order and watermark.

### Trees, tries, and recursion

31. Serialize and deserialize a binary decision tree.
32. Find the lowest common ancestor of two taxonomy nodes.
33. Validate a binary-search tree with duplicate policy.
34. Return the visible right side of a scene hierarchy by level.
35. Find all root-to-leaf paths whose risk sums to a threshold.
36. Implement prefix search for class labels using a trie.
37. Compute the diameter of an unbalanced tree.
38. Reconstruct a tree from traversal orders and validate input.
39. Convert a sorted array to a balanced search tree.
40. Evaluate an expression tree with safe error handling.

### Graphs and union-find

41. Count connected components in a binary segmentation mask.
42. Clone a graph while preserving shared nodes.
43. Find whether dependency prerequisites contain a cycle.
44. Produce a deterministic topological build order.
45. Find shortest paths in a weighted road graph with nonnegative weights.
46. Find the minimum transformations between two label strings.
47. Merge identity clusters from pairwise matches using union-find.
48. Compute a minimum spanning set of sensor links.
49. Find the cheapest route with at most k transfers.
50. Propagate multi-source distances across an occupancy grid.

### Dynamic programming and backtracking

51. Segment a label string using a dictionary with reconstruction.
52. Compute edit distance and recover an edit sequence.
53. Select non-adjacent frames for maximum information value.
54. Find the longest increasing trajectory coordinate subsequence.
55. Count grid paths with blocked cells.
56. Partition jobs across two devices to minimize imbalance.
57. Match text to a wildcard schema with `?` and `*`.
58. Generate valid combinations of sensor assignments under constraints.
59. Minimize coins/batches needed to reach an exact sample count.
60. Align two short track-label sequences with mismatch/gap costs.

## CV implementation round prompts

After the general set, implement these with NumPy or C++ and tests:

- Pairwise IoU and per-class hard NMS; analyze `O(N^2)` behavior.
- Bilinear resize/sample with a declared coordinate convention.
- Connected components on a binary mask.
- RANSAC line or homography with deterministic random seed.
- Precision/recall/AP from scored predictions with matching and ignore regions.
- Constant-velocity Kalman predict/update plus Mahalanobis gating.
- One-to-one greedy detection matching and its failure versus Hungarian matching.
- Batch image normalization without a Python loop.
- 3D rigid transform composition/inversion with frame-labeled API.
- Bounded producer/consumer video pipeline and backpressure policy.

## C++ expectations

Practice ownership and lifetime, `const` correctness, value/reference semantics,
RAII, move behavior, standard containers/algorithms, iterator invalidation,
thread safety, error handling, memory layout, and profiling. Avoid clever
templates unless the problem requires them.

## Error log format

For every miss, record:

```text
Prompt/pattern:
Failure type: contract | insight | implementation | language | testing | time
First wrong assumption:
Smallest counterexample:
Correct invariant:
Rewrite date and result:
```

The prompt is complete only after a correct blank-editor rewrite 2-7 days later.

