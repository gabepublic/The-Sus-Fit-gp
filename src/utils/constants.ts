/**
 * Application constants and configuration values for image processing,
 * upload handling, and UI behavior.
 * 
 * @example
 * ```typescript
 * import { IMAGE_VALIDATION_CONSTANTS, UPLOAD_CONFIG, UI_CONSTANTS } from './constants';
 * 
 * // Check if file type is supported
 * const isSupported = IMAGE_VALIDATION_CONSTANTS.SUPPORTED_FORMATS.includes(file.type);
 * 
 * // Use upload configuration
 * const quality = UPLOAD_CONFIG.DEFAULT_COMPRESSION_QUALITY;
 * 
 * // Apply UI constants
 * const maxWidth = UI_CONSTANTS.BREAKPOINTS.MOBILE;
 * ```
 */

/**
 * Image validation constants including supported formats, size limits, and dimension requirements
 */
export const IMAGE_VALIDATION_CONSTANTS = {
  /** Supported image MIME types */
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
  
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  /** Minimum image dimensions in pixels */
  MIN_DIMENSIONS: {
    width: 400,
    height: 300,
  },
  
  /** Maximum image dimensions for processing efficiency */
  MAX_DIMENSIONS: {
    width: 4096,
    height: 4096,
  },
  
  /** File size limits for different quality levels */
  SIZE_LIMITS: {
    THUMBNAIL: 100 * 1024,    // 100KB
    PREVIEW: 500 * 1024,      // 500KB
    STANDARD: 2 * 1024 * 1024, // 2MB
    HIGH_QUALITY: 5 * 1024 * 1024, // 5MB
  },
} as const;

/**
 * Upload configuration including compression settings, timeouts, and retry behavior
 */
export const UPLOAD_CONFIG = {
  /** Default image compression quality (0.0 to 1.0) */
  DEFAULT_COMPRESSION_QUALITY: 0.85,
  
  /** Compression quality steps for iterative reduction */
  COMPRESSION_QUALITY_STEPS: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
  
  /** Maximum attempts for compression optimization */
  MAX_COMPRESSION_ATTEMPTS: 10,
  
  /** Minimum quality threshold (below this, resize instead) */
  MIN_COMPRESSION_QUALITY: 0.1,
  
  /** Default resize dimensions for oversized images */
  DEFAULT_RESIZE_DIMENSIONS: {
    width: 1920,
    height: 1080,
  },
  
  /** Scale factor safety margin for resize operations */
  RESIZE_SCALE_SAFETY_MARGIN: 0.9, // 10% safety margin
  
  /** Minimum scale factor before rejecting resize */
  MIN_RESIZE_SCALE_FACTOR: 0.3, // Don't scale below 30% of original
  
  /** Request timeouts in milliseconds */
  TIMEOUTS: {
    UPLOAD: 30000,        // 30 seconds
    COMPRESSION: 15000,   // 15 seconds
    PROCESSING: 60000,    // 1 minute
    VALIDATION: 5000,     // 5 seconds
  },
  
  /** Retry configuration */
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,     // 1 second
    MAX_DELAY: 10000,     // 10 seconds
    BACKOFF_FACTOR: 2,    // Exponential backoff
  },
  
  /** Canvas and processing limits */
  CANVAS_LIMITS: {
    MAX_CANVAS_SIZE: 16384, // Maximum canvas dimension
    MAX_CANVAS_AREA: 268435456, // 16384 * 16384 maximum pixels
    MEMORY_SAFETY_FACTOR: 0.8, // Use 80% of theoretical max
  },
  
  /** Image format preferences */
  FORMAT_PREFERENCES: {
    /** Use JPEG for photos without transparency */
    JPEG_FOR_PHOTOS: true,
    /** Preserve PNG for images with transparency */
    PRESERVE_TRANSPARENCY: true,
    /** Default format for unknown types */
    DEFAULT_OUTPUT_FORMAT: 'image/jpeg',
    /** WebP support detection and usage */
    PREFER_WEBP: true,
  },
  
  /** Blob URL management */
  BLOB_URL: {
    /** Auto-cleanup delay for blob URLs (ms) */
    AUTO_CLEANUP_DELAY: 30000, // 30 seconds
    /** Maximum number of blob URLs to track */
    MAX_TRACKED_URLS: 50,
  },
} as const;

/**
 * UI constants including animations, sizing, breakpoints, and visual behavior
 */
