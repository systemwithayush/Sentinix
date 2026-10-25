import React, { useState, useRef, useEffect } from 'react';
import type { CameraFeed, Alert } from '../App';
import type { GeometricMeasurement, ForensicDossier } from '../utils/forensicReport';
import { createForensicDossier } from '../utils/forensicReport';

export interface CamouflageGeometricViewerProps {
  cameraFeeds: CameraFeed[];
  onOpenReviewModal: (alert: Alert) => void;
  onGenerateReport: (dossier: ForensicDossier) => void;
  reviewerId: string;
}

export type GeometricFilterLayer = 'ALL' | 'SQUARES' | 'RECTANGLES' | 'TRENCHES' | 'HEATMAP';

export const CamouflageGeometricViewer: React.FC<CamouflageGeometricViewerProps> = ({
  cameraFeeds,
  onOpenReviewModal,
  onGenerateReport,
  reviewerId
}) => {
  // Available Camouflage Analysis Scenes
  const scenes = [
    {
      id: '8',
      name: 'SCENE 1: CAM-8 (BORDER CONSTRUCTION - CONCEALED EXCAVATION & BUNKERS)',
      targetType: 'CAMOUFLAGED_ASSET',
      feedId: '8',
      location: 'Sector Delta // MGRS 43R XA 9015 1285',
      alertId: 'alt-008'
    },
    {
      id: '7',
      name: 'SCENE 2: CAM-7 (BORDER INFILTRATION - PERIMETER BREACH CULVERT)',
      targetType: 'HUMAN_INFILTRATION',
      feedId: '7',
      location: 'Sector Bravo // MGRS 43R XA 8995 1230',
      alertId: 'alt-007'
    },
    {
      id: '4',
      name: 'SCENE 3: CAM-4 (TREE LINE SOUTH - ARTIFICIAL FOLIAGE NETTING)',
      targetType: 'CAMOUFLAGED_ASSET',
      feedId: '4',
      location: 'Sector Alpha // MGRS 43R XA 8912 1180',
      alertId: 'alt-002'
    },
    {
      id: '2',
      name: 'SCENE 4: CAM-2 (PERIMETER NORTH - THERMAL ENGINE SIGNATURE)',
      targetType: 'THERMAL_HOTSPOT',
      feedId: '2',
      location: 'Sector Charlie // MGRS 43R XA 8840 1125',
      alertId: 'alt-001'
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

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const activeFeed = cameraFeeds.find(c => c.id === activeScene.feedId) || cameraFeeds[0];

  const geometricItems: GeometricMeasurement[] = [
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

  const handleGenerateReport = () => {
    const dossier = createForensicDossier({
      alertId: activeScene.alertId,
      sensorId: activeFeed.id,
      sensorName: activeFeed.name,
      sensorModality: activeFeed.sensorType,
      targetClass: activeScene.targetType as any,
      confidence: 'CONFIRMED',
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
      analystNotes: `M4 Camouflage Analysis Suite evaluated scene ${activeFeed.name}. Detected rigid geometric squares and rectangular construction patterns with 98.4% artificiality confidence. Natural fractal background rejected.`,
      disposition: 'RELEVANT',
      dispositionRationale: 'Unnatural right-angle geometry and synthetic camouflage netting confirm clandestine border construction activity.',
      customGeometrics: geometricItems
    });

    onGenerateReport(dossier);
  };

  const handleOpenReview = () => {
    const dummyAlert: Alert = {
      id: activeScene.alertId,
      cam: activeFeed.name,
      cameraId: activeFeed.id,
      module: 'M4 Camouflage (Geometric Rigidity)',
      threatLevel: 3,
      description: `Concealed construction activity flagged in ${activeScene.location}. Detected rigid square/rectangle signatures (${geometricItems[0].estimatedDimensions}, ${geometricItems[1].estimatedDimensions}) under camouflage netting.`,
      time: timecode,
      timestamp: new Date().toISOString(),
      reviewStatus: 'NEW',
      disposition: 'RELEVANT',
      engineVersion: 'sentinel-m4-fusion-1.3'
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
            <span className="w-2.5 h-2.5 rounded-full bg-status-amber animate-pulse"></span>
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              M4 CAMOUFLAGE & GEOMETRIC ANOMALY DETECTOR
            </span>
            <span className="text-[10px] font-mono bg-tactical-olive/60 text-tactical-light px-1.5 py-0.2 border border-tactical-olive">
              ISO/IEC 27037 READY
            </span>
          </div>

          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
            {scenes.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSceneId(s.id)}
                className={`px-2 py-1 border transition-colors ${
                  activeSceneId === s.id
                    ? 'border-status-amber bg-status-amber text-black font-bold shadow-[0_0_8px_rgba(255,183,3,0.3)]'
                    : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                }`}
              >
                {s.id === '8' ? 'CAM-8 (CONSTRUCTION)' : s.id === '7' ? 'CAM-7 (INFILTRATION)' : s.id === '4' ? 'CAM-4 (NETTING)' : 'CAM-2 (HOTSPOT)'}
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
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40 bg-[radial-gradient(#00ff41_1px,transparent_1px)] [background-size:16px_16px]"
            />
          )}

          {/* Tactical Crosshairs & Demarcation Line */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Border Line */}
            <div className="absolute top-1/2 left-0 right-0 border-b-2 border-dashed border-status-red/50 flex justify-between px-4 text-[9px] font-mono text-status-red">
              <span>DEMARCATION LINE // SECTOR BORDER</span>
              <span>RESTRICTED ZONE // NO ENTRY</span>
            </div>
          </div>

          {/* GEOMETRIC PATTERN OVERLAYS (FULL ACTIVE CONSTRUCTION COMPLEX: 10 SITES) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: overlayOpacity }}>
            
            {/* 1. LARGE CONCRETE FOUNDATION SLAB (ANO-GEO-REC01) */}
            {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
              <div 
                className="absolute top-[26%] left-[8%] w-[32%] h-[24%] border-2 border-cyan-400 bg-cyan-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-cyan-500/25 group shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                onClick={handleOpenReview}
                title="Click to review reinforced foundation slab (24.5m × 12.0m)"
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

            {/* 2. ELEVATOR / CORE SHAFT (ANO-GEO-SQ01) */}
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

            {/* 3. CENTRAL EARTHMOVING & GRADING PAD (ANO-GEO-REC02) */}
            {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
              <div 
                className="absolute top-[46%] left-[36%] w-[26%] h-[20%] border-2 border-amber-400 bg-amber-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                onClick={handleOpenReview}
                title="Click to review heavy machinery earthmoving pad (18.5m × 9.2m)"
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

            {/* 4. CENTRAL FOOTING EXCAVATION PIT (ANO-GEO-SQ02) */}
            {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
              <div 
                className="absolute top-[50%] left-[56%] w-[13%] h-[14%] border-2 border-yellow-400 bg-yellow-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/30"
                onClick={handleOpenReview}
                title="Click to review central structural footing pit (8.5m × 8.5m)"
              >
                <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                  ◼ SQ #2: 8.5m [FOOTING]
                </div>
              </div>
            )}

            {/* 5. UPPER RESIDENTIAL LOT A FOOTING (ANO-GEO-SQ03) */}
            {(activeLayer === 'ALL' || activeLayer === 'SQUARES') && (
              <div 
                className="absolute top-[14%] left-[56%] w-[14%] h-[13%] border-2 border-yellow-400 bg-yellow-500/20 pointer-events-auto cursor-pointer transition-all hover:bg-yellow-500/30"
                onClick={handleOpenReview}
                title="Click to review residential lot A footing (7.8m × 7.8m)"
              >
                <div className="absolute -top-5 left-0 bg-yellow-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                  ◼ SQ #3: 7.8m [LOT A]
                </div>
              </div>
            )}

            {/* 6. UPPER RESIDENTIAL LOT B SLAB (ANO-GEO-REC03) */}
            {(activeLayer === 'ALL' || activeLayer === 'RECTANGLES') && (
              <div 
                className="absolute top-[16%] left-[73%] w-[16%] h-[12%] border border-cyan-400 bg-cyan-500/15 pointer-events-auto cursor-pointer transition-all hover:bg-cyan-500/25"
                onClick={handleOpenReview}
                title="Click to review residential lot B slab (11.2m × 6.8m)"
              >
                <div className="absolute -top-5 left-0 bg-cyan-400 text-black px-1 py-0.2 font-mono font-black text-[8px] whitespace-nowrap">
                  ■ RECT #3: 11.2m [LOT B]
                </div>
              </div>
            )}

            {/* 7. PREFABRICATED MATERIAL STAGING (ANO-GEO-REC04) */}
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

            {/* 8. SOUTHERN RETENTION BASIN DRAINAGE TRENCH (ANO-GEO-REC05) */}
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

            {/* 9. SOUTHERN PUMP STATION / SUMP VAULT (ANO-GEO-SQ04) */}
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

            {/* 10. MAIN LINEAR UTILITY CONDUIT TRENCH (ANO-GEO-LN01) */}
            {(activeLayer === 'ALL' || activeLayer === 'TRENCHES') && (
              <div className="absolute top-[48%] left-[20%] w-[50%] h-0 border-t-2 border-dashed border-fuchsia-400 rotate-[-12deg]">
                <span className="absolute -top-4 left-8 bg-fuchsia-950/90 text-fuchsia-300 px-1 text-[8px] font-mono border border-fuchsia-500 whitespace-nowrap">
                  ⫽ PIPELINE TRENCH: 36.0m RUN @ 348°
                </span>
              </div>
            )}

            {/* Infiltration Specific Overlay (When Scene 2 / CAM-7 is active) */}
            {activeScene.id === '7' && (
              !activeFeed.fileName ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-3 bg-red-950/80 border-2 border-status-red text-white font-mono text-center space-y-1 animate-pulse shadow-lg">
                    <div className="text-sm font-bold text-status-red">⚠️ BORDER INFILTRATION DETECTED</div>
                    <div className="text-[11px] text-gray-200">
                      4 DISMOUNTED PERSONNEL CROSSING BORDER DITCH LINE // SECTOR BRAVO
                    </div>
                    <div className="text-[10px] text-status-amber">
                      GAIT & GAUSSIAN SHADOW TRACK VERIFIED (Z-SCORE: +4.9σ)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="p-3 bg-emerald-950/80 border-2 border-status-green text-white font-mono text-center space-y-1 shadow-lg">
                    <div className="text-sm font-bold text-status-green">✓ BORDER PERIMETER SECURE</div>
                    <div className="text-[11px] text-gray-200">
                      CUSTOM FOOTAGE LOADED ({activeFeed.fileName}): ZERO INFILTRATION DETECTED
                    </div>
                    <div className="text-[10px] text-tactical-light">
                      NO PERSONS, VEHICLES, OR BOUNDARY VIOLATIONS PRESENT
                    </div>
                  </div>
                </div>
              )
            )}

          </div>

          {/* Top-Right HUD Badge */}
          <div className="absolute top-3 right-3 bg-black/90 border border-status-amber px-2.5 py-1 font-mono text-xs text-status-amber z-20 flex items-center space-x-2 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-status-amber animate-pulse"></span>
            <span className="font-bold">ANO-GEO-4B9F: CONCEALED CONSTRUCTION DETECTED</span>
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
          
          {/* Layer Selector */}
          <div className="flex items-center space-x-1.5">
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
          </div>

          {/* Video Playback & Quick Toggles */}
          <div className="flex items-center space-x-3 text-[10px]">
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
              className="px-2 py-0.5 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold text-[10px] transition-colors"
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
          <span className="text-[10px] bg-status-red/20 text-status-red border border-status-red px-1.5 py-0.2 font-bold">
            LVL 3 THREAT
          </span>
        </h2>

        <div className="panel flex-1 bg-tactical-gray overflow-y-auto space-y-3 p-3 font-mono text-xs">
          
          {/* Main Bayesian Concealment Probability */}
          <div className="border-b border-tactical-olive pb-2.5">
            <div className="text-xs font-bold text-status-amber mb-0.5">
              CONCEALED BORDER CONSTRUCTION
            </div>
            <div className="text-[10px] text-tactical-light mb-2">
              TARGET: ANO-GEO-4B9F (BORDER ZONE DELTA)
            </div>
            <div className="bg-black/60 p-2 font-mono text-xs flex justify-between border border-tactical-olive">
              <span>ARTIFICIALITY SCORE:</span>
              <span className="text-status-red font-black text-sm">98.4% (RIGID)</span>
            </div>
          </div>

          {/* Sub-Module Breakdown Bars */}
          <div className="space-y-2 font-mono text-[11px]">
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-tactical-light">M4.1 GEOMETRY (SQUARE/RECT)</span>
                <span className="text-status-red font-bold">0.96 (CRITICAL)</span>
              </div>
              <div className="w-full bg-black h-1.5"><div className="bg-status-red h-1.5 w-[96%]"></div></div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-tactical-light">M4.2 TEXTURAL NETTING WEAVE</span>
                <span className="text-status-amber font-bold">0.92</span>
              </div>
              <div className="w-full bg-black h-1.5"><div className="bg-status-amber h-1.5 w-[92%]"></div></div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-tactical-light">M4.3 VEGETATION VOID RATIO</span>
                <span className="text-status-amber font-bold">0.88</span>
              </div>
              <div className="w-full bg-black h-1.5"><div className="bg-status-amber h-1.5 w-[88%]"></div></div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-tactical-light">M4.4 SHADOW ORTHOGONALITY</span>
                <span className="text-status-green font-bold">0.85</span>
              </div>
              <div className="w-full bg-black h-1.5"><div className="bg-status-green h-1.5 w-[85%]"></div></div>
            </div>
          </div>

          {/* Identified Shape Measurements Summary */}
          <div className="pt-2 border-t border-tactical-olive/60 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-tactical-light font-bold">EXTRACTED SITES & FOOTPRINTS:</span>
              <span className="text-[9px] bg-status-amber/20 text-status-amber border border-status-amber/60 px-1 font-bold">
                {geometricItems.length} STRUCTURES
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
              {geometricItems.map((g, idx) => (
                <div key={idx} className="p-1.5 bg-black/40 border border-tactical-olive/50 text-[10px] space-y-0.5 hover:border-status-amber transition-colors">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-status-amber">{g.shapeType}: {g.estimatedDimensions.split(' ')[0]} {g.estimatedDimensions.split(' ')[1] || ''}</span>
                    <span className="text-tactical-green">{g.cornerAngleOrthogonality.split(' ')[0]}</span>
                  </div>
                  <div className="text-gray-300 font-sans text-[9px] leading-tight">
                    {g.description.substring(0, 75)}...
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
