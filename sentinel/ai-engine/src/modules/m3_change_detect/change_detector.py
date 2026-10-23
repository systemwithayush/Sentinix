import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class HistoricalChangeDetector:
    def __init__(self):
        # ORB for feature matching and alignment
        self.orb = cv2.ORB_create(5000)
        
        # Flann based matcher for fast feature matching
        index_params = dict(algorithm=6, table_number=6, key_size=12, multi_probe_level=1) # FLANN_INDEX_LSH
        search_params = dict(checks=50)
        self.matcher = cv2.FlannBasedMatcher(index_params, search_params)
        
    def align_images(self, img1, img2):
        """Aligns img2 to match img1 perspective."""
        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
        
        kp1, des1 = self.orb.detectAndCompute(gray1, None)
        kp2, des2 = self.orb.detectAndCompute(gray2, None)
        
        if des1 is None or des2 is None:
            return img2 # Return unaligned if no features
            
        matches = self.matcher.knnMatch(des1, des2, k=2)
        
        # Lowe's ratio test
        good_matches = []
        for match in matches:
            if len(match) == 2:
                m, n = match
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)
                    
        if len(good_matches) > 10:
            src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            
            # Find homography
            M, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
            
            if M is not None:
                h, w, _ = img1.shape
                aligned_img2 = cv2.warpPerspective(img2, M, (w, h))
                return aligned_img2
                
        return img2

    def analyze_change(self, before_img, after_img):
        """
        Compare two images and return the difference heatmap and changed regions.
        """
        # 1. Align the after image to the before image
        aligned_after = self.align_images(before_img, after_img)
        
        # 2. Structural Similarity or Absolute Difference
        # For phase 1 speed, we use Absolute Difference on blurred grayscale
        gray_before = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
        gray_after = cv2.cvtColor(aligned_after, cv2.COLOR_BGR2GRAY)
        
        blur_before = cv2.GaussianBlur(gray_before, (11, 11), 0)
        blur_after = cv2.GaussianBlur(gray_after, (11, 11), 0)
        
        diff = cv2.absdiff(blur_before, blur_after)
        
        # 3. Thresholding to extract regions
        _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        
        # Morphological operations to clean up small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # 4. Find Contours for changed regions
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100: # Ignore tiny changes
                x, y, w, h = cv2.boundingRect(contour)
                regions.append({"bbox": (x, y, w, h), "area": area})
                
        # 5. Generate Heatmap
        heatmap_img = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
        # Overlay heatmap on original image for context
        overlay = cv2.addWeighted(before_img, 0.6, heatmap_img, 0.4, 0)
        
        return {
            "aligned_after_image": aligned_after,
            "heatmap": overlay,
            "regions": regions
        }
