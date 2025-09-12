/**
 * @fileoverview Image Compression Utilities - Core image compression with browser-image-compression
 * @module @/mobile/components/UploadFit/utils/imageCompression
 * @version 1.0.0
 */

import imageCompression from 'browser-image-compression';

// =============================================================================
// TYPES AND INTERFACES (Task 6.1)
// =============================================================================

/**
 * Compression configuration options
 */
export interface CompressionConfig {
  /** Maximum file size in MB (default: 1) */
  maxSizeMB?: number;
  /** Maximum width or height in pixels (default: 1920) */
  maxWidthOrHeight?: number;
  /** Image quality (0-1, default: 0.7) */
  initialQuality?: number;
  /** Use web worker for compression (default: true) */
  useWebWorker?: boolean;
  /** Preserve EXIF data (default: false) */
  preserveExif?: boolean;
  /** File type override ('image/jpeg', 'image/png', 'image/webp') */
  fileType?: string;
  /** Enable progress callback */
  onProgress?: (progress: number) => void;
  /** Signal for aborting compression */
  signal?: AbortSignal;
}

/**
 * Compression result interface
 */
export interface CompressionResult {
  /** Compressed file */
  file: File;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Compression ratio (0-1) */
  compressionRatio: number;
  /** Time taken for compression in ms */
  compressionTime: number;
  /** Whether compression was successful */
  success: boolean;
  /** Error message if compression failed */
  error?: string;
}

/**
 * Compression error types
 */
export interface CompressionError extends Error {
  code: 'COMPRESSION_FAILED' | 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'ABORTED';
  originalFile?: File;
  config?: CompressionConfig;
}

/**
 * Quality preset configurations
 */
export const COMPRESSION_PRESETS = {
  /** High quality, larger file size */
  HIGH: {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    initialQuality: 0.8,
    useWebWorker: true
  },
  /** Medium quality, balanced size/quality */
  MEDIUM: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    initialQuality: 0.7,
    useWebWorker: true
  },
  /** Low quality, smaller file size */
  LOW: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    initialQuality: 0.6,
    useWebWorker: true
  },
  /** Fit-specific preset for 3:4 portraits */
  FIT_PORTRAIT: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    initialQuality: 0.75,
    useWebWorker: true,
    preserveExif: false
  }
} as const satisfies Record<string, CompressionConfig>;

export type CompressionPreset = keyof typeof COMPRESSION_PRESETS;

// =============================================================================
// COMPRESSION UTILITIES (Task 6.1)
// =============================================================================

/**
 * Create compression error with proper typing
 */
const createCompressionError = (
  code: CompressionError['code'],
  message: string,
  originalFile?: File,
  config?: CompressionConfig
): CompressionError => {
  const error = new Error(message) as CompressionError;
  error.code = code;
  error.originalFile = originalFile;
  error.config = config;
  return error;
};

/**
 * Validate file for compression
 */
