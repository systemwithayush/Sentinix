from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import cv2
import numpy as np
import yaml
import os

from .core.stream_manager import StreamManager
from .modules.m3_change_detect.change_detector import HistoricalChangeDetector
from .modules.m4_camouflage.geometry import GeometricAnomalyDetector
from .modules.m4_camouflage.texture import TextureAnomalyDetector
from .modules.m4_camouflage.temporal import TemporalAnomalyDetector
from .modules.m4_camouflage.fusion import SpatialAssociator
from .modules.m4_camouflage.bayesian_fusion import EvidenceFusionEngine
from .modules.m4_camouflage.context import ContextIntelligenceEngine
from .modules.m4_camouflage.logger import ResearchLogger
import time

from .modules.m4_camouflage.vegetation import VegetationAnomalyDetector
from .modules.m4_camouflage.shadow import ShadowAnomalyDetector

app = FastAPI(title="SENTINEL AI Engine", version="1.2.0")

active_streams: Dict[str, StreamManager] = {}

# Load Configuration
config_path = os.path.join(os.path.dirname(__file__), 'config', 'm4_config.yaml')
with open(config_path, 'r') as f:
    m4_cfg = yaml.safe_load(f)

m3_detector = HistoricalChangeDetector()
geo_detector = GeometricAnomalyDetector(m4_cfg)
tex_detector = TextureAnomalyDetector(m4_cfg)
tmp_detector = TemporalAnomalyDetector(m4_cfg)
veg_detector = VegetationAnomalyDetector(m4_cfg)
shd_detector = ShadowAnomalyDetector(m4_cfg)
associator = SpatialAssociator(iou_threshold=m4_cfg['fusion']['iou_threshold'])
fusion_engine = EvidenceFusionEngine(m4_cfg)
context_engine = ContextIntelligenceEngine()
research_logger = ResearchLogger()

os.makedirs("reports", exist_ok=True)
os.makedirs("experiments/robustness", exist_ok=True)

class PipelineRequest(BaseModel):
    stream_url: str
    module: str = "M1"

import logging
logger = logging.getLogger("sentinel.ai_engine")

def decode_img(upload: UploadFile) -> np.ndarray:
    contents = upload.file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty image payload received.")
    img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file format or corrupted binary.")
    return img

@app.post("/api/analysis/geometry")
def analyze_geometry(image: UploadFile = File(...)):
    img = decode_img(image)
    return geo_detector.analyze(img, "UPLOAD")

@app.post("/api/analysis/texture")
def analyze_texture(image: UploadFile = File(...)):
    img = decode_img(image)
    return tex_detector.analyze(img, "UPLOAD")

@app.post("/api/analysis/temporal")
def analyze_temporal(current: UploadFile = File(...), historical: UploadFile = File(...)):
    curr_img = decode_img(current)
    hist_img = decode_img(historical)
    return tmp_detector.analyze(curr_img, hist_img, "UPLOAD")

@app.post("/api/analysis/vegetation")
def analyze_vegetation(current: UploadFile = File(...), historical: Optional[UploadFile] = File(None)):
    curr_img = decode_img(current)
    hist_img = decode_img(historical) if historical else None
    return veg_detector.analyze(curr_img, hist_img, "UPLOAD")

@app.post("/api/analysis/shadow")
def analyze_shadow(image: UploadFile = File(...)):
    img = decode_img(image)
    return shd_detector.analyze(img, "UPLOAD")

@app.post("/api/analysis/context")
def analyze_context(image: UploadFile = File(...)):
    img = decode_img(image)
    env, _ = context_engine.analyze_context(img)
    return {"environment": env}

@app.get("/api/analysis/evidence")
def get_evidence():
    return {"status": "success", "evidence": []}

@app.get("/api/analysis/contributions")
def get_contributions():
    return {"status": "success", "contributions": {}}

@app.post("/api/analysis/camouflage")
def analyze_camouflage(current: UploadFile = File(...), historical: Optional[UploadFile] = File(None)):
    start_time = time.time()
    curr_img = decode_img(current)
    hist_img = decode_img(historical) if historical else None
    
    anomalies = []
    # Phase 2
    anomalies.extend(geo_detector.analyze(curr_img, "UPLOAD"))
    anomalies.extend(tex_detector.analyze(curr_img, "UPLOAD"))
    if hist_img is not None:
        anomalies.extend(tmp_detector.analyze(curr_img, hist_img, "UPLOAD"))
        
    # Phase 4
    anomalies.extend(veg_detector.analyze(curr_img, hist_img, "UPLOAD"))
    anomalies.extend(shd_detector.analyze(curr_img, "UPLOAD"))
        
    # 4. Context Intelligence
    env_type, context_modifiers = context_engine.analyze_context(curr_img)
    anomalies = context_engine.analyze_region_context(anomalies, env_type)

    # 5. Spatial Grouping
    associated_regions = associator.associate(anomalies)
    
    # 6. Evidence Fusion
    fused_regions = fusion_engine.fuse(associated_regions, modifiers=context_modifiers)
    
    # 7. Logging for Research Evaluation
    processing_time_ms = (time.time() - start_time) * 1000
    research_logger.log_analysis(
        source_id="UPLOAD",
        processing_time_ms=processing_time_ms,
        anomalies=fused_regions,
        config=m4_cfg,
        context=env_type
    )
    
    return {
        "status": "SUCCESS",
        "environment_context": env_type,
        "processing_time_ms": processing_time_ms,
        "total_anomalies_detected": len(fused_regions),
        "results": fused_regions
    }

