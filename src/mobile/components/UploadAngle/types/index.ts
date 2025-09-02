/**
 * @fileoverview UploadAngle Types - Isolated type definitions for the Upload Your Angle View component
 * @module @/mobile/components/UploadAngle/types
 * @version 1.0.0
 * 
 * This module provides comprehensive TypeScript type definitions for the UploadAngle component system.
 * All types are isolated from the main application to prevent circular dependencies and ensure
 * clean separation of concerns.
 * 
 * @example
 * ```typescript
 * import { UploadState, UploadAngleProps, UseUploadReturn } from '@/mobile/components/UploadAngle/types';
 * 
 * const initialState: UploadState = {
 *   status: 'idle',
 *   file: null,
 *   imageUrl: null,
 *   error: null,
 *   progress: 0
 * };
 * ```
 */

// =============================================================================
// CORE STATE TYPES
// =============================================================================

export type {
  // Upload state management
  UploadState,
  UploadStatus,
  UploadAction,
  UploadActionType,
  
  // Individual action types
  SetFileAction,
  SetProgressAction,
  SetSuccessAction,
  SetErrorAction,
  ResetAction
} from './upload.types';

export {
  // Constants
  UPLOAD_STATUS,
  UPLOAD_ACTIONS
} from './upload.types';

// =============================================================================
// VALIDATION & CONFIGURATION TYPES
// =============================================================================

export type {
  // Validation interfaces
  ImageValidationResult,
  ImageMetadata,
  
  // Configuration interfaces
  UploadConfig,
  
  // Utility types
  OptionalUploadConfigKeys,
  RequireUploadConfigKeys,
  FileSizeUnit
} from './upload.types';

export {
  // Default configurations
  DEFAULT_UPLOAD_CONFIG,
  PRODUCTION_UPLOAD_CONFIG
} from './upload.types';

// =============================================================================
// REACT COMPONENT PROP TYPES
// =============================================================================

export type {
  // Base component props
  BaseComponentProps,
  
  // Component-specific props
  PhotoFrameProps,
  PhotoFrameState,
  UploadButtonProps,
  ProgressIndicatorProps,
  ErrorDisplayProps,
  UploadAngleProps,
  
  // Utility types for components
  AspectRatio
} from './upload.types';

export {
  // PhotoFrame constants
  PHOTO_FRAME_STATE
} from './upload.types';

// =============================================================================
// HOOK RETURN TYPES & UTILITIES
// =============================================================================

export type {
  // Generic utilities
  UploadResult,
  ValidationFunction,
  
  // Hook return interfaces
  UseUploadReturn,
  UseImageProcessingReturn,
  UseFileValidationReturn,
  
  // Function types
  UploadFunction,
  UploadWithProgressFunction,
  ProgressCallback
} from './upload.types';

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export type {
  // Error interfaces
  UploadError,
  CreateUploadError,
  
  // Branded types
  ValidatedImageUrl
} from './upload.types';

export {
  // Error factory
  createValidatedImageUrl
} from './upload.types';

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

export {
  // Type guards
  isUploadStatus,
  isUploadError,
  isSuccessfulUpload,
  
  // Constants with type safety
  STATUS_MESSAGES
} from './upload.types';

// =============================================================================
// RE-EXPORTED TYPES FOR CONVENIENCE
// =============================================================================

/**
 * Most commonly used types - re-exported for convenience
 */
export type {
  UploadState as State,
  UploadConfig as Config,
  UseUploadReturn as UploadHook,
  UploadResult as Result,
  ImageValidationResult as ValidationResult
} from './upload.types';