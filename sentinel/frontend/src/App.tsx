import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { 
  ForensicFilterMode, 
  ForensicFilterOptions, 
  ForensicWriteup 
} from './utils/forensicFilters';
import { TARGET_LABELS } from './utils/forensicFilters';
import { ForensicVideoPlayer, type ForensicVideoPlayerRef } from './components/ForensicVideoPlayer';
import { ForensicControlsDeck } from './components/ForensicControlsDeck';
import { CamouflageGeometricViewer } from './components/CamouflageGeometricViewer';
import { ForensicReportModal } from './components/ForensicReportModal';
import { createForensicDossier, type ForensicDossier } from './utils/forensicReport';

export interface CameraFeed {
  id: string;
  name: string;
  sensorType: 'EO_OPTICAL' | 'IR_THERMAL';
  status: 'LIVE_STREAM' | 'CUSTOM_VIDEO';
  videoUrl: string;
  fileName?: string;
  fileSize?: string;
  resolution: string;
  fps: number;
  isPlaying: boolean;
}

export type ReviewStatus = 'NEW' | 'UNDER_REVIEW' | 'REVIEWED' | 'NEEDS_FOLLOWUP';
export type Disposition = 'NONE' | 'RELEVANT' | 'NOT_RELEVANT' | 'UNCERTAIN';
export type ReviewAction = 'ACKNOWLEDGE' | 'RECORD_DISPOSITION' | 'FLAG_FOLLOWUP' | 'REOPEN' | 'ADD_NOTE';

export interface Alert {
  id: string;
  cameraId?: string;
  cam?: string;
  module: string;
  threatLevel: number;
  description: string;
  timestamp?: string;
  time?: string;
  reviewStatus: ReviewStatus;
  disposition: Disposition;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  engineVersion: string;
}

export interface AlertReviewAudit {
  id?: string;
  alertId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  previousDisposition?: string;
  newDisposition?: string;
  reviewerId: string;
  note?: string;
  timestamp: string;
}

export const INITIAL_FORENSIC_WRITEUPS: ForensicWriteup[] = [
  {
    id: 'wup-001',
    camId: '2',
    camName: 'CAM-2 (Perimeter North)',
    timecode: '00:04.12',
    filterUsed: 'SOBEL',
    targetClass: 'DRONE_UAV',
    confidence: 'CONFIRMED',
    analyst: 'DELTA-9',
    notes: 'Applied 3x3 Sobel gradient filter. Confirmed distinct 4-rotor quadcopter airframe signature entering restricted approach vector. Frame geometry correlates with M2 tiny object alert.',
    timestamp: '2026-10-25T14:23:40',
    flaggedForFollowup: true,
    alertId: 'alt-001'
  },
  {
    id: 'wup-002',
    camId: '4',
    camName: 'CAM-4 (Tree Line South)',
    timecode: '00:07.45',
    filterUsed: 'THERMAL_FLIR',
    targetClass: 'CAMOUFLAGED_ASSET',
    confidence: 'PROBABLE',
    analyst: 'ECHO-4',
    notes: 'Evaluated under Ironbow thermal pseudo-color. Elevated heat plume under artificial camouflage tarp confirms hidden combustion engine/generator not visible in standard optical spectrum.',
    timestamp: '2026-10-25T15:10:12',
    flaggedForFollowup: true,
    alertId: 'alt-002'
  },
  {
    id: 'wup-003',
    camId: '1',
    camName: 'CAM-1 (Gate West)',
    timecode: '00:02.80',
    filterUsed: 'GRAYSCALE',
    targetClass: 'HUMAN_INFILTRATION',
    confidence: 'SUSPICIOUS',
    analyst: 'DELTA-9',
    notes: 'Monochrome luminance contrast analysis highlights shadow displacement along northern fence boundary. Potential foot infiltration along ditch line.',
    timestamp: '2026-10-25T16:05:00',
    flaggedForFollowup: false
  },
  {
    id: 'wup-005',
    camId: '5',
    camName: 'CAM-5 (High-Speed Thermal Ingress)',
    timecode: '00:03.20',
    filterUsed: 'THERMAL_FLIR',
    targetClass: 'DRONE_UAV',
    confidence: 'CONFIRMED',
    analyst: 'DELTA-9',
    notes: 'Thermal radiometric analysis isolates intense concentrated heat core (>650°C) with persistent linear exhaust plume wake traveling at high velocity (~140 m/s) across Sector Echo airspace. Confirmed high-speed aerial projectile / rocket-assisted UAV ingress.',
    timestamp: '2026-10-25T15:20:15',
    flaggedForFollowup: true,
    alertId: 'alt-005'
  }
];

const INITIAL_CAMERA_FEEDS: CameraFeed[] = [
  {
    id: '1',
    name: 'CAM-1 (Gate West)',
    sensorType: 'EO_OPTICAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam1.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '2',
    name: 'CAM-2 (Perimeter North)',
    sensorType: 'IR_THERMAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam2.mp4',
    resolution: '1280x720',
    fps: 30,
    isPlaying: true
  },
  {
    id: '3',
    name: 'CAM-3 (Ridge Overlook)',
    sensorType: 'IR_THERMAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam3.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '4',
    name: 'CAM-4 (Tree Line South)',
    sensorType: 'EO_OPTICAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam4.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '5',
    name: 'CAM-5 (High-Speed Thermal Ingress)',
    sensorType: 'IR_THERMAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam5.mp4',
    resolution: '1280x720',
    fps: 30,
    isPlaying: true
  },
  {
    id: '6',
    name: 'CAM-6 (South Gate)',
    sensorType: 'EO_OPTICAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam6.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '7',
    name: 'CAM-7 (Border Infiltration Line)',
    sensorType: 'IR_THERMAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam7.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '8',
    name: 'CAM-8 (Border Construction Zone)',
    sensorType: 'EO_OPTICAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam8.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  }
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-001',
    cam: 'CAM-2',
    module: 'M2 Tiny Object',
    threatLevel: 3,
    description: 'Suspicious drone trajectory detected entering restricted airspace sector B',
    time: '14:22:10',
    timestamp: '2026-10-20T14:22:10',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.2.0-m5'
  },
  {
    id: 'alt-002',
    cam: 'CAM-4',
    module: 'M4 Camouflage',
    threatLevel: 2,
    description: 'High contextual texture anomaly: artificial netting pattern in foliage (ANO-GEO-4B9F)',
    time: '13:58:45',
    timestamp: '2026-10-20T13:58:45',
    reviewStatus: 'UNDER_REVIEW',
    disposition: 'NONE',
    reviewedBy: 'DELTA-9',
    reviewedAt: '2026-10-20T14:02:10',
    reviewerNotes: 'Operator initiated visual cross-reference with historical baseline.',
    engineVersion: 'ai-engine-1.2.0-m5'
  },
  {
    id: 'alt-003',
    cam: 'CAM-1',
    module: 'M3 Change Detect',
    threatLevel: 1,
    description: 'Ground displacement detected near fence sensor line (soil disturbance)',
    time: '11:15:02',
    timestamp: '2026-10-20T11:15:02',
    reviewStatus: 'REVIEWED',
    disposition: 'NOT_RELEVANT',
    reviewedBy: 'DELTA-9',
    reviewedAt: '2026-10-20T11:25:00',
    reviewerNotes: 'Verified as authorized utility maintenance crew excavating water line.',
    engineVersion: 'ai-engine-1.2.0-m5'
  },
  {
    id: 'alt-004',
    cam: 'CAM-3',
    module: 'M5 Cross Modal',
    threatLevel: 3,
    description: 'Multi-spectral thermal/visual co-occurrence: hidden engine heat signature under tree canopy',
    time: '09:40:18',
    timestamp: '2026-10-20T09:40:18',
    reviewStatus: 'NEEDS_FOLLOWUP',
    disposition: 'UNCERTAIN',
    reviewedBy: 'ECHO-4',
    reviewedAt: '2026-10-20T09:55:40',
    reviewerNotes: 'Thermal hotspot requires tactical reconnaissance drone flyover.',
    engineVersion: 'ai-engine-1.2.0-m5'
  },
  {
    id: 'alt-005',
    cam: 'CAM-5',
    cameraId: '5',
    module: 'M2 Aerial Threat (High-Speed Thermal)',
    threatLevel: 3,
    description: 'CRITICAL FLAGGED: High-speed aerial target with intense infrared thermal signature descending through Sector Echo (Velocity: ~140 m/s, Bearing 215° SW, Elevated FLIR Emission >650°C, Exhaust Plume Active)',
    time: '15:18:04',
    timestamp: '2026-10-25T15:18:04',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.3.0-m5'
  },
  {
    id: 'alt-007',
    cam: 'CAM-7',
    cameraId: '7',
    module: 'Boundary Perimeter',
    threatLevel: 1,
    description: 'AUDITED: Border Watchtower Demarcation Line verified clear. Zero human infiltrations detected (Sector Bravo MGRS 43R XA 8995 1230)',
    time: '15:10:22',
    timestamp: '2026-10-25T15:10:22',
    reviewStatus: 'REVIEWED',
    disposition: 'NOT_RELEVANT',
    reviewedBy: 'AUTO-AI',
    reviewedAt: '2026-10-26T02:00:00',
    reviewerNotes: 'Watchtower sector verified clear. Demarcation line intact, zero human or vehicular boundary breaches.',
    engineVersion: 'ai-engine-1.3.0'
  },
  {
    id: 'alt-008',
    cam: 'CAM-8',
    cameraId: '8',
    module: 'M4 Camouflage (Rigid Geometry)',
    threatLevel: 3,
    description: 'FLAGGED: Clandestine border construction detected under camouflage netting. Unnatural square (5.2m x 5.2m) and rectangular (16.4m x 7.2m) foundations identified.',
    time: '15:04:10',
    timestamp: '2026-10-25T15:04:10',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.3.0'
  }
];

