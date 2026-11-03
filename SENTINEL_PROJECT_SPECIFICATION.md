# SENTINIX (SENTINEL) — MASTER PROJECT SPECIFICATION & TECHNICAL BLUEPRINT

**Platform:** SENTINEL — Multi-Source Visual Intelligence & Threat Analysis Platform  
**Repository:** [https://github.com/systemwithayush/Sentinix](https://github.com/systemwithayush/Sentinix)  
**Target Architecture:** Multi-Spectral Computer Vision, Deep Learning Threat Detection, Real-Time Video Operations, and ISO/IEC 27037 Forensic Analyst Review Workflow  
**Document Classification:** Master Project Technical Specification (Pre-Trimming Baseline)  
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

SENTINEL is built as a coordinated 4-tier tactical visual intelligence platform:

```
+---------------------------------------------------------------------------------------------------+
| 1. TACTICAL OPERATOR CONSOLE (Port 5173)                                                          |
|    React 19 + TypeScript + Vite SPA + Tailwind CSS                                                |
|    - 8-Channel Surveillance Grid (EO Optical & Thermal IR Feeds)                                 |
|    - Single-Camera Vertical Split Inspection Deck (50/50 Video & Forensic Tooling)                |
|    - Real-Time 38-Filter Computer Vision GPU Canvas Shaders (CLAHE, Canny, Thermal FLIR, etc.)    |
|    - Dedicated Sector Security Officer & Tactical Comms Dispatch Console (Radio & Sat-Phone)      |
|    - Frame-by-Frame AI Threat Inference Trigger & Telemetry HUD                                   |
|    - ISO/IEC 27037 Forensic Audit Dossier Generator                                               |
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

## 🧠 3. Deep Learning & Computer Vision Architectures (`sentinel_ml`)

The platform integrates 5 production-grade neural network families trained for multi-spectral aerial surveillance, camouflage detection, and intrusion tracking:

### 3.1 Architecture Inventory & Technical Specifications

| # | Architecture | Modality | Backbone / Model Type | Parameter Size / Format | Primary Dataset | Primary Task |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Bi-Temporal Siamese Change Detector** | Optical Satellite | Dual ResNet Backbone + Cross-Attention Difference Head | **7.70 MB** (TorchScript JIT) | LEVIR-CD+ | Clandestine construction, earthworks, and terrain alteration detection across temporal image pairs. |
| **M2** | **Edge-Guided Camouflage & Anomaly UNet** | Multi-Spectral Optical | Dual-Decoder UNet with Boundary Discontinuity Cross-Attention | **29.52 MB** (TorchScript JIT) | COD10K-v3 + CAMO-FS + Synthetic | Camouflaged military netting, concealed tarps, concealed vehicle contours, and texture disruption. |
| **M3** | **16-Class Aerial Structure & Asset Detector** | High-Res Satellite | Faster R-CNN with Feature Pyramid Network (FPN) | **145.10 MB** (PyTorch FP16) | DOTA v1.5 | High-density aerial reconnaissance: hangars, runways, bridges, fuel storage tanks, harbors, and military vehicles. |
| **M4** | **Thermal IR Drone Tracker** | Long-Wave Infrared (LWIR) | Faster R-CNN with ResNet-50 FPN (Isolated LWIR Pipeline) | **144.51 MB** (PyTorch FP16) | Anti-UAV Benchmark | Real-time tracking of small low-heat aerial drones and UAVs against thermal clutter and night skies. |
| **M5** | **Visible Optical Airborne Target Classifier** | Visible Optical (EO) | MobileNetV3-Small Classifier | **6.21 MB** (TorchScript JIT) | DroneDetect | High-throughput classification of airborne targets into 4 classes: Drone, Bird, Airplane, and Helicopter. |

---

## 📊 4. Quantitative Performance, Benchmarks & ML Efficiency

### 4.1 Benchmark Scorecard (Validated on NVIDIA RTX 3050 Laptop GPU / CUDA 12.4)

| Model Family | Target Modality | Test Split / Benchmark | Primary Metric | Latency | FPS | JIT Parity ($\Delta$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Siamese CD** | Optical Satellite | LEVIR-CD+ Holdout (50 pairs) | **Recall: 45.65%**, F1: 0.3127 | **13.92 ms** | **71.8 FPS** | **$0.0000e+00$** |
| **Edge Camo UNet** | Multi-Spectral Optical | COD10K + CAMO Test (50 samples) | **Precision: 38.85%**, MAE: 0.2702 | **10.69 ms** | **93.5 FPS** | **$0.0000e+00$** |
| **Synthetic Concealment** | Isolated Stress Test | Synthetic Anomaly (150 samples) | **Hard-Neg FPR: 0.00%**, Suppression: 100% | **10.69 ms** | **93.5 FPS** | **Isolated** |
| **Structure Detector** | Overhead Satellite | DOTA v1.5 Holdout Set | **Confidence: 0.3145** (17 classes) | **94.72 ms** | **10.6 FPS** | **$0.0000e+00$** |
| **Thermal Drone Tracker** | Infrared LWIR | Anti-UAV Test Sequences | **Detection Rate: 100.0%**, Loss: 0.148 | **73.96 ms** | **13.5 FPS** | **$0.0000e+00$** |
| **Visible Drone Classifier** | Visible Optical | DroneDetect Holdout | **Inference Speed: 6.9 ms** | **14.71 ms** | **145.9 FPS** | **$0.0000e+00$** |

### 4.2 Key ML Efficiency Highlights:
- **Zero-Delta Production Serialization:** Siamese CD, Camouflage UNet, and Visible Drone Classifier are serialized into TorchScript JIT format (`.torchscript.pt`). Numerical comparison between eager PyTorch and JIT output yields absolute zero difference ($\Delta = 0.0000e+00$).
- **Sub-100ms Inference Constraint:** All 5 models meet the sub-100 millisecond edge latency requirement, allowing real-time video stream triage on commercial off-the-shelf GPU hardware.
- **Hard-Negative Terrain Suppression (0.00% FPR):** The Edge-Guided Camouflage model achieved 100.0% false-positive suppression on confounding natural terrain distractors (dried riverbeds, forest shadows, tractor tracks, scree slopes).

---

## 🗄️ 5. Dataset Inventory & Regulatory Governance

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

## 💻 6. Full-Stack Features & Capabilities Inventory

### 6.1 Multi-Channel Surveillance Grid (M1 Ingestion)
- **8 Concurrent Video Feeds:** Displays 8 simultaneous video intelligence streams combining Visible Electro-Optical (`EO`) and Long-Wave Infrared (`IR`) modalities.
- **Tactical Sensor Configuration:**
  - `CAM-1 (Gate West)`: Optical EO, access gate perimeter monitoring.
  - `CAM-2 (Perimeter North)`: Thermal IR, drone approach vector monitoring.
  - `CAM-3 (Ridge Overlook)`: Thermal IR, high-altitude terrain watch.
  - `CAM-4 (Tree Line South)`: Optical EO, low-altitude airspace monitoring with rotary-wing (helicopter) target lock.
  - `CAM-5 (High-Speed Target)`: Thermal IR, high-speed projectile/exhaust plume detection (~140 m/s).
  - `CAM-6 (South Gate)`: Optical EO, low-altitude reconnaissance UAV / drone tracking.
  - `CAM-7 (Border Security)`: Optical EO, demarcation line and watchtower perimeter monitoring (**SECTOR SECURED / ALL-CLEAR** in tactical green).
  - `CAM-8 (Infrastructure)`: Optical EO, geometric masking and structural footprint expansion analysis.
- **On-Demand Per-Feed Video Upload:** Every individual camera tile has an upload interface (`[ UPLOAD ]`) enabling operators to dynamically inject custom video files (`.mp4`, `.webm`, `.avi`, `.mkv`).
- **Unified Video Transport Controls:** Global `PLAY / PAUSE ALL`, `RESET FEEDS`, and `OVERLAYS: ON / OFF` toggles.

### 6.2 Maximized Single-Camera Inspection Deck (50/50 Vertical Split)
- **Ergonomic Operator Layout:** Clicking any feed opens a specialized split-screen console designed for zero vertical scrolling:
  - **Left 50%:** Full-resolution video canvas, high-precision timeline scrubber, playback rate selector (`0.5x`, `1.0x`, `2.0x`), frame-level AI inference trigger, and the **Sector Security Officer Dispatch Console**.
  - **Right 50%:** Full-featured **Surveillance Filter Command Bar** and **Forensic Controls Deck** with internal scrolling.

### 6.3 Real-Time Computer Vision & Forensic Filter Engine (38 Modes)
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

### 6.4 Security Officer Comms & Emergency Dispatch Console
Every camera feed is assigned a dedicated tactical security officer with assigned communication channels:
- **Assigned Officer Roster:**
  - `CAM-1`: Sgt. Rajesh Kumar (`CH-01 VHF`, `+8816-4392-1102`)
  - `CAM-2`: Officer Viktor Ramos (`CH-02 UHF`, `+8816-4392-2291`)
  - `CAM-3`: Cpl. David Chen (`CH-03 TAC`, `+8816-4392-3314`)
  - `CAM-4`: Cpl. Marcus Vance (`CH-04 UHF`, `+8816-4392-4419`)
  - `CAM-5`: Lt. Elena Rostova (`CH-05 SAT`, `+8816-4392-5501`)
  - `CAM-6`: Officer Tariq Al-Mansoor (`CH-06 VHF`, `+8816-4392-6623`)
  - `CAM-7`: Inspector Arjun Mehra (`CH-07 TAC`, `+8816-4392-7788`) — *Status: SECTOR SECURED*
  - `CAM-8`: Lt. Sarah Connor (`CH-08 SAT`, `+8816-4392-8844`)
- **Direct Dispatch Trigger (>80% Threat Confidence):**
  - Instant dispatch triggers across Radio and Satellite Phone channels.
  - Emergency Dispatch Modal transmitting formal ROE-4 visual intercept orders with one-click acknowledgment.

### 6.5 ISO/IEC 27037 Forensic Reporting & Audit Dossier
- Formal forensic write-up generator capturing timecode, filter modality, analyst ID, and observations.
- Comprehensive ISO/IEC 27037 digital evidence dossier generation with SHA-256 integrity hashing and exportable JSON report structure.

### 6.6 Enterprise Analyst Review Workflow (Spring Boot + SQL Server)
- 4-stage lifecycle state machine: `NEW` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `REVIEWED` / `NEEDS_FOLLOWUP`.
- Formal analytical disposition: `RELEVANT` (threat confirmed), `NOT_RELEVANT` (benign/false alarm), or `UNCERTAIN` (secondary verification required).
- Append-only immutable audit ledger (`alert_review_audits`) tracking operator ID, timestamp, transition state, and notes.

---

## 🛠️ 7. Service Deployment & Execution Runbook

### 7.1 Port & Network Mapping
| Service | Technology | Port | Primary Endpoint |
| :--- | :--- | :---: | :--- |
| **Tactical Frontend** | Vite / React 19 SPA | **5173** | `http://localhost:5173` |
| **Core Backend** | Spring Boot 3.2.3 | **8080** | `http://localhost:8080/api/v1/alerts` |
| **AI Threat Engine** | FastAPI / Python 3.10 | **8000** | `http://localhost:8000/api/v1/analyze/threat` |
| **Database** | MS SQL Server | **1433** | `jdbc:sqlserver://localhost:1433;databaseName=Sentinel` |

### 7.2 Startup Sequence
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

## ✂️ 8. Candidate Trimming & Optimization Roadmap

Prior to freezing the production delivery, the following areas are identified for potential trimming based on operational priorities:

| Module / Component | Current Footprint | Potential Trimming Action | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Full 38-Filter Catalog** | 38 canvas filter shaders | Trim to Top 10 Core Surveillance Filters + 4 Mission Presets | Eliminates rare filters (Laplacian, Pseudo-Color, High-Pass) while retaining 100% of operational capability. |
| **Dual Backend Fallback** | Spring Boot + Local State | Consolidate to single active backend mode | Simplifies state management when running standalone without MS SQL Server. |
| **Archive Zip Files** | ~40 GB in root directory | Move historical raw archives to external storage | Reduces workspace storage by >90% without touching source code or Git history. |
| **Synthetic Concealment Generator** | 150 generated test pairs | Archive synthetic generator scripts to cold storage | Preserves hard-negative evaluation benchmarks while streamlining active code. |

---

*Document compiled and preserved on GitHub: [https://github.com/systemwithayush/Sentinix](https://github.com/systemwithayush/Sentinix)*
