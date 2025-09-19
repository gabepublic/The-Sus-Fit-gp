/**
 * @fileoverview Shared Hooks Types - Unified type definitions for shared upload hooks
 * @module @/mobile/components/shared/hooks/hooks.types
 * @version 1.0.0
 */

/**
 * Upload status enumeration
 */
export const UPLOAD_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];

/**
 * Core upload state interface
 */
export interface UploadState {
  /** Current upload status */
  status: UploadStatus;
  /** Selected file */
  file: File | null;
  /** Generated image URL for preview */
  imageUrl: string | null;
  /** Error message if upload failed */
  error: string | null;
  /** Upload progress (0-100) */
  progress: number;
  /** Image metadata */
  metadata?: ImageMetadata | null;
}

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
  /** Aspect ratio */
  aspectRatio: number;
  /** Whether image has been processed */
  processed: boolean;
  /** Processing timestamp */
  processedAt?: Date;
  /** Original dimensions before processing */
  originalDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Upload configuration interface
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Accepted file types */
  acceptedTypes: string[];
  /** Whether to enable client-side image processing */
  enableImageProcessing: boolean;
  /** Image processing quality (0-1) */
  imageQuality: number;
  /** Maximum image dimensions */
  maxImageDimensions: {
    width: number;
    height: number;
  };
  /** Whether to maintain aspect ratio during processing */
  maintainAspectRatio: boolean;
  /** Progress reporting interval in milliseconds */
  progressInterval: number;
  /** Enable automatic retry on failure */
  enableRetry: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Image validation result interface
 */
export interface ImageValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'INVALID_TYPE' | 'TOO_LARGE' | 'TOO_SMALL' | 'INVALID_DIMENSIONS' | 'CORRUPTED';
  /** Additional metadata about the validation */
  metadata?: Record<string, any>;
}

/**
 * Upload result interface
 */
