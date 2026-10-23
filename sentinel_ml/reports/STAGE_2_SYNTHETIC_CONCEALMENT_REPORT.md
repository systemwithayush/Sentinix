# SENTINEL ML — STAGE 2: SYNTHETIC CONCEALMENT DATA GENERATION REPORT

**Date:** 2026-10-20  
**Platform:** SENTINEL (Multi-Source Visual Intelligence & Threat Analysis Platform)  
**Workspace:** `d:\img project\sentinel_ml`  
**Execution Environment:** Windows 11 Home / NVIDIA GeForce RTX 3050 Laptop GPU (6GB VRAM)  
**Author:** Google Antigravity (Senior ML & Defense-AI Systems Architect)  
**Status:** COMPLETED — PENDING OPERATIONAL SIGN-OFF  

---

> [!WARNING]
> ### SYNTHETIC DATA REGULATORY NOTICE
> **Results obtained on synthetic camouflage data are NOT proof of real-world operational performance.**  
> Synthetic concealment patterns serve solely as targeted stress-testing benchmarks, zero-shot generalization checks, and hard-negative suppression calibration. In strict compliance with SENTINEL evaluation doctrine, **real and synthetic evaluation metrics are permanently isolated and must NEVER be aggregated or merged into a single score.**

---

## 1. Executive Summary & Objectives

Stage 2 delivers a procedurally generated, photorealistic aerial/satellite benchmark dataset specifically engineered to evaluate and stress-test the SENTINEL multi-cue camouflage and concealment detection algorithms. 

Every synthetic sample is superimposed upon authentic aerial and high-resolution satellite backgrounds extracted from the **DOTA v1.5** and **LEVIR-CD+** datasets. The dataset incorporates both tactical concealment anomalies and confounding non-threat natural/anthropogenic terrain patterns ("hard negatives") to evaluate false-positive rejection.

### Key Milestones Achieved
1. **Zero Data Leakage & Real Data Purity:** Authentic dataset original archives remain untouched. Background sources were sampled exclusively from designated training partitions.
2. **Strict Defense Naming Conventions:** Every generated file, mask, metadata JSON, and manifest entry strictly bears the `SYNTHETIC` prefix.
3. **800 Fully Annotated Benchmark Tiles (512×512):**
   - **600 Positive Concealment Anomalies** (Camouflage nets, tarps, disturbed soil, excavation trenches/berms).
   - **200 Confounding Hard Negatives** (Rock scree, dried silt ponds, canopy shadows, agricultural harvesting lines) with verified $0\%$ ground truth mask area.
4. **Automated Multi-Panel Overlays:** 60 high-resolution visual inspection panels generated in `d:\img project\sentinel_ml\data\SYNTHETIC_CONCEALMENT\overlays\`.
5. **Disk Footprint Efficiency:** 426.98 MB total storage utilized (<1.3% of available 33.39 GB drive space).

---

## 2. Procedural Generation Methodology

Each tile ($512\times 512$ RGB) was constructed using procedural computer-vision synthesis layered on top of authentic aerial/satellite background tiles:

```
+-------------------------------------------------------------------------------+
|                        SYNTHETIC GENERATION PIPELINE                          |
+-------------------------------------------------------------------------------+
|  Authentic Sources: DOTA v1.5 (Aerial) + LEVIR-CD+ (Satellite)                |
|  2,685 Candidate Tiles -> Random 512x512 Window Crop                          |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
     [Positive Threat Anomalies]                    [Hard Negative Patterns]
     (N = 600, Mask > 0)                           (N = 200, Mask == 0)
     - 1. Camouflage Nets                           - 1. Natural Rock Scree
     - 2. Polyethylene / Canvas Tarps               - 2. Dried Silt Pond Beds
     - 3. Disturbed Soil / Loam                     - 3. Dense Canopy Shadows
     - 4. Excavation Trenches & Berms               - 4. Agricultural Mowing Lines
                 |                                             |
                 +----------------------+----------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |        Export & Metadata Verification       |
                 | - SYNTHETIC_CAMO_*.png & mask (PNG)         |
                 | - SYNTHETIC_NEG_*.png & empty mask          |
                 | - Atomic JSON metadata per sample           |
                 | - 3-Way Diagnostic Overlays (60 panels)     |
                 | - Master Manifest Validation                |
                 +---------------------------------------------+
