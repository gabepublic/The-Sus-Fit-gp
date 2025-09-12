/**
 * @fileoverview Upload simulation utilities for testing
 * @module @/mobile/components/UploadAngle/__tests__/utils/uploadSimulation
 *
 * This file preserves the upload simulation logic that was removed from the production
 * components but is still useful for testing scenarios where we want to control
 * upload behavior without making real network requests.
 */

/**
 * Simulates upload progress for testing
 *
 * @param file - File being uploaded
 * @param onProgress - Progress callback function
 * @param duration - Total upload duration in milliseconds (default: 2000)
 * @param failureRate - Probability of failure (0-1, default: 0.1 for 10% failure rate)
 * @returns Promise that resolves when upload simulation completes
 */
export function simulateUploadProgress(
  file: File,
  onProgress?: (progress: number) => void,
  duration: number = 2000,
  failureRate: number = 0.1
): Promise<string> {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const updateInterval = 50; // Update every 50ms for smoother progress
    const progressStep = 100 / (duration / updateInterval);

    const progressTimer = setInterval(() => {
      progress += progressStep;
      const currentProgress = Math.min(100, Math.round(progress));

      // Call progress callback
      onProgress?.(currentProgress);

      // Complete when 100% reached
      if (currentProgress >= 100) {
        clearInterval(progressTimer);

        // Simulate occasional failures for testing
        if (Math.random() < failureRate) {
          reject(new Error('Upload failed due to network error'));
        } else {
          // Return a blob URL for the uploaded file
          const imageUrl = URL.createObjectURL(file);
          resolve(imageUrl);
        }
      }
    }, updateInterval);
  });
}

/**
 * Simulates upload process with configurable behavior for testing
 *
 * @param file - File to upload
 * @param options - Configuration options for the simulation
 * @returns Promise resolving to the simulated upload result
 */
export async function simulateUpload(
  file: File,
  options: {
    duration?: number;
    failureRate?: number;
    onProgress?: (progress: number) => void;
    onStart?: () => void;
    onComplete?: (imageUrl: string) => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const {
    duration = 2000,
    failureRate = 0.1,
    onProgress,
    onStart,
    onComplete,
    onError
  } = options;

  try {
    onStart?.();

    const imageUrl = await simulateUploadProgress(
      file,
      onProgress,
      duration,
      failureRate
    );

    onComplete?.(imageUrl);

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    const uploadError =
      error instanceof Error ? error : new Error('Upload failed');

    onError?.(uploadError);

    return {
      success: false,
      error: uploadError.message
    };
  }
}

/**
 * Creates a mock upload state for testing
 */
export function createMockUploadState(
  overrides: Partial<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    file: File | null;
    imageUrl: string | null;
    error: string | null;
    progress: number;
  }> = {}
) {
  return {
    status: 'idle' as const,
    file: null,
    imageUrl: null,
    error: null,
    progress: 0,
    ...overrides
  };
}

/**
 * Creates a mock file for testing
 */
export function createSimulationMockFile(
  name: string = 'test-image.jpg',
  type: string = 'image/jpeg',
  size: number = 1024 * 1024 // 1MB
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

/**
 * Waits for a specified amount of time (useful in tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