export interface UploadResult<T = any> {
  /** Whether upload was successful */
  success: boolean;
  /** Result data if successful */
  data: T | null;
  /** Error message if failed */
  error: string | null;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Upload function type
 */
export type UploadFunction = (
  file: File,
  config?: Partial<UploadConfig>,
  onProgress?: ProgressCallback
) => Promise<UploadResult>;

/**
 * Validation function type
 */
export type ValidationFunction<T> = (value: T) => ImageValidationResult;

/**
 * Use upload hook return interface
 */
export interface UseUploadReturn {
  /** Current upload state */
  state: UploadState;
  /** Upload a file */
  uploadFile: UploadFunction;
  /** Clear current upload state */
  clearUpload: () => void;
  /** Retry last failed upload */
  retryUpload: () => Promise<void>;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Whether upload has succeeded */
  isSuccess: boolean;
  /** Whether upload has failed */
  isError: boolean;
  /** Whether upload is idle */
  isIdle: boolean;
  /** Current progress percentage */
  progress: number;
  /** Current error message */
  error: string | null;
  /** Current uploaded file */
  file: File | null;
  /** Current image URL */
  imageUrl: string | null;
}

/**
 * Image processing options interface
 */
export interface ImageProcessingOptions {
  /** Image quality (0-1) */
  quality?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Output format (MIME type) */
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Whether to maintain aspect ratio during resize */
  maintainAspectRatio?: boolean;
  /** Background color for transparent images when converting to JPEG */
  backgroundColor?: string;
  /** Enable progressive JPEG encoding */
  enableProgressive?: boolean;
}

/**
 * Image processing result interface
 */
export interface ImageProcessingResult {
  /** Processed image as Blob */
  blob: Blob;
  /** Data URL for preview */
  dataUrl: string;
  /** Processing metadata */
  metadata: ImageMetadata;
  /** Whether processing was successful */
  success: boolean;
  /** Error message if processing failed */
  error?: string;
}

/**
 * Use image processing hook return interface
 */
export interface UseImageProcessingReturn {
  /** Process an image file */
  processImage: (file: File, options?: ImageProcessingOptions) => Promise<ImageProcessingResult>;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Processing progress (0-100) */
  progress: number;
  /** Processing error if any */
  error: string | null;
  /** Clear processing state */
  clearProcessing: () => void;
  /** Check if image processing is supported */
  isSupported: boolean;
}

/**
 * Navigation configuration interface
 */
export interface NavigationConfig {
  /** Target route to navigate to */
  targetRoute?: string;
  /** Whether to prefetch the route */
  enablePrefetch?: boolean;
  /** Whether to replace current history entry */
  replace?: boolean;
  /** Scroll behavior after navigation */
  scroll?: boolean;
  /** Enable navigation logging for debugging */
  enableLogging?: boolean;
  /** Callback when navigation starts */
  onNavigationStart?: () => void;
  /** Callback when navigation completes successfully */
  onNavigationSuccess?: (route: string) => void;
  /** Callback when navigation fails */
  onNavigationError?: (error: Error) => void;
}

/**
 * Navigation state enumeration
 */
export const NAVIGATION_STATE = {
  IDLE: 'idle',
  NAVIGATING: 'navigating',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type NavigationState = typeof NAVIGATION_STATE[keyof typeof NAVIGATION_STATE];

/**
 * Navigation error interface
 */
export interface NavigationError extends Error {
  code: 'NAVIGATION_FAILED' | 'ROUTE_NOT_FOUND' | 'NETWORK_ERROR';
  route?: string;
  originalError?: Error;
}

/**
 * Use navigation hook return interface
 */
export interface UseNavigationReturn {
  /** Current navigation state */
  navigationState: NavigationState;
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Whether a React transition is pending */
  isPending: boolean;
  /** Navigation error if any */
  navigationError: NavigationError | null;
  /** Navigate to specified route */
  navigate: (route?: string) => Promise<void>;
  /** Prefetch specified route */
  prefetch: (route?: string) => void;
  /** Reset navigation state */
  resetNavigation: () => void;
  /** Check if route can be navigated to */
  canNavigate: boolean;
}

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing function */
  easing?: string;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Whether to enable animations */
  enabled?: boolean;
  /** Respect user's reduced motion preference */
  respectReducedMotion?: boolean;
}

/**
 * Slide animation state
 */
export interface SlideAnimationState {
  /** Whether element is visible */
  isVisible: boolean;
  /** Whether animation is in progress */
  isAnimating: boolean;
  /** Animation direction */
  direction: 'up' | 'down' | 'left' | 'right';
}

/**
 * Use slide animation hook return interface
 */
export interface UseSlideAnimationReturn {
  /** Current animation state */
  animationState: SlideAnimationState;
  /** Show element with slide in animation */
  slideIn: (direction?: SlideAnimationState['direction']) => void;
  /** Hide element with slide out animation */
  slideOut: (direction?: SlideAnimationState['direction']) => void;
  /** Toggle visibility with slide animation */
  toggleSlide: () => void;
  /** Whether element is currently visible */
  isVisible: boolean;
  /** Whether animation is in progress */
  isAnimating: boolean;
  /** CSS classes for animation */
  animationClasses: string;
}

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  enableImageProcessing: true,
  imageQuality: 0.8,
  maxImageDimensions: {
    width: 1920,
    height: 1920
  },
  maintainAspectRatio: true,
  progressInterval: 100,
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Export convenience types
 */
export type {
  UploadState as SharedUploadState,
  UploadConfig as SharedUploadConfig,
  UseUploadReturn as SharedUseUploadReturn,
  ImageMetadata as SharedImageMetadata,
  NavigationConfig as SharedNavigationConfig,
  UseNavigationReturn as SharedUseNavigationReturn,
  AnimationConfig as SharedAnimationConfig,
  UseSlideAnimationReturn as SharedUseSlideAnimationReturn
};