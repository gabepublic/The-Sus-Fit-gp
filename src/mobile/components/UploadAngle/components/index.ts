/**
 * @fileoverview UploadAngle Components - Complete component library for Upload Your Angle functionality
 * @module @/mobile/components/UploadAngle/components
 * @version 1.0.0
 * 
 * This module provides a complete set of React components for building upload interfaces.
 * All components are fully accessible, responsive, and follow modern React patterns.
 * 
 * @example
 * ```tsx
 * import { UploadAngle, PhotoFrame, UploadButton } from '@/mobile/components/UploadAngle/components';
 * 
 * function MyUploadView() {
 *   return (
 *     <UploadAngle
 *       onUploadSuccess={(url, metadata) => console.log('Uploaded:', url)}
 *       onUploadError={(error) => console.error('Upload failed:', error)}
 *     />
 *   );
 * }
 * ```
 */

// =============================================================================
// CORE COMPONENTS
// =============================================================================

/**
 * Main UploadAngle container component
 * Orchestrates the complete upload workflow with all sub-components
 */
export { UploadAngle } from './UploadAngle';

/**
 * PhotoFrame component for image display
 * Handles image loading states, aspect ratios, and error states
 */
export { PhotoFrame } from './PhotoFrame';

/**
 * UploadButton component for file selection
 * Provides drag-and-drop functionality and multiple style variants
 */
export { UploadButton } from './UploadButton';

/**
 * NextButton component for workflow progression
 * Provides state-aware navigation with brutalist design
 */
export { NextButton } from './NextButton';

/**
 * ProgressIndicator component for upload progress
 * Supports both linear and circular progress indicators
 */
export { ProgressIndicator } from './ProgressIndicator';

/**
 * ErrorDisplay component for error handling
 * Displays user-friendly error messages with retry functionality
 */
export { ErrorDisplay } from './ErrorDisplay';

// =============================================================================
// COMPONENT TYPES RE-EXPORTS
// =============================================================================

export type {
  UploadAngleProps,
  PhotoFrameProps,
  UploadButtonProps,
  NextButtonProps,
  ProgressIndicatorProps,
  ErrorDisplayProps,
  BaseComponentProps
} from '../types';