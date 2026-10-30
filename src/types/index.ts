export type OpticalMode = 'webcam' | 'sample' | 'upload';

export interface ClassificationResult {
  className: string;
  probability: number;
}

export interface BoundingBoxDetection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

export interface CustomClass {
  id: string;
  name: string;
  sampleCount: number;
  color: string;
}

export interface CustomPrediction {
  label: string;
  confidence: number;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  label: string;
  confidence: number;
  type: 'classification' | 'detection' | 'custom';
  imageSrc?: string;
}

export interface ModelStatus {
  mobilenet: boolean;
  cocoSsd: boolean;
  customKNN: boolean;
  isLoading: boolean;
  backendName: string;
  error: string | null;
}

export interface AppSettings {
  speechEnabled: boolean;
  confidenceThreshold: number;
  enableMobileNet: boolean;
  enableCocoSsd: boolean;
  enableCustomKNN: boolean;
  facingMode: 'user' | 'environment';
  showOverlayBoxes: boolean;
  speechCooldownMs: number;
}
