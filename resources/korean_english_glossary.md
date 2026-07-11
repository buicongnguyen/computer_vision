# Korean-English Glossary for Computer Vision and Autonomy Applications

Use this glossary to read Korean job descriptions, write a bilingual project
summary, and avoid literal translations that sound unnatural in an engineering
interview. Terms were checked against current 42dot and Hyundai recruiting and
technical pages on **2026-07-11 (Asia/Seoul)**.

Context controls the translation. For example, `인지` in an autonomous-driving
posting usually means **perception**, not human cognition, while `검증` may mean
verification, validation, or both depending on what is being checked.

## Recruiting and application

| Korean | Preferred English | Usage note |
|---|---|---|
| 채용공고 / 공고 | job posting / opening | `공고를 확인하다` = review the posting. |
| 지원자 | applicant / candidate | Candidate is more natural once interviewing. |
| 지원하다 | apply | Do not translate as “support.” |
| 경력직 / 경력채용 | experienced hire / experienced hiring | Not “career position.” |
| 상시채용 | rolling recruitment / always-open hiring | Verify that the individual vacancy is still active. |
| 서류전형 | application or resume screening | May include more than a resume. |
| 코딩테스트 | coding test / coding assessment | Current 42dot senior postings name the stage but not its syllabus. |
| 화상면접 | virtual/video interview | `화상면접 1시간 내외` = approximately one-hour virtual interview. |
| 대면면접 | onsite / in-person interview | If the posting says 대면 혹은 화상, use onsite or virtual. |
| 면접전형 | interview stage/process | Broader than one interview. |
| 직무면접 | role-specific / technical interview | In engineering contexts, often technical. |
| 인성검사 | personality assessment | Hyundai's general experienced process lists this; current 42dot senior pages do not. |
| 과제 | take-home assignment / interview exercise | Translate from context, not always “homework.” |
| 평판조회 | reference check | The recent 42dot perception posting says it may occur with consent. |
| 채용검진 | pre-employment medical examination | Hyundai context; do not add it to the 42dot loop unless stated. |
| 처우협의 | compensation/offer discussion | `처우` includes compensation and employment terms. |
| 최종합격 | final acceptance / successful final result | In English process diagrams, “offer” is often more natural. |
| 입사 | join the company / employment start | `입사일` = start date. |
| 수습기간 | probationary period | `3개월의 수습기간` = a three-month probationary period. |
| 정규직 | permanent/full-time employee | Korean `정규직` is not always identical to US “full-time”; use posting context. |
| 근무지 | work location | Current roles specify Pangyo, South Korea. |
| 직무 | role / job function | Avoid “duty” when referring to the whole role. |
| 주요업무 | responsibilities / key responsibilities | Standard JD heading. |
| 자격요건 | qualifications / minimum qualifications | Treat as required unless the posting says otherwise. |
| 우대사항 | preferred qualifications | Valuable but not necessarily mandatory. |
| 관련 분야 | relevant/related field | Name the field rather than repeating this phrase in a resume. |
| 동등한 경력 | equivalent practical experience | Common alternative to a named degree. |
| 유관 경력 | relevant experience | Explain relevance by problem and scope. |
| 경력 7년차 이상 | 7+ years of relevant experience | The bilingual 42dot Senior CV page explicitly renders it as 7+ years; do not minimize it to “in year seven.” |
| 박사 졸업 예정자 | PhD candidate nearing graduation / expected PhD graduate | Use the expected completion month in application forms. |
| 경력기술서 | detailed career description / experience statement | A structured account of responsibilities and achievements. |
| 재직증명서 | certificate of employment | Usually an official HR document, not a resume. |
| 경력증명서 | employment/career certificate | May be requested for verification later. |
| 보훈대상자 | eligible veteran / person eligible for veterans' preference | Use only when legally applicable. |
| 취업보호대상자 | person eligible for employment protection/preference | Statutory Korean category; follow the form wording. |
| 장애인 등록증 소지자 | registered person with a disability | Use the designated application field when applicable. |
| 병역필 / 병역면제 | military service completed / exempt | Hyundai lists this for men in its general eligibility; do not assume it is a 42dot rule unless stated. |
| 주민등록번호 | Korean resident-registration number | Current 42dot perception guidance says not to put it in the resume. |

