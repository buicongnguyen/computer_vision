# Object Detection, Segmentation, and Structured Prediction

Detection and segmentation systems combine representation learning with geometry, matching, class imbalance, postprocessing, and complex evaluation. Senior-level work requires understanding how errors propagate through this full stack.

Suggested study time: 25–35 hours.

## Learning outcomes

You should be able to:

- represent and transform boxes, masks, keypoints, and labels consistently;
- explain anchor-based, anchor-free, and set-prediction detectors;
- implement IoU, assignment, NMS, and evaluation primitives;
- choose losses and metrics for semantic, instance, or panoptic tasks;
- run slice-based error analysis instead of relying on one headline score;
- validate training, export, and postprocessing parity;
- reason about latency–quality and threshold tradeoffs.

## 1. Detection representation

Common box formats include:

- corners: \((x_{\min},y_{\min},x_{\max},y_{\max})\);
- origin and size: \((x,y,w,h)\);
- center and size: \((c_x,c_y,w,h)\);
- oriented box: center, dimensions, and angle.

Every API must state:

- whether maximum coordinates are inclusive or exclusive;
- absolute pixels or normalized coordinates;
- coordinate origin and axis direction;
- clipping policy;
- behavior for zero-area and invalid boxes.

Intersection over union is

$$
\operatorname{IoU}(A,B)
=
\frac{|A\cap B|}{|A\cup B|}.
$$

IoU has zero gradient for non-overlapping boxes. Generalized, distance, and complete IoU variants add signals about enclosure, center distance, or aspect ratio. Their inductive biases should match the task.

Boxes are an imperfect proxy for object extent. A fixed IoU threshold penalizes small objects more strongly for the same pixel displacement.

## 2. Dense detection

Anchor-based detectors classify and regress predefined boxes at many feature locations. Design choices include:

- feature-pyramid levels;
- anchor scale and aspect ratio;
- positive/negative matching thresholds;
- regression parameterization;
- sampling or weighting of abundant negatives.

Anchor-free detectors predict centers, corners, distances, or objectness directly from locations. They remove hand-designed anchor shapes but retain assignment and scale decisions.

Feature pyramids combine high-resolution spatial detail with deep semantic features. Incorrect scale assignment can starve small objects of positive examples.

Focal loss for target \(y\in\{0,1\}\) can be written

$$
\operatorname{FL}(p_t)
=
-\alpha_t(1-p_t)^\gamma\log(p_t).
$$

It downweights easy examples. It changes optimization emphasis; it does not fix mislabeled or systematically missing positives.

## 3. Set prediction and matching

Set-prediction detectors use a fixed number of queries and bipartite matching between predictions and targets. A matching cost may combine class, box-distance, and overlap terms.

Hungarian matching creates a one-to-one assignment for training. The scale of each cost component strongly affects which matches are chosen. “No object” handling and query count also shape optimization.

Set prediction can reduce reliance on NMS, but duplicate or unstable predictions are still possible when training, matching, or inference differs from assumptions.

## 4. Postprocessing

Greedy non-maximum suppression:

1. sort predictions by score;
2. select the highest-scoring remaining box;
3. remove boxes whose IoU with it exceeds a threshold;
4. repeat.

NMS is not learned jointly with most detectors and can suppress nearby true objects. Class-wise NMS can preserve different classes but may retain duplicate semantic predictions. Soft-NMS decays scores rather than removing boxes.

Thresholds define an operating point. They should be selected using product costs or a validation protocol, then frozen for final evaluation.

Calibration matters when downstream systems interpret scores as probabilities or combine sensors. Ranking metrics alone do not measure it.

## 5. Detection evaluation

For a chosen class and IoU criterion:

$$
\operatorname{precision}=\frac{TP}{TP+FP},
\qquad
\operatorname{recall}=\frac{TP}{TP+FN}.
$$

Average precision summarizes the precision–recall curve. Mean AP averages over classes and sometimes IoU thresholds. Exact interpolation, area range, maximum detections, and ignored-region rules depend on the evaluation protocol.

Always supplement AP with:

- per-class and per-size performance;
- precision and recall at the deployed threshold;
- duplicate, localization, classification, and background error counts;
- confidence calibration;
- latency and memory;
- slices such as camera, weather, range, occlusion, or lighting.

Incomplete annotations can turn valid predictions into apparent false positives.

## 6. Segmentation tasks

- Semantic segmentation assigns a class to each pixel.
- Instance segmentation separates object instances.
- Panoptic segmentation combines “thing” instances with “stuff” regions.

Pixelwise cross entropy is

$$
\ell_{\mathrm{CE}}
=
-\sum_{u,v}\log p_{u,v,y_{u,v}}.
$$

For a binary mask, soft Dice is commonly based on

$$
\operatorname{Dice}
=
\frac{2\sum_i p_i y_i+\epsilon}
{\sum_i p_i+\sum_i y_i+\epsilon}.
$$

Dice emphasizes overlap and can help with imbalance, but its batch/image aggregation convention changes the objective. Boundary losses or distance transforms can emphasize shape accuracy.