# Retained Phase 1 Routes
@app.get("/")
def health_check(): return {"status": "AI_ENGINE_ONLINE"}

@app.post("/api/v1/pipelines/{camera_id}/start")
def start_pipeline(camera_id: str, request: PipelineRequest): pass

@app.post("/api/v1/pipelines/{camera_id}/stop")
def stop_pipeline(camera_id: str): pass

@app.get("/api/v1/pipelines/{camera_id}/status")
def get_pipeline_status(camera_id: str): pass

# Phase 5: Deep Learning Vision & Threat Analysis Endpoints (M5)
from .modules.m5_deep_learning import get_dl_service
dl_service = get_dl_service()

@app.get("/health/ready")
@app.get("/api/v1/health")
def readiness_health_check():
    """
    Operational readiness and deep health probe.
    Inspects model loading status, compute device (CUDA / CPU), VRAM usage, and checkpoint integrity.
    """
    return dl_service.get_health_status()

@app.post("/api/v1/analyze/threat")
def analyze_deep_threat(
    file: UploadFile = File(...),
    historical: Optional[UploadFile] = File(None),
    modality: Optional[str] = "VISIBLE"
):
    """
    Unified Deep Learning Tactical Threat Fusion Endpoint.
    Directly interfaces with Spring Boot backend MLFusionService.
    Orchestrates Siamese CD, Camouflage UNet, DOTA Structures, and Drone Tracking.
    """
    try:
        curr_img = decode_img(file)
        hist_img = decode_img(historical) if historical else None
        return dl_service.analyze_deep_threat(curr_img, hist_img, modality=modality or "VISIBLE")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[AI Engine] Error during deep threat analysis: %s", str(e))
        raise HTTPException(status_code=500, detail={"status": "ERROR", "code": "INFERENCE_FAILURE", "message": str(e)})

@app.post("/api/v1/analyze/change")
def analyze_change(
    image1: UploadFile = File(...), 
    image2: UploadFile = File(...),
    threshold: Optional[float] = 0.5
):
    """
    Deep Learning Siamese Satellite Change Detection (LEVIR-CD+).
    Falls back gracefully to M3 classical detector if required.
    """
    try:
        img1 = decode_img(image1)
        img2 = decode_img(image2)
        return dl_service.analyze_deep_change(img1, img2, threshold=threshold or 0.5)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("[AI Engine] Deep change detection failed, falling back to M3 classical: %s", str(e))
        try:
            m3_res = m3_detector.analyze_change(img1, img2)
            return {
                "status": "FALLBACK_M3",
                "fallback_reason": str(e),
                "regions": m3_res["regions"],
                "total_regions": len(m3_res["regions"])
            }
        except Exception as fallback_err:
            logger.error("[AI Engine] Classical change detection also failed: %s", str(fallback_err))
            raise HTTPException(status_code=500, detail={"status": "ERROR", "code": "CHANGE_DETECTION_FAILED", "message": str(fallback_err)})

@app.post("/api/v1/analyze/deep_camouflage")
def analyze_deep_camouflage(
    image: UploadFile = File(...),
    threshold: Optional[float] = 0.5
):
    """
    Deep Learning Edge-Guided Camouflage & Concealment Detection (COD10K + CAMO).
    """
    try:
        img = decode_img(image)
        return dl_service.analyze_deep_camouflage(img, threshold=threshold or 0.5)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[AI Engine] Error in camouflage analysis: %s", str(e))
        raise HTTPException(status_code=500, detail={"status": "ERROR", "code": "CAMOUFLAGE_FAILURE", "message": str(e)})

@app.post("/api/v1/analyze/structures")
def analyze_structures(
    image: UploadFile = File(...),
    confidence: Optional[float] = 0.3
):
    """
    Overhead Aerial Structure & Vehicle Detection (16 Classes, DOTA v1.5).
    """
    try:
        img = decode_img(image)
        return dl_service.detect_aerial_structures(img, confidence_threshold=confidence or 0.3)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[AI Engine] Error in structure detection: %s", str(e))
        raise HTTPException(status_code=500, detail={"status": "ERROR", "code": "STRUCTURE_DETECTION_FAILURE", "message": str(e)})

@app.post("/api/v1/analyze/drone")
def analyze_drone(
    image: UploadFile = File(...),
    modality: Optional[str] = "VISIBLE",
    confidence: Optional[float] = 0.25
):
    """
    Airborne UAV Target Detection & Classification (Thermal IR or Visible Optical).
    """
    try:
        img = decode_img(image)
        return dl_service.detect_drone(img, modality=modality or "VISIBLE", confidence_threshold=confidence or 0.25)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[AI Engine] Error in drone detection: %s", str(e))
        raise HTTPException(status_code=500, detail={"status": "ERROR", "code": "DRONE_DETECTION_FAILURE", "message": str(e)})


