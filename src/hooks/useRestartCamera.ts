import { useRef, useCallback } from 'react';
import { stopMediaStream } from '../utils/stopMediaStream';

/**
 * Custom hook that provides a function to restart the camera stream.
 * Handles cleanup of previous streams and proper error handling.
 * 
 * @param videoRef - React ref to the video element
 * @returns A function to restart the camera stream
 */
export const useRestartCamera = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const currentStreamRef = useRef<MediaStream | null>(null);

  const restart = useCallback(async (): Promise<void> => {
    try {
      // 1) Stop previous stream if it exists
      if (currentStreamRef.current) {
        stopMediaStream(currentStreamRef.current, videoRef.current);
        currentStreamRef.current = null;
      }

      // 2) Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // 3) Request new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      // 4) Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 5) Wait for video to be ready and playing
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not available'));
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error('Video ready timeout'));
          }, 10000);

          const checkReady = () => {
            if (video.readyState >= 2 && video.srcObject && !video.paused && video.currentTime > 0) {
              clearTimeout(timeout);
              resolve();
            }
          };

          // Check immediately
          checkReady();

          // Set up event listeners
          video.addEventListener('loadedmetadata', checkReady);
          video.addEventListener('canplay', checkReady);
          video.addEventListener('playing', checkReady);

          // Start playing
          video.play().catch((error) => {
            console.warn('Autoplay failed, but continuing:', error);
            // Don't reject here, let the ready check handle it
          });
        });

        // Store the new stream reference for future cleanup
        currentStreamRef.current = stream;
      }
    } catch (error) {
      console.error('Error restarting camera:', error);
      throw error;
    }
  }, [videoRef]);

  return restart;
}; 