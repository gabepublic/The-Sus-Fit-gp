/**
 * @fileoverview useFitUpload - Simplified React hook for managing fit upload state
 * @module @/mobile/components/UploadFit/hooks/useFitUpload
 * @version 2.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  UploadState,
  UseUploadReturn,
  UploadResult,
  UploadConfig,
  ImageValidationResult,
  ValidationFunction,
  UploadFunction,
  ImageMetadata
} from '../types/upload.types';
import {
  UPLOAD_STATUS,
  DEFAULT_UPLOAD_CONFIG
} from '../types/upload.types';

/**
 * Simple upload state interface
 */
interface SimpleUploadState extends UploadState {
  metadata: ImageMetadata | null;
}

/**
 * Initial upload state
 */
const initialState: SimpleUploadState = {
  status: UPLOAD_STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0,
  metadata: null
};

export function useFitUpload(
  config: Partial<UploadConfig> = {}
): UseUploadReturn {
  // Merge config with defaults
  const uploadConfig = useMemo(
    () => ({ ...DEFAULT_UPLOAD_CONFIG, ...config }),
    [config]
  );

  // Simple state management with useState
  const [state, setState] = useState<SimpleUploadState>(initialState);

  /**
   * Validates a file against the upload configuration
   */
  const validateFile: ValidationFunction<File> = useCallback(
    (file: File): ImageValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // File size validation
      if (file.size > uploadConfig.maxFileSize) {
        errors.push(
          `File size ${(file.size / 1024 / 1024).toFixed(
            1
          )}MB exceeds maximum ${(
            uploadConfig.maxFileSize /
            1024 /
            1024
          ).toFixed(1)}MB`
        );
      }

      // File type validation
      if (!uploadConfig.allowedTypes.includes(file.type)) {
        errors.push(
          `File type ${
            file.type
          } is not supported. Allowed types: ${uploadConfig.allowedTypes.join(
            ', '
          )}`
        );
      }

      // File name validation
      if (!file.name || file.name.trim().length === 0) {
        errors.push('File must have a valid name');
      }

      // Warning for large files that will be compressed
      if (file.size > 2 * 1024 * 1024 && uploadConfig.enableCompression) {
        warnings.push('Large file will be compressed to reduce upload time');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    },
    [uploadConfig]
  );

  /**
   * Creates image metadata from a file
   */
  const createImageMetadata = useCallback(
    async (file: File): Promise<ImageMetadata> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            filename: file.name,
            size: file.size,
            type: file.type,
            width: img.naturalWidth,
            height: img.naturalHeight,
            lastModified: file.lastModified
          });
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load image for metadata extraction'));
        };

        img.src = objectUrl;
      });
    },
    []
  );

  /**
   * Upload function - simplified implementation
   */
  const uploadFile: UploadFunction = useCallback(
    async (file: File): Promise<UploadResult<string>> => {
      // Validation
      const validation = validateFile(file);
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error: validation.errors.join('; ')
        }));
        return {
          success: false,
          data: null,
          error: validation.errors.join('; ')
        };
      }

      try {
        // Set uploading state
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.UPLOADING,
          file,
          error: null,
          progress: 0
        }));

        // Extract image metadata
        const metadata = await createImageMetadata(file);

        // Create object URL for preview
        const imageUrl = URL.createObjectURL(file);

        // Simulate upload progress (for demo purposes)
        for (let i = 0; i <= 100; i += 10) {
          setState(prev => ({
            ...prev,
            progress: i
          }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Set success state
        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.SUCCESS,
          imageUrl,
          progress: 100,
          metadata
        }));

        return {
          success: true,
          data: imageUrl,
          error: null
        };
      } catch (error) {
        const uploadError =
          error instanceof Error ? error : new Error('Unknown upload error');

        setState(prev => ({
          ...prev,
          status: UPLOAD_STATUS.ERROR,
          error: uploadError.message
        }));

        return {
          success: false,
          data: null,
          error: uploadError.message
        };
      }
    },
    [validateFile, createImageMetadata]
  );

  /**
   * Resets upload state
   */
  const reset = useCallback(() => {
    // Clean up any blob URLs
    if (state.imageUrl && state.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.imageUrl);
    }

    setState(initialState);
  }, [state.imageUrl]);

  // Computed properties
  const isUploading = useMemo(
    () => state.status === UPLOAD_STATUS.UPLOADING,
    [state.status]
  );

  const canUpload = useMemo(
    () =>
      state.status === UPLOAD_STATUS.IDLE ||
      state.status === UPLOAD_STATUS.ERROR,
    [state.status]
  );

  return {
    state,
    uploadFile,
    reset,
    isUploading,
    canUpload,
    validateFile
  };
}

export default useFitUpload;