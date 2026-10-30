import React, { useEffect, useRef } from 'react';
import { Upload, Play, RefreshCw, Check, Camera } from 'lucide-react';
import { BoundingBoxDetection, CustomPrediction, OpticalMode } from '../types';
import { SAMPLE_ITEMS } from '../data/samples';

interface CameraViewProps {
  opticalMode: OpticalMode;
  videoRef: React.RefObject<HTMLVideoElement>;
  sampleCanvasRef: React.RefObject<HTMLCanvasElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  uploadedImageSrc: string | null;
  isCameraActive: boolean;
  isLoadingCamera: boolean;
  cameraError: string | null;
  isNoCameraFound: boolean;
  activeSampleIndex: number;
  onSelectSample: (index: number) => void;
  onSelectMode: (mode: OpticalMode) => void;
  onStartCamera: () => void;
  onUploadImage: (file: File) => void;
  onImageLoaded: () => void;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  detections: BoundingBoxDetection[];
  topLabel: string;
  topProbability: number;
  customPrediction: CustomPrediction | null;
  isPaused: boolean;
  onTogglePause: () => void;
  onCaptureSnapshot: (dataUrl: string, label: string, conf: number) => void;
  isSockDetected: boolean;
  showOverlayBoxes: boolean;
  isAnalyzing: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  opticalMode,
  videoRef,
  sampleCanvasRef,
  imageRef,
  uploadedImageSrc,
  isCameraActive,
  isLoadingCamera,
  cameraError,
  isNoCameraFound,
  activeSampleIndex,
  onSelectSample,
  onSelectMode,
  onStartCamera,
  onUploadImage,
  onImageLoaded,
  devices,
  selectedDeviceId,
  onSelectDevice,
  detections = [],
  topLabel,
  topProbability,
  customPrediction,
  isPaused,
  onTogglePause,
  onCaptureSnapshot,
  isSockDetected,
  showOverlayBoxes,
  isAnalyzing,
}) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Render high-precision hairline bounding boxes on overlay canvas safely
  useEffect(() => {
    try {
      const canvas = overlayCanvasRef.current;
      if (!canvas || !showOverlayBoxes) return;

      let sourceW = 640;
      let sourceH = 480;

      if (opticalMode === 'upload' && imageRef.current) {
        sourceW = imageRef.current.naturalWidth || 640;
        sourceH = imageRef.current.naturalHeight || 480;
      } else if (opticalMode === 'sample' && sampleCanvasRef.current) {
        sourceW = sampleCanvasRef.current.width || 640;
        sourceH = sampleCanvasRef.current.height || 480;
      } else if (videoRef.current && videoRef.current.videoWidth > 0) {
        sourceW = videoRef.current.videoWidth;
        sourceH = videoRef.current.videoHeight;
      }

      if (canvas.width !== sourceW || canvas.height !== sourceH) {
        canvas.width = sourceW;
        canvas.height = sourceH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isPaused) return;

      if (!Array.isArray(detections)) return;

      detections.forEach((det) => {
        if (!det || !Array.isArray(det.bbox) || det.bbox.length < 4) return;
        const [x, y, width, height] = det.bbox;
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return;

        const className = typeof det.class === 'string' ? det.class : 'OBJECT';
        const isTargetSock = className.toLowerCase().includes('sock');

        // Hairline stroke
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isTargetSock ? '#c084fc' : 'rgba(237, 232, 225, 0.75)';
        ctx.strokeRect(x, y, width, height);

        // Subtle fill
        ctx.fillStyle = isTargetSock ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(x, y, width, height);

        // Technical corner brackets
        const tick = 12;
        ctx.lineWidth = 2;
        ctx.strokeStyle = isTargetSock ? '#e9d5ff' : '#ffffff';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(x, y + tick);
        ctx.lineTo(x, y);
        ctx.lineTo(x + tick, y);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(x + width - tick, y);
        ctx.lineTo(x + width);
        ctx.lineTo(x + width, y + tick);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(x, y + height - tick);
        ctx.lineTo(x, y);
        ctx.lineTo(x + tick, y + height);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(x + width - tick, y + height);
        ctx.lineTo(x + width);
        ctx.lineTo(x + width, y + height - tick);
        ctx.stroke();

        // Architectural label
        const cleanClass = className.toUpperCase();
        const scoreStr = typeof det.score === 'number' ? (det.score * 100).toFixed(0) : '0';
        const labelText = `${cleanClass} // ${scoreStr}%`;

        ctx.font = '600 11px "Space Mono", monospace';
        const textMetrics = ctx.measureText(labelText);
        const badgeW = textMetrics.width + 14;
        const badgeH = 20;
        const badgeY = Math.max(0, y - badgeH - 3);

        ctx.fillStyle = '#08070d';
        ctx.fillRect(x, badgeY, badgeW, badgeH);

        ctx.strokeStyle = isTargetSock ? 'rgba(192, 132, 252, 0.6)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, badgeY, badgeW, badgeH);

        ctx.fillStyle = isTargetSock ? '#e9d5ff' : '#EDE8E1';
        ctx.fillText(labelText, x + 7, badgeY + 14);
      });
    } catch (err) {
      console.warn('Canvas render caught warning:', err);
    }
  }, [detections, showOverlayBoxes, isPaused, opticalMode, imageRef, sampleCanvasRef, videoRef]);

  // Capture snapshot handler
  const handleCapture = () => {
    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 640;
      snapCanvas.height = 480;
      const ctx = snapCanvas.getContext('2d');
      if (!ctx) return;

      if (opticalMode === 'upload' && imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, 640, 480);
      } else if (opticalMode === 'sample' && sampleCanvasRef.current) {
        ctx.drawImage(sampleCanvasRef.current, 0, 0, 640, 480);
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      }

      if (overlayCanvasRef.current && showOverlayBoxes) {
        ctx.drawImage(overlayCanvasRef.current, 0, 0, 640, 480);
      }

      const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.9);
      const activeLabel = customPrediction && customPrediction.confidence > 0.6
        ? customPrediction.label
        : topLabel || 'CAPTURED ARTIFACT';
      const activeConf = customPrediction && customPrediction.confidence > 0.6
        ? customPrediction.confidence
        : topProbability;

      onCaptureSnapshot(dataUrl, activeLabel, activeConf);
    } catch {
      // Ignore
    }
  };

  // ONLY allow image files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('SECURITY PROTOCOL: ONLY IMAGE FILES (JPEG, PNG, WEBP) ARE PERMITTED.');
        e.target.value = '';
        return;
      }
      onUploadImage(file);
      e.target.value = '';
    }
  };

  return (
    <div id="camera-viewport" className="relative flex flex-col border border-white/[0.08] bg-[#09080f]/90 backdrop-blur-2xl">
      {/* Strict Image File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {/* Top Technical Header */}
      <div className="px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between text-[11px] tracking-[0.2em] uppercase font-mono text-[#847D8D]">
        <div className="flex items-center gap-3">
          <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-spin' : opticalMode === 'upload' ? 'bg-emerald-400' : opticalMode === 'sample' ? 'bg-cyan-400' : 'bg-purple-400 animate-pulse-subtle'}`}></span>
          <span className="text-[#EDE8E1]">
            {opticalMode === 'upload'
              ? 'IMAGE FILE ANALYZER'
              : opticalMode === 'sample'
              ? 'STUDIO SAMPLE OPTICAL TARGET'
              : 'LIVE OPTICAL SENSOR'}
          </span>
          {isAnalyzing && (
            <span className="text-amber-300 font-mono text-[9px] animate-pulse">
              [PROCESSING INFERENCE...]
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>INPUT // {opticalMode.toUpperCase()}</span>
        </div>
      </div>

      {/* Target Engagement Banner (Sock Detected) */}
      {isSockDetected && (
        <div className="px-6 py-2.5 bg-purple-950/40 border-b border-purple-500/30 flex items-center justify-between text-xs tracking-[0.18em] uppercase font-mono text-[#EDE8E1]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-purple-300"></span>
            <span>TARGET CLASSIFICATION // SOCK DETECTED</span>
          </div>
          <span className="text-purple-300">
            CONFIDENCE: {(topProbability * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Input Mode Selector Bar */}
      <div className="px-6 py-2.5 bg-black/50 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
              opticalMode === 'upload'
                ? 'border-emerald-400 text-white bg-emerald-950/40'
                : 'border-white/10 text-[#847D8D] hover:text-white hover:border-white/30'
            }`}
          >
            <Upload className="w-3 h-3 stroke-[1.5]" />
            <span>UPLOAD IMAGE</span>
          </button>

          <button
            onClick={() => onSelectMode('sample')}
            className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
              opticalMode === 'sample'
                ? 'border-purple-400 text-white bg-purple-950/40'
                : 'border-white/10 text-[#847D8D] hover:text-white hover:border-white/30'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>SAMPLE STUDIO FEED</span>
          </button>

          <button
            onClick={() => {
              onSelectMode('webcam');
              onStartCamera();
            }}
            className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
              opticalMode === 'webcam'
                ? 'border-cyan-400 text-white bg-cyan-950/40'
                : 'border-white/10 text-[#847D8D] hover:text-white hover:border-white/30'
            }`}
          >
            <Camera className="w-3 h-3 stroke-[1.5]" />
            <span>HARDWARE WEBCAM</span>
          </button>
        </div>

        {/* When in sample mode, show sample object pills */}
        {opticalMode === 'sample' && (
          <div className="flex items-center gap-1.5">
            {SAMPLE_ITEMS.map((sample, idx) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(idx)}
                className={`px-2.5 py-1 text-[9px] border transition-all ${
                  activeSampleIndex === idx
                    ? 'border-purple-300 text-white bg-purple-900/50'
                    : 'border-white/10 text-[#847D8D] hover:text-white'
                }`}
              >
                {sample.expectedClass}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-video w-full bg-[#050408] overflow-hidden flex items-center justify-center">
        {/* Optical Source 1: Uploaded Static Image */}
        {opticalMode === 'upload' && uploadedImageSrc ? (
          <img
            ref={imageRef}
            src={uploadedImageSrc}
            alt="Uploaded Artifact"
            onLoad={onImageLoaded}
            className="w-full h-full object-contain"
          />
        ) : opticalMode === 'upload' ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className="w-8 h-8 text-[#847D8D] mb-3 stroke-[1.5]" />
            <span className="text-xs font-mono tracking-widest text-[#EDE8E1] uppercase mb-1">
              NO IMAGE SELECTED
            </span>
            <p className="text-[11px] text-[#847D8D] max-w-sm mb-4">
              Click the button below to upload a photo of a sock, sneaker, person, or any object to analyze.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 border border-emerald-400 text-white text-[10px] font-mono tracking-widest uppercase hover:bg-emerald-950/40 transition-all"
            >
              SELECT IMAGE FILE
            </button>
          </div>
        ) : null}

        {/* Optical Source 2: Sample Studio Canvas */}
        <canvas
          ref={sampleCanvasRef}
          className={`w-full h-full object-cover ${opticalMode === 'sample' ? 'block' : 'hidden'}`}
        />

        {/* Optical Source 3: Hardware Webcam Video */}
        {opticalMode === 'webcam' && (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-90 contrast-[1.05]' : 'opacity-0'}`}
          />
        )}

        {/* Bounding Box Canvas Overlay */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* Minimal Optical Reticle */}
        {!isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
            <div className="w-32 h-32 border border-white/20 relative flex items-center justify-center">
              <div className="w-2 h-2 border-t border-l border-purple-400 absolute top-2 left-2"></div>
              <div className="w-2 h-2 border-t border-r border-purple-400 absolute top-2 right-2"></div>
              <div className="w-2 h-2 border-b border-l border-purple-400 absolute bottom-2 left-2"></div>
              <div className="w-2 h-2 border-b border-r border-purple-400 absolute bottom-2 right-2"></div>
              <div className="w-1 h-1 bg-white/60"></div>
            </div>
          </div>
        )}

        {/* Top Active Identification Overlay */}
        {topLabel && !isPaused && (
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-1 bg-[#09080f]/90 backdrop-blur-md px-4 py-3 border border-white/[0.08]">
            <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#847D8D]">
              PRIMARY CLASSIFICATION
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium tracking-[0.1em] text-white uppercase font-sans">
                {topLabel}
              </span>
              <span className="font-mono text-xs text-purple-300">
                {(topProbability * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Hardware Offline / Empty State for Webcam Mode */}
        {opticalMode === 'webcam' && !isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#07060a] z-30">
            <div className="max-w-lg flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border border-white/10 flex items-center justify-center">
                <div className="w-4 h-4 border border-purple-400/60"></div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-[0.2em] text-[#EDE8E1] uppercase block">
                  OPTICAL HARDWARE OFFLINE // NO PHYSICAL WEBCAM DETECTED
                </span>
                <p className="text-xs text-[#847D8D] font-sans max-w-md leading-relaxed">
                  No active camera detected on this system. Switch to the <strong>Studio Sample Feed</strong> or <strong>Upload an Image</strong> to run real-time TensorFlow.js object recognition.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onSelectMode('sample')}
                  className="px-5 py-2.5 border border-purple-400 text-white text-[11px] font-mono tracking-[0.2em] uppercase bg-purple-950/40 hover:bg-purple-900/60 transition-all"
                >
                  RUN SAMPLE STUDIO FEED
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 border border-white/20 hover:border-white text-white text-[11px] font-mono tracking-[0.2em] uppercase hover:bg-white/[0.04] transition-all"
                >
                  UPLOAD IMAGE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Standby State */}
        {isPaused && (
          <div className="absolute inset-0 bg-[#060509]/75 backdrop-blur-sm flex items-center justify-center z-25">
            <span className="text-xs font-mono tracking-[0.25em] text-[#EDE8E1] uppercase border border-white/10 px-5 py-2.5 bg-[#09080f]">
              ANALYSIS PAUSED
            </span>
          </div>
        )}
      </div>

      {/* Viewport Control Bar */}
      <div className="px-6 py-3.5 bg-[#07060b] border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[11px] tracking-[0.18em] uppercase">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#847D8D] text-[10px]">CURRENT MODE:</span>
          <span className="text-white/80 font-mono text-[10px]">
            {opticalMode === 'upload' ? 'IMAGE ARTIFACT' : opticalMode === 'sample' ? 'STUDIO SAMPLE' : 'PHYSICAL SENSOR'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#C5BFC9] hover:text-white transition-colors"
          >
            SELECT IMAGE
          </button>

          <span className="text-white/20">|</span>

          <button
            onClick={onTogglePause}
            className="text-[#C5BFC9] hover:text-white transition-colors"
          >
            {isPaused ? 'RESUME ANALYSIS' : 'PAUSE'}
          </button>

          <span className="text-white/20">|</span>

          <button
            onClick={handleCapture}
            className="px-4 py-2 border border-white/20 hover:border-purple-400 text-white font-medium hover:bg-white/[0.04] transition-all"
          >
            CAPTURE FRAME
          </button>
        </div>
      </div>
    </div>
  );
};
