/**
 * @fileoverview useUpload - Shared React hook for managing upload state across views
 * @module @/mobile/components/shared/hooks/useUpload
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  UploadState,
  UseUploadReturn,
  UploadResult,
  UploadConfig,
  ImageValidationResult,
  ProgressCallback,
  UploadFunction,
  ImageMetadata
} from './hooks.types';
import {
  UPLOAD_STATUS,
  DEFAULT_UPLOAD_CONFIG
} from './hooks.types';

/**
 * Enhanced upload state with metadata
 */
interface EnhancedUploadState extends UploadState {
  /** Image metadata */
  metadata: ImageMetadata | null;
  /** Upload start time */
  startTime: Date | null;
  /** Upload completion time */
  endTime: Date | null;
  /** Retry count */
  retryCount: number;
}

/**
 * Initial upload state
 */
const initialState: EnhancedUploadState = {
  status: UPLOAD_STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0,
  metadata: null,
  startTime: null,
  endTime: null,
  retryCount: 0
};

/**
 * Shared upload hook for managing file uploads across mobile views
 *
 * Features:
 * - Unified upload state management
 * - File validation with customizable rules
 * - Progress tracking with callbacks
 * - Error handling with retry capabilities
 * - Image metadata extraction
 * - Memory leak prevention
 * - Client-side image processing integration
 * - Type-safe configuration
 *
 * @param config Upload configuration options
 * @returns Upload state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   uploadFile,
 *   clearUpload,
 *   retryUpload,
 *   isUploading,
 *   isSuccess,
 *   error
 * } = useUpload({
 *   maxFileSize: 5 * 1024 * 1024, // 5MB
 *   acceptedTypes: ['image/jpeg', 'image/png'],
 *   enableImageProcessing: true
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   const result = await uploadFile(file);
 *   if (result.success) {
 *     console.log('Upload successful:', result.data);
 *   }
 * };
 * ```
 */
