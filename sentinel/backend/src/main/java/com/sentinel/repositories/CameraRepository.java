package com.sentinel.repositories;

import com.sentinel.models.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CameraRepository extends JpaRepository<Camera, UUID> {
}
