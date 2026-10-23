"""
SENTINEL Training Pipeline — Camouflage Concealment Segmentation
Trains EdgeGuidedUNet with joint mask and edge supervision.
Supports mixed precision (AMP), validation tracking, and independent synthetic benchmark evaluation.
"""

import os
import time
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm
from .utils import bce_dice_loss, compute_metrics, EarlyStopping

def train_camouflage_model(
    model,
    train_loader,
    val_loader,
    num_epochs=10,
    lr=3e-4,
    device='cuda',
    checkpoint_dir=r"d:\img project\sentinel_ml\checkpoints",
    early_stopping_patience=4
):
    os.makedirs(checkpoint_dir, exist_ok=True)
    best_ckpt_path = os.path.join(checkpoint_dir, "best_camouflage_model.pth")
    latest_ckpt_path = os.path.join(checkpoint_dir, "latest_camouflage_model.pth")

    model = model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    lr_scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)
    
    scaler = torch.amp.GradScaler('cuda') if device == 'cuda' else None
    early_stopper = EarlyStopping(patience=early_stopping_patience, mode='max')

    history = {
        "epoch": [],
        "train_loss": [],
        "val_loss": [],
        "val_iou": [],
        "val_f1": [],
        "val_precision": [],
        "val_recall": [],
        "peak_vram_mb": []
    }

    best_f1 = 0.0
    print(f"\n[Camouflage Concealment Training] Starting on {device} (Epochs: {num_epochs}, LR: {lr})")

    for epoch in range(num_epochs):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        train_batches = 0

        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1:02d}/{num_epochs:02d} [Train Camo]")
        for batch in pbar:
            if isinstance(batch, dict):
                images = batch["image"].to(device)
                masks = batch["mask"].to(device)
                edges = batch.get("edge", masks).to(device)
            else:
                images, masks = batch[0].to(device), batch[1].to(device)
                edges = masks

            optimizer.zero_grad()

            if scaler is not None:
                with torch.amp.autocast('cuda'):
                    pred_mask, pred_edge = model(images)
                    loss_seg = bce_dice_loss(pred_mask, masks)
                    loss_edge = F.binary_cross_entropy_with_logits(pred_edge, edges)
                    loss = loss_seg + 0.3 * loss_edge
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                pred_mask, pred_edge = model(images)
                loss_seg = bce_dice_loss(pred_mask, masks)
                loss_edge = F.binary_cross_entropy_with_logits(pred_edge, edges)
                loss = loss_seg + 0.3 * loss_edge
                loss.backward()
                optimizer.step()

            running_loss += loss.item()
            train_batches += 1
            pbar.set_postfix({'loss': f"{loss.item():.4f}"})

        lr_scheduler.step()
        epoch_train_loss = running_loss / max(1, train_batches)

        # Validation
        model.eval()
        val_running_loss = 0.0
        val_metrics_accum = {"iou": 0.0, "f1": 0.0, "precision": 0.0, "recall": 0.0}
        val_batches = 0

        with torch.no_grad():
            for batch in tqdm(val_loader, desc=f"Epoch {epoch+1:02d}/{num_epochs:02d} [Val Camo]"):
                if isinstance(batch, dict):
                    images = batch["image"].to(device)
                    masks = batch["mask"].to(device)
                    edges = batch.get("edge", masks).to(device)
                else:
                    images, masks = batch[0].to(device), batch[1].to(device)
                    edges = masks

                if scaler is not None:
                    with torch.amp.autocast('cuda'):
                        pred_mask, pred_edge = model(images)
                        loss_seg = bce_dice_loss(pred_mask, masks)
                        loss_edge = F.binary_cross_entropy_with_logits(pred_edge, edges)
                        v_loss = loss_seg + 0.3 * loss_edge
                else:
                    pred_mask, pred_edge = model(images)
                    loss_seg = bce_dice_loss(pred_mask, masks)
                    loss_edge = F.binary_cross_entropy_with_logits(pred_edge, edges)
                    v_loss = loss_seg + 0.3 * loss_edge

                val_running_loss += v_loss.item()
                m = compute_metrics(pred_mask, masks)
                for k in val_metrics_accum:
                    val_metrics_accum[k] += m[k]
                val_batches += 1

        epoch_val_loss = val_running_loss / max(1, val_batches)
        epoch_val_iou = val_metrics_accum["iou"] / max(1, val_batches)
        epoch_val_f1 = val_metrics_accum["f1"] / max(1, val_batches)
        epoch_val_prec = val_metrics_accum["precision"] / max(1, val_batches)
        epoch_val_rec = val_metrics_accum["recall"] / max(1, val_batches)

        peak_vram = torch.cuda.max_memory_allocated(device) / (1024 ** 2) if device == 'cuda' else 0.0

        history["epoch"].append(epoch + 1)
        history["train_loss"].append(round(epoch_train_loss, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_iou"].append(round(epoch_val_iou, 4))
        history["val_f1"].append(round(epoch_val_f1, 4))
        history["val_precision"].append(round(epoch_val_prec, 4))
        history["val_recall"].append(round(epoch_val_rec, 4))
        history["peak_vram_mb"].append(round(peak_vram, 2))

        epoch_time = time.time() - epoch_start
        print(f"Epoch {epoch+1:02d}/{num_epochs:02d} [{epoch_time:.1f}s] - "
              f"Train Loss: {epoch_train_loss:.4f} - Val Loss: {epoch_val_loss:.4f} - "
              f"Val IoU: {epoch_val_iou:.4f} - Val F1: {epoch_val_f1:.4f} - "
              f"Precision: {epoch_val_prec:.4f} - Recall: {epoch_val_rec:.4f} - "
              f"VRAM: {peak_vram:.1f} MB")

        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_f1': epoch_val_f1,
            'val_iou': epoch_val_iou,
            'history': history
        }, latest_ckpt_path)

        if epoch_val_f1 > best_f1:
            best_f1 = epoch_val_f1
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_f1': epoch_val_f1,
                'val_iou': epoch_val_iou,
                'history': history
            }, best_ckpt_path)
            print(f"  [+] Saved New Best Model to: {best_ckpt_path} (F1: {best_f1:.4f})")

        if early_stopper(epoch_val_f1):
            print(f"  [!] Early stopping triggered at epoch {epoch+1}")
            break

    print(f"[Camouflage Training Complete] Best Val F1: {best_f1:.4f} saved to {best_ckpt_path}")
    return model, history