## Autonomy and robotics

| Korean | Preferred English | Usage note |
|---|---|---|
| 자율주행 | autonomous driving | “Self-driving” is fine in general prose; use autonomous driving in technical material. |
| 첨단 운전자 보조 시스템 | advanced driver-assistance system (ADAS) | Assistance is not full autonomy. |
| 자율주행 인지 | autonomous-driving perception | `인지 모델` = perception model. |
| 판단 | decision-making | In the stack: perception, prediction, planning/decision and control. |
| 경로 계획 / 주행 계획 | path/motion planning | Use motion planning when dynamics and time matter. |
| 제어 | control | `차량 제어` = vehicle control. |
| 측위 | localization / positioning | Localization is natural for pose within a map; positioning can describe a global position service. |
| 지도 작성 | mapping | `측위 및 지도 작성` = localization and mapping. |
| 동시적 위치추정 및 지도작성 | simultaneous localization and mapping (SLAM) | Usually keep SLAM after the first expansion. |
| 주행가능영역 | drivable area | Not simply “road segmentation.” |
| 운행 설계 영역 | operational design domain (ODD) | State weather, roads, speed, geography and sensor assumptions. |
| 실차 | real vehicle / on-vehicle | `실차 검증` = real-vehicle validation. |
| 차량 탑재 | in-vehicle/on-device deployment | Stronger than offline inference. |
| 양산 | mass production / productionization | Automotive-grade release, not merely a prototype launch. |
| 상용화 | commercialization | Business/market deployment; distinct from mass production. |
| 선행개발 | advanced development / pre-production R&D | Not “front-end development.” |
| 고장 안전 | fail-safe | State the safe behavior and fault assumptions. |
| 기능 안전 | functional safety | Often relates to ISO 26262; do not claim compliance without evidence. |
| 최소 위험 상태 | minimal risk condition | A defined safe condition after a severe fault. |

## Geometry, perception and fusion

