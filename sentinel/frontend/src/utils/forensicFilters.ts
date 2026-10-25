/**
 * SENTINEL — Tactical Forensic Image & Video Processing Engine
 * 
 * Provides real-time spatial convolution filters, pseudo-color thermal heatmaps,
 * luminance isolation, and edge detection to assist human operators in verifying
 * targets of interest (UAV/drones, dismounted human infiltrators, camouflaged assets).
 */

export type ForensicFilterMode = 
  | 'RAW'
  | 'GRAYSCALE'
  | 'SOBEL'
  | 'THERMAL_FLIR'
  | 'LAPLACIAN_SHARPEN'
  | 'NIGHT_VISION'
  | 'THRESHOLD'
  | 'NEGATIVE';

export type TargetClassification = 
  | 'DRONE_UAV'
  | 'HUMAN_INFILTRATION'
  | 'CAMOUFLAGED_ASSET'
  | 'STRUCTURAL_BREACH'
  | 'THERMAL_HOTSPOT'
  | 'BENIGN_ACTIVITY';

export type ForensicConfidence = 
  | 'CONFIRMED'
  | 'PROBABLE'
  | 'SUSPICIOUS'
  | 'BENIGN';

export interface ForensicWriteup {
  id: string;
  camId: string;
  camName: string;
  timecode: string;
  filterUsed: ForensicFilterMode;
  targetClass: TargetClassification;
  confidence: ForensicConfidence;
  analyst: string;
  notes: string;
  timestamp: string;
  flaggedForFollowup: boolean;
  alertId?: string;
}

export interface ForensicFilterOptions {
  contrast: number;      // 1.0 to 3.0
  threshold: number;     // 0 to 255 (default 128)
  edgeSensitivity: number; // 0.5 to 3.0
  tint: 'MONO' | 'GREEN_TACTICAL' | 'CYAN_GRID';
  zoom: number;          // 1.0 to 3.0
}

export const TARGET_LABELS: Record<TargetClassification, { label: string; icon: string; desc: string; badgeClass: string }> = {
  DRONE_UAV: {
    label: 'DRONE / UAV INTRUSION',
    icon: '🛸',
    desc: 'Unmanned aerial vehicle, quadcopter, or fixed-wing loitering munition signature.',
    badgeClass: 'bg-red-950/80 border-status-red text-status-red'
  },
  HUMAN_INFILTRATION: {
    label: 'HUMAN INFILTRATION',
    icon: '🚶',
    desc: 'Dismounted personnel, boundary/perimeter trespasser, or patrol anomaly.',
    badgeClass: 'bg-orange-950/80 border-orange-500 text-orange-400'
  },
  CAMOUFLAGED_ASSET: {
    label: 'CAMOUFLAGED ASSET / VEHICLE',
    icon: '🛡️',
    desc: 'Artificial concealment, camouflage netting, military canvas, or disguised hardware.',
    badgeClass: 'bg-amber-950/80 border-status-amber text-status-amber'
  },
  STRUCTURAL_BREACH: {
    label: 'PERIMETER / STRUCTURAL BREACH',
    icon: '🚧',
    desc: 'Cut fence, damaged gate, barrier displacement, or excavation near perimeter sensor line.',
    badgeClass: 'bg-purple-950/80 border-purple-400 text-purple-300'
  },
  THERMAL_HOTSPOT: {
    label: 'THERMAL EXHAUST / HOTSPOT',
    icon: '🔥',
    desc: 'Anomalous infrared heat signature, engine block, battery exhaust, or campfire.',
    badgeClass: 'bg-rose-950/80 border-rose-400 text-rose-300'
  },
  BENIGN_ACTIVITY: {
    label: 'BENIGN / AUTHORIZED ACTIVITY',
    icon: '🌿',
    desc: 'Authorized maintenance crew, wildlife, environmental foliage movement, or false cue.',
    badgeClass: 'bg-emerald-950/80 border-status-green text-status-green'
  }
};

