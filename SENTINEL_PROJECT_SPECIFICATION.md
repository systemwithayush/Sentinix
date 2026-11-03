# SENTINIX (SENTINEL) — MASTER PROJECT SPECIFICATION & TECHNICAL BLUEPRINT

**Platform:** SENTINEL — Multi-Source Visual Intelligence, Target Tracking & Defense-AI Platform  
**Repository:** [https://github.com/systemwithayush/Sentinix](https://github.com/systemwithayush/Sentinix)  
**Target Architecture:** Multi-Spectral Computer Vision, Deep Learning Threat Detection, Omni-Channel Surveillance Video Operations, and ISO/IEC 27037 Forensic Analyst Review Workflow  
**Document Classification:** Master Project Technical Specification (Full-Spectrum Capability Baseline)  
**Date:** November 2026  

---

## 🔗 1. Repository & Project Metadata

| Attribute | Specification |
| :--- | :--- |
| **Official Repository URL** | [https://github.com/systemwithayush/Sentinix](https://github.com/systemwithayush/Sentinix) |
| **Active Production Branch** | `main` |
| **License** | MIT License (Commercial and Open-Source permissive; Anti-UAV strictly isolated for research compliance) |
| **Primary Programming Languages** | TypeScript (React 19), Python 3.10+ (PyTorch / FastAPI), Java 21/25 (Spring Boot), SQL (T-SQL / MSSQL) |
| **Deployment Footprint** | Local Workstation, Edge Defense Server, or Air-Gapped High-Security Operations Center |
| **Operational Mandate** | **Strictly Advisory Human-in-the-Loop Intelligence Triage.** Does not perform automated kinetic engagements or autonomous lethal determinations. All dispositions require certified operator authorization. |

---

## 🏛️ 2. High-Level System Architecture & Topology

SENTINEL operates as an integrated 4-tier tactical visual intelligence platform:

```
+---------------------------------------------------------------------------------------------------+
| 1. TACTICAL OPERATOR CONSOLE (Port 5173)                                                          |
|    React 19 + TypeScript + Vite SPA + Tailwind CSS                                                |
|    - 8-Channel Omni-Capable Video Surveillance Grid (EO Optical & Thermal IR Streams)             |
|    - Universal Target Tracking: Humans, Vehicles, UAVs/Drones, Roads, & Structural Construction   |
|    - Single-Camera Vertical Split Inspection Deck (50/50 Video & Forensic Tooling)                |
|    - Real-Time 38-Filter Computer Vision GPU Canvas Shaders (CLAHE, Canny, Thermal FLIR, etc.)    |
|    - Dedicated Sector Security Officer & Tactical Comms Dispatch Console (Radio & Sat-Phone)      |
|    - Frame-by-Frame AI Threat Inference Trigger & Telemetry HUD                                   |
|    - ISO/IEC 27037 Forensic Audit Dossier Generator & Chain-of-Custody Hashing                    |
+---------------------------------------------------------------------------------------------------+
                                            |
                               HTTP REST    v
+---------------------------------------------------------------------------------------------------+
| 2. CORE BACKEND ENTERPRISE SERVICE (Port 8080)                                                    |
|    Spring Boot 3.2.3 (Java 21/25) REST Service                                                    |
|    - Alert Lifecycle State Machine: NEW -> UNDER_REVIEW -> REVIEWED / NEEDS_FOLLOWUP              |
|    - Human-in-the-Loop Review Dispositioning: RELEVANT / NOT_RELEVANT / UNCERTAIN                 |
|    - Tamper-Evident Append-Only Audit Ledger (alert_review_audits table)                          |
|    - Camera Registry, Sensor Telemetry Proxy & Real-Time Alert Distribution                       |
+---------------------------------------------------------------------------------------------------+
                    |                                                     |
       JDBC / SQL   v                                        HTTP REST    v
+--------------------------------------+   +--------------------------------------------------------+
| 3. PERSISTENCE LAYER (Port 1433)     |   | 4. AI INFERENCE ENGINE (Port 8000)                     |
|    Microsoft SQL Server (2019/2022)  |   |    Python 3.10+ FastAPI + CUDA GPU Execution           |
|    - Camera Stream Metadata          |   |    Hosts 5 Deep Neural Model Architectures             |
|    - Detection Logs & Alerts         |   |    - Real-Time Bayesian Threat Scoring & Evidence      |
|    - Immutable Review Audit Records  |   |    - Sub-100ms Ingestion & Multi-Spectral Fusion        |
+--------------------------------------+   +--------------------------------------------------------+
```

---

## 🎯 3. Universal Detection & Target Intelligence Capabilities

SENTINEL's neural and computer vision inference pipelines detect, segment, and track five fundamental categories of tactical entities across **all sensor streams**:

```
+─────────────────────────────────────────────────────────────────────────────────────────────────+
|                           SENTINEL UNIVERSAL DETECTION PIPELINES                                |
+───────────────────────┬───────────────────────┬─────────────────────────┬───────────────────────+
| 1. HUMAN / PEDESTRIAN | 2. VEHICLE & CONVOY   | 3. UAV & AERIAL THREATS | 4. ROADS & PATHS      |
|    - Infiltrators     |    - 4x4 Transports   |    - Multirotor Drones  |    - Boundary Roads   |
|    - Dismounted Troop |    - Armored Vehicles |    - Fixed-Wing UAVs    |    - Dirt Pathways    |
|    - Camouflaged Men  |    - Construction Rig |    - Rotary Aircraft    |    - Trench Corridors |
|    - Velocity/Bearing |    - Convoy Tracking  |    - Thermal Hotspots   |    - Access Chokepoint|
+───────────────────────┴───────────────────────┴─────────────────────────┴───────────────────────+
| 5. BUILDING, INFRASTRUCTURE & CONSTRUCTION EXPANSION                                            |
|    - Rigid Geometric Planar Footprint Masking (Rectangles, Polygons, Foundation Slabs)          |
|    - Clandestine Bunkers, Vault Structures, Utility Core Shafts, and Earthworks Alterations    |
+─────────────────────────────────────────────────────────────────────────────────────────────────+
```

### 3.1 Human & Pedestrian Infiltration Tracking
- **Target Classes:** Dismounted personnel, boundary-crossing infiltrators, moving sentries, camouflaged operators.
- **Extracted Attributes:** Bounding coordinates, velocity vector ($\text{m/s}$), movement bearing ($0^\circ - 360^\circ$), boundary penetration distance, and concealment index.
- **Model / Shaders:** Edge-Guided Camouflage UNet (COD10K/CAMO), Motion Delta temporal accumulator, and Face/Biometric unsharp enhancement.

### 3.2 Vehicle & Ground Transport Detection
- **Target Classes:** Wheeled patrol transports (4×4), logistics trucks, armored personnel carriers, civil/military heavy equipment.
- **Extracted Attributes:** Wheelbase estimation, velocity ($\text{km/h}$), transit corridor vector, engine heat signature, and convoy count.
- **Model / Shaders:** 16-Class Aerial Structure & Asset Detector (DOTA v1.5), CLAHE edge enhancement, and Thermal Ironbow FLIR.

### 3.3 UAV, Drone & Aerial Threat Interception
- **Target Classes:** Commercial and military quadcopters, fixed-wing loitering drones, rotary-wing aircraft (helicopters), high-speed incoming projectiles.
- **Extracted Attributes:** RF control link frequency (e.g., $2.4\text{ GHz}$, $5.8\text{ GHz}$), estimated altitude Above Ground Level (AGL), rotor RPM estimation, and thermal exhaust plume tracking.
- **Model / Shaders:** Thermal IR Drone Tracker (Anti-UAV), Visible Target Classifier (DroneDetect MobileNetV3), and high-contrast motion delta.

### 3.4 Road, Trench & Access Corridor Detection
- **Target Classes:** Linear demarcation tracks, perimeter dirt patrol roads, paved supply highways, drainage cuts, and subterranean conduit trenches.
- **Extracted Attributes:** Corridor centerline azimuth, road width ($\text{m}$), structural continuity, and vehicle track disruption.
- **Model / Shaders:** Canny & Sobel multi-stage edge operators, Hough transform line extractors, and Siamese Bi-Temporal Change Detector (LEVIR-CD+).

### 3.5 Building, Construction & Infrastructure Geometric Masking
- **Target Classes:** Foundation slabs, reinforced containment vaults, modular barracks, utility core shafts, camouflage netting coverings.
- **Extracted Attributes:** Surface footprint area ($\text{m}^2$), planarity index ($99.2\%$), structural orthogonality ($89.8^\circ$), orientation azimuth, and bitemporal expansion delta.
- **Model / Shaders:** Siamese Change Detector (LEVIR-CD+), DOTA v1.5 Large Building Detector, and Edge-Guided Boundary Discontinuity UNet.

---

## 🧠 4. Deep Learning & Computer Vision Architectures (`sentinel_ml`)

The platform integrates 5 production-grade neural network families trained for multi-spectral aerial surveillance, camouflage detection, and intrusion tracking:

### 4.1 Architecture Inventory & Technical Specifications

| # | Architecture | Modality | Backbone / Model Type | Parameter Size / Format | Primary Dataset | Primary Task |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Bi-Temporal Siamese Change Detector** | Optical Satellite | Dual ResNet Backbone + Cross-Attention Difference Head | **7.70 MB** (TorchScript JIT) | LEVIR-CD+ | Clandestine construction, earthworks, and terrain alteration detection across temporal image pairs. |
| **M2** | **Edge-Guided Camouflage & Anomaly UNet** | Multi-Spectral Optical | Dual-Decoder UNet with Boundary Discontinuity Cross-Attention | **29.52 MB** (TorchScript JIT) | COD10K-v3 + CAMO-FS + Synthetic | Camouflaged military netting, concealed tarps, concealed vehicle contours, and texture disruption. |
| **M3** | **16-Class Aerial Structure & Asset Detector** | High-Res Satellite | Faster R-CNN with Feature Pyramid Network (FPN) | **145.10 MB** (PyTorch FP16) | DOTA v1.5 | High-density aerial reconnaissance: hangars, runways, bridges, fuel storage tanks, harbors, and military vehicles. |
| **M4** | **Thermal IR Drone Tracker** | Long-Wave Infrared (LWIR) | Faster R-CNN with ResNet-50 FPN (Isolated LWIR Pipeline) | **144.51 MB** (PyTorch FP16) | Anti-UAV Benchmark | Real-time tracking of small low-heat aerial drones and UAVs against thermal clutter and night skies. |
| **M5** | **Visible Optical Airborne Target Classifier** | Visible Optical (EO) | MobileNetV3-Small Classifier | **6.21 MB** (TorchScript JIT) | DroneDetect | High-throughput classification of airborne targets into 4 classes: Drone, Bird, Airplane, and Helicopter. |

---

## 📊 5. Quantitative Performance, Benchmarks & ML Efficiency

### 5.1 Benchmark Scorecard (Validated on NVIDIA RTX 3050 Laptop GPU / CUDA 12.4)

| Model Family | Target Modality | Test Split / Benchmark | Primary Metric | Latency | FPS | JIT Parity ($\Delta$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Siamese CD** | Optical Satellite | LEVIR-CD+ Holdout (50 pairs) | **Recall: 45.65%**, F1: 0.3127 | **13.92 ms** | **71.8 FPS** | **$0.0000e+00$** |
| **Edge Camo UNet** | Multi-Spectral Optical | COD10K + CAMO Test (50 samples) | **Precision: 38.85%**, MAE: 0.2702 | **10.69 ms** | **93.5 FPS** | **$0.0000e+00$** |
| **Synthetic Concealment** | Isolated Stress Test | Synthetic Anomaly (150 samples) | **Hard-Neg FPR: 0.00%**, Suppression: 100% | **10.69 ms** | **93.5 FPS** | **Isolated** |
| **Structure Detector** | Overhead Satellite | DOTA v1.5 Holdout Set | **Confidence: 0.3145** (17 classes) | **94.72 ms** | **10.6 FPS** | **$0.0000e+00$** |
| **Thermal Drone Tracker** | Infrared LWIR | Anti-UAV Test Sequences | **Detection Rate: 100.0%**, Loss: 0.148 | **73.96 ms** | **13.5 FPS** | **$0.0000e+00$** |
| **Visible Drone Classifier** | Visible Optical | DroneDetect Holdout | **Inference Speed: 6.9 ms** | **14.71 ms** | **145.9 FPS** | **$0.0000e+00$** |

### 5.2 Key ML Efficiency Highlights:
- **Zero-Delta Production Serialization:** Siamese CD, Camouflage UNet, and Visible Drone Classifier are serialized into TorchScript JIT format (`.torchscript.pt`). Numerical comparison between eager PyTorch and JIT output yields absolute zero difference ($\Delta = 0.0000e+00$).
- **Sub-100ms Inference Constraint:** All 5 models meet the sub-100 millisecond edge latency requirement, allowing real-time video stream triage on commercial off-the-shelf GPU hardware.
- **Hard-Negative Terrain Suppression (0.00% FPR):** The Edge-Guided Camouflage model achieved 100.0% false-positive suppression on confounding natural terrain distractors (dried riverbeds, forest shadows, tractor tracks, scree slopes).

---

## 🗄️ 6. Dataset Inventory & Regulatory Governance

| Dataset | Modality | Volume / Resolution | Role in Platform | Regulatory & License Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **COD10K-v3** | High-Res Optical | 10,000 images, 78 object categories | Concealed & camouflaged target training | Academic / Permissive Non-Commercial |
| **CAMO-FS** | Multi-Spectral Optical | 2,500 images with pixel-level ground truth | Discontinuity and boundary masking | Research Permissive |
| **LEVIR-CD+** | Bi-Temporal Satellite | Multi-band satellite tile pairs (0.5m GSD) | Surface construction & terrain modification | Open Access Geospatial |
| **DOTA v1.5** | Aerial Overhead EO | 2,806 large-format satellite images, 16 classes | Tactical infrastructure & vehicle footprint | Permissive Academic License |
| **Anti-UAV** | Thermal LWIR Video | Infrared sequences (640×512, 30 FPS) | Small UAV thermal signature tracking | **Strictly Non-Commercial Research Isolation** |
| **DroneDetect** | Visible Optical Video | Multi-rotor & fixed-wing target clips | Aerial drone classification vs. birds/planes | Permissive License |
| **Onera Satellite CD** | Sentinel-2 Multi-Spectral | 24 multi-temporal European city pairs | Urban surface alteration & earthworks | Open Access ESA Copernicus |

---

## 💻 7. Full-Stack Features & Capabilities Inventory

### 7.1 Multi-Channel Surveillance Grid & Omni-Detection Capabilities
**Architectural Rule: Any of the 8 camera channels can process any detection modality at any time.** While each camera has an active operational baseline, operators can run pedestrian tracking, vehicle recognition, UAV drone interception, road extraction, and construction analysis on **any** feed.

#### Detailed Per-Camera Capabilities & Operational Configuration:

| Camera ID | Primary Operational Deployment | Modality & Resolution | Full Detection Capabilities Matrix | Assigned Security Officer & Communications Link |
| :--- | :--- | :--- | :--- | :--- |
| **CAM-1** | **Gate West (Access Control)** | Optical EO (1920×1080, 30 FPS) | • **Human:** Checkpoint pedestrian flow & dismounted personnel identification.<br>• **Vehicle:** Authorized 4×4 patrol & civilian vehicle entry.<br>• **UAV:** Low-level gate overflight detection.<br>• **Road:** Access avenue tracking.<br>• **Construction:** Gate barrier perimeter inspection. | **Sgt. Rajesh Kumar**<br>Rank: Sgt. (Perimeter Guard)<br>Call Sign: `ALPHA-LEAD-1`<br>Radio: `CH-01 VHF (148.550 MHz)`<br>Sat-Phone: `+8816-4392-1102` |
| **CAM-2** | **Perimeter North (Night Watch)** | Thermal IR (1280×720, 30 FPS) | • **UAV (Active Flag):** Loitering multirotor drone trajectory (0.83 conf).<br>• **Human:** Thermal body heat signatures against cold terrain.<br>• **Vehicle:** Exhaust engine thermography.<br>• **Road:** Night border tracks.<br>• **Construction:** Thermal insulation anomalies. | **Officer Viktor Ramos**<br>Rank: Officer (Night Watch)<br>Call Sign: `BRAVO-NIGHT-2`<br>Radio: `CH-02 UHF (452.125 MHz)`<br>Sat-Phone: `+8816-4392-2291` |
| **CAM-3** | **Ridge Overlook (High Ground)** | Thermal IR (1920×1080, 30 FPS) | • **Human:** Long-range high-ground infiltrator detection.<br>• **Vehicle:** Distant military vehicle movements across ridge lines.<br>• **UAV:** Airborne drone silhouettes against the horizon.<br>• **Road:** High-angle road and canyon trail monitoring.<br>• **Construction:** Ridgeline earthworks alterations. | **Cpl. David Chen**<br>Rank: Cpl. (High-Altitude Sentry)<br>Call Sign: `CHARLIE-RIDGE-3`<br>Radio: `CH-03 TAC (156.800 MHz)`<br>Sat-Phone: `+8816-4392-3314` |
| **CAM-4** | **Tree Line South (Low Airspace)** | Optical EO (1920×1080, 30 FPS) | • **UAV / Aircraft (Active Flag):** Rotary-wing helicopter target lock (0.94 conf, 120m AGL, 160 km/h).<br>• **Human:** Camouflaged infiltrators emerging from foliage.<br>• **Vehicle:** Concealed 4×4 transport along tree line.<br>• **Road:** Dirt track corridor tracking.<br>• **Construction:** Tree clearing & concealment netting. | **Cpl. Marcus Vance**<br>Rank: Cpl. (Tree Line Sentry)<br>Call Sign: `DELTA-TREELINE-4`<br>Radio: `CH-04 UHF (462.562 MHz)`<br>Sat-Phone: `+8816-4392-4419` |
| **CAM-5** | **High-Speed Target Ingress** | Thermal IR (1280×720, 30 FPS) | • **Fast Target (Active Flag):** High-speed infrared munition/drone ingress (0.96 conf, ~140 m/s, FLIR >650°C).<br>• **UAV:** Drone swarm tracking.<br>• **Human:** Sentry position monitoring under alert.<br>• **Vehicle:** High-speed vehicular interception.<br>• **Road:** Rapid transit vector analysis.<br>• **Construction:** Hardened bunker defense posture. | **Lt. Elena Rostova**<br>Rank: Lt. (Tactical Operations)<br>Call Sign: `ECHO-FAST-5`<br>Radio: `CH-05 SATCOM (467.712 MHz)`<br>Sat-Phone: `+8816-4392-5501` |
| **CAM-6** | **South Gate (Airspace Vector)** | Optical EO (1920×1080, 30 FPS) | • **UAV (Active Flag):** Reconnaissance drone intrusion (0.89 conf, ~35m AGL, 5.8 GHz RF link).<br>• **Human:** Dismounted personnel near gate pillars.<br>• **Vehicle:** Approaching supply convoy tracking.<br>• **Road:** South approach asphalt road monitoring.<br>• **Construction:** Structural gate maintenance review. | **Officer Tariq Al-Mansoor**<br>Rank: Officer (Air Defense Post)<br>Call Sign: `FOXTROT-SOUTH-6`<br>Radio: `CH-06 VHF (151.625 MHz)`<br>Sat-Phone: `+8816-4392-6623` |
| **CAM-7** | **Border Demarcation & Watchtower** | Optical EO (1920×1080, 30 FPS) | • **Sector Status: SECURED & VERIFIED (Tactical Green):** Zero infiltration detected across border.<br>• **Human:** Multi-threat border patrol boundary verification.<br>• **Vehicle:** Perimeter patrol transport tracking.<br>• **UAV:** Boundary drone scan (0 aerial intruders).<br>• **Road:** Demarcation line road & watchtower path tracking.<br>• **Construction:** Watchtower & border fence integrity inspection. | **Inspector Arjun Mehra**<br>Rank: Inspector (Border Patrol)<br>Call Sign: `ECHO-PATROL-7`<br>Radio: `CH-07 TAC (446.100 MHz)`<br>Sat-Phone: `+8816-4392-7788`<br>*Status: SECTOR SECURED* |
| **CAM-8** | **Infrastructure & Geometric Masking** | Optical EO (1920×1080, 30 FPS) | • **Infrastructure (Active Flag):** 4× rigid geometric construction masks (0.99 conf, 525 m² foundation, 99.2% planarity index).<br>• **Road:** Conduit utility corridor & trench runs (38m length).<br>• **Human:** Construction crew & dismounted personnel tracking.<br>• **Vehicle:** Heavy earthmovers, cement trucks, and engineering assets.<br>• **UAV:** Overhead survey drone tracking. | **Lt. Sarah Connor**<br>Rank: Lt. (Base Infrastructure)<br>Call Sign: `ZULU-INFRA-8`<br>Radio: `CH-08 SATCOM (467.587 MHz)`<br>Sat-Phone: `+8816-4392-8844` |

---

### 7.2 Maximized Single-Camera Inspection Deck (50/50 Vertical Split)
- **Ergonomic Operator Layout:** Clicking any camera opens a specialized split-screen console designed for zero vertical scrolling:
  - **Left 50%:** Full-resolution video canvas, high-precision timeline scrubber, playback rate selector (`0.5x`, `1.0x`, `2.0x`), frame-level AI inference trigger, and the **Sector Security Officer Dispatch Console**.
  - **Right 50%:** Full-featured **Surveillance Filter Command Bar** and **Forensic Controls Deck** with internal scrolling.

### 7.3 Real-Time Computer Vision & Forensic Filter Engine (38 Modes)
The platform features 38 GPU-accelerated video shaders executed in real time on canvas:
- **Top 10 Operational Surveillance Filters:**
  1. `RAW`: Native 1:1 photorealistic sensor stream.
  2. `CLAHE`: Contrast Limited Adaptive Histogram Equalization (haze/fog penetration).
  3. `Night Vision`: Gen-3 intensifier tube emulation with P43 green phosphor luminance boost.
  4. `Thermal FLIR`: Radiometric Ironbow pseudo-color heat mapping.
  5. `Canny Edge`: Multi-stage structural contour detection.
  6. `Sobel Edge`: Directional gradient magnitude movement isolation.
  7. `Median Filter`: Non-linear shot noise and snow speckle de-noising.
  8. `Gaussian Filter`: Anti-aliasing sensor smoothing.
  9. `Motion Delta`: Frame-to-frame temporal accumulation for moving intruders.
  10. `Face Enhance`: High-frequency biometric unsharp masking.
- **Mission Profiles:** One-click presets configured for *Border Surveillance*, *Drone Surveillance*, *Defense Intelligence*, and *Smart CCTV*.
- **Live Tuning Controls:** Real-time contrast, edge sensitivity, and luminance threshold sliders.

### 7.4 Security Officer Comms & Emergency Dispatch Console
Every camera feed is assigned a dedicated tactical security officer with assigned communication channels:
- Direct dispatch triggers across Radio (UHF/VHF) and Satellite Phone channels.
- Emergency Dispatch Modal transmitting formal ROE-4 visual intercept orders with one-click acknowledgment for threats meeting or exceeding the **80% confidence threshold**.

### 7.5 ISO/IEC 27037 Forensic Reporting & Audit Dossier Suite
The forensic investigation suite guarantees digital chain-of-custody compliance:
- **Frame-Level Evidence Capture:** Captures high-resolution raw video frames synchronized with UTC millisecond timecodes (`TC: 00:12.01 / 00:24.19`).
- **Cryptographic Evidence Integrity:** Generates SHA-256 hashes of captured frames, forensic filters applied, and operator notes to prevent retroactive evidence tampering.
- **Structured Forensic Dossier Export:** Compiles analytical observations (target classification, confidence, applied optical filters, sensor telemetry, and analyst badge) into an exportable ISO/IEC 27037 compliant JSON and markdown dossier.

### 7.6 Enterprise Analyst Review Workflow (Spring Boot + SQL Server)
- 4-stage lifecycle state machine: `NEW` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `REVIEWED` / `NEEDS_FOLLOWUP`.
- Formal analytical disposition: `RELEVANT` (threat confirmed), `NOT_RELEVANT` (benign/false alarm), or `UNCERTAIN` (secondary verification required).
- Append-only immutable audit ledger (`alert_review_audits`) tracking operator ID, timestamp, transition state, and notes.

---

## 🛠️ 8. Service Deployment & Execution Runbook

### 8.1 Port & Network Mapping
| Service | Technology | Port | Primary Endpoint |
| :--- | :--- | :---: | :--- |
| **Tactical Frontend** | Vite / React 19 SPA | **5173** | `http://localhost:5173` |
| **Core Backend** | Spring Boot 3.2.3 | **8080** | `http://localhost:8080/api/v1/alerts` |
| **AI Threat Engine** | FastAPI / Python 3.10 | **8000** | `http://localhost:8000/api/v1/analyze/threat` |
| **Database** | MS SQL Server | **1433** | `jdbc:sqlserver://localhost:1433;databaseName=Sentinel` |

### 8.2 Startup Sequence
```powershell
# 1. AI Engine (FastAPI)
cd "d:\img project\sentinel\ai-engine"
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000

# 2. Core Backend (Spring Boot)
cd "d:\img project\sentinel\backend"
mvn spring-boot:run

# 3. Tactical Frontend (Vite)
cd "d:\img project\sentinel\frontend"
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## ✂️ 9. Candidate Trimming & Optimization Roadmap

Prior to freezing the production delivery, the following areas are identified for potential trimming based on operational priorities:

| Module / Component | Current Footprint | Potential Trimming Action | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Full 38-Filter Catalog** | 38 canvas filter shaders | Trim to Top 10 Core Surveillance Filters + 4 Mission Presets | Eliminates rare filters (Laplacian, Pseudo-Color, High-Pass) while retaining 100% of operational capability. |
| **Dual Backend Fallback** | Spring Boot + Local State | Consolidate to single active backend mode | Simplifies state management when running standalone without MS SQL Server. |
| **Archive Zip Files** | ~40 GB in root directory | Move historical raw archives to external storage | Reduces workspace storage by >90% without touching source code or Git history. |
| **Synthetic Concealment Generator** | 150 generated test pairs | Archive synthetic generator scripts to cold storage | Preserves hard-negative evaluation benchmarks while streamlining active code. |

---

*Document compiled and preserved on GitHub: [https://github.com/systemwithayush/Sentinix](https://github.com/systemwithayush/Sentinix)*
