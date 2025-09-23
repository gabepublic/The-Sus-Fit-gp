/**
 * @fileoverview Type Guards and Runtime Type Checking for UploadFit
 * @module @/mobile/components/UploadFit/utils/typeGuards
 * @version 1.0.0
 */

import type {
  UploadState,
  UploadStatus,
  UploadAction,
  UploadConfig,
  ImageValidationResult,
  OrientationValidationResult,
  ImageOrientation,
  ImageMetadata,
  UploadResult,
  UploadError,
  PhotoFrameState,
  AspectRatio
} from '../types';

import {
  UPLOAD_STATUS,
  UPLOAD_ACTIONS,
  IMAGE_ORIENTATION,
  PHOTO_FRAME_STATE,
  isUploadStatus,
  isUploadError,
  isSuccessfulUpload,
  isPortraitOrientation
} from '../types/index';

/**
 * Type guard to check if value is a valid File object
 * 
 * @param value Value to check
 * @returns Whether value is a File
 */
export const isFile = (value: unknown): value is File => {
  return value instanceof File;
};

/**
 * Type guard to check if value is a valid UploadState
 * 
 * @param value Value to check
 * @returns Whether value is UploadState
 */
export const isUploadState = (value: unknown): value is UploadState => {
  if (!value || typeof value !== 'object') return false;
  
  const state = value as Record<string, unknown>;
  
  return (
    isUploadStatus(state.status) &&
    (state.file === null || isFile(state.file)) &&
    (state.imageUrl === null || typeof state.imageUrl === 'string') &&
    (state.error === null || typeof state.error === 'string') &&
    typeof state.progress === 'number' &&
    state.progress >= 0 &&
    state.progress <= 100
  );
};

/**
 * Type guard to check if value is a valid UploadAction
 * 
 * @param value Value to check
 * @returns Whether value is UploadAction
 */
export const isUploadAction = (value: unknown): value is UploadAction => {
  if (!value || typeof value !== 'object') return false;
  
  const action = value as Record<string, unknown>;
  
  if (!action.type || typeof action.type !== 'string') return false;
  
  const actionType = action.type;
  
  // Check if it's a valid action type
  if (!Object.values(UPLOAD_ACTIONS).includes(actionType as any)) return false;
  
  // Validate payload based on action type
  switch (actionType) {
    case UPLOAD_ACTIONS.SET_FILE:
      return Boolean(
        action.payload &&
        typeof action.payload === 'object' &&
        isFile((action.payload as any).file) &&
        typeof (action.payload as any).imageUrl === 'string'
      );

    case UPLOAD_ACTIONS.SET_PROGRESS:
      return Boolean(
        action.payload &&
        typeof action.payload === 'object' &&
        typeof (action.payload as any).progress === 'number' &&
        (action.payload as any).progress >= 0 &&
        (action.payload as any).progress <= 100
      );

    case UPLOAD_ACTIONS.SET_SUCCESS:
      return Boolean(
        action.payload &&
        typeof action.payload === 'object' &&
        typeof (action.payload as any).imageUrl === 'string'
      );

    case UPLOAD_ACTIONS.SET_ERROR:
      return Boolean(
        action.payload &&
        typeof action.payload === 'object' &&
        typeof (action.payload as any).error === 'string'
      );
      
    case UPLOAD_ACTIONS.RESET:
      return true; // Reset action has no payload
      
    default:
      return false;
  }
};

/**
 * Type guard to check if value is a valid ImageOrientation
 * 
 * @param value Value to check
 * @returns Whether value is ImageOrientation
 */
export const isImageOrientation = (value: unknown): value is ImageOrientation => {
  return typeof value === 'string' && Object.values(IMAGE_ORIENTATION).includes(value as ImageOrientation);
};

/**
 * Type guard to check if value is a valid PhotoFrameState
 * 
 * @param value Value to check
 * @returns Whether value is PhotoFrameState
 */
export const isPhotoFrameState = (value: unknown): value is PhotoFrameState => {
  return typeof value === 'string' && Object.values(PHOTO_FRAME_STATE).includes(value as PhotoFrameState);
};

/**
 * Type guard to check if value is a valid UploadConfig
 * 
 * @param value Value to check
 * @returns Whether value is UploadConfig
 */
export const isUploadConfig = (value: unknown): value is UploadConfig => {
  if (!value || typeof value !== 'object') return false;
  
  const config = value as Record<string, unknown>;
  
  return (
    typeof config.maxFileSize === 'number' &&
    config.maxFileSize > 0 &&
    Array.isArray(config.allowedTypes) &&
    config.allowedTypes.every(type => typeof type === 'string') &&
    typeof config.quality === 'number' &&
    config.quality >= 0 &&
    config.quality <= 1 &&
    typeof config.maxWidth === 'number' &&
    config.maxWidth > 0 &&
    typeof config.maxHeight === 'number' &&
    config.maxHeight > 0 &&
    typeof config.enableCompression === 'boolean'
  );
};

/**
 * Type guard to check if value is a valid ImageValidationResult
 * 
 * @param value Value to check
 * @returns Whether value is ImageValidationResult
 */