| Korean | Preferred English | Usage note |
|---|---|---|
| 컴퓨터 비전 | computer vision | Both `컴퓨터비전` and spaced form occur. |
| 인지 / 인식 | perception / recognition | In AD environment understanding, prefer perception. Recognition may be correct for a specific classification/identity task. |
| 객체 검출 | object detection | `검출` is not “inspection.” |
| 객체 추적 | object tracking | Multi-object tracking = 다중 객체 추적. |
| 다중 카메라 다중 객체 추적 | multi-camera multi-object tracking (MCMOT) | 42dot provides an official dataset for this. |
| 자세 추정 | pose estimation | `자세` can mean orientation alone or full pose; define translation/rotation. |
| 객체 자세 추정 | object pose estimation | Current Senior CV responsibility. |
| 형상 모델링 | shape modeling | `3D shape modeling and processing`. |
| 깊이 추정 | depth estimation | State monocular, stereo or multi-view. |
| 3차원 재구성 | 3D reconstruction | Distinguish dense, sparse, object and scene reconstruction. |
| 장면 이해 | scene understanding | A broad umbrella; name the output representation. |
| 장면 완성 | scene completion | `semantic scene completion` includes occupancy plus semantics. |
| 조감도 | bird's-eye view (BEV) | Use BEV after first expansion. |
| 점유 예측 | occupancy prediction | Define occupied, free, unknown and semantic states. |
| 점유 격자 | occupancy grid | Grid resolution and coordinate frame matter. |
| 3차원 객체 검출 | 3D object detection | Report range, center/yaw/dimension error, not only AP. |
| 포인트 클라우드 | point cloud | Usually LiDAR/depth-derived. |
| 차선 검출 | lane detection | 42dot provides the official SDLane dataset. |
| 가림 / 폐색 | occlusion | `가려짐` is common plain Korean. Distinguish truncation. |
| 부분 관측 | partial observation | Not the same as label missingness. |
| 깊이 모호성 | depth ambiguity | Especially important for camera-based 3D perception. |
| 미관측 영역 | unobserved region | Do not silently label it free space. |
| 희귀 객체 / 미지 객체 | rare / unknown object | Define open-set behavior. |
| 센서 융합 | sensor fusion | Name sensors and fusion level. |
| 다중 센서 | multi-sensor | Prefer hyphenated adjective in English. |
| 공간 정렬 / 공간 정합 | spatial alignment / registration | Registration is natural for estimating alignment; alignment for the resulting condition. |
| 시간 정렬 / 동기화 | temporal alignment / synchronization | Record capture versus arrival time. |
| 캘리브레이션 / 보정 | calibration | `보정` can also mean correction/compensation; use context. |
| 내부 파라미터 | intrinsic parameters / intrinsics | Camera focal length, principal point and distortion model. |
| 외부 파라미터 | extrinsic parameters / extrinsics | Rigid relation between frames. |
| 투영 | projection | `역투영` = back-projection/unprojection. |
| 좌표 변환 | coordinate transformation | Always name direction and convention. |
| 좌표계 | coordinate frame/system | Frame is usually more natural for robotics transforms. |
| 기준 좌표계 | reference frame | Ego, world/map, camera, LiDAR, radar, etc. |
| 자차 / 에고 차량 | ego vehicle | `ego pose` = 자차 자세/위치자세. |
| 자차 운동 | ego motion | Compensate before temporal aggregation when appropriate. |
| 상태 추정 | state estimation | State and uncertainty must be defined. |
| 비선형 최적화 | nonlinear optimization | Common in calibration, SLAM and bundle adjustment. |
| 번들 조정 | bundle adjustment | Usually retain the established English term in mixed technical speech. |
| 시각 관성 주행계 | visual-inertial odometry (VIO) | Distinguish odometry from global localization. |
| 거리 측정 / 주행 거리 추정 | ranging / odometry | `odometry` is motion estimation, not ordinary distance measurement. |

## Learning, data and evaluation

| Korean | Preferred English | Usage note |
|---|---|---|
| 학습 | training / learning | Model training versus representation learning depends on context. |
| 추론 | inference | `추론 시간` = inference latency/time. |
| 자기지도학습 | self-supervised learning | Not the same as unsupervised learning. |
| 모방학습 | imitation learning (IL) | Common in E2E/Physical AI roles. |
| 강화학습 | reinforcement learning (RL) | State online/offline/model-based context. |
| 표현 학습 | representation learning | Define downstream task. |
| 대규모 비라벨 데이터 | large-scale unlabeled data | “Unlabeled,” not “non-label.” |
| 주석 / 어노테이션 | annotation | `라벨` is also common. |
| 데이터 선별 | data selection/curation | Curation includes quality and composition, not only filtering. |
| 능동학습 | active learning | Specify selection signal and labeling loop. |
| 의사 라벨 | pseudo-label | Record teacher/version/confidence policy. |
| 지식 증류 | knowledge distillation | Offline teacher to efficient student is relevant to 42dot's blog example. |
| 실패 사례 | failure case | More natural than “failure example” in many reports. |
| 오류 분석 | error analysis | Include taxonomy and scenario IDs. |
| 어려운 사례 | hard case / challenging example | Define selection rule rather than relying on intuition. |
| 데이터 누수 | data leakage | Check entity, geography, time and derived-label leakage. |
| 클래스 불균형 | class imbalance | Report rare-class effect. |
| 일반화 | generalization | State the shift: geography, weather, hardware, class, etc. |
| 강건성 | robustness | “Robustness,” not “robustness ability.” |
| 도메인 적응 | domain adaptation | State labeled/unlabeled target assumptions. |
| 손실 함수 | loss function | `loss 설계` = loss design. |
| 학습 안정성 | training stability | Show curves, variance and failure rate. |
| 정량 평가 | quantitative evaluation | Metrics and uncertainty. |
| 정성 평가 | qualitative evaluation | Stable sample IDs and taxonomy, not cherry-picking. |
| 평가 지표 | evaluation metric | Tie to product/safety behavior. |
| 평가 슬라이스 | evaluation slice | “Slice” is common in ML; explain it to mixed audiences. |
| 정밀도 | precision | Do not confuse with numeric precision (`수치 정밀도`). |
| 재현율 | recall | In Korean ML material, `검출률` may be used informally; define precisely. |
| 오탐 | false positive | Predicted an object/event that was absent. |
| 미탐 | false negative / missed detection | Safety relevance often differs by class/range. |
| 회귀 테스트 | regression test | `성능 회귀` = performance regression. |
| 폐루프 시뮬레이션 | closed-loop simulation | Offline replay is not automatically closed loop. |
| 월드 모델 | world model | Define predicted state/observation and control conditioning. |

