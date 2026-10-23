"""
SENTINEL Phase 5: Deep Learning Service Adapter (M5)
Bridges high-performance deep neural network models from sentinel_ml into Sentinel ai-engine.
"""

import os
import sys
import time
import logging
from typing import Dict, Any, Optional, List
import numpy as np
import cv2
from PIL import Image

# Find project root containing sentinel_ml
current = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = current
for _ in range(6):
    if os.path.exists(os.path.join(PROJECT_ROOT, "sentinel_ml")):
        break
    parent = os.path.dirname(PROJECT_ROOT)
    if parent == PROJECT_ROOT:
        break
    PROJECT_ROOT = parent

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

logger = logging.getLogger("sentinel.m5_deep_learning")

class DeepLearningService:
    """
    Singleton service adapter managing deep neural models for:
    - Siamese Satellite Change Detection (LEVIR-CD+)
    - Edge-Guided Camouflage & Concealment Detection (COD10K + CAMO)
    - 16-Class Aerial Structure Detection (DOTA v1.5)
    - Thermal Infrared Drone Detection (Anti-UAV, Non-Commercial)
    - 4-Class Airborne Target Classification (DroneDetect)
    - Multi-Cue Tactical Bayesian Threat Fusion
    """
    _instance = None

    def __init__(self, checkpoints_dir: Optional[str] = None):
        if checkpoints_dir is None:
            self.checkpoints_dir = os.path.join(PROJECT_ROOT, "sentinel_ml", "checkpoints")
        else:
            self.checkpoints_dir = checkpoints_dir
            
        self.engine = None
        self.is_initialized = False
        self.initialization_error = None

    @classmethod
    def get_instance(cls, checkpoints_dir: Optional[str] = None):
        if cls._instance is None:
            cls._instance = cls(checkpoints_dir)
        return cls._instance

    def initialize(self):
        """Initializes the SentinelInferenceEngine with all 5 model families."""
        if self.is_initialized:
            return True
            
        try:
            from sentinel_ml.src.inference.sentinel_inference_engine import SentinelInferenceEngine
            self.engine = SentinelInferenceEngine(checkpoints_dir=self.checkpoints_dir)
            self.engine.load_all_models()
            self.is_initialized = True
            self.initialization_error = None
            logger.info("[M5] Sentinel Deep Learning Service successfully initialized on %s", self.engine.device)
            return True
        except Exception as e:
            self.initialization_error = str(e)
            logger.error("[M5] Failed to initialize SentinelInferenceEngine: %s", e)
            return False

    def _ensure_initialized(self):
        if not self.is_initialized:
            success = self.initialize()
            if not success:
                raise RuntimeError(f"Deep learning service unavailable: {self.initialization_error}")

    def get_health_status(self) -> Dict[str, Any]:
        """Provides an operational health, memory, and model readiness audit."""
        import torch
        models_status = {}
        if self.engine is not None:
            models_status = {
                "siamese_cd": self.engine.cd_model is not None,
                "camouflage_unet": self.engine.camo_model is not None,
                "structure_detector": self.engine.structure_model is not None,
                "thermal_drone_detector": self.engine.thermal_drone_model is not None,
                "visible_drone_detector": self.engine.visible_drone_model is not None
            }
        
        expected_checkpoints = [
            "best_siamese_cd.pth",
            "best_camouflage_model.pth",
            "best_structure_detector.pth",
            "best_thermal_drone_detector.pth",
            "best_visible_drone_detector.pth"
        ]
        checkpoints_verified = {
            ckpt: os.path.exists(os.path.join(self.checkpoints_dir, ckpt))
            for ckpt in expected_checkpoints
        }
        all_ckpts_present = all(checkpoints_verified.values())
        
        gpu_info = None
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            allocated_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
            reserved_mb = round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2)
            gpu_info = {
                "device_name": device_name,
                "vram_allocated_mb": allocated_mb,
                "vram_reserved_mb": reserved_mb
            }
            
        overall_status = "HEALTHY" if (self.is_initialized and all(models_status.values()) and all_ckpts_present) else ("INITIALIZING" if not self.is_initialized else "DEGRADED")
        
        return {
            "status": overall_status,
            "is_initialized": self.is_initialized,
            "device": self.engine.device if self.engine else ("cuda" if torch.cuda.is_available() else "cpu"),
            "gpu_metrics": gpu_info,
            "models_loaded": models_status,
            "checkpoints_verified": checkpoints_verified,
            "initialization_error": self.initialization_error
        }

    def _bgr_to_pil(self, img_bgr: np.ndarray) -> Image.Image:
        """Converts an OpenCV BGR numpy array to a PIL RGB image."""
        if len(img_bgr.shape) == 2:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2RGB)
        else:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(img_rgb)

    def analyze_deep_threat(self, current_img: np.ndarray, historical_img: Optional[np.ndarray] = None, 
                            modality: str = "VISIBLE") -> Dict[str, Any]:
        """
        Unified multi-cue threat analysis.
        Executes change detection, camouflage concealment detection, structure detection,
        and drone detection, then fuses evidence into a tactical priority score.
        """
        self._ensure_initialized()
        start_time = time.time()
        
        curr_pil = self._bgr_to_pil(current_img)
        hist_pil = self._bgr_to_pil(historical_img) if historical_img is not None else None
        
        # 1. Siamese Change Detection (if historical pair provided)
        cd_res = None
        if hist_pil is not None:
            try:
                cd_raw = self.engine.predict_change(hist_pil, curr_pil)
                cd_res = {
                    "surface_change_ratio": cd_raw["surface_change_ratio"],
                    "change_pixel_count": cd_raw["change_pixel_count"]
                }
            except Exception as e:
                logger.warning("[M5] Change detection error: %s", e)
                
        # 2. Camouflage & Anomaly Detection
        camo_res = None
        try:
            camo_raw = self.engine.predict_camouflage(curr_pil)
            camo_res = {
                "anomaly_ratio": camo_raw["anomaly_ratio"],
                "has_concealment": camo_raw["anomaly_ratio"] > 0.01
            }
        except Exception as e:
            logger.warning("[M5] Camouflage detection error: %s", e)
            
        # 3. Aerial Structure Detection (DOTA)
        struct_res = None
        try:
            struct_res = self.engine.detect_structures(curr_pil, confidence_threshold=0.3)
        except Exception as e:
            logger.warning("[M5] Structure detection error: %s", e)
            
        # 4. Drone Detection (based on modality)
        drone_res = None
        if modality.upper() == "THERMAL_IR":
            try:
                drone_res = self.engine.detect_thermal_drone(curr_pil, confidence_threshold=0.25)
            except Exception as e:
                logger.warning("[M5] Thermal drone detection error: %s", e)
        else:
            # For visible optical, run classifier on center crop or image
            try:
                vis_drone = self.engine.classify_visible_drone(curr_pil)
                drone_res = {
                    "modality": "VISIBLE_OPTICAL",
                    "drone_detected": vis_drone["predicted_class"] == "Drone" and vis_drone["confidence"] > 0.5,
                    "classification": vis_drone
                }
            except Exception as e:
                logger.warning("[M5] Visible drone classification error: %s", e)
                
        # 5. Bayesian Multi-Cue Evidence Fusion
        fusion = self.engine.fuse_threat_evidence(cd_res, camo_res, struct_res, drone_res)
        
        processing_time_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "SUCCESS",
            "module": "M5_DEEP_LEARNING_FUSION",
            "device": self.engine.device,
            "processing_time_ms": processing_time_ms,
            "tactical_assessment": fusion,
            "surface_change": cd_res,
            "camouflage_concealment": camo_res,
            "aerial_structures": struct_res,
            "airborne_uav": drone_res
        }

    def analyze_deep_change(self, before_img: np.ndarray, after_img: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        """Deep learning Siamese satellite change detection."""
        self._ensure_initialized()
        t0 = time.time()
        p1 = self._bgr_to_pil(before_img)
        p2 = self._bgr_to_pil(after_img)
        
        res = self.engine.predict_change(p1, p2, threshold=threshold)
        
        # Extract changed bounding boxes from binary mask
        mask = res["binary_change_mask"]
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        regions = []
        for c in contours:
            area = cv2.contourArea(c)
            if area > 50:
                x, y, w, h = cv2.boundingRect(c)
                regions.append({"bbox": [int(x), int(y), int(w), int(h)], "area": float(area)})
                
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "SUCCESS",
            "processing_time_ms": elapsed_ms,
            "surface_change_ratio": res["surface_change_ratio"],
            "change_pixel_count": res["change_pixel_count"],
            "changed_regions": regions,
            "total_regions": len(regions)
        }

    def analyze_deep_camouflage(self, img: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        """Deep learning edge-guided camouflage and concealment anomaly detection."""
        self._ensure_initialized()
        t0 = time.time()
        p = self._bgr_to_pil(img)
        res = self.engine.predict_camouflage(p, threshold=threshold)
        
        mask = res["binary_anomaly_mask"]
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        anomalies = []
        for i, c in enumerate(contours):
            area = cv2.contourArea(c)
            if area > 100:
                x, y, w, h = cv2.boundingRect(c)
                anomalies.append({
                    "id": f"CAMO_DL_{i+1}",
                    "bbox": [int(x), int(y), int(w), int(h)],
                    "area": float(area),
                    "confidence": round(float(res["camouflage_probability_map"][y:y+h, x:x+w].mean()), 4) if w > 0 and h > 0 else 0.5
                })
                
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "SUCCESS",
            "processing_time_ms": elapsed_ms,
            "anomaly_ratio": res["anomaly_ratio"],
            "concealment_suspected": res["anomaly_ratio"] > 0.01,
            "detected_anomalies": anomalies,
            "count": len(anomalies)
        }

    def detect_aerial_structures(self, img: np.ndarray, confidence_threshold: float = 0.3) -> Dict[str, Any]:
        """Detects 16 structural classes in overhead imagery (DOTA v1.5 Faster R-CNN)."""
        self._ensure_initialized()
        t0 = time.time()
        p = self._bgr_to_pil(img)
        res = self.engine.detect_structures(p, confidence_threshold=confidence_threshold)
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "SUCCESS",
            "processing_time_ms": elapsed_ms,
            "detections": res["detections"],
            "total_count": res["count"]
        }

    def detect_drone(self, img: np.ndarray, modality: str = "VISIBLE", confidence_threshold: float = 0.25) -> Dict[str, Any]:
        """Airborne drone detection across isolated Visible Optical and Thermal IR modalities."""
        self._ensure_initialized()
        t0 = time.time()
        p = self._bgr_to_pil(img)
        if modality.upper() == "THERMAL_IR":
            res = self.engine.detect_thermal_drone(p, confidence_threshold=confidence_threshold)
        else:
            clf = self.engine.classify_visible_drone(p)
            res = {
                "modality": "VISIBLE_OPTICAL",
                "drone_detected": clf["predicted_class"] == "Drone" and clf["confidence"] > 0.5,
                "target_type": clf["predicted_class"],
                "confidence": clf["confidence"],
                "class_probabilities": clf["class_probabilities"]
            }
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        res["processing_time_ms"] = elapsed_ms
        res["status"] = "SUCCESS"
        return res

def get_dl_service(checkpoints_dir: Optional[str] = None) -> DeepLearningService:
    return DeepLearningService.get_instance(checkpoints_dir)
