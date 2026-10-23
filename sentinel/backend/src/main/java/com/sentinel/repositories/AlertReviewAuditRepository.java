package com.sentinel.repositories;

import com.sentinel.models.AlertReviewAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertReviewAuditRepository extends JpaRepository<AlertReviewAudit, UUID> {
    List<AlertReviewAudit> findByAlertIdOrderByTimestampAsc(UUID alertId);
}
