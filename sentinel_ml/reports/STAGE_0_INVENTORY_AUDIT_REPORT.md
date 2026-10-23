# SENTINEL ML — STAGE 0: INVENTORY AND AUDIT REPORT

**Date:** 2026-10-20  
**Platform:** SENTINEL (Multi-Source Visual Intelligence & Threat Analysis Platform)  
**Execution Environment:** Windows 11 Home / NVIDIA GeForce RTX 3050 Laptop GPU (6GB VRAM)  
**Author:** Google Antigravity (Senior ML & Defense-AI Systems Architect)

---

## 1. Executive Summary & Existing Architecture Inspection

Before executing any ML tasks, a complete inspection of the SENTINEL codebase was performed:
- **`sentinel/ai-engine`**: FastAPI modular anomaly analysis service hosting M2 (Tiny Object), M3 (Change Detection), and M4 (Camouflage Anomaly Analysis). M4 incorporates multi-cue detectors (geometric regularity, texture entropy/Gabor, temporal difference, vegetation index anomalies, shadow inconsistencies, and contextual classification) combined via spatial IoU association and Bayesian evidence fusion.
- **`sentinel/backend`**: Spring Boot enterprise service handling stream configurations, alert routing, WebSocket dispatch, and audit storage.
- **`sentinel/frontend`**: React + TypeScript + Vite tactical dashboard for real-time visualization and alert review.
- **Integration Points for New ML Work**:
  - The newly initialized `/sentinel_ml` workspace operates completely decoupled from existing production services to ensure zero breakage of Phases 1–4.
  - Exported model checkpoints (PyTorch `.pt`, TorchScript, or ONNX) will seamlessly interface with `ai-engine`'s feature extractors and cue evaluators via standard inference adapters in `/sentinel_ml/exports`.

---

## 2. Hardware Audit & Operational Limits