## Production and performance

| Korean | Preferred English | Usage note |
|---|---|---|
| 실시간 | real-time | Always state deadline, hardware, batch and percentiles. |
| 지연시간 | latency | End-to-end versus model-only must be explicit. |
| 처리량 | throughput | Samples/frames per second under stated concurrency. |
| 메모리 사용량 | memory usage/footprint | State CPU/GPU and peak/steady-state. |
| 자원 사용량 | resource usage | Compute, memory, power, bandwidth and storage as relevant. |
| 정확도-성능 절충 | accuracy-performance trade-off | In English, name the actual axes: accuracy/latency/memory. |
| 병렬 프로그래밍 | parallel programming | CUDA/OpenCL are named preferences in the Senior CV snapshot. |
| 시스템 최적화 | system optimization | Profile before claiming improvement. |
| 모델 경량화 | model compression/optimization | May include pruning, distillation, quantization, architecture. |
| 양자화 | quantization | State INT8/FP8/etc. and calibration method. |
| 모델 변환 | model conversion/export | Example: PyTorch to ONNX/TensorRT. |
| 시스템 통합 | system integration | Stronger than running a model in isolation. |
| 탑재 환경 | target/on-device environment | Name hardware, runtime, OS and power mode. |
| 배포 | deployment | Vehicle, edge or cloud context matters. |
| 프로파일링 | profiling | Name tool, scope and synchronization method. |
| 병목 | bottleneck | `병목을 해소하다` = remove/relieve a bottleneck. |
| 재현 가능성 | reproducibility | Record code, data, config, seed and environment. |
| 모니터링 | monitoring | Include data, model, sensor and systems health. |
| 롤백 | rollback | State trigger and compatible artifact/data versions. |
| 지속적 통합/배포 | continuous integration/deployment (CI/CD) | Vehicle release controls may differ from web services. |
| 기계학습 운영 | MLOps | Avoid using the label without concrete lifecycle functions. |

## Leadership and project language