export const FILTER_DESCRIPTIONS: Record<ForensicFilterMode, { name: string; tag: string; desc: string }> = {
  RAW: {
    name: 'RAW OPTICAL',
    tag: 'PASSTHROUGH',
    desc: 'Standard un-manipulated sensor footage direct from camera stream.'
  },
  GRAYSCALE: {
    name: 'MONOCHROME IR',
    tag: 'LUMINANCE',
    desc: 'Removes chromatic distraction to evaluate pure optical luminance & shadow dynamics.'
  },
  SOBEL: {
    name: 'SOBEL 3x3 EDGE',
    tag: 'GRADIENT',
    desc: 'Calculates spatial gradient magnitude to outline geometric borders, drone frames, and netting seams.'
  },
  THERMAL_FLIR: {
    name: 'THERMAL FLIR (IRONBOW)',
    tag: 'PSEUDO-COLOR',
    desc: 'Maps intensity to military Ironbow heat spectrum (dark purple -> vivid red -> amber -> bright white).'
  },
  LAPLACIAN_SHARPEN: {
    name: 'LAPLACIAN HIGH-PASS',
    tag: 'SHARPEN',
    desc: 'High-pass spatial frequency filter accentuating rotor blades, wire fences, and tiny aerial targets.'
  },
  NIGHT_VISION: {
    name: 'NIGHT VISION (NVG)',
    tag: 'PHOSPHOR',
    desc: 'Simulates Gen-3 night-vision intensifier tube phosphor green spectrum for low-light evaluation.'
  },
  THRESHOLD: {
    name: 'BINARY SILHOUETTE',
    tag: 'SEGMENTATION',
    desc: 'High-contrast threshold isolating moving silhouettes of intruders or UAVs against uniform sky/terrain.'
  },
  NEGATIVE: {
    name: 'NEGATIVE / INVERT',
    tag: 'INVERSION',
    desc: 'Inverts tonal values to reveal occult heat or objects concealed in deep shadowed foliage.'
  }
};

/**
 * Pre-computed 256-entry military Ironbow Thermal Look-Up Table (LUT)
 * Produces smooth, realistic FLIR false-color thermal signatures.
 */
const IRONBOW_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const idx = i * 3;
    if (i < 64) {
      // 0 - 63: Black (0, 0, 16) -> Deep Violet/Purple (72, 0, 140)
      const f = i / 64;
      lut[idx] = Math.round(f * 72);
      lut[idx + 1] = 0;
      lut[idx + 2] = Math.round(16 + f * 124);
    } else if (i < 128) {
      // 64 - 127: Deep Purple -> Crimson / Vivid Red (220, 20, 60)
      const f = (i - 64) / 64;
      lut[idx] = Math.round(72 + f * 148);
      lut[idx + 1] = Math.round(f * 20);
      lut[idx + 2] = Math.round(140 * (1 - f) + 60 * f);
    } else if (i < 192) {
      // 128 - 191: Vivid Red -> Amber / Orange (255, 150, 0)
      const f = (i - 128) / 64;
      lut[idx] = Math.round(220 + f * 35);
      lut[idx + 1] = Math.round(20 + f * 130);
      lut[idx + 2] = Math.round(60 * (1 - f));
    } else {
      // 192 - 255: Amber / Orange -> Bright White (255, 255, 255)
      const f = (i - 192) / 64;
      lut[idx] = 255;
      lut[idx + 1] = Math.round(150 + f * 105);
      lut[idx + 2] = Math.round(f * 255);
    }
  }
  return lut;
})();

/**
 * Executes high-performance spatial image processing directly on ImageData.
 * Operates in 2-4 milliseconds for real-time video playback at 30-60 FPS.
 */
