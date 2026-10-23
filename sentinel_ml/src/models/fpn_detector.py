"""
SENTINEL Feature Pyramid Network (FPN) Detectors
Optimized for tiny objects, drones, and aerial structures.
Configurable backbones with multi-scale anchor generation.
"""

import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor, FasterRCNN
from torchvision.models.detection.anchor_utils import AnchorGenerator

def get_fpn_detector(num_classes, backbone='mobilenet_v3', pretrained_backbone=True):
    """
    Creates an FPN-based object detector optimized for tiny aerial/satellite targets.
    backbone: 'mobilenet_v3' (lightweight, ~265MB VRAM) or 'resnet50' (~2.5GB VRAM)
    num_classes: total classes including background (class 0 = background)
    """
    if backbone == 'mobilenet_v3':
        model = torchvision.models.detection.fasterrcnn_mobilenet_v3_large_fpn(
            weights=None,
            weights_backbone="MobileNet_V3_Large_Weights.IMAGENET1K_V1" if pretrained_backbone else None
        )
        in_features = model.roi_heads.box_predictor.cls_score.in_features
        model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
        return model
    elif backbone == 'resnet50':
        model = torchvision.models.detection.fasterrcnn_resnet50_fpn(
            weights=None,
            weights_backbone="ResNet50_Weights.IMAGENET1K_V1" if pretrained_backbone else None
        )
        in_features = model.roi_heads.box_predictor.cls_score.in_features
        model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
        return model
    else:
        raise ValueError(f"Unsupported backbone: {backbone}")
