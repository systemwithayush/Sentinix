package com.sentinel.repositories;

import com.sentinel.models.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByThreatLevelGreaterThanEqualOrderByTimestampDesc(Integer level);
}
