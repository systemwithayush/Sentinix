# SENTINEL — OPERATOR & DEPLOYMENT RUNBOOK
**System:** Multi-Source Visual Intelligence & Threat Analysis Platform  
**Target Environment:** Local Workstation / Edge Server Deployment  
**Version:** Phase 5/6 Operational Baseline  

---

## 1. System Overview & Network Topology

SENTINEL operates as a coordinated 4-tier tactical intelligence system:

```
+-------------------------------------------------------------------------------+
| 1. TACTICAL FRONTEND (Port 5173 / 3000)                                       |
|    React 19 + TypeScript + Vite SPA                                           |
|    URL: http://localhost:5173                                                 |
+-------------------------------------------------------------------------------+
                                      |
                         HTTP REST    v
+-------------------------------------------------------------------------------+
| 2. CORE BACKEND (Port 8080)                                                   |
|    Spring Boot 3.2.3 (Java 21/25) REST Service                                |
|    URL: http://localhost:8080                                                 |
|    Manages cameras, alerts, and proxies frames to AI Engine                   |
+-------------------------------------------------------------------------------+
                  |                                           |
     JDBC / SQL   v                              HTTP REST    v
+----------------------------------+   +----------------------------------------+
| 3. DATABASE (Port 1433)          |   | 4. AI ENGINE (Port 8000)               |
|    Microsoft SQL Server          |   |    Python 3.10 + FastAPI + PyTorch GPU |
|    Stores metadata & alert logs  |   |    URL: http://localhost:8000          |
+----------------------------------+   |    Hosts 5 Deep Neural Model Families  |
                                       +----------------------------------------+
```

---

## 2. Prerequisites & Host Requirements

### 2.1 Software Runtimes
- **Python:** Python 3.10+ (tested on Python 3.10.11 64-bit with CUDA 12.4).
- **Node.js:** Node 18+ (tested on Node v24.13.1, npm 11.8.0).
- **Java:** JDK 21 or JDK 25 (tested on OpenJDK Temurin-25.0.3).
- **Database:** Microsoft SQL Server (2019+ or Express edition) matching `mssql-jdbc` and `schema.sql`.

### 2.2 Model Artifact Prerequisites
Before starting the AI engine, verify that the following trained model weights exist in the repository:

| Model Family | Artifact Path | Size |
| :--- | :--- | :--- |
| **Siamese Change Detector** | `sentinel_ml/checkpoints/best_siamese_cd.pth` | 7.7 MB |
| **Camouflage Anomaly UNet** | `sentinel_ml/checkpoints/best_camouflage_model.pth` | 29.5 MB |
| **Aerial Structure Detector** | `sentinel_ml/checkpoints/best_structure_detector.pth` | 145.1 MB |
| **Thermal Drone Tracker** | `sentinel_ml/checkpoints/best_thermal_drone_detector.pth` | 144.5 MB |
| **Visible Drone Classifier** | `sentinel_ml/checkpoints/best_visible_drone_detector.pth` | 6.2 MB |
| **TorchScript JIT Exports** | `sentinel_ml/exports/*.torchscript.pt` | 43.4 MB |

---

## 3. Configuration Parameters & Environment Variables

All sensitive values must be injected via environment variables. **Never commit raw credentials to source control.**

### 3.1 Backend Service Variables (`sentinel/backend`)

| Variable Name | Default Value (Fallback) | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:sqlserver://localhost\SQLEXPRESS;databaseName=Sentinel;encrypt=true;trustServerCertificate=true` | JDBC connection string to the database instance. |
| `SPRING_DATASOURCE_USERNAME` | `AyushSystem` | Database operator/service account username. |
| `SPRING_DATASOURCE_PASSWORD` | *(None / Empty)* | Password for the database service account. |
| `AI_ENGINE_URL` | `http://localhost:8000/api/v1/analyze/threat` | Full destination URL for the Python deep-learning threat API. |

### 3.2 AI Engine Configuration (`sentinel/ai-engine`)

- **Configuration File:** `sentinel/ai-engine/src/config/m4_config.yaml`
  - `geometry`: Thresholds for Hough transforms, edge detection, and geometric weights.
  - `texture`: Patch size (64), step size (32), and Z-score outlier cutoff (1.5).
  - `temporal`: SSIM threshold (0.8) and pixel difference threshold (30).
  - `vegetation`: Density and texture deviation thresholds.
  - `shadow`: Persistence and length thresholds.
  - `context`: Environmental clustering and isolation cutoffs.