```

### 2.1 Anomaly Class Synthesis Logic

#### Class 1: Tactical Camouflage Netting (`SYNTHETIC_CAMOUFLAGE_NET`)
- **Visual Signature:** Suspended disruptive-pattern fabric with perimeter draping, cutout ventilation slits, and ambient ground shadow.
- **Implementation:**
  - Base rotated rectangular bounding footprint with random rotation ($0^\circ - 180^\circ$) and dimensions $80-220\text{ px}$.
  - Cubic spline Perlin-like 2D noise erosion along outer boundary to simulate ragged fabric edges.
  - Morphologically dilated random puncturing ($15\%$ mesh aperture density) simulating woven net openings.
  - Multi-tone disruptive palettes:
    - *Woodland:* Olive Drab `[35, 55, 30]`, Foliage Green `[60, 80, 45]`, Loam Brown `[45, 35, 25]`.
    - *Desert:* Desert Tan `[160, 140, 110]`, Khaki `[130, 115, 85]`, Earth Brown `[100, 85, 60]`.
    - *Arid:* Gray Tone `[90, 85, 75]`, Dry Straw `[120, 110, 80]`, Shadow Slate `[60, 55, 45]`.
  - Euclidean distance transform shadow casting ($15\text{ px}$ outward falloff with $45\%$ attenuation) simulating elevation above terrain.
  - Alpha-blending ($75-92\%$) preserving underlying terrain micro-textures.

#### Class 2: Synthetic Tarps & Covers (`SYNTHETIC_TARP_COVER`)
- **Visual Signature:** High-specularity or matte non-natural sheets tied down over equipment, ammunition caches, or vehicles.
- **Implementation:**
  - Sharp polygon boundaries with aspect ratios ranging from $1:1$ to $2.5:1$.
  - Material tones: Industrial Blue Polyethylene `[20, 60, 160]`, Heavy Tan Canvas `[170, 150, 120]`, Military Olive `[30, 45, 30]`, Black Tarpaulin `[40, 40, 45]`.
  - Directional stress wrinkles generated via Gaussian-blurred gradient lines intersecting tie-down vector points.

#### Class 3: Disturbed Soil & Churned Earth (`SYNTHETIC_DISTURBED_SOIL`)
- **Visual Signature:** Freshly excavated loam or clay contrasting sharply with undisturbed surrounding vegetation or topsoil.
- **Implementation:**
  - Irregular perimeter circular/elliptical footprints ($45-120\text{ px}$ radius) modified by mid-frequency noise thresholds.
  - High-chroma subsoil pigments: Reddish Clay `[115, 80, 50]`, Dark Churned Loam `[85, 70, 55]`, Excavated Sand `[140, 125, 95]`.
  - Multi-track linear impressions simulating heavy tracked/wheeled vehicle movement traversing the soil spoil.

#### Class 4: Excavation Patterns & Earthen Revetments (`SYNTHETIC_EXCAVATION_PATTERN`)
- **Visual Signature:** Linear or zig-zag defensive trenches, vehicle revetment berms, and associated sun-angle depression shadows.
- **Implementation:**
  - Multi-segment piecewise continuous trench centerline with random directional changes ($3-6$ segments, width $12-28\text{ px}$).
  - Trench interior shaded by $65\%$ ambient occlusion factor.
  - Morphologically dilated perimeter berm ($7\times 7$ kernel) representing displaced soil, blended with bright excavated earth tones.
  - Combined mask encapsulates both the trench depression and the excavated spoil berm.

### 2.2 Hard Negative Class Synthesis Logic (Zero Target Area)

To ensure the SENTINEL cue fusion model does not trigger false positives on natural or benign agricultural phenomena, 200 hard negative samples were generated with **strictly $0\%$ ground truth mask area**:

1. **`SYNTHETIC_HARD_NEG_ROCK_SCREE` (44 samples):**
   - Naturally clustered limestone scree and surface boulders ($25-60$ stones per cluster) with stochastic Gaussian scatter and ambient micro-shadows.
2. **`SYNTHETIC_HARD_NEG_DRIED_POND` (54 samples):**
   - Natural elliptical dried silt beds with smooth radial Gaussian falloff to simulate seasonal drought beds without geometric regularity.
3. **`SYNTHETIC_HARD_NEG_TREE_CLUSTER_SHADOW` (44 samples):**
   - Natural organic canopy shadows ($4-8$ overlapping blobs) simulating tree stands without man-made angles or straight edges.
4. **`SYNTHETIC_HARD_NEG_AGRICULTURAL_MOWING` (58 samples):**
   - Parallel linear field swaths ($16\text{ px}$ spacing) simulating benign agricultural combine harvesting or tractor passes.

---

## 3. Dataset Audit & Statistical Distribution

### 3.1 Class Breakdown and Mask Coverage

| Category | Anomaly / Pattern Class | Sample Count | Min Mask Area | Mean Mask Area | Max Mask Area | Ground Truth Status |
|---|---|---|---|---|---|---|
| **Concealment** | `SYNTHETIC_CAMOUFLAGE_NET` | 137 | 0.57% | **1.83%** | 3.84% | Positive Threat ($N=137$) |
| **Concealment** | `SYNTHETIC_TARP_COVER` | 150 | 1.74% | **5.39%** | 11.37% | Positive Threat ($N=150$) |
| **Concealment** | `SYNTHETIC_DISTURBED_SOIL` | 157 | 1.89% | **6.99%** | 13.94% | Positive Threat ($N=157$) |
| **Concealment** | `SYNTHETIC_EXCAVATION_PATTERN` | 156 | 1.55% | **3.50%** | 6.43% | Positive Threat ($N=156$) |
| **Hard Negative** | `SYNTHETIC_HARD_NEG_MOWING` | 58 | 0.00% | **0.00%** | 0.00% | Verified Zero-Mask ($N=58$) |
| **Hard Negative** | `SYNTHETIC_HARD_NEG_DRIED_POND` | 54 | 0.00% | **0.00%** | 0.00% | Verified Zero-Mask ($N=54$) |
| **Hard Negative** | `SYNTHETIC_HARD_NEG_ROCK_SCREE` | 44 | 0.00% | **0.00%** | 0.00% | Verified Zero-Mask ($N=44$) |
| **Hard Negative** | `SYNTHETIC_HARD_NEG_TREE_SHADOW`| 44 | 0.00% | **0.00%** | 0.00% | Verified Zero-Mask ($N=44$) |
| **TOTAL** | — | **800** | — | — | — | **600 Pos / 200 Neg** |

### 3.2 Integrity Verification Checks
- **Hard Negative Non-Zero Violations:** **0** (Verified: not a single pixel in any negative mask is active).
- **Positive Anomaly Empty-Mask Violations:** **0** (Verified: every positive sample contains between $0.57\%$ and $13.94\%$ active footprint area).
- **Format Integrity:** 800 RGB images ($512\times 512\times 3$ uint8 PNG), 800 single-channel binary masks ($512\times 512$ uint8 PNG), 800 individual JSON metadata files, and 1 consolidated `SYNTHETIC_dataset_manifest.json`.
- **Naming Standard Compliance:** 100% of files strictly contain `SYNTHETIC` in both filename and metadata.

---

## 4. Visual Evidence & Overlay Inspection Samples

Multi-panel visual inspection composites have been rendered and saved to:  
`d:\img project\sentinel_ml\data\SYNTHETIC_CONCEALMENT\overlays\`

Each panel contains a 3-way side-by-side diagnostic:
1. **Left Panel:** Synthetic RGB Tile ($512\times 512$) with embedded anomaly.
2. **Center Panel:** Ground Truth Binary Mask ($512\times 512$).
3. **Right Panel:** Blended Diagnostic Overlay (Red tint over active anomaly footprint; unchanged for hard negatives).

### Representative Visual Inspection Files
- **Camouflage Nets:**
  - [OVERLAY_SYNTHETIC_CAMO_00003_net.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00003_net.png)
  - [OVERLAY_SYNTHETIC_CAMO_00004_net.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00004_net.png)
  - [OVERLAY_SYNTHETIC_CAMO_00009_net.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00009_net.png)
  - [OVERLAY_SYNTHETIC_CAMO_00017_net.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00017_net.png)
- **Tarps & Polyethylene Covers:**
  - [OVERLAY_SYNTHETIC_CAMO_00002_tarp.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00002_tarp.png)
  - [OVERLAY_SYNTHETIC_CAMO_00007_tarp.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00007_tarp.png)
  - [OVERLAY_SYNTHETIC_CAMO_00018_tarp.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00018_tarp.png)
- **Disturbed Soil & Churned Earth:**
  - [OVERLAY_SYNTHETIC_CAMO_00001_soil.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00001_soil.png)
  - [OVERLAY_SYNTHETIC_CAMO_00023_soil.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00023_soil.png)
  - [OVERLAY_SYNTHETIC_CAMO_00031_soil.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00031_soil.png)
- **Excavation Trenches & Spoil Berms:**
  - [OVERLAY_SYNTHETIC_CAMO_00006_excavation.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00006_excavation.png)
  - [OVERLAY_SYNTHETIC_CAMO_00010_excavation.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00010_excavation.png)
  - [OVERLAY_SYNTHETIC_CAMO_00024_excavation.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_CAMO_00024_excavation.png)
- **Hard Negatives (Ground Truth = 0):**
  - [OVERLAY_SYNTHETIC_NEG_00001.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_NEG_00001.png)
  - [OVERLAY_SYNTHETIC_NEG_00004.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_NEG_00004.png)
  - [OVERLAY_SYNTHETIC_NEG_00010.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_NEG_00010.png)
  - [OVERLAY_SYNTHETIC_NEG_00020.png](file:///d:/img%20project/sentinel_ml/data/SYNTHETIC_CONCEALMENT/overlays/OVERLAY_SYNTHETIC_NEG_00020.png)

---

## 5. Directory Structure & Created Files

```
d:\img project\sentinel_ml\data\SYNTHETIC_CONCEALMENT\
├── SYNTHETIC_dataset_manifest.json          (271 KB, complete schema manifest)
├── images/                                  (800 RGB PNG images, 512x512)
│   ├── SYNTHETIC_CAMO_00001_soil.png
│   ├── ...
│   └── SYNTHETIC_NEG_00200.png
├── masks/                                   (800 single-channel binary masks)
│   ├── SYNTHETIC_CAMO_00001_soil.png
│   ├── ...
│   └── SYNTHETIC_NEG_00200.png
├── metadata/                                (800 atomic JSON metadata files)
│   ├── SYNTHETIC_CAMO_00001_soil.json
│   ├── ...
│   └── SYNTHETIC_NEG_00200.json
└── overlays/                                (60 3-way visual diagnostic panels)
    ├── OVERLAY_SYNTHETIC_CAMO_00001_soil.png
    ├── ...
    └── OVERLAY_SYNTHETIC_NEG_00020.png
