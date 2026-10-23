package com.sentinel.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

/**
 * Proxy controller to pass anomaly analysis requests to the Python AI Engine.
 */
@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*")
public class AnalysisController {

    // In a real application, these would use WebClient or RestTemplate 
    // to forward the Multipart payload to the AI Engine on port 8000.
    private final com.sentinel.services.MLFusionService mlFusionService;

    public AnalysisController(com.sentinel.services.MLFusionService mlFusionService) {
        this.mlFusionService = mlFusionService;
    }

    @PostMapping("/geometry")
    public ResponseEntity<?> analyzeGeometry(@RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(Map.of("message", "Request proxied to M4.1 Geometry Engine"));
    }

    @PostMapping("/texture")
    public ResponseEntity<?> analyzeTexture(@RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(Map.of("message", "Request proxied to M4.2 Texture Engine"));
    }

    @PostMapping("/temporal")
    public ResponseEntity<?> analyzeTemporal(@RequestParam("current") MultipartFile current, 
                                             @RequestParam("historical") MultipartFile historical) {
        return ResponseEntity.ok(Map.of("message", "Request proxied to M4.5 Temporal Engine"));
    }

    @PostMapping("/camouflage")
    public ResponseEntity<?> analyzeCamouflage(@RequestParam("current") MultipartFile current,
                                               @RequestParam(value = "historical", required = false) MultipartFile historical) {
        try {
            // Send the current camera frame to our new Deep Learning Fusion API
            var result = mlFusionService.analyzeFrame(current);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", "ML Backend Unavailable", "details", e.getMessage()));
        }
    }
}
