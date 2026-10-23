import cv2
import numpy as np
import uuid
import time
from typing import Dict, List

class GeometricAnomalyDetector:
    def __init__(self, config: dict):
        self.cfg = config['geometry']
        
    def analyze(self, frame: np.ndarray, source_id: str) -> List[Dict]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        edges = cv2.Canny(blur, self.cfg['edge_threshold1'], self.cfg['edge_threshold2'])
        
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 
                                threshold=self.cfg['hough_threshold'],
                                minLineLength=self.cfg['min_line_length'], 
                                maxLineGap=self.cfg['max_line_gap'])
        
        corners = cv2.goodFeaturesToTrack(gray, maxCorners=100, 
                                          qualityLevel=self.cfg['corner_quality'], 
                                          minDistance=self.cfg['corner_min_dist'])
        
        if lines is None:
            return []
            
        # Simplistic proxy metrics for Phase 2 constraint
        line_count = len(lines)
        corner_count = len(corners) if corners is not None else 0
        
        # In a real app we'd group lines into regions. 
        # For this skeleton, we analyze global bounding box of lines to define a region.
        xs = []
        ys = []
        for x1, y1, x2, y2 in lines.reshape(-1, 4):
            xs.extend([x1, x2])
            ys.extend([y1, y2])
            
        if not xs or not ys:
            return []
            
        x, y, w, h = min(xs), min(ys), max(xs)-min(xs), max(ys)-min(ys)
        area = max(1, w * h)
        
        # Calculate features (normalized approx)
        line_density = min(1.0, line_count / 100.0)
        corner_density = min(1.0, corner_count / 50.0)
        rectangularity = 0.5 # Mock, requires complex contour intersection
        parallel_ratio = 0.4 # Mock
        right_angle = 0.3 # Mock
        symmetry = 0.2 # Mock
        entropy = 0.5 # Mock
        
        wts = self.cfg['weights']
        geom_score = (
            wts['lineDensity'] * line_density +
            wts['parallelLineRatio'] * parallel_ratio +
            wts['rightAngleRatio'] * right_angle +
            wts['rectangularity'] * rectangularity +
            wts['symmetryScore'] * symmetry +
            wts['cornerDensity'] * corner_density -
            wts['naturalOrientationEntropy'] * entropy
        )
        geom_score = max(0.0, min(1.0, geom_score))
        
        if geom_score < 0.3:
            return []
            
        return [{
            "id": f"ANO-GEO-{uuid.uuid4().hex[:6]}",
            "sourceId": source_id,
            "frameId": int(time.time()),
            "timestamp": time.time(),
            "x": int(x), "y": int(y), "width": int(w), "height": int(h),
            "anomalyType": "GEOMETRIC_ANOMALY",
            "confidenceScore": geom_score,
            "evidence": {
                "geometryScore": geom_score,
                "textureScore": 0.0,
                "temporalScore": 0.0
            },
            "explanation": [
                f"Line density: {line_density:.2f}",
                f"Corner density: {corner_density:.2f}"
            ],
            "imageCropPath": None
        }]
