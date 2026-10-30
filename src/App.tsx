import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CameraView } from './components/CameraView';
import { PredictionsPanel } from './components/PredictionsPanel';
import { CustomTrainerPanel } from './components/CustomTrainerPanel';
import { DetectionHistory } from './components/DetectionHistory';
import { SettingsModal } from './components/SettingsModal';
import { useWebcam } from './hooks/useWebcam';
import { tfService } from './services/tfService';
import { speechService } from './services/speechService';
import { SAMPLE_ITEMS } from './data/samples';
import { ChevronDown } from 'lucide-react';
import {
  AppSettings,
  BoundingBoxDetection,
  ClassificationResult,
  CustomPrediction,
  HistoryItem,
  ModelStatus,
  OpticalMode,
} from './types';

export const App: React.FC = () => {
  // Webcam hook
  const {
    videoRef,
    isCameraActive,
    isLoading: isLoadingCamera,
    error: cameraError,
    isNoCameraFound,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  } = useWebcam();

  // Optical Mode
  const [opticalMode, setOpticalMode] = useState<OpticalMode>('upload');
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Optical source references
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Model & Inference states
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    mobilenet: false,
    cocoSsd: false,
    customKNN: false,
    isLoading: true,
    backendName: 'INITIALIZING',
    error: null,
  });
  const [initProgress, setInitProgress] = useState<string>('SYNCHRONIZING TENSORS...');

  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);
  const [detections, setDetections] = useState<BoundingBoxDetection[]>([]);
  const [customPrediction, setCustomPrediction] = useState<CustomPrediction | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('feed');

  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    speechEnabled: true,
    confidenceThreshold: 0.25,
    enableMobileNet: true,
    enableCocoSsd: true,
    enableCustomKNN: true,
    facingMode: 'user',
    showOverlayBoxes: true,
    speechCooldownMs: 3500,
  });

  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const lastInferenceTimeRef = useRef(0);
  const isInferringRef = useRef(false);
  const requestAnimationRef = useRef<number | null>(null);
  const sampleAnimationRef = useRef<number | null>(null);
  const sampleTimeRef = useRef(0);

  // Initialize TensorFlow Models
  const loadModels = useCallback(async () => {
    setModelStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await tfService.init((step) => setInitProgress(step.toUpperCase()));
      setModelStatus({
        mobilenet: true,
        cocoSsd: true,
        customKNN: true,
        isLoading: false,
        backendName: res.backend.toUpperCase(),
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FAILED TO LOAD NEURAL WEIGHTS';
      setModelStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Run Inference on any optical source safely
  const processInference = useCallback(async (source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => {
    if (!tfService.isReady()) return;

    try {
      // 1. MobileNet Classification
      let currentClassifications: ClassificationResult[] = [];
      if (settings.enableMobileNet) {
        currentClassifications = await tfService.classifyImage(source, 5);
        setClassifications(currentClassifications);
      }

      // 2. COCO-SSD Detection
      let currentDetections: BoundingBoxDetection[] = [];
      if (settings.enableCocoSsd) {
        currentDetections = await tfService.detectObjects(source);
        setDetections(
          currentDetections.filter((d) => d && typeof d.score === 'number' && d.score >= settings.confidenceThreshold)
        );
      }

      // 3. Custom KNN
      let currentCustom: CustomPrediction | null = null;
      if (settings.enableCustomKNN) {
        currentCustom = await tfService.predictCustom(source);
        setCustomPrediction(currentCustom);
      }

      // 4. Vocal Notifications
      const topClass = currentClassifications[0];
      const hasTopClass = topClass && typeof topClass.className === 'string' && topClass.probability >= settings.confidenceThreshold;

      const isSockMobileNet = currentClassifications.some(
        (c) => c && typeof c.className === 'string' && c.className.toLowerCase().includes('sock') && c.probability >= 0.20
      );
      const isSockCustom = currentCustom && typeof currentCustom.label === 'string' && currentCustom.label.toLowerCase().includes('sock') && currentCustom.confidence > 0.6;
      const isSock = isSockMobileNet || isSockCustom;

      if (settings.speechEnabled) {
        if (isSock) {
          speechService.speak('Target verified: Sock', settings.speechCooldownMs);
        } else if (currentCustom && typeof currentCustom.label === 'string' && currentCustom.confidence > 0.75) {
          speechService.speak(`Subject identified: ${currentCustom.label}`, settings.speechCooldownMs);
        } else if (hasTopClass && topClass) {
          const cleanName = (topClass.className || '').split(',')[0].trim();
          speechService.speak(`Subject identified: ${cleanName}`, settings.speechCooldownMs);
        }
      }
    } catch (err) {
      console.warn('Inference execution warning:', err);
    }
  }, [settings]);

  // Handle Image Upload: ONLY allow images
  const handleUploadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('SECURITY PROTOCOL: ONLY IMAGE FILES (JPEG, PNG, WEBP) ARE PERMITTED.');
      return;
    }

    setIsAnalyzing(true);
    setClassifications([]);
    setDetections([]);
    setCustomPrediction(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImageSrc(dataUrl);
      setOpticalMode('upload');
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  // Triggered when an uploaded image finishes loading: ANALYZE ONCE
  const handleImageLoaded = useCallback(() => {
    if (imageRef.current) {
      setIsAnalyzing(true);
      processInference(imageRef.current).finally(() => {
        setIsAnalyzing(false);
      });
    }
  }, [processInference]);

  // Sample Studio Canvas Drawing Loop
  useEffect(() => {
    if (opticalMode !== 'sample') return;

    let active = true;
    const renderSample = () => {
      if (!active) return;

      const canvas = sampleCanvasRef.current;
      if (canvas) {
        sampleTimeRef.current += 0.02;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== 640 || canvas.height !== 480) {
            canvas.width = 640;
            canvas.height = 480;
          }

          // Obsidian Studio Background
          ctx.fillStyle = '#08070d';
          ctx.fillRect(0, 0, 640, 480);

          // Studio radial glow
          const grad = ctx.createRadialGradient(320, 240, 40, 320, 240, 280);
          grad.addColorStop(0, 'rgba(147, 51, 234, 0.18)');
          grad.addColorStop(1, 'rgba(8, 7, 13, 0.95)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 480);

          // Grid guidelines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          for (let x = 40; x < 640; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 480);
            ctx.stroke();
          }
          for (let y = 40; y < 480; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(640, y);
            ctx.stroke();
          }

          // Render selected sample
          const sample = SAMPLE_ITEMS[activeSampleIndex % SAMPLE_ITEMS.length];
          if (sample && typeof sample.render === 'function') {
            sample.render(ctx, 640, 480, sampleTimeRef.current);
          }

          ctx.fillStyle = 'rgba(132, 125, 141, 0.7)';
          ctx.font = '10px "Space Mono", monospace';
          ctx.fillText(`STUDIO TARGET // ${sample?.name || 'SAMPLE'}`, 20, 30);
          ctx.fillText(`EXPECTED CLASSIFICATION // ${sample?.expectedClass || ''}`, 20, 460);
        }
      }

      sampleAnimationRef.current = requestAnimationFrame(renderSample);
    };

    sampleAnimationRef.current = requestAnimationFrame(renderSample);

    return () => {
      active = false;
      if (sampleAnimationRef.current) {
        cancelAnimationFrame(sampleAnimationRef.current);
      }
    };
  }, [opticalMode, activeSampleIndex]);

  // Throttled Inference Loop ONLY for continuous feeds (Sample or Webcam) - NEVER for static uploaded images!
  useEffect(() => {
    // DO NOT run continuous loop on uploaded static images!
    if (opticalMode === 'upload') return;

    let active = true;

    const runLoop = async () => {
      if (!active) return;

      const now = performance.now();
      const throttleInterval = 250; // 250ms = 4 FPS (super stable, zero GPU memory exhaustion)

      if (
        !isPaused &&
        tfService.isReady() &&
        !isInferringRef.current &&
        now - lastInferenceTimeRef.current >= throttleInterval
      ) {
        let activeSource: HTMLVideoElement | HTMLCanvasElement | null = null;

        if (opticalMode === 'sample' && sampleCanvasRef.current) {
          activeSource = sampleCanvasRef.current;
        } else if (opticalMode === 'webcam' && videoRef.current && videoRef.current.readyState >= 2 && isCameraActive) {
          activeSource = videoRef.current;
        }

        if (activeSource) {
          isInferringRef.current = true;
          lastInferenceTimeRef.current = now;

          await processInference(activeSource);

          // Update FPS meter
          frameCountRef.current++;
          const elapsed = now - lastFpsTimeRef.current;
          if (elapsed >= 1000) {
            if (active) {
              setFps((frameCountRef.current * 1000) / elapsed);
            }
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }

          isInferringRef.current = false;
        }
      }

      if (active) {
        requestAnimationRef.current = requestAnimationFrame(runLoop);
      }
    };

    requestAnimationRef.current = requestAnimationFrame(runLoop);

    return () => {
      active = false;
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, [
    opticalMode,
    isCameraActive,
    isPaused,
    processInference,
    videoRef,
  ]);

  const isSockDetected = Boolean(
    classifications.some(
      (c) => c && typeof c.className === 'string' && c.className.toLowerCase().includes('sock') && c.probability >= 0.20
    ) ||
      (customPrediction &&
        typeof customPrediction.label === 'string' &&
        customPrediction.label.toLowerCase().includes('sock') &&
        customPrediction.confidence > 0.6)
  );

  const topLabel = classifications.length > 0 && typeof classifications[0]?.className === 'string'
    ? classifications[0].className.split(',')[0]
    : '';
  const topProbability = classifications.length > 0 && typeof classifications[0]?.probability === 'number'
    ? classifications[0].probability
    : 0;

  const handleCaptureSnapshot = (dataUrl: string, label: string, conf: number) => {
    const newItem: HistoryItem = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label: (label || 'ARTIFACT').toUpperCase(),
      confidence: conf || 0,
      type: 'classification',
      imageSrc: dataUrl,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 17)]);
  };

  const handleClearHistory = () => setHistory([]);
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    const element = document.getElementById(`section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCustomTrainerSource = (): HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null => {
    if (opticalMode === 'upload' && imageRef.current) return imageRef.current;
    if (opticalMode === 'sample' && sampleCanvasRef.current) return sampleCanvasRef.current;
    if (opticalMode === 'webcam' && videoRef.current) return videoRef.current;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#060509] text-[#EDE8E1] flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden">
      {/* Top Editorial Navbar */}
      <Navbar
        modelStatus={modelStatus}
        fps={fps}
        speechEnabled={settings.speechEnabled}
        onToggleSpeech={() => handleUpdateSettings({ speechEnabled: !settings.speechEnabled })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReloadModels={loadModels}
        activeSection={activeSection}
        onSelectSection={scrollToSection}
      />

      {/* GRAND HERO SECTION — CLEAN ARCHITECTURAL LAYOUT */}
      <section className="relative w-full flex flex-col items-center px-6 lg:px-16 pt-8 pb-16 overflow-hidden">
        {/* Deep Atmospheric Violet Glow Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-purple-600/[0.12] rounded-full blur-[160px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-500/[0.08] rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[1700px] relative flex flex-col items-center z-10">
          {/* Top Editorial Eyebrow */}
          <div className="w-full flex justify-between items-center text-[11px] font-mono tracking-[0.25em] text-[#847D8D] uppercase mb-4 px-2">
            <span className="text-white/90">GUIDED BY THE GLOW</span>
            <span className="hidden sm:inline">REAL-TIME OPTICAL NEURAL RECOGNITION</span>
          </div>

          {/* Monumental Headline "TRANSCEND" (Sits fully visible and majestic above the camera, unobstructed!) */}
          <div className="w-full text-center py-2 sm:py-4">
            <h1 className="monumental-text text-[15vw] sm:text-[17vw] lg:text-[18vw] text-[#EDE8E1] tracking-[0.05em] leading-[0.82] select-none uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
              TRANSCEND
            </h1>
          </div>

          {/* Editorial Micro-Copy Quote Banner */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] font-mono text-[#847D8D] uppercase tracking-[0.18em] my-6 px-2 gap-3 border-t border-b border-white/[0.06] py-3">
            <p className="max-w-md normal-case font-sans text-xs text-[#C5BFC9]/80 leading-relaxed">
              In the haze of luminous brilliance, existence is reborn, carried by the light of endless creation.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] tracking-mega text-[#847D8D]">
                @svg.graphixx // CLIENT-SIDE
              </span>
            </div>
          </div>

          {/* Focal Subject: Optical Sensor Console */}
          <div className="w-full max-w-4xl mx-auto mt-4 shadow-[0_20px_70px_-10px_rgba(147,51,234,0.25)]">
            <CameraView
              opticalMode={opticalMode}
              videoRef={videoRef}
              sampleCanvasRef={sampleCanvasRef}
              imageRef={imageRef}
              uploadedImageSrc={uploadedImageSrc}
              isCameraActive={isCameraActive}
              isLoadingCamera={isLoadingCamera}
              cameraError={cameraError}
              isNoCameraFound={isNoCameraFound}
              activeSampleIndex={activeSampleIndex}
              onSelectSample={(idx) => {
                setActiveSampleIndex(idx);
                setOpticalMode('sample');
              }}
              onSelectMode={(mode) => setOpticalMode(mode)}
              onStartCamera={startCamera}
              onUploadImage={handleUploadImage}
              onImageLoaded={handleImageLoaded}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={switchCamera}
              detections={detections}
              topLabel={topLabel}
              topProbability={topProbability}
              customPrediction={customPrediction}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onCaptureSnapshot={handleCaptureSnapshot}
              isSockDetected={isSockDetected}
              showOverlayBoxes={settings.showOverlayBoxes}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Navigation Cue */}
          <div className="w-full flex justify-center mt-12">
            <button
              onClick={() => scrollToSection('classification')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group cursor-pointer text-[10px] font-mono tracking-mega uppercase"
            >
              <span>EXPLORE SPECTRUM ANALYSIS &amp; CALIBRATION</span>
              <ChevronDown className="w-3.5 h-3.5 stroke-[1.5] group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Analytical Workspace Layout */}
      <main className="max-w-[1700px] w-full mx-auto px-6 lg:px-16 py-12 space-y-16">
        {/* System Loading Indicator */}
        {modelStatus.isLoading && (
          <div className="p-4 border border-white/[0.08] bg-[#0d0b14]/90 flex items-center justify-between text-xs font-mono tracking-widest uppercase">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-400 animate-pulse"></div>
              <span className="text-[#EDE8E1]">{initProgress}</span>
            </div>
            <span className="text-[#847D8D]">STANDBY FOR OPTICAL WEIGHTS</span>
          </div>
        )}

        {/* Pipeline Error Notification */}
        {modelStatus.error && (
          <div className="p-4 border border-red-500/40 bg-red-950/20 text-xs font-mono tracking-widest uppercase flex items-center justify-between text-red-300">
            <span>PIPELINE ERROR // {modelStatus.error}</span>
            <button
              onClick={loadModels}
              className="px-4 py-1.5 border border-red-500/40 hover:border-red-400 text-white"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Section 2 & 3: Classification Spectrum & Adaptive Neural Calibration */}
        <section id="section-classification" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Classification Spectrum */}
          <div className="lg:col-span-6 flex flex-col gap-8">
            <PredictionsPanel
              classifications={classifications}
              detections={detections}
              confidenceThreshold={settings.confidenceThreshold}
              isLoading={modelStatus.isLoading}
            />
          </div>

          {/* Adaptive Neural Calibration (Teachable Machine for Socks and Custom Items) */}
          <div id="section-calibration" className="lg:col-span-6 flex flex-col gap-8">
            <CustomTrainerPanel
              opticalSourceGetter={getCustomTrainerSource}
              customPrediction={customPrediction}
              onTrainingUpdated={() => {}}
            />
          </div>
        </section>

        {/* Section 4: Optical Frame Archive */}
        <section id="section-archive">
          <DetectionHistory
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteItem={handleDeleteHistoryItem}
          />
        </section>
      </main>

      {/* Parameters Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        modelStatus={modelStatus}
      />

      {/* Minimalist Brutalist Footer */}
      <footer className="border-t border-white/[0.06] bg-[#060509] py-8 px-6 lg:px-16">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-[0.2em] text-[#847D8D] uppercase">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 border border-white/40"></div>
            <span>TRANSCEND OPTICAL ARCHITECTURE</span>
          </div>
          <div>
            100% CLIENT-SIDE EXECUTION &bull; WEBGL ACCELERATION
          </div>
          <div className="text-white/60">
            TRANSCEND 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
