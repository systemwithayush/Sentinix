package com.sentinel.services;

import com.sentinel.models.Camera;
import com.sentinel.repositories.CameraRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CameraService {

    private final CameraRepository cameraRepository;

    public CameraService(CameraRepository cameraRepository) {
        this.cameraRepository = cameraRepository;
    }

    public List<Camera> getAllCameras() {
        return cameraRepository.findAll();
    }

    public Optional<Camera> getCameraById(UUID id) {
        return cameraRepository.findById(id);
    }

    public Camera addCamera(Camera camera) {
        // Here we would also contact the AI Engine to register the stream
        return cameraRepository.save(camera);
    }

    public void deleteCamera(UUID id) {
        cameraRepository.deleteById(id);
    }
    
    public Camera updateCameraStatus(UUID id, String status) {
        return cameraRepository.findById(id).map(camera -> {
            camera.setStatus(status);
            return cameraRepository.save(camera);
        }).orElseThrow(() -> new RuntimeException("Camera not found"));
    }
}
