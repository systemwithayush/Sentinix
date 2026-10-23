import cv2
import numpy as np

class RobustnessEvaluator:
    @staticmethod
    def add_gaussian_noise(image, mean=0, std=25):
        noise = np.random.normal(mean, std, image.shape).astype(np.uint8)
        return cv2.add(image, noise)

    @staticmethod
    def add_salt_and_pepper(image, prob=0.05):
        noisy = np.copy(image)
        # Salt
        num_salt = np.ceil(prob * image.size * 0.5)
        coords = [np.random.randint(0, i - 1, int(num_salt)) for i in image.shape]
        noisy[tuple(coords)] = 255
        # Pepper
        num_pepper = np.ceil(prob * image.size * 0.5)
        coords = [np.random.randint(0, i - 1, int(num_pepper)) for i in image.shape]
        noisy[tuple(coords)] = 0
        return noisy

    @staticmethod
    def add_blur(image, ksize=5):
        return cv2.GaussianBlur(image, (ksize, ksize), 0)

    @staticmethod
    def add_compression(image, quality=10):
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        result, encimg = cv2.imencode('.jpg', image, encode_param)
        return cv2.imdecode(encimg, 1)

    @staticmethod
    def add_brightness(image, value=50):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v = cv2.add(v, value)
        v[v > 255] = 255
        v[v < 0] = 0
        final_hsv = cv2.merge((h, s, v))
        return cv2.cvtColor(final_hsv, cv2.HSV2BGR)

    @staticmethod
    def calculate_iou(boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
        yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = boxA[2] * boxA[3]
        boxBArea = boxB[2] * boxB[3]
        return interArea / float(boxAArea + boxBArea - interArea) if (boxAArea + boxBArea - interArea) > 0 else 0

    def evaluate_detector(self, detector, clean_image, source_id="TEST"):
        """
        Runs the detector on the clean image and degraded versions to calculate robustness metrics.
        """
        results = {}
        clean_detections = detector.analyze(clean_image, source_id)
        
        degradations = {
            "gaussian": self.add_gaussian_noise(clean_image),
            "salt_pepper": self.add_salt_and_pepper(clean_image),
            "blur": self.add_blur(clean_image),
            "compression": self.add_compression(clean_image),
            "brightness": self.add_brightness(clean_image)
        }
        
        for name, degraded_img in degradations.items():
            degraded_detections = detector.analyze(degraded_img, source_id)
            
            # Simplified matching (assume 1 main anomaly for test purposes)
            orig_score = clean_detections[0]['confidenceScore'] if clean_detections else 0
            deg_score = degraded_detections[0]['confidenceScore'] if degraded_detections else 0
            
            iou = 0
            if clean_detections and degraded_detections:
                b1 = clean_detections[0]
                b2 = degraded_detections[0]
                iou = self.calculate_iou(
                    (b1['x'], b1['y'], b1['width'], b1['height']),
                    (b2['x'], b2['y'], b2['width'], b2['height'])
                )
                
            results[name] = {
                "originalDetectionScore": orig_score,
                "degradedDetectionScore": deg_score,
                "scoreDifference": abs(orig_score - deg_score),
                "regionOverlapIoU": iou,
                "detectionPersistence": "PASS" if iou > 0.5 else "FAIL"
            }
            
        return results
