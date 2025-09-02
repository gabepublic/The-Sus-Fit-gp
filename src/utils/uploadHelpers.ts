/**
 * Upload helper functions for image compression, processing, and blob URL management
 * with modern browser API support and comprehensive error handling.
 * 
 * @example
 * ```typescript
 * import { compressImage, processImageFile, createBlobUrl, revokeBlobUrl } from './uploadHelpers';
 * 
 * // Compress an image file
 * try {
 *   const compressed = await compressImage(file, 0.8);
 *   const url = createBlobUrl(compressed);
 *   
 *   // Use the URL for preview
 *   imgElement.src = url;
 *   
 *   // Clean up when done
 *   revokeBlobUrl(url);
 * } catch (error) {
 *   console.error('Compression failed:', error);
 * }
 * 
 * // Process complete image file with validation and optimization
 * const result = await processImageFile(file);
 * if (result.success) {
 *   console.log('Processed image:', result.blob);
 * }
 * ```
 */

import { UPLOAD_CONFIG, PERFORMANCE_CONSTANTS, FEATURE_DETECTION } from './constants';
import { CompressionError, FileProcessingError } from './errorHandling';

// Re-export for convenience
export { CompressionError, FileProcessingError };

/**
 * Interface representing a processed image result
 */
export interface ProcessedImage {
  /** Whether processing was successful */
  success: boolean;
  /** Processed image blob (null if failed) */
  blob: Blob | null;
  /** Original file reference */
  originalFile: File;
  /** Processing metadata */
  metadata: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    dimensions: {
      original: { width: number; height: number };
      processed: { width: number; height: number };
    };
    format: string;
    processingTime: number;
  };
  /** Any errors encountered */
  errors: Error[];
}

/**
 * Interface for compression options
 */
export interface CompressionOptions {
  /** Target quality (0.0 to 1.0) */
  quality?: number;
  /** Maximum output size in bytes */
  maxSize?: number;
  /** Target format override */
  format?: string;
  /** Whether to preserve metadata */
  preserveMetadata?: boolean;
}

/**
 * Interface for resize options
 */
export interface ResizeOptions {
  /** Maximum width in pixels */
  maxWidth: number;
  /** Maximum height in pixels */
  maxHeight: number;
  /** Whether to maintain aspect ratio */
  maintainAspectRatio?: boolean;
  /** Resize quality */
  quality?: number;
}

/**
 * Blob URL tracking for memory management
 */
class BlobUrlManager {
  private urls = new Set<string>();
  private cleanupTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Creates a blob URL and tracks it for cleanup
   */
  create(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    
    // Auto-cleanup after configured delay
    const timer = setTimeout(() => {
      this.revoke(url);
    }, UPLOAD_CONFIG.BLOB_URL.AUTO_CLEANUP_DELAY);
    
    this.cleanupTimers.set(url, timer);
    
    // Limit number of tracked URLs
    if (this.urls.size > UPLOAD_CONFIG.BLOB_URL.MAX_TRACKED_URLS) {
      const oldest = this.urls.values().next().value;
      this.revoke(oldest);
    }
    
    return url;
  }

  /**
   * Revokes a blob URL and cleans up tracking
   */
  revoke(url: string): void {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
      
      const timer = this.cleanupTimers.get(url);
      if (timer) {
        clearTimeout(timer);
        this.cleanupTimers.delete(url);
      }
    }
  }

  /**
   * Revokes all tracked URLs
   */
  revokeAll(): void {
    this.urls.forEach(url => URL.revokeObjectURL(url));
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.urls.clear();
    this.cleanupTimers.clear();
  }
}

// Global blob URL manager instance
const blobUrlManager = new BlobUrlManager();

/**
 * Creates a blob URL with automatic cleanup management
 * 
 * @param blob - The blob to create a URL for
 * @returns Object URL string that can be used as src
 * 
 * @example
 * ```typescript
 * const imageBlob = await compressImage(file);
 * const url = createBlobUrl(imageBlob);
 * 
 * // Use URL
 * imgElement.src = url;
 * 
 * // Manually revoke when done (optional, auto-cleanup will handle it)
 * revokeBlobUrl(url);
 * ```
 */
export function createBlobUrl(blob: Blob): string {
  return blobUrlManager.create(blob);
}

/**
 * Revokes a blob URL created by createBlobUrl
 * 
 * @param url - The blob URL to revoke
 * 
 * @example
 * ```typescript
 * const url = createBlobUrl(blob);
 * // ... use URL ...
 * revokeBlobUrl(url); // Clean up memory
 * ```
 */
