/**
 * @fileoverview UploadAngle Type Definitions - Complete TypeScript type system
 * @module @/mobile/components/UploadAngle/types/upload.types
 * @version 1.0.0
 */

// =============================================================================
// CORE UPLOAD STATE TYPES (Subtask 2.1)
// =============================================================================

/**
 * Upload status enumeration using const assertion for strict typing
 */
export const UPLOAD_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading', 
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

/**
 * Upload status union type derived from const assertion
 */
export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];

/**
 * Core upload state interface defining the complete state structure
 * 
 * @interface UploadState
 * @example
 * ```typescript
 * const initialState: UploadState = {
 *   status: 'idle',
 *   file: null,
 *   imageUrl: null,
 *   error: null,
 *   progress: 0
 * };
 * ```
 */
export interface UploadState {
  /** Current upload status */
  status: UploadStatus;
  /** Selected file for upload */
  file: File | null;
  /** Generated image URL after processing */
  imageUrl: string | null;
  /** Error message if upload fails */
  error: string | null;
  /** Upload progress percentage (0-100) */
  progress: number;
}

/**
 * Upload state actions for state management
 */
export const UPLOAD_ACTIONS = {
  SET_FILE: 'SET_FILE',
  SET_PROGRESS: 'SET_PROGRESS', 
  SET_SUCCESS: 'SET_SUCCESS',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET'
} as const;

/**
 * Upload action type union
 */
export type UploadActionType = typeof UPLOAD_ACTIONS[keyof typeof UPLOAD_ACTIONS];

/**
 * Upload state action interfaces
 */
export interface SetFileAction {
  type: typeof UPLOAD_ACTIONS.SET_FILE;
  payload: { file: File; imageUrl: string };
}

export interface SetProgressAction {
  type: typeof UPLOAD_ACTIONS.SET_PROGRESS;
  payload: { progress: number };
}

export interface SetSuccessAction {
  type: typeof UPLOAD_ACTIONS.SET_SUCCESS;
  payload: { imageUrl: string };
}

export interface SetErrorAction {
  type: typeof UPLOAD_ACTIONS.SET_ERROR;
  payload: { error: string };
}

export interface ResetAction {
  type: typeof UPLOAD_ACTIONS.RESET;
}

/**
 * Union type of all upload actions
 */
export type UploadAction = 
  | SetFileAction
  | SetProgressAction 
  | SetSuccessAction
  | SetErrorAction
  | ResetAction;

// =============================================================================
// IMAGE VALIDATION & CONFIGURATION TYPES (Subtask 2.2)
// =============================================================================

/**
 * Image validation result interface
 * 
 * @interface ImageValidationResult
 * @example
 * ```typescript
 * const validation: ImageValidationResult = {
 *   isValid: false,
 *   errors: ['File size exceeds maximum limit'],
 *   warnings: ['Image quality may be reduced']
 * };
 * ```
 */
export interface ImageValidationResult {
  /** Whether the image passes all validation checks */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Array of non-blocking warning messages */
  warnings: string[];
}

/**
 * Upload configuration interface for customizing behavior
 * 
 * @interface UploadConfig
 * @example
 * ```typescript
 * const config: UploadConfig = {
 *   maxFileSize: 10 * 1024 * 1024, // 10MB
 *   allowedTypes: ['image/jpeg', 'image/png'],
 *   quality: 0.8,
 *   maxWidth: 2048,
 *   maxHeight: 2048,
 *   enableCompression: true
 * };
 * ```
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Array of allowed MIME types */
  allowedTypes: string[];
  /** Image quality for compression (0-1) */
  quality: number;
  /** Maximum image width in pixels */
  maxWidth: number;
  /** Maximum image height in pixels */  
  maxHeight: number;
  /** Whether to enable automatic compression */
  enableCompression: boolean;
}

/**
 * Default upload configuration satisfying UploadConfig interface
 */
export const DEFAULT_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  quality: 0.8,
  maxWidth: 2048,
  maxHeight: 2048,
  enableCompression: true
} satisfies UploadConfig;

/**
 * Image metadata interface
 */
export interface ImageMetadata {
  /** Original file name */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Last modified timestamp */
  lastModified: number;
}

// =============================================================================
// REACT COMPONENT PROP TYPES (Subtask 2.3)
// =============================================================================

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * PhotoFrame component state enumeration
 */
export const PHOTO_FRAME_STATE = {
  EMPTY: 'empty',
  UPLOADING: 'uploading',
  LOADED: 'loaded',
  ERROR: 'error'
} as const;

/**
 * PhotoFrame state union type
 */
export type PhotoFrameState = typeof PHOTO_FRAME_STATE[keyof typeof PHOTO_FRAME_STATE];

