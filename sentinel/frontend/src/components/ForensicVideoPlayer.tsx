import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { ForensicFilterMode, ForensicFilterOptions } from '../utils/forensicFilters';
import { processFrameBuffer, renderTacticalOverlay } from '../utils/forensicFilters';

export interface ForensicVideoPlayerProps {
  videoUrl: string;
  camId?: string;
  isMuted?: boolean;
  filterMode: ForensicFilterMode;
  filterOptions: ForensicFilterOptions;
  playbackSpeed?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

export interface ForensicVideoPlayerRef {
  getVideoElement: () => HTMLVideoElement | null;
  captureFrameBlob: (quality?: number) => Promise<Blob | null>;
  captureFrameDataUrl: () => string | null;
  togglePlay: () => void;
  seek: (seconds: number) => void;
}

export const ForensicVideoPlayer = forwardRef<ForensicVideoPlayerRef, ForensicVideoPlayerProps>(({
  videoUrl,
  camId,
  isMuted = true,
  filterMode,
  filterOptions,
  playbackSpeed = 1.0,
  onTimeUpdate,
  className = ''
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const prevLumRef = useRef<Uint8ClampedArray | null>(null);
  const bgModelRef = useRef<Float32Array | null>(null);
  const mhiRef = useRef<Float32Array | null>(null);
  const frameIndexRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [renderFps, setRenderFps] = useState<number>(30);

  // Pan coordinates for zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Expose imperative methods for frame capture and video control
  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    captureFrameBlob: (quality = 0.9) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      if (filterMode === 'RAW' && videoRef.current) {
        // Capture direct from video
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth || 640;
        tempCanvas.height = videoRef.current.videoHeight || 480;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) ctx.drawImage(videoRef.current, 0, 0);
        return new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', quality));
      }
      return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    },
    captureFrameDataUrl: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/jpeg', 0.85);
    },
    togglePlay: () => {
      const v = videoRef.current;
      if (v) {
        if (v.paused) {
          v.play().catch(() => {});
          setIsPlaying(true);
        } else {
          v.pause();
          setIsPlaying(false);
        }
      }
    },
    seek: (seconds: number) => {
      const v = videoRef.current;
      if (v) v.currentTime = seconds;
    }
  }));

  // Update playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Reset temporal buffers when changing videoUrl
  useEffect(() => {
    prevLumRef.current = null;
    bgModelRef.current = null;
    mhiRef.current = null;
    frameIndexRef.current = 0;
  }, [videoUrl]);

  // Main real-time video processing loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let isMounted = true;
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // Internal processing canvas (optimized resolution: 640x360 or native up to 1280x720)
    const procCanvas = document.createElement('canvas');
    const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });
    const mainCtx = canvas.getContext('2d', { alpha: false });

    const renderLoop = () => {
      if (!isMounted) return;

      if (video.readyState >= 2 && mainCtx && procCtx) {
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 360;

        // Balance high resolution and convolution processing speed
        const targetW = Math.min(vW, 960);
        const targetH = Math.round((targetW / vW) * vH);

        if (procCanvas.width !== targetW || procCanvas.height !== targetH) {
          procCanvas.width = targetW;
          procCanvas.height = targetH;
        }

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        // Apply zoom and pan transform
        const zoom = filterOptions.zoom || 1.0;
        procCtx.save();
        procCtx.clearRect(0, 0, targetW, targetH);

        if (zoom > 1.0) {
          procCtx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y);
          procCtx.scale(zoom, zoom);
          procCtx.translate(-targetW / 2, -targetH / 2);
        }
        procCtx.drawImage(video, 0, 0, targetW, targetH);
        procCtx.restore();

        const totalPixels = targetW * targetH;
        if (!prevLumRef.current || prevLumRef.current.length !== totalPixels) {
          prevLumRef.current = new Uint8ClampedArray(totalPixels);
        }
        if (!bgModelRef.current || bgModelRef.current.length !== totalPixels) {
          bgModelRef.current = new Float32Array(totalPixels);
        }
        if (!mhiRef.current || mhiRef.current.length !== totalPixels) {
          mhiRef.current = new Float32Array(totalPixels);
        }
        frameIndexRef.current++;

        const temporal = {
          prevLum: prevLumRef.current,
          bgModel: bgModelRef.current,
          mhi: mhiRef.current,
          frameIndex: frameIndexRef.current
        };

        if (filterMode === 'RAW') {
          // Fast blit
          mainCtx.drawImage(procCanvas, 0, 0);
        } else {
          // Read pixel buffer, execute spatial/temporal convolution / LUT, write back
          const srcData = procCtx.getImageData(0, 0, targetW, targetH);
          const dstData = mainCtx.createImageData(targetW, targetH);

          processFrameBuffer(srcData, dstData, filterMode, filterOptions, temporal);
          mainCtx.putImageData(dstData, 0, 0);
        }

        // Render AI operator HUD overlays if active
        if ([
          'TARGET_TRACKING',
          'PERSON_DETECTION',
          'VEHICLE_DETECTION',
          'THREAT_HIGHLIGHT',
          'DRONE_DETECTION'
        ].includes(filterMode)) {
          renderTacticalOverlay(mainCtx, targetW, targetH, filterMode, frameIndexRef.current, camId);
        }

        // FPS counter calculation
        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
          setRenderFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
          frameCount = 0;
          lastFpsTime = now;
        }
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      isMounted = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [filterMode, filterOptions, pan, videoUrl, camId]);

  // Video Time updates
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) {
      setCurrentTime(v.currentTime);
      if (onTimeUpdate) onTimeUpdate(v.currentTime, v.duration || 0);
    }
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) {
      setDuration(v.duration || 0);
      if (onTimeUpdate) onTimeUpdate(v.currentTime, v.duration || 0);
    }
  };

  // Pan controls for zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (filterOptions.zoom > 1.0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && filterOptions.zoom > 1.0) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div 
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: filterOptions.zoom > 1.0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Hidden underlying video element supplying frames */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="hidden"
      />

      {/* Primary hardware-accelerated filtered output canvas */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain pointer-events-none"
      />

      {/* HUD Telemetry Overlay */}
      <div className="absolute top-2 left-2 bg-black/80 border border-tactical-olive px-2 py-0.5 text-[10px] font-mono text-tactical-light flex items-center space-x-2 pointer-events-none z-10">
        <span className={isPlaying ? 'text-status-green font-bold' : 'text-status-amber font-bold'}>
          {isPlaying ? '● PLAYING' : '❚❚ PAUSED'}
        </span>
        <span className="text-tactical-olive">|</span>
        <span className="text-status-green font-bold">{renderFps} FPS</span>
        <span className="text-tactical-olive">|</span>
        <span>FILTER: <strong className="text-white">{filterMode}</strong></span>
        {filterOptions.zoom > 1.0 && (
          <>
            <span className="text-tactical-olive">|</span>
            <span className="text-status-amber font-bold">{filterOptions.zoom.toFixed(1)}x ZOOM</span>
          </>
        )}
      </div>

      {/* Timecode overlay */}
      <div className="absolute bottom-2 left-2 bg-black/80 border border-tactical-olive px-2 py-0.5 text-[10px] font-mono text-tactical-light pointer-events-none z-10">
        <span className="text-status-green font-bold">TC: {formatTime(currentTime)}</span>
        <span className="text-tactical-olive mx-1.5">/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
});

ForensicVideoPlayer.displayName = 'ForensicVideoPlayer';
