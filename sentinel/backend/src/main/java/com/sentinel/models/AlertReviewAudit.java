package com.sentinel.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "alert_review_audits")
public class AlertReviewAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "alert_id", nullable = false)
    private UUID alertId;

    @Column(nullable = false)
    private String action; // ACKNOWLEDGE, RECORD_DISPOSITION, FLAG_FOLLOWUP, REOPEN, ADD_NOTE

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status")
    private String newStatus;

    @Column(name = "previous_disposition")
    private String previousDisposition;

    @Column(name = "new_disposition")
    private String newDisposition;

    @Column(name = "reviewer_id", nullable = false)
    private String reviewerId;

    @Column(name = "note")
    private String note;

    @Column(updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public AlertReviewAudit() {
    }

    public AlertReviewAudit(UUID alertId, String action, String previousStatus, String newStatus,
                            String previousDisposition, String newDisposition, String reviewerId, String note) {
        this.alertId = alertId;
        this.action = action;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.previousDisposition = previousDisposition;
        this.newDisposition = newDisposition;
        this.reviewerId = reviewerId;
        this.note = note;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getPreviousDisposition() { return previousDisposition; }
    public void setPreviousDisposition(String previousDisposition) { this.previousDisposition = previousDisposition; }

    public String getNewDisposition() { return newDisposition; }
    public void setNewDisposition(String newDisposition) { this.newDisposition = newDisposition; }

    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
