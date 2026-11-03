import React, { useState, useMemo } from 'react';
import type { 
  ForensicFilterMode, 
  ForensicFilterOptions, 
  FilterCategory,
  TargetClassification, 
  ForensicConfidence, 
  ForensicWriteup,
  SurveillanceMissionPreset
} from '../utils/forensicFilters';
import { 
  TARGET_LABELS, 
  FILTER_DESCRIPTIONS,
  TOP_10_MUST_HAVE_FILTERS,
  SURVEILLANCE_MISSION_PRESETS
} from '../utils/forensicFilters';

export interface CameraFeedQuickSelect {
  id: string;
  name: string;
  sensorType: 'EO_OPTICAL' | 'IR_THERMAL';
}

export interface ForensicControlsDeckProps {
  camId: string;
  camName: string;
  cameraFeeds?: CameraFeedQuickSelect[];
  onSelectCamera?: (id: string) => void;
  filterMode: ForensicFilterMode;
  onFilterChange: (mode: ForensicFilterMode) => void;
  filterOptions: ForensicFilterOptions;
  onOptionsChange: (options: ForensicFilterOptions) => void;
  activeTimecode: string;
  analystId: string;
  onSaveWriteup: (writeup: ForensicWriteup) => void;
  onFlagFollowup: (writeup: ForensicWriteup) => void;
  existingWriteups: ForensicWriteup[];
}

// All 38 surveillance filters and operators
const ALL_FILTERS_LIST: ForensicFilterMode[] = [
  // Basic
  'RAW',
  'GRAYSCALE',
  'NEGATIVE',
  'THRESHOLD',

  // Low-light enhancement
  'NIGHT_VISION',
  'CLAHE',
  'HISTOGRAM_EQUALIZATION',
  'GAMMA_CORRECTION',

  // Edge & object detection
  'CANNY',
  'SOBEL',
  'LAPLACIAN_SHARPEN',
  'OBJECT_OUTLINE',

  // Noise removal
  'MEDIAN_FILTER',
  'GAUSSIAN_FILTER',
  'BILATERAL_FILTER',

  // Thermal / IR & Multispectral
  'THERMAL_FLIR',
  'PSEUDO_COLOR',
  'HEATMAP',
  'INFRARED_VIEW',
  'MULTISPECTRAL_VIEW',

  // Motion analysis
  'MOTION_DETECTION',
  'BACKGROUND_SUBTRACTION',
  'OPTICAL_FLOW',
  'MOVEMENT_HEATMAP',

  // Target enhancement
  'FACE_ENHANCEMENT',
  'TEXT_ENHANCEMENT',
  'LICENSE_PLATE_ENHANCEMENT',

  // Analysis & Frequency
  'FFT_SPECTRUM',
  'HIGH_PASS',
  'LOW_PASS',

  // Camera views / Spectral Channels
  'CHANNEL_RED',
  'CHANNEL_GREEN',
  'CHANNEL_BLUE',

  // AI Tactical Detection & Tracking Operators
  'TARGET_TRACKING',
  'PERSON_DETECTION',
  'VEHICLE_DETECTION',
  'THREAT_HIGHLIGHT',
  'DRONE_DETECTION'
];

