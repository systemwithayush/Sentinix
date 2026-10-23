"""
SENTINEL — Stage 4: Production Model Export & Parity Validation
Exports trained SENTINEL models to TorchScript and ONNX in sentinel_ml/exports/.
Validates numerical parity (max abs error < 1e-4) and benchmarks latency (ms) & FPS.
"""

import os
import sys
import time
import json
import torch
import numpy as np

# Ensure sentinel_ml root is in path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.models.siamese_cd import SiameseChangeDetector
from src.models.edge_guided_unet import EdgeGuidedUNet
from src.models.fpn_detector import get_fpn_detector

def benchmark_inference(model_fn, dummy_inputs, num_warmup=10, num_iters=50):
    """Measures mean latency (ms) and throughput (FPS)."""
    # Check if inputs are CUDA tensors
    is_cuda_input = False
    if len(dummy_inputs) > 0:
        first = dummy_inputs[0]
        if isinstance(first, torch.Tensor):
            is_cuda_input = first.is_cuda
        elif isinstance(first, (list, tuple)) and len(first) > 0 and isinstance(first[0], torch.Tensor):
            is_cuda_input = first[0].is_cuda

    # Warmup
    for _ in range(num_warmup):
        _ = model_fn(*dummy_inputs)
        
    if torch.cuda.is_available() and is_cuda_input:
        torch.cuda.synchronize()
        
    start_t = time.perf_counter()
    for _ in range(num_iters):
        _ = model_fn(*dummy_inputs)
        
    if torch.cuda.is_available() and is_cuda_input:
        torch.cuda.synchronize()
        
    elapsed = time.perf_counter() - start_t
    mean_lat_ms = (elapsed / num_iters) * 1000.0
    fps = 1000.0 / max(0.01, mean_lat_ms)
    return round(mean_lat_ms, 2), round(fps, 1)

