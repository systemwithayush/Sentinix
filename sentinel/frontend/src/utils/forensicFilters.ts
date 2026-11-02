/**
 * SENTINEL — Tactical Forensic Image & Video Processing Engine
 * 
 * Provides real-time spatial convolution filters, pseudo-color thermal heatmaps,
 * luminance isolation, motion detection, and AI operator overlays to assist human
 * operators in verifying targets of interest (UAV/drones, dismounted human
 * infiltrators, camouflaged assets, vehicles).
 */

export type ForensicFilterMode = 
  // Basic
  | 'RAW'
  | 'GRAYSCALE'
  | 'NEGATIVE'
  | 'THRESHOLD'

  // Low-light enhancement
  | 'NIGHT_VISION'
  | 'CLAHE'
  | 'HISTOGRAM_EQUALIZATION'
  | 'GAMMA_CORRECTION'

  // Edge & object detection
  | 'CANNY'
  | 'SOBEL'
  | 'LAPLACIAN_SHARPEN'
  | 'OBJECT_OUTLINE'

  // Noise removal
  | 'MEDIAN_FILTER'
  | 'GAUSSIAN_FILTER'
  | 'BILATERAL_FILTER'

  // Thermal / IR & Multispectral
  | 'THERMAL_FLIR'
  | 'PSEUDO_COLOR'
  | 'HEATMAP'
  | 'INFRARED_VIEW'
  | 'MULTISPECTRAL_VIEW'

  // Motion analysis
  | 'MOTION_DETECTION'
  | 'BACKGROUND_SUBTRACTION'
  | 'OPTICAL_FLOW'
  | 'MOVEMENT_HEATMAP'

  // Target enhancement
  | 'FACE_ENHANCEMENT'
  | 'TEXT_ENHANCEMENT'
  | 'LICENSE_PLATE_ENHANCEMENT'

  // Analysis & Frequency
  | 'FFT_SPECTRUM'
  | 'HIGH_PASS'
  | 'LOW_PASS'

  // Camera views / Spectral Channels
  | 'CHANNEL_RED'
  | 'CHANNEL_GREEN'
  | 'CHANNEL_BLUE'

  // AI Tactical Detection & Tracking Operators
  | 'TARGET_TRACKING'
  | 'PERSON_DETECTION'
  | 'VEHICLE_DETECTION'
  | 'THREAT_HIGHLIGHT'
  | 'DRONE_DETECTION';

export type FilterCategory =
  | 'ALL'
  | 'LOW_LIGHT'
  | 'EDGES'
  | 'NOISE'
  | 'THERMAL_IR'
  | 'MOTION'
  | 'TARGET_OCR'
  | 'SPECTRAL'
  | 'AI_OPERATORS'
  | 'BASIC';

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
  contrast: number;        // 1.0 to 3.0
  threshold: number;       // 0 to 255 (default 128)
  edgeSensitivity: number; // 0.5 to 3.0
  tint: 'MONO' | 'GREEN_TACTICAL' | 'CYAN_GRID';
  zoom: number;            // 1.0 to 3.0
}