| Component | Hardware Specification | Operational Constraints & Safety Guidelines |
|---|---|---|
| **GPU** | NVIDIA GeForce RTX 3050 6GB Laptop GPU | Total VRAM: **6,144 MiB**. Max safe training allocation: **4,500 MiB** (leaving ~1.5 GB for OS/display rendering). |
| **CUDA Driver** | Driver 581.86 / CUDA 13.0 Support | Verified PyTorch runtime: `torch 2.6.0+cu124` with native CUDA tensor acceleration. |
| **CPU** | 12th Gen Intel(R) Core(TM) i5-12450HX | 8 physical cores (4 Performance + 4 Efficient), 12 logical processors. |
| **System RAM** | 16.0 GB DDR4/DDR5 | ~4.2 GB currently free physical RAM. Memory-mapped I/O and lightweight generators mandatory. |
| **Disk Storage** | Drive `D:\` | Total: ~268 GB, Free: **33.39 GB**. Large video frame caching must be strictly managed. |
| **Safe Precision** | Mixed Precision (`FP16` via `torch.amp`) | Mandatory to reduce VRAM consumption by ~50% and accelerate Tensor Core math. |
| **Safe Batch Sizes** | 256×256: `8–16` \| 512×512: `4` \| 1024×1024: `2` (with gradient accumulation steps = 4) | Prevents Out-Of-Memory (OOM) exceptions on 6GB VRAM. |
| **Dataloader Workers** | `num_workers = 2` | Windows spawn-based multiprocessing overhead and RAM limits require conservative worker counts. |

---

## 3. Dataset Discovery & Inventory Audit

All original zip archives in `d:\img project` have been verified intact and unmodified. The extracted data inside `d:\img project\sentinel_ml\data` was rigorously audited.

### 3.1 Expected vs. Present Datasets Summary

| Category | Expected Dataset | Status | Files / Images | Modality | Annotations | Splits |
|---|---|---|---|---|---|---|
| **Change Detection** | LEVIR-CD | **Missing** | — | RGB Satellite | — | LEVIR-CD+ present instead |
| | LEVIR-CD+ | **PRESENT** | 2,955 files (985 pairs) | RGB Bi-temporal (1024×1024) | Binary change masks | Train: 637 pairs, Test: 348 pairs |
| | WHU-CD | **PRESENT** | 7,860 files (TIF) | Aerial Optical (512×512) | Building change masks + SHP | Train & Test splits |
| | OSCD (Onera) | **PRESENT** | 1,377 files | Multispectral Sentinel-2 (13-band) | Pixel change masks + GeoJSON | 14 train cities, 10 test cities |
| **Structures / Geometry** | DOTA (v1.5) | **PRESENT** | 2,806 images | High-Res Aerial Optical | OBB (`DOTA-v1.5_train.zip`) & HBB (`DOTA-v1.5_train_hbb.zip`) | Train (1,411), Val (458), Test (937) |
| | SpaceNet | **Missing** | — | — | — | Not provided in archive |
| | xView | **Missing** | — | — | — | Not provided in archive |
| **Camouflage** | COD10K | **PRESENT** | 40,010 files (10,000 imgs) | Natural RGB | Object Mask, Instance Mask, Edge Mask, JSON | Train (6,000), Test (4,000) |
| | CAMO | **PRESENT** | 3,041 files (2,852 imgs) | Natural RGB | COCO-style JSON Few-Shot splits | Split-1 / Few-shot subsets |
| | NC4K | **Missing** | — | — | — | Not provided in archive |
| **Drone Detection** | Anti-UAV (410) | **PRESENT** | 438,807 files (413 seqs) | Dual: Thermal IR & Visible RGB (640×512) | Bounding box `IR_label.json` per sequence | Train (160), Val (90), Test (~160) |
| | CST Anti-UAV | **PRESENT** | 131,098 files (119 seqs) | Thermal Infrared (640×512) | Bounding boxes (`IR_label.json`, `gt.txt`, `exist.txt`) | Multi-sequence benchmark |
| | Multi-Sensor Drone | **PRESENT** (`DroneDetect`) | 1,397 files (650 videos) | Thermal IR (365) + Visible (285) + Audio (90) | MATLAB `.mat` per-frame bounding boxes | Drone, Bird, Airplane, Helicopter |

---

### 3.2 Detailed Dataset Manifests

#### A. Camouflage Datasets
1. **COD10K-v3**
   - **Task:** Camouflaged Object Detection & Boundary Extraction
   - **Modality:** RGB Imagery
   - **Total Images:** 10,000 images (6,000 Train, 4,000 Test)
   - **Total Files:** 40,010 files across 11 subdirectories
   - **Resolution Distribution:** Variable natural resolutions (e.g., 1024×683, 1024×768, 800×533)
   - **Annotation Format:** Pixel-level binary masks (`GT_Object`), instance masks (`GT_Instance`), edge boundaries (`GT_Edge`), and COCO-style JSONs (`Info`).
   - **Splits:** Pre-partitioned into official `Train` and `Test` sets.
   - **Licence:** Academic Research Use Only (Fan et al., CVPR 2020).
   - **Data Quality:** 0 corruptions detected in sampled verification.

2. **CAMO / CAMO-FS**
   - **Task:** Camouflage Object Detection
   - **Modality:** RGB Imagery
   - **Total Images:** 2,852 images
   - **Total Files:** 3,041 files
   - **Annotation Format:** JSON COCO bounding boxes and polygons in `few-shot-annotations/subsplit`.
   - **Licence:** Research use.

#### B. Change Detection Datasets
3. **LEVIR-CD+ (LEVIR-CD-Plus)**
   - **Task:** Satellite Bi-temporal Change Detection
   - **Modality:** High-resolution RGB satellite optical imagery
   - **Image Count:** 985 bi-temporal image pairs (2,955 PNG files: 985 Time-1, 985 Time-2, 985 Change Masks)
   - **Resolution:** Uniformly **1024×1024**
   - **Splits:** Official `train` (637 pairs) and `test` (348 pairs).
   - **Data Quality:** Perfect tile alignment, 0 corruptions.

4. **WHU-CD (Building Change Detection)**
   - **Task:** Aerial Building Change Detection
   - **Modality:** Aerial Optical Imagery
   - **Total Files:** 7,860 files (7,810 TIF images/masks, shapefiles, XML metadata)
   - **Resolution:** Uniformly **512×512**
   - **Splits:** Explicit 2012 and 2016 temporal folders with train/test boundary shapefiles.

5. **OSCD (Onera Satellite Change Detection)**
   - **Task:** Urban & Environmental Change Detection
   - **Modality:** Multispectral Sentinel-2 (13 spectral bands at 10m, 20m, 60m GSD)
   - **Total Files:** 1,377 files
   - **Image Count:** 24 registered city pairs across the globe
   - **Splits:** 14 Train cities, 10 Test cities.
   - **Licence:** Open Academic Research (Daudt et al., IGARSS 2018).

#### C. Structure & Geometry Datasets
6. **DOTA v1.5**
   - **Task:** Oriented Object Detection and Structured Feature Extraction
   - **Modality:** Aerial Optical Imagery
   - **Total Images:** 2,806 images (Train: 1,411; Val: 458; Test: 937)
   - **Resolution Distribution:** Ultra-high resolution (from 800×800 to 5343×3795)
   - **Annotation Status:** `DOTA_annotations/labelTxt-v1.5/` contains both oriented bounding box (`DOTA-v1.5_train.zip`) and horizontal bounding box (`DOTA-v1.5_train_hbb.zip`) annotations.
   - **Licence:** Non-commercial academic research (Wuhan University / CAPES).

#### D. Drone / Aerial Anomaly Datasets
7. **Anti-UAV (Anti-UAV410 Benchmark)**
   - **Task:** Drone Video Tracking & Small Object Detection
   - **Modality:** Dual Modality: Thermal Infrared (IR) and Visible Optical (RGB)
   - **Total Files:** 438,807 files (438,397 JPEG video frames, 410 JSON annotations)
   - **Resolution:** Uniformly **640×512**
   - **Splits:** Pre-partitioned: `train` (160 sequences), `val` (90 sequences), `test` (~160 sequences).
   - **Annotation Format:** Per-frame bounding box annotations in `IR_label.json`.

8. **CST Anti-UAV** ⚠️ **[FLAGGED: NON-COMMERCIAL LICENSE]**
   - **Task:** Tiny UAV Thermal Infrared Tracking
   - **Modality:** Thermal Infrared (IR)
   - **Total Files:** 131,098 files (130,756 JPEG frames, 228 TXT, 114 JSON)
   - **Resolution:** Uniformly **640×512**
   - **Annotation Format:** Bounding boxes in `IR_label.json`, `gt.txt`, and occlusion/existence flags in `exist.txt`.
   - **Licence Summary:** *DATASET_TERMS.md: Academic and non-commercial research purposes only. Commercial use is strictly prohibited without explicit written license.*
   - **Commercial Flag:** ⚠️ **STRICTLY NON-COMMERCIAL**. Kept strictly isolated in evaluation suites.

9. **DroneDetect (drone_detection_dataset-1.0.0)**
   - **Task:** Drone vs. Bird vs. Aircraft Visual and Acoustic Discrimination
   - **Modality:** Multimodal: 365 Thermal IR videos, 285 Visible Optical videos, 90 Audio WAV recordings
   - **Total Files:** 1,397 files
   - **Target Classes:** **Drone**, **Bird**, **Airplane**, **Helicopter** (perfect control benchmark for Drone vs. Bird false alarms!)
   - **Licence:** **CC0 1.0 Universal (Public Domain)**.

---

## 4. Unknown Datasets Discovered & Classification

- **`DroneDetect` (`drone_detection_dataset-1.0.0.zip`)**:
  - *Classification:* Multi-sensor target discrimination benchmark.
  - *Strategic Value:* Directly fulfills the mandatory evaluation requirement: **Evaluate Drone vs. Bird Confusion**.

---

## 5. Risk Assessment & Mitigations

1. **Storage Constraint (High Risk)**:
   - Drive `D:\` has **33.39 GB** free. Large uncompressed frame caches or duplicate extracted datasets could trigger disk exhaustion.
   - *Mitigation:* Implement on-the-fly streaming dataloaders that read compressed videos/tiled images directly. Delete unneeded intermediate zip extractions (never touching original root zips).
2. **GPU VRAM Limit (Medium Risk)**:
   - RTX 3050 has **6 GB VRAM**. High-resolution satellite images (1024×1024) or large batch sizes can easily cause CUDA Out-of-Memory.
   - *Mitigation:* Use mixed-precision (`torch.amp`), gradient accumulation (virtual batch size 16 from batch size 2 or 4), and random crop / patch-based training (512×512 or 256×256).
3. **Non-Commercial Data Contamination (Compliance Risk)**:
   - `CST Anti-UAV` has strict non-commercial terms.
   - *Mitigation:* Clear architectural separation; checkpoints trained on CST Anti-UAV will be tagged `NON_COMMERCIAL_RESEARCH` in metadata and model manifests.

---

## 6. Recommended Training Plan & Phased Progression

1. **Stage 1: Unified Data Layer**
   - Build unified PyTorch datasets with fixed seeds:
     - Change Detection Loader (LEVIR-CD+, WHU-CD, OSCD)
     - Camouflage Segmentation Loader (COD10K + CAMO following COD benchmark protocol)
     - Structure / Geometry Detector Loader (DOTA v1.5)
     - Drone Detector Loader (Anti-UAV thermal & visible separate, DroneDetect multi-class)
   - Visual validation: generate 20 overlay samples per dataset to `/reports/data_validation`.
2. **Stage 2: Synthetic Concealment Data Generation**
   - Address overhead camouflage data shortage by procedurally generating synthetic concealment artifacts (camo nets, tarps, disturbed soil, excavation) on real satellite/aerial backgrounds with hard negatives.
3. **Stage 3: Model Training**
   - Siamese Change Detection (ResNet / EfficientNet backbone)
   - Structure & Camouflage Segmentation (Edge-guided UNet / Feature Pyramid)
   - Dual-stream Thermal & Visible Drone Detectors (with Drone vs. Bird separation)
4. **Stage 4: Evidence Fusion**
   - Train learned review-priority calibrator integrating all cue scores with existing Sentinel Bayesian fusion engine.
5. **Stage 5: Comprehensive Evaluation & Ablations**

---

**STATUS: STAGE 0 COMPLETED. AWAITING EXPLICIT USER APPROVAL.**
