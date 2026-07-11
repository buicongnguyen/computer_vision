# University course sources

This independent study curriculum uses the official university courses below only as references for topic selection, sequencing, and assessment design. All explanations, multiple-choice questions, coding exercises, diagrams, projects, and solutions in this repository are original unless a separate file explicitly says otherwise.

> This project is independent and is not affiliated with, sponsored by, or endorsed by Stanford University, Carnegie Mellon University, the University of Michigan, MIT, UC Berkeley, or Georgia Tech. Course names and institutional marks belong to their respective owners.

Sources were checked on **2026-07-11**. Course pages change, and archived offerings may not describe the next offering.

## How the sources inform the curriculum

The curriculum deliberately follows the development of computer vision ideas:

1. image formation and signal processing;
2. local features, transformations, and projective geometry;
3. calibration, stereo, reconstruction, motion, and tracking;
4. classical recognition and statistical estimation;
5. neural-network optimization and convolutional architectures;
6. detection, segmentation, video, and multimodal perception;
7. transformers, self-supervision, generative models, and foundation models;
8. neural 3D representations and embodied perception;
9. an original autonomous-perception extension covering inverse perspective mapping and BEV systems.

The surveyed course descriptions do not present bird's-eye-view conversion as a standalone course unit. This repository therefore treats BEV as an original extension: camera calibration and multi-view geometry supply the mathematical foundation, while separately cited primary papers supply modern lift-to-BEV and temporal-fusion methods.

## Stanford University

### CS231n: Deep Learning for Computer Vision — Spring 2026

CS231n informs the modern deep-learning sequence: optimization and backpropagation, CNNs, recurrent models, attention and transformers, detection and segmentation, video, distributed training, self-supervision, generative models, 3D vision, vision-language learning, and robot learning. Its mixture of written reasoning and programming motivates the theory-plus-code format used here. Its staged project process—proposal, related work, technical approach, preliminary results, final report, code, and poster—informs the capstone checkpoints.

