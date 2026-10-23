from typing import List, Dict
import uuid

def calculate_iou(boxA, boxB):
    # Determine the (x, y)-coordinates of the intersection rectangle
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = boxA[2] * boxA[3]
    boxBArea = boxB[2] * boxB[3]
    iou = interArea / float(boxAArea + boxBArea - interArea)
    return iou

class SpatialAssociator:
    def __init__(self, iou_threshold=0.3):
        self.iou_threshold = iou_threshold
        
    def associate(self, regions: List[Dict]) -> List[Dict]:
        """
        Groups overlapping anomaly regions into a single associated candidate without 
        performing final evidence fusion (as requested in Phase 2).
        """
        if not regions:
            return []
            
        associated_groups = []
        
        for region in regions:
            box = (region['x'], region['y'], region['width'], region['height'])
            matched = False
            
            for group in associated_groups:
                # Compare against the group's bounding box
                g_box = (group['x'], group['y'], group['width'], group['height'])
                if calculate_iou(box, g_box) > self.iou_threshold:
                    group['evidence']['geometryScore'] = max(group['evidence'].get('geometryScore', 0), region['evidence'].get('geometryScore', 0))
                    group['evidence']['textureScore'] = max(group['evidence'].get('textureScore', 0), region['evidence'].get('textureScore', 0))
                    group['evidence']['temporalScore'] = max(group['evidence'].get('temporalScore', 0), region['evidence'].get('temporalScore', 0))
                    group['evidence']['vegetationScore'] = max(group['evidence'].get('vegetationScore', 0), region['evidence'].get('vegetationScore', 0))
                    group['evidence']['shadowScore'] = max(group['evidence'].get('shadowScore', 0), region['evidence'].get('shadowScore', 0))
                    group['evidence']['contextScore'] = max(group['evidence'].get('contextScore', 0), region['evidence'].get('contextScore', 0))
                    group['explanation'].extend(region['explanation'])
                    
                    # Expand bounding box
                    new_x = min(group['x'], region['x'])
                    new_y = min(group['y'], region['y'])
                    new_w = max(group['x'] + group['width'], region['x'] + region['width']) - new_x
                    new_h = max(group['y'] + group['height'], region['y'] + region['height']) - new_y
                    group['x'], group['y'], group['width'], group['height'] = new_x, new_y, new_w, new_h
                    
                    matched = True
                    break
                    
            if not matched:
                associated_groups.append(region.copy())
                
        # Update overall status
        for group in associated_groups:
            group['overallStatus'] = "REQUIRES_REVIEW"
            
        return associated_groups
