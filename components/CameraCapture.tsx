
import React, { useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (files: File[]) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer rear camera
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access the camera. Please ensure you have granted permission.');
        onClose();
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const fileName = `capture-${new Date().toISOString()}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });
          onCapture([file]);
          onClose();
        }
      }, 'image/png');
    }
  }, [onCapture, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print">
      <div className="bg-white rounded-lg shadow-2xl p-4 w-full max-w-2xl relative">
        <h2 className="text-xl font-bold text-center mb-4">Take a Photo</h2>
        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-gray-900"></video>
        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={handleCapture}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label="Capture photo"
          >
            Capture
          </button>
           <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105"
            aria-label="Close camera"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
