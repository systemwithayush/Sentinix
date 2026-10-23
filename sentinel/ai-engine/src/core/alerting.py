import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

BACKEND_URL = "http://localhost:8080/api/v1/alerts"

class AlertManager:
    @staticmethod
    def send_alert(camera_id: str, module: str, threat_level: int, description: str) -> bool:
        """
        Pushes an alert to the Spring Boot backend.
        """
        payload = {
            "cameraId": camera_id,
            "module": module,
            "threatLevel": threat_level,
            "description": description
        }
        
        try:
            response = requests.post(BACKEND_URL, json=payload, timeout=2.0)
            response.raise_for_status()
            logger.info(f"Alert sent successfully: {module} - Level {threat_level}")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send alert to backend: {e}")
            return False
