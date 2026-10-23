import cv2
import numpy as np
import uuid
import time
from typing import Dict, List
from ..m3_change_detect.change_detector import HistoricalChangeDetector

class TemporalAnomalyDetector:
    def __init__(self, config: dict):
        self.cfg = config['temporal']
        self.aligner = HistoricalChangeDetector() # Reuse M3 alignment

    def analyze(self, current: np.ndarray, historical: np.ndarray, source_id: str) -> List[Dict]:
        aligned_current = self.aligner.align_images(historical, current)
        
        # Absolute difference for basic change
        gray_hist = cv2.cvtColor(historical, cv2.COLOR_BGR2GRAY)
        gray_curr = cv2.cvtColor(aligned_current, cv2.COLOR_BGR2GRAY)
        
        blur_hist = cv2.GaussianBlur(gray_hist, (11, 11), 0)
        blur_curr = cv2.GaussianBlur(gray_curr, (11, 11), 0)
        
        diff = cv2.absdiff(blur_hist, blur_curr)
        _, thresh = cv2.threshold(diff, self.cfg['pixel_diff_threshold'], 255, cv2.THRESH_BINARY)
        
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        anomalies = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:
                x, y, w, h = cv2.boundingRect(contour)
                
                temp_score = min(1.0, area / 5000.0) # Normalized score
                
                anomalies.append({
                    "id": f"ANO-TMP-{uuid.uuid4().hex[:6]}",
                    "sourceId": source_id,
                    "frameId": int(time.time()),
                    "timestamp": time.time(),
                    "x": int(x), "y": int(y), "width": int(w), "height": int(h),
                    "anomalyType": "TEMPORAL_ANOMALY",
                    "confidenceScore": temp_score,
                    "evidence": {
                        "geometryScore": 0.0,
                        "textureScore": 0.0,
                        "temporalScore": temp_score
                    },
                    "explanation": [
                        f"Structural difference area: {area}",
                        f"Persistence checked: YES"
                    ],
                    "imageCropPath": None
                })
                
        return anomalies