```

---

## 6. Discovered Issues & Technical Mitigations

1. **Windows Console Encoding During Batch Printouts:**
   - *Issue:* Unicode glyphs (`✓`, `✗`, em dash `—`) triggered a `UnicodeEncodeError` under Windows console default code page `cp1252`.
   - *Mitigation:* Sanitized terminal output in `run_synthetic_generation.py` to strict ASCII indicators (`[+]`, `[-]`) and enforced `$env:PYTHONIOENCODING="utf-8"`.
2. **Aspect Ratio and Scale Harmony:**
   - *Issue:* Naive overlay insertion can produce unnaturally sharp boundary artifacts that cause trivial neural shortcut learning.
   - *Mitigation:* Introduced edge noise erosion, multi-level Gaussian feathering, Perlin-like disruptive noise textures, and distance-transform ambient occlusion drop shadows to ensure naturalistic optical blending.
3. **Storage Footprint Control:**
   - *Issue:* High-resolution overhead generation can rapidly consume limited drive space (33 GB available).
   - *Mitigation:* Constrained tile resolution to $512\times 512$ with efficient PNG compression, limiting the complete 800-sample benchmark to 426.98 MB.

---

## 7. Compliance Checklist

- [x] Dedicated isolated directory: `d:\img project\sentinel_ml\data\SYNTHETIC_CONCEALMENT\`
- [x] Mandatory `SYNTHETIC` naming convention applied to 100% of filenames, metadata keys, and manifest entries
- [x] Strict modality isolation: Optical aerial/satellite background sources only (no thermal mixing)
- [x] Zero data leakage: Authentic dataset originals intact and unmodified
- [x] 600 positive threat anomalies generated across 4 distinct tactical concealment classes
- [x] 200 confounding hard negatives generated with verified 0% active mask area
- [x] Multi-panel visual overlays rendered for inspection
- [x] Explicit synthetic disclaimer and evaluation isolation notice documented

---

## 8. Next Step: Stage 3 (Model Training)

Upon receiving user approval, development will advance to **Stage 3: Model Training**:
1. **Siamese Change Detection Network (Siam-ResNet / Tiny-CD):** Bi-temporal change segmentation on LEVIR-CD+ and WHU-CD.
2. **Camouflage Concealment Segmentation Network (SINet / PraNet architecture):** Evaluated separately on real COD10K/CAMO and isolated synthetic benchmark.
3. **Oriented Object Detector (Rotated RetinaNet / Oriented R-CNN):** Oriented bounding boxes on DOTA v1.5.
4. **Thermal Drone Tracker / Detector:** Single-modality IR drone localization on Anti-UAV & CST Anti-UAV.
5. **Visible Drone Detector:** Single-modality RGB drone localization on Anti-UAV & DroneDetect.

> [!IMPORTANT]
> **AWAITING USER SIGN-OFF:** Per SENTINEL protocol, execution is halted here. Please review this report and confirm approval to proceed to Stage 3 by replying:  
> **`APPROVED: CONTINUE TO NEXT STAGE`**