export function processFrameBuffer(
  srcData: ImageData,
  dstData: ImageData,
  filter: ForensicFilterMode,
  options: ForensicFilterOptions
): void {
  const width = srcData.width;
  const height = srcData.height;
  const src = srcData.data;
  const dst = dstData.data;
  const contrast = options.contrast || 1.0;
  const threshold = options.threshold || 128;
  const edgeSens = options.edgeSensitivity || 1.2;

  // Fast Pass: Grayscale / Luminance buffer for convolution filters
  const lum = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    // Standard perceptual luminance: Y = 0.299R + 0.587G + 0.114B
    let y = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    if (contrast !== 1.0) {
      y = (y - 128) * contrast + 128;
      if (y < 0) y = 0; else if (y > 255) y = 255;
    }
    lum[j] = y;
  }

  switch (filter) {
    case 'RAW': {
      // Direct pass-through
      dst.set(src);
      break;
    }

    case 'GRAYSCALE': {
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const y = lum[j];
        dst[i] = y;
        dst[i + 1] = y;
        dst[i + 2] = y;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'SOBEL': {
      // 3x3 Sobel Edge Detection
      // Gx = [-1 0 1; -2 0 2; -1 0 1]
      // Gy = [-1 -2 -1; 0 0 0; 1 2 1]
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const gx = 
            -lum[rowPrev + x - 1] + lum[rowPrev + x + 1]
            - 2 * lum[rowCurr + x - 1] + 2 * lum[rowCurr + x + 1]
            - lum[rowNext + x - 1] + lum[rowNext + x + 1];

          const gy = 
            -lum[rowPrev + x - 1] - 2 * lum[rowPrev + x] - lum[rowPrev + x + 1]
            + lum[rowNext + x - 1] + 2 * lum[rowNext + x] + lum[rowNext + x + 1];

          let mag = Math.hypot(gx, gy) * edgeSens;
          if (mag > 255) mag = 255;

          const idx = (rowCurr + x) * 4;
          if (options.tint === 'GREEN_TACTICAL') {
            dst[idx] = Math.round(mag * 0.2);
            dst[idx + 1] = Math.round(mag);
            dst[idx + 2] = Math.round(mag * 0.3);
          } else if (options.tint === 'CYAN_GRID') {
            dst[idx] = Math.round(mag * 0.1);
            dst[idx + 1] = Math.round(mag * 0.9);
            dst[idx + 2] = Math.round(mag);
          } else {
            dst[idx] = mag;
            dst[idx + 1] = mag;
            dst[idx + 2] = mag;
          }
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'THERMAL_FLIR': {
      // Military FLIR Ironbow Pseudo-Color Mapping
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const val = lum[j];
        const lutIdx = val * 3;
        dst[i] = IRONBOW_LUT[lutIdx];
        dst[i + 1] = IRONBOW_LUT[lutIdx + 1];
        dst[i + 2] = IRONBOW_LUT[lutIdx + 2];
        dst[i + 3] = 255;
      }
      break;
    }

    case 'LAPLACIAN_SHARPEN': {
      // 3x3 Laplacian High-Pass Convolution Kernel: [0 -1 0; -1 5 -1; 0 -1 0]
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const idx = (rowCurr + x) * 4;
          for (let c = 0; c < 3; c++) {
            const v = 
              5 * src[idx + c]
              - src[((rowPrev + x) * 4) + c]
              - src[((rowNext + x) * 4) + c]
              - src[((rowCurr + x - 1) * 4) + c]
              - src[((rowCurr + x + 1) * 4) + c];
            dst[idx + c] = v < 0 ? 0 : v > 255 ? 255 : v;
          }
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'NIGHT_VISION': {
      // Phosphor Green NVG Amplification
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const y = lum[j];
        dst[i] = Math.round(y * 0.15);
        dst[i + 1] = Math.min(255, Math.round(y * 1.5 + 25));
        dst[i + 2] = Math.round(y * 0.25);
        dst[i + 3] = 255;
      }
      break;
    }

    case 'THRESHOLD': {
      // Binary Silhouette Segmentation
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const b = lum[j] >= threshold ? 255 : 0;
        dst[i] = b;
        dst[i + 1] = b;
        dst[i + 2] = b;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'NEGATIVE': {
      // Invert Tonal Values
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 255 - src[i];
        dst[i + 1] = 255 - src[i + 1];
        dst[i + 2] = 255 - src[i + 2];
        dst[i + 3] = 255;
      }
      break;
    }
  }
}
