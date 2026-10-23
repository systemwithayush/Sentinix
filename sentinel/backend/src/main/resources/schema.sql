-- Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- ADMIN, OPERATOR
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- Cameras
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cameras' AND xtype='U')
CREATE TABLE cameras (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name VARCHAR(100) NOT NULL,
    stream_url NVARCHAR(MAX) NOT NULL,
    type VARCHAR(20) NOT NULL, -- RTSP, WEBCAM, FILE
    status VARCHAR(20) DEFAULT 'OFFLINE',
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='alerts' AND xtype='U')
CREATE TABLE alerts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    module VARCHAR(50) NOT NULL, -- M2_TINY_OBJECT, M3_CHANGE_DETECT
    threat_level INT NOT NULL, -- 1: Info, 2: Suspicious, 3: High Priority
    description NVARCHAR(MAX) NOT NULL,
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UNIQUEIDENTIFIER REFERENCES users(id),
    acknowledged_at DATETIME2,
    review_status VARCHAR(30) DEFAULT 'NEW', -- NEW, UNDER_REVIEW, REVIEWED, NEEDS_FOLLOWUP
    disposition VARCHAR(30) DEFAULT 'NONE', -- NONE, RELEVANT, NOT_RELEVANT, UNCERTAIN
    reviewer_notes NVARCHAR(MAX),
    reviewed_by VARCHAR(100),
    reviewed_at DATETIME2,
    engine_version VARCHAR(50) DEFAULT 'ai-engine-1.2.0-m5'
);

-- AlertReviewAudits
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='alert_review_audits' AND xtype='U')
CREATE TABLE alert_review_audits (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    alert_id UNIQUEIDENTIFIER REFERENCES alerts(id),
    action VARCHAR(50) NOT NULL, -- ACKNOWLEDGE, RECORD_DISPOSITION, FLAG_FOLLOWUP, REOPEN, ADD_NOTE
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    previous_disposition VARCHAR(30),
    new_disposition VARCHAR(30),
    reviewer_id VARCHAR(100) NOT NULL,
    note NVARCHAR(MAX),
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- DetectedObjects
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='detected_objects' AND xtype='U')
CREATE TABLE detected_objects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    alert_id UNIQUEIDENTIFIER REFERENCES alerts(id),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    confidence FLOAT NOT NULL,
    bbox_x INT,
    bbox_y INT,
    bbox_w INT,
    bbox_h INT,
    direction VARCHAR(50),
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- ChangeDetectionReports
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='change_detection_reports' AND xtype='U')
CREATE TABLE change_detection_reports (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    before_image_path NVARCHAR(MAX) NOT NULL,
    after_image_path NVARCHAR(MAX) NOT NULL,
    difference_heatmap_path NVARCHAR(MAX) NOT NULL,
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- VegetationResults
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vegetation_results' AND xtype='U')
CREATE TABLE vegetation_results (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    alert_id UNIQUEIDENTIFIER REFERENCES alerts(id),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    vegetation_score FLOAT NOT NULL,
    bbox_x INT, bbox_y INT, bbox_w INT, bbox_h INT,
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- ShadowResults
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='shadow_results' AND xtype='U')
CREATE TABLE shadow_results (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    alert_id UNIQUEIDENTIFIER REFERENCES alerts(id),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    shadow_score FLOAT NOT NULL,
    bbox_x INT, bbox_y INT, bbox_w INT, bbox_h INT,
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- ContextResults
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='context_results' AND xtype='U')
CREATE TABLE context_results (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    camera_id UNIQUEIDENTIFIER REFERENCES cameras(id),
    context_score FLOAT NOT NULL,
    environment_type VARCHAR(50),
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

-- FusionContributionRecords
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fusion_contribution_records' AND xtype='U')
CREATE TABLE fusion_contribution_records (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    alert_id UNIQUEIDENTIFIER REFERENCES alerts(id),
    geometry_contribution FLOAT,
    texture_contribution FLOAT,
    temporal_contribution FLOAT,
    vegetation_contribution FLOAT,
    shadow_contribution FLOAT,
    context_contribution FLOAT,
    final_fusion_score FLOAT,
    timestamp DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
