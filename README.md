# Sentinix — SENTINEL Multi-Source Visual Intelligence & Defense-AI Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.3-6DB33F.svg?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**Sentinix** is the core repository for **SENTINEL**, an operational multi-source visual intelligence and defense-AI platform. It integrates multi-spectral computer vision, deep neural threat detection, and an auditable human-in-the-loop analyst review workflow to assist operators in monitoring complex visual feeds, detecting camouflaged assets, tracking aerial intrusions, and auditing intelligence determinations.

> **Operational Guardrail Mandate:** SENTINEL is strictly an advisory intelligence triage system. It does not perform autonomous kinetic engagements or automated targeting determinations. All operational dispositioning requires human analyst verification.

---

## 🏛️ System Architecture

SENTINEL operates as an integrated 4-tier tactical intelligence system:

```
+-------------------------------------------------------------------------------+
| 1. TACTICAL FRONTEND (Port 5173)                                              |
|    React 19 + TypeScript + Vite SPA                                           |
|    - 3x2 Tactical Surveillance Grid (EO Optical & Thermal IR active streams)  |
|    - Per-channel video upload & real-time tactical HUD (UTC timecode)         |
|    - Single-camera maximized inspection deck with frame-level AI inference    |
|    - Phase 7 Analyst Review Workflow with dual machine/human badging          |
+-------------------------------------------------------------------------------+
                                      |
                         HTTP REST    v
+-------------------------------------------------------------------------------+
| 2. CORE BACKEND (Port 8080)                                                   |
|    Spring Boot 3.2.3 (Java 21/25) Enterprise REST Service                     |
|    - Alert review lifecycle state machine (NEW -> UNDER_REVIEW -> REVIEWED)   |
|    - Append-only tamper-evident audit ledger (alert_review_audits)            |
|    - Camera management & AI Engine telemetry proxy                            |
+-------------------------------------------------------------------------------+
                  |                                           |
     JDBC / SQL   v                              HTTP REST    v
+----------------------------------+   +----------------------------------------+
| 3. PERSISTENCE (Port 1433)       |   | 4. AI THREAT ENGINE (Port 8000)        |
|    Microsoft SQL Server          |   |    Python 3.10+ FastAPI + CUDA GPU     |
|    Stores camera feeds, alert    |   |    Hosts 5 Deep Neural Model Families  |
|    logs, and immutable audits    |   |    - Real-time threat scoring & fusion |
+----------------------------------+   +----------------------------------------+
```

---

## 📂 Repository Structure

```
.
├── sentinel/                     # Full-Stack Application
│   ├── frontend/                 # React 19 + TypeScript + Vite tactical dashboard
│   │   ├── public/videos/        # Multi-sensor aerial surveillance video assets
│   │   └── src/                  # Tactical UI, Analyst Review Workflow, Video HUD
│   ├── backend/                  # Spring Boot 3.2+ Java enterprise service
│   │   ├── src/main/java/        # Alert entities, audit entities, controllers
│   │   └── pom.xml               # Maven build configuration & JDBC drivers
│   ├── ai-engine/                # FastAPI Python AI inference engine
│   │   ├── src/modules/          # M1 Ingestion, M2-M3 Vision, M4 Camouflage Fusion
│   │   └── src/main.py           # REST endpoints for live frame analysis
│   └── docs/                     # Architecture runbooks & Operator Guide
│       └── OPERATOR_GUIDE.md     # Deployment, review protocol, video operations
│
├── sentinel_ml/                  # Machine Learning & Computer Vision Suite
│   ├── src/
│   │   ├── models/               # 5 PyTorch neural architectures
│   │   ├── data/                 # Multi-modal dataset loaders & transforms
│   │   ├── training/             # Loss functions & Mixed-Precision AMP trainers
│   │   ├── evaluation/           # Benchmark metrics & validation runners
│   │   └── inference/            # SentinelInferenceEngine production adapter
│   ├── checkpoints/              # Best production PyTorch weights (.pth via Git LFS)
│   ├── exports/                  # Serialized TorchScript JIT models (.pt)
│   ├── scripts/                  # Stage 1-7 evaluation & regression suites
│   └── reports/                  # Benchmark telemetry & verification matrices
│
└── experiments/                  # Empirical evaluation results & parameter tuning
```

