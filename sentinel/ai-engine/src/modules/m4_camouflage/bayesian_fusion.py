from typing import List, Dict

class EvidenceFusionEngine:
    def __init__(self, weights: Dict[str, float] = None):
        # Default weights for evidence fusion
        self.weights = weights or {
            "geometryScore": 0.2,
            "textureScore": 0.2,
            "temporalScore": 0.15,
            "vegetationScore": 0.15,
            "shadowScore": 0.15,
            "contextScore": 0.15
        }

    def fuse(self, associated_regions: List[Dict], modifiers: Dict[str, float] = None) -> List[Dict]:
        """
        Takes spatially associated regions (from SpatialAssociator) and applies
        a fusion algorithm (Weighted Sum / Bayesian updating) to calculate the final 
        unified threat score. Supports dynamic modifiers from the Context Engine.
        """
        fused_results = []
        mods = modifiers or {k: 1.0 for k in self.weights.keys()}
        
        for region in associated_regions:
            evidence = region.get('evidence', {})
            g_score = evidence.get('geometryScore', 0.0)
            t_score = evidence.get('textureScore', 0.0)
            tmp_score = evidence.get('temporalScore', 0.0)
            v_score = evidence.get('vegetationScore', 0.0)
            s_score = evidence.get('shadowScore', 0.0)
            c_score = evidence.get('contextScore', 0.0)

            # Basic Weighted Fusion with Context Modifiers
            fusion_score = (
                (self.weights.get('geometryScore', 0.2) * mods.get('geometryScore', 1.0)) * g_score +
                (self.weights.get('textureScore', 0.2) * mods.get('textureScore', 1.0)) * t_score +
                (self.weights.get('temporalScore', 0.15) * mods.get('temporalScore', 1.0)) * tmp_score +
                (self.weights.get('vegetationScore', 0.15) * mods.get('vegetationScore', 1.0)) * v_score +
                (self.weights.get('shadowScore', 0.15) * mods.get('shadowScore', 1.0)) * s_score +
                (self.weights.get('contextScore', 0.15) * mods.get('contextScore', 1.0)) * c_score
            )
            
            # Simple Bayesian Update approximation (if multiple high confidence signals overlap)
            # P(A|B) = [P(B|A)*P(A)] / P(B)
            # Here we apply a synergy boost if both Geometry and Texture strongly agree
            if g_score > 0.6 and t_score > 0.6:
                fusion_score = min(1.0, fusion_score * 1.2) # 20% synergy boost
                region['explanation'].append("Fusion Synergy: Multi-modal agreement (Geometry + Texture)")

            region['finalFusionScore'] = float(round(fusion_score, 3))
            
            # Calculate contribution percentages
            total_weight = sum([float(x) for x in [g_score, t_score, tmp_score, v_score, s_score, c_score]]) + 1e-6
            region['contributions'] = {
                "geometry": float(round((float(g_score) / total_weight) * 100, 1)),
                "texture": float(round((float(t_score) / total_weight) * 100, 1)),
                "temporal": float(round((float(tmp_score) / total_weight) * 100, 1)),
                "vegetation": float(round((float(v_score) / total_weight) * 100, 1)),
                "shadow": float(round((float(s_score) / total_weight) * 100, 1)),
                "context": float(round((float(c_score) / total_weight) * 100, 1))
            }
            
            # Threat Prioritization (Phase 4 rules)
            max_evidence = max(g_score, t_score, tmp_score, v_score, s_score, c_score)
            if v_score > 0.5 and v_score == max_evidence:
                region['overallStatus'] = "Potential vegetation anomaly"
            elif s_score > 0.5 and s_score == max_evidence:
                region['overallStatus'] = "Potential shadow anomaly"
            elif c_score > 0.5 and c_score == max_evidence:
                region['overallStatus'] = "Potential contextual anomaly"
            elif fusion_score >= 0.5:
                region['overallStatus'] = "Requires operator review"
            else:
                region['overallStatus'] = "MONITORING"
                
            fused_results.append(region)
            
        return fused_results
