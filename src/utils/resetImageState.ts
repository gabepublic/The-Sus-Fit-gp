/**
 * Interface for the reset function arguments
 */
export interface ResetImageStateArgs {
  /** Current selfie URL (object URL or data URL) */
  selfieUrl: string | null;
  /** Current anime URL (object URL or data URL) */
  animeUrl: string | null;
  /** React state setters to reset to null */
  setters: {
    setSelfieUrl: (value: null) => void;
    setAnimeUrl: (value: null) => void;
    setSelfieBlob: (value: null) => void;
    setAnimeBlob?: (value: null) => void; // Optional since not all components have animeBlob state
  };
}

/**
 * Resets image state by revoking object URLs and clearing React state variables.
 * This prevents memory leaks and ensures clean state for retake operations.
 * 
 * @param args - Object containing URLs and state setters
 */
export const resetImageState = ({ selfieUrl, animeUrl, setters }: ResetImageStateArgs): void => {
  // Revoke object URLs to prevent memory leaks
  if (selfieUrl && selfieUrl.startsWith('blob:')) {
    URL.revokeObjectURL(selfieUrl);
  }
  
  if (animeUrl && animeUrl.startsWith('blob:')) {
    URL.revokeObjectURL(animeUrl);
  }

  // Reset all state variables to null
  setters.setSelfieUrl(null);
  setters.setAnimeUrl(null);
  setters.setSelfieBlob(null);
  if (setters.setAnimeBlob) {
    setters.setAnimeBlob(null);
  }
}; 