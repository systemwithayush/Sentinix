"""
SENTINEL Phase 5: Comprehensive End-to-End Verification Matrix
Tests both legacy Phase 1–4 routes and Phase 5 Deep Learning endpoints to guarantee zero regressions.
"""

import os
import sys
import io
import time
import json
import cv2
import numpy as np
from PIL import Image

# Ensure paths
PROJECT_ROOT = r"d:\img project"
AI_ENGINE_DIR = os.path.join(PROJECT_ROOT, "sentinel", "ai-engine")
for p in [PROJECT_ROOT, AI_ENGINE_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient

def create_test_images():
    """Generates synthetic test images for reproducible verification."""
    # Base background (terrain-like)
    base = np.full((512, 512, 3), 120, dtype=np.uint8)
    # Add texture noise
    noise = np.random.normal(0, 20, (512, 512, 3)).astype(np.int16)
    base = np.clip(base + noise, 0, 255).astype(np.uint8)
    
    # Historical frame
    hist_img = base.copy()
    
    # Current frame with added anomalies
    curr_img = base.copy()
    # Add rectangular structure
    cv2.rectangle(curr_img, (150, 150), (280, 280), (45, 50, 48), -1)
    # Add line/road
    cv2.line(curr_img, (50, 400), (450, 420), (200, 200, 200), 4)
    # Add camouflage patch
    camo_patch = np.random.normal(0, 50, (100, 100, 3)).astype(np.int16)
    curr_img[300:400, 300:400] = np.clip(curr_img[300:400, 300:400] + camo_patch, 0, 255).astype(np.uint8)
    
    # Thermal IR frame (hot spot for drone)
    thermal_img = np.full((512, 512, 3), 40, dtype=np.uint8)
    cv2.circle(thermal_img, (256, 256), 12, (240, 240, 240), -1)
    
    return hist_img, curr_img, thermal_img

def cv2_to_bytes(img: np.ndarray, ext: str = ".jpg") -> bytes:
    _, buf = cv2.imencode(ext, img)
    return buf.tobytes()

def run_verification():
    print("=" * 80)
    print("SENTINEL PHASE 5: END-TO-END VERIFICATION & ACCEPTANCE SUITE")
    print("=" * 80)
    
    print("\n[INIT] Importing FastAPI application from sentinel.ai-engine...")
    from src.main import app
    client = TestClient(app)
    print("[INIT] TestClient ready. Generating evaluation stimuli...")
    
    hist_np, curr_np, thermal_np = create_test_images()
    hist_bytes = cv2_to_bytes(hist_np)
    curr_bytes = cv2_to_bytes(curr_np)
    thermal_bytes = cv2_to_bytes(thermal_np)
    
    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "phase1_to_4_regression_tests": [],
        "phase5_deep_learning_tests": [],
        "summary": {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "pass_rate_percent": 0.0
        }
    }
    
    # -------------------------------------------------------------
    # SECTION 1: PHASE 1–4 REGRESSION TESTS
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print("1. RUNNING PHASE 1–4 REGRESSION TESTS")
    print("-" * 40)
    
    p1_4_endpoints = [
        ("GET", "/", None, {}, "Health Check"),
        ("POST", "/api/analysis/geometry", {"image": ("img.jpg", curr_bytes, "image/jpeg")}, {}, "M4.1 Geometry Engine"),
        ("POST", "/api/analysis/texture", {"image": ("img.jpg", curr_bytes, "image/jpeg")}, {}, "M4.2 Texture Engine"),
        ("POST", "/api/analysis/temporal", {"current": ("c.jpg", curr_bytes, "image/jpeg"), "historical": ("h.jpg", hist_bytes, "image/jpeg")}, {}, "M4.5 Temporal Engine"),
        ("POST", "/api/analysis/vegetation", {"current": ("c.jpg", curr_bytes, "image/jpeg"), "historical": ("h.jpg", hist_bytes, "image/jpeg")}, {}, "M4.3 Vegetation Disturbance Engine"),
        ("POST", "/api/analysis/shadow", {"image": ("img.jpg", curr_bytes, "image/jpeg")}, {}, "M4.4 Shadow Intelligence Engine"),
        ("POST", "/api/analysis/context", {"image": ("img.jpg", curr_bytes, "image/jpeg")}, {}, "M4.6 Context Intelligence Engine"),
        ("POST", "/api/analysis/camouflage", {"current": ("c.jpg", curr_bytes, "image/jpeg"), "historical": ("h.jpg", hist_bytes, "image/jpeg")}, {}, "M4.7 Unified Camouflage Analysis"),
        ("GET", "/api/analysis/evidence", None, {}, "Evidence Logging Query"),
        ("GET", "/api/analysis/contributions", None, {}, "Contributions Query")
    ]
    
    for method, endpoint, files, data, label in p1_4_endpoints:
        t0 = time.time()
        try:
            if method == "GET":
                resp = client.get(endpoint)
            else:
                resp = client.post(endpoint, files=files, data=data)
            elapsed_ms = round((time.time() - t0) * 1000, 2)
            passed = resp.status_code == 200
            
            test_rec = {
                "label": label,
                "endpoint": endpoint,
                "method": method,
                "status_code": resp.status_code,
                "latency_ms": elapsed_ms,
                "status": "PASS" if passed else "FAIL"
            }
            results["phase1_to_4_regression_tests"].append(test_rec)
            status_str = "PASS" if passed else f"FAIL ({resp.status_code})"
            print(f"  [{status_str}] {label:<35} | {method} {endpoint:<28} | {elapsed_ms:>6.1f} ms")
        except Exception as e:
            results["phase1_to_4_regression_tests"].append({
                "label": label,
                "endpoint": endpoint,
                "method": method,
                "status_code": 500,
                "error": str(e),
                "status": "FAIL"
            })
            print(f"  [FAIL] {label:<35} | {method} {endpoint:<28} | EXCEPTION: {e}")

    # -------------------------------------------------------------
    # SECTION 2: PHASE 5 DEEP LEARNING ENDPOINTS
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print("2. RUNNING PHASE 5 DEEP LEARNING INTEGRATION TESTS")
    print("-" * 40)
    
    p5_endpoints = [
        (
            "POST", 
            "/api/v1/analyze/threat", 
            {"file": ("curr.jpg", curr_bytes, "image/jpeg")}, 
            {"modality": "VISIBLE"}, 
            "Unified Deep Threat Fusion (Single Visible Frame)"
        ),
        (
            "POST", 
            "/api/v1/analyze/threat", 
            {"file": ("curr.jpg", curr_bytes, "image/jpeg"), "historical": ("hist.jpg", hist_bytes, "image/jpeg")}, 
            {"modality": "VISIBLE"}, 
            "Unified Deep Threat Fusion (Dual-Temporal Optical)"
        ),
        (
            "POST", 
            "/api/v1/analyze/threat", 
            {"file": ("thermal.jpg", thermal_bytes, "image/jpeg")}, 
            {"modality": "THERMAL_IR"}, 
            "Unified Deep Threat Fusion (Thermal IR Drone Mode)"
        ),
        (
            "POST", 
            "/api/v1/analyze/change", 
            {"image1": ("before.jpg", hist_bytes, "image/jpeg"), "image2": ("after.jpg", curr_bytes, "image/jpeg")}, 
            {"threshold": 0.5}, 
            "Siamese CD (LEVIR-CD+ Deep Change Detection)"
        ),
        (
            "POST", 
            "/api/v1/analyze/deep_camouflage", 
            {"image": ("camo.jpg", curr_bytes, "image/jpeg")}, 
            {"threshold": 0.5}, 
            "Edge Camo UNet (Concealment Anomaly Detection)"
        ),
        (
            "POST", 
            "/api/v1/analyze/structures", 
            {"image": ("sat.jpg", curr_bytes, "image/jpeg")}, 
            {"confidence": 0.3}, 
            "DOTA Overhead Aerial Structure Detection (16 Classes)"
        ),
        (
            "POST", 
            "/api/v1/analyze/drone", 
            {"image": ("uav.jpg", curr_bytes, "image/jpeg")}, 
            {"modality": "VISIBLE", "confidence": 0.25}, 
            "DroneDetect Optical Target Classifier (4 Classes)"
        ),
        (
            "POST", 
            "/api/v1/analyze/drone", 
            {"image": ("ir_uav.jpg", thermal_bytes, "image/jpeg")}, 
            {"modality": "THERMAL_IR", "confidence": 0.25}, 
            "Anti-UAV Thermal IR Drone Detector (Non-Commercial)"
        )
    ]

    for method, endpoint, files, data, label in p5_endpoints:
        t0 = time.time()
        try:
            resp = client.post(endpoint, files=files, data=data)
            elapsed_ms = round((time.time() - t0) * 1000, 2)
            passed = resp.status_code == 200
            
            body = resp.json() if passed else {}
            
            test_rec = {
                "label": label,
                "endpoint": endpoint,
                "method": method,
                "status_code": resp.status_code,
                "latency_ms": elapsed_ms,
                "status": "PASS" if passed else "FAIL",
                "response_keys": list(body.keys()) if isinstance(body, dict) else []
            }
            results["phase5_deep_learning_tests"].append(test_rec)
            status_str = "PASS" if passed else f"FAIL ({resp.status_code})"
            print(f"  [{status_str}] {label:<48} | {elapsed_ms:>6.1f} ms")
        except Exception as e:
            results["phase5_deep_learning_tests"].append({
                "label": label,
                "endpoint": endpoint,
                "method": method,
                "status_code": 500,
                "error": str(e),
                "status": "FAIL"
            })
            print(f"  [FAIL] {label:<48} | EXCEPTION: {e}")

    # -------------------------------------------------------------
    # SUMMARY CALCULATION
    # -------------------------------------------------------------
    all_tests = results["phase1_to_4_regression_tests"] + results["phase5_deep_learning_tests"]
    total = len(all_tests)
    passed_count = sum(1 for t in all_tests if t["status"] == "PASS")
    failed_count = total - passed_count
    pass_rate = round((passed_count / total) * 100, 1) if total > 0 else 0.0
    
    results["summary"]["total_tests"] = total
    results["summary"]["passed"] = passed_count
    results["summary"]["failed"] = failed_count
    results["summary"]["pass_rate_percent"] = pass_rate

    print("\n" + "=" * 80)
    print("VERIFICATION SUITE SUMMARY")
    print("=" * 80)
    print(f"Total Tests Executed : {total}")
    print(f"Total Passed         : {passed_count}")
    print(f"Total Failed         : {failed_count}")
    print(f"Acceptance Rate      : {pass_rate}%")
    print("=" * 80)

    # Save to JSON report
    report_path = os.path.join(PROJECT_ROOT, "sentinel_ml", "reports", "stage5_verification_matrix.json")
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[REPORT] Saved full verification matrix to: {report_path}")
    
    return results

if __name__ == "__main__":
    run_verification()