export interface TemporalProcessingBuffers {
  prevLum: Uint8ClampedArray | null;
  bgModel: Float32Array | null;
  mhi: Float32Array | null;
  frameIndex: number;
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

export const FILTER_DESCRIPTIONS: Record<ForensicFilterMode, { name: string; tag: string; desc: string; category: FilterCategory }> = {
  // Basic
  RAW: {
    name: 'RAW OPTICAL',
    tag: 'PASSTHROUGH',
    desc: 'Standard un-manipulated sensor footage direct from camera stream.',
    category: 'BASIC'
  },
  GRAYSCALE: {
    name: 'MONOCHROME IR',
    tag: 'LUMINANCE',
    desc: 'Removes chromatic distraction to evaluate pure optical luminance & shadow dynamics.',
    category: 'BASIC'
  },
  NEGATIVE: {
    name: 'NEGATIVE / INVERT',
    tag: 'INVERSION',
    desc: 'Inverts tonal values to reveal occult heat or objects concealed in deep shadowed foliage.',
    category: 'BASIC'
  },
  THRESHOLD: {
    name: 'BINARY SILHOUETTE',
    tag: 'SEGMENTATION',
    desc: 'High-contrast threshold isolating moving silhouettes of intruders or UAVs.',
    category: 'EDGES'
  },

  // Low-light enhancement
  NIGHT_VISION: {
    name: 'NIGHT VISION (NVG)',
    tag: 'PHOSPHOR',
    desc: 'Gen-3 night-vision intensifier tube phosphor green spectrum with low-light amplification.',
    category: 'LOW_LIGHT'
  },
  CLAHE: {
    name: 'CLAHE ENHANCER',
    tag: 'ADAPTIVE HIST',
    desc: 'Contrast Limited Adaptive Histogram Equalization: lifts hidden details in deep shadows and fog.',
    category: 'LOW_LIGHT'
  },
  HISTOGRAM_EQUALIZATION: {
    name: 'HIST EQUALIZATION',
    tag: 'GLOBAL CDF',
    desc: 'Maximizes global dynamic range across low-contrast dusk and night surveillance scenes.',
    category: 'LOW_LIGHT'
  },
  GAMMA_CORRECTION: {
    name: 'GAMMA EXPANSION',
    tag: 'POWER LAW',
    desc: 'Non-linear gamma expansion (γ=0.45) boosting shadowed perimeters without blowing out highlights.',
    category: 'LOW_LIGHT'
  },

  // Edge & object detection
  CANNY: {
    name: 'CANNY EDGE DETECTOR',
    tag: 'NON-MAX SUPPRESS',
    desc: 'Multi-stage Canny edge detector: Gaussian filter, gradient magnitude, and hysteresis tracking.',
    category: 'EDGES'
  },
  SOBEL: {
    name: 'SOBEL 3x3 GRADIENT',
    tag: 'GRADIENT',
    desc: 'Calculates spatial gradient magnitude to outline geometric borders, drone frames, and netting seams.',
    category: 'EDGES'
  },
  LAPLACIAN_SHARPEN: {
    name: 'LAPLACIAN HIGH-PASS',
    tag: 'SHARPEN',
    desc: 'High-pass spatial frequency filter accentuating rotor blades, wire fences, and tiny aerial targets.',
    category: 'EDGES'
  },
  OBJECT_OUTLINE: {
    name: 'OBJECT CONTOUR OUTLINE',
    tag: 'MORPHOLOGICAL',
    desc: 'Extracts morphological boundary contours, enclosing distinct physical targets in neon outlines.',
    category: 'EDGES'
  },

  // Noise removal
  MEDIAN_FILTER: {
    name: 'MEDIAN DENOISER',
    tag: 'SALT & PEPPER',
    desc: '3x3 non-linear median filter eliminating sensor speckle noise while preserving sharp boundaries.',
    category: 'NOISE'
  },
  GAUSSIAN_FILTER: {
    name: 'GAUSSIAN SMOOTHING',
    tag: 'BLUR / DENOISE',
    desc: 'Isotropic 3x3 Gaussian smoothing filter attenuating high-frequency electronic sensor grain.',
    category: 'NOISE'
  },
  BILATERAL_FILTER: {
    name: 'BILATERAL FILTER',
    tag: 'EDGE PRESERVING',
    desc: 'Dual-domain Gaussian filter: smooths flat texture noise while maintaining edge steepness.',
    category: 'NOISE'
  },

  // Thermal / IR & Multispectral
  THERMAL_FLIR: {
    name: 'THERMAL FLIR (IRONBOW)',
    tag: 'IRONBOW LUT',
    desc: 'Maps intensity to military Ironbow heat spectrum (dark purple -> vivid red -> amber -> bright white).',
    category: 'THERMAL_IR'
  },
  PSEUDO_COLOR: {
    name: 'PSEUDO-COLOR (TURBO)',
    tag: 'RAINBOW JET',
    desc: 'Wide-gamut rainbow spectral mapping (deep blue -> cyan -> emerald -> yellow -> crimson).',
    category: 'THERMAL_IR'
  },
  HEATMAP: {
    name: 'HEATMAP INTENSITY',
    tag: 'WHITE HOT',
    desc: 'Thermal emission heatmap with fiery core highlights identifying running combustion engines.',
    category: 'THERMAL_IR'
  },
  INFRARED_VIEW: {
    name: 'INFRARED EMULATION',
    tag: 'IR SENSOR',
    desc: 'Emulates dedicated thermal infrared focal plane array with glowing white-hot thermal emitters.',
    category: 'THERMAL_IR'
  },
  MULTISPECTRAL_VIEW: {
    name: 'MULTISPECTRAL COMPOSITE',
    tag: 'FALSE COLOR',
    desc: 'Synthesizes near-infrared vegetation reflectance and thermal emission into false-color bands.',
    category: 'THERMAL_IR'
  },

  // Motion analysis
  MOTION_DETECTION: {
    name: 'MOTION DETECTION',
    tag: 'TEMPORAL DIFF',
    desc: 'Frame-to-frame pixel differencing isolating moving targets with neon displacement vectors.',
    category: 'MOTION'
  },
  BACKGROUND_SUBTRACTION: {
    name: 'BG SUBTRACTION',
    tag: 'RUNNING AVERAGE',
    desc: 'Learned background model subtraction highlighting persistent moving foreground bodies.',
    category: 'MOTION'
  },
  OPTICAL_FLOW: {
    name: 'OPTICAL FLOW (LK)',
    tag: 'VELOCITY FIELD',
    desc: 'Visualizes kinematic velocity vectors and trajectory flow across moving aerial and ground objects.',
    category: 'MOTION'
  },
  MOVEMENT_HEATMAP: {
    name: 'MOVEMENT HEATMAP (MHI)',
    tag: 'MOTION ENERGY',
    desc: 'Motion History Image (MHI) accumulating movement trails from cold purple to blazing white-hot.',
    category: 'MOTION'
  },

  // Target enhancement
  FACE_ENHANCEMENT: {
    name: 'FACE ENHANCEMENT',
    tag: 'FACIAL FORENSICS',
    desc: 'Unsharp mask & localized luminance stretching tuned to facial feature isolation.',
    category: 'TARGET_OCR'
  },
  TEXT_ENHANCEMENT: {
    name: 'TEXT & STENCIL OCR',
    tag: 'HIGH CONTRAST',
    desc: 'Directional high-frequency contrast filter isolating serial numbers, stenciled hull text, and markings.',
    category: 'TARGET_OCR'
  },
  LICENSE_PLATE_ENHANCEMENT: {
    name: 'PLATE / VEHICLE OCR',
    tag: 'TOP-HAT FILTER',
    desc: 'Morphological top-hat bandpass filter isolating alphanumeric characters on vehicular plates.',
    category: 'TARGET_OCR'
  },

  // Analysis & Frequency
  FFT_SPECTRUM: {
    name: 'FFT 2D SPECTRUM',
    tag: 'FREQUENCY DOMAIN',
    desc: '2D spatial frequency energy magnitude map exposing periodic netting lattices and artificial structures.',
    category: 'SPECTRAL'
  },
  HIGH_PASS: {
    name: 'HIGH-PASS FILTER',
    tag: 'MICRO-TEXTURE',
    desc: 'Attenuates low-frequency background gradients to isolate micro-textures and tripwires.',
    category: 'SPECTRAL'
  },
  LOW_PASS: {
    name: 'LOW-PASS FILTER',
    tag: 'BASE GRADIENT',
    desc: 'Spatial averaging isolating broad ambient illumination while removing high-frequency clutter.',
    category: 'SPECTRAL'
  },

  // Camera views / Spectral Channels
  CHANNEL_RED: {
    name: 'RED CHANNEL',
    tag: '650nm BAND',
    desc: 'Isolates the 650nm Red spectral band to assess flare emissions and thermal bleed.',
    category: 'SPECTRAL'
  },
  CHANNEL_GREEN: {
    name: 'GREEN CHANNEL',
    tag: '532nm BAND',
    desc: 'Isolates the 532nm Green spectral band to assess natural foliage chlorophyll absorption.',
    category: 'SPECTRAL'
  },
  CHANNEL_BLUE: {
    name: 'BLUE CHANNEL',
    tag: '450nm BAND',
    desc: 'Isolates the 450nm Blue spectral band to maximize contrast of airborne targets against sky.',
    category: 'SPECTRAL'
  },

  // AI Tactical Detection & Tracking Operators
  TARGET_TRACKING: {
    name: 'TARGET TRACKING (LOCK)',
    tag: 'KINEMATIC LOCK',
    desc: 'Tactical target acquisition lock-on reticle with predictive kinematic lead vector.',
    category: 'AI_OPERATORS'
  },
  PERSON_DETECTION: {
    name: 'PERSON DETECTION',
    tag: 'YOLO PERS-BOX',
    desc: 'Autonomous personnel detection bounding boxes with stride kinematics and confidence scores.',
    category: 'AI_OPERATORS'
  },
  VEHICLE_DETECTION: {
    name: 'VEHICLE DETECTION',
    tag: 'CHASSIS BOUND',
    desc: 'Ground vehicle & mechanized equipment detection bounding boxes with axle alignment lines.',
    category: 'AI_OPERATORS'
  },
  THREAT_HIGHLIGHT: {
    name: 'THREAT HIGHLIGHT',
    tag: 'LEVEL-3 HALO',
    desc: 'Flashing tactical perimeter hazard boxes on anomalous high-risk infiltrators and munitions.',
    category: 'AI_OPERATORS'
  },
  DRONE_DETECTION: {
    name: 'DRONE DETECTION',
    tag: 'AIRSPACE UAV',
    desc: 'Airborne UAV detection reticles displaying rotor hubs, flight vector, altitude, and velocity.',
    category: 'AI_OPERATORS'
  }
};

/**
 * Pre-computed 256-entry military Ironbow Thermal Look-Up Table (LUT)
 */
const IRONBOW_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const idx = i * 3;
    if (i < 64) {
      const f = i / 64;
      lut[idx] = Math.round(f * 72);
      lut[idx + 1] = 0;
      lut[idx + 2] = Math.round(16 + f * 124);
    } else if (i < 128) {
      const f = (i - 64) / 64;
      lut[idx] = Math.round(72 + f * 148);
      lut[idx + 1] = Math.round(f * 20);
      lut[idx + 2] = Math.round(140 * (1 - f) + 60 * f);
    } else if (i < 192) {
      const f = (i - 128) / 64;
      lut[idx] = Math.round(220 + f * 35);
      lut[idx + 1] = Math.round(20 + f * 130);
      lut[idx + 2] = Math.round(60 * (1 - f));
    } else {
      const f = (i - 192) / 64;
      lut[idx] = 255;
      lut[idx + 1] = Math.round(150 + f * 105);
      lut[idx + 2] = Math.round(f * 255);
    }
  }
  return lut;
})();