Ignore labels must be excluded consistently from both loss and metric. Interpolating categorical masks with a continuous kernel creates invalid labels or soft boundaries.

## 7. Architecture considerations

Encoder–decoder segmentation networks trade semantic context against boundary resolution. Skip connections restore detail but increase memory.

Detection heads can share features across classification and regression or separate them. The tasks may prefer different spatial and semantic properties.

Multi-scale training improves robustness but complicates batching, normalization, and latency. Tiling high-resolution images can improve small-object recall while creating duplicate detections and boundary artifacts.

## Practical labs

### Lab 1 — Geometry and metric primitives

Implement and test:

- conversion among three box formats;
- clipping and validity checks;
- pairwise IoU;
- class-wise greedy NMS;
- one-to-one matching for metric computation;
- a small precision–recall and AP evaluator.

Use synthetic cases with exact expected results. Compare against a trusted evaluator and document protocol differences.

### Lab 2 — Detector fine-tuning

Fine-tune a compact detector on a manageable dataset.

- Audit label maps, invalid boxes, duplicates, and missing annotations.
- Visualize every geometric augmentation.
- Measure a frozen baseline before changing anything.
- Track classification, localization, objectness, and assignment statistics.
- Report per-class, per-size, and deployed-threshold metrics.

Run one targeted ablation, such as input resolution, augmentation, or matching policy.

### Lab 3 — Detection error analysis

Classify at least 100 errors into:

- localization;
- wrong class;
- duplicate;
- background confusion;
- missed small/occluded object;
- annotation omission or ambiguity;
- postprocessing artifact.

Quantify each category before proposing improvements. Choose the next experiment from the dominant actionable failure, not visual salience.

### Lab 4 — Semantic segmentation

Train a compact encoder–decoder.

- Compare cross entropy, class-weighted cross entropy, and a CE–Dice combination.
- Preserve ignore labels.
- Evaluate mean IoU, per-class IoU, boundary quality, and calibration.
- Test native, downsampled, and tiled inference.
- Include a thin-object or rare-class slice.

### Lab 5 — Instance or panoptic extension

Choose one:

- add a mask head to a detector;
- evaluate a pretrained instance segmenter;
- assemble a small panoptic evaluation.

Study crowded scenes, overlapping objects, and duplicate masks. Explain how box and mask scoring interact.

### Lab 6 — Export, postprocessing, and load test

- Export the model and make preprocessing explicit.
- Compare native and exported raw outputs before NMS.
- Verify inverse resize/letterbox transforms.
- Evaluate FP32 and reduced precision.
- Benchmark batch sizes and image resolutions.
- Report end-to-end p50/p95, throughput, peak memory, and quality delta.

## Production failure modes

- Mixing inclusive and exclusive box boundaries.
- Applying an image transform without the identical box, mask, or keypoint transform.
- Clipping boxes before checking whether the source transform is wrong.
- Swapping width/height or x/y after tensor-layout conversion.
- Treating normalized boxes as pixels.
- Resizing class masks with bilinear interpolation.
- Applying sigmoid twice or softmax over the wrong axis.
- Misaligning dataset category IDs with contiguous training IDs.
- Ignoring crowd or ignore-region rules in evaluation.
- Computing AP with a different protocol from the benchmark.
- Choosing confidence and NMS thresholds on the final test set.
- Over-aggressive NMS in crowded scenes.
- Tiled inference producing duplicates along tile boundaries.
- Training on incomplete labels as if all unlabeled regions were negative.
- Improving aggregate mAP while a rare critical class regresses.
- Exported preprocessing, padding, or postprocessing differing from training.
- Comparing latency at different image sizes or batch assumptions.

## Oral interview questions

1. Why is IoU especially sensitive for small boxes?
2. Compare anchor-based, anchor-free, and set-prediction detectors.
3. What problem does focal loss address, and what does it not address?
4. How does assignment policy affect detector optimization?
5. Why can NMS remove a true positive?
6. Explain how AP is computed and name protocol choices that change it.
7. Why is AP insufficient for selecting a production threshold?
8. Compare semantic, instance, and panoptic segmentation.
9. When would Dice loss be preferable to plain cross entropy?
10. How do you evaluate thin-object segmentation?
11. How would you discover incomplete annotations?
12. A higher-resolution model gains AP but misses latency. What options exist besides rejecting it?
13. How do you verify an exported detector?
14. Which error-analysis result would justify changing the model architecture?

## Definition of done

- [ ] Box and mask conventions are documented at every interface.
- [ ] IoU, NMS, matching, and AP primitives pass exact synthetic tests.
- [ ] Geometric augmentation is visually and numerically verified.
- [ ] Detector results include per-class, per-size, and operating-point metrics.
- [ ] At least 100 errors are categorized with an actionable summary.
- [ ] Segmentation evaluation preserves ignore labels and includes boundaries.
- [ ] Aggregate improvements do not conceal critical-slice regressions.
- [ ] Native/exported raw and postprocessed outputs pass parity checks.
- [ ] Benchmarks report end-to-end latency, throughput, memory, and quality.
- [ ] At least eight listed failure modes have tests or monitoring.
- [ ] You can answer at least 11 of the 14 oral questions without notes.

