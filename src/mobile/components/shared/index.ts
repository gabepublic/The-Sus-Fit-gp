/**
 * @fileoverview Shared Components Module - Barrel exports for all shared mobile components
 * @module @/mobile/components/shared
 * @version 1.0.0
 */

// PhotoFrame exports
export {
  PhotoFrame,
  PHOTO_FRAME_STATE,
  type PhotoFrameProps,
  type PhotoFrameState,
  type PhotoFrameViewType,
  type AspectRatio,
  type SharedPhotoFrameProps,
  type SharedPhotoFrameState,
  type SharedPhotoFrameViewConfig,
  getPhotoFrameConfig,
  mergePhotoFrameConfig,
  validatePhotoFrameConfig,
  parseAspectRatio,
  getAspectRatioPadding
} from './PhotoFrame';

// Button exports
export {
  Button,
  UploadButton,
  NextButton,
  type BaseButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonViewType,
  type UploadButtonProps,
  type NextButtonProps,
  type NextButtonConfig,
  type SharedButtonProps,
  type SharedUploadButtonProps,
  type SharedNextButtonProps,
  type SharedButtonVariant,
  type SharedButtonSize,
  type SharedButtonViewType
} from './Button';

// ErrorBoundary exports
export {
  ErrorBoundary,
  useErrorBoundary,
  useErrorRecovery,
  useErrorBoundaryContext,
  type ErrorBoundaryProps,
  type ErrorBoundaryState,
  type ErrorDetails,
  type ErrorCategory,
  type ErrorSeverity,
  type EnhancedError,
  type ErrorReportingConfig,
  type RecoveryStrategy,
  type RecoveryConfig,
  type ErrorBoundaryConfig,
  type ErrorBoundaryContext,
  type ErrorEventType,
  type ErrorEvent,
  type UseErrorBoundaryResult,
  type SharedErrorBoundaryProps,
  type SharedErrorBoundaryState,
  type SharedErrorDetails,
  type SharedErrorBoundaryConfig
} from './ErrorBoundary';

// Progress exports
export {
  ProgressIndicator,
  ErrorDisplay,
  type BaseComponentProps,
  type ProgressVariant,
  type ProgressColorVariant,
  type ProgressIndicatorProps,
  type ErrorDisplayVariant,
  type ErrorDisplayProps,
  type ProgressState,
  type ProgressConfig,
  type SharedProgressIndicatorProps,
  type SharedErrorDisplayProps,
  type SharedProgressState,
  type SharedProgressConfig
} from './Progress';

// Hooks exports
export {
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
  createRetryNavigation,
  type UploadState,
  type ImageMetadata,
  type UploadConfig,
  type ImageValidationResult,
  type UploadResult,
  type ProgressCallback,
  type UploadFunction,
  type ValidationFunction,
  type UseUploadReturn,
  type ImageProcessingOptions,
  type ImageProcessingResult,
  type UseImageProcessingReturn,
  type NavigationConfig,
  type NavigationState,
  type NavigationError,
  type UseNavigationReturn,
  type AnimationConfig,
  type SlideAnimationState,
  type UseSlideAnimationReturn,
  type SharedUploadState,
  type SharedUploadConfig,
  type SharedUseUploadReturn,
  type SharedImageMetadata,
  type SharedNavigationConfig,
  type SharedUseNavigationReturn,
  type SharedAnimationConfig,
  type SharedUseSlideAnimationReturn,
  UPLOAD_STATUS,
  NAVIGATION_STATE,
  DEFAULT_UPLOAD_CONFIG
} from './hooks';

// Component imports for default export
import { PhotoFrame } from './PhotoFrame';
import { Button, UploadButton, NextButton } from './Button';
import { ErrorBoundary, useErrorBoundary, useErrorRecovery, useErrorBoundaryContext } from './ErrorBoundary';
import { ProgressIndicator, ErrorDisplay } from './Progress';
import {
  useUpload,
  useViewUpload,
  useImageProcessing,
  useBatchImageProcessing,
  useNavigation,
  useViewNavigation,
  useSlideAnimation,
  useButtonSlideAnimation
} from './hooks';

// Default export with all components and hooks
export default {
  PhotoFrame,
  Button,
  UploadButton,
  NextButton,
  ErrorBoundary,
  ProgressIndicator,
  ErrorDisplay,
  useErrorBoundary,
  useErrorRecovery,
  useErrorBoundaryContext,
  useUpload,
  useViewUpload,
  useImageProcessing,
  useBatchImageProcessing,
  useNavigation,
  useViewNavigation,
  useSlideAnimation,
  useButtonSlideAnimation
};