export const UI_CONSTANTS = {
  /** Responsive breakpoints in pixels */
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
    LARGE: 1440,
  },
  
  /** Animation durations in milliseconds */
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
    PROGRESS: 100,    // Progress bar updates
    FADE: 200,        // Fade transitions
    SLIDE: 300,       // Slide transitions
  },
  
  /** Z-index layers for consistent layering */
  Z_INDEX: {
    BACKGROUND: 0,
    CONTENT: 1,
    OVERLAY: 10,
    MODAL: 100,
    TOOLTIP: 200,
    LOADING: 300,
    ERROR: 400,
  },
  
  /** Color scheme constants */
  COLORS: {
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
    NEUTRAL: '#6B7280',
  },
  
  /** Progress indicators */
  PROGRESS: {
    /** Steps for upload progress simulation */
    UPLOAD_STEPS: [10, 25, 40, 60, 80, 95, 100],
    /** Progress bar update interval */
    UPDATE_INTERVAL: 100,
    /** Minimum progress display time */
    MIN_DISPLAY_TIME: 500,
  },
  
  /** File size display formatting */
  FILE_SIZE: {
    UNITS: ['B', 'KB', 'MB', 'GB'],
    DECIMAL_PLACES: 2,
    BINARY_BASE: 1024,
  },
  
  /** Loading states and feedback */
  LOADING: {
    /** Spinner sizes */
    SPINNER_SIZES: {
      SMALL: 16,
      MEDIUM: 24,
      LARGE: 32,
    },
    /** Skeleton animation duration */
    SKELETON_DURATION: 1500,
    /** Debounce delay for loading states */
    DEBOUNCE_DELAY: 300,
  },
  
  /** Error display configuration */
  ERROR_DISPLAY: {
    /** Auto-dismiss timeout for non-critical errors */
    AUTO_DISMISS_TIMEOUT: 5000,
    /** Maximum error message length */
    MAX_MESSAGE_LENGTH: 200,
    /** Toast notification positioning */
    TOAST_POSITION: 'top-right' as const,
  },
  
  /** Image preview and display */
  IMAGE_DISPLAY: {
    /** Thumbnail dimensions */
    THUMBNAIL_SIZE: {
      width: 100,
      height: 100,
    },
    /** Preview dimensions */
    PREVIEW_SIZE: {
      width: 300,
      height: 300,
    },
    /** Image quality for previews */
    PREVIEW_QUALITY: 0.8,
    /** Maximum preview file size */
    PREVIEW_MAX_SIZE: 500 * 1024, // 500KB
  },
} as const;

/**
 * Performance monitoring constants
 */
export const PERFORMANCE_CONSTANTS = {
  /** Memory usage thresholds */
  MEMORY: {
    /** Warning threshold as percentage of available memory */
    WARNING_THRESHOLD: 0.7, // 70%
    /** Critical threshold as percentage of available memory */
    CRITICAL_THRESHOLD: 0.9, // 90%
    /** Cleanup trigger threshold */
    CLEANUP_THRESHOLD: 0.8, // 80%
  },
  
  /** Processing time limits */
  TIME_LIMITS: {
    /** Maximum time for image validation */
    VALIDATION: 3000, // 3 seconds
    /** Maximum time for compression */
    COMPRESSION: 10000, // 10 seconds
    /** Maximum time for resize operations */
    RESIZE: 5000, // 5 seconds
  },
  
  /** Performance monitoring intervals */
  MONITORING: {
    /** Memory usage check interval */
    MEMORY_CHECK_INTERVAL: 5000, // 5 seconds
    /** Performance metrics collection interval */
    METRICS_INTERVAL: 1000, // 1 second
    /** Cleanup routine interval */
    CLEANUP_INTERVAL: 30000, // 30 seconds
  },
} as const;

/**
 * Feature detection constants for progressive enhancement
 */
export const FEATURE_DETECTION = {
  /** Required APIs for optimal functionality */
  REQUIRED_APIS: {
    CANVAS: 'HTMLCanvasElement',
    FILE_READER: 'FileReader',
    BLOB: 'Blob',
    URL: 'URL',
  },
  
  /** Optional APIs for enhanced functionality */
  ENHANCED_APIS: {
    IMAGE_BITMAP: 'createImageBitmap',
    OFFSCREEN_CANVAS: 'OffscreenCanvas',
    WEB_WORKERS: 'Worker',
    PERFORMANCE: 'performance',
  },
  
  /** Fallback strategies */
  FALLBACKS: {
    /** Use Canvas when ImageBitmap is unavailable */
    IMAGE_BITMAP_TO_CANVAS: true,
    /** Use main thread when Web Workers are unavailable */
    WORKER_TO_MAIN_THREAD: true,
    /** Use setTimeout when requestIdleCallback is unavailable */
    IDLE_CALLBACK_TO_TIMEOUT: true,
  },
} as const;

/**
 * Error code constants for consistent error handling
 */
export const ERROR_CODES = {
  /** Validation error codes */
  VALIDATION: {
    NO_FILE: 'NO_FILE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    DIMENSIONS_TOO_SMALL: 'DIMENSIONS_TOO_SMALL',
    DIMENSIONS_TOO_LARGE: 'DIMENSIONS_TOO_LARGE',
    DIMENSION_ANALYSIS_FAILED: 'DIMENSION_ANALYSIS_FAILED',
  },
  
  /** Processing error codes */
  PROCESSING: {
    COMPRESSION_FAILED: 'COMPRESSION_FAILED',
    RESIZE_FAILED: 'RESIZE_FAILED',
    CANVAS_ERROR: 'CANVAS_ERROR',
    MEMORY_ERROR: 'MEMORY_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  },
  
  /** Upload error codes */
  UPLOAD: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  },
} as const;

/**
 * Type definitions for constants
 */
export type SupportedImageFormat = typeof IMAGE_VALIDATION_CONSTANTS.SUPPORTED_FORMATS[number];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES][keyof typeof ERROR_CODES[keyof typeof ERROR_CODES]];
export type AnimationDuration = typeof UI_CONSTANTS.ANIMATIONS[keyof typeof UI_CONSTANTS.ANIMATIONS];
export type Breakpoint = typeof UI_CONSTANTS.BREAKPOINTS[keyof typeof UI_CONSTANTS.BREAKPOINTS];

// Export all constants as a unified object for convenience
export const CONSTANTS = {
  IMAGE_VALIDATION: IMAGE_VALIDATION_CONSTANTS,
  UPLOAD: UPLOAD_CONFIG,
  UI: UI_CONSTANTS,
  PERFORMANCE: PERFORMANCE_CONSTANTS,
  FEATURE_DETECTION,
  ERROR_CODES,
} as const;