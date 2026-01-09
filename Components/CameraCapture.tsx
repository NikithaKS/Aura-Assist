import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CameraCapture({ onCapture, onClose, continuous = false, realTime = false, realtimeInterval = 3000 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Auto-capture when camera is ready in continuous mode
  useEffect(() => {
    if (isReady && continuous && !realTime) {
      // Start capturing after a brief delay to ensure camera is fully ready
      const timer = setTimeout(() => {
        captureImage();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isReady, continuous, realTime]);

  // Real-time continuous analysis
  useEffect(() => {
    if (isReady && realTime) {
      // Start real-time analysis immediately
      const startRealTime = setTimeout(() => {
        captureImage();
        
        // Then continue at intervals
        intervalRef.current = setInterval(() => {
          captureImage();
        }, realtimeInterval);
      }, 500);

      return () => {
        clearTimeout(startRealTime);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isReady, realTime, realtimeInterval]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsReady(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob && onCapture) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        onCapture(file);

        if (!continuous && !realTime) {
          stopCamera();
        }
      }
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-semibold">
            {realTime ? 'Live Narration' : 'Camera'}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="lg"
            className="text-white hover:bg-red-600 bg-red-500 h-14 px-6 text-lg font-bold rounded-xl"
            aria-label="Stop camera"
          >
            <X className="h-6 w-6 mr-2" />
            STOP
          </Button>
        </div>
        {realTime && (
          <p className="text-white/90 text-sm mt-2">Continuously analyzing and narrating...</p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-center items-center gap-6">
          <Button
            onClick={switchCamera}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/20 h-14 w-14 rounded-full"
            aria-label="Switch camera"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          <Button
            onClick={captureImage}
            disabled={!isReady}
            size="lg"
            className="h-20 w-20 rounded-full bg-white hover:bg-gray-100 shadow-xl"
            aria-label="Capture photo"
          >
            <Camera className="h-10 w-10 text-gray-900" />
          </Button>

          {continuous && (
            <Button
              onClick={captureImage}
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/20 h-14 w-14 rounded-full"
              aria-label="Quick capture"
            >
              <Zap className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}