/**
 * PhotoFrame component props interface
 * 
 * @interface PhotoFrameProps
 * @extends BaseComponentProps
 * @example
 * ```typescript
 * const props: PhotoFrameProps = {
 *   imageUrl: 'https://example.com/image.jpg',
 *   alt: 'User uploaded image',
 *   onImageLoad: () => console.log('Image loaded'),
 *   onUpload: (file) => console.log('Upload triggered'),
 *   onRetry: () => console.log('Retry triggered'),
 *   aspectRatio: '4:3',
 *   state: 'loaded'
 * };
 * ```
 */
export interface PhotoFrameProps extends BaseComponentProps {
  /** Image URL to display */
  imageUrl: string | null;
  /** Alternative text for accessibility */
  alt: string;
  /** Current component state */
  state?: PhotoFrameState;
  /** Upload progress percentage (0-100) */
  progress?: number;
  /** Error message to display */
  error?: string | null;
  /** Aspect ratio string (e.g., '4:3', '16:9') */
  aspectRatio?: AspectRatio;
  /** Whether to show loading spinner */
  loading?: boolean;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Callback when image loads successfully */
  onImageLoad?: () => void;
  /** Callback when image fails to load */
  onImageError?: (error: Event) => void;
  /** Callback when upload is triggered */
  onUpload?: (event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => void;
  /** Callback when retry is triggered */
  onRetry?: () => void;
  /** Callback for touch start events */
  onTouchStart?: (event: React.TouchEvent) => void;
  /** Callback for touch end events */
  onTouchEnd?: (event: React.TouchEvent) => void;
  /** Accept attribute for file input */
  accept?: string;
}

/**
 * UploadButton component props interface
 * 
 * @interface UploadButtonProps  
 * @extends BaseComponentProps
 * @example
 * ```typescript
 * const props: UploadButtonProps = {
 *   onFileSelect: (file) => console.log('File selected:', file.name),
 *   accept: 'image/*',
 *   disabled: false,
 *   variant: 'primary'
 * };
 * ```
 */
export interface UploadButtonProps extends BaseComponentProps {
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Accepted file types (input accept attribute) */
  accept?: string;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Optional children content */
  children?: React.ReactNode;
}

/**
 * ProgressIndicator component props interface
 * 
 * @interface ProgressIndicatorProps
 * @extends BaseComponentProps
 */
export interface ProgressIndicatorProps extends BaseComponentProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Progress bar variant */
  variant?: 'linear' | 'circular';
  /** Color scheme */
  color?: 'primary' | 'secondary' | 'success' | 'error';
}

/**
 * ErrorDisplay component props interface
 * 
 * @interface ErrorDisplayProps
 * @extends BaseComponentProps
 */
