import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { 
  ForensicFilterMode, 
  ForensicFilterOptions, 
  ForensicWriteup,
  SurveillanceMissionPreset,
  TargetClassification
} from './utils/forensicFilters';
import { TARGET_LABELS } from './utils/forensicFilters';
import { ForensicVideoPlayer, type ForensicVideoPlayerRef } from './components/ForensicVideoPlayer';
import { ForensicControlsDeck } from './components/ForensicControlsDeck';
import { SurveillanceFilterCommandBar } from './components/SurveillanceFilterCommandBar';
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

export interface SectorSecurityGuard {
  camId: string;
  name: string;
  rank: string;
  callSign: string;
  sector: string;
  walkieTalkie: string;
  walkieChannel: string;
  satellitePhone: string;
  status: 'ON POST' | 'ON PATROL' | 'INTERCEPT READY' | 'SECTOR SECURED';
  distanceToCam: string;
}

export const SECTOR_GUARDS: Record<string, SectorSecurityGuard> = {
  '1': {
    camId: '1',
    name: 'Havildar Rajesh Kumar',
    rank: 'Havildar',
    callSign: 'ALPHA-SENTRY-1',
    sector: 'Sector 1 (Gate West)',
    walkieTalkie: 'CH-01 VHF (156.800 MHz)',
    walkieChannel: 'CH-01 VHF',
    satellitePhone: '+8816-4392-1011',
    status: 'ON POST',
    distanceToCam: '25m'
  },
  '2': {
    camId: '2',
    name: 'Officer Viktor Ramos',
    rank: 'Officer',
    callSign: 'BRAVO-ROVER-2',
    sector: 'Sector 2 (Perimeter North)',
    walkieTalkie: 'CH-02 UHF (446.025 MHz)',
    walkieChannel: 'CH-02 UHF',
    satellitePhone: '+8816-4392-2042',
    status: 'ON PATROL',
    distanceToCam: '90m'
  },
  '3': {
    camId: '3',
    name: 'Sgt. David Chen',
    rank: 'Sgt.',
    callSign: 'SIERRA-LOOKOUT-3',
    sector: 'Sector 3 (Ridge Overlook)',
    walkieTalkie: 'CH-03 Tactical (462.562 MHz)',
    walkieChannel: 'CH-03 TAC',
    satellitePhone: '+8816-4392-3390',
    status: 'ON POST',
    distanceToCam: '40m'
  },
  '4': {
    camId: '4',
    name: 'Cpl. Marcus Vance',
    rank: 'Cpl.',
    callSign: 'TANGO-FOREST-4',
    sector: 'Sector 4 (Tree Line South)',
    walkieTalkie: 'CH-04 Tactical UHF (446.050 MHz)',
    walkieChannel: 'CH-04 UHF',
    satellitePhone: '+8816-4392-4419',
    status: 'ON PATROL',
    distanceToCam: '120m'
  },
  '5': {
    camId: '5',
    name: 'Capt. Elena Rostova',
    rank: 'Capt. (Air Defense QRF)',
    callSign: 'AIR-DEFENSE-5',
    sector: 'Sector 5 (Echo Airspace)',
    walkieTalkie: 'CH-05 AirGuard (121.500 MHz)',
    walkieChannel: 'CH-05 AIR',
    satellitePhone: '+8816-4392-5501',
    status: 'INTERCEPT READY',
    distanceToCam: '350m'
  },
  '6': {
    camId: '6',
    name: 'Officer Tariq Al-Mansoor',
    rank: 'Officer',
    callSign: 'DELTA-POST-6',
    sector: 'Sector 6 (South Gate)',
    walkieTalkie: 'CH-06 VHF (156.850 MHz)',
    walkieChannel: 'CH-06 VHF',
    satellitePhone: '+8816-4392-6623',
    status: 'ON POST',
    distanceToCam: '30m'
  },
  '7': {
    camId: '7',
    name: 'Inspector Arjun Mehra',
    rank: 'Inspector (Border Patrol)',
    callSign: 'ECHO-PATROL-7',
    sector: 'Sector 7 (Demarcation Line)',
    walkieTalkie: 'CH-07 Border TAC (446.100 MHz)',
    walkieChannel: 'CH-07 TAC',
    satellitePhone: '+8816-4392-7788',
    status: 'SECTOR SECURED',
    distanceToCam: '80m'
  },
  '8': {
    camId: '8',
    name: 'Lt. Sarah Connor',
    rank: 'Lt. (Base Infrastructure)',
    callSign: 'ZULU-INFRA-8',
    sector: 'Sector 8 (Construction Complex)',
    walkieTalkie: 'CH-08 SATCOM (467.587 MHz)',
    walkieChannel: 'CH-08 SAT',
    satellitePhone: '+8816-4392-8844',
    status: 'ON POST',
    distanceToCam: '65m'
  }
};

export const CAM_THREAT_CONFIDENCE: Record<string, { label: string; confidence: number; icon: string }> = {
  '2': { label: 'DRONE TRAJECTORY', confidence: 0.83, icon: '[UAV]' },
  '4': { label: 'ROTARY AIRCRAFT (HELICOPTER)', confidence: 0.94, icon: '[HELI]' },
  '5': { label: 'HIGH-SPEED IR TARGET', confidence: 0.96, icon: '[FAST-IR]' },
  '6': { label: 'RECON DRONE INGRESS', confidence: 0.89, icon: '[UAV]' },
  '8': { label: 'INFRASTRUCTURE BREACH', confidence: 0.99, icon: '[INFRA]' }
};

