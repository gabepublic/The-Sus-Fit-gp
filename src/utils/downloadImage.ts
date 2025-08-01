/**
 * Generic utility to download an image from a Blob or URL string
 * @param src - The image source as a Blob or URL string
 * @param filename - The filename for the downloaded file
 */
export function downloadImage(src: string | Blob, filename: string) {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  
  try {
    // Detect iOS Safari
    const isIOSSafari = /(iPad|iPhone|iPod).*Safari/.test(navigator.userAgent);
    
    if (isIOSSafari) {
      // iOS Safari fallback: use window.open
      try {
        window.open(url, '_blank');
      } catch (error) {
        // If window.open is blocked, show user instruction
        console.warn('Download blocked by browser. Press and hold image to save.');
        // Note: In a real app, you might want to show a toast notification here
        // For now, we'll just log the instruction
      }
    } else {
      // Standard download for other browsers
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } finally {
    // Always revoke the object URL, even if an error occurred
    // Only revoke if it's a blob URL (not a string URL)
    if (typeof src === 'object') {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

export default downloadImage; 