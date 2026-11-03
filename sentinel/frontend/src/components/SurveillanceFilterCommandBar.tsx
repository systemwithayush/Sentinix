import React, { useState } from 'react';
import type { 
  ForensicFilterMode, 
  ForensicFilterOptions,
  SurveillanceMissionPreset
} from '../utils/forensicFilters';
import { 
  TOP_10_MUST_HAVE_FILTERS, 
  SURVEILLANCE_MISSION_PRESETS,
  FILTER_DESCRIPTIONS 
} from '../utils/forensicFilters';

export interface SurveillanceFilterCommandBarProps {
  activeFilter: ForensicFilterMode;
  onFilterChange: (mode: ForensicFilterMode) => void;
  filterOptions: ForensicFilterOptions;
  onOptionsChange: (options: ForensicFilterOptions) => void;
  selectedScope: 'ALL' | string; // 'ALL' or camera ID '1'..'8'
  onScopeChange: (scope: 'ALL' | string) => void;
  availableCameras: { id: string; name: string }[];
  onOpenForensicLab?: (camId: string) => void;
  activeMissionPreset?: SurveillanceMissionPreset | null;
  onMissionPresetChange?: (preset: SurveillanceMissionPreset) => void;
}

export const SurveillanceFilterCommandBar: React.FC<SurveillanceFilterCommandBarProps> = ({
  activeFilter,
  onFilterChange,
  filterOptions,
  onOptionsChange,
  selectedScope,
  onScopeChange,
  availableCameras,
  onOpenForensicLab,
  activeMissionPreset,
  onMissionPresetChange
}) => {
  const [showTuning, setShowTuning] = useState(false);
  const [showAllDropdown, setShowAllDropdown] = useState(false);

  // All 38 filter modes grouped
  const allFilters = Object.keys(FILTER_DESCRIPTIONS) as ForensicFilterMode[];

  const handleSelectMissionPreset = (presetKey: SurveillanceMissionPreset) => {
    const config = SURVEILLANCE_MISSION_PRESETS[presetKey];
    onFilterChange(config.primaryFilter);
    if (onMissionPresetChange) {
      onMissionPresetChange(presetKey);
    }
  };

  const activeFilterInfo = FILTER_DESCRIPTIONS[activeFilter];

  return (
    <div className="bg-tactical-dark border border-tactical-olive p-2.5 flex flex-col space-y-2.5 font-mono text-xs select-none">
      
      {/* SECTION 1: MISSION OPERATIONS & SCOPE SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tactical-olive/60 pb-2">
        
        {/* Mission Presets (The 4 highlighted operational domains) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-tactical-light font-bold flex items-center mr-1">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse mr-1.5"></span>
            MISSION PROFILES:
          </span>

          {(Object.keys(SURVEILLANCE_MISSION_PRESETS) as SurveillanceMissionPreset[]).map((key) => {
            const preset = SURVEILLANCE_MISSION_PRESETS[key];
            const isActive = activeMissionPreset === key || activeFilter === preset.primaryFilter;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectMissionPreset(key)}
                className={`px-2.5 py-1 text-[11px] font-bold border transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-tactical-olive/90 text-status-green border-tactical-green shadow-[0_0_4px_rgba(0,255,65,0.2)]'
                    : 'bg-black/70 text-gray-300 border-tactical-olive hover:text-white hover:border-tactical-green'
                }`}
                title={preset.targetDescription}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                <span className="text-[9px] opacity-75 font-normal hidden xl:inline">({preset.badge})</span>
              </button>
            );
          })}
        </div>

        {/* Filter Application Scope & Lab Button */}
        <div className="flex items-center space-x-2">
          {/* Scope Selector */}
          <div className="flex items-center bg-black/80 border border-tactical-olive px-1.5 py-0.5 space-x-1 text-[10px]">
            <span className="text-tactical-light font-bold mr-1">APPLY TO:</span>
            <button
              type="button"
              onClick={() => onScopeChange('ALL')}
              className={`px-1.5 py-0.5 font-bold transition-all ${
                selectedScope === 'ALL'
                  ? 'bg-status-amber text-black shadow-[0_0_6px_rgba(255,183,3,0.5)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ALL 8 FEEDS
            </button>
            <span className="text-tactical-olive">|</span>
            {availableCameras.map(cam => (
              <button
                key={cam.id}
                type="button"
                onClick={() => onScopeChange(cam.id)}
                className={`px-1.5 py-0.5 transition-all ${
                  selectedScope === cam.id
                    ? 'bg-status-green text-black font-bold shadow-[0_0_6px_rgba(0,255,65,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={`Target ${cam.name}`}
              >
                C{cam.id}
              </button>
            ))}
          </div>

          {/* Forensic Lab Quick Launcher */}
          {onOpenForensicLab && (
            <button
              type="button"
              onClick={() => onOpenForensicLab(selectedScope === 'ALL' ? '1' : selectedScope)}
              className="px-2.5 py-1 bg-tactical-olive hover:bg-tactical-green hover:text-black text-white font-bold text-[11px] border border-tactical-green transition-all shadow-[0_0_8px_rgba(0,255,65,0.2)] flex items-center space-x-1"
            >
              <span>🔬</span>
              <span>EXPAND FORENSIC LAB</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: TOP 10 MUST-HAVE SURVEILLANCE FILTERS (PROMINENT TACTICAL BAR) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-tactical-light font-bold flex items-center mr-1">
          <span className="text-status-green mr-1">⚡</span>
          TOP 10 FILTERS:
        </span>

        {TOP_10_MUST_HAVE_FILTERS.map((f) => {
          const isSelected = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onFilterChange(f.id);
                // Also update mission preset if matching primary
                const matchingPreset = (Object.keys(SURVEILLANCE_MISSION_PRESETS) as SurveillanceMissionPreset[]).find(
                  k => SURVEILLANCE_MISSION_PRESETS[k].primaryFilter === f.id
                );
                if (matchingPreset && onMissionPresetChange) {
                  onMissionPresetChange(matchingPreset);
                }
              }}
              className={`px-2.5 py-1 rounded-sm text-xs font-mono font-bold border transition-all flex items-center space-x-1.5 relative group ${
                isSelected
                  ? f.activeClass
                  : `bg-black/80 hover:bg-tactical-gray ${f.borderClass} ${f.textClass} hover:brightness-125`
              }`}
              title={`${f.name} - ${f.desc}`}
            >
              <span className="text-sm">{f.icon}</span>
              <span>{f.name}</span>
              <span className="text-[9px] opacity-70 px-1 bg-black/40 rounded border border-current font-mono">
                {f.tag}
              </span>
            </button>
          );
        })}

        {/* More 38-Filter Dropdown Toggle */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowAllDropdown(!showAllDropdown)}
            className="px-2 py-1 bg-black/80 border border-tactical-olive hover:border-tactical-green text-tactical-light hover:text-white font-mono text-xs flex items-center space-x-1 transition-colors"
          >
            <span>☰</span>
            <span>ALL (38)</span>
            <span className="text-[9px]">{showAllDropdown ? '▲' : '▼'}</span>
          </button>

          {showAllDropdown && (
            <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto bg-black/95 border-2 border-tactical-green p-2 shadow-[0_0_20px_rgba(0,0,0,0.9)] z-50 space-y-1">
              <div className="text-[10px] text-status-green font-bold pb-1 border-b border-tactical-olive flex justify-between">
                <span>FULL 38-FILTER CATALOG</span>
                <button 
                  onClick={() => setShowAllDropdown(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1 pt-1">
                {allFilters.map((mode) => {
                  const meta = FILTER_DESCRIPTIONS[mode];
                  const isCur = activeFilter === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        onFilterChange(mode);
                        setShowAllDropdown(false);
                      }}
                      className={`text-left px-2 py-1 text-[10px] font-mono border transition-all flex justify-between items-center ${
                        isCur
                          ? 'bg-status-amber text-black border-status-amber font-bold'
                          : 'bg-tactical-dark text-gray-300 border-tactical-olive/60 hover:border-tactical-green hover:text-white'
                      }`}
                    >
                      <span className="truncate">{meta?.name || mode}</span>
                      <span className="text-[8px] opacity-75 font-sans uppercase">[{meta?.tag || 'FX'}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Tuning Toggle */}
        <button
          type="button"
          onClick={() => setShowTuning(!showTuning)}
          className={`px-2 py-1 border transition-all text-xs font-mono flex items-center space-x-1 ${
            showTuning
              ? 'bg-tactical-olive border-tactical-green text-status-green'
              : 'bg-black/60 border-tactical-olive text-tactical-light hover:text-white'
          }`}
          title="Toggle sensitivity, contrast & threshold tuning sliders"
        >
          <span>⚙️</span>
          <span>{showTuning ? 'HIDE TUNING' : 'TUNE FX'}</span>
        </button>
      </div>

      {/* SECTION 3: QUICK TUNING CONTROLS SLIDERS (EXPANDABLE) */}
      {showTuning && (
        <div className="bg-black/90 border border-tactical-olive p-2 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-6">
            {/* Contrast Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-tactical-light font-bold">CONTRAST:</span>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={filterOptions.contrast}
                onChange={(e) => onOptionsChange({ ...filterOptions, contrast: parseFloat(e.target.value) })}
                className="w-24 accent-tactical-green cursor-pointer h-1.5 bg-tactical-dark"
              />
              <span className="text-[10px] text-status-green font-bold w-8">{filterOptions.contrast.toFixed(1)}x</span>
            </div>

            {/* Edge Sensitivity Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-tactical-light font-bold">EDGE SENSITIVITY:</span>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={filterOptions.edgeSensitivity}
                onChange={(e) => onOptionsChange({ ...filterOptions, edgeSensitivity: parseFloat(e.target.value) })}
                className="w-24 accent-cyan-400 cursor-pointer h-1.5 bg-tactical-dark"
              />
              <span className="text-[10px] text-cyan-300 font-bold w-8">{filterOptions.edgeSensitivity.toFixed(1)}x</span>
            </div>

            {/* Threshold Slider */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-tactical-light font-bold">THRESHOLD / CUTOFF:</span>
              <input
                type="range"
                min="30"
                max="220"
                step="5"
                value={filterOptions.threshold}
                onChange={(e) => onOptionsChange({ ...filterOptions, threshold: parseInt(e.target.value) })}
                className="w-24 accent-status-amber cursor-pointer h-1.5 bg-tactical-dark"
              />
              <span className="text-[10px] text-status-amber font-bold w-8">{filterOptions.threshold}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOptionsChange({ contrast: 1.4, threshold: 128, edgeSensitivity: 1.5, tint: 'MONO', zoom: 1.0 })}
            className="px-2 py-0.5 bg-black border border-tactical-olive text-[10px] text-gray-400 hover:text-white"
          >
            ⟲ RESET CONTROLS
          </button>
        </div>
      )}

      {/* SECTION 4: ACTIVE FILTER TELEMETRY & TACTICAL PURPOSE BANNER */}
      <div className="bg-black/60 border border-tactical-olive/60 px-3 py-1 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-3">
          <span className="text-tactical-light font-bold">ACTIVE FILTER:</span>
          <span className="text-white font-bold bg-tactical-olive/60 px-2 py-0.2 border border-tactical-green">
            {activeFilterInfo?.name || activeFilter} [{activeFilterInfo?.tag || 'SURVEILLANCE'}]
          </span>
          <span className="text-tactical-olive">|</span>
          <span className="text-gray-300 font-sans text-[11px] truncate max-w-[650px]">
            {activeFilterInfo?.desc}
          </span>
        </div>

        <div className="text-[10px] text-status-green flex items-center space-x-2 font-mono">
          <span>SCOPE: <strong className="text-status-amber">{selectedScope === 'ALL' ? 'GLOBAL (ALL 8 FEEDS)' : `TARGET: CAM-${selectedScope}`}</strong></span>
          <span className="text-tactical-olive">|</span>
          <span className="text-tactical-light">GPU ACCELERATED</span>
        </div>
      </div>

    </div>
  );
};

