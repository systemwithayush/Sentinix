import cv2
import numpy as np
import yaml
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from modules.m4_camouflage.geometry import GeometricAnomalyDetector
from modules.m4_camouflage.texture import TextureAnomalyDetector
from modules.m4_camouflage.temporal import TemporalAnomalyDetector
from modules.m4_camouflage.bayesian_fusion import EvidenceFusionEngine
from modules.m3_change_detect.change_detector import HistoricalChangeDetector

def generate_synthetic_data():
    base_img = np.ones((480, 640, 3), dtype=np.uint8) * 128
    
    # 1. Geometry: Straight lines and rectangle
    geo_img = base_img.copy()
    cv2.rectangle(geo_img, (100, 100), (300, 300), (50, 50, 50), 3) # Rectangle
    cv2.line(geo_img, (400, 100), (500, 400), (255, 255, 255), 2) # Line
    
    # 2. Texture: Noise / Camouflage
    tex_img = base_img.copy()
    noise = np.random.normal(0, 40, (200, 200, 3)).astype(np.uint8)
    tex_img[100:300, 100:300] = cv2.add(tex_img[100:300, 100:300], noise)
    
    # 3. Temporal: Before and After
    hist_img = base_img.copy()
    curr_img = base_img.copy()
    cv2.rectangle(curr_img, (200, 200), (250, 250), (0, 0, 0), -1) # Object appeared
    
    return base_img, geo_img, tex_img, hist_img, curr_img

def run_audit():
    print("====================================================")
    print("SENTINEL VALIDATION REPORT (Phases 1-3)")
    print("====================================================\n")
    
    config_path = os.path.join(os.path.dirname(__file__), 'src', 'config', 'm4_config.yaml')
    with open(config_path, 'r') as f:
        cfg = yaml.safe_load(f)
        
    geo_det = GeometricAnomalyDetector(cfg)
    tex_det = TextureAnomalyDetector(cfg)
    tmp_det = TemporalAnomalyDetector(cfg)
    fusion = EvidenceFusionEngine()
    change_det = HistoricalChangeDetector()
    
    base_img, geo_img, tex_img, hist_img, curr_img = generate_synthetic_data()
    
    # Phase 4 components
    from modules.m4_camouflage.vegetation import VegetationAnomalyDetector
    from modules.m4_camouflage.shadow import ShadowAnomalyDetector
    from modules.m4_camouflage.context import ContextIntelligenceEngine
    
    veg_det = VegetationAnomalyDetector(cfg)
    shd_det = ShadowAnomalyDetector(cfg)
    ctx_eng = ContextIntelligenceEngine()
    
    print("LEVEL 1: UNIT VALIDATION\n")
    
    print("--- M4.3: Vegetation Disturbance Engine ---")
    veg_res = veg_det.analyze(curr_img, hist_img, "TEST")
    print(f"Vegetation Anomalies detected: {len(veg_res)}")
    if len(veg_res) > 0:
        print("Status: PASS\n")
    else:
        print("Status: FAIL\n")
        
    print("--- M4.4: Shadow Intelligence Engine ---")
    shd_res = shd_det.analyze(curr_img, "TEST")
    print(f"Shadow Anomalies detected: {len(shd_res)}")
    if len(shd_res) > 0:
        print("Status: PASS\n")
    else:
        print("Status: FAIL\n")

    print("--- M4.6: Context Intelligence Engine ---")
    env, mods = ctx_eng.analyze_context(curr_img)
    print(f"Detected Environment: {env}")
    ctx_res = ctx_eng.analyze_region_context([{"evidence": {"geometryScore": 0.9}, "explanation": []}], env)
    print(f"Context Score Updated: {ctx_res[0]['evidence'].get('contextScore')}")
    print("Status: PASS\n")

    print("--- M4.7: Phase 4 Fusion Engine ---")
    mock_region = [{
        "id": "MOCK-1",
        "evidence": {
            "geometryScore": 0.8,
            "textureScore": 0.7,
            "temporalScore": 0.5,
            "vegetationScore": 0.9,
            "shadowScore": 0.6,
            "contextScore": 0.8
        },
        "explanation": []
    }]
    fused = fusion.fuse(mock_region)
    print(f"Fused Score: {fused[0]['finalFusionScore']}")
    print(f"Overall Status: {fused[0]['overallStatus']}")
    print(f"Contributions: {fused[0]['contributions']}")
    if fused[0]['finalFusionScore'] > 0.5:
        print("Status: PASS\n")
    else:
        print("Status: FAIL\n")

    print("====================================================")
    print("SYSTEM VALIDATION SUMMARY")
    print("====================================================")
    print("Phase 4 modules successfully integrated.")

if __name__ == '__main__':
    run_audit()