- **Environment Variables:**
  - `CUDA_VISIBLE_DEVICES`: (Optional) Specifies GPU index (e.g. `0` for primary discrete GPU, or `-1` to force CPU).

### 3.3 Database Parity Note
In `sentinel/docker-compose.yml`, a PostgreSQL container was originally declared as a placeholder, whereas `backend/pom.xml` bundles Microsoft SQL Server JDBC drivers and `schema.sql` contains Microsoft SQL Server T-SQL dialect (`IF NOT EXISTS (SELECT * FROM sysobjects ...)`). When running locally without Docker, point `SPRING_DATASOURCE_URL` to an accessible SQL Server instance.

---

## 4. Step-by-Step Service Startup Order

To prevent connection failures, always launch services in the following order:

```
[Step 1: Database] ──> [Step 2: AI Engine] ──> [Step 3: Backend] ──> [Step 4: Frontend]
```

### Step 1: Verify Database Availability
Ensure SQL Server is running and listening on port 1433 or local named pipes. The Sentinel database schema will be automatically created on startup via `schema.sql`.

### Step 2: Start the AI Engine (Port 8000)
Open a dedicated terminal:
```powershell
cd "d:\img project\sentinel\ai-engine"
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
**Verification:**
- Open `http://localhost:8000/` in a browser. It should return `{"status": "AI_ENGINE_ONLINE"}`.
- Open `http://localhost:8000/docs` to inspect interactive Swagger documentation.

### Step 3: Start the Backend Service (Port 8080)
Open a dedicated terminal:
```powershell
cd "d:\img project\sentinel\backend"
# If Apache Maven is installed on host:
mvn spring-boot:run
# Alternatively, if running pre-compiled classes:
java -cp "target/classes;target/dependency/*" com.sentinel.SentinelApplication
```
**Verification:**
- Open `http://localhost:8080/api/v1/cameras` in a browser. It should return a JSON array of registered cameras.

### Step 4: Start the Frontend UI (Port 5173 / 3000)
Open a dedicated terminal:
```powershell
cd "d:\img project\sentinel\frontend"
npm run dev
```
**Verification:**
- Open `http://localhost:5173/` in a web browser.
- The Tactical Dashboard should render with camera feeds, threat alerts, and M4 camouflage analysis tabs.

---

## 5. Safe Service Shutdown Procedures

To ensure complete release of GPU memory, database locks, and video capture hardware handles, follow this graceful stopping procedure:

1. **Stop Frontend:** Press `Ctrl+C` in the frontend terminal window.
2. **Stop Backend:** Press `Ctrl+C` in the backend terminal window. Allow Spring Boot 5 seconds to gracefully flush connection pools.
3. **Stop AI Engine:** Press `Ctrl+C` in the AI Engine terminal window. FastAPI will terminate active video streams (`StreamManager`) and release CUDA VRAM allocations.
4. **Emergency Port Cleanup:**
   If a background process holds a port after an ungraceful crash:
   ```powershell
   # Find process holding port (e.g. 8000):
   Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
   # Terminate by PID:
   Stop-Process -Id <PID> -Force
   ```

---

## 6. Verification & Health Checks Checklist

- [ ] **AI Engine Health:** `GET http://localhost:8000/` returns `200 OK`.
- [ ] **AI Engine Swagger:** `GET http://localhost:8000/docs` renders endpoint definitions.
- [ ] **Deep Learning Verification:** Run `python sentinel_ml/scripts/run_stage5_verification.py` to confirm all 18 unit tests pass.
- [ ] **Backend Health:** `GET http://localhost:8080/api/v1/cameras` returns `200 OK`.
- [ ] **Frontend Dashboard:** `http://localhost:5173/` renders without console errors.
- [ ] **Analyst Review Workflow Verification:** Run `python sentinel_ml/scripts/run_stage7_review_verification.py` to confirm all 8 review workflow checks pass.

---

## 7. Analyst Review & Disposition Protocol (Phase 7 Baseline)

SENTINEL assists human analysts in visual triage and multi-source threat prioritization. **The platform does not make autonomous operational decisions or targeting determinations.** All operational actions require human verification.

### 7.1 Review State Lifecycle
Every detected alert transitions through four well-defined review states:

