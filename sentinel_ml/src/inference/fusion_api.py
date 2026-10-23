import io
import torch
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from torchvision import transforms

# Import our custom models
from ..models.edge_guided_unet import EdgeGuidedUNet
from ..models.fpn_detector import get_fpn_detector

app = FastAPI(title="SENTINEL ML Fusion API", version="1.0")

# Device config
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ---------------------------------------------------------
# 1. Load Models (Lazy loading/Mock weights for now)
# ---------------------------------------------------------
# We'll initialize the architecture. In production, load state_dicts here.
num_detection_classes = 2 # 0: background, 1: drone/threat
detector = get_fpn_detector(num_classes=num_detection_classes).to(device)
detector.eval()

camouflage_net = EdgeGuidedUNet(in_channels=3, out_channels=1).to(device)
camouflage_net.eval()

# Transforms
transform = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
])

# ---------------------------------------------------------
# 2. Fusion Logic
# ---------------------------------------------------------
def compute_fusion_score(det_score, cam_score, box_area_ratio):
    """
    Fuses Object Detection confidence with Camouflage structural probability.
    - det_score: Confidence from Faster R-CNN (0.0 to 1.0)
    - cam_score: Mean probability of camouflage segmentation inside the bounding box
    - box_area_ratio: Ratio of the bounding box area to total image area
    """
    # If the detector is highly confident, we trust it. 
    # If the detector is unsure, but camouflage structure is highly anomalous, we boost the threat score.
    # We penalize massive boxes (often false positives in sky/background).
    
    alpha = 0.6  # Weight for detector
    beta = 0.4   # Weight for camouflage geometry
    
    # Bayesian-inspired update: P(Threat | Det, Cam)
    base_threat = (alpha * det_score) + (beta * cam_score)
    
    # Scale down if bounding box is absurdly large (e.g. > 80% of image)
    if box_area_ratio > 0.8:
        base_threat *= 0.5
        
    return float(np.clip(base_threat, 0.0, 1.0))

# ---------------------------------------------------------
# 3. API Endpoints
# ---------------------------------------------------------
@app.post("/api/v1/analyze/threat")
async def analyze_threat(file: UploadFile = File(...)):
    """
    Accepts an image, runs Object Detection and Camouflage Geometry Segmentation,
    and fuses the results into a unified Threat Assessment Payload.
    """
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_width, img_height = image.size
        total_area = img_width * img_height
        
        # Preprocess
        tensor_img = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            # 1. Object Detection
            det_preds = detector(tensor_img)[0] # Forward pass on Faster RCNN
            
            # 2. Camouflage Segmentation
            cam_mask, edge_map = camouflage_net(tensor_img)
            cam_probs = torch.sigmoid(cam_mask).squeeze().cpu().numpy()
            
        threats = []
        
        # Parse Detection Results
        boxes = det_preds['boxes'].cpu().numpy()
        scores = det_preds['scores'].cpu().numpy()
        labels = det_preds['labels'].cpu().numpy()
        
        # Filter by initial confidence threshold
        confidence_threshold = 0.3
        
        for i in range(len(scores)):
            if scores[i] > confidence_threshold:
                box = boxes[i]
                
                # Map bounding box (scaled for 512x512) back to original resolution concept
                # For fusion, we just calculate the camouflage density inside this box on the 512x512 mask
                x1, y1, x2, y2 = map(int, box)
                
                # Prevent out of bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(512, x2), min(512, y2)
                
                # Extract segmentation probabilities inside the detected bounding box
                box_cam_probs = cam_probs[y1:y2, x1:x2]
                
                # If the box is valid, compute the mean camouflage score inside it
                if box_cam_probs.size > 0:
                    cam_score = float(np.mean(box_cam_probs))
                else:
                    cam_score = 0.0
                    
                # Calculate box area ratio
                box_area = (x2 - x1) * (y2 - y1)
                box_area_ratio = box_area / (512 * 512)
                
                # Fuse Evidence!
                final_threat_score = compute_fusion_score(scores[i], cam_score, box_area_ratio)
                
                threats.append({
                    "bounding_box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "detection_confidence": float(scores[i]),
                    "camouflage_density": cam_score,
                    "fused_threat_level": final_threat_score,
                    "is_critical": final_threat_score > 0.75
                })
                
        # Sort threats by fused threat level descending
        threats.sort(key=lambda x: x['fused_threat_level'], reverse=True)
        
        return JSONResponse(content={
            "status": "success",
            "image_size": {"width": img_width, "height": img_height},
            "total_threats_detected": len(threats),
            "threats": threats,
            "system": "SENTINEL Unified ML Fusion Core"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