export const isImageValidationResult = (value: unknown): value is ImageValidationResult => {
  if (!value || typeof value !== 'object') return false;
  
  const result = value as Record<string, unknown>;
  
  return (
    typeof result.isValid === 'boolean' &&
    Array.isArray(result.errors) &&
    result.errors.every(error => typeof error === 'string') &&
    Array.isArray(result.warnings) &&
    result.warnings.every(warning => typeof warning === 'string')
  );
};

/**
 * Type guard to check if value is a valid OrientationValidationResult
 * 
 * @param value Value to check
 * @returns Whether value is OrientationValidationResult
 */
export const isOrientationValidationResult = (value: unknown): value is OrientationValidationResult => {
  if (!isImageValidationResult(value)) return false;
  
  const result = value as unknown as Record<string, unknown>;
  
  return (
    isImageOrientation(result.orientation) &&
    typeof result.aspectRatio === 'number' &&
    typeof result.meetsOrientationRequirements === 'boolean' &&
    Array.isArray(result.orientationFeedback) &&
    result.orientationFeedback.every(feedback => typeof feedback === 'string')
  );
};

/**
 * Type guard to check if value is a valid ImageMetadata
 * 
 * @param value Value to check
 * @returns Whether value is ImageMetadata
 */
export const isImageMetadata = (value: unknown): value is ImageMetadata => {
  if (!value || typeof value !== 'object') return false;
  
  const metadata = value as Record<string, unknown>;
  
  return (
    typeof metadata.filename === 'string' &&
    typeof metadata.size === 'number' &&
    metadata.size >= 0 &&
    typeof metadata.type === 'string' &&
    typeof metadata.width === 'number' &&
    metadata.width > 0 &&
    typeof metadata.height === 'number' &&
    metadata.height > 0 &&
    typeof metadata.lastModified === 'number'
  );
};

/**
 * Type guard to check if value is a valid UploadResult
 *
 * @param value Value to check
 * @returns Whether value is UploadResult
 */
export const isUploadResult = (value: unknown): value is UploadResult => {
  if (!value || typeof value !== 'object') return false;
  
  const result = value as Record<string, unknown>;
  
  return (
    typeof result.success === 'boolean' &&
    (result.error === null || typeof result.error === 'string') &&
    (result.success ? result.data !== null : result.data === null)
  );
};

/**
 * Type guard to check if value is a valid AspectRatio string
 * 
 * @param value Value to check
 * @returns Whether value is AspectRatio
 */
export const isAspectRatio = (value: unknown): value is AspectRatio => {
  if (typeof value !== 'string') return false;
  
  // Check for special values
  if (value === 'auto' || value === 'inherit') return true;
  
  // Check for ratio format (e.g., "3:4", "16:9")
  const ratioPattern = /^\d+(\.\d+)?:\d+(\.\d+)?$/;
  return ratioPattern.test(value);
};

/**
 * Type guard to check if a file is an image
 * 
 * @param file File to check
 * @returns Whether file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Type guard to check if an image file is supported
 * 
 * @param file File to check
 * @param allowedTypes Optional array of allowed MIME types
 * @returns Whether image file is supported
 */
export const isSupportedImageFile = (file: File, allowedTypes?: string[]): boolean => {
  if (!isImageFile(file)) return false;
  
  if (allowedTypes) {
    return allowedTypes.includes(file.type);
  }
  
  // Common supported image types
  const defaultSupportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  return defaultSupportedTypes.includes(file.type);
};

/**
 * Type guard to check if a value is a positive number
 * 
 * @param value Value to check
 * @returns Whether value is a positive number
 */
export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
};

/**
 * Type guard to check if a value is a valid percentage (0-100)
 * 
 * @param value Value to check
 * @returns Whether value is a valid percentage
 */
export const isPercentage = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value);
};

/**
 * Type guard to check if a value is a non-empty string
 * 
 * @param value Value to check
 * @returns Whether value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Runtime type checker for upload component props
 * 
 * @param props Props object to validate
 * @returns Validation result with detailed errors
 */
export const validateUploadProps = (props: Record<string, unknown>) => {
  const errors: string[] = [];
  
  // Check optional config
  if (props.config !== undefined && !isUploadConfig(props.config)) {
    errors.push('config must be a valid UploadConfig object');
  }
  
  // Check optional callbacks
  if (props.onUploadSuccess !== undefined && typeof props.onUploadSuccess !== 'function') {
    errors.push('onUploadSuccess must be a function');
  }
  
  if (props.onUploadError !== undefined && typeof props.onUploadError !== 'function') {
    errors.push('onUploadError must be a function');
  }
  
  if (props.onProgressChange !== undefined && typeof props.onProgressChange !== 'function') {
    errors.push('onProgressChange must be a function');
  }
  
  if (props.onNext !== undefined && typeof props.onNext !== 'function') {
    errors.push('onNext must be a function');
  }
  
  // Check optional boolean props
  if (props.disabled !== undefined && typeof props.disabled !== 'boolean') {
    errors.push('disabled must be a boolean');
  }
  
  // Check optional string props
  if (props.initialImageUrl !== undefined && !isNonEmptyString(props.initialImageUrl)) {
    errors.push('initialImageUrl must be a non-empty string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Re-export commonly used type guards from types module
export {
  isUploadStatus,
  isUploadError,
  isSuccessfulUpload,
  isPortraitOrientation
};