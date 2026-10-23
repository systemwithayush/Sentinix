import zipfile
import os
import sys

def extract_zip(zip_path, extract_to):
    print(f"Extracting {zip_path} to {extract_to}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print(f"Successfully extracted {zip_path}")
    except Exception as e:
        print(f"Error extracting {zip_path}: {e}")

zips_to_extract = [
    ("COD10K-v3.zip", "sentinel_ml/data/COD10K"),
    ("archive(4).zip", "sentinel_ml/data/CAMO"),
    ("archive (1).zip", "sentinel_ml/data/LEVIR-CD-Plus"),
    ("archive (2).zip", "sentinel_ml/data/WHU-CD"),
    ("Onera Satellite Change Detection dataset - Images.zip", "sentinel_ml/data/OSCD/images"),
    ("Onera Satellite Change Detection dataset - Train Labels.zip", "sentinel_ml/data/OSCD/labels"),
    ("archive(3).zip", "sentinel_ml/data/DOTA"),
    ("archive(5).zip", "sentinel_ml/data/Anti-UAV"),
    ("drone_detection_dataset-1.0.0.zip", "sentinel_ml/data/DroneDetect")
]

base_dir = r"d:\img project"

for zip_name, target_dir in zips_to_extract:
    zip_path = os.path.join(base_dir, zip_name)
    extract_path = os.path.join(base_dir, target_dir)
    os.makedirs(extract_path, exist_ok=True)
    if os.path.exists(zip_path):
        extract_zip(zip_path, extract_path)
    else:
        print(f"File not found: {zip_path}")

print("Extraction process completed for single zips.")