```
                  ┌───────────────┐
                  │      NEW      │
                  └───────┬───────┘
                          │ (ACKNOWLEDGE / ASSIGN)
                          ▼
                  ┌───────────────┐
           ┌─────►│  UNDER_REVIEW │◄─────────────┐
           │      └───────┬───────┘              │
           │              │                      │
(REOPEN)   │              │ (RECORD_DISPOSITION) │ (REOPEN)
           │              ▼                      │
           │      ┌───────────────┐              │
           └──────┤   REVIEWED    │              │
                  └───────────────┘              │
                          │                      │
                          │ (FLAG_FOLLOWUP)      │
                          ▼                      │
                  ┌───────────────┐              │
                  │NEEDS_FOLLOWUP ├──────────────┘
                  └───────────────┘
```

| Review Status | Description | Permitted Operator Next Actions |
| :--- | :--- | :--- |
| `NEW` | Unacknowledged machine alert generated by the visual intelligence pipeline. | `ACKNOWLEDGE`, `RECORD_DISPOSITION`, `FLAG_FOLLOWUP` |
| `UNDER_REVIEW` | Alert claimed by an analyst (e.g. `DELTA-9`); evidence currently being evaluated. | `RECORD_DISPOSITION`, `FLAG_FOLLOWUP`, `ADD_NOTE` |
| `REVIEWED` | Human reviewer determination has been finalized with an analytical disposition. | `REOPEN`, `ADD_NOTE` |
| `NEEDS_FOLLOWUP` | Analyst flagged alert for senior echelon review, multi-sensor cross-cueing, or ground verification. | `RECORD_DISPOSITION`, `REOPEN`, `ADD_NOTE` |

### 7.2 Human Reviewer Dispositions
When dispositioning an alert, the human reviewer records one of three analytical categories:

1. **`RELEVANT` (Threat of Interest):**
   - Confirmed tactical anomaly, unauthorized UAV in restricted airspace, or artificial concealment matching military patterning.
   - Triggers tactical routing and alert highlighting.
2. **`NOT_RELEVANT` (Benign / False Alarm):**
   - Verified as environmental disturbance (e.g. tree sway, shadow anomaly, authorized maintenance crew, agricultural machinery).
   - Dismisses alert from active operational queues while preserving history.
3. **`UNCERTAIN` (Ambiguous Signature):**
   - Insufficient resolution, obscured signature, or contradictory multi-modal data.
   - Triggers request for secondary sensor sweep or close-range reconnaissance.

### 7.3 Workflow Actions & API Endpoints

#### `POST /api/v1/alerts/{id}/review`
Records an analyst action, updates alert review fields, and automatically appends a tamper-evident entry to the `alert_review_audits` audit table.

**Request Payload Example:**
```json
{
  "action": "RECORD_DISPOSITION",
  "disposition": "RELEVANT",
  "reviewerId": "DELTA-9",
  "note": "Visual confirmation of triangular drone frame matching M2 trajectory."
}
```

**Supported Actions:**
- `ACKNOWLEDGE`: Transitions state to `UNDER_REVIEW`.
- `RECORD_DISPOSITION`: Finalizes state as `REVIEWED` with chosen disposition (`RELEVANT`, `NOT_RELEVANT`, `UNCERTAIN`).
- `FLAG_FOLLOWUP`: Transitions state to `NEEDS_FOLLOWUP` for escalated evaluation.
- `REOPEN`: Resets state to `UNDER_REVIEW` and disposition to `NONE` for re-evaluation.
- `ADD_NOTE`: Appends an observation note to the audit trail without altering status.

#### `GET /api/v1/alerts/{id}/reviews`
Returns the complete, chronological, append-only audit trail for the alert:
```json
[
  {
    "id": "e4b2d3...",
    "alertId": "a1c7f9...",
    "action": "EMIT_ALERT",
    "previousStatus": null,
    "newStatus": "NEW",
    "reviewerId": "ai-engine-1.2.0-m5",
    "timestamp": "2026-10-20T14:22:10"
  },
  {
    "id": "f5c3e4...",
    "alertId": "a1c7f9...",
    "action": "RECORD_DISPOSITION",
    "previousStatus": "UNDER_REVIEW",
    "newStatus": "REVIEWED",
    "newDisposition": "RELEVANT",
    "reviewerId": "DELTA-9",
    "note": "Visual confirmation of drone frame.",
    "timestamp": "2026-10-20T14:28:30"
  }
]
```