export const isCamFlagged = (camId: string) => Boolean(CAM_THREAT_CONFIDENCE[camId]);

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
    name: 'CAM-7 (Border Security // Demarcation Line)',
    sensorType: 'EO_OPTICAL',
    status: 'LIVE_STREAM',
    videoUrl: '/videos/cam7.mp4',
    resolution: '1920x1080',
    fps: 30,
    isPlaying: true
  },
  {
    id: '8',
    name: 'CAM-8 (Infrastructure & Geometric Masking)',
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
    id: 'alt-004-heli',
    cam: 'CAM-4',
    cameraId: '4',
    module: 'M2 Aerial Threat (Rotary Wing / Helicopter)',
    threatLevel: 4,
    description: 'CRITICAL FLAGGED: Low-altitude rotary-wing aircraft (Helicopter) detected traversing Tree Line South airspace at ~120m AGL (Heading: 084° E, Velocity: ~160 km/h, Conf 0.94)',
    time: '15:20:12',
    timestamp: '2026-10-25T15:20:12',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.3.0-m2'
  },
  {
    id: 'alt-005',
    cam: 'CAM-5',
    cameraId: '5',
    module: 'M2 Aerial Threat (High-Speed Thermal)',
    threatLevel: 4,
    description: 'CRITICAL FLAGGED: High-speed aerial target with intense infrared thermal signature descending through Sector Echo (Velocity: ~140 m/s, Bearing 215° SW, Elevated FLIR Emission >650°C, Exhaust Plume Active)',
    time: '15:18:04',
    timestamp: '2026-10-25T15:18:04',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.3.0-m5'
  },
  {
    id: 'alt-006-drone',
    cam: 'CAM-6',
    cameraId: '6',
    module: 'M2 Aerial Threat (Drone / Multirotor UAV)',
    threatLevel: 4,
    description: 'CRITICAL FLAGGED: Unauthorized low-altitude reconnaissance drone approaching South Gate perimeter (Altitude: ~35m AGL, RF Link: 5.8 GHz, Conf 0.89)',
    time: '15:21:40',
    timestamp: '2026-10-25T15:21:40',
    reviewStatus: 'NEW',
    disposition: 'NONE',
    engineVersion: 'ai-engine-1.3.0-m2'
  },
  {
    id: 'alt-007',
    cam: 'CAM-7',
    cameraId: '7',
    module: 'M5 Deep Learning (Border Security)',
    threatLevel: 1,
    description: 'SECTOR SECURED: Demarcation line perimeter verified clear. Zero human, vehicle, or aerial infiltration detected across demarcation line. Sector boundary intact and peaceful.',
    time: '15:10:22',
    timestamp: '2026-10-25T15:10:22',
    reviewStatus: 'REVIEWED',
    disposition: 'NOT_RELEVANT',
    engineVersion: 'ai-engine-1.3.0'
  },
  {
    id: 'alt-008',
    cam: 'CAM-8',
    cameraId: '8',
    module: 'M4 Camouflage (Infrastructure Geometric Masking)',
    threatLevel: 3,
    description: 'INFRASTRUCTURE DETECTION: Clandestine structural expansion detected via rigid geometric masking. 4x polygonal infrastructure footprints (380m² combined foundation area) segmented with 99.2% planarity index.',
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
  const [activeMissionPreset, setActiveMissionPreset] = useState<SurveillanceMissionPreset | null>('BORDER_SURVEILLANCE');
  const [forensicOptions, setForensicOptions] = useState<ForensicFilterOptions>({
    contrast: 1.4,
    threshold: 128,
    edgeSensitivity: 1.5,
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
  const [modalCameraOverrideId, setModalCameraOverrideId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review Form state
  const [reviewerId, setReviewerId] = useState<string>('DELTA-9');
  const [reviewAction, setReviewAction] = useState<ReviewAction>('RECORD_DISPOSITION');
  const [selectedDisposition, setSelectedDisposition] = useState<Disposition>('RELEVANT');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showDetectionOverlays, setShowDetectionOverlays] = useState<boolean>(true);

  // Emergency Guard Direct Dispatch State
  const [activeDispatchAlert, setActiveDispatchAlert] = useState<{
    guard: SectorSecurityGuard;
    threatLabel: string;
    confidence: number;
    channelType: 'SAT_PHONE' | 'WALKIE' | 'SECTOR_SIREN';
    timestamp: string;
  } | null>(null);

  const handleDispatchGuard = (camId: string, channelType: 'SAT_PHONE' | 'WALKIE' | 'SECTOR_SIREN' = 'SAT_PHONE') => {
    const guard = SECTOR_GUARDS[camId];
    const threat = CAM_THREAT_CONFIDENCE[camId] || { label: 'TACTICAL ANOMALY', confidence: 0.85, icon: '⚠️' };
    if (!guard) return;

    setActiveDispatchAlert({
      guard,
      threatLabel: threat.label,
      confidence: threat.confidence,
      channelType,
      timestamp: new Date().toLocaleTimeString()
    });
  };

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

  const handleGenerateForensicReport = (cam: CameraFeed) => {
    const defaultTarget: TargetClassification = 
      cam.id === '7' ? 'HUMAN_INFILTRATION' :
      cam.id === '8' ? 'STRUCTURAL_BREACH' :
      cam.id === '5' ? 'DRONE_UAV' :
      cam.id === '2' ? 'DRONE_UAV' : 'CAMOUFLAGED_ASSET';

    const latestWup = forensicWriteups.find(w => w.camId === cam.id);

    const dossier = createForensicDossier({
      sensorId: cam.id,
      sensorName: cam.name,
      sensorModality: cam.sensorType,
      targetClass: latestWup?.targetClass || defaultTarget,
      confidence: latestWup?.confidence || 'CONFIRMED',
      filterMode: forensicFilter,
      filterOptions: forensicOptions,
      timecode: formatTimecode(activeVideoTime),
      analystId: reviewerId,
      analystNotes: latestWup?.notes || `Forensic standard evaluation conducted on ${cam.name} at timecode ${formatTimecode(activeVideoTime)}. Sensor filter: ${forensicFilter}. Zoom: ${forensicOptions.zoom.toFixed(1)}x.`,
      disposition: 'RELEVANT'
    });
    setActiveReportDossier(dossier);
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

    // If custom video uploaded on CAM-7 (Multi-Threat Border Security)
    if (camId === '7') {
      setAlerts(prev => prev.map(a => {
        if (a.id === 'alt-007') {
          return {
            ...a,
            reviewStatus: 'UNDER_REVIEW',
            threatLevel: 3,
            description: `Custom border footage uploaded (${file.name}): Multi-Threat Perimeter Analytics active. Sector scan tracking Personnel, Ground Vehicles, and Airborne UAV vectors.`
          };
        }
        return a;
      }));
    } else if (camId === '8') {
      // If custom video uploaded on CAM-8 (Infrastructure Geometric Masking)
      setAlerts(prev => prev.map(a => {
        if (a.id === 'alt-008') {
          return {
            ...a,
            reviewStatus: 'UNDER_REVIEW',
            threatLevel: 3,
            description: `Custom infrastructure footage uploaded (${file.name}): Automated Infrastructure Geometric Masking active. Rigid structural contours and foundation footprints segmented.`
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
    setModalCameraOverrideId(null);
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

  // Quick 2-state inbox actions (no modal needed)
  const handleQuickConfirm = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === alertId
      ? { ...a, reviewStatus: 'REVIEWED' as ReviewStatus, disposition: 'RELEVANT' as Disposition, reviewedBy: reviewerId, reviewedAt: new Date().toISOString() }
      : a
    ));
  };

  const handleQuickDismiss = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    setAlerts(prev => prev.map(a => a.id === alertId
      ? { ...a, reviewStatus: 'REVIEWED' as ReviewStatus, disposition: 'NOT_RELEVANT' as Disposition, reviewedBy: reviewerId, reviewedAt: new Date().toISOString() }
      : a
    ));
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
    if (modalCameraOverrideId) {
      const found = cameraFeeds.find(c => c.id === modalCameraOverrideId);
      if (found) return found;
    }
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
  }, [activeAlert, cameraFeeds, modalCameraOverrideId]);

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-300">
      {/* Top Header - Modern Enterprise Security Console */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h1 className="text-xl font-bold text-white tracking-wider font-mono">SENTINEL</h1>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono">v1.2.0</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('DASHBOARD')}
              className={`px-3.5 py-1.5 border rounded-xs font-mono text-xs transition-colors tracking-wide ${
                view === 'DASHBOARD'
                  ? 'border-slate-600 text-white bg-slate-800 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              TACTICAL FEEDS
            </button>
            <button
              onClick={() => setView('M4_CAMOUFLAGE')}
              className={`px-3.5 py-1.5 border rounded-xs font-mono text-xs transition-colors tracking-wide ${
                view === 'M4_CAMOUFLAGE'
                  ? 'border-slate-600 text-white bg-slate-800 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              M4 CAMOUFLAGE ANALYSIS
            </button>
          </div>
        </div>
        <div className="font-mono text-xs tracking-wide text-slate-400 flex items-center space-x-5">
          <span className="text-emerald-400 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
            FEEDS: {cameraFeeds.filter(c => c.isPlaying).length}/{cameraFeeds.length} ONLINE
          </span>
          <span className="border-l border-slate-800 pl-4">ANALYST</span>
          <span className="text-white font-medium bg-slate-800 px-2 py-0.5 border border-slate-700 rounded-xs">ID: {reviewerId}</span>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {view === 'DASHBOARD' && (
        <main className={`flex-1 flex overflow-hidden p-3 min-h-0 ${selectedCam ? '' : 'space-x-3'}`}>
          {/* Left: 8 Video Streams Grid or Fullscreen Maximized Inspection */}
          <div className={`${selectedCam ? 'flex-1 w-full' : 'flex-[3]'} flex flex-col space-y-2 min-w-0`}>
            {/* Toolbar above feeds */}
            <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-xs">
              <div className="flex items-center space-x-3">
                <h2 className="font-mono text-white tracking-wider text-xs font-semibold flex items-center">
                  SURVEILLANCE CHANNELS (M1)
                </h2>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 border border-slate-700 rounded-xs">
                  {cameraFeeds.length} SENSOR STREAMS
                </span>
              </div>
              
              <div className="flex items-center space-x-2 font-mono text-[10px]">
                <button
                  onClick={() => setShowDetectionOverlays(!showDetectionOverlays)}
                  className={`px-2.5 py-1 border rounded-xs transition-colors font-medium ${
                    showDetectionOverlays
                      ? 'bg-slate-800 border-slate-600 text-slate-100 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle AI detection overlays on feeds"
                >
                  {showDetectionOverlays ? 'OVERLAYS: ON' : 'OVERLAYS: OFF'}
                </button>
                <button
                  onClick={togglePlayAll}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xs transition-colors font-medium"
                >
                  PLAY / PAUSE ALL
                </button>
                <button
                  onClick={handleResetFeeds}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xs transition-colors"
                  title="Reset all channels to default tactical surveillance videos"
                >
                  RESET FEEDS
                </button>
              </div>
            </div>

            {/* Main Video View: Either Maximized Single Feature Inspection or 8-Channel Detection Grid */}
            <div className="panel flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
              {selectedCam ? (
                /* Maximized Single Video Channel Feature Inspection View - Vertical Split (Left: Feed & Controls, Right: Tools) */
                <div className="w-full h-full bg-slate-950 border border-slate-800 flex flex-row relative overflow-hidden">
                  
                  {/* LEFT HALF (Vertical Split): Video Feed + Scrubber + Playback & Action Controls */}
                  <div className="w-1/2 min-w-0 flex flex-col h-full border-r border-slate-800 bg-black overflow-hidden">
                    {/* Top HUD */}
                    <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex flex-wrap gap-2 justify-between items-center z-30 font-mono shadow-sm shrink-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-white font-semibold text-xs tracking-wider">{selectedCam.name}</span>
                          <span className={selectedCam.sensorType === 'IR_THERMAL' ? 'bg-amber-950/60 border border-amber-700/60 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-xs' : 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-xs'}>
                            {selectedCam.sensorType === 'IR_THERMAL' ? 'IR THERMAL' : 'EO OPTICAL'}
                          </span>
                          <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-xs font-medium">
                            INSPECTION ACTIVE
                          </span>
                          {selectedCam.fileName && (
                            <span className="bg-blue-950/60 border border-blue-700/60 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-xs">
                              {selectedCam.fileName} ({selectedCam.fileSize})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          GRID REF: 43R TN 8923 1245 | RES: {selectedCam.resolution} | FPS: {selectedCam.fps} | FILTER: <strong className="text-slate-200">{forensicFilter}</strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Live Camera Feed Quick Switcher */}
                        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 border border-slate-800 rounded-xs">
                          <span className="text-[10px] text-slate-400 px-1 font-semibold">FEEDS:</span>
                          {cameraFeeds.map(feed => (
                            <button
                              key={feed.id}
                              type="button"
                              onClick={() => setSelectedCamId(feed.id)}
                              className={`px-1.5 py-0.5 text-[10px] font-mono rounded-xs transition-all ${
                                feed.id === selectedCam.id
                                  ? 'bg-slate-700 text-white font-bold border border-slate-500 shadow-sm'
                                  : 'bg-transparent text-slate-400 hover:text-white border border-transparent'
                              }`}
                            >
                              {feed.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>

                        {/* Prominent ISO/IEC 27037 Forensic Report Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateForensicReport(selectedCam)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono font-medium text-[11px] border border-emerald-700/60 rounded-xs transition-all flex items-center space-x-1.5 shadow-sm"
                          title="Generate certified ISO/IEC 27037 Digital Forensics Evidence Dossier"
                        >
                          <span>FORENSIC REPORT (ISO/IEC 27037)</span>
                        </button>

                        <span className="text-slate-300 text-[11px] font-mono bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-xs">
                          {tacticalTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCamId(null)}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700/60 font-medium text-[11px] transition-colors rounded-xs"
                        >
                          [ ✖ EXIT ]
                        </button>
                      </div>
                    </div>

                    {/* High-Res Forensic Video Player with Canvas Filters */}
                    <div className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-black overflow-hidden">
                      <ForensicVideoPlayer
                        ref={expandedPlayerRef}
                        camId={selectedCam.id}
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

                    {/* Single Cam Expanded Overlays for CAM-8 (Infrastructure Detection via Geometrical Masking) */}
                    {showDetectionOverlays && selectedCam.id === '8' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Banner - Clean Architectural CAD Style */}
                        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border border-sky-600/70 text-slate-100 p-2 font-mono text-xs flex justify-between items-center rounded-xs shadow-sm pointer-events-none">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                            <span className="font-semibold text-sky-400 tracking-wider">
                              INFRASTRUCTURE GEOMETRIC ANALYSIS &amp; FOOTPRINT MASKING
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-300">
                            <span>4 SITES ANALYZED</span>
                            <span className="text-slate-600">|</span>
                            <span>FOOTPRINT: 525 m²</span>
                            <span className="text-slate-600">|</span>
                            <span className="bg-sky-950/80 border border-sky-700/60 text-sky-300 px-1.5 py-0.5 rounded-xs font-medium">PLANARITY: 99.2%</span>
                          </div>
                        </div>

                        {/* 1. Large Foundation Slab Geometric Mask */}
                        <div className="absolute top-[26%] left-[10%] w-[32%] h-[26%] border border-sky-400/80 bg-sky-950/20">
                          <div className="absolute -top-4 left-0 bg-sky-900/90 text-sky-100 text-[8px] font-medium px-1 whitespace-nowrap rounded-xs">
                            SITE 1: FOUNDATION SLAB [24.5m × 14.0m // 343 m²]
                          </div>
                          <div className="absolute -bottom-3.5 left-0 text-[7px] text-sky-300 font-mono bg-slate-950/90 px-1 border border-slate-800">
                            PLANARITY: 99.6% | ORTHOGONALITY: 89.8°
                          </div>
                        </div>

                        {/* 2. Reinforced Containment / Vault Geometric Mask */}
                        <div className="absolute top-[44%] left-[46%] w-[24%] h-[20%] border border-sky-400/80 bg-sky-950/20">
                          <div className="absolute -top-4 left-0 bg-sky-900/90 text-sky-100 text-[8px] font-medium px-1 whitespace-nowrap rounded-xs">
                            SITE 2: VAULT FOOTPRINT [16.2m × 8.4m // 136 m²]
                          </div>
                          <div className="absolute -bottom-3.5 left-0 text-[7px] text-sky-300 font-mono bg-slate-950/90 px-1 border border-slate-800">
                            PLANARITY: 98.9% | HIGH CONCEALMENT PROBABILITY
                          </div>
                        </div>

                        {/* 3. Utility Core Shaft Square Mask */}
                        <div className="absolute top-[30%] left-[68%] w-[12%] h-[15%] border border-sky-400/80 bg-sky-950/20">
                          <span className="absolute -top-4 left-0 bg-sky-900/90 text-sky-100 text-[8px] font-medium px-1 whitespace-nowrap rounded-xs">
                            SITE 3: CORE [6.8m × 6.8m // 46 m²]
                          </span>
                        </div>

                        {/* 4. Infrastructure Utility Conduit Corridor */}
                        <div className="absolute top-[52%] left-[18%] w-[50%] h-0 border-t border-dashed border-sky-400/70 rotate-[-12deg]">
                          <span className="absolute -top-3.5 left-8 bg-slate-950/90 text-sky-300 px-1 text-[8px] font-mono border border-slate-800 whitespace-nowrap">
                            CORRIDOR: 38.0m @ 342° [CONDUIT TRENCH RUN]
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-7 (Border Security // Sector Secured) */}
                    {showDetectionOverlays && selectedCam.id === '7' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Status Banner - All Clear / Border Secured in Clean Slate-Emerald */}
                        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border border-emerald-600/70 text-white px-3 py-1.5 font-mono text-xs flex justify-between items-center rounded-xs shadow-sm">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-semibold text-emerald-400 tracking-wider">
                              CAM-7 // BORDER DEMARCATION — SECTOR SECURED &amp; VERIFIED
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-300">
                            <span className="border border-emerald-700/60 bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-xs font-medium">
                              ZERO INFILTRATION DETECTED
                            </span>
                            <span className="border border-emerald-700/60 bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-xs font-medium">
                              DEMARCATION LINE CLEAR
                            </span>
                          </div>
                        </div>

                        {/* Corner scope brackets in subtle emerald */}
                        <div className="absolute top-[13%] left-[2%] w-6 h-6 border-t border-l border-emerald-500/40"></div>
                        <div className="absolute top-[13%] right-[2%] w-6 h-6 border-t border-r border-emerald-500/40"></div>
                        <div className="absolute bottom-[10%] left-[2%] w-6 h-6 border-b border-l border-emerald-500/40"></div>
                        <div className="absolute bottom-[10%] right-[2%] w-6 h-6 border-b border-r border-emerald-500/40"></div>

                        {/* Center scan crosshair in subtle emerald */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-40">
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500"></div>
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500"></div>
                        </div>

                        {/* Bottom telemetry bar */}
                        <div className="absolute bottom-12 left-4 right-4 bg-slate-950/90 border border-slate-800 px-3 py-1 font-mono text-[10px] text-slate-300 flex justify-between rounded-xs">
                          <span className="flex items-center space-x-1.5">
                            <span className="text-slate-400 font-medium">SECTOR:</span>
                            <span>ECHO-7 DEMARCATION LINE &amp; WATCHTOWER</span>
                          </span>
                          <span className="text-emerald-400 font-medium">ALL CLEAR // REGULAR PATROL ACTIVE</span>
                          <span className="text-slate-400">STATUS: ZERO ANOMALIES</span>
                        </div>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-5 (High-Speed Thermal Target) */}
                    {showDetectionOverlays && selectedCam.id === '5' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Alert Banner */}
                        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border border-red-500/80 text-white p-2 font-mono text-xs flex justify-between items-center rounded-xs shadow-sm">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="font-semibold text-red-400 tracking-wider">
                              TARGET DETECTED: HIGH-SPEED INFRARED TARGET
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-300">
                            <span className="text-red-300 font-medium">VELOCITY: ~140 m/s</span>
                            <span className="text-slate-600">|</span>
                            <span>BEARING: 215° SW</span>
                            <span className="text-slate-600">|</span>
                            <span className="bg-red-950/80 border border-red-800 text-red-200 px-1.5 py-0.5 rounded-xs font-medium">FLIR &gt;650°C</span>
                          </div>
                        </div>

                        {/* High-Speed Target Lock Reticle */}
                        <div className="absolute top-[50%] left-[34%] w-[18%] h-[20%] border border-red-500 bg-red-950/25">
                          <div className="absolute -top-4 left-0 bg-red-900/90 text-red-100 px-1.5 py-0.2 font-mono font-medium text-[8px] whitespace-nowrap rounded-xs">
                            TARGET: FAST-01 [CONF 96%]
                          </div>
                          <div className="absolute -bottom-4 left-0 right-0 bg-slate-950/90 border border-slate-800 text-slate-300 px-1 py-0.2 text-[7px] font-mono text-center whitespace-nowrap">
                            THERMAL PLUME SIGNATURE VERIFIED
                          </div>
                        </div>

                        {/* Exhaust Trail Line Vector */}
                        <div className="absolute top-[38%] left-[44%] w-[24%] h-0 border-t border-dashed border-red-400/60 rotate-[-42deg]"></div>

                        {/* Telemetry Badge */}
                        <div className="absolute bottom-16 right-6 bg-slate-900/95 border border-red-600/70 p-2.5 font-mono text-xs text-slate-300 space-y-1 rounded-xs shadow-sm">
                          <div className="text-red-400 font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                            AIR DEFENSE INTERCEPT QUEUED
                          </div>
                          <div className="text-[10px] text-slate-400">Descent trajectory: 32° dive angle // Sector Echo</div>
                          <div className="text-[10px] text-slate-300">Class: High-Speed Ingress Vector</div>
                        </div>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-4 (Helicopter Detection) */}
                    {showDetectionOverlays && selectedCam.id === '4' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Alert Banner */}
                        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border border-red-500/80 text-white p-2 font-mono text-xs flex justify-between items-center rounded-xs shadow-sm">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="font-semibold text-red-400 tracking-wider">
                              TARGET DETECTED: ROTARY-WING AIRCRAFT (HELICOPTER)
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-300">
                            <span>AIRFRAME: HELICOPTER</span>
                            <span className="text-slate-600">|</span>
                            <span>ALTITUDE: ~120m AGL</span>
                            <span className="text-slate-600">|</span>
                            <span className="bg-red-950/80 border border-red-800 text-red-200 px-1.5 py-0.5 rounded-xs font-medium">CONF: 0.94</span>
                          </div>
                        </div>

                        {/* Helicopter Lock Reticle */}
                        <div className="absolute top-[20%] left-[58%] w-[34%] h-[28%] border border-red-500 bg-red-950/25">
                          <div className="absolute -top-4 left-0 bg-red-900/90 text-red-100 px-1.5 py-0.2 font-mono font-medium text-[8px] whitespace-nowrap rounded-xs">
                            TARGET: HELI-04 [CONF 94%]
                          </div>
                          <div className="absolute -bottom-4 left-0 right-0 bg-slate-950/90 border border-slate-800 text-slate-300 px-1 py-0.2 text-[7px] font-mono text-center whitespace-nowrap">
                            HEADING: 084° E | VEL: ~160 km/h | ROTOR: ~380 RPM
                          </div>
                        </div>

                        {/* Telemetry Badge */}
                        <div className="absolute bottom-16 right-6 bg-slate-900/95 border border-red-600/70 p-2.5 font-mono text-xs text-slate-300 space-y-1 rounded-xs shadow-sm">
                          <div className="text-red-400 font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                            ROTARY WING AIRSPACE TRACK
                          </div>
                          <div className="text-[10px] text-slate-400">Tree Line South Low-Alt Corridor (Bearing: 084° E)</div>
                          <div className="text-[10px] text-slate-300">Officer On-Duty: Cpl. Marcus Vance (CH-04 / SAT-4419)</div>
                        </div>
                      </div>
                    )}

                    {/* Single Cam Expanded Overlays for CAM-6 (Drone Detection) */}
                    {showDetectionOverlays && selectedCam.id === '6' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Top Alert Banner */}
                        <div className="absolute top-4 left-4 right-4 bg-slate-900/95 border border-red-500/80 text-white p-2 font-mono text-xs flex justify-between items-center rounded-xs shadow-sm">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="font-semibold text-red-400 tracking-wider">
                              TARGET DETECTED: UNAUTHORIZED UAV / RECON DRONE
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-300">
                            <span>RF LINK: 5.8 GHz</span>
                            <span className="text-slate-600">|</span>
                            <span>ALTITUDE: ~35m AGL</span>
                            <span className="text-slate-600">|</span>
                            <span className="bg-red-950/80 border border-red-800 text-red-200 px-1.5 py-0.5 rounded-xs font-medium">CONF: 0.89</span>
                          </div>
                        </div>

                        {/* Drone Lock Reticle */}
                        <div className="absolute top-[32%] left-[42%] w-[20%] h-[20%] border border-red-500 bg-red-950/25">
                          <div className="absolute -top-4 left-0 bg-red-900/90 text-red-100 px-1.5 py-0.2 font-mono font-medium text-[8px] whitespace-nowrap rounded-xs">
                            TARGET: UAV-06 [CONF 89%]
                          </div>
                          <div className="absolute -bottom-4 left-0 right-0 bg-slate-950/90 border border-slate-800 text-slate-300 px-1 py-0.2 text-[7px] font-mono text-center whitespace-nowrap">
                            HEADING: NORTHBOUND | VEL: ~45 km/h | 4-ROTOR
                          </div>
                        </div>

                        {/* Telemetry Badge */}
                        <div className="absolute bottom-16 right-6 bg-slate-900/95 border border-red-600/70 p-2.5 font-mono text-xs text-slate-300 space-y-1 rounded-xs shadow-sm">
                          <div className="text-red-400 font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                            AIRSPACE INGRESS // SOUTH GATE POST
                          </div>
                          <div className="text-[10px] text-slate-400">Approaching perimeter wall at 12 m/s</div>
                          <div className="text-[10px] text-slate-300">Officer On-Duty: Officer Tariq Al-Mansoor (CH-06 / SAT-6623)</div>
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
                  <div className="bg-slate-900 px-3 py-1.5 border-t border-slate-800 flex items-center space-x-3 font-mono text-xs z-20 shrink-0">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">SEEK:</span>
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
                      className="flex-1 accent-slate-400 h-1.5 bg-slate-800 cursor-pointer rounded-xs"
                    />
                    <span className="text-[10px] text-slate-200 whitespace-nowrap font-medium">
                      {formatTimecode(activeVideoTime)} / {formatTimecode(activeVideoDuration)}
                    </span>
                  </div>

                  {/* Playback & Action Controls Bar */}
                  <div className="bg-slate-900 border-t border-slate-800 p-2 flex flex-wrap items-center justify-between gap-2 z-20 font-mono text-xs shrink-0">
                    <div className="flex items-center space-x-2">
                      {/* Play/Pause */}
                      <button
                        onClick={() => expandedPlayerRef.current?.togglePlay()}
                        className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 font-medium text-[11px] rounded-xs transition-colors"
                      >
                        PLAY / PAUSE
                      </button>

                      {/* Mute/Unmute */}
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`px-2 py-1 border rounded-xs text-[11px] transition-colors ${isMuted ? 'border-slate-800 text-slate-500 bg-slate-950' : 'border-slate-700 text-slate-200 bg-slate-800'}`}
                      >
                        {isMuted ? '🔇 MUTED' : '🔊 AUDIO'}
                      </button>

                      {/* Playback speed */}
                      <div className="flex items-center space-x-1 border border-slate-800 px-1 py-0.5 rounded-xs bg-slate-950">
                        {[0.5, 1.0, 2.0].map(s => (
                          <button
                            key={s}
                            onClick={() => setPlaybackSpeed(s)}
                            className={`px-1 py-0.5 text-[10px] rounded-xs ${playbackSpeed === s ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      {/* Dedicated Forensic Dossier Generator Button */}
                      <button
                        type="button"
                        onClick={() => handleGenerateForensicReport(selectedCam)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium text-[11px] border border-emerald-800/70 rounded-xs transition-colors flex items-center space-x-1 shadow-sm"
                        title="Generate ISO/IEC 27037 Digital Forensics Evidence Dossier"
                      >
                        <span>FORENSIC REPORT DOSSIER</span>
                      </button>

                      {/* Run AI Analysis on current video frame */}
                      <button
                        onClick={analyzeActiveVideoFrame}
                        disabled={isAnalyzingFrame}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-[11px] border border-amber-800/70 rounded-xs transition-colors flex items-center space-x-1 shadow-sm"
                      >
                        <span>{isAnalyzingFrame ? 'ANALYZING...' : 'RUN AI INFERENCE ON FRAME'}</span>
                      </button>

                      {/* Upload Replacement Video */}
                      <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] border border-slate-700 rounded-xs transition-colors cursor-pointer flex items-center space-x-1">
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
                        <span>REPLACE VIDEO FEED</span>
                      </label>
                    </div>
                  </div>

                  {/* Dedicated Security Officer & Satellite Comms Console (Single Cam Mode) */}
                  {SECTOR_GUARDS[selectedCam.id] && (
                    <div className="bg-slate-900 border-t border-slate-800 p-2.5 font-mono text-xs z-20 shrink-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-xs bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] border border-slate-700">
                            G
                          </span>
                          <div>
                            <span className="text-white font-semibold">{SECTOR_GUARDS[selectedCam.id].name}</span>
                            <span className="text-[10px] text-slate-400 ml-2 bg-slate-800 px-1.5 py-0.5 border border-slate-700 rounded-xs">
                              {SECTOR_GUARDS[selectedCam.id].callSign}
                            </span>
                            <span className="text-[10px] text-emerald-400 ml-2 font-medium">
                              ● {SECTOR_GUARDS[selectedCam.id].status} ({SECTOR_GUARDS[selectedCam.id].distanceToCam})
                            </span>
                          </div>
                        </div>

                        {selectedCam.id === '7' ? (
                          <div className="bg-emerald-950/70 border border-emerald-600/70 text-emerald-300 text-[10px] font-medium px-2 py-0.5 flex items-center space-x-1.5 rounded-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>SECTOR SECURED // ALL CLEAR</span>
                          </div>
                        ) : CAM_THREAT_CONFIDENCE[selectedCam.id] && CAM_THREAT_CONFIDENCE[selectedCam.id].confidence >= 0.8 ? (
                          <div className="bg-red-950/70 border border-red-600/70 text-red-300 text-[10px] font-medium px-2 py-0.5 flex items-center space-x-1.5 rounded-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span>{CAM_THREAT_CONFIDENCE[selectedCam.id].label} ({(CAM_THREAT_CONFIDENCE[selectedCam.id].confidence * 100).toFixed(0)}%)</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Comms & Direct Dispatch Trigger Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2 border border-slate-800 rounded-xs">
                        <div className="flex flex-wrap items-center gap-3 text-[10px]">
                          <div className="text-slate-400">
                            RADIO: <strong className="text-slate-200">{SECTOR_GUARDS[selectedCam.id].walkieChannel}</strong>
                          </div>
                          <span className="text-slate-700">|</span>
                          <div className="text-slate-400">
                            SATCOM: <strong className="text-slate-200">{SECTOR_GUARDS[selectedCam.id].satellitePhone}</strong>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleDispatchGuard(selectedCam.id, 'WALKIE')}
                            className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white font-medium text-[10px] transition-colors rounded-xs"
                            title={`Broadcast on walkie-talkie ${SECTOR_GUARDS[selectedCam.id].walkieTalkie}`}
                          >
                            RADIO DISPATCH
                          </button>
                          <button
                            onClick={() => handleDispatchGuard(selectedCam.id, 'SAT_PHONE')}
                            className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white font-medium text-[10px] transition-colors rounded-xs"
                            title={`Call satellite phone ${SECTOR_GUARDS[selectedCam.id].satellitePhone}`}
                          >
                            CALL SAT-PHONE
                          </button>
                          <button
                            onClick={() => handleDispatchGuard(selectedCam.id, 'SECTOR_SIREN')}
                            className="px-2.5 py-1 bg-red-950/80 border border-red-700 text-red-200 hover:bg-red-800 hover:text-white font-medium text-[10px] transition-colors rounded-xs"
                            title="Sound sector alarm & order intercept"
                          >
                            ORDER INTERCEPT
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT HALF (Vertical Split): All Surveillance Tools & Forensic Deck */}
                <div className="w-1/2 min-w-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 overflow-hidden">
                    {/* Tactical Surveillance Filters Command Bar */}
                    <div className="shrink-0 border-b border-slate-800 bg-slate-950/80">
                      <SurveillanceFilterCommandBar
                        activeFilter={forensicFilter}
                        onFilterChange={setForensicFilter}
                        filterOptions={forensicOptions}
                        onOptionsChange={setForensicOptions}
                        selectedScope={selectedCam.id}
                        onScopeChange={(scope) => {
                          if (scope !== 'ALL') setSelectedCamId(scope);
                        }}
                        availableCameras={cameraFeeds.map(c => ({ id: c.id, name: c.name }))}
                        onOpenForensicLab={(camId) => setSelectedCamId(camId)}
                        activeMissionPreset={activeMissionPreset}
                        onMissionPresetChange={setActiveMissionPreset}
                      />
                    </div>

                    {/* Forensic Image Processing, Write-up Deck & Forensic Report Generator */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <ForensicControlsDeck
                        camId={selectedCam.id}
                        camName={selectedCam.name}
                        filterMode={forensicFilter}
                        onFilterChange={setForensicFilter}
                        filterOptions={forensicOptions}
                        onOptionsChange={setForensicOptions}
                        activeTimecode={formatTimecode(activeVideoTime)}
                        analystId={reviewerId}
                        onSelectCamera={(id) => setSelectedCamId(id)}
                        onSaveWriteup={handleSaveForensicWriteup}
                        onFlagFollowup={handleFlagFollowupWriteup}
                        existingWriteups={forensicWriteups}
                        onGenerateReport={() => handleGenerateForensicReport(selectedCam)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* 4x2 Video Channels Grid (8 Feeds) — Clean Enterprise Security Console */
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-full w-full">
                  {cameraFeeds.map((cam) => (
                    <div
                      key={cam.id}
                      className={`bg-slate-950 border relative group overflow-hidden flex flex-col transition-all rounded-xs shadow-sm ${
                        isCamFlagged(cam.id)
                          ? 'border-red-600/80 ring-1 ring-red-500/30'
                          : cam.id === '7'
                          ? 'border-emerald-600/60 ring-1 ring-emerald-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Live Video Stream */}
                      <video
                        key={cam.videoUrl}
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
                      <div className="absolute top-0 inset-x-0 p-1.5 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent flex justify-between items-start pointer-events-none z-10 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isCamFlagged(cam.id) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          <span className="text-slate-100 bg-slate-900/90 px-1.5 py-0.2 border border-slate-700/80 text-[10px] font-semibold truncate max-w-[130px] rounded-xs">
                            {cam.name}
                          </span>
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[8px] px-1 font-mono rounded-xs">
                            {cam.sensorType === 'IR_THERMAL' ? 'IR' : 'EO'}
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-400 bg-slate-900/90 px-1 border border-slate-800 font-mono rounded-xs">
                          {cam.sensorType === 'IR_THERMAL' ? 'THERMAL' : 'OPTICAL'}
                        </div>
                      </div>

                      {/* Tactical Detection Banner for CAM-4 (Helicopter) */}
                      {showDetectionOverlays && cam.id === '4' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-slate-950/90 border border-red-500/70 text-slate-100 px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between rounded-xs">
                          <span className="font-semibold text-red-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                            TARGET: ROTARY AIRCRAFT
                          </span>
                          <span className="bg-red-950/80 text-red-300 px-1 border border-red-700/60 text-[7px] font-medium">
                            CONF 94%
                          </span>
                        </div>
                      )}

                      {/* Tactical Reticle over Helicopter on CAM-4 in Grid */}
                      {showDetectionOverlays && cam.id === '4' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-[20%] left-[58%] w-[32%] h-[26%] border border-red-500 bg-red-950/20">
                            <span className="absolute -top-3 left-0 bg-red-900/90 text-red-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              AIRCRAFT: HELI (0.94)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-6 (Drone) */}
                      {showDetectionOverlays && cam.id === '6' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-slate-950/90 border border-red-500/70 text-slate-100 px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between rounded-xs">
                          <span className="font-semibold text-red-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                            TARGET: RECON UAV
                          </span>
                          <span className="bg-red-950/80 text-red-300 px-1 border border-red-700/60 text-[7px] font-medium">
                            CONF 89%
                          </span>
                        </div>
                      )}

                      {/* Tactical Reticle over Drone on CAM-6 in Grid */}
                      {showDetectionOverlays && cam.id === '6' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-[32%] left-[42%] w-[18%] h-[18%] border border-red-500 bg-red-950/20">
                            <span className="absolute -top-3 left-0 bg-red-900/90 text-red-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              UAV-06 (0.89)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-7 (Border Secured // Zero Threats) */}
                      {showDetectionOverlays && cam.id === '7' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-slate-950/90 border border-emerald-600/70 text-slate-200 px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between rounded-xs">
                          <span className="font-semibold text-emerald-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            SECTOR SECURED // PERIMETER CLEAR
                          </span>
                          <span className="bg-emerald-950/80 text-emerald-300 px-1 border border-emerald-800 text-[7px] font-medium">
                            0 THREATS
                          </span>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-5 (High-Speed Thermal Target) */}
                      {cam.id === '5' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-slate-950/90 border border-red-500/70 text-slate-100 px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between rounded-xs">
                          <span className="font-semibold text-red-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                            TARGET: FAST THERMAL INGRESS
                          </span>
                          <span className="bg-red-950/80 text-red-300 px-1 border border-red-700/60 text-[7px] font-medium">
                            VEL: 140 m/s
                          </span>
                        </div>
                      )}

                      {/* Tactical Target Reticle & Plume Overlay on CAM-5 in Grid */}
                      {cam.id === '5' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute top-[52%] left-[34%] w-[16%] h-[18%] border border-red-500 bg-red-950/20">
                            <span className="absolute -top-3 left-0 bg-red-900/90 text-red-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              TARGET: FAST-01 (0.96)
                            </span>
                          </div>
                          <div className="absolute top-[40%] left-[42%] w-[20%] h-0 border-t border-dashed border-red-400/60 rotate-[-42deg]"></div>
                        </div>
                      )}

                      {/* Tactical Detection Banner for CAM-8 (Infrastructure Geometric Masking) */}
                      {showDetectionOverlays && cam.id === '8' && (
                        <div className="absolute top-7 left-1.5 right-1.5 bg-slate-950/90 border border-sky-500/70 text-slate-200 px-1.5 py-0.5 text-[8px] font-mono z-10 pointer-events-none flex items-center justify-between rounded-xs">
                          <span className="font-semibold text-sky-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>
                            INFRASTRUCTURE GEOMETRIC ANALYSIS
                          </span>
                          <span className="bg-sky-950/80 text-sky-300 px-1 border border-sky-800 text-[7px] font-medium">
                            4 SITES (99.2% PLANAR)
                          </span>
                        </div>
                      )}

                      {/* Tactical Geometrical Masks Overlaid on CAM-8 in Grid */}
                      {showDetectionOverlays && cam.id === '8' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                          {/* 1. Large Foundation Slab Geometric Mask */}
                          <div className="absolute top-[26%] left-[10%] w-[32%] h-[26%] border border-sky-400/80 bg-sky-950/20">
                            <span className="absolute -top-2.5 left-0 bg-sky-900/90 text-sky-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              SITE 1: FOUNDATION [343m²]
                            </span>
                          </div>

                          {/* 2. Reinforced Containment / Vault Geometric Mask */}
                          <div className="absolute top-[44%] left-[46%] w-[24%] h-[20%] border border-sky-400/80 bg-sky-950/20">
                            <span className="absolute -top-2.5 left-0 bg-sky-900/90 text-sky-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              SITE 2: VAULT [136m²]
                            </span>
                          </div>

                          {/* 3. Utility Core Shaft Square Mask */}
                          <div className="absolute top-[30%] left-[68%] w-[12%] h-[15%] border border-sky-400/80 bg-sky-950/20">
                            <span className="absolute -top-2.5 left-0 bg-sky-900/90 text-sky-100 text-[6px] font-medium px-1 whitespace-nowrap rounded-xs">
                              SITE 3: CORE [46m²]
                            </span>
                          </div>

                          {/* 4. Infrastructure Utility Conduit Corridor */}
                          <div className="absolute top-[52%] left-[18%] w-[50%] h-0 border-t border-dashed border-sky-400/70 rotate-[-12deg]">
                            <span className="absolute -top-3 left-6 bg-slate-900/90 text-sky-300 px-1 text-[6px] font-mono border border-sky-600/50 whitespace-nowrap">
                              CORRIDOR: 38m [CONDUIT]
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Custom Upload Badge */}
                      {cam.fileName && (
                        <div className="absolute top-8 left-2 bg-slate-900/90 border border-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 font-mono z-10 pointer-events-none rounded-xs">
                          FILE: {cam.fileName}
                        </div>
                      )}

                      {/* Center Crosshair Overlay - Confined to video area */}
                      <div
                        onClick={() => setSelectedCamId(cam.id)}
                        className="absolute inset-x-0 top-8 bottom-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-slate-950/60 z-20"
                      >
                        <div className="text-slate-100 font-mono text-[10px] font-semibold bg-slate-900 px-3 py-1 border border-slate-700 tracking-wider shadow-sm flex items-center space-x-1.5 rounded-xs">
                          <span>INSPECT FEED &amp; FORENSICS</span>
                        </div>
                      </div>

                      {/* Security Guard / Operator Badge & Quick Direct Dispatch */}
                      {SECTOR_GUARDS[cam.id] && (
                        <div className="absolute bottom-8 left-1.5 right-1.5 flex items-center justify-between pointer-events-auto z-20 font-mono">
                          <div className="bg-slate-950/90 border border-slate-800 text-[7px] px-1.5 py-0.5 text-slate-300 flex items-center space-x-1.5 rounded-xs shadow-sm">
                            <span className="text-slate-400 font-medium">GUARD:</span>
                            <span className="text-white font-medium truncate max-w-[70px]">{SECTOR_GUARDS[cam.id].name.split(' ')[0]}</span>
                            <span className="text-slate-700">|</span>
                            <span className="text-slate-300 font-mono">{SECTOR_GUARDS[cam.id].walkieChannel}</span>
                          </div>

                          {cam.id === '7' ? (
                            <div className="bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-[7px] font-medium px-1.5 py-0.5 flex items-center space-x-1 rounded-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>SECURED</span>
                            </div>
                          ) : CAM_THREAT_CONFIDENCE[cam.id] && CAM_THREAT_CONFIDENCE[cam.id].confidence >= 0.8 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatchGuard(cam.id, 'SAT_PHONE');
                              }}
                              className="bg-red-950/90 border border-red-600 text-red-200 hover:bg-red-700 hover:text-white text-[7px] font-bold px-2 py-0.5 flex items-center space-x-1 transition-colors cursor-pointer rounded-xs"
                              title={`Direct Comms: Call ${SECTOR_GUARDS[cam.id].name} on ${SECTOR_GUARDS[cam.id].satellitePhone} / ${SECTOR_GUARDS[cam.id].walkieChannel}`}
                            >
                              <span>DISPATCH</span>
                            </button>
                          ) : null}
                        </div>
                      )}

                      {/* Bottom HUD & Action Controls */}
                      <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent flex items-center justify-between z-30 pointer-events-auto font-mono text-[10px]">
                        {/* Left: Feed Status */}
                        <div className="flex items-center space-x-1 text-slate-400 text-[9px] shrink-0 truncate max-w-[85px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                          <span className="truncate">{cam.status === 'CUSTOM_VIDEO' ? 'CUSTOM' : 'LIVE'}</span>
                        </div>

                        {/* Right: Clean, non-wrapping control buttons */}
                        <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Dedicated Upload Button for this feed */}
                          <label
                            htmlFor={`feed-upload-${cam.id}`}
                            className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-[9px] font-medium cursor-pointer transition-colors flex items-center space-x-0.5 shrink-0 rounded-xs"
                            title="Upload custom video for this camera feed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>UPLOAD</span>
                          </label>
                          <input
                            id={`feed-upload-${cam.id}`}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.files?.[0]) {
                                handleVideoUpload(cam.id, e.target.files[0]);
                              }
                            }}
                          />

                          {/* Play/Pause Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCameraPlay(cam.id, e);
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-black/90 border border-tactical-olive hover:border-tactical-green hover:text-white text-tactical-light text-[9px] transition-colors shrink-0"
                            title={cam.isPlaying ? "Pause feed" : "Play feed"}
                          >
                            {cam.isPlaying ? '⏸' : '▶'}
                          </button>

                          {/* Single Camera Feature Inspection & Filters Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCamId(cam.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-tactical-olive/90 border border-status-green hover:bg-status-green hover:text-black text-status-green text-[10px] transition-colors shrink-0"
                            title="Maximize feed for Feature Inspection & Forensic Filters"
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

          {/* Right: Threat Intelligence Alert Feed (Phase 7 Review Workflow) - Visible ONLY in 8-Feed Overview, Hidden in Single Cam Inspection */}
          {!selectedCam && (
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

                      {/* Quick Actions & Provenance Footer */}
                      <div className="pt-2 border-t border-tactical-olive/50 flex items-center justify-between font-mono text-[10px]">
                        <div>{getDispositionBadge(alert.disposition)}</div>
                        {alert.reviewStatus === 'NEW' || alert.reviewStatus === 'UNDER_REVIEW' ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleQuickConfirm(e, alert.id)}
                              className="px-2 py-0.5 bg-status-red/20 border border-status-red text-status-red hover:bg-status-red hover:text-black font-bold text-[9px] transition-colors"
                              title="Confirm as real threat"
                            >
                              ✓ THREAT
                            </button>
                            <button
                              onClick={(e) => handleQuickDismiss(e, alert.id)}
                              className="px-2 py-0.5 bg-black/60 border border-tactical-olive text-tactical-light hover:text-white hover:border-tactical-green font-bold text-[9px] transition-colors"
                              title="Dismiss / mark as benign"
                            >
                              ✗ DISMISS
                            </button>
                            <button
                              onClick={() => openReviewModal(alert)}
                              className="px-1.5 py-0.5 bg-black/60 border border-tactical-olive text-tactical-light hover:text-status-green text-[9px] transition-colors"
                              title="Full review"
                            >
                              ›
                            </button>
                          </div>
                        ) : (
                          <div className="text-tactical-light/60 group-hover:text-status-green transition-colors flex items-center">
                            <span className="mr-1">[REVIEWED]</span>
                            <span>›</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
                                targetClass: cam.id === '7' ? 'HUMAN_INFILTRATION' : cam.id === '8' ? 'STRUCTURAL_BREACH' : 'DRONE_UAV',
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
                  <div className="bg-black/70 border border-tactical-olive p-3 flex flex-wrap gap-2 justify-between items-center font-mono">
                    <div className="flex items-center space-x-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse"></span>
                      <span className="text-xs font-bold text-white tracking-wider">
                        SOURCE FOOTAGE: {activeAlertCamera?.name || activeAlert.cam}
                      </span>
                      <span className="text-[10px] bg-tactical-olive/60 text-tactical-light px-2 py-0.5 border border-tactical-olive">
                        {activeAlertCamera?.sensorType === 'IR_THERMAL' ? 'IR THERMAL SPECTRUM' : 'EO OPTICAL SPECTRUM'}
                      </span>
                      {modalCameraOverrideId && (
                        <span className="text-[10px] bg-status-amber/20 text-status-amber border border-status-amber px-2 py-0.5 font-bold">
                          FEED OVERRIDE: CAM-{modalCameraOverrideId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Live Camera Feed Quick Switcher */}
                      <div className="flex items-center space-x-1 bg-black/80 p-1 border border-tactical-olive">
                        <span className="text-[9px] text-tactical-light mr-1 font-bold">FEEDS:</span>
                        {cameraFeeds.map(feed => (
                          <button
                            key={feed.id}
                            type="button"
                            onClick={() => setModalCameraOverrideId(feed.id)}
                            className={`px-1.5 py-0.5 text-[9px] font-mono border transition-all ${
                              activeAlertCamera?.id === feed.id
                                ? 'bg-status-amber text-black border-status-amber font-bold shadow-[0_0_8px_rgba(255,183,3,0.3)]'
                                : 'bg-black/60 text-tactical-light border-tactical-olive hover:text-white hover:border-tactical-green'
                            }`}
                          >
                            {feed.name.split(' ')[0]}
                          </button>
                        ))}
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
                        <span>PASTE NOTES & RETURN</span>
                      </button>
                    </div>
                  </div>

                  {/* Forensic Video Player Container */}
                  <div className="bg-black border border-tactical-olive flex flex-col shadow-inner">
                    <div className="relative w-full h-[360px] bg-black overflow-hidden flex items-center justify-center">
                      {activeAlertCamera && (
                        <ForensicVideoPlayer
                          ref={modalPlayerRef}
                          camId={activeAlertCamera.id}
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
                      cameraFeeds={cameraFeeds}
                      onSelectCamera={(id) => setModalCameraOverrideId(id)}
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

      {/* Emergency Guard Direct Dispatch & Satellite Comms Modal */}
      {activeDispatchAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full p-5 shadow-2xl font-mono rounded-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2 text-red-400 font-semibold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>TACTICAL DISPATCH TRANSMISSION ACTIVE</span>
              </div>
              <button
                onClick={() => setActiveDispatchAlert(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 border border-slate-700 hover:border-slate-500 rounded-xs text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 border border-red-900/60 p-3 rounded-xs text-slate-300">
                <div className="font-semibold text-red-400 text-sm flex items-center space-x-2 mb-1">
                  <span>THREAT CONFIDENCE: {(activeDispatchAlert.confidence * 100).toFixed(0)}%</span>
                  <span className="text-[10px] bg-red-950 border border-red-700 text-red-200 px-1.5 py-0.2 rounded-xs font-medium">&gt;80% THRESHOLD</span>
                </div>
                <div className="text-slate-200">
                  Target: <strong className="text-white font-medium">{activeDispatchAlert.threatLabel}</strong> in <strong>{activeDispatchAlert.guard.sector}</strong>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 space-y-2 rounded-xs text-slate-300">
                <div className="text-white font-semibold flex items-center space-x-2 text-sm">
                  <span>OFFICER: {activeDispatchAlert.guard.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Call Sign: <strong className="text-slate-200">{activeDispatchAlert.guard.callSign}</strong> · Location: <strong className="text-slate-200">{activeDispatchAlert.guard.distanceToCam} from camera</strong> · Status: <strong className="text-emerald-400">{activeDispatchAlert.guard.status}</strong>
                </div>
                <div className="border-t border-slate-800/80 pt-2 flex flex-col space-y-1.5 text-[11px]">
                  <div className="text-slate-300 flex items-center justify-between">
                    <span>Radio Frequency: <strong>{activeDispatchAlert.guard.walkieTalkie}</strong></span>
                    <span className="text-emerald-400 font-medium text-[9px] bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.2 rounded-xs">[TRANSMITTING]</span>
                  </div>
                  <div className="text-slate-300 flex items-center justify-between">
                    <span>Satellite Link: <strong>{activeDispatchAlert.guard.satellitePhone}</strong></span>
                    <span className="text-sky-400 font-medium text-[9px] bg-sky-950/80 border border-sky-800 px-1.5 py-0.2 rounded-xs">[ACTIVE]</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xs text-slate-300 text-[11px]">
                <strong className="text-slate-200 block mb-1">DIRECT DISPATCH DIRECTIVE:</strong>
                <p className="text-slate-400 leading-relaxed">
                  "Attention {activeDispatchAlert.guard.callSign}: High-confidence threat ({activeDispatchAlert.threatLabel}, {(activeDispatchAlert.confidence * 100).toFixed(0)}%) confirmed in sector. Visual intercept and perimeter confirmation ordered per Standard Defense Operating Procedure."
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500">Transmitted at {activeDispatchAlert.timestamp} UTC</span>
                <button
                  onClick={() => setActiveDispatchAlert(null)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xs transition-colors shadow-sm"
                >
                  ACKNOWLEDGE TRANSMISSION
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