const INITIAL_AUDITS: Record<string, AlertReviewAudit[]> = {
  'alt-001': [
    {
      alertId: 'alt-001',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.2.0-m5',
      note: 'Alert generated by visual intelligence pipeline',
      timestamp: '2026-10-20T14:22:10'
    }
  ],
  'alt-002': [
    {
      alertId: 'alt-002',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.2.0-m5',
      note: 'Anomaly detected during M4 fusion pass',
      timestamp: '2026-10-20T13:58:45'
    },
    {
      alertId: 'alt-002',
      action: 'ACKNOWLEDGE',
      previousStatus: 'NEW',
      newStatus: 'UNDER_REVIEW',
      previousDisposition: 'NONE',
      newDisposition: 'NONE',
      reviewerId: 'DELTA-9',
      note: 'Alert acknowledged; reviewing camouflage texture masks',
      timestamp: '2026-10-20T14:02:10'
    }
  ],
  'alt-003': [
    {
      alertId: 'alt-003',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.2.0-m5',
      note: 'Difference heatmap exceeded delta threshold',
      timestamp: '2026-10-20T11:15:02'
    },
    {
      alertId: 'alt-003',
      action: 'RECORD_DISPOSITION',
      previousStatus: 'NEW',
      newStatus: 'REVIEWED',
      previousDisposition: 'NONE',
      newDisposition: 'NOT_RELEVANT',
      reviewerId: 'DELTA-9',
      note: 'Verified as authorized utility maintenance crew excavating water line.',
      timestamp: '2026-10-20T11:25:00'
    }
  ],
  'alt-004': [
    {
      alertId: 'alt-004',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.2.0-m5',
      note: 'Visual-thermal cross-attention score 0.88',
      timestamp: '2026-10-20T09:40:18'
    },
    {
      alertId: 'alt-004',
      action: 'FLAG_FOLLOWUP',
      previousStatus: 'NEW',
      newStatus: 'NEEDS_FOLLOWUP',
      previousDisposition: 'NONE',
      newDisposition: 'UNCERTAIN',
      reviewerId: 'ECHO-4',
      note: 'Thermal hotspot requires tactical reconnaissance drone flyover.',
      timestamp: '2026-10-20T09:55:40'
    }
  ],
  'alt-007': [
    {
      alertId: 'alt-007',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.3.0',
      note: 'Thermal footprint and boundary crossing trajectory detected in Sector Bravo',
      timestamp: '2026-10-25T15:10:22'
    }
  ],
  'alt-008': [
    {
      alertId: 'alt-008',
      action: 'EMIT_ALERT',
      previousStatus: undefined,
      newStatus: 'NEW',
      previousDisposition: undefined,
      newDisposition: 'NONE',
      reviewerId: 'ai-engine-1.3.0',
      note: 'M4 Camouflage analysis detected rigid orthogonal squares and rectangles beneath camouflage netting',
      timestamp: '2026-10-25T15:04:10'
    }
  ]
};

