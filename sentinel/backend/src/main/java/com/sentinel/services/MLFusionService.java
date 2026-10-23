package com.sentinel.services;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class MLFusionService {

    private final String ML_API_URL = System.getenv("AI_ENGINE_URL") != null 
            ? System.getenv("AI_ENGINE_URL") 
            : "http://localhost:8000/api/v1/analyze/threat";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MLFusionService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Sends the image frame to the Python ML Fusion API for threat assessment.
     * @param imageFile the camera frame to analyze
     * @return JsonNode containing the fused threat analysis
     */
    public JsonNode analyzeFrame(MultipartFile imageFile) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return imageFile.getOriginalFilename() != null ? imageFile.getOriginalFilename() : "frame.jpg";
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(ML_API_URL, requestEntity, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            System.err.println("Failed to connect to ML Fusion API: " + e.getMessage());
            throw new RuntimeException("ML Fusion Service unavailable", e);
        }
    }
}
