/**
 * @fileoverview Type definitions for UploadFit components
 * @module @/mobile/components/UploadFit/types
 * @version 1.0.0
 */

import { ReactNode, CSSProperties } from 'react';

// =============================================================================
// PROGRESS INDICATOR TYPES
// =============================================================================

/**
 * Progress indicator variant types
 */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Color variants for progress and error states
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'error';

/**
 * Error display types
 */
export type ErrorType = 'error' | 'warning' | 'info';

/**
 * Props for ProgressIndicator component
 */
export interface ProgressIndicatorProps {
  /** Progress value (0-100) */
  progress: number;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Visual variant of progress indicator */
  variant?: ProgressVariant;
  /** Color variant */
  color?: ColorVariant;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Props for ErrorDisplay component
 */
export interface ErrorDisplayProps {
  /** Error to display */
  error: string | Error | null;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Callback for dismiss action */
  onDismiss?: () => void;
  /** Type of error display */
  type?: ErrorType;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show dismiss button */
  showDismiss?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// UPLOAD TYPES
// =============================================================================

/**
 * Upload state types
 */
export type UploadState = 'idle' | 'selecting' | 'processing' | 'uploading' | 'complete' | 'error';

/**
 * Upload status types (alias for compatibility)
 */
export type UploadStatus = UploadState;

/**
 * File validation error types
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Upload percentage (0-100) */
  percentage: number;
  /** Current progress message */
  message?: string;
  /** Bytes uploaded */
  bytesUploaded?: number;
  /** Total bytes to upload */
  totalBytes?: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
}

/**
 * Upload configuration
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Image quality (0-1) */
  quality?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Enable compression */
  enableCompression?: boolean;
}

/**
 * Upload error interface
 */
export interface UploadError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
}

/**
 * Upload result interface
 */
export interface UploadResult {
  /** Upload status */
  status: UploadState;
  /** Uploaded file */
  file: File | null;
  /** Image URL */
  imageUrl: string | null;
  /** Upload error */
  error: UploadError | null;
  /** Upload progress */
  progress: number;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Create upload error function type
 */
export type CreateUploadError = (code: string, message: string, details?: any) => UploadError;

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for MobileUploadButton component
 */
export interface UploadButtonProps {
  /** File selection callback */
  onFileSelect: (file: File) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Button text */
  children?: ReactNode;
  /** CSS class name */
  className?: string;
  /** Test ID */
  testId?: string;
  /** Touch start handler */
  onTouchStart?: () => void;
  /** Touch end handler */
  onTouchEnd?: () => void;
  /** Error handler */
  onError?: (error: string) => void;
  /** Custom styles */
  style?: CSSProperties;
  /** File accept types */
  accept?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Whether this is a redo action */
  isRedo?: boolean;
}

/**
 * Props for NextButton component
 */
export interface NextButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Upload status */
  uploadStatus: UploadState;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Button text */
  children?: ReactNode;
  /** CSS class name */
  className?: string;
  /** Test ID */
  testId?: string;
  /** Upload config */
  config?: UploadConfig;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Photo frame state types
 */
export type PhotoFrameState = 'empty' | 'loading' | 'loaded' | 'error' | 'uploading';

/**
 * Props for PhotoFrame component
 */
export interface PhotoFrameProps {
  /** Image URL */
  imageUrl?: string | null;
  /** Image alt text */
  alt?: string;
  /** Frame state */
  state?: PhotoFrameState;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** CSS class name */
  className?: string;
  /** Test ID */
  testId?: string;
  /** Upload progress */
  progress?: number;
  /** Aspect ratio */
  aspectRatio?: AspectRatio;
  /** Disabled state */
  disabled?: boolean;
  /** File accept types */
  accept?: string;
  /** Image load handler */
  onImageLoad?: () => void;
  /** Image error handler */
  onImageError?: (error: string) => void;
  /** Upload handler */
  onUpload?: (file: File) => void;
  /** Retry handler */
  onRetry?: () => void;
  /** Touch start handler */
  onTouchStart?: () => void;
  /** Touch end handler */
  onTouchEnd?: () => void;
}

// =============================================================================
// CONSTANTS AND ENUMS
// =============================================================================

/**
 * Upload status constants
 */
export const UPLOAD_STATUS = {
  IDLE: 'idle' as const,
  SELECTING: 'selecting' as const,
  PROCESSING: 'processing' as const,
  UPLOADING: 'uploading' as const,
  COMPLETE: 'complete' as const,
  ERROR: 'error' as const,
} as const;

/**
 * Photo frame state constants
 */
export const PHOTO_FRAME_STATE = {
  EMPTY: 'empty' as const,
  LOADING: 'loading' as const,
  LOADED: 'loaded' as const,
  ERROR: 'error' as const,
  UPLOADING: 'uploading' as const,
} as const;

/**
 * Upload actions
 */
export const UPLOAD_ACTIONS = {
  SELECT_FILE: 'SELECT_FILE',
  UPLOAD_START: 'UPLOAD_START',
  UPLOAD_PROGRESS: 'UPLOAD_PROGRESS',
  UPLOAD_SUCCESS: 'UPLOAD_SUCCESS',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  RESET: 'RESET',
} as const;

/**
 * Upload action type
 */
export type UploadAction = keyof typeof UPLOAD_ACTIONS;

/**
 * Image orientation types
 */
export type ImageOrientation = 'portrait' | 'landscape' | 'square';

/**
 * Image orientation constants
 */
export const IMAGE_ORIENTATION = {
  PORTRAIT: 'portrait' as const,
  LANDSCAPE: 'landscape' as const,
  SQUARE: 'square' as const,
} as const;

/**
 * Image metadata interface
 */
export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  orientation: ImageOrientation;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Orientation validation result
 */
export interface OrientationValidationResult {
  isValid: boolean;
  orientation: ImageOrientation;
  errors: ValidationError[];
}

/**
 * Aspect ratio type
 */
export type AspectRatio = '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  quality: 0.8,
  maxWidth: 2048,
  maxHeight: 2048,
  enableCompression: true,
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if value is valid upload status
 */
export const isUploadStatus = (value: any): value is UploadState => {
  return Object.values(UPLOAD_STATUS).includes(value);
};

/**
 * Check if value is upload error
 */
export const isUploadError = (value: any): value is UploadError => {
  return value && typeof value === 'object' && 'code' in value && 'message' in value;
};

/**
 * Check if upload is successful
 */
export const isSuccessfulUpload = (result: any): result is UploadResult => {
  return result && result.status === UPLOAD_STATUS.COMPLETE && result.imageUrl;
};

/**
 * Check if image is portrait orientation
 */
export const isPortraitOrientation = (metadata: ImageMetadata): boolean => {
  return metadata.orientation === IMAGE_ORIENTATION.PORTRAIT;
};