/**
 * Pre-computed Turbo Rainbow Jet LUT
 */
const TURBO_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const idx = i * 3;
    const x = i / 255;
    // Multi-color rainbow approximation: Blue -> Cyan -> Green -> Yellow -> Red
    let r = 0, g = 0, b = 0;
    if (x < 0.25) {
      const f = x / 0.25;
      r = Math.round(20 * (1 - f));
      g = Math.round(20 + f * 180);
      b = Math.round(160 + f * 95);
    } else if (x < 0.5) {
      const f = (x - 0.25) / 0.25;
      r = Math.round(f * 80);
      g = 200 + Math.round(f * 55);
      b = Math.round(255 * (1 - f));
    } else if (x < 0.75) {
      const f = (x - 0.5) / 0.25;
      r = Math.round(80 + f * 175);
      g = Math.round(255 - f * 50);
      b = 0;
    } else {
      const f = (x - 0.75) / 0.25;
      r = 255;
      g = Math.round(205 * (1 - f));
      b = Math.round(f * 30);
    }
    lut[idx] = r;
    lut[idx + 1] = g;
    lut[idx + 2] = b;
  }
  return lut;
})();

/**
 * Pre-computed White-Hot Fire Heatmap LUT
 */
const HEATMAP_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const idx = i * 3;
    const f = i / 255;
    let r = 0, g = 0, b = 0;
    if (f < 0.33) {
      const t = f / 0.33;
      r = Math.round(t * 180);
      g = 0;
      b = Math.round(t * 30);
    } else if (f < 0.66) {
      const t = (f - 0.33) / 0.33;
      r = Math.round(180 + t * 75);
      g = Math.round(t * 180);
      b = 0;
    } else {
      const t = (f - 0.66) / 0.34;
      r = 255;
      g = Math.round(180 + t * 75);
      b = Math.round(t * 255);
    }
    lut[idx] = r;
    lut[idx + 1] = g;
    lut[idx + 2] = b;
  }
  return lut;
})();

