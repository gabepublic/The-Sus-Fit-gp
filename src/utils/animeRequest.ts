/**
 * Custom timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Convert a Blob to base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };
    
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Request anime transformation from the API with retry logic
 * @param selfieBlob - The selfie image as a Blob
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise<string> - The anime image as a data URL
 */
export async function requestAnime(
  selfieBlob: Blob, 
  signal?: AbortSignal
): Promise<string> {
  const TIMEOUT_MS = 25000; // 25 seconds timeout
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second delay between retries
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Convert blob to base64
      const base64Data = await blobToBase64(selfieBlob);
      
      // Create the fetch request
      const fetchPromise = fetch('/api/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selfie: base64Data }),
        ...(signal && { signal }),
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetchPromise,
        createTimeoutPromise(TIMEOUT_MS)
      ]);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.image) {
        throw new Error('No image data received from server');
      }
      
      return data.image;
      
    } catch (error) {
      lastError = error as Error;
      
      // Handle specific error types that shouldn't be retried
      if (error instanceof TimeoutError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      
      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }
      
      // Wait before retrying (except for the last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('An unknown error occurred');
} 