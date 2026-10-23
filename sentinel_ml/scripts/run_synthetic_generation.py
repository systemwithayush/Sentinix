"""
SENTINEL — Stage 2: Synthetic Concealment Generation Runner
Executes the procedural generation of 600 synthetic concealment anomalies
and 200 hard negative background patches on authentic aerial/satellite imagery.
"""

import os
import sys
import time
import json
import numpy as np

# Ensure sentinel_ml root is in path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.data.synthetic_generator import SyntheticConcealmentGenerator, set_seed

def main():
    print("=" * 70)
    print("SENTINEL ML - STAGE 2: SYNTHETIC CONCEALMENT DATA GENERATION")
    print("=" * 70)
    start_time = time.time()
    set_seed(42)

    # 1. Define authentic background sources
    bg_dirs = [
        os.path.join(ROOT_DIR, "data", "DOTA", "DOTA", "train", "images"),
        os.path.join(ROOT_DIR, "data", "LEVIR-CD-Plus", "LEVIR-CD+", "train", "A"),
        os.path.join(ROOT_DIR, "data", "LEVIR-CD-Plus", "LEVIR-CD+", "train", "B"),
        os.path.join(ROOT_DIR, "data", "WHU-CD", "Building change detection dataset_add", "train", "before"),
        os.path.join(ROOT_DIR, "data", "WHU-CD", "Building change detection dataset_add", "train", "after")
    ]
    
    print("\n[Step 1] Verifying background image sources:")
    valid_bg_dirs = []
    for d in bg_dirs:
        if os.path.exists(d):
            file_count = len([f for f in os.listdir(d) if f.lower().endswith(('.png', '.jpg', '.tif'))])
            print(f"  [+] Found source dir: {d} ({file_count} tiles)")
            valid_bg_dirs.append(d)
        else:
            print(f"  [-] Missing source dir: {d}")

    if not valid_bg_dirs:
        raise RuntimeError("No valid background source directories found!")

    # 2. Initialize generator
    output_dir = os.path.join(ROOT_DIR, "data", "SYNTHETIC_CONCEALMENT")
    generator = SyntheticConcealmentGenerator(
        background_dirs=valid_bg_dirs,
        output_dir=output_dir,
        img_size=512
    )

    # 3. Execute generation
    num_anomalies = 600
    num_negatives = 200
    print(f"\n[Step 2] Launching generation: {num_anomalies} anomalies + {num_negatives} hard negatives...")
    manifest = generator.generate_dataset(num_anomalies=num_anomalies, num_hard_negatives=num_negatives)

    # 4. Perform post-generation audit and validation
    print("\n[Step 3] Post-generation audit & statistics...")
    images_dir = os.path.join(output_dir, "images")
    masks_dir = os.path.join(output_dir, "masks")
    meta_dir = os.path.join(output_dir, "metadata")
    overlays_dir = os.path.join(output_dir, "overlays")

    img_files = os.listdir(images_dir)
    mask_files = os.listdir(masks_dir)
    meta_files = os.listdir(meta_dir)
    overlay_files = os.listdir(overlays_dir)

    print(f"  Total Images Generated:    {len(img_files)}")
    print(f"  Total Masks Generated:     {len(mask_files)}")
    print(f"  Total Metadata Files:      {len(meta_files)}")
    print(f"  Total Visual Overlays:     {len(overlay_files)}")

    # Class breakdown
    type_counts = {}
    mask_coverage = []
    bg_sources = {}
    for item in manifest:
        atype = item.get("anomaly_type", "unknown")
        type_counts[atype] = type_counts.get(atype, 0) + 1
        
        bg_src = item.get("background_source", "unknown")
        bg_sources[bg_src] = bg_sources.get(bg_src, 0) + 1

    print("\nAnomaly Breakdown:")
    for atype, cnt in sorted(type_counts.items()):
        print(f"  - {atype}: {cnt}")

    # Verify naming convention compliance
    all_synthetic_named = all("SYNTHETIC" in f for f in img_files) and all("SYNTHETIC" in f for f in mask_files)
    print(f"\nNaming Convention Strict Compliance ('SYNTHETIC' prefix): {'PASSED' if all_synthetic_named else 'FAILED'}")

    elapsed = time.time() - start_time
    print(f"\n[Generation Complete] Finished in {elapsed:.2f} seconds.")
    print("=" * 70)

if __name__ == "__main__":
    main()