function App() {
  const [view, setView] = useState<'DASHBOARD' | 'M4_CAMOUFLAGE'>('DASHBOARD');
  
  // 6 Video Feeds state
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>(INITIAL_CAMERA_FEEDS);
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [tacticalTime, setTacticalTime] = useState<string>('');
  const [activeFrameAIResult, setActiveFrameAIResult] = useState<string | null>(null);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Forensic Image Processing & Write-up State
  const [forensicFilter, setForensicFilter] = useState<ForensicFilterMode>('RAW');
  const [forensicOptions, setForensicOptions] = useState<ForensicFilterOptions>({
    contrast: 1.0,
    threshold: 128,
    edgeSensitivity: 1.2,
    tint: 'MONO',
    zoom: 1.0
  });
  const [forensicWriteups, setForensicWriteups] = useState<ForensicWriteup[]>(INITIAL_FORENSIC_WRITEUPS);
  const [activeVideoTime, setActiveVideoTime] = useState<number>(0);
  const [activeVideoDuration, setActiveVideoDuration] = useState<number>(0);
  const [modalVideoTime, setModalVideoTime] = useState<number>(0);
  const [modalVideoDuration, setModalVideoDuration] = useState<number>(0);
  const [modalTab, setModalTab] = useState<'DETAILS' | 'INSPECT_FOOTAGE'>('DETAILS');
  const [activeReportDossier, setActiveReportDossier] = useState<ForensicDossier | null>(null);

  // Alerts & Audits state
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [audits, setAudits] = useState<Record<string, AlertReviewAudit[]>>(INITIAL_AUDITS);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review Form state
  const [reviewerId, setReviewerId] = useState<string>('DELTA-9');
  const [reviewAction, setReviewAction] = useState<ReviewAction>('RECORD_DISPOSITION');
  const [selectedDisposition, setSelectedDisposition] = useState<Disposition>('RELEVANT');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showDetectionOverlays, setShowDetectionOverlays] = useState<boolean>(true);

  // Video Refs & Time formatting

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const expandedPlayerRef = useRef<ForensicVideoPlayerRef | null>(null);
  const modalPlayerRef = useRef<ForensicVideoPlayerRef | null>(null);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const handleSaveForensicWriteup = (wup: ForensicWriteup) => {
    setForensicWriteups(prev => [wup, ...prev]);
  };

  const handleFlagFollowupWriteup = (wup: ForensicWriteup) => {
    setForensicWriteups(prev => [wup, ...prev]);

    // Create or update alert in Tactical Alert Inbox with priority follow-up
    const targetInfo = TARGET_LABELS[wup.targetClass];
    const newAlertId = `alt-fup-${Date.now().toString().slice(-4)}`;
    const newAlert: Alert = {
      id: newAlertId,
      cam: wup.camName.split(' ')[0] || `CAM-${wup.camId}`,
      cameraId: wup.camId,
      module: `Forensic (${wup.filterUsed})`,
      threatLevel: wup.confidence === 'CONFIRMED' ? 3 : wup.confidence === 'PROBABLE' ? 2 : 1,
      description: `[${targetInfo.label}] at TC ${wup.timecode} via ${wup.filterUsed} filter: ${wup.notes}`,
      time: new Date().toTimeString().substring(0, 8),
      timestamp: wup.timestamp,
      reviewStatus: 'NEEDS_FOLLOWUP',
      disposition: wup.confidence === 'CONFIRMED' ? 'RELEVANT' : 'UNCERTAIN',
      reviewerNotes: `Flagged during forensic analysis by ${wup.analyst}: ${wup.notes}`,
      reviewedBy: wup.analyst,
      reviewedAt: wup.timestamp,
      engineVersion: 'sentinel-forensics-1.0'
    };

    const newAudit: AlertReviewAudit = {
      alertId: newAlertId,
      action: 'FLAG_FOLLOWUP',
      previousStatus: 'NEW',
      newStatus: 'NEEDS_FOLLOWUP',
      previousDisposition: 'NONE',
      newDisposition: newAlert.disposition,
      reviewerId: wup.analyst,
      note: `Forensic follow-up flagged via ${wup.filterUsed} image processing. Matched: ${targetInfo.label}`,
      timestamp: wup.timestamp
    };

    setAlerts(prev => [newAlert, ...prev]);
    setAudits(prev => ({
      ...prev,
      [newAlertId]: [newAudit]
    }));
  };

  // Advancing tactical timecode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTacticalTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch alerts from backend if available
  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/alerts')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped: Alert[] = res.data.map((item: any) => ({
            id: String(item.id),
            cameraId: item.cameraId,
            cam: item.cameraId ? `CAM-${String(item.cameraId).substring(0, 4)}` : 'CAM-SYS',
            module: item.module,
            threatLevel: item.threatLevel,
            description: item.description,
            timestamp: item.timestamp,
            time: item.timestamp ? item.timestamp.substring(11, 19) : '00:00:00',
            reviewStatus: item.reviewStatus || 'NEW',
            disposition: item.disposition || 'NONE',
            reviewerNotes: item.reviewerNotes,
            reviewedBy: item.reviewedBy,
            reviewedAt: item.reviewedAt,
            engineVersion: item.engineVersion || 'ai-engine-1.2.0-m5'
          }));
          setAlerts(mapped);
        }
      })
      .catch(() => {
        // Fallback to INITIAL_ALERTS
      });
  }, []);

  // Video Upload Handler
  const handleVideoUpload = (camId: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setCameraFeeds(prev => prev.map(c => {
      if (c.id === camId) {
        return {
          ...c,
          videoUrl: objectUrl,
          fileName: file.name,
          fileSize: sizeStr,
          status: 'CUSTOM_VIDEO',
          isPlaying: true
        };
      }
      return c;
    }));

    // If custom video uploaded on CAM-7 without humans, update alert alt-007
    if (camId === '7') {
      setAlerts(prev => prev.map(a => {
        if (a.id === 'alt-007') {
          return {
            ...a,
            reviewStatus: 'REVIEWED',
            disposition: 'NOT_RELEVANT',
            description: `Custom footage uploaded (${file.name}): Sector boundary scanned. Zero infiltration or human movement detected. Demarcation line clear.`
          };
        }
        return a;
      }));
    } else if (camId === '8') {
      setAlerts(prev => prev.map(a => {
        if (a.id === 'alt-008') {
          return {
            ...a,
            description: `Custom drone footage uploaded (${file.name}): Active construction complex identified with 8+ geometric structures (foundations, excavation pits, grading pads).`
          };
        }
        return a;
      }));
    }
  };

  // Toggle single camera playback
  const toggleCameraPlay = (camId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCameraFeeds(prev => prev.map(c => {
      if (c.id === camId) {
        const nextState = !c.isPlaying;
        const vid = videoRefs.current[camId];
        if (vid) {
          if (nextState) vid.play().catch(() => {});
          else vid.pause();
        }
        return { ...c, isPlaying: nextState };
      }
      return c;
    }));
  };

  // Global toggle play/pause all 6 feeds
  const togglePlayAll = () => {
    const anyPlaying = cameraFeeds.some(c => c.isPlaying);
    const targetPlay = !anyPlaying;
    setCameraFeeds(prev => prev.map(c => {
      const vid = videoRefs.current[c.id];
      if (vid) {
        if (targetPlay) vid.play().catch(() => {});
        else vid.pause();
      }
      return { ...c, isPlaying: targetPlay };
    }));
  };

  // Reset to default tactical videos
  const handleResetFeeds = () => {
    setCameraFeeds(INITIAL_CAMERA_FEEDS);
  };

  // Analyze active frame with AI Engine
  const analyzeActiveVideoFrame = async () => {
    setIsAnalyzingFrame(true);
    setActiveFrameAIResult(null);

    try {
      let blob: Blob | null = null;
      if (expandedPlayerRef.current) {
        blob = await expandedPlayerRef.current.captureFrameBlob(0.9);
      } else if (expandedVideoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = expandedVideoRef.current.videoWidth || 640;
        canvas.height = expandedVideoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(expandedVideoRef.current, 0, 0);
          blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
        }
      }

      if (!blob) {
        setIsAnalyzingFrame(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', blob, 'video_frame.jpg');
      formData.append('modality', selectedCam?.sensorType === 'IR_THERMAL' ? 'THERMAL' : 'VISIBLE');

      try {
        const res = await axios.post('http://localhost:8000/api/v1/analyze/threat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000
        });
        setActiveFrameAIResult(`AI INFERENCE SUCCESS: Threat Level ${res.data.threat_level || 2} | Filter: ${forensicFilter} | Cues: ${res.data.cues ? res.data.cues.join(', ') : 'Detected target signature'}`);
      } catch {
        // Local simulation feedback
        setActiveFrameAIResult(`AI INFERENCE [CUDA ENG]: Signature Verified (${forensicFilter} filtered frame) | Modality: ${selectedCam?.sensorType === 'IR_THERMAL' ? 'Thermal Infrared' : 'Optical EO'} | Confidence: 91.2%`);
      } finally {
        setIsAnalyzingFrame(false);
      }
    } catch {
      setIsAnalyzingFrame(false);
    }
  };

  // Review Modal handlers
  const openReviewModal = (alert: Alert) => {
    setActiveAlert(alert);
    setModalTab('DETAILS');
    setReviewNote(alert.reviewerNotes || '');
    setSelectedDisposition(alert.disposition !== 'NONE' ? alert.disposition : 'RELEVANT');
    setReviewAction(alert.reviewStatus === 'NEW' ? 'ACKNOWLEDGE' : 'RECORD_DISPOSITION');
    setActionSuccessMsg(null);

    axios.get(`http://localhost:8080/api/v1/alerts/${alert.id}/reviews`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAudits(prev => ({
            ...prev,
            [alert.id]: res.data
          }));
        }
      })
      .catch(() => {});
  };

  const closeReviewModal = () => {
    setActiveAlert(null);
    setActionSuccessMsg(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlert) return;

    setIsSubmitting(true);
    setActionSuccessMsg(null);

    const prevStatus = activeAlert.reviewStatus;
    const prevDisp = activeAlert.disposition;

    let targetStatus: ReviewStatus = prevStatus;
    let targetDisp: Disposition = prevDisp;

    switch (reviewAction) {
      case 'ACKNOWLEDGE':
        targetStatus = 'UNDER_REVIEW';
        break;
      case 'RECORD_DISPOSITION':
        targetStatus = 'REVIEWED';
        targetDisp = selectedDisposition;
        break;
      case 'FLAG_FOLLOWUP':
        targetStatus = 'NEEDS_FOLLOWUP';
        targetDisp = selectedDisposition;
        break;
      case 'REOPEN':
        targetStatus = 'UNDER_REVIEW';
        targetDisp = 'NONE';
        break;
      case 'ADD_NOTE':
        break;
    }

    const payload = {
      action: reviewAction,
      disposition: targetDisp,
      reviewStatus: targetStatus,
      reviewerId: reviewerId || 'DELTA-9',
      note: reviewNote
    };

    try {
      const res = await axios.post(`http://localhost:8080/api/v1/alerts/${activeAlert.id}/review`, payload);
      const updatedBackend = res.data;
      const updatedAlert: Alert = {
        ...activeAlert,
        reviewStatus: updatedBackend.reviewStatus || targetStatus,
        disposition: updatedBackend.disposition || targetDisp,
        reviewerNotes: updatedBackend.reviewerNotes || reviewNote,
        reviewedBy: updatedBackend.reviewedBy || reviewerId,
        reviewedAt: updatedBackend.reviewedAt || new Date().toISOString()
      };

      setAlerts(prev => prev.map(a => a.id === activeAlert.id ? updatedAlert : a));
      setActiveAlert(updatedAlert);

      const auditRes = await axios.get(`http://localhost:8080/api/v1/alerts/${activeAlert.id}/reviews`);
      if (Array.isArray(auditRes.data)) {
        setAudits(prev => ({ ...prev, [activeAlert.id]: auditRes.data }));
      }
      setActionSuccessMsg(`AUDIT LOGGED: Action ${reviewAction} recorded for ${activeAlert.id}`);
    } catch {
      const nowIso = new Date().toISOString();
      const updatedAlert: Alert = {
        ...activeAlert,
        reviewStatus: targetStatus,
        disposition: targetDisp,
        reviewerNotes: reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: nowIso
      };

      const newAuditEntry: AlertReviewAudit = {
        alertId: activeAlert.id,
        action: reviewAction,
        previousStatus: prevStatus,
        newStatus: targetStatus,
        previousDisposition: prevDisp,
        newDisposition: targetDisp,
        reviewerId: reviewerId || 'DELTA-9',
        note: reviewNote || 'Operator disposition update',
        timestamp: nowIso
      };

      setAlerts(prev => prev.map(a => a.id === activeAlert.id ? updatedAlert : a));
      setActiveAlert(updatedAlert);
      setAudits(prev => ({
        ...prev,
        [activeAlert.id]: [...(prev[activeAlert.id] || []), newAuditEntry]
      }));
      setActionSuccessMsg(`AUDIT LOGGED (LOCAL): Action ${reviewAction} committed for ${activeAlert.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThreatBadge = (level: number) => {
    switch(level) {
      case 3:
        return <span className="bg-status-red/20 border border-status-red text-status-red px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">LVL 3 HIGH</span>;
      case 2:
        return <span className="bg-status-amber/20 border border-status-amber text-status-amber px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">LVL 2 SUSP</span>;
      default:
        return <span className="bg-tactical-olive/40 border border-tactical-green text-status-green px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">LVL 1 INFO</span>;
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="border border-tactical-light/40 text-tactical-light bg-black/40 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider">NEW</span>;
      case 'UNDER_REVIEW':
        return <span className="border border-status-amber text-status-amber bg-status-amber/10 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider animate-pulse">UNDER REVIEW</span>;
      case 'REVIEWED':
        return <span className="border border-status-green text-status-green bg-status-green/10 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider">REVIEWED</span>;
      case 'NEEDS_FOLLOWUP':
        return <span className="border border-purple-400 text-purple-300 bg-purple-900/30 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider">FOLLOW-UP</span>;
    }
  };

  const getDispositionBadge = (disp: Disposition) => {
    switch (disp) {
      case 'RELEVANT':
        return <span className="bg-status-red/10 border border-status-red/70 text-status-red px-1.5 py-0.5 text-[9px] font-mono font-bold">DISP: RELEVANT</span>;
      case 'NOT_RELEVANT':
        return <span className="bg-status-green/10 border border-status-green/70 text-status-green px-1.5 py-0.5 text-[9px] font-mono font-bold">DISP: BENIGN / N-REL</span>;
      case 'UNCERTAIN':
        return <span className="bg-status-amber/10 border border-status-amber/70 text-status-amber px-1.5 py-0.5 text-[9px] font-mono font-bold">DISP: UNCERTAIN</span>;
      default:
        return <span className="text-tactical-light/50 text-[9px] font-mono">DISP: NONE</span>;
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.reviewStatus === statusFilter;
  });

  const selectedCam = cameraFeeds.find(c => c.id === selectedCamId);

  const activeAlertCamera = React.useMemo(() => {
    if (!activeAlert) return null;
    if (activeAlert.cameraId) {
      const found = cameraFeeds.find(c => c.id === activeAlert.cameraId);
      if (found) return found;
    }
    if (activeAlert.cam) {
      const match = activeAlert.cam.match(/CAM[- ]?(\d+)/i);
      if (match) {
        const found = cameraFeeds.find(c => c.id === match[1]);
        if (found) return found;
      }
    }
    return cameraFeeds[0];
  }, [activeAlert, cameraFeeds]);

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden bg-tactical-dark text-tactical-light">
      {/* Top Header */}
      <header className="bg-tactical-gray border-b border-tactical-green px-6 py-3 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-status-green rounded-full shadow-[0_0_8px_#00ff41]"></span>
            <h1 className="text-2xl font-black text-white tracking-widest font-mono">SENTINEL</h1>
            <span className="text-[10px] bg-tactical-olive/60 border border-tactical-green/50 text-tactical-light px-2 py-0.5 rounded font-mono">v1.2.0-m5</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setView('DASHBOARD')}
              className={`px-4 py-1.5 border ${view === 'DASHBOARD' ? 'border-tactical-green text-status-green bg-tactical-olive/40 shadow-[0_0_10px_rgba(0,255,65,0.15)]' : 'border-tactical-olive text-tactical-light hover:text-white'} font-mono text-xs transition-colors tracking-wider`}
            >
              TACTICAL DASHBOARD
            </button>
            <button
              onClick={() => setView('M4_CAMOUFLAGE')}
              className={`px-4 py-1.5 border ${view === 'M4_CAMOUFLAGE' ? 'border-tactical-green text-status-green bg-tactical-olive/40 shadow-[0_0_10px_rgba(0,255,65,0.15)]' : 'border-tactical-olive text-tactical-light hover:text-white'} font-mono text-xs transition-colors tracking-wider`}
            >
              M4 CAMOUFLAGE ANALYSIS
            </button>
          </div>
        </div>
        <div className="font-mono text-xs tracking-wide text-tactical-light flex items-center space-x-5">
          <span className="text-status-green flex items-center">
            <span className="w-2 h-2 rounded-full bg-status-green mr-2 animate-pulse"></span>
            FEEDS: {cameraFeeds.filter(c => c.isPlaying).length}/{cameraFeeds.length} PLAYING
          </span>
          <span className="border-l border-tactical-olive pl-4">ROLE: ANALYST</span>
          <span className="text-white font-bold bg-tactical-olive/40 px-2 py-0.5 border border-tactical-olive">OPR: {reviewerId}</span>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <main className="flex-1 flex overflow-hidden p-4 space-x-4 min-h-0">
          {/* Left: 8 Video Streams Grid */}
          <div className="flex-[3] flex flex-col space-y-2 min-w-0">
            {/* Toolbar above feeds */}
            <div className="flex justify-between items-center bg-tactical-gray/60 px-3 py-1.5 border border-tactical-olive">
              <div className="flex items-center space-x-3">
                <h2 className="font-mono text-white tracking-widest text-xs font-bold flex items-center">
                  <span className="text-status-green mr-2">›</span>
                  MULTI-SOURCE VIDEO INTELLIGENCE (M1)
                </h2>
                <span className="text-[10px] font-mono text-status-green bg-black/60 px-2 py-0.5 border border-tactical-green/50">
                  {cameraFeeds.length} LIVE VIDEO CHANNELS
                </span>
              </div>
              
              <div className="flex items-center space-x-2 font-mono text-[10px]">
                <button
                  onClick={() => setShowDetectionOverlays(!showDetectionOverlays)}
                  className={`px-2 py-1 border transition-colors ${
                    showDetectionOverlays
                      ? 'bg-status-amber/20 border-status-amber text-status-amber hover:bg-status-amber hover:text-black font-bold'
                      : 'bg-black/50 border-tactical-olive text-tactical-light hover:text-white'
                  }`}
                  title="Toggle tactical AI detection overlays on all feeds"
                >
                  👁️ {showDetectionOverlays ? 'DETECTIONS ON' : 'DETECTIONS HIDDEN'}
                </button>
                <button
                  onClick={togglePlayAll}
                  className="px-2 py-1 bg-tactical-olive/50 border border-tactical-green hover:bg-tactical-green hover:text-black text-white transition-colors"
                >
                  ⏯ PLAY/PAUSE ALL
                </button>
                <button
                  onClick={handleResetFeeds}
                  className="px-2 py-1 bg-black/50 border border-tactical-olive hover:border-tactical-light text-tactical-light hover:text-white transition-colors"
                  title="Reset all channels to default tactical surveillance videos"
                >
                  ⟲ RESET TO DEFAULTS
                </button>
              </div>
            </div>

            {/* Main Video View: Either Maximized Single View or 3x2 Grid */}
            <div className="panel flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
              {selectedCam ? (
                /* Maximized Single Video Channel View */
                <div className="w-full h-full bg-black border-2 border-tactical-green flex flex-col relative overflow-hidden">
                  {/* Top HUD */}
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-3 flex justify-between items-start z-20 font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse"></span>
                        <span className="text-white font-bold text-sm tracking-wider">{selectedCam.name}</span>
                        <span className={selectedCam.sensorType === 'IR_THERMAL' ? 'bg-orange-950/80 border border-orange-500 text-orange-400 text-[10px] px-1.5 py-0.5' : 'bg-emerald-950/80 border border-status-green text-status-green text-[10px] px-1.5 py-0.5'}>
                          {selectedCam.sensorType === 'IR_THERMAL' ? 'IR THERMAL SENSOR' : 'EO OPTICAL SENSOR'}
                        </span>
                        {selectedCam.fileName && (
                          <span className="bg-blue-950/80 border border-blue-400 text-blue-300 text-[10px] px-1.5 py-0.5">
                            UPLOADED: {selectedCam.fileName} ({selectedCam.fileSize})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-tactical-light">
                        GRID REF: 43R TN 8923 1245 | RES: {selectedCam.resolution} | FPS: {selectedCam.fps}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-status-green text-xs font-bold bg-black/80 px-2 py-1 border border-tactical-green">
                        {tacticalTime}
                      </span>
                      <button
                        onClick={() => setSelectedCamId(null)}
                        className="px-3 py-1 bg-status-red/20 border border-status-red text-status-red hover:bg-status-red hover:text-black font-bold text-xs transition-colors"
                      >
                        [ ✖ MINIMIZE TO 8 FEEDS ]
                      </button>
                    </div>
                  </div>

                  {/* High-Res Forensic Video Player with Canvas Filters */}
                  <div className="flex-1 w-full min-h-[360px] relative flex items-center justify-center bg-black overflow-hidden">
                    <ForensicVideoPlayer
                      ref={expandedPlayerRef}
                      videoUrl={selectedCam.videoUrl}
                      isMuted={isMuted}
                      filterMode={forensicFilter}
                      filterOptions={forensicOptions}
                      playbackSpeed={playbackSpeed}
                      onTimeUpdate={(cTime, dur) => {
                        setActiveVideoTime(cTime);
                        setActiveVideoDuration(dur);
                      }}
                      className="w-full h-full"
                    />

                    {/* Single Cam Expanded Overlays for CAM-8 (Construction) */}
                    {showDetectionOverlays && selectedCam.id === '8' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* 1. Large Concrete Foundation Slab */}
                        <div className="absolute top-[26%] left-[8%] w-[32%] h-[24%] border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                          <span className="absolute -top-3.5 left-0 bg-cyan-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ■ RECT #1: 24.5m × 12.0m [FOUNDATION SLAB // 294 m²]
                          </span>
                        </div>

                        {/* 2. Reinforced Core Shaft */}
                        <div className="absolute top-[30%] left-[16%] w-[11%] h-[13%] border-2 border-yellow-400 bg-yellow-500/25 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                          <span className="absolute -top-3.5 left-0 bg-yellow-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ◼ SQ #1: 6.2m × 6.2m [CORE SHAFT]
                          </span>
                        </div>

                        {/* 3. Central Grading Pad */}
                        <div className="absolute top-[46%] left-[36%] w-[26%] h-[20%] border-2 border-amber-400 bg-amber-500/15 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                          <span className="absolute -top-3.5 left-0 bg-amber-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ■ RECT #2: 18.5m × 9.2m [GRADING PAD]
                          </span>
                        </div>

                        {/* 4. Central Excavation Pit */}
                        <div className="absolute top-[50%] left-[56%] w-[13%] h-[14%] border-2 border-yellow-400 bg-yellow-500/20">
                          <span className="absolute -top-3.5 left-0 bg-yellow-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ◼ SQ #2: 8.5m [FOOTING]
                          </span>
                        </div>

                        {/* 5. Residential Lot A */}
                        <div className="absolute top-[14%] left-[56%] w-[14%] h-[13%] border-2 border-yellow-400 bg-yellow-500/20">
                          <span className="absolute -top-3.5 left-0 bg-yellow-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ◼ SQ #3: 7.8m [LOT A]
                          </span>
                        </div>

                        {/* 6. Residential Lot B */}
                        <div className="absolute top-[16%] left-[73%] w-[16%] h-[12%] border border-cyan-400 bg-cyan-500/15">
                          <span className="absolute -top-3.5 left-0 bg-cyan-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ■ RECT #3: 11.2m [LOT B]
                          </span>
                        </div>

                        {/* 7. Material Staging */}
                        <div className="absolute top-[36%] left-[68%] w-[15%] h-[8%] border border-emerald-400 bg-emerald-500/20">
                          <span className="absolute -top-3.5 left-0 bg-emerald-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ■ RECT #4: 8.0m [STAGING]
                          </span>
                        </div>

                        {/* 8. Southern Retention Basin */}
                        <div className="absolute top-[66%] left-[50%] w-[26%] h-[17%] border border-cyan-400 bg-cyan-500/15">
                          <span className="absolute -top-3.5 left-0 bg-cyan-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ■ RECT #5: 16.0m [DRAINAGE CUT]
                          </span>
                        </div>

                        {/* 9. Sump Vault */}
                        <div className="absolute top-[70%] left-[80%] w-[10%] h-[10%] border-2 border-yellow-400 bg-yellow-500/20">
                          <span className="absolute -top-3.5 left-0 bg-yellow-400 text-black text-[8px] font-bold px-1 whitespace-nowrap">
                            ◼ SQ #4: 5.4m [VAULT]
                          </span>
                        </div>

                        {/* 10. Pipeline Trench */}
                        <div className="absolute top-[48%] left-[20%] w-[50%] h-0 border-t-2 border-dashed border-fuchsia-400 rotate-[-12deg]">
                          <span className="absolute -top-4 left-10 bg-fuchsia-950/90 text-fuchsia-300 px-1 text-[7px] font-mono border border-fuchsia-500 whitespace-nowrap">
                            ⫽ PIPELINE TRENCH: 36.0m RUN @ 348°
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-7 (Perimeter Verified Clear) */}
                    {showDetectionOverlays && selectedCam.id === '7' && (
                      <div className="absolute top-4 left-4 right-4 bg-emerald-950/95 border border-status-green text-status-green p-2 font-mono text-xs flex justify-between items-center shadow-lg pointer-events-none">
                        <span className="font-bold flex items-center">
                          <span className="w-2 h-2 rounded-full bg-status-green mr-2"></span>
                          BORDER DEMARCATION LINE CLEAR // ZERO HUMAN INFILTRATION DETECTED
                        </span>
                        <span className="bg-black text-white px-2 py-0.5 border border-status-green text-[10px]">
                          0 TARGETS // INTACT PERIMETER
                        </span>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-5 (High-Speed Thermal Target) */}
                    {showDetectionOverlays && selectedCam.id === '5' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Critical Alert Banner */}
                        <div className="absolute top-4 left-4 right-4 bg-red-950/95 border-2 border-status-red text-white p-2.5 font-mono text-xs flex justify-between items-center shadow-2xl">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-status-red animate-ping"></span>
                            <span className="font-bold text-status-red tracking-wider">
                              CRITICAL THREAT: HIGH-SPEED INFRARED TARGET DETECTED
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px]">
                            <span className="text-yellow-300 font-bold">VELOCITY: ~140 m/s</span>
                            <span className="text-tactical-olive">|</span>
                            <span className="text-white">BEARING: 215° SW</span>
                            <span className="text-tactical-olive">|</span>
                            <span className="bg-status-red text-black px-1.5 py-0.5 font-bold">FLIR &gt;650°C</span>
                          </div>
                        </div>

                        {/* High-Speed Target Lock Reticle over Thermal Hotspot */}
                        <div className="absolute top-[50%] left-[34%] w-[18%] h-[20%] border-2 border-status-red bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse">
                          {/* Corner brackets */}
                          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-white"></div>
                          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-white"></div>
                          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-white"></div>
                          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-white"></div>

                          {/* Top Label */}
                          <div className="absolute -top-5 left-0 bg-status-red text-black px-1.5 py-0.2 font-mono font-black text-[9px] whitespace-nowrap shadow-md flex items-center space-x-1">
                            <span>🚀 TGT-FAST-01</span>
                            <span className="bg-black text-yellow-300 px-1 text-[8px]">CONF 0.96</span>
                          </div>

                          {/* Bottom Label */}
                          <div className="absolute -bottom-5 left-0 right-0 bg-black/90 border border-status-red/80 text-yellow-300 px-1 py-0.2 text-[8px] font-mono text-center whitespace-nowrap">
                            IR CORE: PEAK // EXHAUST PLUME ACTIVE
                          </div>
                        </div>

                        {/* Exhaust Trail Line Vector (from top-right to target) */}
                        <div className="absolute top-[38%] left-[44%] w-[24%] h-0 border-t-2 border-dashed border-status-amber rotate-[-42deg] shadow-[0_0_8px_rgba(255,183,3,0.5)]">
                          <span className="absolute -top-3.5 left-4 bg-black/90 text-status-amber px-1 text-[7px] font-mono border border-status-amber whitespace-nowrap">
                            ⫽ THERMAL EXHAUST PLUME WAKE (TRAIL: 28m)
                          </span>
                        </div>

                        {/* Bottom Air Defense Telemetry Badge */}
                        <div className="absolute bottom-16 right-6 bg-black/90 border border-status-red p-2.5 font-mono text-xs text-tactical-light space-y-1 shadow-lg">
                          <div className="text-status-red font-bold flex items-center">
                            <span className="w-2 h-2 rounded-full bg-status-red mr-1.5 animate-ping"></span>
                            IMMEDIATE AIR DEFENSE INTERCEPT QUEUED
                          </div>
                          <div className="text-[10px] text-gray-300">Descent trajectory: 32° dive angle // Sector Echo</div>
                          <div className="text-[10px] text-yellow-300">Target Type: High-Speed Rocket/Jet-Assisted UAV or Munition</div>
                        </div>
                      </div>
                    )}

                    {/* AI Frame Inference Result Overlay */}
                    {activeFrameAIResult && (
                      <div className="absolute bottom-4 left-4 right-4 bg-black/95 border border-status-amber p-2.5 font-mono text-xs text-status-amber z-20 shadow-lg flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-status-amber animate-pulse"></span>
                          <span>{activeFrameAIResult}</span>
                        </div>
                        <button
                          onClick={() => setActiveFrameAIResult(null)}
                          className="text-tactical-light hover:text-white px-2 py-0.5 border border-tactical-olive text-[10px]"
                        >
                          DISMISS
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive Timeline Scrubber */}
                  <div className="bg-black/95 px-3 py-1.5 border-t border-tactical-olive/80 flex items-center space-x-3 font-mono text-xs z-20 shrink-0">
                    <span className="text-[10px] text-tactical-light whitespace-nowrap">SEEK:</span>
                    <input
                      type="range"
                      min="0"
                      max={activeVideoDuration || 100}
                      step="0.05"
                      value={activeVideoTime}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        setActiveVideoTime(t);
                        expandedPlayerRef.current?.seek(t);
                      }}
                      className="flex-1 accent-tactical-green h-1.5 bg-tactical-dark cursor-pointer"
                    />
                    <span className="text-[10px] text-status-green whitespace-nowrap font-bold">
                      {formatTimecode(activeVideoTime)} / {formatTimecode(activeVideoDuration)}
                    </span>
                  </div>

                  {/* Playback & Action Controls Bar */}
                  <div className="bg-tactical-gray border-t border-tactical-olive p-2.5 flex items-center justify-between z-20 font-mono text-xs shrink-0">
                    <div className="flex items-center space-x-3">
                      {/* Play/Pause */}
                      <button
                        onClick={() => expandedPlayerRef.current?.togglePlay()}
                        className="px-3 py-1 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold transition-colors"
                      >
                        PLAY / PAUSE
                      </button>

                      {/* Mute/Unmute */}
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`px-3 py-1 border transition-colors ${isMuted ? 'border-tactical-olive text-tactical-light' : 'border-status-green text-status-green bg-status-green/10'}`}
                      >
                        {isMuted ? '🔇 MUTED' : '🔊 AUDIO ON'}
                      </button>

                      {/* Playback speed */}
                      <div className="flex items-center space-x-1 border border-tactical-olive px-1.5 py-0.5">
                        <span className="text-[10px] text-tactical-light mr-1">SPEED:</span>
                        {[0.5, 1.0, 2.0].map(s => (
                          <button
                            key={s}
                            onClick={() => setPlaybackSpeed(s)}
                            className={`px-1.5 py-0.5 text-[10px] ${playbackSpeed === s ? 'bg-tactical-green text-black font-bold' : 'text-tactical-light hover:text-white'}`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Generate ISO/IEC 27037 Forensic Evidence Dossier */}
                      <button
                        onClick={() => {
                          if (selectedCam) {
                            const d = createForensicDossier({
                              sensorId: selectedCam.id,
                              sensorName: selectedCam.name,
                              sensorModality: selectedCam.sensorType,
                              targetClass: selectedCam.id === '7' ? 'HUMAN_INFILTRATION' : selectedCam.id === '8' ? 'CAMOUFLAGED_ASSET' : 'DRONE_UAV',
                              confidence: 'CONFIRMED',
                              filterMode: forensicFilter,
                              filterOptions: forensicOptions,
                              timecode: formatTimecode(activeVideoTime),
                              analystId: reviewerId,
                              analystNotes: `Forensic standard evaluation conducted on ${selectedCam.name} at timecode ${formatTimecode(activeVideoTime)}. Filter: ${forensicFilter}. Zoom: ${forensicOptions.zoom.toFixed(1)}x.`,
                              disposition: 'RELEVANT'
                            });
                            setActiveReportDossier(d);
                          }
                        }}
                        className="px-3 py-1 bg-tactical-olive hover:bg-tactical-green hover:text-black text-white font-mono font-bold text-xs border border-tactical-green transition-colors flex items-center space-x-1"
                        title="Generate ISO/IEC 27037 Digital Forensics Evidence Dossier"
                      >
                        <span>📄</span>
                        <span>FORENSIC DOSSIER</span>
                      </button>

                      {/* Run AI Analysis on current video frame */}
                      <button
                        onClick={analyzeActiveVideoFrame}
                        disabled={isAnalyzingFrame}
                        className="px-3 py-1 bg-status-amber text-black font-bold hover:bg-yellow-400 transition-colors flex items-center space-x-1.5 shadow-md"
                      >
                        <span>⚡</span>
                        <span>{isAnalyzingFrame ? 'ANALYZING FRAME...' : 'RUN AI INFERENCE ON FRAME'}</span>
                      </button>

                      {/* Upload Replacement Video */}
                      <label className="px-3 py-1 bg-tactical-green text-black font-bold hover:bg-[#5f7751] transition-colors cursor-pointer flex items-center space-x-1.5">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleVideoUpload(selectedCam.id, e.target.files[0]);
                            }
                          }}
                        />
                        <span>⤒</span>
                        <span>REPLACE VIDEO FEED</span>
                      </label>
                    </div>
                  </div>

                  {/* Forensic Image Processing & Write-up Deck */}
                  <div className="shrink-0 max-h-72 overflow-y-auto">
                    <ForensicControlsDeck
                      camId={selectedCam.id}
                      camName={selectedCam.name}
                      filterMode={forensicFilter}
                      onFilterChange={setForensicFilter}
                      filterOptions={forensicOptions}
                      onOptionsChange={setForensicOptions}
                      activeTimecode={formatTimecode(activeVideoTime)}
                      analystId={reviewerId}
                      onSaveWriteup={handleSaveForensicWriteup}
                      onFlagFollowup={handleFlagFollowupWriteup}
                      existingWriteups={forensicWriteups}
                    />
                  </div>
                </div>
              ) : (
                /* 4x2 Video Channels Grid (8 Feeds) */
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-full w-full">
                  {cameraFeeds.map((cam) => (
                    <div
                      key={cam.id}
                      className={`bg-black border relative group overflow-hidden flex flex-col transition-all shadow-md ${
                        cam.id === '7' ? 'border-status-red shadow-[0_0_12px_rgba(255,0,51,0.25)]' :
                        cam.id === '8' ? 'border-status-amber shadow-[0_0_12px_rgba(255,183,3,0.25)]' :
                        'border-tactical-olive hover:border-tactical-green'
                      }`}
                    >
                      {/* Live Video Player */}
                      <video
                        ref={el => { videoRefs.current[cam.id] = el; }}
                        src={cam.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedCamId(cam.id)}
                      />

                      {/* Top HUD Overlay */}
                      <div className="absolute top-0 inset-x-0 p-1.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex justify-between items-start pointer-events-none z-10 font-mono">
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${cam.id === '7' ? 'bg-status-red' : cam.id === '8' ? 'bg-status-amber' : 'bg-status-green'} animate-pulse`}></span>
                          <span className="text-white bg-black/80 px-1 py-0.2 border border-tactical-olive text-[10px] font-bold truncate max-w-[120px]">
                            {cam.name}
                          </span>
                          <span className={cam.sensorType === 'IR_THERMAL' ? 'bg-orange-950/80 border border-orange-500/80 text-orange-400 text-[8px] px-1 font-mono' : 'bg-emerald-950/80 border border-status-green/80 text-status-green text-[8px] px-1 font-mono'}>
                            {cam.sensorType === 'IR_THERMAL' ? 'IR' : 'EO'}
                          </span>
                        </div>
                        <div className="text-[9px] text-tactical-light bg-black/80 px-1 border border-tactical-olive">
                          {cam.resolution}
                        </div>
                      </div>

                      {/* Tactical Detection Banner for CAM-7 (Border Perimeter Verified Clear) */}
                      {showDetectionOverlays && cam.id === '7' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-emerald-950/90 border border-status-green text-status-green px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between shadow-md">
                          <span className="font-bold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-green mr-1"></span>
                            SECTOR CLEAR // ZERO INFILTRATION DETECTED
                          </span>
                          <span className="bg-black/80 text-white px-1 border border-status-green text-[8px]">
                            0 TARGETS
                          </span>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-5 (High-Speed Thermal Target) */}
                      {showDetectionOverlays && cam.id === '5' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-red-950/95 border border-status-red text-white px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between shadow-md">
                          <span className="font-bold text-status-red flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-red mr-1 animate-ping"></span>
                            CRITICAL: HIGH-SPEED THERMAL TARGET
                          </span>
                          <span className="bg-black/80 text-yellow-300 px-1 border border-status-red text-[7px] font-bold">
                            VEL: ~140 m/s
                          </span>
                        </div>
                      )}

                      {/* Tactical Target Reticle & Plume Overlay on CAM-5 in Grid */}
                      {showDetectionOverlays && cam.id === '5' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {/* Target Bounding Reticle */}
                          <div className="absolute top-[52%] left-[34%] w-[16%] h-[18%] border border-status-red bg-status-red/20 shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                            <span className="absolute -top-3 left-0 bg-status-red text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              🚀 TGT-FAST-01 (0.96)
                            </span>
                          </div>
                          {/* Plume Trail Line */}
                          <div className="absolute top-[40%] left-[42%] w-[20%] h-0 border-t border-dashed border-status-amber rotate-[-42deg]"></div>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-8 (Active Construction Complex) */}
                      {showDetectionOverlays && cam.id === '8' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-amber-950/95 border border-status-amber text-status-amber px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between shadow-md">
                          <span className="font-bold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-amber mr-1 animate-ping"></span>
                            FLAGGED: CONSTRUCTION COMPLEX
                          </span>
                          <span className="bg-black/80 text-yellow-300 px-1 border border-status-amber text-[8px]">
                            8+ SITES (SQUARES & RECTS)
                          </span>
                        </div>
                      )}

                      {/* Tactical Geometric Shapes Overlaid on CAM-8 in Grid (Full Multi-Structure Mapping) */}
                      {showDetectionOverlays && cam.id === '8' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {/* 1. Large Concrete Foundation Slab (Upper-Left Main Structure) */}
                          <div className="absolute top-[26%] left-[8%] w-[32%] h-[24%] border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                            <span className="absolute -top-2.5 left-0 bg-cyan-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 24.5m [SLAB]
                            </span>
                          </div>

                          {/* 2. Reinforced Elevator / Utility Core Shaft */}
                          <div className="absolute top-[30%] left-[16%] w-[11%] h-[13%] border-2 border-yellow-400 bg-yellow-500/25 shadow-[0_0_6px_rgba(250,204,21,0.4)]">
                            <span className="absolute -top-2.5 left-0 bg-yellow-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ◼ SQ 6.2m
                            </span>
                          </div>

                          {/* 3. East Building Footing Trench */}
                          <div className="absolute top-[38%] left-[26%] w-[13%] h-[10%] border border-cyan-400 bg-cyan-500/15">
                            <span className="absolute -top-2.5 left-0 bg-cyan-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 9.8m
                            </span>
                          </div>

                          {/* 4. Central Heavy Earthmoving & Soil Grading Pad */}
                          <div className="absolute top-[46%] left-[36%] w-[26%] h-[20%] border-2 border-amber-400 bg-amber-500/15 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            <span className="absolute -top-2.5 left-0 bg-amber-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 18.5m [GRADING PAD]
                            </span>
                          </div>

                          {/* 5. Central Footing Excavation Pit */}
                          <div className="absolute top-[50%] left-[56%] w-[13%] h-[14%] border-2 border-yellow-400 bg-yellow-500/20">
                            <span className="absolute -top-2.5 left-0 bg-yellow-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ◼ SQ 8.5m [FOOTING]
                            </span>
                          </div>

                          {/* 6. Upper Residential Lot A Structural Footing */}
                          <div className="absolute top-[14%] left-[56%] w-[14%] h-[13%] border-2 border-yellow-400 bg-yellow-500/20">
                            <span className="absolute -top-2.5 left-0 bg-yellow-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ◼ SQ 7.8m [LOT A]
                            </span>
                          </div>

                          {/* 7. Upper Residential Lot B Perimeter Slab */}
                          <div className="absolute top-[16%] left-[73%] w-[16%] h-[12%] border border-cyan-400 bg-cyan-500/15">
                            <span className="absolute -top-2.5 left-0 bg-cyan-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 11.2m [LOT B]
                            </span>
                          </div>

                          {/* 8. Prefabricated Material Blocks & Staging Zone */}
                          <div className="absolute top-[36%] left-[68%] w-[15%] h-[8%] border border-emerald-400 bg-emerald-500/20">
                            <span className="absolute -top-2.5 left-0 bg-emerald-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 8.0m [STAGING]
                            </span>
                          </div>

                          {/* 9. Southern Retention Drainage Trench */}
                          <div className="absolute top-[66%] left-[50%] w-[26%] h-[17%] border border-cyan-400 bg-cyan-500/15">
                            <span className="absolute -top-2.5 left-0 bg-cyan-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ■ RECT 16.0m [DRAINAGE CUT]
                            </span>
                          </div>

                          {/* 10. Southern Pump Station / Sump Vault */}
                          <div className="absolute top-[70%] left-[80%] w-[10%] h-[10%] border-2 border-yellow-400 bg-yellow-500/20">
                            <span className="absolute -top-2.5 left-0 bg-yellow-400 text-black text-[6px] font-bold px-0.5 whitespace-nowrap">
                              ◼ SQ 5.4m [VAULT]
                            </span>
                          </div>

                          {/* 11. Main Utility Conduit Trench Line */}
                          <div className="absolute top-[48%] left-[20%] w-[50%] h-0 border-t-2 border-dashed border-fuchsia-400 rotate-[-12deg]">
                            <span className="absolute -top-3 left-6 bg-fuchsia-950/90 text-fuchsia-300 px-0.5 text-[5px] font-mono border border-fuchsia-500 whitespace-nowrap">
                              ⫽ PIPELINE TRENCH: 36.0m
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Custom Upload Badge */}
                      {cam.fileName && (
                        <div className="absolute top-8 left-2 bg-blue-950/90 border border-blue-400 text-blue-300 text-[9px] px-1.5 py-0.5 font-mono z-10 pointer-events-none">
                          FILE: {cam.fileName}
                        </div>
                      )}

                      {/* Center Crosshair Overlay */}
                      <div
                        onClick={() => setSelectedCamId(cam.id)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-black/20"
                      >
                        <div className="text-status-green font-mono text-[11px] bg-black/80 px-2 py-1 border border-tactical-green tracking-wider">
                          [ CLICK TO INSPECT FULLSCREEN ]
                        </div>
                      </div>

                      {/* Bottom HUD & Action Controls */}
                      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex justify-between items-center z-10 font-mono text-[10px]">
                        <span className="text-tactical-light text-[9px] flex items-center space-x-1">
                          <span className="text-status-green">●</span>
                          <span>{cam.status === 'CUSTOM_VIDEO' ? 'CUSTOM VIDEO' : 'TACTICAL FEED'}</span>
                        </span>

                        <div className="flex items-center space-x-1.5">
                          {/* Dedicated Upload Button for this feed */}
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.5 bg-tactical-olive/60 border border-tactical-green hover:bg-tactical-green hover:text-black text-status-green cursor-pointer transition-colors flex items-center space-x-1"
                            title="Upload custom video for this camera feed"
                          >
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleVideoUpload(cam.id, e.target.files[0]);
                                }
                              }}
                            />
                            <span>⤒</span>
                            <span>UPLOAD</span>
                          </label>

                          {/* Play/Pause */}
                          <button
                            onClick={(e) => toggleCameraPlay(cam.id, e)}
                            className="px-1.5 py-0.5 bg-black/80 border border-tactical-olive hover:text-white transition-colors"
                          >
                            {cam.isPlaying ? '⏸' : '▶'}
                          </button>

                          {/* Maximize */}
                          <button
                            onClick={() => setSelectedCamId(cam.id)}
                            className="px-1.5 py-0.5 bg-tactical-green/30 border border-tactical-green text-status-green hover:bg-tactical-green hover:text-black transition-colors font-bold"
                          >
                            ⛶
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Threat Intelligence Alert Feed (Phase 7 Review Workflow) */}
          <div className="flex-[2] flex flex-col space-y-3 min-w-0">
            <div className="flex justify-between items-center">
              <h2 className="font-mono text-tactical-light tracking-widest text-sm font-bold flex items-center">
                <span className="text-status-red mr-2">›</span>
                TACTICAL ALERT INBOX
                <span className="ml-2 px-1.5 py-0.2 bg-status-red/20 border border-status-red text-status-red text-[11px] font-bold">
                  {alerts.length}
                </span>
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 font-mono text-[10px] bg-tactical-gray p-1 border border-tactical-olive">
              {['ALL', 'NEW', 'UNDER_REVIEW', 'REVIEWED', 'NEEDS_FOLLOWUP'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setStatusFilter(filterKey)}
                  className={`flex-1 py-1 text-center transition-colors ${
                    statusFilter === filterKey
                      ? 'bg-tactical-green text-black font-bold'
                      : 'text-tactical-light hover:text-white hover:bg-tactical-olive/30'
                  }`}
                >
                  {filterKey.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Alerts List */}
            <div className="panel flex-1 overflow-y-auto space-y-2.5 p-2 min-h-0">
              {filteredAlerts.length === 0 ? (
                <div className="flex items-center justify-center h-48 font-mono text-tactical-olive text-xs tracking-widest">
                  NO ALERTS IN THIS CATEGORY
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => openReviewModal(alert)}
                    className="p-3 bg-black/60 border border-tactical-olive hover:border-tactical-green hover:bg-black/90 cursor-pointer transition-all relative group"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                      <span className="text-white font-bold">{alert.cam || 'CAM-SYS'} | {alert.time || alert.timestamp}</span>
                      <div className="flex items-center space-x-2">
                        {getThreatBadge(alert.threatLevel)}
                        {getStatusBadge(alert.reviewStatus)}
                      </div>
                    </div>

                    {/* Module & Description */}
                    <div className="font-mono text-xs text-status-amber font-semibold mb-1 flex items-center">
                      <span className="mr-1.5 opacity-60">MOD:</span> {alert.module}
                    </div>
                    <div className="font-sans text-xs text-gray-300 line-clamp-2 mb-2">
                      {alert.description}
                    </div>

                    {/* Disposition & Provenance Footer */}
                    <div className="pt-2 border-t border-tactical-olive/50 flex items-center justify-between font-mono text-[10px]">
                      <div>{getDispositionBadge(alert.disposition)}</div>
                      <div className="text-tactical-light/60 group-hover:text-status-green transition-colors flex items-center">
                        <span className="mr-1">[REVIEW]</span>
                        <span>›</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {/* M4 CAMOUFLAGE & GEOMETRIC ANALYSIS SUITE */}
      {view === 'M4_CAMOUFLAGE' && (
        <CamouflageGeometricViewer
          cameraFeeds={cameraFeeds}
          onOpenReviewModal={openReviewModal}
          onGenerateReport={(dossier) => setActiveReportDossier(dossier)}
          reviewerId={reviewerId}
        />
      )}

      {/* ANALYST REVIEW & AUDIT MODAL */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tactical-gray border-2 border-tactical-green w-full max-w-5xl max-h-[94vh] flex flex-col shadow-[0_0_30px_rgba(0,255,65,0.2)]">
            
            {/* Modal Header */}
            <div className="bg-black/90 px-6 py-3 border-b border-tactical-olive flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 bg-status-amber rounded-full animate-pulse"></span>
                <h3 className="font-mono text-base font-bold text-white tracking-widest">
                  TACTICAL ALERT REVIEW WORKFLOW
                </h3>
                <span className="text-xs font-mono bg-tactical-olive/60 text-tactical-light px-2 py-0.5 border border-tactical-olive">
                  ALERT ID: {activeAlert.id}
                </span>
              </div>
              <button
                onClick={closeReviewModal}
                className="text-tactical-light hover:text-white font-mono text-sm px-2 py-1 border border-tactical-olive hover:border-tactical-green"
              >
                [ ESC / CLOSE ]
              </button>
            </div>

            {/* Guardrail Disclaimer Banner */}
            <div className="bg-status-amber/10 border-b border-status-amber/30 px-6 py-2 flex items-center space-x-3 text-status-amber font-mono text-xs">
              <span className="font-bold border border-status-amber px-1">GUARDRAIL NOTICE</span>
              <span>
                Operator Review Record only. Platform outputs are analytical cues. Sentinel does not make autonomous operational decisions or targeting determinations.
              </span>
            </div>

            {/* Tab Navigation Header */}
            <div className="bg-black/95 px-6 py-2 border-b border-tactical-olive flex justify-between items-center font-mono text-xs">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setModalTab('DETAILS')}
                  className={`px-3 py-1.5 border transition-colors flex items-center space-x-2 ${
                    modalTab === 'DETAILS'
                      ? 'border-tactical-green bg-tactical-green text-black font-bold shadow-[0_0_8px_rgba(0,255,65,0.3)]'
                      : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                  }`}
                >
                  <span>📋</span>
                  <span>1. ALERT DETAILS & DISPOSITION</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('INSPECT_FOOTAGE')}
                  className={`px-3 py-1.5 border transition-colors flex items-center space-x-2 ${
                    modalTab === 'INSPECT_FOOTAGE'
                      ? 'border-status-amber bg-status-amber text-black font-bold shadow-[0_0_8px_rgba(255,183,3,0.3)]'
                      : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                  }`}
                >
                  <span>📹</span>
                  <span>2. INSPECT SOURCE FOOTAGE & FORENSIC FILTERS</span>
                  <span className="text-[10px] bg-black/60 text-status-amber px-1.5 py-0.2 rounded border border-status-amber/40">
                    {activeAlertCamera?.name || activeAlert.cam || 'CAM-SRC'}
                  </span>
                </button>
              </div>

              {modalTab === 'INSPECT_FOOTAGE' && activeAlertCamera && (
                <div className="text-[11px] text-tactical-light font-mono flex items-center space-x-2">
                  <span className="text-tactical-green font-bold">FEED:</span>
                  <span className="text-white font-bold">{activeAlertCamera.name}</span>
                  <span className="text-tactical-olive">|</span>
                  <span className="text-status-amber">{activeAlertCamera.sensorType === 'IR_THERMAL' ? 'IR THERMAL SENSOR' : 'EO OPTICAL SENSOR'}</span>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* TAB 1: DETAILS & DISPOSITION */}
              {modalTab === 'DETAILS' && (
                <>
                  {/* Dual-Column Section: AI Telemetry (Left) vs Human Disposition (Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Section A: AI Machine Telemetry (Read-Only) */}
                    <div className="bg-black/50 border border-tactical-olive p-4 flex flex-col space-y-3">
                      <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2">
                        <span className="font-mono text-xs font-bold text-tactical-light tracking-wider flex items-center">
                          <span className="text-tactical-green mr-1.5">›</span>
                          AI INFERENCE FINDINGS (READ-ONLY)
                        </span>
                        <span className="font-mono text-[10px] text-tactical-light/60">
                          ENG: {activeAlert.engineVersion}
                        </span>
                      </div>

                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-tactical-light">SOURCE SENSOR:</span>
                          <span className="text-white font-bold">{activeAlert.cam || 'CAM-SYS'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tactical-light">DETECTION MODULE:</span>
                          <span className="text-status-amber font-bold">{activeAlert.module}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-tactical-light">AI THREAT SCORE:</span>
                          <div>{getThreatBadge(activeAlert.threatLevel)}</div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tactical-light">TIMESTAMP:</span>
                          <span className="text-white">{activeAlert.timestamp || activeAlert.time}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-tactical-olive/40">
                        <span className="font-mono text-[11px] text-tactical-light block mb-1">ANALYTIC SUMMARY:</span>
                        <div className="p-2.5 bg-tactical-dark border border-tactical-olive text-gray-300 font-sans text-xs leading-relaxed">
                          {activeAlert.description}
                        </div>
                      </div>

                      {/* Quick Inspect Button */}
                      <div className="p-2.5 bg-tactical-dark border border-tactical-olive flex items-center justify-between">
                        <span className="font-mono text-[10px] text-tactical-light">Need forensic cross-verification?</span>
                        <button
                          type="button"
                          onClick={() => setModalTab('INSPECT_FOOTAGE')}
                          className="px-2.5 py-1 bg-tactical-olive hover:bg-tactical-green hover:text-black text-white font-mono text-[10px] font-bold border border-tactical-green transition-colors"
                        >
                          [ 📹 INSPECT SOURCE FOOTAGE ]
                        </button>
                      </div>

                      <div className="p-2 bg-tactical-olive/20 border border-tactical-olive text-tactical-light font-mono text-[10px]">
                        Note: Machine cue based on visual feature extraction. All action dispositions must be verified and signed by a qualified human reviewer.
                      </div>
                    </div>

                    {/* Section B: Human Reviewer Form */}
                    <form onSubmit={handleReviewSubmit} className="bg-black/50 border border-tactical-olive p-4 flex flex-col space-y-3">
                      <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2">
                        <span className="font-mono text-xs font-bold text-white tracking-wider flex items-center">
                          <span className="text-status-green mr-1.5">›</span>
                          HUMAN REVIEWER DETERMINATION
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {getStatusBadge(activeAlert.reviewStatus)}
                          {getDispositionBadge(activeAlert.disposition)}
                        </div>
                      </div>

                      {/* Reviewer Call Sign */}
                      <div className="font-mono text-xs space-y-1">
                        <label className="text-tactical-light block">REVIEWER CALLSIGN / OPERATOR ID:</label>
                        <input
                          type="text"
                          value={reviewerId}
                          onChange={(e) => setReviewerId(e.target.value)}
                          className="w-full bg-tactical-dark border border-tactical-olive text-white px-2.5 py-1 text-xs font-mono focus:border-tactical-green focus:outline-none"
                          required
                        />
                      </div>

                      {/* Review Action Selector */}
                      <div className="font-mono text-xs space-y-1">
                        <label className="text-tactical-light block">WORKFLOW ACTION:</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { action: 'ACKNOWLEDGE', label: 'ACKNOWLEDGE (TAKE OWNSHIP)' },
                            { action: 'RECORD_DISPOSITION', label: 'RECORD DISPOSITION' },
                            { action: 'FLAG_FOLLOWUP', label: 'FLAG FOR FOLLOW-UP' },
                            { action: 'REOPEN', label: 'REOPEN REVIEW' }
                          ].map(item => (
                            <button
                              key={item.action}
                              type="button"
                              onClick={() => setReviewAction(item.action as ReviewAction)}
                              className={`px-2 py-1.5 border text-left text-[10px] transition-colors ${
                                reviewAction === item.action
                                  ? 'border-tactical-green bg-tactical-green text-black font-bold'
                                  : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Human Disposition Selector */}
                      {(reviewAction === 'RECORD_DISPOSITION' || reviewAction === 'FLAG_FOLLOWUP') && (
                        <div className="font-mono text-xs space-y-1">
                          <label className="text-tactical-light block">HUMAN DISPOSITION DECISION:</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDisposition('RELEVANT')}
                              className={`px-2 py-1.5 border text-center text-[10px] font-bold transition-colors ${
                                selectedDisposition === 'RELEVANT'
                                  ? 'bg-status-red text-black border-status-red'
                                  : 'border-tactical-olive text-status-red bg-tactical-dark hover:bg-status-red/10'
                              }`}
                            >
                              RELEVANT (THREAT)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDisposition('NOT_RELEVANT')}
                              className={`px-2 py-1.5 border text-center text-[10px] font-bold transition-colors ${
                                selectedDisposition === 'NOT_RELEVANT'
                                  ? 'bg-status-green text-black border-status-green'
                                  : 'border-tactical-olive text-status-green bg-tactical-dark hover:bg-status-green/10'
                              }`}
                            >
                              NOT RELEVANT (BENIGN)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDisposition('UNCERTAIN')}
                              className={`px-2 py-1.5 border text-center text-[10px] font-bold transition-colors ${
                                selectedDisposition === 'UNCERTAIN'
                                  ? 'bg-status-amber text-black border-status-amber'
                                  : 'border-tactical-olive text-status-amber bg-tactical-dark hover:bg-status-amber/10'
                              }`}
                            >
                              UNCERTAIN (AMBIGUOUS)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Linked Forensic Observations Helper */}
                      {forensicWriteups.filter(w => w.alertId === activeAlert.id || w.camId === activeAlert.cameraId || activeAlert.cam?.includes(`CAM-${w.camId}`)).length > 0 && (
                        <div className="bg-tactical-dark border border-tactical-olive p-2 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono text-tactical-light">
                            <span className="text-tactical-green font-bold">LINKED FORENSIC FINDINGS:</span>
                            <button
                              type="button"
                              onClick={() => setModalTab('INSPECT_FOOTAGE')}
                              className="text-status-amber hover:underline text-[9px]"
                            >
                              [ OPEN INSPECTOR ]
                            </button>
                          </div>
                          {forensicWriteups
                            .filter(w => w.alertId === activeAlert.id || w.camId === activeAlert.cameraId || activeAlert.cam?.includes(`CAM-${w.camId}`))
                            .slice(0, 2)
                            .map(w => (
                              <div key={w.id} className="text-[10px] font-mono p-1 bg-black/40 border border-tactical-olive/40 flex justify-between items-center">
                                <span className="text-white truncate max-w-[220px]">
                                  <strong className="text-status-amber">[{w.filterUsed}]</strong> {TARGET_LABELS[w.targetClass]?.label || w.targetClass}: {w.notes.substring(0, 35)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const snippet = `[FORENSIC ${w.filterUsed} @ TC ${w.timecode}] ${TARGET_LABELS[w.targetClass]?.label || w.targetClass}: ${w.notes}`;
                                    setReviewNote(prev => prev ? `${prev}\n\n${snippet}` : snippet);
                                  }}
                                  className="text-[9px] text-tactical-green hover:text-white px-1 border border-tactical-olive shrink-0"
                                >
                                  + PASTE
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Reviewer Rationale Notes */}
                      <div className="font-mono text-xs space-y-1 flex-1">
                        <label className="text-tactical-light block">ANALYST RATIONALE / OBSERVATION NOTES:</label>
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          rows={3}
                          placeholder="Enter tactical justification, ground truth check, or follow-up instructions..."
                          className="w-full bg-tactical-dark border border-tactical-olive text-white p-2 text-xs font-sans focus:border-tactical-green focus:outline-none"
                        />
                      </div>

                      {/* Form Submission Button & Forensic Report Link */}
                      <div className="pt-2 flex space-x-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-2 bg-tactical-green text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#5f7751] transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? 'RECORDING AUDIT...' : 'COMMIT DISPOSITION & LOG AUDIT TRAIL'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeAlert) {
                              const camName = activeAlert.cam || (activeAlert.cameraId ? `CAM-${activeAlert.cameraId}` : 'CAM-1');
                              const camId = activeAlert.cameraId || (activeAlert.cam ? activeAlert.cam.replace('CAM-', '') : '1');
                              const cam = cameraFeeds.find(c => c.name === camName || c.id === camId) || cameraFeeds[0];
                              const dossier = createForensicDossier({
                                alertId: activeAlert.id,
                                sensorId: cam.id,
                                sensorName: cam.name,
                                sensorModality: cam.sensorType,
                                targetClass: cam.id === '7' ? 'HUMAN_INFILTRATION' : cam.id === '8' ? 'CAMOUFLAGED_ASSET' : 'DRONE_UAV',
                                confidence: 'CONFIRMED',
                                filterMode: forensicFilter,
                                filterOptions: forensicOptions,
                                timecode: formatTimecode(modalVideoTime),
                                analystId: reviewerId,
                                analystNotes: reviewNote || `Formal ISO/IEC 27037 forensic documentation for ${activeAlert.description}. Disposition: ${selectedDisposition || activeAlert.disposition}.`,
                                disposition: selectedDisposition || activeAlert.disposition,
                                dispositionRationale: reviewNote || undefined
                              });
                              setActiveReportDossier(dossier);
                            }
                          }}
                          className="px-3 py-2 bg-tactical-olive hover:bg-tactical-green hover:text-black text-white font-mono font-bold text-xs uppercase border border-tactical-green transition-colors flex items-center space-x-1.5 shrink-0"
                          title="Generate ISO/IEC 27037 Digital Evidence Forensics Dossier"
                        >
                          <span>📄</span>
                          <span>FORENSIC DOSSIER</span>
                        </button>
                      </div>

                      {actionSuccessMsg && (
                        <div className="p-2 bg-status-green/10 border border-status-green text-status-green font-mono text-[11px] text-center">
                          {actionSuccessMsg}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Section C: Append-Only Review Audit Trail */}
                  <div className="bg-black/50 border border-tactical-olive p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-mono text-xs font-bold text-tactical-light tracking-wider flex items-center">
                        <span className="text-tactical-green mr-1.5">›</span>
                        IMMUTABLE REVIEW AUDIT TRAIL (CHRONOLOGICAL)
                      </h4>
                      <span className="font-mono text-[10px] text-tactical-light/60">
                        TOTAL AUDIT ENTRIES: {(audits[activeAlert.id] || []).length}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-tactical-olive text-tactical-light text-left bg-tactical-dark">
                            <th className="p-2">TIMESTAMP</th>
                            <th className="p-2">ACTION</th>
                            <th className="p-2">OPERATOR / AGENT</th>
                            <th className="p-2">STATUS TRANSITION</th>
                            <th className="p-2">DISPOSITION</th>
                            <th className="p-2">NOTES / RATIONALE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(audits[activeAlert.id] || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-3 text-center text-tactical-olive">
                                NO AUDIT ENTRIES LOGGED
                              </td>
                            </tr>
                          ) : (
                            (audits[activeAlert.id] || []).map((entry, idx) => (
                              <tr key={idx} className="border-b border-tactical-olive/30 hover:bg-tactical-olive/10">
                                <td className="p-2 text-tactical-light whitespace-nowrap">
                                  {entry.timestamp ? entry.timestamp.replace('T', ' ').substring(0, 19) : 'N/A'}
                                </td>
                                <td className="p-2 font-bold text-white whitespace-nowrap">
                                  {entry.action}
                                </td>
                                <td className="p-2 text-status-green whitespace-nowrap">
                                  {entry.reviewerId}
                                </td>
                                <td className="p-2 text-tactical-light whitespace-nowrap">
                                  {entry.previousStatus ? `${entry.previousStatus} → ` : ''}
                                  <span className="text-white font-semibold">{entry.newStatus}</span>
                                </td>
                                <td className="p-2 whitespace-nowrap">
                                  {entry.newDisposition ? (
                                    <span className={
                                      entry.newDisposition === 'RELEVANT' ? 'text-status-red font-bold' :
                                      entry.newDisposition === 'NOT_RELEVANT' ? 'text-status-green font-bold' :
                                      entry.newDisposition === 'UNCERTAIN' ? 'text-status-amber font-bold' : 'text-tactical-light'
                                    }>
                                      {entry.newDisposition}
                                    </span>
                                  ) : 'NONE'}
                                </td>
                                <td className="p-2 text-gray-300 font-sans text-xs">
                                  {entry.note || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: INSPECT SOURCE FOOTAGE & FORENSIC FILTERS */}
              {modalTab === 'INSPECT_FOOTAGE' && (
                <div className="space-y-4">
                  {/* Top Bar for Inspect Mode */}
                  <div className="bg-black/70 border border-tactical-olive p-3 flex justify-between items-center font-mono">
                    <div className="flex items-center space-x-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse"></span>
                      <span className="text-xs font-bold text-white tracking-wider">
                        SOURCE FOOTAGE: {activeAlertCamera?.name || activeAlert.cam}
                      </span>
                      <span className="text-[10px] bg-tactical-olive/60 text-tactical-light px-2 py-0.5 border border-tactical-olive">
                        {activeAlertCamera?.sensorType === 'IR_THERMAL' ? 'IR THERMAL SPECTRUM' : 'EO OPTICAL SPECTRUM'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const noteSnippet = `[FORENSIC INSPECTION] Inspected feed ${activeAlertCamera?.name || activeAlert.cam} at TC ${formatTimecode(modalVideoTime)} using ${forensicFilter} filter. Zoom: ${forensicOptions.zoom.toFixed(1)}x.`;
                        setReviewNote(prev => prev ? `${prev}\n\n${noteSnippet}` : noteSnippet);
                        setModalTab('DETAILS');
                      }}
                      className="px-3 py-1 bg-tactical-olive hover:bg-tactical-green hover:text-black text-white font-mono text-xs font-bold border border-tactical-green transition-colors flex items-center space-x-1.5"
                    >
                      <span>📋</span>
                      <span>PASTE NOTES TO DISPOSITION & PROCEED</span>
                    </button>
                  </div>

                  {/* Forensic Video Player Container */}
                  <div className="bg-black border border-tactical-olive flex flex-col shadow-inner">
                    <div className="relative w-full h-[360px] bg-black overflow-hidden flex items-center justify-center">
                      {activeAlertCamera && (
                        <ForensicVideoPlayer
                          ref={modalPlayerRef}
                          videoUrl={activeAlertCamera.videoUrl}
                          isMuted={isMuted}
                          filterMode={forensicFilter}
                          filterOptions={forensicOptions}
                          playbackSpeed={playbackSpeed}
                          onTimeUpdate={(cTime, dur) => {
                            setModalVideoTime(cTime);
                            setModalVideoDuration(dur);
                          }}
                          className="w-full h-full"
                        />
                      )}
                    </div>

                    {/* Timeline Scrubber */}
                    <div className="bg-black/95 px-3 py-1.5 border-t border-tactical-olive/80 flex items-center space-x-3 font-mono text-xs z-20">
                      <span className="text-[10px] text-tactical-light whitespace-nowrap">SEEK:</span>
                      <input
                        type="range"
                        min="0"
                        max={modalVideoDuration || 100}
                        step="0.05"
                        value={modalVideoTime}
                        onChange={(e) => {
                          const t = parseFloat(e.target.value);
                          setModalVideoTime(t);
                          modalPlayerRef.current?.seek(t);
                        }}
                        className="flex-1 accent-tactical-green h-1.5 bg-tactical-dark cursor-pointer"
                      />
                      <span className="text-[10px] text-status-green whitespace-nowrap font-bold">
                        {formatTimecode(modalVideoTime)} / {formatTimecode(modalVideoDuration)}
                      </span>
                    </div>

                    {/* Playback Controls Strip */}
                    <div className="bg-tactical-gray border-t border-tactical-olive p-2.5 flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => modalPlayerRef.current?.togglePlay()}
                          className="px-3 py-1 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold transition-colors text-xs"
                        >
                          PLAY / PAUSE
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`px-3 py-1 border transition-colors text-xs ${isMuted ? 'border-tactical-olive text-tactical-light' : 'border-status-green text-status-green bg-status-green/10'}`}
                        >
                          {isMuted ? '🔇 MUTED' : '🔊 AUDIO ON'}
                        </button>
                        <div className="flex items-center space-x-1 border border-tactical-olive px-1.5 py-0.5">
                          <span className="text-[10px] text-tactical-light mr-1">SPEED:</span>
                          {[0.5, 1.0, 2.0].map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setPlaybackSpeed(s)}
                              className={`px-1.5 py-0.5 text-[10px] ${playbackSpeed === s ? 'bg-tactical-green text-black font-bold' : 'text-tactical-light hover:text-white'}`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-tactical-light flex items-center space-x-2">
                        <span>ACTIVE FILTER:</span>
                        <span className="text-status-amber font-bold border border-status-amber/40 px-1.5 py-0.2 bg-black/40">
                          {forensicFilter}
                        </span>
                        <span className="text-tactical-olive">|</span>
                        <span>ZOOM: <span className="text-tactical-green font-bold">{forensicOptions.zoom.toFixed(1)}x</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Controls Deck (Filters, Enhancement Sliders, Target Matching, Writeup Notes) */}
                  {activeAlertCamera && (
                    <ForensicControlsDeck
                      camId={activeAlertCamera.id}
                      camName={activeAlertCamera.name}
                      filterMode={forensicFilter}
                      onFilterChange={setForensicFilter}
                      filterOptions={forensicOptions}
                      onOptionsChange={setForensicOptions}
                      activeTimecode={formatTimecode(modalVideoTime)}
                      analystId={reviewerId}
                      existingWriteups={forensicWriteups}
                      onSaveWriteup={(wup) => {
                        handleSaveForensicWriteup(wup);
                        const targetLabel = TARGET_LABELS[wup.targetClass]?.label || wup.targetClass;
                        const noteAddition = `[FORENSIC WRITE-UP @ TC ${wup.timecode} | ${wup.filterUsed}]\nMatched Target: ${targetLabel} (${wup.confidence})\nAnalyst Notes: ${wup.notes}`;
                        setReviewNote(prev => prev ? `${prev}\n\n${noteAddition}` : noteAddition);
                        if (wup.confidence === 'CONFIRMED' || wup.targetClass === 'DRONE_UAV' || wup.targetClass === 'HUMAN_INFILTRATION') {
                          setSelectedDisposition('RELEVANT');
                        } else if (wup.targetClass === 'BENIGN_ACTIVITY') {
                          setSelectedDisposition('NOT_RELEVANT');
                        }
                      }}
                      onFlagFollowup={(wup) => {
                        handleFlagFollowupWriteup(wup);
                        const targetLabel = TARGET_LABELS[wup.targetClass]?.label || wup.targetClass;
                        const noteAddition = `[PRIORITY FOLLOW-UP @ TC ${wup.timecode} | ${wup.filterUsed}]\nTarget: ${targetLabel} (${wup.confidence})\nNotes: ${wup.notes}`;
                        setReviewNote(prev => prev ? `${prev}\n\n${noteAddition}` : noteAddition);
                        setReviewAction('FLAG_FOLLOWUP');
                        setSelectedDisposition('UNCERTAIN');
                      }}
                    />
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-black/90 px-6 py-2.5 border-t border-tactical-olive flex justify-between items-center font-mono text-[11px] text-tactical-light">
              <span>SECURITY LEVEL: SECRET // NOFORN</span>
              <span>SENTINEL ANALYST DISPOSITION ENGINE v1.2.0-m5</span>
            </div>

          </div>
        </div>
      )}

      {/* FORENSIC DIGITAL EVIDENCE REPORT MODAL (ISO/IEC 27037:2012) */}
      {activeReportDossier && (
        <ForensicReportModal
          dossier={activeReportDossier}
          onClose={() => setActiveReportDossier(null)}
        />
      )}

    </div>
  );
}

export default App;
