# SENTINEL — Visual Intelligence & Threat Analysis Platform

## Mission
SENTINEL is an operational Visual Intelligence Platform that assists human operators in monitoring multiple visual sources, prioritizing alerts, and conducting auditable reviews of potential threats. The system strictly assists human analysts; it does not make autonomous operational decisions or targeting determinations.

## Directory Structure
- `/frontend`: React 19 + TypeScript + Vite SPA presenting the tactical dashboard and Analyst Review Workflow.
- `/backend`: Spring Boot application handling business logic, review audits, and camera stream proxies.
- `/ai-engine`: Python FastAPI application hosting Computer Vision and Deep Learning pipelines (5 model families).
- `/docs`: Documentation, architecture diagrams, and the [Operator Guide](docs/OPERATOR_GUIDE.md).

## Quick Start (Local Workstation)

For detailed deployment runbooks, configuration keys, review lifecycle protocols, and troubleshooting, see the [Operator Guide](docs/OPERATOR_GUIDE.md) and [Phase 7 Analyst Review Report](../sentinel_ml/reports/STAGE_7_ANALYST_REVIEW_REPORT.md).

### Recommended Startup Order
1. **Start Database:**
   Ensure Microsoft SQL Server is active locally (or configured via `SPRING_DATASOURCE_URL`).
2. **Start AI Engine (Port 8000):**
   ```bash
   cd ai-engine
   python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Verify:* Open `http://localhost:8000/` (Health check) or `http://localhost:8000/docs` (Swagger UI).
3. **Start Backend Service (Port 8080):**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   *Verify:* Open `http://localhost:8080/api/v1/cameras`.
4. **Start Tactical Frontend (Port 5173 / 3000):**
   ```bash
   cd frontend
   npm run dev
   ```
   *Verify:* Open `http://localhost:5173/` in your web browser.
5. **Run Verification Suites:**
   ```bash
   python sentinel_ml/scripts/run_stage5_verification.py       # 18 ML tests
   python sentinel_ml/scripts/run_stage6_operational_verification.py # 8 Deployment checks
   python sentinel_ml/scripts/run_stage7_review_verification.py      # 8 Review workflow checks
   ```


