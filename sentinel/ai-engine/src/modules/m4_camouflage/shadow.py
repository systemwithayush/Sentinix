import cv2
import numpy as np
import uuid
import time
from typing import Dict, List

class ShadowAnomalyDetector:
    def __init__(self, config: dict):
        self.cfg = config.get('shadow', {})

    def analyze(self, frame: np.ndarray, source_id: str) -> List[Dict]:
        """
        Identify suspicious geometric shadow patterns.
        """
        # Convert to HSV and analyze Value channel for shadows
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2]
        
        # Adaptive thresholding to find dark regions (potential shadows)
        shadow_mask = cv2.adaptiveThreshold(v_channel, 255, 
                                            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                            cv2.THRESH_BINARY_INV, 21, 10)
        
        # Filter shadows by shape (looking for unnatural straight edges)
        contours, _ = cv2.findContours(shadow_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        anomalies = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 200:
                # Calculate approx polygon to check for straight edges
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # If the shadow has few vertices, it might be an artificial structure
                if len(approx) > 3 and len(approx) < 8:
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    score = min(1.0, 1.0 - (len(approx) / 10.0))
                    
                    anomalies.append({
                        "id": f"ANO-SHD-{uuid.uuid4().hex[:6]}",
                        "sourceId": source_id,
                        "frameId": int(time.time()),
                        "timestamp": time.time(),
                        "x": int(x), "y": int(y), "width": int(w), "height": int(h),
                        "anomalyType": "SHADOW_ANOMALY",
                        "confidenceScore": score,
                        "evidence": {
                            "geometryScore": 0.0,
                            "textureScore": 0.0,
                            "temporalScore": 0.0,
                            "vegetationScore": 0.0,
                            "shadowScore": score,
                            "contextScore": 0.0
                        },
                        "explanation": [
                            f"Unusual shadow geometry detected (vertices: {len(approx)})",
                            f"Potential shadow anomaly"
                        ],
                        "imageCropPath": None
                    })
        
        return anomalies