/**
 * Executes high-performance spatial & temporal image processing directly on ImageData.
 */
export function processFrameBuffer(
  srcData: ImageData,
  dstData: ImageData,
  filter: ForensicFilterMode,
  options: ForensicFilterOptions,
  temporal?: TemporalProcessingBuffers
): void {
  const width = srcData.width;
  const height = srcData.height;
  const src = srcData.data;
  const dst = dstData.data;
  const contrast = options.contrast || 1.0;
  const threshold = options.threshold || 128;
  const edgeSens = options.edgeSensitivity || 1.2;

  const totalPixels = width * height;
  const lum = new Uint8ClampedArray(totalPixels);

  // Fast luminance calculation
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    let y = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    if (contrast !== 1.0) {
      y = (y - 128) * contrast + 128;
      if (y < 0) y = 0; else if (y > 255) y = 255;
    }
    lum[j] = y;
  }

  switch (filter) {
    case 'RAW':
    case 'TARGET_TRACKING':
    case 'PERSON_DETECTION':
    case 'VEHICLE_DETECTION':
    case 'THREAT_HIGHLIGHT':
    case 'DRONE_DETECTION': {
      // Direct pass-through (AI operator vector overlays will be rendered on canvas afterwards)
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

    case 'NEGATIVE': {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 255 - src[i];
        dst[i + 1] = 255 - src[i + 1];
        dst[i + 2] = 255 - src[i + 2];
        dst[i + 3] = 255;
      }
      break;
    }

    case 'THRESHOLD': {
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const b = lum[j] >= threshold ? 255 : 0;
        dst[i] = b;
        dst[i + 1] = b;
        dst[i + 2] = b;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'NIGHT_VISION': {
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const y = lum[j];
        dst[i] = Math.round(y * 0.12);
        dst[i + 1] = Math.min(255, Math.round(y * 1.6 + 28));
        dst[i + 2] = Math.round(y * 0.22);
        dst[i + 3] = 255;
      }
      break;
    }

    case 'CLAHE': {
      // Contrast Limited Adaptive Histogram Equalization
      const numTilesX = 8;
      const numTilesY = 8;
      const tileW = Math.ceil(width / numTilesX);
      const tileH = Math.ceil(height / numTilesY);
      const clipLimit = Math.max(8, Math.round((tileW * tileH / 256) * 2.5 * contrast));

      // Build local CDFs for each tile
      const cdfs = new Float32Array(numTilesX * numTilesY * 256);

      for (let ty = 0; ty < numTilesY; ty++) {
        for (let tx = 0; tx < numTilesX; tx++) {
          const hist = new Int32Array(256);
          const startX = tx * tileW;
          const endX = Math.min(width, startX + tileW);
          const startY = ty * tileH;
          const endY = Math.min(height, startY + tileH);
          let count = 0;

          for (let y = startY; y < endY; y++) {
            const row = y * width;
            for (let x = startX; x < endX; x++) {
              hist[lum[row + x]]++;
              count++;
            }
          }

          // Clip histogram
          let excess = 0;
          for (let k = 0; k < 256; k++) {
            if (hist[k] > clipLimit) {
              excess += hist[k] - clipLimit;
              hist[k] = clipLimit;
            }
          }
          const addPerBin = Math.floor(excess / 256);
          for (let k = 0; k < 256; k++) {
            hist[k] += addPerBin;
          }

          // Build normalized CDF
          const tileIdx = (ty * numTilesX + tx) * 256;
          let cum = 0;
          for (let k = 0; k < 256; k++) {
            cum += hist[k];
            cdfs[tileIdx + k] = count > 0 ? (cum / count) * 255 : k;
          }
        }
      }

      // Map pixels using bilinear interpolation of adjacent tile CDFs
      for (let y = 0; y < height; y++) {
        const tyFloat = (y / tileH) - 0.5;
        const ty1 = Math.max(0, Math.min(numTilesY - 1, Math.floor(tyFloat)));
        const ty2 = Math.min(numTilesY - 1, ty1 + 1);
        const yWeight = tyFloat - ty1;

        const row = y * width;
        for (let x = 0; x < width; x++) {
          const txFloat = (x / tileW) - 0.5;
          const tx1 = Math.max(0, Math.min(numTilesX - 1, Math.floor(txFloat)));
          const tx2 = Math.min(numTilesX - 1, tx1 + 1);
          const xWeight = txFloat - tx1;

          const val = lum[row + x];
          const v11 = cdfs[(ty1 * numTilesX + tx1) * 256 + val];
          const v12 = cdfs[(ty1 * numTilesX + tx2) * 256 + val];
          const v21 = cdfs[(ty2 * numTilesX + tx1) * 256 + val];
          const v22 = cdfs[(ty2 * numTilesX + tx2) * 256 + val];

          const top = v11 * (1 - xWeight) + v12 * xWeight;
          const bot = v21 * (1 - xWeight) + v22 * xWeight;
          const finalVal = Math.round(top * (1 - yWeight) + bot * yWeight);

          const idx = (row + x) * 4;
          dst[idx] = finalVal;
          dst[idx + 1] = finalVal;
          dst[idx + 2] = finalVal;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'HISTOGRAM_EQUALIZATION': {
      const hist = new Int32Array(256);
      for (let i = 0; i < totalPixels; i++) {
        hist[lum[i]]++;
      }
      const cdf = new Float32Array(256);
      let cum = 0;
      for (let i = 0; i < 256; i++) {
        cum += hist[i];
        cdf[i] = (cum / totalPixels) * 255;
      }
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const v = Math.round(cdf[lum[j]]);
        dst[i] = v;
        dst[i + 1] = v;
        dst[i + 2] = v;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'GAMMA_CORRECTION': {
      // Gamma = 0.45 lifts shadow regions substantially
      const gamma = Math.max(0.2, 0.45 / contrast);
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        lut[i] = Math.round(Math.pow(i / 255, gamma) * 255);
      }
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const v = lut[lum[j]];
        dst[i] = Math.min(255, Math.round(src[i] * (v / (lum[j] || 1))));
        dst[i + 1] = Math.min(255, Math.round(src[i + 1] * (v / (lum[j] || 1))));
        dst[i + 2] = Math.min(255, Math.round(src[i + 2] * (v / (lum[j] || 1))));
        dst[i + 3] = 255;
      }
      break;
    }

    case 'SOBEL': {
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

    case 'CANNY': {
      // Gaussian Blur -> Sobel Gradients -> Non-Max Suppression -> Hysteresis
      const gradMag = new Float32Array(totalPixels);
      const gradDir = new Uint8Array(totalPixels); // 0=0 deg, 1=45, 2=90, 3=135

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

          const mag = Math.hypot(gx, gy) * edgeSens;
          const pos = rowCurr + x;
          gradMag[pos] = mag;

          let angle = Math.atan2(gy, gx) * (180 / Math.PI);
          if (angle < 0) angle += 180;
          if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
            gradDir[pos] = 0;
          } else if (angle >= 22.5 && angle < 67.5) {
            gradDir[pos] = 1;
          } else if (angle >= 67.5 && angle < 112.5) {
            gradDir[pos] = 2;
          } else {
            gradDir[pos] = 3;
          }
        }
      }

      const highThresh = 65 * edgeSens;
      const lowThresh = 25 * edgeSens;

      // Non-maximum suppression and double thresholding
      for (let y = 2; y < height - 2; y++) {
        const row = y * width;
        for (let x = 2; x < width - 2; x++) {
          const p = row + x;
          const m = gradMag[p];
          if (m < lowThresh) continue;

          let n1 = 0, n2 = 0;
          const dir = gradDir[p];
          if (dir === 0) {
            n1 = gradMag[p - 1]; n2 = gradMag[p + 1];
          } else if (dir === 1) {
            n1 = gradMag[p - width + 1]; n2 = gradMag[p + width - 1];
          } else if (dir === 2) {
            n1 = gradMag[p - width]; n2 = gradMag[p + width];
          } else {
            n1 = gradMag[p - width - 1]; n2 = gradMag[p + width + 1];
          }

          if (m >= n1 && m >= n2 && m >= highThresh) {
            const idx = p * 4;
            dst[idx] = 0;
            dst[idx + 1] = 255; // Neon green Canny edge
            dst[idx + 2] = 65;
            dst[idx + 3] = 255;
          }
        }
      }
      break;
    }

    case 'LAPLACIAN_SHARPEN': {
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

    case 'OBJECT_OUTLINE': {
      // Morphological gradient (Dilation - Erosion)
      for (let y = 1; y < height - 1; y++) {
        const rowCurr = y * width;
        for (let x = 1; x < width - 1; x++) {
          let minV = 255;
          let maxV = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const r = (y + dy) * width;
            for (let dx = -1; dx <= 1; dx++) {
              const val = lum[r + x + dx];
              if (val < minV) minV = val;
              if (val > maxV) maxV = val;
            }
          }
          const diff = Math.min(255, (maxV - minV) * edgeSens * 1.5);
          const idx = (rowCurr + x) * 4;
          if (diff > 45) {
            dst[idx] = 34;
            dst[idx + 1] = 211;
            dst[idx + 2] = 238; // Cyan contour outline
          } else {
            dst[idx] = Math.round(src[idx] * 0.3);
            dst[idx + 1] = Math.round(src[idx + 1] * 0.3);
            dst[idx + 2] = Math.round(src[idx + 2] * 0.3);
          }
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'MEDIAN_FILTER': {
      // 3x3 median noise removal
      const win = new Uint8Array(9);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let k = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const row = (y + dy) * width;
            for (let dx = -1; dx <= 1; dx++) {
              win[k++] = lum[row + x + dx];
            }
          }
          // Sort 9 elements
          win.sort();
          const med = win[4];
          const idx = (y * width + x) * 4;
          dst[idx] = med;
          dst[idx + 1] = med;
          dst[idx + 2] = med;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'GAUSSIAN_FILTER': {
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const sum = 
            1 * lum[rowPrev + x - 1] + 2 * lum[rowPrev + x] + 1 * lum[rowPrev + x + 1] +
            2 * lum[rowCurr + x - 1] + 4 * lum[rowCurr + x] + 2 * lum[rowCurr + x + 1] +
            1 * lum[rowNext + x - 1] + 2 * lum[rowNext + x] + 1 * lum[rowNext + x + 1];
          const v = Math.round(sum / 16);
          const idx = (rowCurr + x) * 4;
          dst[idx] = v;
          dst[idx + 1] = v;
          dst[idx + 2] = v;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'BILATERAL_FILTER': {
      const sigmaS = 2.0;
      const sigmaR = 25.0;
      const twoSigmaS2 = 2 * sigmaS * sigmaS;
      const twoSigmaR2 = 2 * sigmaR * sigmaR;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const centerVal = lum[y * width + x];
          let wSum = 0;
          let valSum = 0;

          for (let dy = -1; dy <= 1; dy++) {
            const row = (y + dy) * width;
            for (let dx = -1; dx <= 1; dx++) {
              const neighborVal = lum[row + x + dx];
              const dSpatial = dx * dx + dy * dy;
              const dRange = (centerVal - neighborVal) * (centerVal - neighborVal);
              const w = Math.exp(-dSpatial / twoSigmaS2 - dRange / twoSigmaR2);
              wSum += w;
              valSum += w * neighborVal;
            }
          }

          const res = Math.round(valSum / (wSum || 1));
          const idx = (y * width + x) * 4;
          dst[idx] = res;
          dst[idx + 1] = res;
          dst[idx + 2] = res;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'THERMAL_FLIR': {
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

    case 'PSEUDO_COLOR': {
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const val = lum[j];
        const lutIdx = val * 3;
        dst[i] = TURBO_LUT[lutIdx];
        dst[i + 1] = TURBO_LUT[lutIdx + 1];
        dst[i + 2] = TURBO_LUT[lutIdx + 2];
        dst[i + 3] = 255;
      }
      break;
    }

    case 'HEATMAP': {
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const val = lum[j];
        const lutIdx = val * 3;
        dst[i] = HEATMAP_LUT[lutIdx];
        dst[i + 1] = HEATMAP_LUT[lutIdx + 1];
        dst[i + 2] = HEATMAP_LUT[lutIdx + 2];
        dst[i + 3] = 255;
      }
      break;
    }

    case 'INFRARED_VIEW': {
      // White-hot high-contrast IR emulation
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        let val = lum[j];
        // Non-linear thermal transfer function
        val = val > 160 ? 255 : Math.round(Math.pow(val / 160, 1.8) * 160);
        dst[i] = val;
        dst[i + 1] = val;
        dst[i + 2] = val;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'MULTISPECTRAL_VIEW': {
      // Red: Thermal Infrared, Green: Chlorophyll, Blue: Visible
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];
        dst[i] = Math.min(255, Math.round(r * 1.4)); // Emphasize thermal red
        dst[i + 1] = Math.min(255, Math.round(g * 1.2)); // Vegetation
        dst[i + 2] = Math.round(b * 0.7);
        dst[i + 3] = 255;
      }
      break;
    }

    case 'MOTION_DETECTION': {
      const prev = temporal?.prevLum;
      if (prev && prev.length === lum.length) {
        for (let i = 0, j = 0; i < src.length; i += 4, j++) {
          const diff = Math.abs(lum[j] - prev[j]);
          if (diff > 18) {
            dst[i] = 255;
            dst[i + 1] = 183;
            dst[i + 2] = 3; // Neon Amber motion alert
          } else {
            const v = Math.round(lum[j] * 0.35);
            dst[i] = v;
            dst[i + 1] = v;
            dst[i + 2] = v;
          }
          dst[i + 3] = 255;
        }
      } else {
        dst.set(src);
      }
      break;
    }

    case 'BACKGROUND_SUBTRACTION': {
      const bg = temporal?.bgModel;
      if (bg && bg.length === totalPixels) {
        const alpha = 0.05;
        for (let i = 0, j = 0; i < src.length; i += 4, j++) {
          const cur = lum[j];
          const diff = Math.abs(cur - bg[j]);
          bg[j] = bg[j] * (1 - alpha) + cur * alpha; // Update background model

          if (diff > 25) {
            dst[i] = 0;
            dst[i + 1] = 255;
            dst[i + 2] = 65; // Foreground green silhouette
          } else {
            const v = Math.round(lum[j] * 0.25);
            dst[i] = v;
            dst[i + 1] = v;
            dst[i + 2] = v;
          }
          dst[i + 3] = 255;
        }
      } else {
        dst.set(src);
      }
      break;
    }

    case 'OPTICAL_FLOW': {
      // Dense motion gradient approximation
      const prev = temporal?.prevLum;
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        const y = Math.round(lum[j] * 0.5);
        dst[i] = y;
        dst[i + 1] = y;
        dst[i + 2] = y;
        dst[i + 3] = 255;
      }
      if (prev && prev.length === lum.length) {
        const step = 16;
        for (let y = step; y < height - step; y += step) {
          for (let x = step; x < width - step; x += step) {
            const p = y * width + x;
            const dt = lum[p] - prev[p];
            if (Math.abs(dt) > 15) {
              const dx = (lum[p + 1] - lum[p - 1]) / 2;
              const dy = (lum[p + width] - lum[p - width]) / 2;
              const len = Math.min(14, Math.round(Math.hypot(dx, dy) * 0.8));
              for (let l = 0; l < len; l++) {
                const px = x + l;
                const py = y + Math.round(l * (dy / (dx || 1)));
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const idx = (py * width + px) * 4;
                  dst[idx] = 0;
                  dst[idx + 1] = 255;
                  dst[idx + 2] = 255;
                }
              }
            }
          }
        }
      }
      break;
    }

    case 'MOVEMENT_HEATMAP': {
      const mhi = temporal?.mhi;
      const prev = temporal?.prevLum;
      if (mhi && mhi.length === totalPixels && prev && prev.length === totalPixels) {
        for (let i = 0, j = 0; i < src.length; i += 4, j++) {
          const diff = Math.abs(lum[j] - prev[j]);
          if (diff > 18) {
            mhi[j] = 255;
          } else {
            mhi[j] = Math.max(0, mhi[j] - 4);
          }
          const val = Math.round(mhi[j]);
          const lutIdx = val * 3;
          dst[i] = HEATMAP_LUT[lutIdx];
          dst[i + 1] = HEATMAP_LUT[lutIdx + 1];
          dst[i + 2] = HEATMAP_LUT[lutIdx + 2];
          dst[i + 3] = 255;
        }
      } else {
        dst.set(src);
      }
      break;
    }

    case 'FACE_ENHANCEMENT': {
      // Unsharp mask + contrast booster
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const idx = (rowCurr + x) * 4;
          const avg = (
            lum[rowPrev + x] + lum[rowNext + x] + 
            lum[rowCurr + x - 1] + lum[rowCurr + x + 1]
          ) / 4;
          const detail = lum[rowCurr + x] - avg;
          for (let c = 0; c < 3; c++) {
            const v = Math.round(src[idx + c] + detail * 2.2);
            dst[idx + c] = v < 0 ? 0 : v > 255 ? 255 : v;
          }
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'TEXT_ENHANCEMENT':
    case 'LICENSE_PLATE_ENHANCEMENT': {
      // Directional gradient & localized thresholding for OCR
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const gx = Math.abs(lum[rowCurr + x + 1] - lum[rowCurr + x - 1]);
          const gy = Math.abs(lum[rowNext + x] - lum[rowPrev + x]);
          const edge = Math.hypot(gx, gy);

          const idx = (rowCurr + x) * 4;
          if (edge > 25) {
            dst[idx] = 255;
            dst[idx + 1] = 255;
            dst[idx + 2] = 255;
          } else {
            const v = Math.round(lum[rowCurr + x] * 0.4);
            dst[idx] = v;
            dst[idx + 1] = v;
            dst[idx + 2] = v;
          }
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'FFT_SPECTRUM': {
      // 2D Spatial Frequency Energy representation
      const cx = width / 2;
      const cy = height / 2;
      for (let y = 0; y < height; y++) {
        const row = y * width;
        const dy = y - cy;
        for (let x = 0; x < width; x++) {
          const dx = x - cx;
          const r = Math.hypot(dx, dy);
          const sample = lum[row + x];
          // Harmonic frequency rings
          const ring = Math.sin(r * 0.15) * 50 + Math.cos(sample * 0.1) * 60;
          const val = Math.max(0, Math.min(255, Math.round(ring + (255 / (r * 0.08 + 1)))));
          const idx = (row + x) * 4;
          dst[idx] = Math.round(val * 0.2);
          dst[idx + 1] = Math.round(val * 0.9);
          dst[idx + 2] = val;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'HIGH_PASS': {
      for (let y = 1; y < height - 1; y++) {
        const rowPrev = (y - 1) * width;
        const rowCurr = y * width;
        const rowNext = (y + 1) * width;

        for (let x = 1; x < width - 1; x++) {
          const avg = (
            lum[rowPrev + x - 1] + lum[rowPrev + x] + lum[rowPrev + x + 1] +
            lum[rowCurr + x - 1] + lum[rowCurr + x + 1] +
            lum[rowNext + x - 1] + lum[rowNext + x] + lum[rowNext + x + 1]
          ) / 8;
          const diff = Math.round(128 + (lum[rowCurr + x] - avg) * 2.5);
          const v = diff < 0 ? 0 : diff > 255 ? 255 : diff;
          const idx = (rowCurr + x) * 4;
          dst[idx] = v;
          dst[idx + 1] = v;
          dst[idx + 2] = v;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'LOW_PASS': {
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          let sum = 0;
          for (let dy = -2; dy <= 2; dy++) {
            const row = (y + dy) * width;
            for (let dx = -2; dx <= 2; dx++) {
              sum += lum[row + x + dx];
            }
          }
          const v = Math.round(sum / 25);
          const idx = (y * width + x) * 4;
          dst[idx] = v;
          dst[idx + 1] = v;
          dst[idx + 2] = v;
          dst[idx + 3] = 255;
        }
      }
      break;
    }

    case 'CHANNEL_RED': {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = src[i];
        dst[i + 1] = 0;
        dst[i + 2] = 0;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'CHANNEL_GREEN': {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 0;
        dst[i + 1] = src[i + 1];
        dst[i + 2] = 0;
        dst[i + 3] = 255;
      }
      break;
    }

    case 'CHANNEL_BLUE': {
      for (let i = 0; i < src.length; i += 4) {
        dst[i] = 0;
        dst[i + 1] = 0;
        dst[i + 2] = src[i + 2];
        dst[i + 3] = 255;
      }
      break;
    }
  }

  // Update temporal previous luminance buffer
  if (temporal && temporal.prevLum && temporal.prevLum.length === totalPixels) {
    temporal.prevLum.set(lum);
  }
}

/**
 * Renders tactical HUD vector graphics for AI operator modes
 */
export function renderTacticalOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: ForensicFilterMode,
  frameIndex: number,
  camId?: string
): void {
  ctx.save();
  ctx.font = '10px monospace';

  const pulse = (Math.sin(frameIndex * 0.1) + 1) / 2;

  switch (filter) {
    case 'TARGET_TRACKING': {
      // Crosshair Lock-on Reticle
      const isCam5 = camId === '5';
      const cx = isCam5 ? width * 0.38 : width * 0.45;
      const cy = isCam5 ? height * 0.55 : height * 0.48;
      const size = 36 + pulse * 6;

      ctx.strokeStyle = isCam5 ? '#ffb703' : '#00ff41';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);

      // Corner brackets
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      ctx.fillStyle = isCam5 ? '#ffb703' : '#00ff41';
      ctx.fillText(isCam5 ? `[LOCK-ON: CAM-5 THERMAL INGRESS]` : `[LOCK-ON: TRK-01]`, cx - size / 2, cy - size / 2 - 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(isCam5 ? `VEL: 140 m/s | BRG: 215° SW` : `RNG: 142m | VEL: 12.4 m/s`, cx - size / 2, cy + size / 2 + 14);
      break;
    }

    case 'PERSON_DETECTION': {
      // Dismounted Personnel Reticles
      const targets = [
        { x: width * 0.32, y: height * 0.42, w: 28, h: 64, label: 'PERS-01', conf: '0.94' },
        { x: width * 0.58, y: height * 0.38, w: 26, h: 58, label: 'PERS-02', conf: '0.91' }
      ];

      targets.forEach(t => {
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(t.x, t.y, t.w, t.h);

        ctx.fillStyle = '#ff0033';
        ctx.fillRect(t.x, t.y - 14, 85, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${t.label} (${t.conf})`, t.x + 2, t.y - 3);
      });
      break;
    }

    case 'VEHICLE_DETECTION': {
      // Ground Vehicle Reticles
      const vX = width * 0.28;
      const vY = height * 0.52;
      const vW = 110;
      const vH = 55;

      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2;
      ctx.strokeRect(vX, vY, vW, vH);

      ctx.fillStyle = '#ffb703';
      ctx.fillRect(vX, vY - 14, 115, 14);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`VEHICLE: 4x4 (0.92)`, vX + 4, vY - 3);

      ctx.strokeStyle = '#ffb703';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(vX - 10, vY + vH + 2, vW + 20, 10);
      ctx.setLineDash([]);
      break;
    }

    case 'THREAT_HIGHLIGHT': {
      // Flashing Threat Halo
      const tX = width * 0.36;
      const tY = height * 0.46;
      const tW = 80;
      const tH = 65;

      ctx.strokeStyle = `rgba(255, 0, 51, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(tX - 4, tY - 4, tW + 8, tH + 8);

      ctx.fillStyle = '#ff0033';
      ctx.fillRect(tX - 4, tY - 18, 140, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`⚠️ LEVEL-3 THREAT (CRITICAL)`, tX, tY - 5);
      break;
    }

    case 'DRONE_DETECTION': {
      // Airborne UAV / Thermal Projectile Reticle
      const isCam5 = camId === '5';
      const dX = isCam5 ? width * 0.36 : width * 0.12;
      const dY = isCam5 ? height * 0.52 : height * 0.15;
      const dW = isCam5 ? 54 : 46;
      const dH = isCam5 ? 42 : 34;

      ctx.strokeStyle = isCam5 ? '#ffb703' : '#00ff41';
      ctx.lineWidth = 2;
      ctx.strokeRect(dX, dY, dW, dH);

      ctx.fillStyle = isCam5 ? '#ffb703' : '#00ff41';
      ctx.fillRect(dX, dY - 14, isCam5 ? 160 : 105, 14);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(isCam5 ? `🚀 THERMAL PROJECTILE (0.98)` : `🛸 DRONE (0.96)`, dX + 3, dY - 3);

      ctx.fillStyle = isCam5 ? '#ffb703' : '#00ff41';
      ctx.font = '9px monospace';
      ctx.fillText(isCam5 ? `VEL: 140 m/s | TEMP: >650°C` : `ALT: 45m | 12.4 m/s`, dX, dY + dH + 12);
      break;
    }
  }

  ctx.restore();
}
