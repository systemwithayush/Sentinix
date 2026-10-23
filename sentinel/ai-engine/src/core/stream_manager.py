import cv2
import threading
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StreamManager:
    def __init__(self, camera_id: str, stream_url: str):
        self.camera_id = camera_id
        self.stream_url = stream_url
        self.cap = None
        self.running = False
        self.current_frame = None
        self.status = "OFFLINE"
        self.thread = None
        self.fps = 0
        self._frame_count = 0
        self._start_time = time.time()

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(f"Stream manager started for {self.camera_id}")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        if self.cap:
            self.cap.release()
        self.status = "OFFLINE"
        logger.info(f"Stream manager stopped for {self.camera_id}")

    def _capture_loop(self):
        while self.running:
            try:
                # Convert source to int if webcam (0, 1)
                source = int(self.stream_url) if self.stream_url.isdigit() else self.stream_url
                self.cap = cv2.VideoCapture(source)
                
                if not self.cap.isOpened():
                    logger.error(f"Failed to open stream: {self.stream_url}")
                    self.status = "ERROR"
                    time.sleep(5)  # Reconnect delay
                    continue

                self.status = "ON"
                self._frame_count = 0
                self._start_time = time.time()

                while self.running and self.cap.isOpened():
                    ret, frame = self.cap.read()
                    if not ret:
                        logger.warning(f"Stream lost: {self.camera_id}. Attempting reconnect...")
                        self.status = "WARNING"
                        break # Break inner loop to trigger reconnect

                    self.current_frame = frame
                    self._frame_count += 1
                    
                    # Calculate FPS every second
                    elapsed = time.time() - self._start_time
                    if elapsed >= 1.0:
                        self.fps = int(self._frame_count / elapsed)
                        self._frame_count = 0
                        self._start_time = time.time()

            except Exception as e:
                logger.error(f"Exception in capture loop for {self.camera_id}: {e}")
                self.status = "ERROR"
                time.sleep(5)
            
            finally:
                if self.cap:
                    self.cap.release()

    def get_latest_frame(self):
        return self.current_frame

    def get_status(self):
        return {
            "camera_id": self.camera_id,
            "status": self.status,
            "fps": self.fps
        }
