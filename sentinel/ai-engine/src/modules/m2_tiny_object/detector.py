import cv2
import numpy as np
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class TinyObjectDetector:
    def __init__(self, history=500, varThreshold=16, detectShadows=False):
        # MOG2 Background Subtractor for motion detection
        self.backSub = cv2.createBackgroundSubtractorMOG2(
            history=history, 
            varThreshold=varThreshold, 
            detectShadows=detectShadows
        )
        self.min_area = 5  # Small enough for "tiny" aerial objects
        self.max_area = 500
        self.next_object_id = 1
        self.tracked_objects = {} # ID -> dict of positions, history, etc.

    def process_frame(self, frame) -> List[Dict]:
        """
        Process a single frame and return a list of detected suspicious objects.
        """
        # Convert to grayscale and blur to reduce noise
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply background subtraction
        fgMask = self.backSub.apply(blur)

        # Apply morphological operations to remove noise and close gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_OPEN, kernel, iterations=1)
        fgMask = cv2.morphologyEx(fgMask, cv2.MORPH_CLOSE, kernel, iterations=2)

        # Find contours of moving objects
        contours, _ = cv2.findContours(fgMask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if self.min_area < area < self.max_area:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Basic Confidence calculation based on compactness
                perimeter = cv2.arcLength(contour, True)
                circularity = 4 * np.pi * (area / (perimeter * perimeter)) if perimeter > 0 else 0
                confidence = min(100.0, circularity * 100.0 + 50.0) # Mock confidence
                
                # Mock tracking and ID assignment
                obj_id = self._assign_tracking_id(x, y)

                detections.append({
                    "object_id": f"OBJ_{obj_id}",
                    "bbox": (x, y, w, h),
                    "confidence": round(confidence, 1),
                    "direction": "UNKNOWN", # Would be calculated from track history
                    "threat_level": 3 if confidence > 90 else 2 # 3: Red (High), 2: Yellow (Suspicious)
                })

        return detections

    def _assign_tracking_id(self, x, y):
        # Extremely simplified nearest-neighbor tracking for phase 1 scaffolding
        assigned_id = None
        min_dist = float('inf')
        
        for obj_id, data in self.tracked_objects.items():
            last_x, last_y = data['last_pos']
            dist = np.hypot(x - last_x, y - last_y)
            if dist < 50 and dist < min_dist:
                min_dist = dist
                assigned_id = obj_id

        if assigned_id is None:
            assigned_id = self.next_object_id
            self.next_object_id += 1
            self.tracked_objects[assigned_id] = {'history': []}

        self.tracked_objects[assigned_id]['last_pos'] = (x, y)
        self.tracked_objects[assigned_id]['history'].append((x, y))
        
        # Keep history short
        if len(self.tracked_objects[assigned_id]['history']) > 30:
            self.tracked_objects[assigned_id]['history'].pop(0)

        return assigned_id
