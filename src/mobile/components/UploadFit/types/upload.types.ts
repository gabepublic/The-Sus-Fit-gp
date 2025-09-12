/**
 * @fileoverview UploadFit Type Definitions - Complete TypeScript type system
 * @module @/mobile/components/UploadFit/types/upload.types
 * @version 1.0.0
 */

// =============================================================================
// CORE UPLOAD STATE TYPES (Subtask 1.2)
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
 * Core upload state interface defining the complete state structure for fit uploads
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
// IMAGE VALIDATION & CONFIGURATION TYPES (Subtask 1.2)
// =============================================================================

/**
 * Image orientation enumeration for fit uploads
 */
export const IMAGE_ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  SQUARE: 'square'
} as const;

/**
 * Image orientation union type
 */
export type ImageOrientation = typeof IMAGE_ORIENTATION[keyof typeof IMAGE_ORIENTATION];

/**
 * Portrait validation requirements for fit uploads
 */
export const PORTRAIT_REQUIREMENTS = {
  MIN_ASPECT_RATIO: 0.5,  // 1:2 ratio (height > 2x width)
  MAX_ASPECT_RATIO: 0.9,  // 9:10 ratio (roughly square limit)
  PREFERRED_ASPECT_RATIO: 0.75, // 3:4 ratio (ideal portrait)
  MIN_HEIGHT: 800,        // Minimum height in pixels
  MIN_WIDTH: 400          // Minimum width in pixels
} as const;

/**
 * Orientation validation result interface
 */
export interface OrientationValidationResult extends ImageValidationResult {
  /** Detected image orientation */
  orientation: ImageOrientation;
  /** Calculated aspect ratio (width/height) */
  aspectRatio: number;
  /** Whether orientation meets fit upload requirements */
  meetsOrientationRequirements: boolean;
  /** Specific orientation feedback messages */
  orientationFeedback: string[];
}

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
 * Upload configuration interface for customizing fit upload behavior
 * 
 * @interface UploadConfig
 * @example
 * ```typescript
 * const config: UploadConfig = {
 *   maxFileSize: 15 * 1024 * 1024, // 15MB for fit photos
 *   allowedTypes: ['image/jpeg', 'image/png'],
 *   quality: 0.8,
 *   maxWidth: 2048,
 *   maxHeight: 2048,
 *   enableCompression: true,
 *   enforcePortraitOrientation: true,
 *   allowedOrientations: ['portrait']
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
  /** Whether to enforce portrait orientation for fit uploads */
  enforcePortraitOrientation?: boolean;
  /** Allowed image orientations */
  allowedOrientations?: ImageOrientation[];
  /** Minimum aspect ratio (width/height) */
  minAspectRatio?: number;
  /** Maximum aspect ratio (width/height) */
  maxAspectRatio?: number;
}

/**
 * Default upload configuration for fit uploads
 */
export const DEFAULT_UPLOAD_CONFIG = {
  maxFileSize: 15 * 1024 * 1024, // 15MB - larger for full body fit photos
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  quality: 0.85, // Slightly higher quality for fit analysis
  maxWidth: 2048,
  maxHeight: 2048,
  enableCompression: true,
  enforcePortraitOrientation: true,
  allowedOrientations: [IMAGE_ORIENTATION.PORTRAIT],
  minAspectRatio: PORTRAIT_REQUIREMENTS.MIN_ASPECT_RATIO,
  maxAspectRatio: PORTRAIT_REQUIREMENTS.MAX_ASPECT_RATIO
} satisfies UploadConfig;

/**
 * Image metadata interface for fit uploads
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
// REACT COMPONENT PROP TYPES (Subtask 1.2)
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
 * PhotoFrame component state enumeration for fit uploads
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
 * PhotoFrame component props interface for fit uploads
 * 
 * @interface PhotoFrameProps
 * @extends BaseComponentProps
 * @example
 * ```typescript
 * const props: PhotoFrameProps = {
 *   imageUrl: 'https://example.com/fit-image.jpg',
 *   alt: 'User uploaded fit image',
 *   onImageLoad: () => console.log('Fit image loaded'),
 *   onUpload: (file) => console.log('Fit upload triggered'),
 *   onRetry: () => console.log('Fit retry triggered'),
 *   aspectRatio: '3:4',
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
  /** Aspect ratio string (e.g., '3:4', '9:16') */
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
  /** Whether to prioritize image loading (Next.js Image priority prop) */
  priority?: boolean;
  /** Optional children content */
  children?: React.ReactNode;
}

/**
 * UploadButton component props interface for fit uploads
 * 
 * @interface UploadButtonProps  
 * @extends BaseComponentProps
 * @example
 * ```typescript
 * const props: UploadButtonProps = {
 *   onFileSelect: (file) => console.log('Fit file selected:', file.name),
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
  /** Whether button is in redo state (shows "Re-do" instead of "Upload Your Fit") */
  isRedo?: boolean;
  /** Optional children content */
  children?: React.ReactNode;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Callback for touch start events */
  onTouchStart?: (event: React.TouchEvent) => void;
  /** Callback for touch end events */
  onTouchEnd?: (event: React.TouchEvent) => void;
  /** Callback for error handling */
  onError?: (error: Error | string) => void;
  /** Inline styles for the component */
  style?: React.CSSProperties;
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
 * NextButton component props interface for fit uploads
 * 
 * @interface NextButtonProps  
 * @extends BaseComponentProps
 * @example
 * ```typescript
 * const props: NextButtonProps = {
 *   onClick: () => console.log('Proceed to results'),
 *   disabled: false,
 *   variant: 'primary',
 *   loading: false
 * };
 * ```
 */
