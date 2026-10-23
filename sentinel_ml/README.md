# SENTINEL-ML: Deep Defense-AI & Multi-Source Geospatial Vision Suite

This directory contains the machine learning and computer vision architectures, training pipelines, evaluation benchmarks, and production model exports developed for the **SENTINEL** Multi-Source Visual Intelligence Platform.

---

## Directory Layout

```
sentinel_ml/
├── checkpoints/              # Best PyTorch model weights (.pth)
│   ├── best_siamese_cd.pth
│   ├── best_camouflage_model.pth
│   ├── best_structure_detector.pth
│   ├── best_thermal_drone_detector.pth
│   └── best_visible_drone_detector.pth
├── exports/                  # Serialized TorchScript JIT models (.pt)
│   ├── siamese_cd.torchscript.pt
│   ├── camouflage_model.torchscript.pt
│   └── visible_drone_detector.torchscript.pt
├── reports/                  # Stage audit, evaluation, and verification reports
│   ├── STAGE_0_INVENTORY_AUDIT_REPORT.md
│   ├── STAGE_1_UNIFIED_DATA_LAYER_REPORT.md
│   ├── STAGE_2_SYNTHETIC_CONCEALMENT_REPORT.md
│   ├── STAGE_3_MODEL_TRAINING_REPORT.md
│   ├── STAGE_4_EVALUATION_REPORT.md
│   ├── STAGE_5_FINAL_VERIFICATION_REPORT.md
│   ├── benchmark_results.json
│   ├── model_export_manifest.json
│   ├── stage3_training_metrics.json
│   ├── stage5_verification_matrix.json
│   ├── data_validation/          # 160 Stage 1 data validation panels
│   └── evaluation_visualizations/# 19 Stage 4 visual inference panels
├── scripts/                  # Standalone execution pipelines
│   ├── run_stage1_loaders.py
│   ├── run_stage2_synthetic.py
│   ├── run_stage3_training.py
│   ├── run_stage4_evaluation.py
│   ├── run_stage4_export.py
│   └── run_stage5_verification.py
└── src/                      # Library modules
    ├── data/                 # Unified dataset parsers & loaders
    ├── models/               # PyTorch neural architectures
    ├── training/             # Loss functions & AMP trainers
    ├── evaluation/           # Metrics calculators
    └── inference/            # SentinelInferenceEngine production adapter
```

---

## 5 Production Neural Architectures

1. **Bi-Temporal Siamese Change Detector:**
   - Architecture: Dual-backbone Siamese CNN with feature difference correlation.
   - Dataset: LEVIR-CD+ Optical Satellite holdout.
   - Throughput: **71.8 FPS (13.9 ms)** | JIT Size: **7.7 MB**.
2. **Edge-Guided Camouflage & Anomaly Segmentation UNet:**
   - Architecture: Dual-decoder UNet with boundary discontinuity attention.
   - Dataset: COD10K + CAMO + Synthetic Concealment.
   - Performance: **0.00% False Positive Rate on Hard-Negative Terrains**.
   - Throughput: **93.5 FPS (10.7 ms)** | JIT Size: **29.5 MB**.
3. **16-Class Aerial Structure & Vehicle Detector:**
   - Architecture: Faster R-CNN with MobileNetV3 Feature Pyramid Network (FPN).
   - Dataset: DOTA v1.5 aerial overhead imagery.
   - Latency: **94.7 ms** | Weights: **145.1 MB**.
4. **Thermal IR Drone Tracker (Anti-UAV):**
   - Architecture: Faster R-CNN FPN (Isolated Single-Channel / 3-Channel Thermal IR).
   - Benchmark: **100.0% Detection Rate on Validation Sequences**.
   - License: Strictly non-commercial research isolation.
5. **Visible Optical Aerial Target Classifier:**
   - Architecture: MobileNetV3-Small (Drone, Bird, Airplane, Helicopter).
   - Throughput: **67.9 FPS (14.7 ms)** | JIT Size: **6.2 MB**.

---

## Verification & Execution

To re-run the full 18-test end-to-end verification suite:
```bash
python sentinel_ml/scripts/run_stage5_verification.py
```
Expected outcome: **18/18 Tests Passed (100.0% Acceptance Rate)**.