const validateFileForCompression = (file: File): void => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    throw createCompressionError(
      'INVALID_FORMAT',
      `File type ${file.type} is not supported. Only image files are allowed.`,
      file
    );
  }

  // Check file size (max 50MB for safety)
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxFileSize) {
    throw createCompressionError(
      'FILE_TOO_LARGE',
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB.`,
      file
    );
  }

  // Check for empty file
  if (file.size === 0) {
    throw createCompressionError(
      'INVALID_FORMAT',
      'File appears to be empty or corrupted.',
      file
    );
  }
};

/**
 * Compress image file using browser-image-compression with comprehensive error handling
 * 
 * Features:
 * - Configurable compression settings for optimal file size/quality balance
 * - Web Worker support to prevent main thread blocking
 * - Progress tracking for large files
 * - EXIF data preservation options
 * - Comprehensive error handling and validation
 * - Abort signal support for cancellation
 * - Multiple quality presets
 * 
 * @param file Original image file to compress
 * @param config Compression configuration options
 * @returns Promise resolving to compression result
 * 
 * @example
 * ```typescript
 * const result = await compressImage(file, {
 *   maxSizeMB: 1,
 *   maxWidthOrHeight: 1920,
 *   initialQuality: 0.7,
 *   onProgress: (progress) => console.log(`${progress}% complete`)
 * });
 * 
 * if (result.success) {
 *   console.log(`Reduced file size by ${(result.compressionRatio * 100).toFixed(1)}%`);
 *   // Use result.file
 * } else {
 *   console.error('Compression failed:', result.error);
 * }
 * ```
 */
export async function compressImage(
  file: File,
  config: CompressionConfig = {}
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSize = file.size;

  try {
    // Validate input file
    validateFileForCompression(file);

    // Merge with default config
    const finalConfig: Required<CompressionConfig> = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.7,
      useWebWorker: true,
      preserveExif: false,
      fileType: file.type,
      onProgress: () => {},
      signal: new AbortController().signal,
      ...config
    };

    // Check if compression is needed
    if (originalSize <= finalConfig.maxSizeMB * 1024 * 1024) {
      const compressionTime = performance.now() - startTime;
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        compressionTime,
        success: true
      };
    }

    // Perform compression with abort signal support
    const compressedFile = await Promise.race([
      imageCompression(file, {
        maxSizeMB: finalConfig.maxSizeMB,
        maxWidthOrHeight: finalConfig.maxWidthOrHeight,
        initialQuality: finalConfig.initialQuality,
        useWebWorker: finalConfig.useWebWorker,
        preserveExif: finalConfig.preserveExif,
        fileType: finalConfig.fileType,
        onProgress: finalConfig.onProgress
      }),
      new Promise<never>((_, reject) => {
        if (finalConfig.signal) {
          finalConfig.signal.addEventListener('abort', () => {
            reject(createCompressionError(
              'ABORTED',
              'Compression was aborted by user',
              file,
              finalConfig
            ));
          });
        }
      })
    ]);

    const compressedSize = compressedFile.size;
    const compressionRatio = (originalSize - compressedSize) / originalSize;
    const compressionTime = performance.now() - startTime;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      compressionTime,
      success: true
    };

  } catch (error) {
    const compressionTime = performance.now() - startTime;
    
    // Handle known compression errors
    if (error instanceof Error && 'code' in error) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        compressionTime,
        success: false,
        error: error.message
      };
    }

    // Handle unknown errors
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      compressionTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compression error'
    };
  }
}

/**
 * Compress image using predefined quality preset
 * 
 * @param file Original image file to compress
 * @param preset Quality preset to use
 * @param overrides Additional config to override preset values
 * @returns Promise resolving to compression result
 * 
 * @example
 * ```typescript
 * const result = await compressImageWithPreset(file, 'FIT_PORTRAIT', {
 *   onProgress: (progress) => setProgress(progress)
 * });
 * ```
 */
export async function compressImageWithPreset(
  file: File,
  preset: CompressionPreset = 'MEDIUM',
  overrides: Partial<CompressionConfig> = {}
): Promise<CompressionResult> {
  const presetConfig = COMPRESSION_PRESETS[preset];
  const finalConfig = { ...presetConfig, ...overrides };
  
  return compressImage(file, finalConfig);
}

/**
 * Batch compress multiple images with progress tracking
 * 
 * @param files Array of image files to compress
 * @param config Compression configuration
 * @param onProgress Progress callback (total progress 0-1)
 * @returns Promise resolving to array of compression results
 * 
 * @example
 * ```typescript
 * const results = await compressImages(files, 
 *   { maxSizeMB: 1 },
 *   (progress) => console.log(`${(progress * 100).toFixed(1)}% complete`)
 * );
 * 
 * const successful = results.filter(r => r.success);
 * const failed = results.filter(r => !r.success);
 * ```
 */
export async function compressImages(
  files: File[],
  config: CompressionConfig = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await compressImage(file, {
        ...config,
        onProgress: (fileProgress) => {
          const overallProgress = (i + fileProgress / 100) / files.length;
          onProgress?.(overallProgress);
        }
      });
      
      results.push(result);
    } catch (error) {
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        compressionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Update overall progress
    onProgress?.((i + 1) / files.length);
  }
  
  return results;
}

// =============================================================================
// UTILITY FUNCTIONS (Task 6.1)
// =============================================================================

/**
 * Calculate optimal compression settings based on file size and target
 * 
 * @param fileSize Original file size in bytes
 * @param targetSizeMB Target file size in MB
 * @returns Suggested compression config
 */
export function calculateOptimalCompression(
  fileSize: number,
  targetSizeMB: number = 1
): CompressionConfig {
  const fileSizeMB = fileSize / (1024 * 1024);
  
  // If file is already smaller than target, minimal compression
  if (fileSizeMB <= targetSizeMB) {
    return {
      maxSizeMB: targetSizeMB,
      initialQuality: 0.9,
      maxWidthOrHeight: 2048
    };
  }
  
  // Calculate compression ratio needed
  const compressionNeeded = targetSizeMB / fileSizeMB;
  
  // Adjust quality based on compression needed
  let quality = 0.8;
  let maxDimension = 1920;
  
  if (compressionNeeded < 0.3) {
    quality = 0.5;
    maxDimension = 1280;
  } else if (compressionNeeded < 0.5) {
    quality = 0.6;
    maxDimension = 1600;
  } else if (compressionNeeded < 0.7) {
    quality = 0.7;
    maxDimension = 1920;
  }
  
  return {
    maxSizeMB: targetSizeMB,
    initialQuality: quality,
    maxWidthOrHeight: maxDimension,
    useWebWorker: true
  };
}

/**
 * Format file size for display
 * 
 * @param bytes File size in bytes
 * @returns Human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Check if file needs compression based on size
 * 
 * @param file File to check
 * @param maxSizeMB Maximum allowed size in MB
 * @returns Whether compression is needed
 */
export function needsCompression(file: File, maxSizeMB: number = 1): boolean {
  return file.size > (maxSizeMB * 1024 * 1024);
}

/**
 * Get supported image formats for compression
 * 
 * @returns Array of supported MIME types
 */
export function getSupportedFormats(): string[] {
  return [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];
}

/**
 * Check if file format is supported for compression
 * 
 * @param file File to check
 * @returns Whether format is supported
 */
export function isFormatSupported(file: File): boolean {
  return getSupportedFormats().includes(file.type);
}