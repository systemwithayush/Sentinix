import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { ForensicFilterMode, ForensicFilterOptions } from '../utils/forensicFilters';
import { processFrameBuffer } from '../utils/forensicFilters';

export interface ForensicVideoPlayerProps {
  videoUrl: string;
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

        if (filterMode === 'RAW') {
          // Fast blit
          mainCtx.drawImage(procCanvas, 0, 0);
        } else {
          // Read pixel buffer, execute spatial convolution / thermal LUT, write back
          const srcData = procCtx.getImageData(0, 0, targetW, targetH);
          const dstData = mainCtx.createImageData(targetW, targetH);

          processFrameBuffer(srcData, dstData, filterMode, filterOptions);
          mainCtx.putImageData(dstData, 0, 0);
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
  }, [filterMode, filterOptions, pan]);

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
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Tactical Reticle Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="w-24 h-24 border border-tactical-green rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-tactical-green rounded-full"></div>
          <div className="absolute w-36 h-0.5 bg-tactical-green/40"></div>
          <div className="absolute h-36 w-0.5 bg-tactical-green/40"></div>
        </div>
      </div>

      {/* Tactical Top-Left Filter Status Badge */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 font-mono text-[10px] z-10 pointer-events-none">
        <span className="bg-black/85 border border-tactical-green px-2 py-0.5 text-status-green font-bold shadow-md">
          FILTER: {filterMode}
        </span>
        {filterOptions.zoom > 1.0 && (
          <span className="bg-yellow-950/80 border border-status-amber text-status-amber px-1.5 py-0.5 font-bold">
            ZOOM: {filterOptions.zoom}x (DRAG TO PAN)
          </span>
        )}
        <span className="bg-black/70 border border-tactical-olive text-tactical-light px-1.5 py-0.5">
          {renderFps} FPS
        </span>
        <span className={`px-1.5 py-0.5 border ${isPlaying ? 'bg-status-green/20 border-status-green text-status-green font-bold' : 'bg-status-amber/20 border-status-amber text-status-amber font-bold'}`}>
          {isPlaying ? 'PLAYING' : 'PAUSED'}
        </span>
      </div>

      {/* Tactical Timecode Overlay (Bottom Right) */}
      <div className="absolute bottom-3 right-3 bg-black/85 border border-tactical-olive px-2 py-0.5 font-mono text-[11px] text-white pointer-events-none z-10 flex items-center space-x-2">
        <span className="text-status-green font-bold">TIMECODE:</span>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
    </div>
  );
});

ForensicVideoPlayer.displayName = 'ForensicVideoPlayer';
