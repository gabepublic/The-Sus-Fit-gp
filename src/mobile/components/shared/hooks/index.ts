/**
 * @fileoverview Shared Hooks Module - Barrel exports for shared upload functionality hooks
 * @module @/mobile/components/shared/hooks
 * @version 1.0.0
 */

// Upload hooks
export { useUpload, useViewUpload } from './useUpload';
export { useImageProcessing, useBatchImageProcessing } from './useImageProcessing';

// Navigation hooks
export {
  useNavigation,
  useViewNavigation,
  isRetryableNavigationError,
  getNavigationErrorMessage,
  createRetryNavigation
} from './useNavigation';

// Animation hooks
export {
  useSlideAnimation,
  useButtonSlideAnimation,
  generateSlideAnimationCSS
} from './useSlideAnimation';

// Type exports
export type {
  // Upload types
  UploadStatus,
  UploadState,
  ImageMetadata,
  UploadConfig,
  ImageValidationResult,
  UploadResult,
  ProgressCallback,
  UploadFunction,
  ValidationFunction,
  UseUploadReturn,

  // Image processing types
  ImageProcessingOptions,
  ImageProcessingResult,
  UseImageProcessingReturn,

  // Navigation types
  NavigationConfig,
  NavigationState,
  NavigationError,
  UseNavigationReturn,

  // Animation types
  AnimationConfig,
  SlideAnimationState,
  UseSlideAnimationReturn,

  // Shared convenience types
  SharedUploadState,
  SharedUploadConfig,
  SharedUseUploadReturn,
  SharedImageMetadata,
  SharedNavigationConfig,
  SharedUseNavigationReturn,
  SharedAnimationConfig,
  SharedUseSlideAnimationReturn
} from './hooks.types';

// Constants
export {
  UPLOAD_STATUS,
  NAVIGATION_STATE,
  DEFAULT_UPLOAD_CONFIG
} from './hooks.types';

// Component imports for default export
import { useUpload, useViewUpload } from './useUpload';
import { useImageProcessing, useBatchImageProcessing } from './useImageProcessing';
import {
  useNavigation,
  useViewNavigation,
  isRetryableNavigationError,
  getNavigationErrorMessage,
  createRetryNavigation
} from './useNavigation';
import {
  useSlideAnimation,
  useButtonSlideAnimation,
  generateSlideAnimationCSS
} from './useSlideAnimation';

// Default export with all hooks
export default {
  useUpload,
  useViewUpload,
  useImageProcessing,
  useBatchImageProcessing,
  useNavigation,
  useViewNavigation,
  useSlideAnimation,
  useButtonSlideAnimation,
  generateSlideAnimationCSS,
  isRetryableNavigationError,
  getNavigationErrorMessage,
  createRetryNavigation
};