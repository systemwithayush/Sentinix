import React, { useState } from 'react';
import type { 
  ForensicFilterMode, 
  ForensicFilterOptions, 
  TargetClassification, 
  ForensicConfidence, 
  ForensicWriteup
} from '../utils/forensicFilters';
import { 
  TARGET_LABELS, 
  FILTER_DESCRIPTIONS 
} from '../utils/forensicFilters';

export interface ForensicControlsDeckProps {
  camId: string;
  camName: string;
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

export const ForensicControlsDeck: React.FC<ForensicControlsDeckProps> = ({
  camId,
  camName,
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
  const [selectedTarget, setSelectedTarget] = useState<TargetClassification>('DRONE_UAV');
  const [confidence, setConfidence] = useState<ForensicConfidence>('PROBABLE');
  const [notes, setNotes] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const filtersList: ForensicFilterMode[] = [
    'RAW',
    'GRAYSCALE',
    'SOBEL',
    'THERMAL_FLIR',
    'LAPLACIAN_SHARPEN',
    'NIGHT_VISION',
    'THRESHOLD',
    'NEGATIVE'
  ];

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
      
      {/* Deck Header Tabs */}
      <div className="flex justify-between items-center border-b border-tactical-olive/60 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-status-green font-bold text-sm tracking-wider flex items-center">
            <span className="mr-1.5">🔬</span>
            TACTICAL FORENSIC INSPECTION DECK
          </span>
          <span className="text-[10px] bg-black/60 border border-tactical-olive px-2 py-0.5 text-tactical-light">
            TARGET FEED: {camName}
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
            FILTERS & ENHANCEMENT
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
          {/* Filter Pills Grid */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-[10px] text-tactical-light">
              <span className="tracking-wider">SELECT IMAGE PROCESSING FILTER:</span>
              <span className="text-status-green">{FILTER_DESCRIPTIONS[filterMode]?.desc}</span>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
              {filtersList.map(mode => {
                const isSelected = filterMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => onFilterChange(mode)}
                    className={`px-2 py-2 border text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                      isSelected 
                        ? 'border-status-green bg-tactical-olive/60 text-status-green font-bold shadow-[0_0_8px_rgba(0,255,65,0.25)]' 
                        : 'border-tactical-olive/60 bg-black/50 text-tactical-light hover:border-tactical-light hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{FILTER_DESCRIPTIONS[mode]?.name}</span>
                    <span className="text-[8px] text-tactical-light/70">{FILTER_DESCRIPTIONS[mode]?.tag}</span>
                  </button>
                );
              })}
            </div>
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

            {/* Optical Zoom / Magnifier */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-tactical-light">MAGNIFICATION / ZOOM:</span>
                <span className="text-status-green font-bold">{filterOptions.zoom}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[1.0, 1.5, 2.0, 3.0].map(z => (
                  <button
                    key={z}
                    onClick={() => onOptionsChange({ ...filterOptions, zoom: z })}
                    className={`px-1 py-0.5 text-[10px] border ${
                      filterOptions.zoom === z 
                        ? 'border-status-green bg-status-green text-black font-bold' 
                        : 'border-tactical-olive text-tactical-light hover:text-white'
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WRITE-UP & FOLLOW-UP FORM */}
      {activeTab === 'WRITEUP' && (
        <div className="space-y-3 bg-black/40 p-3 border border-tactical-olive">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target Classification Selector */}
            <div className="space-y-2">
              <label className="text-[11px] text-tactical-light font-bold block">
                MATCHED TARGET CLASSIFICATION:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(TARGET_LABELS) as TargetClassification[]).map(key => {
                  const item = TARGET_LABELS[key];
                  const isSelected = selectedTarget === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTarget(key)}
                      className={`p-2 border text-left flex items-start space-x-2 transition-all ${
                        isSelected 
                          ? `${item.badgeClass} border font-bold shadow-md` 
                          : 'border-tactical-olive/60 bg-tactical-dark text-tactical-light hover:border-tactical-light'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-bold truncate">{item.label}</div>
                        <div className="text-[8px] text-tactical-light/70 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assessment Confidence & Observation Write-up */}
            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-tactical-light font-bold">
                    OPERATOR CONFIDENCE RATING:
                  </label>
                  <span className="text-[10px] text-status-amber bg-black/80 px-2 py-0.5 border border-tactical-olive">
                    TIMECODE: {activeTimecode || '00:00.00'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {(['CONFIRMED', 'PROBABLE', 'SUSPICIOUS', 'BENIGN'] as ForensicConfidence[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConfidence(c)}
                      className={`py-1 text-center text-[10px] font-bold border transition-colors ${
                        confidence === c 
                          ? (c === 'CONFIRMED' ? 'bg-status-red text-black border-status-red' : c === 'PROBABLE' ? 'bg-status-amber text-black border-status-amber' : c === 'SUSPICIOUS' ? 'bg-purple-600 text-white border-purple-500' : 'bg-status-green text-black border-status-green')
                          : 'border-tactical-olive text-tactical-light hover:text-white bg-tactical-dark'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <label className="text-[11px] text-tactical-light font-bold block mb-1">
                  ANALYST FORENSIC NOTES & VERIFICATION JUSTIFICATION:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Applied Sobel edge filter; confirmed quadcopter frame geometry and rotary movement matching M2 radar trajectory at timecode 00:04.25..."
                  rows={3}
                  className="w-full bg-tactical-dark border border-tactical-olive text-white p-2 text-xs font-sans focus:border-tactical-green focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCommitWriteup(false)}
                  className="py-2 bg-tactical-olive border border-tactical-green text-white hover:bg-tactical-green hover:text-black font-bold text-xs uppercase transition-colors"
                >
                  💾 SAVE FORENSIC WRITE-UP
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitWriteup(true)}
                  className="py-2 bg-status-red text-black hover:bg-red-500 font-bold text-xs uppercase transition-colors shadow-md"
                >
                  🚩 FLAG FOR PRIORITY FOLLOW-UP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOGGED INSPECTION HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="bg-black/40 p-3 border border-tactical-olive max-h-48 overflow-y-auto space-y-2">
          {camWriteups.length === 0 ? (
            <div className="text-center py-4 text-tactical-light/60">
              NO FORENSIC WRITE-UPS LOGGED FOR THIS CAMERA FEED YET.
            </div>
          ) : (
            <div className="space-y-2">
              {camWriteups.map(wup => {
                const targetInfo = TARGET_LABELS[wup.targetClass] || TARGET_LABELS.DRONE_UAV;
                return (
                  <div key={wup.id} className="p-2.5 bg-tactical-dark border border-tactical-olive/80 flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 border font-bold ${targetInfo.badgeClass}`}>
                          {targetInfo.icon} {targetInfo.label}
                        </span>
                        <span className="bg-black/80 border border-tactical-olive px-1.5 py-0.5 text-tactical-light">
                          FILTER: {wup.filterUsed}
                        </span>
                        <span className="text-status-green font-bold">
                          TC: {wup.timecode}
                        </span>
                        {wup.flaggedForFollowup && (
                          <span className="bg-red-950/80 border border-status-red text-status-red px-1.5 py-0.5 font-bold">
                            FOLLOW-UP FLAGGED
                          </span>
                        )}
                      </div>
                      <span className="text-tactical-light/60">
                        OPR: {wup.analyst} | {wup.timestamp.replace('T', ' ').substring(0, 19)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-200 font-sans pl-1">
                      {wup.notes}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
