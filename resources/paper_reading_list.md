# Primary Paper and Documentation Reading List

Verification date: **2026-07-11**

This is a curated path for senior computer-vision, perception, and ML-systems
preparation. Every link is a primary paper page, author/project page, conference
publisher, or official engineering documentation. No tutorial or interview-prep
site is used as technical authority.

## Evidence boundary

- **Official role fact:** current Google/NVIDIA postings name topics such as
  transformers, multimodal/VLM work, 3D geometry, BEV, sensor fusion,
  self-supervision, synthetic data, production ML, CUDA and TensorRT.
- **Preparation inference:** the papers below are selected to build those skills.
  Neither company publishes or guarantees this reading list.

## How to read like a senior engineer

For each required paper, create a one-page note containing:

1. Problem and product-relevant constraint.
2. Assumptions and input/output representation.
3. Architecture or algorithm in your own diagram.
4. Objective/loss and optimization details.
5. Dataset, metric, baselines, and ablations.
6. Compute, memory, latency, or data costs when reported.
7. Three failure modes or missing evaluations.
8. One reproduction or falsification experiment.
9. One deployment implication.
10. A two-minute explanation and one likely follow-up question.

Reading an abstract is level 1. Reproducing a result or identifying a defensible
system trade-off is level 2-3 evidence.

## Tier 1 — Common foundations

Read these regardless of target company.