export interface ErrorDisplayProps extends BaseComponentProps {
  /** Error message to display */
  error: string;
  /** Callback to retry the operation */
  onRetry?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Error severity level */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Main UploadAngle container props interface
 * 
 * @interface UploadAngleProps
 * @extends BaseComponentProps
 */
export interface UploadAngleProps extends BaseComponentProps {
  /** Upload configuration */
  config?: Partial<UploadConfig>;
  /** Callback when upload completes successfully */
  onUploadSuccess?: (imageUrl: string, metadata: ImageMetadata) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Callback when upload progress changes */
  onProgressChange?: (progress: number) => void;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Initial image URL */
  initialImageUrl?: string;
}

// =============================================================================
// HOOK RETURN TYPES & GENERIC UTILITIES (Subtask 2.4)
// =============================================================================

/**
 * Generic upload result interface with type parameter
 * 
 * @template T The type of the result data
 * @interface UploadResult
 * @example
 * ```typescript
 * const result: UploadResult<ImageMetadata> = {
 *   success: true,
 *   data: { filename: 'image.jpg', size: 12345, ... },
 *   error: null
 * };
 * ```
 */
export interface UploadResult<T = unknown> {
  /** Whether operation was successful */
  success: boolean;
  /** Result data if successful */
  data: T | null;
  /** Error message if failed */
  error: string | null;
}

/**
 * Generic validation function type
 * 
 * @template T The type being validated
 */
export type ValidationFunction<T> = (value: T) => ImageValidationResult;

/**
 * Upload hook return interface
 * 
 * @interface UseUploadReturn
 * @example
 * ```typescript
 * const {
 *   state,
 *   uploadFile,
 *   reset,
 *   isUploading,
 *   canUpload
 * } = useUpload();
 * ```
 */
export interface UseUploadReturn {
  /** Current upload state */
  state: UploadState;
  /** Function to initiate file upload */
  uploadFile: (file: File) => Promise<UploadResult<string>>;
  /** Function to reset upload state */
  reset: () => void;
  /** Whether currently uploading */
  isUploading: boolean;
  /** Whether upload is possible */
  canUpload: boolean;
  /** Validation function for files */
  validateFile: ValidationFunction<File>;
}

/**
 * Image processing hook return interface
 */
export interface UseImageProcessingReturn {
  /** Process image with given options */
  processImage: (file: File, options?: Partial<UploadConfig>) => Promise<UploadResult<Blob>>;
  /** Generate thumbnail from image */
  generateThumbnail: (file: File, maxSize?: number) => Promise<UploadResult<string>>;
  /** Get image dimensions */
  getImageDimensions: (file: File) => Promise<UploadResult<{ width: number; height: number }>>;
  /** Whether processing is in progress */
  isProcessing: boolean;
}

/**
 * File validation hook return interface  
 */
export interface UseFileValidationReturn {
  /** Validate file against config */
  validateFile: ValidationFunction<File>;
  /** Validate multiple files */
  validateFiles: (files: File[]) => ImageValidationResult[];
  /** Current validation config */
  config: UploadConfig;
  /** Update validation config */
  updateConfig: (config: Partial<UploadConfig>) => void;
}

// =============================================================================
// ASYNC & ERROR HANDLING TYPES
// =============================================================================

/**
 * Custom upload error class interface
 */
export interface UploadError extends Error {
  /** Error code for categorization */
  code: 'VALIDATION_ERROR' | 'UPLOAD_ERROR' | 'PROCESSING_ERROR' | 'NETWORK_ERROR';
  /** Additional error metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Upload error factory function type
 */
export type CreateUploadError = (
  message: string, 
  code: UploadError['code'], 
  metadata?: Record<string, unknown>
) => UploadError;

/**
 * Async upload function type with proper error handling
 */
export type UploadFunction = (
  file: File, 
  config?: Partial<UploadConfig>
) => Promise<UploadResult<string>>;

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Upload with progress function type
 */
export type UploadWithProgressFunction = (
  file: File,
  onProgress?: ProgressCallback,
  config?: Partial<UploadConfig>
) => Promise<UploadResult<string>>;

// =============================================================================
// UTILITY TYPES & TYPE GUARDS
// =============================================================================

/**
 * Extract keys from upload config that are optional
 */
export type OptionalUploadConfigKeys = {
  [K in keyof UploadConfig]: UploadConfig[K] extends NonNullable<UploadConfig[K]> ? never : K;
}[keyof UploadConfig];

/**
 * Require specific keys from upload config
 */
export type RequireUploadConfigKeys<T extends keyof UploadConfig> = Required<Pick<UploadConfig, T>> & 
  Partial<Omit<UploadConfig, T>>;

/**
 * Type guard to check if value is valid upload status
 * 
 * @param value Value to check
 * @returns Whether value is valid UploadStatus
 */
export const isUploadStatus = (value: unknown): value is UploadStatus => {
  return typeof value === 'string' && Object.values(UPLOAD_STATUS).includes(value as UploadStatus);
};

/**
 * Type guard to check if error is UploadError
 * 
 * @param error Error to check
 * @returns Whether error is UploadError
 */
export const isUploadError = (error: unknown): error is UploadError => {
  return error instanceof Error && 
         'code' in error && 
         typeof (error as UploadError).code === 'string';
};

/**
 * Type predicate to check if upload result was successful
 * 
 * @param result Upload result to check
 * @returns Whether result indicates success
 */
export const isSuccessfulUpload = <T>(result: UploadResult<T>): result is UploadResult<T> & { success: true; data: T } => {
  return result.success && result.data !== null;
};

// =============================================================================
// MODERN TYPESCRIPT 5.x FEATURES
// =============================================================================

/**
 * Upload configuration with satisfies operator for type safety
 */
export const PRODUCTION_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB for production
  allowedTypes: ['image/jpeg', 'image/png'] as const,
  quality: 0.9,
  maxWidth: 1920,
  maxHeight: 1920,
  enableCompression: true
} satisfies UploadConfig;

/**
 * Status mapping with const assertion for exhaustive checking
 */
export const STATUS_MESSAGES = {
  [UPLOAD_STATUS.IDLE]: 'Ready to upload',
  [UPLOAD_STATUS.UPLOADING]: 'Uploading...',
  [UPLOAD_STATUS.SUCCESS]: 'Upload successful',
  [UPLOAD_STATUS.ERROR]: 'Upload failed'
} as const satisfies Record<UploadStatus, string>;

/**
 * Template literal type for CSS aspect ratio values
 */
export type AspectRatio = `${number}:${number}` | 'auto' | 'inherit';

/**
 * Template literal type for file size units
 */
export type FileSizeUnit = `${number}${'B' | 'KB' | 'MB' | 'GB'}`;

/**
 * Branded type for validated file URLs
 */
export type ValidatedImageUrl = string & { readonly __brand: 'ValidatedImageUrl' };

/**
 * Utility to create validated image URL
 */
export const createValidatedImageUrl = (url: string): ValidatedImageUrl => {
  // URL validation would happen here
  return url as ValidatedImageUrl;
};