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
 * Note: PhotoFrame, UploadButton, NextButton components have been moved to shared components
 * Import from @/mobile/components/shared instead
 */

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

/**
 * Note: ErrorBoundary component has been moved to shared components
 * Import from @/mobile/components/shared instead
 */

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