| Korean | Preferred English | Usage note |
|---|---|---|
| 주도하다 | lead / own / drive | Choose based on actual authority and contribution. |
| 담당하다 | be responsible for / own | “Was in charge of” is acceptable but often weaker. |
| 문제 정의 | problem definition/framing | State user/safety effect and metric. |
| 기술 방향성 | technical direction | Explain alternatives and decision mechanism. |
| 로드맵 | roadmap | Include sequencing, owners and risks. |
| 협업 | collaboration | Name teams, interface and decision; do not merely say collaborated. |
| 유관부서 | cross-functional/partner teams | Avoid literal “related departments.” |
| 조직 간 협업 | cross-team/cross-functional collaboration | Current 42dot Way emphasizes work beyond team boundaries. |
| 의사결정 | decision-making / decision | Identify who decided and with what evidence. |
| 이견 | disagreement / dissenting view | `이견을 제기하다` = raise a disagreement/concern. |
| 합의 | agreement/alignment/consensus | Use alignment when the team commits after a decision. |
| 영향력 | influence | Show behavioral or system change, not audience size. |
| 멘토링 / 육성 | mentoring / developing engineers | Include outcomes and independence gained. |
| 이해관계자 | stakeholder | Name product, vehicle, safety, data, platform, etc. |
| 성과 | result / impact / achievement | “Performance” is correct only in some contexts. |
| 개선 | improvement | Quantify the baseline and result. |
| 고도화 | improve / advance / mature | Avoid the literal and unnatural “sophisticate the model.” |
| 기여 | contribution | State exactly what you did. |
| 회고 | retrospective / reflection | `postmortem` is appropriate for an incident/failure review. |

## False friends and translation traps

| Avoid | Better wording | Why |
|---|---|---|
| “I supported the position” | “I applied for the role” | `지원` has different meanings. |
| “I performed model development” | “I designed, trained and deployed the model” | Translate the real actions, not `수행`. |
| “Advanced the model” with no detail | “Reduced distant-pedestrian FN by 12% through range-aware sampling” | `고도화` needs a mechanism and result. |
| “Verified the model” everywhere | “Unit-tested,” “validated on held-out cities,” or “checked numerical parity” | `검증` is context-dependent. |
| “Recognition system” for the full AD stack | “Perception system” | Environment understanding is broader than recognition. |
| “Real-time: 30 FPS” | “Batch-1 end-to-end p95 31 ms on Orin, including pre/post” | Real-time requires method and deadline. |
| “Commercialized” for a prototype | “Deployed in a pilot” or “productionized” | `상용화`, `양산`, pilot and deployment differ. |
| “Participated in fusion development” | “Owned temporal alignment and radar association” | Senior evidence requires ownership. |
| “Improved accuracy by 10%” | “Raised pedestrian AP from 40.0 to 44.0 (+4.0 points, +10% relative)” | Percent versus percentage points must be explicit. |
| “Led many coworkers” | “Led the interface decision across sensor, ML platform and validation teams” | Scope and decision matter more than vague headcount. |

## Bilingual resume phrase bank

Use these as structural examples, not claims to copy.

| Korean | English |
|---|---|
| 카메라-레이더 시공간 정렬 파이프라인을 설계하고 실차 로그의 시간 오차를 진단했습니다. | Designed the camera-radar spatial/temporal alignment pipeline and diagnosed timestamp error in vehicle logs. |
| 외부 파라미터 교란 실험을 통해 캘리브레이션 허용 오차와 열화 모드 진입 기준을 정의했습니다. | Defined calibration tolerances and degraded-mode triggers through extrinsic-perturbation experiments. |
| 거리 및 가림 수준별 오류 분석을 기반으로 원거리 보행자 미탐을 개선했습니다. | Improved missed detections for distant pedestrians using range- and occlusion-sliced error analysis. |
| 카메라 단독, 특징 융합, 후기 융합 기준선을 동일한 데이터 분할에서 비교했습니다. | Compared camera-only, feature-fusion and late-fusion baselines on the same data split. |
| 하드 케이스 선별부터 재학습과 회귀 검증까지 능동학습 루프를 구축했습니다. | Built an active-learning loop from hard-case selection through retraining and regression validation. |
| C++/TensorRT 추론 경로를 최적화하여 정확도 허용 범위 내에서 지연시간을 단축했습니다. | Optimized the C++/TensorRT inference path, reducing latency within the predefined accuracy tolerance. |
| 센서 누락과 지연 프레임을 감지하고 안전한 열화 동작으로 전환하도록 설계했습니다. | Designed detection of missing/stale sensor frames and transition to a safe degraded mode. |
| 데이터, 센서, 플랫폼, 검증 팀과 인터페이스 계약을 합의하고 출시 위험을 관리했습니다. | Aligned interface contracts across data, sensor, platform and validation teams and managed launch risk. |
| 전체 평균은 개선됐지만 핵심 보행자 슬라이스가 회귀하여 출시를 보류했습니다. | Blocked launch because a critical pedestrian slice regressed despite an improved global average. |
| 실패한 가설과 후속 실험을 문서화하여 팀의 평가 기준을 개선했습니다. | Documented a falsified hypothesis and follow-up experiment, improving the team's evaluation practice. |

