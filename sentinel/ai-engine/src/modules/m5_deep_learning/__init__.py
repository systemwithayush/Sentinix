"""
SENTINEL Phase 5: Deep Learning Vision & Threat Intelligence Module (M5)
Integrates trained neural architectures from sentinel_ml into Sentinel ai-engine.
"""
from .dl_service import DeepLearningService, get_dl_service

__all__ = ["DeepLearningService", "get_dl_service"]
