/**
 * Safely stops all active tracks in a MediaStream and removes the stream from a video element
 * to prevent memory leaks and ensure proper cleanup.
 * 
 * @param stream - The MediaStream to stop (optional)
 * @param videoEl - The video element to clear (optional)
 */
export const stopMediaStream = (
  stream?: MediaStream | null,
  videoEl?: HTMLVideoElement | null
): void => {
  if (!stream) return;

  try {
    // Stop all tracks in the stream
    stream.getTracks().forEach(track => {
      if (track.readyState !== 'ended') {
        track.stop();
      }
    });
  } catch (error) {
    console.error('Error stopping MediaStream tracks:', error);
  }

  // Clear the video element's srcObject if it matches the stream
  if (videoEl && videoEl.srcObject === stream) {
    videoEl.srcObject = null;
  }
}; 