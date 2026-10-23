package com.sentinel.controllers;

import com.sentinel.models.Camera;
import com.sentinel.services.CameraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cameras")
@CrossOrigin(origins = "*") // Allow frontend to access API
public class CameraController {

    private final CameraService cameraService;

    public CameraController(CameraService cameraService) {
        this.cameraService = cameraService;
    }

    @GetMapping
    public List<Camera> getAllCameras() {
        return cameraService.getAllCameras();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Camera> getCameraById(@PathVariable UUID id) {
        return cameraService.getCameraById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Camera addCamera(@RequestBody Camera camera) {
        return cameraService.addCamera(camera);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCamera(@PathVariable UUID id) {
        cameraService.deleteCamera(id);
        return ResponseEntity.noContent().build();
    }
}
