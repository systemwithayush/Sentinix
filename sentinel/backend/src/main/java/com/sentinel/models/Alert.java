package com.sentinel.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "camera_id")
    private UUID cameraId;

    @Column(nullable = false)
    private String module;

    @Column(name = "threat_level", nullable = false)
    private Integer threatLevel;

    @Column(nullable = false)
    private String description;

    @Column(updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "acknowledged_by")
    private UUID acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "review_status")
    private String reviewStatus = "NEW"; // NEW, UNDER_REVIEW, REVIEWED, NEEDS_FOLLOWUP

    @Column(name = "disposition")
    private String disposition = "NONE"; // NONE, RELEVANT, NOT_RELEVANT, UNCERTAIN

    @Column(name = "reviewer_notes")
    private String reviewerNotes;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "engine_version")
    private String engineVersion = "ai-engine-1.2.0-m5";

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public UUID getCameraId() { return cameraId; }
    public void setCameraId(UUID cameraId) { this.cameraId = cameraId; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public Integer getThreatLevel() { return threatLevel; }
    public void setThreatLevel(Integer threatLevel) { this.threatLevel = threatLevel; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public UUID getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(UUID acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }

    public String getDisposition() { return disposition; }
    public void setDisposition(String disposition) { this.disposition = disposition; }

    public String getReviewerNotes() { return reviewerNotes; }
    public void setReviewerNotes(String reviewerNotes) { this.reviewerNotes = reviewerNotes; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getEngineVersion() { return engineVersion; }
    public void setEngineVersion(String engineVersion) { this.engineVersion = engineVersion; }
}
