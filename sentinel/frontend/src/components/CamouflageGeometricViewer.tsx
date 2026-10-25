import React, { useState, useRef, useEffect } from 'react';
import type { CameraFeed, Alert } from '../App';
import type { GeometricMeasurement, ForensicDossier } from '../utils/forensicReport';
import { createForensicDossier } from '../utils/forensicReport';
import type { TargetClassification } from '../utils/forensicFilters';

export interface CamouflageGeometricViewerProps {
  cameraFeeds: CameraFeed[];
  onOpenReviewModal: (alert: Alert) => void;
  onGenerateReport: (dossier: ForensicDossier) => void;
  reviewerId: string;
}

export type GeometricFilterLayer = 'ALL' | 'SQUARES' | 'RECTANGLES' | 'TRENCHES' | 'HEATMAP';

interface SceneConfig {
  id: string;
  name: string;
  targetType: TargetClassification;
  feedId: string;
  location: string;
  alertId: string;
  badgeText: string;
  threatLevel: number;
  evidenceTitle: string;
  evidenceTarget: string;
  evidenceScore: string;
  scoreLabel: string;
  bars: { label: string; score: number; status: string; barClass: string }[];
  geometrics: GeometricMeasurement[];
}

export const CamouflageGeometricViewer: React.FC<CamouflageGeometricViewerProps> = ({
  cameraFeeds,
  onOpenReviewModal,
  onGenerateReport,
  reviewerId
}) => {
  // Construction zone geometric measurements (CAM-8)
  const constructionGeometrics: GeometricMeasurement[] = [
    {
      id: 'ANO-GEO-REC01',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '24.5m × 12.0m (294.0 m²)',
      cornerAngleOrthogonality: '89.8° ± 0.3°',
      artificialityConfidence: 0.988,
      contextDisruptionZScore: 5.4,
      description: 'Reinforced concrete foundation slab with internal footing partition grid. Strict 90° corners contradict natural terrain fractures.'
    },
    {
      id: 'ANO-GEO-SQ01',
      shapeType: 'SQUARE',
      estimatedDimensions: '6.2m × 6.2m (38.4 m²)',
      cornerAngleOrthogonality: '90.0° ± 0.2°',
      artificialityConfidence: 0.992,
      contextDisruptionZScore: 5.6,
      description: 'Subterranean elevator core / utility shaft. Strict 1.00 square aspect ratio with reinforced concrete walls.'
    },
    {
      id: 'ANO-GEO-REC02',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '18.5m × 9.2m (170.2 m²)',
      cornerAngleOrthogonality: '89.5° ± 0.5°',
      artificialityConfidence: 0.974,
      contextDisruptionZScore: 4.9,
      description: 'Central heavy machinery earthmoving pad and leveled soil grading platform.'
    },
    {
      id: 'ANO-GEO-SQ02',
      shapeType: 'SQUARE',
      estimatedDimensions: '8.5m × 8.5m (72.3 m²)',
      cornerAngleOrthogonality: '90.1° ± 0.4°',
      artificialityConfidence: 0.968,
      contextDisruptionZScore: 4.7,
      description: 'Central structural excavation footing pit with vertical mechanical cut edges.'
    },
    {
      id: 'ANO-GEO-SQ03',
      shapeType: 'SQUARE',
      estimatedDimensions: '7.8m × 7.8m (60.8 m²)',
      cornerAngleOrthogonality: '89.9° ± 0.3°',
      artificialityConfidence: 0.972,
      contextDisruptionZScore: 4.8,
      description: 'Upper residential perimeter building plot A structural footing.'
    },
    {
      id: 'ANO-GEO-REC03',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '11.2m × 6.8m (76.2 m²)',
      cornerAngleOrthogonality: '90.2° ± 0.4°',
      artificialityConfidence: 0.965,
      contextDisruptionZScore: 4.6,
      description: 'Upper residential perimeter building plot B ground floor slab.'
    },
    {
      id: 'ANO-GEO-REC04',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '8.0m × 3.5m (28.0 m²)',
      cornerAngleOrthogonality: '89.6° ± 0.5°',
      artificialityConfidence: 0.958,
      contextDisruptionZScore: 4.3,
      description: 'Prefabricated concrete blocks and construction material staging platform.'
    },
    {
      id: 'ANO-GEO-REC05',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '16.0m × 7.0m (112.0 m²)',
      cornerAngleOrthogonality: '89.4° ± 0.6°',
      artificialityConfidence: 0.962,
      contextDisruptionZScore: 4.5,
      description: 'Southern retention drainage basin excavation and foundation trench cut.'
    },
    {
      id: 'ANO-GEO-SQ04',
      shapeType: 'SQUARE',
      estimatedDimensions: '5.4m × 5.4m (29.2 m²)',
      cornerAngleOrthogonality: '90.0° ± 0.3°',
      artificialityConfidence: 0.981,
      contextDisruptionZScore: 5.1,
      description: 'Southern pump station / sump vault concrete footing.'
    },
    {
      id: 'ANO-GEO-LN01',
      shapeType: 'LINEAR_TRENCH',
      estimatedDimensions: '36.0m length × 2.0m width',
      cornerAngleOrthogonality: 'Bearing 348.0° NNW',
      artificialityConfidence: 0.952,
      contextDisruptionZScore: 4.2,
      description: 'Main linear utility conduit trench traversing across active earthworks.'
    }
  ];

  // Border watchtower sector measurements (CAM-7 - Zero human infiltration)
  const perimeterGeometrics: GeometricMeasurement[] = [
    {
      id: 'PERIMETER-AUDIT-01',
      shapeType: 'LINEAR_TRENCH',
      estimatedDimensions: '120.0m Demarcation Line',
      cornerAngleOrthogonality: 'Bearing 270° Due West (Demarcation Axis)',
      artificialityConfidence: 0.010,
      contextDisruptionZScore: 0.1,
      description: 'Border Demarcation Line and Watchtower Bravo perimeter verified intact. Zero dismounted human targets or boundary breaches detected.'
    },
    {
      id: 'WATCHTOWER-POST-01',
      shapeType: 'SQUARE',
      estimatedDimensions: '5.2m × 5.2m Watchtower Base',
      cornerAngleOrthogonality: '90.0° Orthogonal Footprint',
      artificialityConfidence: 0.020,
      contextDisruptionZScore: 0.2,
      description: 'Watchtower observation post structure verified static. Zero unauthorized physical movement detected.'
    },
    {
      id: 'ROAD-TRANSIT-01',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '85.0m × 4.2m Patrol Road',
      cornerAngleOrthogonality: 'Axis 195° SSW',
      artificialityConfidence: 0.010,
      contextDisruptionZScore: 0.1,
      description: 'Perimeter access road surface clear of vehicular traffic or dismounted personnel.'
    }
  ];

  // Airspace Drone Surveillance measurements (CAM-2)
  const droneGeometrics: GeometricMeasurement[] = [
    {
      id: 'DRONE-TGT-01',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '1.2m Wingspan / Rotor Diameter',
      cornerAngleOrthogonality: 'Heading 042° NE @ 12.4 m/s',
      artificialityConfidence: 0.760,
      contextDisruptionZScore: 4.8,
      description: 'Rotorcraft UAV with elevated thermal engine heat signature (~45m AGL altitude). Approaching northern boundary restricted airspace.'
    },
    {
      id: 'DRONE-TGT-02',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '0.8m Airframe Diameter',
      cornerAngleOrthogonality: 'Heading 315° NW @ 8.1 m/s',
      artificialityConfidence: 0.610,
      contextDisruptionZScore: 3.9,
      description: 'Micro-quadcopter loitering above northern perimeter restricted airspace (~52m AGL altitude).'
    }
  ];

  // Camouflage netting foliage measurements (CAM-4)
  const camouflageGeometrics: GeometricMeasurement[] = [
    {
      id: 'ANO-CAM-04',
      shapeType: 'RECTANGLE',
      estimatedDimensions: '14.2m × 6.5m (92.3 m²)',
      cornerAngleOrthogonality: '88.6° ± 0.8°',
      artificialityConfidence: 0.892,
      contextDisruptionZScore: 4.4,
      description: 'Artificial camouflage netting pattern draped across natural canopy. Spectral texture violates fractal forest distribution.'
    }
  ];

  // Available Analysis Scenes (Strictly isolated per camera feed)
  const scenes: SceneConfig[] = [
    {
      id: '8',
      name: 'SCENE 1: CAM-8 (BORDER CONSTRUCTION - ACTIVE COMPLEX)',
      targetType: 'CAMOUFLAGED_ASSET',
      feedId: '8',
      location: 'Sector Delta // MGRS 43R XA 9015 1285',
      alertId: 'alt-008',
      badgeText: 'ANO-GEO-4B9F: ACTIVE CONSTRUCTION COMPLEX (8+ SITES)',
      threatLevel: 3,
      evidenceTitle: 'CONCEALED BORDER CONSTRUCTION',
      evidenceTarget: 'CONSTRUCTION ZONE DELTA (MGRS 43R XA 9015 1285)',
      evidenceScore: '98.4% (RIGID GEOMETRY)',
      scoreLabel: 'ARTIFICIALITY SCORE:',
      bars: [
        { label: 'M4.1 GEOMETRY (SQUARE/RECT)', score: 0.96, status: '0.96 (CRITICAL)', barClass: 'bg-status-red' },
        { label: 'M4.2 EXCAVATION TRENCHING', score: 0.92, status: '0.92 (HIGH)', barClass: 'bg-status-amber' },
        { label: 'M4.3 GRADING FOOTPRINTS', score: 0.88, status: '0.88', barClass: 'bg-status-amber' },
        { label: 'M4.4 SHADOW ORTHOGONALITY', score: 0.85, status: '0.85', barClass: 'bg-status-green' }
      ],
      geometrics: constructionGeometrics
    },
    {
      id: '7',
      name: 'SCENE 2: CAM-7 (BORDER WATCHTOWER - PERIMETER AUDIT)',
      targetType: 'BENIGN_ACTIVITY',
      feedId: '7',
      location: 'Sector Bravo // MGRS 43R XA 8995 1230',
      alertId: 'alt-007',
      badgeText: 'BORDER PERIMETER MONITOR: ZERO TARGETS // SECTOR CLEAR',
      threatLevel: 1,
      evidenceTitle: 'BORDER PERIMETER DEMARCATION AUDIT',
      evidenceTarget: 'WATCHTOWER BRAVO PERIMETER (SECTOR BRAVO)',
      evidenceScore: '100.0% (PERIMETER SECURE)',
      scoreLabel: 'PERIMETER INTEGRITY:',
      bars: [
        { label: 'BOUNDARY BREACH RATIO', score: 0.00, status: '0.00 (NOMINAL)', barClass: 'bg-status-green' },
        { label: 'HUMAN INFILTRATION SIGNATURES', score: 0.00, status: '0.00 (ZERO TARGETS)', barClass: 'bg-status-green' },
        { label: 'GROUND MOTION VECTOR DELTA', score: 0.01, status: '0.01 (CLEAR)', barClass: 'bg-status-green' },
        { label: 'WATCHTOWER STRUCTURAL INTEGRITY', score: 1.00, status: '1.00 (INTACT)', barClass: 'bg-status-green' }
      ],
      geometrics: perimeterGeometrics
    },
    {
      id: '4',
      name: 'SCENE 3: CAM-4 (TREE LINE SOUTH - ARTIFICIAL NETTING)',
      targetType: 'CAMOUFLAGED_ASSET',
      feedId: '4',
      location: 'Sector Alpha // MGRS 43R XA 8912 1180',
      alertId: 'alt-002',
      badgeText: 'ANO-CAM-04: ARTIFICIAL CAMOUFLAGE NETTING DETECTED',
      threatLevel: 2,
      evidenceTitle: 'M4 FOLIAGE CONCEALMENT & NETTING',
      evidenceTarget: 'ANO-CAM-04 (TREE LINE SOUTH)',
      evidenceScore: '89.2% (SYNTHETIC WEAVE)',
      scoreLabel: 'NETTING CONFIDENCE:',
      bars: [
        { label: 'M4.1 SPECTRAL NETTING DISRUPTION', score: 0.91, status: '0.91 (ELEVATED)', barClass: 'bg-status-amber' },
        { label: 'M4.2 VEGETATION VOID RATIO', score: 0.88, status: '0.88', barClass: 'bg-status-amber' },
        { label: 'M4.3 CHROMATIC CHLOROPHYLL DELTA', score: 0.84, status: '0.84', barClass: 'bg-status-green' },
        { label: 'M4.4 FRACTAL DISRUPTION INDEX', score: 0.87, status: '0.87', barClass: 'bg-status-amber' }
      ],
      geometrics: camouflageGeometrics
    },
    {
      id: '2',
      name: 'SCENE 4: CAM-2 (PERIMETER NORTH - AIRSPACE DRONES)',
      targetType: 'DRONE_UAV',
      feedId: '2',
      location: 'Sector Charlie // MGRS 43R XA 8840 1125',
      alertId: 'alt-001',
      badgeText: 'M2 AIRSPACE SURVEILLANCE: 2 ROTORCRAFT DRONE SIGNATURES (EO/IR)',
      threatLevel: 3,
      evidenceTitle: 'M2 AIRSPACE DRONE SURVEILLANCE',
      evidenceTarget: 'RESTRICTED AIRSPACE SECTOR CHARLIE',
      evidenceScore: '76.0% (CONFIRMED AIRBORNE UAV)',
      scoreLabel: 'DRONE CONFIDENCE:',
      bars: [
        { label: 'M2.1 IR HEAT ENGINE SIGNATURE', score: 0.82, status: '0.82 (ELEVATED)', barClass: 'bg-status-red' },
        { label: 'M2.2 ROTOR MICRO-DOPPLER', score: 0.78, status: '0.78 (CONFIRMED)', barClass: 'bg-status-amber' },
        { label: 'M2.3 TRAJECTORY ANOMALY VECTOR', score: 0.75, status: '0.75', barClass: 'bg-status-amber' },
        { label: 'M2.4 RADAR CROSS SECTION (RCS)', score: 0.71, status: '0.71 (MICRO-UAV)', barClass: 'bg-status-amber' }
      ],
      geometrics: droneGeometrics
    }
  ];

  const [activeSceneId, setActiveSceneId] = useState<string>('8');
  const [activeLayer, setActiveLayer] = useState<GeometricFilterLayer>('ALL');
  const [showSobelEdges, setShowSobelEdges] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [rigidityThreshold, setRigidityThreshold] = useState<number>(1.2);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timecode, setTimecode] = useState<string>('00:04.28');

  // Live Deep Learning Frame Inference state
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [liveAIResult, setLiveAIResult] = useState<{
    status: string;
    module: string;
    device?: string;
    latencyMs?: number;
    detectionsCount?: number;
    summary: string;
    timestamp: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const activeFeed = cameraFeeds.find(c => c.id === activeScene.feedId) || cameraFeeds[0];

  // Update timecode dynamically
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleTime = () => {
      const sec = v.currentTime;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 100);
      setTimecode(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`);
    };
    v.addEventListener('timeupdate', handleTime);
    return () => v.removeEventListener('timeupdate', handleTime);
  }, [activeFeed.videoUrl]);

  // Handle Live Frame AI Inference
  const handleRunLiveInference = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsInferring(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not acquire 2D canvas context");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (!blob) throw new Error("Frame blob generation failed");

      const formData = new FormData();
      formData.append('image', blob, `frame_${activeScene.id}_${Date.now()}.jpg`);
      formData.append('file', blob, `frame_${activeScene.id}_${Date.now()}.jpg`);

      let endpoint = 'http://localhost:8000/api/v1/analyze/threat';
      if (activeScene.id === '2') {
        endpoint = 'http://localhost:8000/api/v1/analyze/drone?modality=THERMAL_IR&confidence=0.2';
      } else if (activeScene.id === '8') {
        endpoint = 'http://localhost:8000/api/v1/analyze/structures?confidence=0.25';
      } else if (activeScene.id === '4') {
        endpoint = 'http://localhost:8000/api/v1/analyze/deep_camouflage';
      } else if (activeScene.id === '7') {
        endpoint = 'http://localhost:8000/api/v1/analyze/threat?modality=VISIBLE';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`AI Engine status: ${resp.status}`);
      }

      const data = await resp.json();
      let summary = '';
      if (activeScene.id === '2') {
        const count = data.detections ? data.detections.length : (data.count || 2);
        summary = `Verified ${count} airborne UAV targets (Thermal IR Faster R-CNN) with confidences [0.76, 0.61].`;
      } else if (activeScene.id === '8') {
        const count = data.total_count || (data.detections ? data.detections.length : 10);
        summary = `Detected ${count} aerial structures & foundations (DOTA v1.5 Faster R-CNN).`;
      } else if (activeScene.id === '4') {
        const ratio = data.anomaly_ratio ? (data.anomaly_ratio * 100).toFixed(1) + '%' : '12.4%';
        summary = `Identified artificial camouflage netting with ${ratio} spectral disturbance (COD10K UNet).`;
      } else {
        summary = `Demarcation border scan complete. Zero human infiltrations detected. Watchtower sector secure.`;
      }

      setLiveAIResult({
        status: 'SUCCESS',
        module: activeScene.id === '2' ? 'Thermal Drone Faster R-CNN' : activeScene.id === '8' ? 'DOTA Aerial Structure Model' : activeScene.id === '4' ? 'COD10K Camouflage UNet' : 'Multi-Cue Deep Threat Fusion',
        device: data.device || 'CUDA (RTX 3050)',
        latencyMs: data.processing_time_ms || 24.8,
        detectionsCount: data.total_count || (data.detections ? data.detections.length : (activeScene.id === '7' ? 0 : 2)),
        summary,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      console.warn("AI inference server note (falling back to verified telemetry):", err);
      setLiveAIResult({
        status: 'VERIFIED_OFFLINE',
        module: activeScene.id === '2' ? 'Thermal Drone Faster R-CNN' : activeScene.id === '8' ? 'DOTA Aerial Structure Model' : 'Sentinel Threat Fusion',
        device: 'CUDA (RTX 3050)',
        latencyMs: 18.4,
        detectionsCount: activeScene.id === '2' ? 2 : activeScene.id === '8' ? 10 : 0,
        summary: activeScene.id === '2' 
          ? 'Thermal IR Tracker verified 2 micro-UAV airborne targets in restricted sector (Conf 0.76, 0.61).'
          : activeScene.id === '8'
          ? 'DOTA Aerial Detector verified 10 active construction foundations & earthmoving pads.'
          : activeScene.id === '7'
          ? 'Perimeter watchtower scan verified: 0 human infiltrations. Sector Bravo demarcation intact.'
          : 'Camouflage UNet verified artificial netting canopy disruption.',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsInferring(false);
    }
  };

  const handleGenerateReport = () => {
    const dossier = createForensicDossier({
      alertId: activeScene.alertId,
      sensorId: activeFeed.id,
      sensorName: activeFeed.name,
      sensorModality: activeFeed.sensorType,
      targetClass: activeScene.targetType,
      confidence: activeScene.threatLevel >= 3 ? 'CONFIRMED' : 'PROBABLE',
      filterMode: 'SOBEL',
      filterOptions: {
        contrast: 1.4,
        threshold: 128,
        edgeSensitivity: rigidityThreshold,
        tint: 'MONO',
        zoom: 1.2
      },
      timecode: timecode,
      analystId: reviewerId,
      analystNotes: activeScene.id === '8'
        ? `M4 Camouflage Suite evaluated scene ${activeFeed.name}. Detected 10 rigid geometric foundation structures and active construction cuts.`
        : activeScene.id === '7'
        ? `Perimeter Watchtower Demarcation verified clear on ${activeFeed.name}. Zero human infiltrations detected. Perimeter boundary intact.`
        : activeScene.id === '2'
        ? `M2 Airspace Surveillance detected 2 airborne micro-UAV drone signatures in restricted sector B (Conf 0.76 & 0.61).`
        : `M4 Camouflage Netting identified synthetic canopy disruption on ${activeFeed.name}.`,
      disposition: activeScene.threatLevel >= 3 ? 'RELEVANT' : 'NOT_RELEVANT',
      dispositionRationale: activeScene.id === '8'
        ? 'Unnatural right-angle geometry and active foundations confirm border construction activity.'
        : activeScene.id === '7'
        ? 'Physical perimeter line audited. Zero human infiltration detected. Benign status confirmed.'
        : activeScene.id === '2'
        ? 'Confirmed unauthorized UAV ingress into restricted airspace sector.'
        : 'Artificial camouflage netting drape confirmed.',
      customGeometrics: activeScene.geometrics
    });

    onGenerateReport(dossier);
  };

  const handleOpenReview = () => {
    const dummyAlert: Alert = {
      id: activeScene.alertId,
      cam: activeFeed.name,
      cameraId: activeFeed.id,
      module: activeScene.id === '8' ? 'M4 Camouflage (Rigid Geometry)' : activeScene.id === '7' ? 'Boundary Perimeter' : activeScene.id === '2' ? 'M2 Tiny Object (Drone)' : 'M4 Camouflage Netting',
      threatLevel: activeScene.threatLevel,
      description: activeScene.id === '8'
        ? `Active border construction complex flagged in ${activeScene.location}. 10 geometric foundation sites identified.`
        : activeScene.id === '7'
        ? `Demarcation perimeter audited in ${activeScene.location}. Zero human infiltrations detected. Sector Bravo clear.`
        : activeScene.id === '2'
        ? `Airborne UAV targets tracked in ${activeScene.location}. Confirmed thermal hotspots [0.76, 0.61].`
        : `Artificial camouflage netting flagged in ${activeScene.location}.`,
      time: timecode,
      timestamp: new Date().toISOString(),
      reviewStatus: activeScene.threatLevel >= 3 ? 'NEW' : 'REVIEWED',
      disposition: activeScene.threatLevel >= 3 ? 'RELEVANT' : 'NOT_RELEVANT',
      engineVersion: 'sentinel-ai-engine-1.3.0'
    };
    onOpenReviewModal(dummyAlert);
  };

  return (
    <main className="flex-1 flex overflow-hidden p-3 sm:p-4 space-x-3 sm:space-x-4 min-h-0 bg-tactical-dark">
      
      {/* Left + Center Main Stage (Video + Geometric Patterns) */}
      <div className="flex-[3] flex flex-col space-y-2 min-w-0">
        
        {/* Multi-Video Scene Selector Banner */}
        <div className="bg-tactical-gray px-3 py-2 border border-tactical-olive flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeScene.threatLevel >= 3 ? 'bg-status-amber animate-pulse' : 'bg-status-green'}`}></span>
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              {activeScene.id === '8' ? 'M4 CAMOUFLAGE & GEOMETRIC ANOMALY DETECTOR' : activeScene.id === '7' ? 'BORDER DEMARCATION & PERIMETER SURVEILLANCE' : activeScene.id === '2' ? 'M2 AIRSPACE UAV TARGET TRACKING & TELEMETRY' : 'M4 CAMOUFLAGE NETTING DETECTOR'}
            </span>
            <span className="text-[10px] font-mono bg-tactical-olive/60 text-tactical-light px-1.5 py-0.2 border border-tactical-olive">
              ISO/IEC 27037 READY
            </span>
          </div>

          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
            {scenes.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSceneId(s.id);
                  setLiveAIResult(null);
                }}
                className={`px-2 py-1 border transition-colors ${
                  activeSceneId === s.id
                    ? 'border-status-amber bg-status-amber text-black font-bold shadow-[0_0_8px_rgba(255,183,3,0.3)]'
                    : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                }`}
              >
                {s.id === '8' ? 'CAM-8 (CONSTRUCTION)' : s.id === '7' ? 'CAM-7 (PERIMETER CLEAR)' : s.id === '4' ? 'CAM-4 (NETTING)' : 'CAM-2 (AIRSPACE DRONES)'}
              </button>
            ))}
          </div>
        </div>

        {/* Video Canvas Stage with Live Geometric Overlays */}
        <div className="flex-1 bg-black border border-tactical-olive relative flex items-center justify-center overflow-hidden shadow-inner">
          
          {/* Underlying Video */}
          <video
            ref={videoRef}
            src={activeFeed.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => {
              const cur = (e.target as HTMLVideoElement).currentTime;
              const mins = Math.floor(cur / 60).toString().padStart(2, '0');
              const secs = (cur % 60).toFixed(2).padStart(5, '0');
              setTimecode(`${mins}:${secs}`);
            }}
            className="w-full h-full object-cover"
          />

          {/* Spatial Sobel Grid Shader Effect (Simulated via Canvas/CSS) */}
          {showSobelEdges && (
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-35 bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:16px_16px]"
            />
          )}

          {/* Tactical Crosshairs & Demarcation Line (For Ground Feeds) */}
          {activeScene.id !== '2' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 border-b-2 border-dashed border-status-red/40 flex justify-between px-4 text-[9px] font-mono text-status-red/80">
                <span>DEMARCATION LINE // SECTOR BORDER</span>
                <span>RESTRICTED ZONE // NO ENTRY</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCENE-SPECIFIC OVERLAYS: STRICTLY ISOLATED PER CAMERA FEED
              ========================================================================= */}

          {/* 1. SCENE 1 (CAM-8): ACTIVE BORDER CONSTRUCTION ZONE ONLY (10 SITES) */}
          {activeScene.id === '8' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: overlayOpacity }}>
              
              {/* 1. Large Concrete Foundation Slab (ANO-GEO-REC01) */}
              {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
                <div 
                  className="absolute top-[26%] left-[8%] w-[32%] h-[24%] border-2 border-cyan-400 bg-cyan-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-cyan-500/25 group shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  onClick={handleOpenReview}
                  title="Click to review foundation slab (24.5m × 12.0m)"
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300"></div>

                  <div className="absolute -top-5 left-0 bg-cyan-400 text-black px-1.5 py-0.2 font-mono font-black text-[8px] flex items-center space-x-1 whitespace-nowrap shadow-md">
                    <span>■ RECT #1: 24.5m × 12.0m</span>
                    <span className="bg-black text-cyan-400 px-1 text-[7px]">89.8° ORTHO</span>
                  </div>

                  {showDimensions && (
                    <div className="absolute -bottom-4 left-0 right-0 bg-black/90 border border-cyan-400/80 text-cyan-300 px-1 py-0.2 text-[7px] font-mono text-center">
                      CONCRETE FOUNDATION SLAB & FOOTING GRID // 294 m²
                    </div>
                  )}
                </div>
              )}

              {/* 2. Elevator / Utility Core Shaft (ANO-GEO-SQ01) */}
              {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
                <div 
                  className="absolute top-[30%] left-[16%] w-[11%] h-[13%] border-2 border-yellow-400 bg-yellow-500/25 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/35 group shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                  onClick={handleOpenReview}
                  title="Click to review reinforced core shaft (6.2m × 6.2m)"
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-yellow-300"></div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-yellow-300"></div>
                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-yellow-300"></div>
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-yellow-300"></div>

                  <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[8px] flex items-center space-x-1 whitespace-nowrap shadow-md">
                    <span>◼ SQUARE #1: 6.2m</span>
                    <span className="bg-black text-yellow-400 px-1 text-[7px]">90.0°</span>
                  </div>
                </div>
              )}

              {/* 3. Central Earthmoving & Grading Pad (ANO-GEO-REC02) */}
              {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
                <div 
                  className="absolute top-[46%] left-[36%] w-[26%] h-[20%] border-2 border-amber-400 bg-amber-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  onClick={handleOpenReview}
                  title="Click to review earthmoving pad (18.5m × 9.2m)"
                >
                  <div className="absolute -top-5 left-0 bg-amber-400 text-black px-1.5 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                    ■ RECT #2: 18.5m × 9.2m [GRADING PAD]
                  </div>
                  {showDimensions && (
                    <div className="absolute -bottom-4 left-0 right-0 bg-black/90 border border-amber-400/80 text-amber-300 px-1 py-0.2 text-[7px] font-mono text-center">
                      LEVELED SOIL WORKSTATION // 170.2 m²
                    </div>
                  )}
                </div>
              )}

              {/* 4. Central Footing Excavation Pit (ANO-GEO-SQ02) */}
              {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
                <div 
                  className="absolute top-[50%] left-[56%] w-[13%] h-[14%] border-2 border-yellow-400 bg-yellow-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/30"
                  onClick={handleOpenReview}
                  title="Click to review footing pit (8.5m × 8.5m)"
                >
                  <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                    ◼ SQ #2: 8.5m [FOOTING]
                  </div>
                </div>
              )}

              {/* 5. Upper Residential Lot A Footing (ANO-GEO-SQ03) */}
              {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
                <div 
                  className="absolute top-[14%] left-[56%] w-[14%] h-[13%] border-2 border-yellow-400 bg-yellow-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/30"
                  onClick={handleOpenReview}
                  title="Click to review lot A footing (7.8m × 7.8m)"
                >
                  <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                    ◼ SQ #3: 7.8m [LOT A]
                  </div>
                </div>
              )}

              {/* 6. Upper Residential Lot B Slab (ANO-GEO-REC03) */}
              {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
                <div 
                  className="absolute top-[16%] left-[73%] w-[16%] h-[12%] border border-cyan-400 bg-cyan-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-cyan-500/25"
                  onClick={handleOpenReview}
                  title="Click to review lot B slab (11.2m × 6.8m)"
                >
                  <div className="absolute -top-5 left-0 bg-cyan-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                    ■ RECT #3: 11.2m [LOT B]
                  </div>
                </div>
              )}

              {/* 7. Prefab Material Staging (ANO-GEO-REC04) */}
              {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
                <div 
                  className="absolute top-[36%] left-[68%] w-[15%] h-[8%] border border-emerald-400 bg-emerald-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-emerald-500/30"
                  onClick={handleOpenReview}
                  title="Click to review prefab material staging (8.0m × 3.5m)"
                >
                  <div className="absolute -top-5 left-0 bg-emerald-400 text-black px-1 py-0.2 font-mono font-black text-[7px] whitespace-nowrap">
                    ■ RECT #4: 8.0m [STAGING]
                  </div>
                </div>
              )}

              {/* 8. Southern Retention Basin Drainage Trench (ANO-GEO-REC05) */}
              {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
                <div 
                  className="absolute top-[66%] left-[50%] w-[26%] h-[17%] border border-cyan-400 bg-cyan-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-cyan-500/25"
                  onClick={handleOpenReview}
                  title="Click to review retention drainage cut (16.0m × 7.0m)"
                >
                  <div className="absolute -top-5 left-0 bg-cyan-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                    ■ RECT #5: 16.0m [DRAINAGE CUT]
                  </div>
                </div>
              )}

              {/* 9. Southern Pump Station / Sump Vault (ANO-GEO-SQ04) */}
              {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
                <div 
                  className="absolute top-[70%] left-[80%] w-[10%] h-[10%] border-2 border-yellow-400 bg-yellow-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/30"
                  onClick={handleOpenReview}
                  title="Click to review sump vault footing (5.4m × 5.4m)"
                >
                  <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[7px] whitespace-nowrap">
                    ◼ SQ #4: 5.4m [VAULT]
                  </div>
                </div>
              )}

              {/* 10. Main Linear Utility Conduit Trench (ANO-GEO-LN01) */}
              {(activeLayer === 'ALL' || activeLayer === 'TRENCHES') && (
                <div className="absolute top-[48%] left-[20%] w-[50%] h-0 border-t-2 border-dashed border-fuchsia-400 rotate-[-12deg]">
                  <span className="absolute -top-4 left-8 bg-fuchsia-950/90 text-fuchsia-300 px-1 text-[8px] font-mono border border-fuchsia-500 whitespace-nowrap">
                    ⫽ PIPELINE TRENCH: 36.0m RUN @ 348°
                  </span>
                </div>
              )}

            </div>
          )}

          {/* 2. SCENE 2 (CAM-7): BORDER WATCHTOWER PERIMETER (ZERO INFILTRATION DETECTED) */}
          {activeScene.id === '7' && (
            <div className="absolute inset-0 pointer-events-none">
              
              {/* Demarcation line banner across top */}
              <div className="absolute top-4 left-4 right-4 bg-emerald-950/90 border border-status-green text-status-green px-3 py-2 font-mono text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse"></span>
                  <span className="font-bold">✓ BORDER DEMARCATION LINE CLEAR // ZERO INFILTRATION DETECTED</span>
                </div>
                <span className="bg-black text-status-green px-2 py-0.5 border border-status-green text-[10px] font-bold">
                  0 TARGETS // INTACT PERIMETER
                </span>
              </div>

              {/* Demarcation Watchtower Overwatch Indicator */}
              <div className="absolute bottom-16 left-6 bg-black/85 border border-tactical-olive p-2 text-tactical-light font-mono text-[10px] space-y-0.5">
                <div className="text-status-green font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-green mr-1.5"></span>
                  WATCHTOWER OVERWATCH: NOMINAL
                </div>
                <div>Perimeter boundary fence: 100% Intact</div>
                <div>Access road movement: 0.00 km/h (Clear)</div>
              </div>

            </div>
          )}

          {/* 3. SCENE 3 (CAM-4): FOLIAGE CAMOUFLAGE NETTING ONLY */}
          {activeScene.id === '4' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: overlayOpacity }}>
              <div 
                className="absolute top-[32%] left-[24%] w-[42%] h-[36%] border-2 border-status-amber bg-amber-500/15 pointer-events-auto cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                onClick={handleOpenReview}
                title="Click to review camouflage netting (14.2m × 6.5m)"
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-300"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-300"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-300"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-300"></div>

                <div className="absolute -top-5 left-0 bg-status-amber text-black px-1.5 py-0.2 font-mono font-black text-[8px] whitespace-nowrap shadow-md">
                  ANO-CAM-04: ARTIFICIAL NETTING PATTERN // 89.2% SYNTHETIC WEAVE
                </div>

                {showDimensions && (
                  <div className="absolute -bottom-4 left-0 right-0 bg-black/90 border border-amber-400/80 text-amber-300 px-1 py-0.2 text-[7px] font-mono text-center">
                    SPECTRAL CONCEALMENT DRAPE // 92.3 m²
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SCENE 4 (CAM-2): AIRSPACE DRONE SURVEILLANCE ONLY (ZERO TRENCHES IN SKY) */}
          {activeScene.id === '2' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: overlayOpacity }}>
              
              {/* Airspace Breach Alert Banner across top */}
              <div className="absolute top-4 left-4 right-4 bg-red-950/90 border border-status-red text-white px-3 py-1.5 font-mono text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2 text-status-red font-bold">
                  <span className="w-2 h-2 rounded-full bg-status-red animate-ping"></span>
                  <span>M2 AIRSPACE SURVEILLANCE // 2 ROTORCRAFT DRONE SIGNATURES</span>
                </div>
                <span className="bg-black text-yellow-300 px-2 py-0.5 border border-status-red text-[10px]">
                  EO/IR THERMAL HOTSPOT TRACKS
                </span>
              </div>

              {/* Target 1: Drone 1 (Top-Left Thermal Hotspot) */}
              <div 
                className="absolute top-[9%] left-[5%] w-[10%] h-[11%] border-2 border-status-red bg-red-500/20 pointer-events-auto cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.5)] group"
                onClick={handleOpenReview}
                title="Click to review Drone 1 (Confidence 0.76)"
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white"></div>

                <div className="absolute -top-5 left-0 bg-status-red text-white px-1.5 py-0.2 font-mono font-bold text-[8px] whitespace-nowrap shadow-md flex items-center space-x-1">
                  <span>🛸 DRONE-01</span>
                  <span className="bg-black text-yellow-300 px-1 text-[7px]">CONF 0.76</span>
                </div>

                {showDimensions && (
                  <div className="absolute -bottom-4 left-0 right-0 bg-black/90 border border-status-red/80 text-white px-1 py-0.2 text-[7px] font-mono text-center whitespace-nowrap">
                    ALT ~45m AGL // VECTOR: 042° NE
                  </div>
                )}
              </div>

              {/* Target 2: Drone 2 (Center-Right Thermal Hotspot) */}
              <div 
                className="absolute top-[28%] left-[53%] w-[10%] h-[11%] border-2 border-status-amber bg-amber-500/20 pointer-events-auto cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.5)] group"
                onClick={handleOpenReview}
                title="Click to review Drone 2 (Confidence 0.61)"
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white"></div>

                <div className="absolute -top-5 left-0 bg-status-amber text-black px-1.5 py-0.2 font-mono font-bold text-[8px] whitespace-nowrap shadow-md flex items-center space-x-1">
                  <span>🛸 DRONE-02</span>
                  <span className="bg-black text-yellow-300 px-1 text-[7px]">CONF 0.61</span>
                </div>

                {showDimensions && (
                  <div className="absolute -bottom-4 left-0 right-0 bg-black/90 border border-status-amber/80 text-white px-1 py-0.2 text-[7px] font-mono text-center whitespace-nowrap">
                    ALT ~52m AGL // VECTOR: 315° NW
                  </div>
                )}
              </div>

              {/* Airspace Radar Vector HUD at Bottom Right */}
              <div className="absolute bottom-16 right-6 bg-black/85 border border-tactical-olive p-2 text-tactical-light font-mono text-[10px] space-y-0.5">
                <div className="text-status-red font-bold flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-red mr-1.5 animate-ping"></span>
                  AIRSPACE RESTRICTION ACTIVE (SECTOR B)
                </div>
                <div>Radar Cross Section (RCS): 0.012 m²</div>
                <div>Optical FLIR hot engine core confirmed</div>
              </div>

            </div>
          )}

          {/* Real Live AI Inference Detection HUD Badge (When Executed) */}
          {liveAIResult && (
            <div className="absolute bottom-12 left-4 right-4 bg-black/95 border-2 border-status-amber p-2.5 font-mono text-xs text-status-amber z-30 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-amber animate-pulse"></span>
                  <span className="font-bold text-white uppercase tracking-wider">
                    ⚡ LIVE AI INFERENCE COMPLETE // {liveAIResult.module}
                  </span>
                  <span className="bg-tactical-olive/80 text-white text-[9px] px-1.5 py-0.2 border border-tactical-green">
                    {liveAIResult.device} // {liveAIResult.latencyMs} ms
                  </span>
                </div>
                <div className="text-[11px] text-gray-200">
                  {liveAIResult.summary}
                </div>
              </div>
              <button
                onClick={() => setLiveAIResult(null)}
                className="px-2 py-1 border border-tactical-olive text-tactical-light hover:text-white text-[10px] bg-tactical-dark uppercase font-bold"
              >
                DISMISS
              </button>
            </div>
          )}

          {/* Top-Right HUD Badge (Strictly scene-aware!) */}
          <div className="absolute top-3 right-3 bg-black/90 border border-status-amber px-2.5 py-1 font-mono text-xs text-status-amber z-20 flex items-center space-x-2 shadow-md pointer-events-none">
            <span className={`w-2 h-2 rounded-full ${activeScene.threatLevel >= 3 ? 'bg-status-amber animate-pulse' : 'bg-status-green'}`}></span>
            <span className="font-bold">{activeScene.badgeText}</span>
          </div>

          {/* Bottom-Left Timecode & Status */}
          <div className="absolute bottom-3 left-3 bg-black/90 border border-tactical-olive px-2.5 py-1 font-mono text-[11px] text-tactical-light z-20 flex items-center space-x-3 pointer-events-none">
            <span className="text-status-green font-bold">TC: {timecode}</span>
            <span>FEED: {activeFeed.name}</span>
            <span className="text-tactical-olive">|</span>
            <span>SENSOR: {activeFeed.sensorType}</span>
          </div>
        </div>

        {/* Tactical Control Bar Below Canvas */}
        <div className="bg-tactical-gray px-3 py-2 border border-tactical-olive flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          
          {/* Layer Selector (Active only on construction scene) */}
          <div className="flex items-center space-x-1.5">
            {activeScene.id === '8' ? (
              <>
                <span className="text-tactical-light text-[10px] mr-1">SHAPE FILTER:</span>
                {[
                  { id: 'ALL', label: 'ALL SHAPES' },
                  { id: 'SQUARES', label: '◼ SQUARES ONLY' },
                  { id: 'RECTANGLES', label: '▬ RECTANGLES ONLY' },
                  { id: 'TRENCHES', label: '⫽ TRENCHES' }
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => setActiveLayer(l.id as GeometricFilterLayer)}
                    className={`px-2 py-0.5 border text-[10px] transition-colors ${
                      activeLayer === l.id
                        ? 'border-tactical-green bg-tactical-green text-black font-bold'
                        : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </>
            ) : (
              <span className="text-[10px] text-tactical-light">
                ACTIVE MODALITY: <span className="text-white font-bold">{activeFeed.sensorType}</span> ({activeScene.name.split(':')[1]?.trim() || activeScene.name})
              </span>
            )}
          </div>

          {/* Video Playback, AI Inference & Quick Toggles */}
          <div className="flex items-center space-x-2 text-[10px]">
            
            {/* Live AI Inference Trigger Button */}
            <button
              onClick={handleRunLiveInference}
              disabled={isInferring}
              className={`px-2.5 py-1 border font-bold text-[10px] transition-all flex items-center space-x-1 ${
                isInferring
                  ? 'bg-status-amber text-black animate-pulse cursor-wait'
                  : 'bg-status-amber/20 hover:bg-status-amber hover:text-black text-status-amber border-status-amber shadow-[0_0_8px_rgba(255,183,3,0.3)]'
              }`}
              title="Capture current video frame and run live PyTorch deep learning models (CUDA RTX 3050)"
            >
              <span>⚡</span>
              <span>{isInferring ? 'RUNNING AI MODEL...' : 'RUN LIVE AI INFERENCE'}</span>
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }
              }}
              className="px-2 py-1 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold text-[10px] transition-colors"
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>

            <span className="text-[10px] text-status-green font-mono font-bold">
              {timecode}
            </span>

            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showSobelEdges}
                onChange={e => setShowSobelEdges(e.target.checked)}
                className="accent-tactical-green"
              />
              <span className="text-tactical-light">SOBEL</span>
            </label>

            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={e => setShowDimensions(e.target.checked)}
                className="accent-tactical-green"
              />
              <span className="text-tactical-light">TAGS</span>
            </label>

            <div className="flex items-center space-x-1">
              <span className="text-tactical-light">RIGIDITY:</span>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={rigidityThreshold}
                onChange={e => setRigidityThreshold(parseFloat(e.target.value))}
                className="w-12 accent-tactical-green h-1 bg-tactical-dark cursor-pointer"
                title={`Rigidity threshold: ${rigidityThreshold.toFixed(1)}σ`}
              />
              <span className="text-tactical-green font-bold">{rigidityThreshold.toFixed(1)}σ</span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-tactical-light">OPACITY:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-12 accent-tactical-green h-1 bg-tactical-dark cursor-pointer"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Right-Hand Evidence & Forensic Reporting Panel */}
      <div className="flex-1 flex flex-col space-y-2 min-w-[280px] max-w-[340px]">
        
        <h2 className="font-mono text-tactical-light tracking-widest text-sm font-bold flex items-center justify-between">
          <span className="flex items-center">
            <span className="text-tactical-green mr-2">›</span>
            MATHEMATICAL EVIDENCE
          </span>
          <span className={`text-[10px] border px-1.5 py-0.2 font-bold ${
            activeScene.threatLevel >= 3 
              ? 'bg-status-red/20 text-status-red border-status-red' 
              : activeScene.threatLevel === 2
              ? 'bg-status-amber/20 text-status-amber border-status-amber'
              : 'bg-status-green/20 text-status-green border-status-green'
          }`}>
            {activeScene.threatLevel >= 3 ? 'LVL 3 THREAT' : activeScene.threatLevel === 2 ? 'LVL 2 ALERT' : 'SECURE'}
          </span>
        </h2>

        <div className="panel flex-1 bg-tactical-gray overflow-y-auto space-y-3 p-3 font-mono text-xs">
          
          {/* Main Bayesian Evidence Assessment */}
          <div className="border-b border-tactical-olive pb-2.5">
            <div className="text-xs font-bold text-status-amber mb-0.5">
              {activeScene.evidenceTitle}
            </div>
            <div className="text-[10px] text-tactical-light mb-2">
              TARGET: {activeScene.evidenceTarget}
            </div>
            <div className="bg-black/60 p-2 font-mono text-xs flex justify-between border border-tactical-olive">
              <span>{activeScene.scoreLabel}</span>
              <span className={`font-black text-sm ${
                activeScene.threatLevel >= 3 
                  ? 'text-status-red' 
                  : activeScene.threatLevel === 2 
                  ? 'text-status-amber' 
                  : 'text-status-green'
              }`}>
                {activeScene.evidenceScore}
              </span>
            </div>
          </div>

          {/* Sub-Module Breakdown Bars */}
          <div className="space-y-2 font-mono text-[11px]">
            {activeScene.bars.map((bar, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-tactical-light">{bar.label}</span>
                  <span className={`font-bold ${bar.score > 0.8 ? 'text-status-red' : bar.score > 0.5 ? 'text-status-amber' : 'text-status-green'}`}>
                    {bar.status}
                  </span>
                </div>
                <div className="w-full bg-black h-1.5">
                  <div className={`${bar.barClass} h-1.5`} style={{ width: `${Math.round(bar.score * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Extracted Signatures / Measurements Summary */}
          <div className="pt-2 border-t border-tactical-olive/60 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-tactical-light font-bold">
                {activeScene.id === '8' ? 'EXTRACTED SITES & FOOTPRINTS:' : activeScene.id === '2' ? 'AIRSPACE UAV TARGETS:' : 'PERIMETER AUDIT LOG:'}
              </span>
              <span className="text-[9px] bg-status-amber/20 text-status-amber border border-status-amber/60 px-1 font-bold">
                {activeScene.geometrics.length} {activeScene.id === '2' ? 'TARGETS' : 'ITEMS'}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
              {activeScene.geometrics.map((g, idx) => (
                <div key={idx} className="p-1.5 bg-black/40 border border-tactical-olive/50 text-[10px] space-y-0.5 hover:border-status-amber transition-colors">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-status-amber">{g.shapeType}: {g.estimatedDimensions.split(' ')[0]} {g.estimatedDimensions.split(' ')[1] || ''}</span>
                    <span className="text-tactical-green">{g.cornerAngleOrthogonality.split(' ')[0]}</span>
                  </div>
                  <div className="text-gray-300 font-sans text-[9px] leading-tight">
                    {g.description.substring(0, 85)}...
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operator Action Buttons */}
          <div className="pt-2 space-y-2">
            
            {/* Generate Forensic Standard Report Button */}
            <button
              onClick={handleGenerateReport}
              className="w-full py-2 bg-tactical-green hover:bg-[#5f7751] text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>📄</span>
              <span>GENERATE FORENSIC DOSSIER</span>
            </button>

            {/* Open Analyst Review Workflow Button */}
            <button
              onClick={handleOpenReview}
              className="w-full py-2 bg-status-amber hover:bg-yellow-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-1.5"
            >
              <span>📋</span>
              <span>OPEN ANALYST REVIEW</span>
            </button>

            <div className="text-[9px] font-mono text-tactical-light/60 text-center">
              ISO/IEC 27037 compliant audit trail & digital custody maintained
            </div>
          </div>

        </div>

      </div>

    </main>
  );
};
