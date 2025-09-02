/**
 * Utility functions and classes for image processing, validation, and upload handling
 * 
 * @example
 * ```typescript
 * import { 
 *   validateImage, 
 *   compressImage, 
 *   createBlobUrl,
 *   IMAGE_VALIDATION_CONSTANTS,
 *   PerformanceUtils
 * } from './utils';
 * 
 * // Validate an image
 * const result = await validateImage(file);
 * if (result.isValid) {
 *   // Process the image
 *   const compressed = await compressImage(file);
 *   const url = createBlobUrl(compressed);
 * }
 * ```
 */

// Re-export image validation utilities
export {
  validateImage,
  validateFileType,
  validateFileSize,
  validateImageDimensions,
  getImageDimensions,
  createUserFriendlyErrorMessage as createValidationErrorMessage,
  ImageValidationError,
  type ValidationResult,
  type ImageDimensions,
} from './imageValidation';

// Re-export upload helper utilities
export {
  compressImage,
  createBlobUrl,
  revokeBlobUrl,
  revokeAllBlobUrls,
  processImageFile,
  resizeImage,
  createUserFriendlyErrorMessage as createUploadErrorMessage,
  CompressionError,
  FileProcessingError,
  type ProcessedImage,
  type CompressionOptions,
  type ResizeOptions,
} from './uploadHelpers';

// Re-export constants
export {
  IMAGE_VALIDATION_CONSTANTS,
  UPLOAD_CONFIG,
  UI_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  FEATURE_DETECTION,
  ERROR_CODES,
  CONSTANTS,
  type SupportedImageFormat,
  type ErrorCode,
  type AnimationDuration,
  type Breakpoint,
} from './constants';

// Re-export error handling utilities
export {
  ImageValidationError as ValidationError,
  CompressionError as ProcessingError,
  FileProcessingError as UploadError,
  ErrorFactory,
  isRetryableError,
  createUserFriendlyErrorMessage,
  ErrorReporter,
  withErrorHandling,
  withRetry,
  type BaseError,
} from './errorHandling';

// Re-export performance optimization utilities
export {
  FeatureDetector,
  PerformanceMonitor,
  MemoryManager,
  ModernImageProcessor,
  IdleCallbackManager,
  PerformanceUtils,
} from './performanceOptimization';

// Import functions for re-export in ImageUtils
import {
  validateImage as _validateImage,
  validateFileType as _validateFileType,
  validateFileSize as _validateFileSize,
  validateImageDimensions as _validateImageDimensions,
} from './imageValidation';

import {
  compressImage as _compressImage,
  resizeImage as _resizeImage,
  processImageFile as _processImageFile,
  createBlobUrl as _createBlobUrl,
  revokeBlobUrl as _revokeBlobUrl,
  revokeAllBlobUrls as _revokeAllBlobUrls,
} from './uploadHelpers';

import {
  IMAGE_VALIDATION_CONSTANTS as _IMAGE_VALIDATION_CONSTANTS,
  UPLOAD_CONFIG as _UPLOAD_CONFIG,
} from './constants';

// Convenience exports for common use cases
export const ImageUtils = {
  // Validation
  validate: _validateImage,
  validateType: _validateFileType,
  validateSize: _validateFileSize,
  validateDimensions: _validateImageDimensions,
  
  // Processing
  compress: _compressImage,
  resize: _resizeImage,
  process: _processImageFile,
  
  // Blob management
  createUrl: _createBlobUrl,
  revokeUrl: _revokeBlobUrl,
  revokeAllUrls: _revokeAllBlobUrls,
  
  // Constants
  constants: _IMAGE_VALIDATION_CONSTANTS,
  uploadConfig: _UPLOAD_CONFIG,
} as const;