### 7.4 Guardrails & Provenance Mandate
- **Provenance:** Every alert and review entry maintains the originating sensor ID (`cameraId`), AI model version (`ai-engine-1.2.0-m5`), operator identifier (`reviewerId`), and ISO 8601 UTC timestamp.
- **Auditing:** Review audit records in `alert_review_audits` are **append-only** and cannot be deleted or mutated by operators.
- **Safety Boundary:** The UI strictly separates machine inference telemetry (`[AI INFERENCE FINDINGS]`) from human determinations (`[HUMAN REVIEWER DETERMINATION]`).

---

## 8. Multi-Channel Tactical Video Feed Operations

In deployed or field evaluation environments where live hardware RTSP camera networks are not yet linked, SENTINEL operates with active multi-source surveillance video streams and on-demand video uploading for all 6 camera channels.

### 8.1 Default Tactical Feed Allocations
The 3×2 tactical surveillance matrix is pre-populated with authentic multi-spectral aerial feeds (EO Optical & Thermal IR from `DroneDetect`):

| Channel | Callsign | Sensor Modality | Resolution / FPS | Default Source Asset | Tactical Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CAM-1** | NORTH PERIMETER | `EO_OPTICAL` | 1920×1080 @ 30 FPS | `Demo_V_DRONE_017.mp4` | Visible quadcopter surveillance |
| **CAM-2** | EAST SECTOR | `IR_THERMAL` | 1280×720 @ 25 FPS | `Demo_IR_DRONE_146.mp4` | Thermal signature tracking |
| **CAM-3** | SOUTH GATE | `IR_THERMAL` | 1920×1080 @ 30 FPS | `IR_AIRPLANE_002.mp4` | Fixed-wing aerial patrol |
| **CAM-4** | WEST OBSERVATION | `EO_OPTICAL` | 1280×720 @ 60 FPS | `V_HELICOPTER_001.mp4` | Rotary-wing boundary scan |
| **CAM-5** | PERIMETER AIR-1 | `IR_THERMAL` | 1920×1080 @ 30 FPS | `IR_AIRPLANE_003.mp4` | High-altitude thermal sweep |
| **CAM-6** | TACTICAL AIR-2 | `EO_OPTICAL` | 1280×720 @ 30 FPS | `V_DRONE_084.mp4` | Low-altitude reconnaissance |

### 8.2 Operator Video Upload & Replacement
Operators can dynamically replace any of the 6 camera feeds with local video recordings:
1. **Per-Channel Tile Upload:** Click the `[ ⤒ UPLOAD ]` button in the header of any camera tile in the 3×2 grid.
2. **File Selection:** Choose any `.mp4`, `.webm`, `.avi`, or `.mkv` file from your workstation.
3. **Instant Hot-Swap:** The channel immediately switches to the selected file using zero-copy client-side object streaming (`URL.createObjectURL`), displaying file size and name in the telemetry banner.
4. **Maximized View Upload:** When a camera feed is expanded, operators can also use the `[ ⤒ REPLACE VIDEO FEED ]` button in the single-camera control deck.

### 8.3 Playback & Inspection Controls
- **Global Control Deck:**
  - `[ ⏸ PAUSE ALL ]` / `[ ▶ PLAY ALL ]`: Synchronously toggles playback across all 6 active channels.
  - `[ ↺ RESET TO DEFAULTS ]`: Reverts all channels back to factory tactical drone surveillance videos.
- **Channel HUD:** Displays real-time UTC timestamp clock, live pulsating broadcast beacon, callsign, and sensor mode badge.
- **Single-Camera Maximized Inspection (`[ ⛶ EXPAND ]`):**
  - **Timeline Scrubber:** Precise seek control across the full duration of the video.
  - **Speed Selector:** Toggle between `0.5x` (slow motion forensic analysis), `1.0x` (normal speed), and `2.0x` (rapid scan).
  - **Volume & Audio Toggle:** Mute/unmute toggle with slider.
  - **Frame-Level AI Inference (`[ ⚡ RUN AI INFERENCE ON FRAME ]`):** Captures the exact displayed video frame via HTML5 Canvas and submits it directly to the AI Engine for real-time M4 Camouflage / Threat Analysis.