export function revokeBlobUrl(url: string): void {
  blobUrlManager.revoke(url);
}

/**
 * Revokes all tracked blob URLs (useful for cleanup)
 * 
 * @example
 * ```typescript
 * // Clean up all blob URLs when component unmounts
 * useEffect(() => {
 *   return () => revokeAllBlobUrls();
 * }, []);
 * ```
 */
export function revokeAllBlobUrls(): void {
  blobUrlManager.revokeAll();
}

/**
 * Detects the optimal image format based on browser support and image characteristics
 */
function detectOptimalFormat(file: File, hasTransparency: boolean): string {
  // Preserve transparency for PNG
  if (hasTransparency || file.type === 'image/png') {
    // Use WebP if supported and preferred
    if (UPLOAD_CONFIG.FORMAT_PREFERENCES.PREFER_WEBP && 
        'createImageBitmap' in window) {
      return 'image/webp';
    }
    return 'image/png';
  }

  // Use WebP for photos if supported
  if (UPLOAD_CONFIG.FORMAT_PREFERENCES.PREFER_WEBP && 
      'createImageBitmap' in window) {
    return 'image/webp';
  }

  // Default to JPEG for photos
  return UPLOAD_CONFIG.FORMAT_PREFERENCES.DEFAULT_OUTPUT_FORMAT;
}

/**
 * Checks if an image has transparency using Canvas API
 */
async function hasImageTransparency(file: File): Promise<boolean> {
  if (file.type === 'image/jpeg') {
    return false; // JPEG doesn't support transparency
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(false);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      canvas.width = Math.min(img.width, 100); // Sample small area for performance
      canvas.height = Math.min(img.height, 100);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Check alpha channel (every 4th value)
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            URL.revokeObjectURL(url);
            resolve(true);
            return;
          }
        }
        
        URL.revokeObjectURL(url);
        resolve(false);
      } catch {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Gets image dimensions using modern APIs with Canvas fallback
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  // Modern approach: Use ImageBitmap API
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = {
        width: bitmap.width,
        height: bitmap.height,
      };
      bitmap.close(); // Free memory
      return dimensions;
    } catch {
      // Fall back to Canvas approach
    }
  }

  // Fallback approach: Use Image element
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new FileProcessingError(
        'Failed to load image for dimension analysis',
        'IMAGE_LOAD_ERROR'
      ));
    };

    img.src = url;
  });
}

/**
 * Resizes an image file to specified maximum dimensions
 * 
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param options - Additional resize options
 * @returns Promise resolving to resized image blob
 * 
 * @example
 * ```typescript
 * // Resize image to fit within 800x600
 * const resized = await resizeImage(file, 800, 600);
 * const url = createBlobUrl(resized);
 * ```
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  options: Partial<ResizeOptions> = {}
): Promise<Blob> {
  const startTime = performance.now();
  
  try {
    const dimensions = await getImageDimensions(file);
    const { width: originalWidth, height: originalHeight } = dimensions;
    
    // Calculate new dimensions
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    if (options.maintainAspectRatio !== false) {
      const aspectRatio = originalWidth / originalHeight;
      
      if (originalWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = maxWidth / aspectRatio;
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }
    } else {
      newWidth = Math.min(originalWidth, maxWidth);
      newHeight = Math.min(originalHeight, maxHeight);
    }
    
    // If no resize needed, return original as blob
    if (newWidth === originalWidth && newHeight === originalHeight) {
      return new Blob([file], { type: file.type });
    }
    
    // Perform resize using Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new FileProcessingError('Canvas context not available', 'CANVAS_ERROR');
    }
    
    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    
    // Load and draw image
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        try {
          // Use high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Determine output format
          const hasTransparency = file.type === 'image/png';
          const format = hasTransparency ? 'image/png' : 'image/jpeg';
          const quality = options.quality || UPLOAD_CONFIG.DEFAULT_COMPRESSION_QUALITY;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new FileProcessingError(
                  'Failed to create resized blob',
                  'BLOB_CREATION_ERROR'
                ));
              }
            },
            format,
            quality
          );
        } catch (error) {
          reject(new FileProcessingError(
            'Canvas rendering error during resize',
            'CANVAS_RENDER_ERROR',
            { error, processingTime: performance.now() - startTime }
          ));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new FileProcessingError(
          'Failed to load image for resizing',
          'IMAGE_LOAD_ERROR'
        ));
      };
      
      img.src = url;
    });
    
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    throw new FileProcessingError(
      'Resize operation failed',
      'RESIZE_FAILED',
      { error, processingTime: performance.now() - startTime }
    );
  }
}

/**
 * Compresses an image file with iterative quality reduction and size optimization
 * 
 * @param file - The image file to compress
 * @param quality - Initial compression quality (0.0 to 1.0), defaults to config value
 * @param options - Additional compression options
 * @returns Promise resolving to compressed image blob
 * 
 * @example
 * ```typescript
 * // Basic compression
 * const compressed = await compressImage(file);
 * 
 * // Custom quality and size limit
 * const compressed = await compressImage(file, 0.7, { maxSize: 500000 });
 * ```
 */