export function useUpload(
  config: Partial<UploadConfig> = {}
): UseUploadReturn {
  // Merge config with defaults
  const uploadConfig = useMemo(
    () => ({ ...DEFAULT_UPLOAD_CONFIG, ...config }),
    [config]
  );

  // Upload state
  const [state, setState] = useState<EnhancedUploadState>(initialState);

  // Refs for cleanup and abort
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  /**
   * Validate file against upload configuration
   */
  const validateFile = useCallback((file: File): ImageValidationResult => {
    // Check file type
    if (!uploadConfig.acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported. Accepted types: ${uploadConfig.acceptedTypes.join(', ')}`,
        errorCode: 'INVALID_TYPE'
      };
    }

    // Check file size
    if (file.size > uploadConfig.maxFileSize) {
      const maxSizeMB = (uploadConfig.maxFileSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        errorCode: 'TOO_LARGE'
      };
    }

    // Check minimum file size (1KB)
    if (file.size < 1024) {
      return {
        valid: false,
        error: 'File is too small. Minimum size is 1KB',
        errorCode: 'TOO_SMALL'
      };
    }

    return { valid: true };
  }, [uploadConfig.acceptedTypes, uploadConfig.maxFileSize]);

  /**
   * Extract image metadata from file
   */
  const extractImageMetadata = useCallback((file: File): Promise<ImageMetadata> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          filename: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          processed: false,
          processedAt: new Date()
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for metadata extraction'));
      };

      img.src = url;
    });
  }, []);

  /**
   * Create image URL for preview
   */
  const createImageUrl = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  /**
   * Simulate upload progress (replace with actual upload logic)
   */
  const simulateUpload = useCallback(async (
    file: File,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;

        if (onProgress) {
          onProgress(progress);
        }

        setState(prev => ({ ...prev, progress }));

        if (progress >= 100) {
          clearInterval(interval);
          resolve({
            success: true,
            data: {
              url: URL.createObjectURL(file),
              filename: file.name,
              size: file.size
            },
            error: null
          });
        }
      }, uploadConfig.progressInterval);
    });
  }, [uploadConfig.progressInterval]);

  /**
   * Main upload function
   */
  const uploadFile: UploadFunction = useCallback(async (
    file: File,
    customConfig?: Partial<UploadConfig>,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> => {
    try {
      // Cleanup any existing upload
      cleanup();

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Merge custom config
      const finalConfig = customConfig
        ? { ...uploadConfig, ...customConfig }
        : uploadConfig;

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error: validation.error || 'File validation failed',
          endTime: new Date()
        }));

        return {
          success: false,
          data: null,
          error: validation.error || 'File validation failed'
        };
      }

      // Extract metadata
      let metadata: ImageMetadata;
      try {
        metadata = await extractImageMetadata(file);
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error: 'Failed to process image metadata',
          endTime: new Date()
        }));

        return {
          success: false,
          data: null,
          error: 'Failed to process image metadata'
        };
      }

      // Check image dimensions
      if (metadata.width > finalConfig.maxImageDimensions.width ||
          metadata.height > finalConfig.maxImageDimensions.height) {
        const error = `Image dimensions ${metadata.width}x${metadata.height} exceed maximum allowed ${finalConfig.maxImageDimensions.width}x${finalConfig.maxImageDimensions.height}`;

        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error,
          endTime: new Date()
        }));

        return {
          success: false,
          data: null,
          error
        };
      }

      // Create image URL
      const imageUrl = createImageUrl(file);

      // Update state to uploading
      setState(prev => ({
        ...prev,
        status: UPLOAD_STATUS.UPLOADING,
        file,
        imageUrl,
        error: null,
        progress: 0,
        metadata,
        startTime: new Date(),
        endTime: null
      }));

      // Perform upload (simulated for now)
      const result = await simulateUpload(file, onProgress);

      if (result.success) {
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.SUCCESS,
          progress: 100,
          endTime: new Date(),
          retryCount: 0
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error: result.error || 'Upload failed',
          endTime: new Date()
        }));
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setState(prev => ({
        ...prev,
        status: UPLOAD_STATUS.ERROR,
        error: errorMessage,
        endTime: new Date()
      }));

      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }, [uploadConfig, validateFile, extractImageMetadata, createImageUrl, simulateUpload, cleanup]);

  /**
   * Clear upload state
   */
  const clearUpload = useCallback(() => {
    cleanup();

    // Revoke object URL to prevent memory leaks
    if (state.imageUrl) {
      URL.revokeObjectURL(state.imageUrl);
    }

    setState(initialState);
  }, [cleanup, state.imageUrl]);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback(async (): Promise<void> => {
    if (!state.file || state.status !== UPLOAD_STATUS.ERROR) {
      return;
    }

    if (state.retryCount >= uploadConfig.maxRetries) {
      setState(prev => ({
        ...prev,
        error: `Upload failed after ${uploadConfig.maxRetries} attempts`
      }));
      return;
    }

    // Increment retry count
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      error: null
    }));

    // Wait for retry delay
    await new Promise(resolve => {
      retryTimeoutRef.current = setTimeout(resolve, uploadConfig.retryDelay * state.retryCount);
    });

    // Retry upload
    await uploadFile(state.file);
  }, [state.file, state.status, state.retryCount, uploadConfig.maxRetries, uploadConfig.retryDelay, uploadFile]);

  /**
   * Computed values
   */
  const isUploading = state.status === UPLOAD_STATUS.UPLOADING;
  const isSuccess = state.status === UPLOAD_STATUS.SUCCESS;
  const isError = state.status === UPLOAD_STATUS.ERROR;
  const isIdle = state.status === UPLOAD_STATUS.IDLE;

  return {
    state,
    uploadFile,
    clearUpload,
    retryUpload,
    isUploading,
    isSuccess,
    isError,
    isIdle,
    progress: state.progress,
    error: state.error,
    file: state.file,
    imageUrl: state.imageUrl
  };
}

/**
 * Hook for view-specific upload functionality
 */
export function useViewUpload(
  viewType: 'angle' | 'fit' | 'tryon',
  config: Partial<UploadConfig> = {}
) {
  // View-specific configuration
  const viewConfig = useMemo(() => {
    const baseConfig = { ...config };

    switch (viewType) {
      case 'angle':
        return {
          ...baseConfig,
          maxImageDimensions: {
            width: 1920,
            height: 1440 // 4:3 aspect ratio preference
          }
        };
      case 'fit':
        return {
          ...baseConfig,
          maxImageDimensions: {
            width: 1440,
            height: 1920 // 3:4 aspect ratio preference
          }
        };
      case 'tryon':
        return {
          ...baseConfig,
          maxImageDimensions: {
            width: 1920,
            height: 1920 // Square or flexible
          }
        };
      default:
        return baseConfig;
    }
  }, [viewType, config]);

  return useUpload(viewConfig);
}