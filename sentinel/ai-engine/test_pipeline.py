import requests
import cv2
import numpy as np
import os

# Create dummy images for testing
os.makedirs("test_images", exist_ok=True)
hist_path = "test_images/hist.jpg"
curr_path = "test_images/curr.jpg"

# Historical: simple background
hist_img = np.ones((480, 640, 3), dtype=np.uint8) * 100
# Current: add a geometric anomaly (a rectangle) and texture anomaly (noise)
curr_img = hist_img.copy()
cv2.rectangle(curr_img, (200, 200), (300, 300), (50, 50, 50), -1) # Geometry + Temporal change
noise = np.random.normal(0, 50, (100, 100, 3)).astype(np.uint8)
curr_img[50:150, 400:500] = cv2.add(curr_img[50:150, 400:500], noise) # Texture anomaly

cv2.imwrite(hist_path, hist_img)
cv2.imwrite(curr_path, curr_img)

url = "http://127.0.0.1:8000/api/analysis/camouflage"
files = {
    'current': open(curr_path, 'rb'),
    'historical': open(hist_path, 'rb')
}

print("Sending test images to Phase 2/3 Camouflage Pipeline...")
response = requests.post(url, files=files)

print("Response Status Code:", response.status_code)
if response.status_code == 200:
    data = response.json()
    print("Environment Context:", data.get("environment_context"))
    print("Processing Time (ms):", data.get("processing_time_ms"))
    print("Total Anomalies Detected:", data.get("total_anomalies_detected"))
    for anomaly in data.get("results", []):
        print(f"\n- Anomaly ID: {anomaly['id']}")
        print(f"  Type: {anomaly['anomalyType']}")
        print(f"  Status: {anomaly.get('overallStatus')}")
        print(f"  Fusion Score: {anomaly.get('finalFusionScore')}")
        print(f"  Evidence: {anomaly.get('evidence')}")
else:
    print(response.text)
