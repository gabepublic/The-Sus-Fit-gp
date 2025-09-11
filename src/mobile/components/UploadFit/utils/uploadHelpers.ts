/**
 * @fileoverview Upload Helper Utilities for UploadFit
 * @module @/mobile/components/UploadFit/utils/uploadHelpers
 * @version 1.0.0
 */

import type {
  UploadState,
  UploadResult,
  UploadConfig,
  UploadError,
  CreateUploadError,
  ProgressCallback
} from '../types';

import {
  UPLOAD_STATUS,
  DEFAULT_UPLOAD_CONFIG
} from '../types';

/**
 * Creates a standardized upload error
 * 
 * @param message Error message
 * @param code Error code
 * @param metadata Additional error metadata
 * @returns Structured upload error
 */
export const createUploadError: CreateUploadError = (
  message: string,
  code: UploadError['code'],
  metadata?: Record<string, unknown>
): UploadError => {
  const error = new Error(message) as UploadError;
  error.code = code;
  error.metadata = metadata;
  return error;
};

/**
 * Initial upload state for fit uploads
 */
export const createInitialUploadState = (): UploadState => ({
  status: UPLOAD_STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0
});

/**
 * Simulates file upload with progress tracking
 * This is a mock implementation that should be replaced with actual upload logic
 * 
 * @param file File to upload
 * @param onProgress Progress callback
 * @param config Upload configuration
 * @returns Promise resolving to upload result
 */
export const simulateUpload = async (
  file: File,
  onProgress?: ProgressCallback,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<UploadResult<string>> => {
  try {
    // Simulate upload progress
    const steps = 10;
    const stepDelay = 100; // 100ms per step
    
    for (let i = 0; i <= steps; i++) {
      const progress = (i / steps) * 100;
      onProgress?.(progress);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }

    // Create a mock URL for the uploaded file
    const mockUrl = URL.createObjectURL(file);
    
    return {
      success: true,
      data: mockUrl,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Handles file upload with comprehensive error handling
 * 
 * @param file File to upload
 * @param config Upload configuration
 * @param onProgress Progress callback
 * @returns Promise resolving to upload result
 */
export const handleFileUpload = async (
  file: File,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG,
  onProgress?: ProgressCallback
): Promise<UploadResult<string>> => {
  try {
    // Basic validation
    if (!file) {
      throw createUploadError(
        'No file provided for upload',
        'VALIDATION_ERROR',
        { file: null }
      );
    }

    if (file.size === 0) {
      throw createUploadError(
        'File is empty or corrupted',
        'VALIDATION_ERROR',
        { fileSize: file.size, fileName: file.name }
      );
    }

    if (file.size > config.maxFileSize) {
      throw createUploadError(
        `File size (${file.size} bytes) exceeds maximum allowed size (${config.maxFileSize} bytes)`,
        'VALIDATION_ERROR',
        { fileSize: file.size, maxSize: config.maxFileSize, fileName: file.name }
      );
    }

    if (!config.allowedTypes.includes(file.type)) {
      throw createUploadError(
        `File type "${file.type}" is not allowed`,
        'VALIDATION_ERROR',
        { fileType: file.type, allowedTypes: config.allowedTypes, fileName: file.name }
      );
    }

    // Perform the upload (currently simulated)
    const result = await simulateUpload(file, onProgress, config);
    
    if (!result.success) {
      throw createUploadError(
        result.error || 'Upload failed',
        'UPLOAD_ERROR',
        { fileName: file.name, fileSize: file.size }
      );
    }

    return result;

  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      // Already an UploadError
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    // Convert to UploadError
    const uploadError = createUploadError(
      error instanceof Error ? error.message : 'Unknown upload error',
      'UPLOAD_ERROR',
      { originalError: error }
    );

    return {
      success: false,
      data: null,
      error: uploadError.message
    };
  }
};

/**
 * Retries a failed upload with exponential backoff
 * 
 * @param uploadFunction Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay between retries in milliseconds
 * @returns Promise resolving to upload result
 */
export const retryUpload = async <T>(
  uploadFunction: () => Promise<UploadResult<T>>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<UploadResult<T>> => {
  let lastError: string = 'Unknown error';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadFunction();
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Upload failed';
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    data: null,
    error: `Upload failed after ${maxRetries} attempts. Last error: ${lastError}`
  };
};

/**
 * Cancels an ongoing upload
 * This is a placeholder that would integrate with actual upload cancellation
 * 
 * @param uploadId Unique identifier for the upload
 * @returns Whether cancellation was successful
 */
export const cancelUpload = async (uploadId: string): Promise<boolean> => {
  try {
    // Placeholder for actual upload cancellation logic
    console.log(`Cancelling upload: ${uploadId}`);
    return true;
  } catch (error) {
    console.error('Failed to cancel upload:', error);
    return false;
  }
};

/**
 * Generates a unique upload ID
 * 
 * @returns Unique upload identifier
 */
export const generateUploadId = (): string => {
  return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculates upload speed
 * 
 * @param bytesUploaded Number of bytes uploaded
 * @param timeElapsed Time elapsed in milliseconds
 * @returns Upload speed in bytes per second
 */
export const calculateUploadSpeed = (bytesUploaded: number, timeElapsed: number): number => {
  if (timeElapsed === 0) return 0;
  return (bytesUploaded / timeElapsed) * 1000; // Convert to bytes per second
};

/**
 * Estimates remaining upload time
 * 
 * @param totalBytes Total file size in bytes
 * @param uploadedBytes Bytes already uploaded
 * @param uploadSpeed Current upload speed in bytes per second
 * @returns Estimated remaining time in milliseconds
 */
export const estimateRemainingTime = (
  totalBytes: number,
  uploadedBytes: number,
  uploadSpeed: number
): number => {
  if (uploadSpeed === 0) return Infinity;
  const remainingBytes = totalBytes - uploadedBytes;
  return (remainingBytes / uploadSpeed) * 1000; // Convert to milliseconds
};

/**
 * Formats upload speed for display
 * 
 * @param bytesPerSecond Upload speed in bytes per second
 * @returns Formatted speed string
 */
export const formatUploadSpeed = (bytesPerSecond: number): string => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let unitIndex = 0;
  let speed = bytesPerSecond;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Formats remaining time for display
 * 
 * @param milliseconds Time in milliseconds
 * @returns Formatted time string
 */
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds === Infinity) return 'Unknown';
  
  const seconds = Math.floor(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Creates a comprehensive upload progress tracker
 * 
 * @param totalBytes Total file size
 * @returns Progress tracker object
 */
export const createUploadProgressTracker = (totalBytes: number) => {
  let startTime = Date.now();
  let uploadedBytes = 0;

  return {
    updateProgress: (bytes: number) => {
      uploadedBytes = bytes;
      const timeElapsed = Date.now() - startTime;
      const progress = (uploadedBytes / totalBytes) * 100;
      const speed = calculateUploadSpeed(uploadedBytes, timeElapsed);
      const remainingTime = estimateRemainingTime(totalBytes, uploadedBytes, speed);

      return {
        progress: Math.min(100, Math.max(0, progress)),
        uploadedBytes,
        totalBytes,
        speed,
        remainingTime,
        formattedSpeed: formatUploadSpeed(speed),
        formattedRemainingTime: formatRemainingTime(remainingTime)
      };
    },

    reset: () => {
      startTime = Date.now();
      uploadedBytes = 0;
    }
  };
};