---

## 🧠 5 Production Deep Neural Architectures

| Architecture | Modality | Dataset | Role | Benchmark Performance |
| :--- | :--- | :--- | :--- | :--- |
| **Bi-Temporal Siamese Change Detector** | Optical Satellite | LEVIR-CD+ | Infrastructure & terrain change detection | **71.8 FPS (13.9 ms)** / 7.7 MB JIT |
| **Edge-Guided Camouflage UNet** | Multi-Spectral | COD10K + CAMO | Boundary anomaly & concealment segmentation | **0.00% False Positive Rate** on hard negatives |
| **Aerial Structure FPN Detector** | High-Res Satellite | DOTA v1.5 | Military building & runway perimeter scan | ResNet-50 FPN feature pyramid |
| **Thermal Drone Tracker** | Infrared (LWIR) | Anti-UAV / DroneDetect | Low-thermal signature UAV detection | Real-time multi-scale infrared tracker |
| **Visible Drone Classifier** | Visible Optical | DroneDetect | Quadcopter / fixed-wing drone categorization | **145.9 FPS (6.9 ms)** / 6.2 MB JIT |

---

## 📹 Multi-Channel Video Operations

SENTINEL supports active multi-source surveillance streaming out-of-the-box:
- **3×2 Matrix:** Plays 6 authentic optical and thermal aerial reconnaissance video streams with real-time UTC timestamp HUD overlays.
- **On-Demand Video Upload:** Every camera tile includes a `[ ⤒ UPLOAD ]` button allowing operators to hot-swap custom local video files (`.mp4`, `.webm`, `.avi`, `.mkv`) instantly into any feed.
- **Frame-Level AI Analysis:** Maximize any feed (`[ ⛶ EXPAND ]`) to scrub video frames, select playback speed (`0.5x`, `1.0x`, `2.0x`), and trigger instant AI threat analysis on the current video frame via `[ ⚡ RUN AI INFERENCE ON FRAME ]`.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (with CUDA 12+ for GPU acceleration)
- **Node.js 18+** & npm
- **JDK 21 or 25** & Maven 3.9+
- **Microsoft SQL Server** (2019+ or Express)

### Service Launch Order

#### 1. AI Threat Engine (Port 8000)
```powershell
cd sentinel/ai-engine
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```
*Health Check:* Open `http://localhost:8000/` or interactive docs at `http://localhost:8000/docs`.

#### 2. Core Backend Service (Port 8080)
```powershell
cd sentinel/backend
mvn spring-boot:run
```
*Health Check:* `GET http://localhost:8080/api/v1/cameras`.

#### 3. Tactical Frontend Dashboard (Port 5173)
```powershell
cd sentinel/frontend
npm install
npm run dev
```
*Access UI:* Open `http://localhost:5173/` in your web browser.

---

## 🛡️ Analyst Review Workflow & Auditing

The system enforces an immutable review protocol for human analysts:
1. **Machine Ingestion:** Potential anomalies generate `NEW` alerts with AI confidence scores and modality badges (`[AI INFERENCE FINDINGS]`).
2. **Analyst Review:** Operators acknowledge and assign alerts (`UNDER_REVIEW`).
3. **Formal Disposition:** Human reviewers designate alerts as `RELEVANT` (threat confirmed), `NOT_RELEVANT` (benign / false alarm), or `UNCERTAIN` (requires secondary sweep).
4. **Tamper-Evident Ledger:** Every action appends an immutable entry to `alert_review_audits` tracking reviewer ID, timestamps, prior/new status, and analytical notes.

---

## 🧪 Verification & Regression Testing

SENTINEL includes comprehensive end-to-end test suites:
```powershell
# Run Stage 5 Deep Learning ML Verification (18/18 checks):
python sentinel_ml/scripts/run_stage5_verification.py

# Run Stage 7 Analyst Review Workflow Verification (8/8 checks):
python sentinel_ml/scripts/run_stage7_review_verification.py
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