export const ForensicControlsDeck: React.FC<ForensicControlsDeckProps> = ({
  camId,
  camName,
  cameraFeeds,
  onSelectCamera,
  filterMode,
  onFilterChange,
  filterOptions,
  onOptionsChange,
  activeTimecode,
  analystId,
  onSaveWriteup,
  onFlagFollowup,
  existingWriteups
}) => {
  const [activeTab, setActiveTab] = useState<'FILTERS' | 'WRITEUP' | 'HISTORY'>('FILTERS');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<TargetClassification>('DRONE_UAV');
  const [confidence, setConfidence] = useState<ForensicConfidence>('PROBABLE');
  const [notes, setNotes] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const categories: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'ALL', label: 'ALL FILTERS', icon: '🌟' },
    { id: 'LOW_LIGHT', label: 'LOW-LIGHT', icon: '🌙' },
    { id: 'EDGES', label: 'EDGES & SHAPE', icon: '📐' },
    { id: 'NOISE', label: 'NOISE REDUCTION', icon: '🧼' },
    { id: 'THERMAL_IR', label: 'THERMAL & IR', icon: '🔥' },
    { id: 'MOTION', label: 'MOTION ANALYSIS', icon: '⚡' },
    { id: 'TARGET_OCR', label: 'TARGET / OCR', icon: '🎯' },
    { id: 'SPECTRAL', label: 'SPECTRAL & FREQ', icon: '📊' },
    { id: 'AI_OPERATORS', label: 'AI OPERATORS', icon: '🤖' },
    { id: 'BASIC', label: 'BASIC / RAW', icon: '⚪' }
  ];

  // Filtered list based on category and search query
  const displayedFilters = useMemo(() => {
    return ALL_FILTERS_LIST.filter(mode => {
      const info = FILTER_DESCRIPTIONS[mode];
      const matchesCategory = activeCategory === 'ALL' || info?.category === activeCategory;
      const matchesSearch = 
        !searchQuery.trim() ||
        mode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info?.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info?.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleCommitWriteup = (flagFollowup: boolean) => {
    if (!notes.trim()) {
      alert('Please enter your tactical observation notes before saving the write-up.');
      return;
    }

    const newWriteup: ForensicWriteup = {
      id: `wup-${Date.now()}`,
      camId,
      camName,
      timecode: activeTimecode || '00:00.00',
      filterUsed: filterMode,
      targetClass: selectedTarget,
      confidence,
      analyst: analystId || 'DELTA-9',
      notes,
      timestamp: new Date().toISOString(),
      flaggedForFollowup: flagFollowup
    };

    if (flagFollowup) {
      onFlagFollowup(newWriteup);
      setSavedNotice(`🚩 FLAGGED FOR PRIORITY FOLLOW-UP: Logged and routed to alert inbox.`);
    } else {
      onSaveWriteup(newWriteup);
      setSavedNotice(`💾 FORENSIC WRITE-UP SAVED: Observation recorded for ${camName}.`);
    }

    setNotes('');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const camWriteups = existingWriteups.filter(w => w.camId === camId);

  return (
    <div className="bg-tactical-gray border-t border-tactical-olive p-3 flex flex-col space-y-3 font-mono text-xs">
      
      {/* Quick Camera Feed Switcher Bar */}
      {cameraFeeds && onSelectCamera && (
        <div className="bg-black/80 px-2.5 py-1.5 border border-tactical-olive/80 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse"></span>
            <span className="text-white text-[11px] font-bold tracking-wider">
              INSPECT LIVE FEED:
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {cameraFeeds.map(feed => {
              const isSelected = feed.id === camId;
              return (
                <button
                  key={feed.id}
                  onClick={() => onSelectCamera(feed.id)}
                  className={`px-2 py-0.5 text-[10px] font-mono border transition-all flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-status-amber text-black border-status-amber font-bold shadow-[0_0_8px_rgba(255,183,3,0.4)]'
                      : 'bg-tactical-dark text-tactical-light border-tactical-olive hover:text-white hover:border-tactical-green'
                  }`}
                  title={`Switch inspection stream to ${feed.name}`}
                >
                  <span>{feed.id === '5' ? '🚀' : feed.id === '8' ? '🏗️' : feed.id === '7' ? '🛡️' : feed.id === '2' ? '🛸' : '📹'}</span>
                  <span>{feed.name.split(' ')[0]}</span>
                  <span className="text-[8px] opacity-80">({feed.sensorType === 'IR_THERMAL' ? 'IR' : 'EO'})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Deck Header Tabs */}
      <div className="flex flex-wrap justify-between items-center border-b border-tactical-olive/60 pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-status-green font-bold text-sm tracking-wider flex items-center">
            <span className="mr-1.5">🔬</span>
            TACTICAL FORENSIC INSPECTION DECK
          </span>
          <span className="text-[10px] bg-black/60 border border-tactical-olive px-2 py-0.5 text-tactical-light">
            ACTIVE FEED: <strong className="text-status-amber">{camName}</strong>
          </span>
        </div>

        <div className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab('FILTERS')}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors ${
              activeTab === 'FILTERS' 
                ? 'bg-tactical-green text-black border-tactical-green' 
                : 'border-tactical-olive text-tactical-light hover:text-white bg-black/40'
            }`}
          >
            FILTERS & OPERATORS ({ALL_FILTERS_LIST.length})
          </button>
          <button
            onClick={() => setActiveTab('WRITEUP')}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors ${
              activeTab === 'WRITEUP' 
                ? 'bg-status-amber text-black border-status-amber' 
                : 'border-tactical-olive text-status-amber hover:text-yellow-300 bg-black/40'
            }`}
          >
            LOG WRITE-UP & FOLLOW-UP
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors ${
              activeTab === 'HISTORY' 
                ? 'bg-purple-600 text-white border-purple-500' 
                : 'border-tactical-olive text-purple-300 hover:text-purple-200 bg-black/40'
            }`}
          >
            INSPECTION LOGS ({camWriteups.length})
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedNotice && (
        <div className="bg-status-green/10 border border-status-green text-status-green px-3 py-1.5 text-xs text-center font-bold animate-pulse">
          {savedNotice}
        </div>
      )}

      {/* TAB 1: FILTERS & ENHANCEMENT */}
      {activeTab === 'FILTERS' && (
        <div className="space-y-3">

          {/* Operational Mission Profiles Strip */}
          <div className="bg-black/80 p-2 border border-tactical-olive flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-tactical-light font-bold flex items-center mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-green mr-1.5 animate-pulse"></span>
                MISSION PROFILES:
              </span>
              {(Object.keys(SURVEILLANCE_MISSION_PRESETS) as SurveillanceMissionPreset[]).map(key => {
                const preset = SURVEILLANCE_MISSION_PRESETS[key];
                const isActive = filterMode === preset.primaryFilter;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onFilterChange(preset.primaryFilter)}
                    className={`px-2 py-0.5 text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                      isActive
                        ? 'bg-tactical-olive text-status-green border-tactical-green shadow-[0_0_8px_rgba(0,255,65,0.4)]'
                        : 'bg-tactical-dark text-gray-300 border-tactical-olive hover:text-white hover:border-tactical-green'
                    }`}
                    title={preset.targetDescription}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-[9px] text-tactical-light/60 font-mono hidden md:inline">
              ISO/IEC 27037 FORENSIC STANDARD
            </span>
          </div>

          {/* Top 10 Must-Have Filters Bar */}
          <div className="bg-tactical-dark/90 p-2 border border-tactical-green/60 shadow-md">
            <div className="text-[10px] text-status-green font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <span className="text-status-green mr-1.5">⚡</span>
                TOP 10 SURVEILLANCE FILTERS (ONE-CLICK PRESETS):
              </span>
              <span className="text-[9px] text-tactical-light">
                ACTIVE: <strong className="text-status-amber">{filterMode}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TOP_10_MUST_HAVE_FILTERS.map(f => {
                const isSelected = filterMode === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onFilterChange(f.id)}
                    className={`px-2 py-1 text-[11px] font-bold border transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? f.activeClass
                        : `bg-black/70 hover:bg-tactical-gray ${f.borderClass} ${f.textClass}`
                    }`}
                    title={f.desc}
                  >
                    <span>{f.icon}</span>
                    <span>{f.name}</span>
                    <span className="text-[8px] opacity-75 font-mono px-0.5 bg-black/40 border border-current rounded">
                      {f.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Pills & Quick Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-black/50 p-2 border border-tactical-olive/60">
            <div className="flex flex-wrap gap-1 text-[10px]">
              {categories.map(cat => {
                const count = cat.id === 'ALL' 
                  ? ALL_FILTERS_LIST.length 
                  : ALL_FILTERS_LIST.filter(f => FILTER_DESCRIPTIONS[f]?.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 border transition-colors flex items-center space-x-1 ${
                      activeCategory === cat.id
                        ? 'bg-tactical-green text-black border-tactical-green font-bold'
                        : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="🔍 Search 38 filters..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-tactical-dark border border-tactical-olive text-white px-2 py-1 text-[10px] focus:outline-none focus:border-tactical-green"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Info Banner */}
          <div className="bg-black/60 border border-tactical-olive/80 p-2 flex justify-between items-center text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="text-tactical-light">CURRENT OPERATOR:</span>
              <span className="text-status-green font-bold text-xs">
                {FILTER_DESCRIPTIONS[filterMode]?.name || filterMode}
              </span>
              <span className="text-[9px] bg-tactical-olive/60 border border-tactical-green/60 text-tactical-light px-1.5 py-0.2">
                {FILTER_DESCRIPTIONS[filterMode]?.tag}
              </span>
            </div>
            <div className="text-[10px] text-gray-300 hidden md:block">
              {FILTER_DESCRIPTIONS[filterMode]?.desc}
            </div>
          </div>

          {/* Filter Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto p-1 bg-black/40 border border-tactical-olive/60">
            {displayedFilters.map(mode => {
              const isSelected = filterMode === mode;
              const info = FILTER_DESCRIPTIONS[mode];
              const isAI = info?.category === 'AI_OPERATORS';
              const isThermal = info?.category === 'THERMAL_IR';
              const isMotion = info?.category === 'MOTION';

              return (
                <button
                  key={mode}
                  onClick={() => onFilterChange(mode)}
                  className={`p-1.5 border text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                    isSelected 
                      ? 'border-status-green bg-tactical-olive/60 text-status-green font-bold shadow-[0_0_10px_rgba(0,255,65,0.3)] ring-1 ring-status-green' 
                      : isAI
                      ? 'border-red-900/60 bg-red-950/20 text-red-300 hover:border-status-red hover:text-white'
                      : isThermal
                      ? 'border-amber-900/60 bg-amber-950/20 text-amber-300 hover:border-status-amber hover:text-white'
                      : isMotion
                      ? 'border-cyan-900/60 bg-cyan-950/20 text-cyan-300 hover:border-cyan-400 hover:text-white'
                      : 'border-tactical-olive/60 bg-black/60 text-tactical-light hover:border-tactical-light hover:text-white'
                  }`}
                  title={`${info?.name}: ${info?.desc}`}
                >
                  <span className="text-[9px] font-bold truncate max-w-full">{info?.name || mode}</span>
                  <span className="text-[8px] text-tactical-light/70 truncate">{info?.tag}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Sliders: Contrast, Sensitivity, Tint, Zoom */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/40 p-2.5 border border-tactical-olive/60">
            {/* Contrast Boost */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-tactical-light">CONTRAST BOOST:</span>
                <span className="text-status-green font-bold">{filterOptions.contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={filterOptions.contrast}
                onChange={(e) => onOptionsChange({ ...filterOptions, contrast: parseFloat(e.target.value) })}
                className="w-full accent-tactical-green h-1.5 bg-tactical-dark"
              />
            </div>

            {/* Edge / Threshold Sensitivity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-tactical-light">
                  {filterMode === 'THRESHOLD' ? 'BINARY THRESHOLD:' : 'EDGE SENSITIVITY:'}
                </span>
                <span className="text-status-amber font-bold">
                  {filterMode === 'THRESHOLD' ? filterOptions.threshold : `${filterOptions.edgeSensitivity.toFixed(1)}x`}
                </span>
              </div>
              {filterMode === 'THRESHOLD' ? (
                <input
                  type="range"
                  min="40"
                  max="220"
                  step="5"
                  value={filterOptions.threshold}
                  onChange={(e) => onOptionsChange({ ...filterOptions, threshold: parseInt(e.target.value) })}
                  className="w-full accent-status-amber h-1.5 bg-tactical-dark"
                />
              ) : (
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={filterOptions.edgeSensitivity}
                  onChange={(e) => onOptionsChange({ ...filterOptions, edgeSensitivity: parseFloat(e.target.value) })}
                  className="w-full accent-status-amber h-1.5 bg-tactical-dark"
                />
              )}
            </div>

            {/* Sobel Tint Selector */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-tactical-light">SOBEL COLOR TINT:</span>
                <span className="text-white font-bold">{filterOptions.tint}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['MONO', 'GREEN_TACTICAL', 'CYAN_GRID'] as const).map(tint => (
                  <button
                    key={tint}
                    onClick={() => onOptionsChange({ ...filterOptions, tint })}
                    className={`px-1 py-0.5 text-[9px] border ${
                      filterOptions.tint === tint 
                        ? 'border-tactical-green bg-tactical-green/20 text-status-green font-bold' 
                        : 'border-tactical-olive text-tactical-light hover:text-white'
                    }`}
                  >
                    {tint.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Magnification Zoom */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-tactical-light">OPTICAL ZOOM:</span>
                <span className="text-status-green font-bold">{filterOptions.zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={filterOptions.zoom}
                onChange={(e) => onOptionsChange({ ...filterOptions, zoom: parseFloat(e.target.value) })}
                className="w-full accent-tactical-green h-1.5 bg-tactical-dark"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOG WRITE-UP & FOLLOW-UP */}
      {activeTab === 'WRITEUP' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target Classification Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-tactical-light block font-bold">TARGET CLASSIFICATION:</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value as TargetClassification)}
                className="w-full bg-tactical-dark border border-tactical-olive text-white px-2 py-1.5 text-xs font-mono"
              >
                {Object.entries(TARGET_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Forensic Confidence Level */}
            <div className="space-y-1">
              <label className="text-[10px] text-tactical-light block font-bold">FORENSIC CONFIDENCE:</label>
              <div className="grid grid-cols-2 gap-1">
                {(['CONFIRMED', 'PROBABLE', 'SUSPICIOUS', 'BENIGN'] as const).map((conf) => (
                  <button
                    key={conf}
                    type="button"
                    onClick={() => setConfidence(conf)}
                    className={`py-1 text-[10px] font-bold border transition-colors ${
                      confidence === conf
                        ? conf === 'CONFIRMED'
                          ? 'bg-status-red text-white border-status-red'
                          : conf === 'PROBABLE'
                          ? 'bg-status-amber text-black border-status-amber'
                          : conf === 'SUSPICIOUS'
                          ? 'bg-yellow-600 text-white border-yellow-500'
                          : 'bg-status-green text-black border-status-green'
                        : 'border-tactical-olive text-tactical-light hover:text-white'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Summary */}
            <div className="bg-black/50 p-2 border border-tactical-olive space-y-1 text-[10px]">
              <div className="text-tactical-light font-bold">ACTIVE TELEMETRY:</div>
              <div>TIMECODE: <span className="text-status-green font-bold">{activeTimecode}</span></div>
              <div>FILTER APPLIED: <span className="text-white font-bold">{filterMode}</span></div>
              <div>ANALYST ID: <span className="text-status-amber font-bold">{analystId}</span></div>
            </div>
          </div>

          {/* Observation Notes Textarea */}
          <div className="space-y-1">
            <label className="text-[10px] text-tactical-light block font-bold">
              OBSERVATION & RATIONALE WRITE-UP:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Applied 3x3 Sobel and CLAHE. Isolated high-contrast rigid geometric boundaries on CAM-8. Quadcopter rotor micro-doppler displacement confirmed on CAM-2..."
              rows={3}
              className="w-full bg-tactical-dark border border-tactical-olive text-white p-2 text-xs font-mono focus:outline-none focus:border-tactical-green"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-1">
            <button
              onClick={() => handleCommitWriteup(false)}
              className="px-4 py-1.5 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold text-xs transition-colors"
            >
              💾 SAVE LOG TO DOSSIER
            </button>
            <button
              onClick={() => handleCommitWriteup(true)}
              className="px-4 py-1.5 bg-status-red border border-status-red text-white hover:bg-red-600 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-[0_0_10px_rgba(255,0,51,0.3)]"
            >
              <span>🚩</span>
              <span>LOG & FLAG FOR ESCALATION</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: INSPECTION LOGS */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {camWriteups.length === 0 ? (
            <div className="text-center py-6 text-tactical-light/60 font-mono text-xs">
              NO FORENSIC WRITE-UPS RECORDED FOR {camName} YET.
            </div>
          ) : (
            camWriteups.map((wup) => (
              <div 
                key={wup.id} 
                className="bg-black/50 border border-tactical-olive p-2 space-y-1 text-xs font-mono"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-status-green font-bold">TC {wup.timecode}</span>
                    <span className="text-[10px] bg-tactical-olive/60 border border-tactical-olive px-1.5 py-0.2">
                      {wup.filterUsed}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 font-bold ${
                      wup.confidence === 'CONFIRMED' ? 'bg-status-red/20 text-status-red border border-status-red' :
                      wup.confidence === 'PROBABLE' ? 'bg-status-amber/20 text-status-amber border border-status-amber' :
                      'bg-status-green/20 text-status-green border border-status-green'
                    }`}>
                      {wup.confidence}
                    </span>
                  </div>
                  <div className="text-[10px] text-tactical-light">
                    {wup.analyst} | {new Date(wup.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="text-white text-[11px] font-sans">
                  {wup.notes}
                </div>

                {wup.flaggedForFollowup && (
                  <div className="text-[10px] text-status-red font-bold flex items-center">
                    <span className="mr-1">🚩</span> FLAGGED FOR PRIORITY FOLLOW-UP
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