export async function compressImage(
  file: File,
  quality?: number,
  options: CompressionOptions = {}
): Promise<Blob> {
  const startTime = performance.now();
  
  if (!file || !file.type.startsWith('image/')) {
    throw new CompressionError('Invalid file type', 'INVALID_FILE_TYPE');
  }

  try {
    const initialQuality = quality || options.quality || UPLOAD_CONFIG.DEFAULT_COMPRESSION_QUALITY;
    const maxSize = options.maxSize;
    
    // Check if image has transparency
    const hasTransparency = await hasImageTransparency(file);
    const outputFormat = options.format || detectOptimalFormat(file, hasTransparency);
    
    // Create canvas for compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new CompressionError('Canvas context not available', 'CANVAS_ERROR');
    }
    
    // Load image and get dimensions
    const dimensions = await getImageDimensions(file);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Load image
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        URL.revokeObjectURL(url);
        
        try {
          // Configure high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Iterative compression
          const currentQuality = initialQuality;
          let bestBlob: Blob | null = null;
          let attempts = 0;
          
          const qualitySteps = UPLOAD_CONFIG.COMPRESSION_QUALITY_STEPS.filter(q => q <= initialQuality);
          
          for (const testQuality of [currentQuality, ...qualitySteps]) {
            if (attempts >= UPLOAD_CONFIG.MAX_COMPRESSION_ATTEMPTS) break;
            
            try {
              const blob = await new Promise<Blob>((resolveBlob, rejectBlob) => {
                canvas.toBlob(
                  (result) => {
                    if (result) resolveBlob(result);
                    else rejectBlob(new Error('Failed to create blob'));
                  },
                  outputFormat,
                  testQuality
                );
              });
              
              bestBlob = blob;
              
              // Check if size requirement is met
              if (!maxSize || blob.size <= maxSize) {
                break;
              }
              
              attempts++;
            } catch {
              attempts++;
              continue;
            }
          }
          
          if (!bestBlob) {
            throw new CompressionError('Failed to create compressed blob', 'COMPRESSION_FAILED');
          }
          
          // If still too large and we haven't resized, try resizing
          if (maxSize && bestBlob.size > maxSize) {
            const scaleFactor = Math.sqrt(maxSize / bestBlob.size) * UPLOAD_CONFIG.RESIZE_SCALE_SAFETY_MARGIN;
            
            if (scaleFactor >= UPLOAD_CONFIG.MIN_RESIZE_SCALE_FACTOR) {
              const newWidth = Math.floor(dimensions.width * scaleFactor);
              const newHeight = Math.floor(dimensions.height * scaleFactor);
              
              const resizedBlob = await resizeImage(file, newWidth, newHeight, {
                quality: UPLOAD_CONFIG.MIN_COMPRESSION_QUALITY,
              });
              
              bestBlob = resizedBlob;
            }
          }
          
          resolve(bestBlob);
        } catch (error) {
          reject(new CompressionError(
            'Compression process failed',
            'COMPRESSION_PROCESS_ERROR',
            { error, processingTime: performance.now() - startTime }
          ));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new CompressionError('Failed to load image for compression', 'IMAGE_LOAD_ERROR'));
      };
      
      // Set timeout for compression
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new CompressionError(
          'Compression timeout',
          'TIMEOUT_ERROR',
          { timeout: UPLOAD_CONFIG.TIMEOUTS.COMPRESSION }
        ));
      }, UPLOAD_CONFIG.TIMEOUTS.COMPRESSION);
      
      img.onload = (...args) => {
        clearTimeout(timeout);
        (img.onload as any)(...args);
      };
      
      img.src = url;
    });
    
  } catch (error) {
    if (error instanceof CompressionError) {
      throw error;
    }
    throw new CompressionError(
      'Compression failed',
      'GENERAL_ERROR',
      { error, processingTime: performance.now() - startTime }
    );
  }
}