- [Official schedule](https://cs231n.stanford.edu/schedule)
- [Official assignments overview](https://cs231n.stanford.edu/assignments.html)
- [Official project guide](https://cs231n.stanford.edu/2026/project.html)

Access note: current lecture videos link to Stanford Canvas. Public slides and notes may be read at their official locations, but this repository does not redistribute them.

### CS231A: Computer Vision, From 3D Perception to 3D Reconstruction and Beyond — Spring 2025

CS231A is the principal reference for the geometry sequence: camera models and calibration, single-view metrology, epipolar geometry, stereo, structure from motion, fitting, monocular depth, feature tracking, optical and scene flow, optimal estimation, neural radiance fields, and Gaussian splatting. These topics provide the prerequisites for the repository's calibration, coordinate-frame, inverse-perspective-mapping, and BEV modules.

- [Official course page](https://web.stanford.edu/class/cs231a/)
- [Official syllabus](https://web.stanford.edu/class/cs231a/syllabus.html)
- [Official self-contained course notes index](https://web.stanford.edu/class/cs231a/course_notes.html)
- [Official assignments and collaboration policy](https://web.stanford.edu/class/cs231a/assignments.html)

Access note: the course policy asks students not to consult online implementations. We link to the official notes for personal study but do not reproduce problem sets, code, answers, slides, or figures.

## Carnegie Mellon University

### 16-385: Computer Vision — Spring 2026

CMU 16-385 informs the first-principles laboratory progression: filtering and frequency methods, Hough transforms, corners and descriptors, 2D transformations, homographies, camera models, two-view geometry, stereo, scene recognition, neural recognition, optical flow, tracking, radiometry, reflectance, and computational photography. Its applied sequence motivates original labs on filtering and Hough voting, planar augmented reality, reconstruction, classical recognition, neural recognition, and tracking.

- [Official course home](https://16385.courses.cs.cmu.edu/spring2026/)
- [Official course information](https://16385.courses.cs.cmu.edu/spring2026/courseinfo)
- [Official assignment index](https://16385.courses.cs.cmu.edu/spring2026/assignments)
- [Official notebooks and interactive demos](https://16385.courses.cs.cmu.edu/spring2026/notebooks)

Access note: the official policy specifically requires student assignment repositories to remain private and prohibits publishing assignment solutions. The exercises in this repository are newly authored and are not CMU assignment solutions.

### 16-720: Graduate Computer Vision — Spring 2026

CMU's graduate course is a supplementary reference for deeper treatment of classical and learned vision. Publicly indexed current material confirms an implementation-focused treatment of inverse-compositional Lucas–Kanade tracking and background subtraction. Because the current main course site was not consistently accessible during verification, this curriculum does not claim a complete Spring 2026 topic list.

- [Official course site](https://16720.courses.cs.cmu.edu/)
- [Official instructor page confirming the Spring 2026 offering](https://www.cs.cmu.edu/~deva/)
- [Official current Lucas–Kanade homework handout](https://16720.courses.cs.cmu.edu/hw/hw3.pdf)

Access note: the homework is linked only to identify the official course and its implementation emphasis; no prompt, starter code, data, or solution is copied here.

## University of Michigan

### EECS 498.008 / 598.008: Deep Learning for Computer Vision — Winter 2022

Michigan's course informs the coding and assessment pattern. It progresses from classifiers, optimization, backpropagation, and CNN engineering to efficient architectures, detection, segmentation, recurrent models, transformers, generative models, interpretability, self-supervision, 3D vision, and video. Its six PyTorch assignments, mixed-format midterm, and end-to-end mini-project motivate original MCQs, coding labs, and pipeline projects in this repository.

- [Official course home](https://web.eecs.umich.edu/~justincj/teaching/eecs498/WI2022/)
- [Official detailed schedule](https://web.eecs.umich.edu/~justincj/teaching/eecs498/WI2022/schedule.html)
- [Official syllabus and assessment format](https://web.eecs.umich.edu/~justincj/teaching/eecs498/WI2022/syllabus.html)
- [Official mini-project guide](https://web.eecs.umich.edu/~justincj/teaching/eecs498/WI2022/project.html)

Access note: Winter 2022 recordings are restricted to Michigan users; the course page separately links public Fall 2019 recordings. Its collaboration policy prohibits using online solutions, so this repository does not reproduce its assignments or answers.

## Massachusetts Institute of Technology

### 6.4300 Introduction to Computer Vision and 6.8300 Advances in Computer Vision

The current MIT catalog informs the bridge from early, middle, and high-level vision to contemporary research. The introductory description connects image analysis, transformations, reconstruction, motion, and tracking with CNNs and transformers. The graduate description adds learned multi-view geometry, differentiable rendering, neural scene representations, correspondence, optical flow, point tracking, diffusion, contrastive and masked representation learning, and vision for embodied agents. This breadth informs the repository's neural-3D and embodied-perception units.

- [Official MIT EECS catalog — Vision section](https://catalog.mit.edu/subjects/6/#vision)

### 6.819 / 6.869: Advances in Computer Vision — Spring 2022 archive

The archived course provides an additional project-based precedent spanning early through high-level vision and machine learning. Its problem-set and final-project structure informs the balance between focused practice and open-ended investigation.

- [Official MIT CSAIL course archive](https://6.869.csail.mit.edu/sp22/)

Access note: the catalog is authoritative for current subject descriptions, while the 2022 site is an archived offering. Neither is treated as a license to republish course assets.

## University of California, Berkeley

### CS 280A: Introduction to Computer Vision and Computational Photography — Fall 2026

Berkeley CS 280A informs the practical, from-scratch path through image formation, spatial and frequency processing, Gaussian and Laplacian pyramids, homographies and warping, calibration, stereo, multi-view geometry, structure from motion, the plenoptic function, and CNN-based image manipulation. Its learning outcome reinforces the repository's emphasis on implementing core algorithms before relying on high-level libraries.

- [Official CS 280A catalog and Fall 2026 listing](https://www2.eecs.berkeley.edu/Courses/CS280A/)
- [Official graduate CS C280 catalog](https://www2.eecs.berkeley.edu/Courses/CSC280/)

Access note: Berkeley's detailed course archives require CalNet, and the Fall 2026 listing states that lecture recordings are not available. This repository uses only the public official descriptions.

## Georgia Institute of Technology

### CS 6476: Computer Vision — Spring 2026

Georgia Tech CS 6476 informs the theory-to-practice discipline: image formation, camera geometry and calibration, feature detection and matching, stereo, motion estimation, tracking, recognition, and scene understanding. Its stated practice of understanding and often coding basic methods before relying on vision libraries motivates the two-stage coding labs used here.

- [Official OMSCS course page](https://omscs.gatech.edu/cs-6476-computer-vision)
- [Official Spring 2026 syllabus](https://syllabus.gatech.edu/sites/default/files/2026-04/OMSCS6476%40GATech-2026%20-%20Information_Syllabus.pdf)

Access note: public course content requires an Ed Lessons account. The Spring 2026 syllabus says course work products must not be shared on public sites. This repository therefore links to the course and publishes only independently created work.

## Robotics and autonomous-systems extensions

The computer-vision courses above do not by themselves define a complete
self-driving stack. The following official courses extend the study path from
3D perception into state estimation, SLAM, planning, control, and uncertainty.

### Stanford CS237A: Principles of Robot Autonomy I

CS237A connects perception and localization with SLAM, nonlinear control,
motion planning, and decision-making under uncertainty. It is the main Stanford
reference for the autonomy layer that follows CS231A geometry.

- [Official Stanford Bulletin description](https://bulletin.stanford.edu/courses/2185453)

### MIT 16.485: Visual Navigation for Autonomous Vehicles

MIT VNAV provides a rigorous bridge through multi-view geometry, calibration,
visual-inertial navigation, place recognition, optimization on manifolds, and
SLAM, with real-time ROS/OpenCV/C++ labs.

- [Official MIT OpenCourseWare syllabus](https://ocw.mit.edu/courses/16-485-visual-navigation-for-autonomous-vehicles-vnav-fall-2020/pages/syllabus/)

### Carnegie Mellon 16-833: Robot Localization and Mapping

CMU 16-833 focuses on probabilistic localization, mapping, real-time inference,
and scalable SLAM systems. The catalog description is used only to establish
topic scope; no course assignments or solutions are reproduced.

- [Official CMU Robotics catalog](https://coursecatalog.web.cmu.edu/schools-colleges/schoolofcomputerscience/robotics/)

These courses inform original lessons and labs in this repository. They do not
imply university authorship, endorsement, equivalent credit, or permission to
republish restricted course assets.

## Reuse and attribution policy

- Do not copy university slides, diagrams, assignment text, starter code, datasets, answer keys, or recordings into this repository unless the item has an explicit compatible license and that license is preserved.
- Link to the official page instead of mirroring an asset.
- Cite a source near any close paraphrase and use quotation marks for the rare short quotation.
- Preserve the license and attribution of any separately reused open-source code or data.
- Do not imply university authorship, affiliation, approval, or equivalence to university credit.
- Keep all MCQs, coding tasks, tests, solutions, and project rubrics original so the public repository cannot serve as a solution bank for an active course.
