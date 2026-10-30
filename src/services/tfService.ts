import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { BoundingBoxDetection, ClassificationResult, CustomPrediction } from '../types';

export type OpticalSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;

export class TensorFlowService {
  private static instance: TensorFlowService;
  private mobilenetModel: mobilenet.MobileNet | null = null;
  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private knn: knnClassifier.KNNClassifier | null = null;
  private isInitialized = false;
  private currentBackend = 'unknown';

  private constructor() {
    this.knn = knnClassifier.create();
  }

  public static getInstance(): TensorFlowService {
    if (!TensorFlowService.instance) {
      TensorFlowService.instance = new TensorFlowService();
    }
    return TensorFlowService.instance;
  }

  public async init(onProgress?: (step: string) => void): Promise<{ backend: string }> {
    if (this.isInitialized) {
      return { backend: this.currentBackend };
    }

    try {
      if (onProgress) onProgress('CONFIGURING MEMORY SAFEGUARDS...');

      // Prevent WebGL texture leaks by instructing TFJS to immediately free textures
      try {
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      } catch {
        // Safe defaults
      }

      await tf.ready();
      this.currentBackend = tf.getBackend();

      if (onProgress) onProgress('LOADING CLASSIFICATION ARCHETYPES...');
      this.mobilenetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });

      if (onProgress) onProgress('INITIALIZING SPATIAL BOUNDING DETECTOR...');
      this.cocoModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
      });

      this.isInitialized = true;
      if (onProgress) onProgress('SYSTEM READY');
      return { backend: this.currentBackend };
    } catch (err) {
      console.error('TensorFlow.js initialization warning:', err);
      // Fallback to CPU backend if WebGL fails on this system
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        this.currentBackend = 'cpu';
        this.mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        this.cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        this.isInitialized = true;
        return { backend: 'cpu' };
      } catch (cpuErr) {
        throw cpuErr;
      }
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.mobilenetModel !== null;
  }

  public getBackend(): string {
    return this.currentBackend;
  }

  /**
   * Run MobileNet classification safely
   */
  public async classifyImage(source: OpticalSource, topK = 5): Promise<ClassificationResult[]> {
    if (!this.mobilenetModel) return [];
    try {
      const predictions = await this.mobilenetModel.classify(source, topK);
      if (!Array.isArray(predictions)) return [];

      return predictions
        .filter((p) => p && typeof p.className === 'string')
        .map((p) => ({
          className: p.className,
          probability: typeof p.probability === 'number' ? p.probability : 0,
        }));
    } catch (err) {
      console.warn('Classification warning:', err);
      return [];
    }
  }

  /**
   * Run COCO-SSD object detection safely
   */
  public async detectObjects(source: OpticalSource): Promise<BoundingBoxDetection[]> {
    if (!this.cocoModel) return [];
    try {
      const results = await this.cocoModel.detect(source, 6, 0.25);
      if (!Array.isArray(results)) return [];

      return results
        .filter((r) => r && Array.isArray(r.bbox) && r.bbox.length === 4)
        .map((r) => ({
          bbox: [
            Math.max(0, r.bbox[0]),
            Math.max(0, r.bbox[1]),
            Math.max(1, r.bbox[2]),
            Math.max(1, r.bbox[3]),
          ] as [number, number, number, number],
          class: typeof r.class === 'string' ? r.class : 'OBJECT',
          score: typeof r.score === 'number' ? r.score : 0,
        }));
    } catch (err) {
      console.warn('Detection warning:', err);
      return [];
    }
  }

  /**
   * Add a custom training example safely
   */
  public addCustomExample(source: OpticalSource, classId: string): void {
    if (!this.mobilenetModel || !this.knn) return;

    let logits: tf.Tensor | null = null;
    try {
      logits = this.mobilenetModel.infer(source, true);
      this.knn.addExample(logits, classId);
    } catch (err) {
      console.warn('Custom KNN add warning:', err);
    } finally {
      if (logits) {
        try {
          logits.dispose();
        } catch {
          // Tensor already disposed
        }
      }
    }
  }

  /**
   * Predict custom class safely
   */
  public async predictCustom(source: OpticalSource): Promise<CustomPrediction | null> {
    if (!this.mobilenetModel || !this.knn) return null;
    if (this.knn.getNumClasses() === 0) return null;

    let logits: tf.Tensor | null = null;
    try {
      logits = this.mobilenetModel.infer(source, true);
      const prediction = await this.knn.predictClass(logits, 5);
      const topLabel = prediction.label || '';
      const confidence = (prediction.confidences && prediction.confidences[topLabel]) || 0;

      return {
        label: topLabel,
        confidence,
      };
    } catch (err) {
      console.warn('Custom KNN predict warning:', err);
      return null;
    } finally {
      if (logits) {
        try {
          logits.dispose();
        } catch {
          // Tensor disposed
        }
      }
    }
  }

  public clearCustomClass(classId?: string): void {
    if (!this.knn) return;
    try {
      if (classId) {
        this.knn.clearClass(classId);
      } else {
        this.knn.clearAllClasses();
      }
    } catch {
      // Ignore
    }
  }
}

export const tfService = TensorFlowService.getInstance();