def main():
    print("=" * 80)
    print("SENTINEL ML - STAGE 4: PRODUCTION MODEL EXPORT & PARITY VALIDATION")
    print("=" * 80)

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"[Device Verification] Export & Parity Device: {device}")

    ckpt_dir = os.path.join(ROOT_DIR, "checkpoints")
    export_dir = os.path.join(ROOT_DIR, "exports")
    reports_dir = os.path.join(ROOT_DIR, "reports")
    os.makedirs(export_dir, exist_ok=True)

    export_manifest = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hardware": {
            "device": str(device),
            "gpu_name": torch.cuda.get_device_name(0) if device == 'cuda' else "CPU"
        },
        "exported_models": {}
    }

    # -------------------------------------------------------------------------
    # 1. Export Siamese Change Detector
    # -------------------------------------------------------------------------
    print("\n[Export 1/4] Exporting SiameseChangeDetector...")
    cd_ckpt = os.path.join(ckpt_dir, "best_siamese_cd.pth")
    if os.path.exists(cd_ckpt):
        model = SiameseChangeDetector(in_channels=3, out_channels=1).to(device)
        model.load_state_dict(torch.load(cd_ckpt, map_location=device)["model_state_dict"])
        model.eval()

        t1 = torch.randn(1, 3, 512, 512, device=device)
        t2 = torch.randn(1, 3, 512, 512, device=device)

        # Baseline PyTorch eager output
        with torch.no_grad():
            py_out = model(t1, t2).cpu().numpy()

        # A. TorchScript Export via JIT Tracing
        ts_path = os.path.join(export_dir, "siamese_cd.torchscript.pt")
        with torch.no_grad():
            traced_ts = torch.jit.trace(model, (t1, t2))
            traced_ts.save(ts_path)

        # Validate TorchScript Parity
        loaded_ts = torch.jit.load(ts_path, map_location=device)
        with torch.no_grad():
            ts_out = loaded_ts(t1, t2).cpu().numpy()
        ts_max_diff = float(np.max(np.abs(py_out - ts_out)))
        ts_lat, ts_fps = benchmark_inference(loaded_ts, (t1, t2))

        # B. ONNX Export
        onnx_path = os.path.join(export_dir, "siamese_cd.onnx")
        onnx_exported = False
        try:
            torch.onnx.export(
                model,
                (t1, t2),
                onnx_path,
                input_names=["t1", "t2"],
                output_names=["change_mask"],
                opset_version=14,
                dynamic_axes={"t1": {0: "batch"}, "t2": {0: "batch"}, "change_mask": {0: "batch"}}
            )
            onnx_exported = os.path.exists(onnx_path)
        except Exception as e:
            print(f"  [-] ONNX export skipped: {e}")

        export_manifest["exported_models"]["siamese_change_detector"] = {
            "torchscript": {
                "path": ts_path,
                "size_mb": round(os.path.getsize(ts_path) / (1024**2), 2),
                "max_parity_delta": ts_max_diff,
                "parity_verified": ts_max_diff < 1e-4,
                "latency_ms": ts_lat,
                "throughput_fps": ts_fps
            },
            "onnx": {
                "path": onnx_path if onnx_exported else None,
                "exported": onnx_exported,
                "size_mb": round(os.path.getsize(onnx_path) / (1024**2), 2) if onnx_exported else 0.0
            }
        }
        print(f"  [+] Siamese CD TorchScript: Parity Delta={ts_max_diff:.2e} (Passed: {ts_max_diff < 1e-4}), Speed: {ts_lat:.1f}ms ({ts_fps:.1f} FPS)")

    # -------------------------------------------------------------------------
    # 2. Export Camouflage Concealment Model (EdgeGuidedUNet)
    # -------------------------------------------------------------------------
    print("\n[Export 2/4] Exporting EdgeGuidedUNet...")
    camo_ckpt = os.path.join(ckpt_dir, "best_camouflage_model.pth")
    if os.path.exists(camo_ckpt):
        model = EdgeGuidedUNet(in_channels=3, out_channels=1).to(device)
        model.load_state_dict(torch.load(camo_ckpt, map_location=device)["model_state_dict"])
        model.eval()

        img = torch.randn(1, 3, 512, 512, device=device)

        with torch.no_grad():
            py_mask, py_edge = model(img)
            py_mask = py_mask.cpu().numpy()

        ts_path = os.path.join(export_dir, "camouflage_model.torchscript.pt")
        with torch.no_grad():
            traced_ts = torch.jit.trace(model, img)
            traced_ts.save(ts_path)

        loaded_ts = torch.jit.load(ts_path, map_location=device)
        with torch.no_grad():
            ts_mask, _ = loaded_ts(img)
            ts_mask = ts_mask.cpu().numpy()
        ts_max_diff = float(np.max(np.abs(py_mask - ts_mask)))
        ts_lat, ts_fps = benchmark_inference(loaded_ts, (img,))

        onnx_path = os.path.join(export_dir, "camouflage_model.onnx")
        onnx_exported = False
        try:
            torch.onnx.export(
                model,
                img,
                onnx_path,
                input_names=["image"],
                output_names=["segmentation_mask", "edge_map"],
                opset_version=14,
                dynamic_axes={"image": {0: "batch"}, "segmentation_mask": {0: "batch"}}
            )
            onnx_exported = os.path.exists(onnx_path)
        except Exception as e:
            print(f"  [-] ONNX export skipped: {e}")

        export_manifest["exported_models"]["camouflage_concealment"] = {
            "torchscript": {
                "path": ts_path,
                "size_mb": round(os.path.getsize(ts_path) / (1024**2), 2),
                "max_parity_delta": ts_max_diff,
                "parity_verified": ts_max_diff < 1e-4,
                "latency_ms": ts_lat,
                "throughput_fps": ts_fps
            },
            "onnx": {
                "path": onnx_path if onnx_exported else None,
                "exported": onnx_exported,
                "size_mb": round(os.path.getsize(onnx_path) / (1024**2), 2) if onnx_exported else 0.0
            }
        }
        print(f"  [+] Camo TorchScript: Parity Delta={ts_max_diff:.2e} (Passed: {ts_max_diff < 1e-4}), Speed: {ts_lat:.1f}ms ({ts_fps:.1f} FPS)")

    # -------------------------------------------------------------------------
    # 3. Export Visible Drone Discriminator (MobileNetV3)
    # -------------------------------------------------------------------------
    print("\n[Export 3/4] Exporting Visible Drone Discriminator...")
    vis_ckpt = os.path.join(ckpt_dir, "best_visible_drone_detector.pth")
    if os.path.exists(vis_ckpt):
        import torchvision.models as tv_models
        model = tv_models.mobilenet_v3_small(weights=None)
        model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, 4)
        model = model.to(device)
        model.load_state_dict(torch.load(vis_ckpt, map_location=device))
        model.eval()

        img = torch.randn(1, 3, 224, 224, device=device)

        with torch.no_grad():
            py_out = model(img).cpu().numpy()

        ts_path = os.path.join(export_dir, "visible_drone_detector.torchscript.pt")
        with torch.no_grad():
            traced_ts = torch.jit.trace(model, img)
            traced_ts.save(ts_path)

        loaded_ts = torch.jit.load(ts_path, map_location=device)
        with torch.no_grad():
            ts_out = loaded_ts(img).cpu().numpy()
        ts_max_diff = float(np.max(np.abs(py_out - ts_out)))
        ts_lat, ts_fps = benchmark_inference(loaded_ts, (img,))

        onnx_path = os.path.join(export_dir, "visible_drone_detector.onnx")
        onnx_exported = False
        try:
            torch.onnx.export(
                model,
                img,
                onnx_path,
                input_names=["image"],
                output_names=["class_logits"],
                opset_version=14,
                dynamic_axes={"image": {0: "batch"}, "class_logits": {0: "batch"}}
            )
            onnx_exported = os.path.exists(onnx_path)
        except Exception as e:
            print(f"  [-] ONNX export skipped: {e}")

        export_manifest["exported_models"]["visible_drone_detector"] = {
            "torchscript": {
                "path": ts_path,
                "size_mb": round(os.path.getsize(ts_path) / (1024**2), 2),
                "max_parity_delta": ts_max_diff,
                "parity_verified": ts_max_diff < 1e-4,
                "latency_ms": ts_lat,
                "throughput_fps": ts_fps
            },
            "onnx": {
                "path": onnx_path if onnx_exported else None,
                "exported": onnx_exported,
                "size_mb": round(os.path.getsize(onnx_path) / (1024**2), 2) if onnx_exported else 0.0
            }
        }
        print(f"  [+] Visible Drone TorchScript: Parity Delta={ts_max_diff:.2e} (Passed: {ts_max_diff < 1e-4}), Speed: {ts_lat:.1f}ms ({ts_fps:.1f} FPS)")

    # -------------------------------------------------------------------------
    # 4. Thermal Drone Detector Profiling & Registration
    # -------------------------------------------------------------------------
    print("\n[Export 4/5] Profiling & Registering Thermal Drone Detector...")
    thermal_ckpt = os.path.join(ckpt_dir, "best_thermal_drone_detector.pth")
    if os.path.exists(thermal_ckpt):
        model = get_fpn_detector(num_classes=2, backbone='mobilenet_v3', pretrained_backbone=False).to(device)
        model.load_state_dict(torch.load(thermal_ckpt, map_location=device)["model_state_dict"])
        model.eval()

        img_list = [torch.randn(3, 512, 512, device=device)]
        lat_ms, fps = benchmark_inference(model, (img_list,), num_warmup=5, num_iters=25)

        export_manifest["exported_models"]["thermal_drone_detector"] = {
            "architecture": "FasterRCNN_FPN (Thermal IR Isolated)",
            "license": "STRICTLY_NON_COMMERCIAL_RESEARCH",
            "weights_path": thermal_ckpt,
            "weights_size_mb": round(os.path.getsize(thermal_ckpt) / (1024**2), 2),
            "inference_latency_ms": lat_ms,
            "throughput_fps": fps
        }
        print(f"  [+] Thermal Drone FPN: Inference Speed={lat_ms:.1f}ms ({fps:.1f} FPS)")

    # -------------------------------------------------------------------------
    # 5. Structure Detector Profiling & Registration
    # -------------------------------------------------------------------------
    print("\n[Export 5/5] Profiling & Registering Structure Detector...")
    struct_ckpt = os.path.join(ckpt_dir, "best_structure_detector.pth")
    if os.path.exists(struct_ckpt):
        model = get_fpn_detector(num_classes=17, backbone='mobilenet_v3', pretrained_backbone=False).to(device)
        model.load_state_dict(torch.load(struct_ckpt, map_location=device)["model_state_dict"])
        model.eval()

        img_list = [torch.randn(3, 512, 512, device=device)]
        lat_ms, fps = benchmark_inference(model, (img_list,), num_warmup=5, num_iters=25)

        export_manifest["exported_models"]["structure_detector"] = {
            "architecture": "FasterRCNN_FPN (DOTA v1.5)",
            "num_classes": 17,
            "weights_path": struct_ckpt,
            "weights_size_mb": round(os.path.getsize(struct_ckpt) / (1024**2), 2),
            "inference_latency_ms": lat_ms,
            "throughput_fps": fps
        }
        print(f"  [+] Structure Detector FPN: Inference Speed={lat_ms:.1f}ms ({fps:.1f} FPS)")

    # Save manifest
    manifest_p = os.path.join(reports_dir, "model_export_manifest.json")
    with open(manifest_p, 'w') as fp:
        json.dump(export_manifest, fp, indent=2)

    print("\n" + "=" * 80)
    print("PRODUCTION MODEL EXPORT COMPLETE")
    print(f"Export manifest saved to: {manifest_p}")
    print("Exported files in:", export_dir)
    print("=" * 80)

if __name__ == "__main__":
    main()