/**
 * Processes an image file with validation, optimization, and comprehensive error handling
 * 
 * @param file - The image file to process
 * @param options - Processing options
 * @returns Promise resolving to processed image result
 * 
 * @example
 * ```typescript
 * const result = await processImageFile(file);
 * 
 * if (result.success) {
 *   console.log('Processing successful');
 *   console.log('Compression ratio:', result.metadata.compressionRatio);
 *   
 *   const url = createBlobUrl(result.blob);
 *   // Use processed image
 * } else {
 *   console.log('Processing failed:', result.errors);
 * }
 * ```
 */
export async function processImageFile(
  file: File,
  options: CompressionOptions & Partial<ResizeOptions> = {}
): Promise<ProcessedImage> {
  const startTime = performance.now();
  const errors: Error[] = [];
  
  // Get original dimensions and metadata
  let originalDimensions = { width: 0, height: 0 };
  
  try {
    originalDimensions = await getImageDimensions(file);
  } catch (error) {
    errors.push(error as Error);
    return {
      success: false,
      blob: null,
      originalFile: file,
      metadata: {
        originalSize: file.size,
        processedSize: 0,
        compressionRatio: 0,
        dimensions: {
          original: originalDimensions,
          processed: { width: 0, height: 0 },
        },
        format: file.type,
        processingTime: performance.now() - startTime,
      },
      errors,
    };
  }
  
  try {
    // Determine if resize is needed
    const needsResize = options.maxWidth && options.maxHeight && 
      (originalDimensions.width > options.maxWidth || originalDimensions.height > options.maxHeight);
    
    let processedBlob: Blob;
    let processedDimensions = originalDimensions;
    
    if (needsResize) {
      // Resize first, then compress
      processedBlob = await resizeImage(
        file,
        options.maxWidth!,
        options.maxHeight!,
        options as ResizeOptions
      );
      
      // Get new dimensions from resized blob
      const resizedFile = new File([processedBlob], file.name, { type: processedBlob.type });
      processedDimensions = await getImageDimensions(resizedFile);
    } else {
      // Just compress
      processedBlob = await compressImage(file, options.quality, options);
    }
    
    const processingTime = performance.now() - startTime;
    const compressionRatio = file.size > 0 ? processedBlob.size / file.size : 1;
    
    return {
      success: true,
      blob: processedBlob,
      originalFile: file,
      metadata: {
        originalSize: file.size,
        processedSize: processedBlob.size,
        compressionRatio,
        dimensions: {
          original: originalDimensions,
          processed: processedDimensions,
        },
        format: processedBlob.type,
        processingTime,
      },
      errors,
    };
    
  } catch (error) {
    errors.push(error as Error);
    
    return {
      success: false,
      blob: null,
      originalFile: file,
      metadata: {
        originalSize: file.size,
        processedSize: 0,
        compressionRatio: 0,
        dimensions: {
          original: originalDimensions,
          processed: { width: 0, height: 0 },
        },
        format: file.type,
        processingTime: performance.now() - startTime,
      },
      errors,
    };
  }
}

/**
 * Creates a user-friendly error message from processing errors
 * 
 * @param error - The error to convert
 * @returns Human-readable error message
 */
export function createUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof CompressionError) {
    switch (error.code) {
      case 'INVALID_FILE_TYPE':
        return 'Please select a valid image file (JPEG, PNG, or WebP)';
      case 'CANVAS_ERROR':
        return 'Your browser does not support image processing. Please try a different browser.';
      case 'TIMEOUT_ERROR':
        return 'Image processing took too long. Please try a smaller image.';
      case 'COMPRESSION_FAILED':
        return 'Failed to compress image. The file may be corrupted.';
      default:
        return 'Failed to compress image. Please try again.';
    }
  }
  
  if (error instanceof FileProcessingError) {
    switch (error.code) {
      case 'IMAGE_LOAD_ERROR':
        return 'Failed to load image. The file may be corrupted or in an unsupported format.';
      case 'CANVAS_RENDER_ERROR':
        return 'Image processing failed. Please try a different image.';
      case 'RESIZE_FAILED':
        return 'Failed to resize image. Please try a smaller file.';
      default:
        return 'Image processing failed. Please try again.';
    }
  }
  
  return error.message || 'An unexpected error occurred during image processing.';
}

// Types are already exported above