## Speaking patterns for a technical interview

### State assumptions

```text
가정부터 명확히 하겠습니다. / Let me state the assumptions first.
좌표계는 ...로 정의하겠습니다. / I will define the coordinate frames as ...
실시간의 기준을 p95 100 ms로 두겠습니다. / I will define real-time as a
p95 deadline of 100 ms.
```

### Compare alternatives

```text
두 가지 대안을 비교했습니다. / I compared two alternatives.
정확도뿐 아니라 지연시간과 센서 누락 시 동작을 기준으로 선택했습니다. /
I chose based on latency and missing-sensor behavior as well as accuracy.
```

### Admit uncertainty

```text
현재 증거만으로는 원인을 단정할 수 없습니다. / The current evidence is
not sufficient to determine the cause.
라벨, 캘리브레이션, 모델 오류를 구분하는 실험을 먼저 하겠습니다. / I
would first distinguish label, calibration and model error experimentally.
```

### Explain ownership

```text
제가 직접 결정한 부분은 ...입니다. / The decision I directly owned was ...
팀의 공동 결과와 제 기여를 구분하면 ... / Separating the team result from
my contribution, ...
```

## Practice assignment — bilingual evidence sheet

Create a one-page sheet for one portfolio project.

### Required content

- 120-160 Korean words and 120-160 English words describing the same project.
- One diagram with bilingual labels for frames, sensors and outputs.
- Five metric/system terms from this glossary, with units.
- One failure, one rejected alternative and one ownership statement.
- A 90-second spoken explanation in each language.

### Acceptance criteria

- Korean and English preserve the same baseline, result, units, scope and
  degree of ownership.
- `인지`, `검증`, `고도화`, `적용`, `양산` and `상용화` are translated by
  context rather than mechanically.
- Percentage and percentage-point changes are unambiguous.
- Real-time claims include hardware, batch, timing boundary and percentile.
- A Korean-speaking reviewer and an English-speaking reviewer each identify no
  material technical mismatch.
- The explanation fits 90 seconds without omitting the problem, decision,
  metric, constraint and failure.

## Primary sources

Verified **2026-07-11**.

- [42dot Senior Computer Vision Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d7f9e679-a018-4ab8-933c-3399995f9da8)
- [42dot Senior AI Perception Engineer — official indexed role page](https://stage.42dot.ai/careers/openroles/d03cec6d-f885-4d4a-bfce-76fd81994731)
- [42dot Way](https://www.42dot.ai/careers/way)
- [42dot Active Learning article](https://www.42dot.ai/blog/180)
- [42dot research](https://www.42dot.ai/research)
- [42dot MCMOT dataset](https://42dot.ai/openDataset/ad/mcmot)
- [Hyundai Motor hiring process](https://talent.hyundai.com/apply/applyProcess.hc)
- [Hyundai Motor application-entry guidance](https://talent.hyundai.com/apply/applyWrite.hc)

The official 42dot role pages are bilingual and are the basis for mappings such
as `유관 경력 7년차 이상` to `7+ years of relevant experience`. Re-check the
live [42dot open-roles page](https://www.42dot.ai/careers/openroles) before using
the glossary for an application because titles and wording change.

