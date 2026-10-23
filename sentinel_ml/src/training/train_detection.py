"""
SENTINEL Training Pipeline — Object & Drone Detection (FPN)
Supports Faster R-CNN training on DOTA v1.5 structures and isolated Anti-UAV drones.
Includes custom collate function, AMP mixed precision, loss decomposition, and checkpointing.
"""

import os
import time
import math
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

def detection_collate_fn(batch):
    """
    Custom collator for variable-sized bounding box batches.
    Returns:
        images: list of (C, H, W) tensors
        targets: list of dicts with 'boxes' and 'labels'
    """
    images = []
    targets = []
    for item in batch:
        images.append(item["image"])
        targets.append({
            "boxes": item["boxes"],
            "labels": item["labels"]
        })
    return images, targets

def train_detection_model(
    model,
    train_loader,
    val_loader,
    num_epochs=10,
    lr=1e-3,
    device='cuda',
    model_name="structure_detector",
    checkpoint_dir=r"d:\img project\sentinel_ml\checkpoints"
):
    os.makedirs(checkpoint_dir, exist_ok=True)
    best_ckpt_path = os.path.join(checkpoint_dir, f"best_{model_name}.pth")
    latest_ckpt_path = os.path.join(checkpoint_dir, f"latest_{model_name}.pth")

    model = model.to(device)
    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=1e-4)
    lr_scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-5)
    
    scaler = torch.amp.GradScaler('cuda') if device == 'cuda' else None

    history = {
        "epoch": [],
        "train_loss": [],
        "val_loss": [],
        "loss_classifier": [],
        "loss_box_reg": [],
        "loss_objectness": [],
        "loss_rpn_box_reg": [],
        "peak_vram_mb": []
    }

    best_val_loss = float('inf')
    print(f"\n[FPN Detection Training: {model_name}] Starting on {device} (Epochs: {num_epochs}, LR: {lr})")

    for epoch in range(num_epochs):
        epoch_start = time.time()
        model.train()
        running_train_loss = 0.0
        train_batches = 0
        loss_components = {"loss_classifier": 0.0, "loss_box_reg": 0.0, "loss_objectness": 0.0, "loss_rpn_box_reg": 0.0}

        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1:02d}/{num_epochs:02d} [Train {model_name}]")
        for images, targets in pbar:
            images = [img.to(device) for img in images]
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

            # Filter out images with empty boxes during training if necessary
            valid_idx = [i for i, t in enumerate(targets) if len(t["boxes"]) > 0]
            if len(valid_idx) == 0:
                continue
            images = [images[i] for i in valid_idx]
            targets = [targets[i] for i in valid_idx]

            optimizer.zero_grad()

            if scaler is not None:
                with torch.amp.autocast('cuda'):
                    loss_dict = model(images, targets)
                    losses = sum(loss for loss in loss_dict.values())
                scaler.scale(losses).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                loss_dict = model(images, targets)
                losses = sum(loss for loss in loss_dict.values())
                losses.backward()
                optimizer.step()

            loss_val = losses.item()
            if not math.isfinite(loss_val):
                print(f"[!] Loss is {loss_val}, skipping batch")
                continue

            running_train_loss += loss_val
            for k in loss_components:
                if k in loss_dict:
                    loss_components[k] += loss_dict[k].item()
            train_batches += 1
            pbar.set_postfix({'loss': f"{loss_val:.4f}"})

        lr_scheduler.step()
        epoch_train_loss = running_train_loss / max(1, train_batches)

        # Validation (compute validation loss in train mode with no_grad)
        val_running_loss = 0.0
        val_batches = 0
        with torch.no_grad():
            for images, targets in tqdm(val_loader, desc=f"Epoch {epoch+1:02d}/{num_epochs:02d} [Val {model_name}]"):
                images = [img.to(device) for img in images]
                targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
                valid_idx = [i for i, t in enumerate(targets) if len(t["boxes"]) > 0]
                if len(valid_idx) == 0:
                    continue
                images = [images[i] for i in valid_idx]
                targets = [targets[i] for i in valid_idx]

                if scaler is not None:
                    with torch.amp.autocast('cuda'):
                        loss_dict = model(images, targets)
                        v_losses = sum(l for l in loss_dict.values())
                else:
                    loss_dict = model(images, targets)
                    v_losses = sum(l for l in loss_dict.values())

                val_running_loss += v_losses.item()
                val_batches += 1

        epoch_val_loss = val_running_loss / max(1, val_batches) if val_batches > 0 else epoch_train_loss
        peak_vram = torch.cuda.max_memory_allocated(device) / (1024 ** 2) if device == 'cuda' else 0.0

        history["epoch"].append(epoch + 1)
        history["train_loss"].append(round(epoch_train_loss, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        for k in loss_components:
            history[k].append(round(loss_components[k] / max(1, train_batches), 4))
        history["peak_vram_mb"].append(round(peak_vram, 2))

        epoch_time = time.time() - epoch_start
        print(f"Epoch {epoch+1:02d}/{num_epochs:02d} [{epoch_time:.1f}s] - "
              f"Train Loss: {epoch_train_loss:.4f} - Val Loss: {epoch_val_loss:.4f} - "
              f"Cls Loss: {history['loss_classifier'][-1]:.4f} - Reg Loss: {history['loss_box_reg'][-1]:.4f} - "
              f"VRAM: {peak_vram:.1f} MB")

        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_loss': epoch_val_loss,
            'history': history
        }, latest_ckpt_path)

        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save({
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': epoch_val_loss,
                'history': history
            }, best_ckpt_path)
            print(f"  [+] Saved New Best Model to: {best_ckpt_path} (Val Loss: {best_val_loss:.4f})")

    print(f"[{model_name} Training Complete] Best Val Loss: {best_val_loss:.4f} saved to {best_ckpt_path}")
    return model, history
