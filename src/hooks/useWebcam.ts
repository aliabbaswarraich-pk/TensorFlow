import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebcamOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export function useWebcam({ facingMode = 'user', width = 640, height = 480 }: UseWebcamOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNoCameraFound, setIsNoCameraFound] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // List available camera devices
  const updateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
      return videoDevices;
    } catch {
      return [];
    }
  }, [selectedDeviceId]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start Physical Camera
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsNoCameraFound(false);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setIsNoCameraFound(true);
        throw new Error('NO OPTICAL SENSOR HARDWARE DETECTED ON THIS SYSTEM');
      }

      const foundDevices = await updateDevices();
      if (!foundDevices || foundDevices.length === 0) {
        setIsNoCameraFound(true);
        throw new Error('NO OPTICAL SENSOR HARDWARE DETECTED ON THIS SYSTEM');
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: width }, height: { ideal: height } }
          : { facingMode: { ideal: facingMode }, width: { ideal: width }, height: { ideal: height } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'FAILED TO INITIALIZE OPTICAL STREAM';
      if (
        message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('device not found') ||
        message.toLowerCase().includes('devicesnotfounderror') ||
        message.toLowerCase().includes('no optical sensor')
      ) {
        setIsNoCameraFound(true);
        setError('OPTICAL HARDWARE OFFLINE // NO PHYSICAL WEBCAM DETECTED');
      } else {
        setError(message.toUpperCase());
      }
      setIsCameraActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceId, facingMode, width, height, stream, updateDevices]);

  const switchCamera = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  return {
    videoRef,
    stream,
    error,
    isNoCameraFound,
    devices,
    selectedDeviceId,
    isCameraActive,
    isLoading,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
