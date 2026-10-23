"""
SENTINEL ML Training Utilities
Metrics, loss functions, early stopping, and checkpoint management.
"""

import os
import torch
import torch.nn.functional as F
import numpy as np

def bce_dice_loss(pred, target, bce_weight=0.5):
    """
    Combined Binary Cross-Entropy and Soft Dice Loss for segmentation.
    Handles extreme foreground/background class imbalance.
    pred: raw logits (B, 1, H, W)
    target: binary ground truth (B, 1, H, W) in [0, 1]
    """
    bce = F.binary_cross_entropy_with_logits(pred, target)
    
    probs = torch.sigmoid(pred)
    smooth = 1e-5
    intersection = (probs * target).sum(dim=(2, 3))
    cardinality = probs.sum(dim=(2, 3)) + target.sum(dim=(2, 3))
    dice = 1.0 - (2.0 * intersection + smooth) / (cardinality + smooth)
    
    return bce_weight * bce + (1.0 - bce_weight) * dice.mean()

def compute_metrics(pred, target, threshold=0.5):
    """
    Computes IoU (Jaccard), F1 (Dice), Precision, and Recall.
    pred: raw logits or probabilities (B, 1, H, W)
    target: binary ground truth (B, 1, H, W)
    """
    if pred.shape != target.shape:
        pred = F.interpolate(pred, size=target.shape[2:], mode='bilinear', align_corners=False)
        
    probs = torch.sigmoid(pred) if (pred.min() < 0.0 or pred.max() > 1.0) else pred
    binary_pred = (probs >= threshold).float()
    binary_gt = (target >= 0.5).float()
    
    tp = (binary_pred * binary_gt).sum().item()
    fp = (binary_pred * (1.0 - binary_gt)).sum().item()
    fn = ((1.0 - binary_pred) * binary_gt).sum().item()
    
    precision = tp / (tp + fp + 1e-7)
    recall = tp / (tp + fn + 1e-7)
    f1 = (2.0 * precision * recall) / (precision + recall + 1e-7)
    iou = tp / (tp + fp + fn + 1e-7)
    
    return {
        "iou": float(iou),
        "f1": float(f1),
        "precision": float(precision),
        "recall": float(recall)
    }

def compute_iou(pred, target, threshold=0.5):
    return compute_metrics(pred, target, threshold)["iou"]

class EarlyStopping:
    """
    Early stops the training if validation metric doesn't improve after a given patience.
    """
    def __init__(self, patience=5, mode='max', min_delta=1e-4):
        self.patience = patience
        self.mode = mode
        self.min_delta = min_delta
        self.counter = 0
        self.best_score = None
        self.early_stop = False
        self.val_score_min = float('inf') if mode == 'min' else -float('inf')

    def __call__(self, val_score):
        score = -val_score if self.mode == 'min' else val_score
        
        if self.best_score is None:
            self.best_score = score
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_score = score
            self.counter = 0
        return self.early_stop