| Primary source | Why it matters | Checkpoint |
|---|---|---|
| [Random Sample Consensus (Fischler & Bolles, 1981)](https://dl.acm.org/doi/10.1145/358669.358692) | Robust model fitting under outliers | Implement line/homography RANSAC; show threshold and degeneracy effects |
| [Distinctive Image Features from Scale-Invariant Keypoints — SIFT (Lowe, 2004)](https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf) | Classical local features, invariance and matching | Compare matching failures across blur, scale and repeated texture |
| [ImageNet Classification with Deep Convolutional Neural Networks — AlexNet (2012)](https://proceedings.neurips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html) | Modern deep-vision training inflection point | Explain which gains came from model, data, compute and regularization |
| [Deep Residual Learning for Image Recognition — ResNet (2016)](https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html) | Optimization and scalable backbones | Run a residual/non-residual depth ablation |
| [Faster R-CNN (2015)](https://proceedings.neurips.cc/paper/2015/hash/14bfa6bb14875e45bba028a21ed38046-Abstract.html) | Two-stage detection and proposal learning | Trace targets, anchors/proposals, losses and inference bottlenecks |
| [Focal Loss for Dense Object Detection (2017)](https://openaccess.thecvf.com/content_ICCV_2017/html/Lin_Focal_Loss_for_ICCV_2017_paper.html) | Imbalance and one-stage detection | Plot gradient contribution by confidence/class frequency |
| [U-Net (2015)](https://arxiv.org/abs/1505.04597) | Dense prediction and skip connections | Reproduce a small segmentation baseline and boundary error analysis |
| [Mask R-CNN (2017)](https://openaccess.thecvf.com/content_ICCV_2017/html/He_Mask_R-CNN_ICCV_2017_paper.html) | Detection plus instance segmentation; alignment | Explain RoIAlign and test localization sensitivity |
| [End-to-End Object Detection with Transformers — DETR (2020)](https://www.ecva.net/papers/eccv_2020/papers_ECCV/html/832_ECCV_2020_paper.php) | Set prediction, matching and transformer detection | Implement Hungarian matching on a toy batch; explain convergence cost |
| [An Image Is Worth 16x16 Words — ViT (2021)](https://openreview.net/forum?id=YicbFdNTTy) | Transformer vision backbone and scaling | Compare inductive bias/data needs with a CNN |
| [Learning Transferable Visual Models From Natural Language Supervision — CLIP (2021)](https://proceedings.mlr.press/v139/radford21a.html) | Contrastive image-text pretraining and open vocabulary | Build a small zero-shot evaluation with prompt sensitivity |
| [Masked Autoencoders Are Scalable Vision Learners — MAE (2022)](https://openaccess.thecvf.com/content/CVPR2022/html/He_Masked_Autoencoders_Are_Scalable_Vision_Learners_CVPR_2022_paper.html) | Self-supervised pretraining and asymmetric compute | Explain mask ratio and encoder/decoder compute trade-off |
| [Hidden Technical Debt in Machine Learning Systems (2015)](https://proceedings.neurips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) | Why deployed ML is more than model code | Map entanglement, data dependencies and feedback loops to your project |
| [The ML Test Score (Google, 2017)](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) | Concrete production-readiness testing rubric | Score a portfolio project and close its two weakest categories |

## Tier 2A — Google-style large-scale and multimodal vision

These are especially useful for Google Geo, Research, Cloud, and multimodal
roles. Relevance is inferred from current postings, not an official reading
requirement.

| Primary source | Focus | Checkpoint |
|---|---|---|
| [Swin Transformer (2021)](https://openaccess.thecvf.com/content/ICCV2021/html/Liu_Swin_Transformer_Hierarchical_Vision_Transformer_Using_Shifted_Windows_ICCV_2021_paper.html) | Hierarchical/local attention for dense vision | Compare attention complexity by resolution |
| [DINO — Emerging Properties in Self-Supervised ViTs (2021)](https://openaccess.thecvf.com/content/ICCV2021/html/Caron_Emerging_Properties_in_Self-Supervised_Vision_Transformers_ICCV_2021_paper.html) | Self-distillation and emergent localization | Inspect attention maps and test representation transfer |
| [DINOv2 (2023)](https://arxiv.org/abs/2304.07193) | Curated self-supervised data and general-purpose features | Compare frozen-feature performance on two downstream tasks |
| [OWL-ViT — Simple Open-Vocabulary Object Detection (2022)](https://arxiv.org/abs/2205.06230) | Image-text pretraining transferred to open-vocabulary detection | Test base/novel category and prompt failure slices |
| [Sigmoid Loss for Language Image Pre-Training — SigLIP (2023)](https://openaccess.thecvf.com/content/ICCV2023/html/Zhai_Sigmoid_Loss_for_Language_Image_Pre-Training_ICCV_2023_paper.html) | Pairwise sigmoid alternative to global softmax contrastive loss | Derive objective and discuss distributed-training implications |
| [Segment Anything (2023)](https://openaccess.thecvf.com/content/ICCV2023/html/Kirillov_Segment_Anything_ICCV_2023_paper.html) | Promptable segmentation and data engine | Evaluate prompt, object-size and domain-shift slices |
| [Scaling Vision Transformers to 22 Billion Parameters (2023)](https://research.google/pubs/scaling-vision-transformers-to-22-billion-parameters/) | Vision scaling, stability, transfer and robustness | Extract which engineering changes enable scale; estimate adaptation cost |
| [TensorFlow: A System for Large-Scale Machine Learning (OSDI 2016)](https://www.usenix.org/conference/osdi16/technical-sessions/presentation/abadi) | Distributed ML dataflow and system architecture | Draw training/serving fault and communication boundaries |
| [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) | Official Google production-ML guidance | Turn five rules into automated project checks |
| [ML Pipelines](https://developers.google.com/machine-learning/managing-ml-projects/pipelines) | Official lifecycle/freshness/versioning guidance | Design retraining, validation, promotion and rollback workflow |

## Tier 2B — NVIDIA-style GPU and deployment systems

These sources support the performance evidence repeatedly requested in NVIDIA
postings. Documentation entries are primary official technical references.

| Primary source | Focus | Checkpoint |
|---|---|---|
| [Roofline: An Insightful Visual Performance Model (2009)](https://dl.acm.org/doi/10.1145/1498765.1498785) | Arithmetic intensity and hardware limits | Place one measured operator/kernel on a roofline and defend the next optimization |
| [TVM: An Automated End-to-End Optimizing Compiler for Deep Learning (OSDI 2018)](https://www.usenix.org/conference/osdi18/presentation/chen) | Graph/operator scheduling and hardware-specific optimization | Explain separation of graph and tensor optimization |
| [Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations (2019)](https://dl.acm.org/doi/10.1145/3315508.3329973) | Productive custom GPU kernels | Implement or inspect a tiled operation; compare correctness and profile |
| [MLPerf Inference Benchmark (2019)](https://arxiv.org/abs/1911.02549) | Reproducible inference scenarios and metrics | Map your benchmark to offline/server/single-stream style constraints |
| [CUDA Programming Guide](https://docs.nvidia.com/cuda/cuda-programming-guide/) | Official CUDA execution, memory and synchronization model | Explain kernels, warps, streams, memory hierarchy and asynchronous execution |
| [CUDA C++ Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/) | Official correctness and optimization workflow | Profile one kernel; test coalescing, transfers and launch configuration |
| [TensorRT Performance Best Practices](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/best-practices.html) | Official measure-then-optimize inference path | Produce `trtexec` baseline, layer profile and one validated optimization |
| [TensorRT Performance Benchmarking](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/benchmarking.html) | Stable latency/throughput measurement | Report warm-up, p50/p95/p99, throughput, clocks/power conditions and raw data |
| [DeepStream SDK Developer Guide](https://docs.nvidia.com/metropolis/deepstream/dev-guide/) | Streaming multi-source vision deployment | Build or design bounded multi-stream pipeline with backpressure and metrics |
| [Nsight Systems User Guide](https://docs.nvidia.com/nsight-systems/UserGuide/) | CPU/GPU timeline profiling | Capture an annotated trace and identify idle gaps, copies and synchronization |

## Tier 3 — 3D perception, BEV, tracking and sensor fusion

Read at least six for NVIDIA perception or autonomous-driving preparation.

| Primary source | Focus | Checkpoint |
|---|---|---|
| [PointNet (2017)](https://openaccess.thecvf.com/content_cvpr_2017/html/Qi_PointNet_Deep_Learning_CVPR_2017_paper.html) | Permutation-invariant point-set learning | Explain symmetry function and missing local structure |
| [PointPillars (2019)](https://openaccess.thecvf.com/content_CVPR_2019/html/Lang_PointPillars_Fast_Encoders_for_Object_Detection_From_Point_Clouds_CVPR_2019_paper.html) | Efficient point-cloud encoding for detection | Profile encoding/detection split and distance slices |
| [CenterPoint (2021)](https://openaccess.thecvf.com/content/CVPR2021/html/Yin_Center-Based_3D_Object_Detection_and_Tracking_CVPR_2021_paper.html) | Center-based 3D detection and tracking | Trace targets, decoding, velocity and association |
| [Lift, Splat, Shoot (2020)](https://www.ecva.net/papers/eccv_2020/papers_ECCV/html/2114_ECCV_2020_paper.php) | Camera images lifted into BEV | Derive lift/splat coordinate flow and depth uncertainty |
| [BEVFormer (2022)](https://www.ecva.net/papers/eccv_2022/papers_ECCV/html/694_ECCV_2022_paper.php) | Spatiotemporal transformer BEV from cameras | Diagram spatial/temporal attention and ego-motion alignment |
| [BEVFusion (2022/2023)](https://arxiv.org/abs/2205.13542) | Unified camera-LiDAR BEV fusion | Compare sensor-failure and calibration-error behavior |
| [SORT (2016)](https://arxiv.org/abs/1602.00763) | Kalman filtering and assignment baseline | Implement filter/IoU association and expose identity-switch failures |
| [ByteTrack (2022)](https://www.ecva.net/papers/eccv_2022/papers_ECCV/html/315_ECCV_2022_paper.php) | Associating low-score detections | Reproduce threshold/occlusion trade-offs |
| [ORB-SLAM2 (2017)](https://arxiv.org/abs/1610.06475) | Feature-based monocular/stereo/RGB-D SLAM | Identify tracking, local mapping, loop closure and scale failure modes |
| [NeRF (2020)](https://www.ecva.net/papers/eccv_2020/papers_ECCV/html/1473_ECCV_2020_paper.php) | Neural scene representation and volume rendering | Derive rendering equation and measure training/render cost |
| [3D Gaussian Splatting for Real-Time Radiance Field Rendering (2023)](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) | Explicit neural rendering with real-time emphasis | Compare representation, optimization, quality, memory and rendering speed with NeRF |
| [nuScenes Dataset (2020)](https://openaccess.thecvf.com/content_CVPR_2020/html/Caesar_nuScenes_A_Multimodal_Dataset_for_Autonomous_Driving_CVPR_2020_paper.html) | Multimodal AV data and evaluation | Audit sensor timing, coordinate frames, classes and metric limitations |
| [Waymo Open Dataset (2020)](https://openaccess.thecvf.com/content_CVPR_2020/html/Sun_Scalability_in_Perception_for_Autonomous_Driving_Waymo_Open_Dataset_CVPR_2020_paper.html) | Large-scale multi-sensor perception data | Compare range, geography, label and evaluation design with nuScenes |

## Suggested 12-week reading sequence

| Week | Required pair | Deliverable |
|---|---|---|
| 1 | RANSAC + SIFT | Robust matching/geometry experiment |
| 2 | ResNet + U-Net or Faster R-CNN | Architecture and failure comparison |
| 3 | Focal Loss + DETR | Assignment/imbalance derivation and toy implementation |
| 4 | ViT + MAE | CNN/transformer/self-supervision memo |
| 5 | CLIP + OWL-ViT or SigLIP | Open-vocabulary evaluation with prompt/data slices |
| 6 | Hidden Technical Debt + ML Test Score | Production-readiness audit |
| 7 | Google: TensorFlow + Rules of ML; NVIDIA: Roofline + CUDA Guide | Track-specific system diagram or profile |
| 8 | Google: DINOv2 + SAM; NVIDIA: TVM/Triton + TensorRT docs | Transfer experiment or kernel/engine report |
| 9 | PointNet + PointPillars/CenterPoint | 3D representation comparison |
| 10 | Lift-Splat-Shoot + BEVFormer/BEVFusion | BEV/fusion design review |
| 11 | SORT/ByteTrack + ORB-SLAM2 | Temporal estimation and failure lab |
| 12 | NeRF + 3D Gaussian Splatting | Research-to-product performance memo |

## Paper discussion checkpoint

A paper is complete only when you can answer without notes:

- What breaks if its core assumption is false?
- Which result most strongly supports the claimed contribution?
- Which ablation is missing?
- How would data distribution or sensor failure change the result?
- What is the training and deployment cost?
- What simpler baseline would you ship first?
- How would you monitor it in production?
- Which part would you reproduce in one week, and what outcome would falsify
  your current belief?

## Reading log template

| Date | Paper/source | 2-minute talk | Reproduction | Key failure | System implication | Follow-up |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | | link | link | | | |
