import cv2
import numpy as np
import uuid
import time
from typing import Dict, List

class TextureAnomalyDetector:
    def __init__(self, config: dict):
        self.cfg = config['texture']
        self.patch_size = self.cfg['patch_size']
        self.step = self.cfg['step_size']
        
    def analyze(self, frame: np.ndarray, source_id: str) -> List[Dict]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        
        # Calculate local entropy (proxy for texture variation)
        # Using a simplified variance/entropy map for performance
        blur = cv2.blur(gray, (5, 5))
        blur_sq = cv2.blur(gray.astype(np.float32)**2, (5, 5))
        variance = blur_sq - blur.astype(np.float32)**2
        variance = np.sqrt(np.maximum(variance, 0))
        
        # We look for patches where local variance is a statistical outlier compared to global
        mean_var = np.mean(variance)
        std_var = np.std(variance)
        
        anomalies = []
        for y in range(0, h - self.patch_size, self.step):
            for x in range(0, w - self.patch_size, self.step):
                patch_var = np.mean(variance[y:y+self.patch_size, x:x+self.patch_size])
                
                # Outlier detection (deviation from immediate/global context)
                z_score = abs(patch_var - mean_var) / (std_var + 1e-6)
                
                threshold = self.cfg.get('z_score_threshold', 1.5)
                if z_score > threshold: # Configurable threshold in real system
                    tex_score = float(min(1.0, z_score / (threshold * 2)))
                    anomalies.append({
                        "id": f"ANO-TEX-{uuid.uuid4().hex[:6]}",
                        "sourceId": source_id,
                        "frameId": int(time.time()),
                        "timestamp": time.time(),
                        "x": x, "y": y, "width": self.patch_size, "height": self.patch_size,
                        "anomalyType": "TEXTURE_ANOMALY",
                        "confidenceScore": tex_score,
                        "evidence": {
                            "geometryScore": 0.0,
                            "textureScore": tex_score,
                            "temporalScore": 0.0
                        },
                        "explanation": [
                            f"Texture deviation (Z-score): {z_score:.2f}",
                            f"Local variance vs Global: {patch_var:.1f} vs {mean_var:.1f}"
                        ],
                        "imageCropPath": None
                    })
                    
        # In a real system, we'd merge adjacent texture patches here
        return anomalies
