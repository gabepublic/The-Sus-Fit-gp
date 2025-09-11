/**
 * @fileoverview UploadFit Types Index - Central export point for all type definitions
 * @module @/mobile/components/UploadFit/types
 * @version 1.0.0
 */

// Export all types from upload.types.ts
export * from './upload.types';

// Re-export commonly used types for convenience
export type {
  UploadState,
  UploadStatus,
  UploadAction,
  UploadConfig,
  ImageValidationResult,
  OrientationValidationResult,
  ImageOrientation,
  ImageMetadata,
  PhotoFrameProps,
  UploadButtonProps,
  NextButtonProps,
  UploadFitProps,
  UseUploadReturn,
  UploadResult,
  ValidationFunction,
  OrientationValidationFunction,
  CombinedValidationFunction,
  UploadError,
  AspectRatio
} from './upload.types';

// Re-export orientation constants
export {
  IMAGE_ORIENTATION,
  PORTRAIT_REQUIREMENTS,
  detectImageOrientation,
  isPortraitOrientation,
  meetsPortraitRequirements
} from './upload.types';