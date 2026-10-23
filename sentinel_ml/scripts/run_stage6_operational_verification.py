"""
SENTINEL Phase 6: Operational Verification Script
Focused validation of health probes, configuration checks, and input failure responses.
"""

import os
import sys
import time
import json

PROJECT_ROOT = r"d:\img project"
AI_ENGINE_DIR = os.path.join(PROJECT_ROOT, "sentinel", "ai-engine")
for p in [PROJECT_ROOT, AI_ENGINE_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from src.main import app

def run_phase6_verification():
    print("=" * 75)
    print("SENTINEL PHASE 6: OPERATIONAL READINESS & FAILURE HANDLING VERIFICATION")
    print("=" * 75)

    client = TestClient(app)
    results = []

    def log_test(name, passed, detail=""):
        status = "PASS" if passed else "FAIL"
        results.append({"test": name, "status": status, "detail": detail})
        print(f"  [{status}] {name:<50} | {detail}")

    # 1. AI Engine Basic Liveness
    t0 = time.time()
    r = client.get("/")
    elapsed = round((time.time() - t0) * 1000, 1)
    passed = r.status_code == 200 and r.json().get("status") == "AI_ENGINE_ONLINE"
    log_test("Liveness Check (GET /)", passed, f"{r.status_code} in {elapsed}ms")

    # 2. AI Engine Deep Readiness Probe (/api/v1/health)
    t0 = time.time()
    r = client.get("/api/v1/health")
    elapsed = round((time.time() - t0) * 1000, 1)
    body = r.json() if r.status_code == 200 else {}
    passed = r.status_code == 200 and "status" in body and "device" in body and "checkpoints_verified" in body
    ckpts_ok = all(body.get("checkpoints_verified", {}).values()) if passed else False
    log_test("Readiness Probe (GET /api/v1/health)", passed and ckpts_ok, 
             f"Device: {body.get('device')} | 5 Checkpoints Verified: {ckpts_ok} | {elapsed}ms")

    # 3. AI Engine Alternative Probe (/health/ready)
    r = client.get("/health/ready")
    passed = r.status_code == 200 and r.json().get("status") in ["INITIALIZING", "HEALTHY"]
    log_test("Alternative Probe (GET /health/ready)", passed, f"Status: {r.json().get('status')}")

    # 4. Failure Handling: Zero-Byte Input
    t0 = time.time()
    r = client.post("/api/v1/analyze/threat", files={"file": ("empty.jpg", b"", "image/jpeg")})
    elapsed = round((time.time() - t0) * 1000, 1)
    passed = r.status_code == 400 and "Empty image payload" in r.text
    log_test("Failure Handling: Empty Image Payload", passed, f"HTTP {r.status_code} properly rejected ({elapsed}ms)")

    # 5. Failure Handling: Corrupt Non-Image Binary
    t0 = time.time()
    r = client.post("/api/v1/analyze/threat", files={"file": ("corrupt.bin", b"CORRUPTED_NON_IMAGE_HEADER_XYZ", "application/octet-stream")})
    elapsed = round((time.time() - t0) * 1000, 1)
    passed = r.status_code == 400 and "Invalid image file format" in r.text
    log_test("Failure Handling: Corrupt Binary Payload", passed, f"HTTP {r.status_code} properly rejected ({elapsed}ms)")

    # 6. Failure Handling: Missing Required File Argument
    t0 = time.time()
    r = client.post("/api/v1/analyze/threat", data={"modality": "VISIBLE"})
    elapsed = round((time.time() - t0) * 1000, 1)
    passed = r.status_code == 422 # Pydantic / FastAPI missing parameter
    log_test("Failure Handling: Missing Required Payload", passed, f"HTTP {r.status_code} Unprocessable Entity ({elapsed}ms)")

    # 7. Failure Handling: Siamese CD Missing Image Pair
    t0 = time.time()
    r = client.post("/api/v1/analyze/change", files={"image1": ("img1.jpg", b"header", "image/jpeg")})
    elapsed = round((time.time() - t0) * 1000, 1)
    passed = r.status_code == 422
    log_test("Failure Handling: Missing Second Temporal Frame", passed, f"HTTP {r.status_code} properly rejected ({elapsed}ms)")

    # 8. Post-Inference Health State
    # Run one lightweight inference to warm up engine
    dummy_img = (b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06'
                 b'\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14'
                 b'\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00'
                 b'\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01'
                 b'\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda'
                 b'\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9')
    client.post("/api/v1/analyze/drone", files={"image": ("test.jpg", dummy_img, "image/jpeg")})
    
    # Re-check health to ensure transition to HEALTHY
    r = client.get("/api/v1/health")
    body = r.json()
    all_loaded = all(body.get("models_loaded", {}).values())
    passed = body.get("status") == "HEALTHY" and all_loaded
    log_test("Post-Inference Health Transition (HEALTHY)", passed, 
             f"Status: {body.get('status')} | Models Loaded: {sum(body.get('models_loaded', {}).values())}/5")

    total = len(results)
    passed_count = sum(1 for x in results if x["status"] == "PASS")
    failed_count = total - passed_count
    
    print("\n" + "=" * 75)
    print(f"SUMMARY: {passed_count}/{total} Passed ({(passed_count/total)*100:.1f}%) | Failed: {failed_count}")
    print("=" * 75)

    report_path = os.path.join(PROJECT_ROOT, "sentinel_ml", "reports", "stage6_operational_verification.json")
    with open(report_path, "w") as f:
        json.dump({"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "results": results}, f, indent=2)
    print(f"[REPORT] Saved to: {report_path}")

    return passed_count == total

if __name__ == "__main__":
    success = run_phase6_verification()
    sys.exit(0 if success else 1)
