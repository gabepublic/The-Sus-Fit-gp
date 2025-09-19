/**
 * @fileoverview UploadFit Components Index - Central export point for all UploadFit components
 * @module @/mobile/components/UploadFit/components
 * @version 1.0.0
 */

// Core components
export { UploadFit } from './UploadFit';
export { ProgressIndicator } from './ProgressIndicator';
export { ErrorDisplay } from './ErrorDisplay';
export { UploadFitWithErrorBoundary } from './UploadFitWithErrorBoundary';

// Note: PhotoFrame, MobileUploadButton, NextButton, ErrorBoundary components have been moved to shared components
// Import from @/mobile/components/shared instead

// Re-export types
export type {
  ProgressIndicatorProps,
  ErrorDisplayProps,
  ProgressVariant,
  ColorVariant,
  ErrorType,
  UploadState,
  ValidationError,
  UploadProgress
} from '../types';