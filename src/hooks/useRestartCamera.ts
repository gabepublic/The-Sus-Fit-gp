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
    // 1) Stop previous stream if it exists
    if (currentStreamRef.current) {
      stopMediaStream(currentStreamRef.current, videoRef.current);
      currentStreamRef.current = null;
    }

    // 2) Request new stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });

    // 3) Attach and play
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    // Store the new stream reference for future cleanup
    currentStreamRef.current = stream;
  }, [videoRef]);

  return restart;
}; 