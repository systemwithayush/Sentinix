import cv2
import numpy as np
import uuid
import time
from typing import Dict, List

class VegetationAnomalyDetector:
    def __init__(self, config: dict):
        self.cfg = config.get('vegetation', {})

    def analyze(self, current: np.ndarray, historical: np.ndarray, source_id: str) -> List[Dict]:
        """
        Detect regions where vegetation patterns appear disturbed or inconsistent.
        """
        # Simplistic vegetation index approximation (ExG - Excess Green)
        # ExG = 2G - R - B
        b, g, r = cv2.split(current.astype(np.float32))
        exg = 2 * g - r - b
        
        # Normalize and threshold to find vegetation
        exg = np.clip(exg, 0, 255).astype(np.uint8)
        _, veg_mask = cv2.threshold(exg, 50, 255, cv2.THRESH_BINARY)
        
        # Simulate temporal comparison if historical is provided
        if historical is not None:
            bh, gh, rh = cv2.split(historical.astype(np.float32))
            exg_hist = 2 * gh - rh - bh
            exg_hist = np.clip(exg_hist, 0, 255).astype(np.uint8)
            _, veg_mask_hist = cv2.threshold(exg_hist, 50, 255, cv2.THRESH_BINARY)
            
            # Find missing vegetation
            disturbed = cv2.bitwise_and(veg_mask_hist, cv2.bitwise_not(veg_mask))
        else:
            disturbed = np.zeros_like(veg_mask)
            
        # Add morphological operations to group disturbed regions
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        disturbed = cv2.morphologyEx(disturbed, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(disturbed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        anomalies = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 150: # Threshold for significant disturbance
                x, y, w, h = cv2.boundingRect(contour)
                
                score = min(1.0, area / 2000.0)
                
                anomalies.append({
                    "id": f"ANO-VEG-{uuid.uuid4().hex[:6]}",
                    "sourceId": source_id,
                    "frameId": int(time.time()),
                    "timestamp": time.time(),
                    "x": int(x), "y": int(y), "width": int(w), "height": int(h),
                    "anomalyType": "VEGETATION_ANOMALY",
                    "confidenceScore": score,
                    "evidence": {
                        "geometryScore": 0.0,
                        "textureScore": 0.0,
                        "temporalScore": 0.0,
                        "vegetationScore": score,
                        "shadowScore": 0.0,
                        "contextScore": 0.0
                    },
                    "explanation": [
                        f"Vegetation disturbance area: {area}",
                        f"Potential vegetation anomaly"
                    ],
                    "imageCropPath": None
                })
        
        return anomalies
