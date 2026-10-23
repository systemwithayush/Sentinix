import cv2
import numpy as np
from typing import Dict, Tuple

class ContextIntelligenceEngine:
    def __init__(self):
        pass
        
    def analyze_context(self, frame: np.ndarray) -> Tuple[str, Dict[str, float]]:
        """
        Analyzes the global context of the frame to determine the environmental archetype.
        Returns the environment type and dynamic weight modifiers for the fusion engine.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # 1. Global Entropy (Complexity of the scene)
        # Using simple variance as a proxy for entropy for speed
        variance = np.var(gray)
        
        # 2. Dominant Color Estimation (HSV)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mean_h = np.mean(hsv[:,:,0])
        mean_s = np.mean(hsv[:,:,1])
        
        env_type = "UNKNOWN"
        modifiers = {
            "geometryScore": 1.0,
            "textureScore": 1.0,
            "temporalScore": 1.0
        }
        
        # Simple heuristic classification
        if variance > 2000 and mean_h > 35 and mean_h < 85: 
            # High complexity + green/yellow hues -> FOREST / VEGETATION
            env_type = "FOREST"
            # In forests, textures are chaotic, so reduce texture weight, rely on geometry
            modifiers["textureScore"] = 0.6
            modifiers["geometryScore"] = 1.3
        elif variance < 1000 and mean_s < 50:
            # Low complexity + low saturation -> URBAN / CONCRETE
            env_type = "URBAN"
            # In urban areas, geometry is everywhere (buildings), reduce geometry weight
            modifiers["geometryScore"] = 0.6
            modifiers["textureScore"] = 1.2
        elif variance < 1000 and mean_h > 15 and mean_h < 35:
            # Low complexity + yellow/orange hues -> DESERT
            env_type = "DESERT"
            # Deserts are uniform, any anomaly (texture or geometry) is highly suspicious
            modifiers["geometryScore"] = 1.2
            modifiers["textureScore"] = 1.2
        else:
            env_type = "GENERAL"
            
        return env_type, modifiers
        
    def analyze_region_context(self, anomalies: list, env_type: str) -> list:
        """
        Evaluate anomaly significance based on environmental context.
        """
        for anomaly in anomalies:
            evidence = anomaly.get("evidence", {})
            score = 0.0
            explanation = "Normal context"
            
            # Simplified proxy for Region isolation & anomaly clustering
            if env_type == "FOREST" and evidence.get("geometryScore", 0) > 0.5:
                score = 0.8
                explanation = "Geometric pattern uncommon in dense forest."
            elif env_type == "URBAN" and evidence.get("vegetationScore", 0) > 0.5:
                score = 0.7
                explanation = "Vegetation disturbance uncommon in urban concrete."
            elif env_type == "DESERT":
                score = 0.6
                explanation = "Any disturbance in uniform desert is suspicious."
            else:
                score = 0.2
                explanation = "Contextual significance normal."
                
            anomaly["evidence"]["contextScore"] = score
            anomaly["explanation"].append(f"Context: {explanation}")
            
        return anomalies