export interface NextButtonProps extends BaseComponentProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Current upload status for state management */
  uploadStatus: UploadStatus;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Whether button is in loading state */
  loading?: boolean;
  /** Optional children content */
  children?: React.ReactNode;
  /** Configuration for NextButton state management */
  config?: import('../hooks/useNextButtonState').NextButtonConfig;
}

/**
 * Main UploadFit container props interface
 * 
 * @interface UploadFitProps
 * @extends BaseComponentProps
 */
export interface UploadFitProps extends BaseComponentProps {
  /** Upload configuration */
  config?: Partial<UploadConfig>;
  /** Callback when upload completes successfully */
  onUploadSuccess?: (imageUrl: string, metadata: ImageMetadata) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Callback when upload progress changes */
  onProgressChange?: (progress: number) => void;
  /** Callback when Next button is clicked */
  onNext?: () => void;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Initial image URL */
  initialImageUrl?: string;
}

// =============================================================================
// HOOK RETURN TYPES & GENERIC UTILITIES (Subtask 1.2)
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
 *   data: { filename: 'fit-image.jpg', size: 12345, ... },
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
 * Orientation validation function type
 */
export type OrientationValidationFunction = (file: File) => Promise<OrientationValidationResult>;

/**
 * Combined validation function that includes orientation checks
 */
export type CombinedValidationFunction = (file: File) => Promise<OrientationValidationResult>;

/**
 * Upload hook return interface for fit uploads
 * 
 * @interface UseUploadReturn
 * @example
 * ```typescript
 * const {
 *   state,
 *   uploadFile,
 *   reset,
 *   isUploading,
 *   canUpload,
 *   validateFile,
 *   validateOrientation
 * } = useFitUpload();
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
  /** Basic validation function for files */
  validateFile: ValidationFunction<File>;
  /** Orientation-specific validation function */
  validateOrientation: OrientationValidationFunction;
  /** Combined validation including orientation */
  validateFileWithOrientation: CombinedValidationFunction;
}

/**
 * Image processing hook return interface for fit images
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

/**
 * Type guard to check if orientation is portrait
 * 
 * @param orientation Orientation to check
 * @returns Whether orientation is portrait
 */
export const isPortraitOrientation = (orientation: ImageOrientation): orientation is typeof IMAGE_ORIENTATION.PORTRAIT => {
  return orientation === IMAGE_ORIENTATION.PORTRAIT;
};

/**
 * Utility function to determine image orientation from dimensions
 * 
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @returns Detected image orientation
 */
export const detectImageOrientation = (width: number, height: number): ImageOrientation => {
  const aspectRatio = width / height;
  
  if (aspectRatio < 0.95) {
    return IMAGE_ORIENTATION.PORTRAIT;
  } else if (aspectRatio > 1.05) {
    return IMAGE_ORIENTATION.LANDSCAPE;
  } else {
    return IMAGE_ORIENTATION.SQUARE;
  }
};

/**
 * Utility function to validate portrait requirements
 * 
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @returns Whether image meets portrait requirements
 */
export const meetsPortraitRequirements = (width: number, height: number): boolean => {
  const aspectRatio = width / height;
  return (
    aspectRatio >= PORTRAIT_REQUIREMENTS.MIN_ASPECT_RATIO &&
    aspectRatio <= PORTRAIT_REQUIREMENTS.MAX_ASPECT_RATIO &&
    width >= PORTRAIT_REQUIREMENTS.MIN_WIDTH &&
    height >= PORTRAIT_REQUIREMENTS.MIN_HEIGHT
  );
};

// =============================================================================
// MODERN TYPESCRIPT 5.x FEATURES
// =============================================================================

/**
 * Production upload configuration for fit uploads
 */
export const PRODUCTION_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB for production fit uploads
  allowedTypes: ['image/jpeg', 'image/png'] as const,
  quality: 0.9,
  maxWidth: 1920,
  maxHeight: 1920,
  enableCompression: true
} satisfies UploadConfig;

/**
 * Status messaging specific to fit uploads
 */
export const STATUS_MESSAGES = {
  [UPLOAD_STATUS.IDLE]: 'Ready to upload your fit',
  [UPLOAD_STATUS.UPLOADING]: 'Uploading your fit...',
  [UPLOAD_STATUS.SUCCESS]: 'Fit uploaded successfully',
  [UPLOAD_STATUS.ERROR]: 'Fit upload failed'
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
 * Branded type for validated fit image URLs
 */
export type ValidatedImageUrl = string & { readonly __brand: 'ValidatedImageUrl' };

/**
 * Utility to create validated image URL
 */
export const createValidatedImageUrl = (url: string): ValidatedImageUrl => {
  // URL validation would happen here
  return url as ValidatedImageUrl;
};