// Try-On Mutation Types
// TypeScript interfaces for try-on functionality using React Query mutations

/**
 * Variables required for the try-on mutation
 */
export interface TryonMutationVariables {
  /** Base64 encoded model/user image (data URL or pure base64) */
  modelImage: string;
  /** Array of base64 encoded apparel images (data URL or pure base64) */
  apparelImages: string[];
  /** Optional configuration for the try-on operation */
  options?: TryonMutationOptions;
}

/**
 * Optional configuration for try-on operations
 */
export interface TryonMutationOptions {
  /** Processing quality level */
  quality?: 'low' | 'medium' | 'high';
  /** Enable/disable optimistic updates */
  enableOptimisticUpdates?: boolean;
  /** Custom timeout in milliseconds */
  timeout?: number;
  /** Additional metadata to include with the request */
  metadata?: Record<string, unknown>;
  /** Image processing options */
  imageProcessing?: {
    /** Target width for resizing (default: 1024) */
    targetWidth?: number;
    /** Target height for resizing (default: 1536) */
    targetHeight?: number;
    /** Maximum file size in KB after compression (default: 1024) */
    maxSizeKB?: number;
    /** JPEG quality for compression (0.1-1.0, default: 0.9) */
    compressionQuality?: number;
    /** Whether to preserve aspect ratio during resize (default: false) */
    preserveAspectRatio?: boolean;
  };
}

/**
 * Enhanced variables that support both File objects and base64 strings
 */
export interface TryonMutationVariablesWithFiles {
  /** Model/user image as File object or base64 string */
  modelImage: File | string;
  /** Array of apparel images as File objects or base64 strings */
  apparelImages: (File | string)[];
  /** Optional configuration for the try-on operation */
  options?: TryonMutationOptions;
}

/**
 * Response data from the try-on API
 */
export interface TryonMutationResponse {
  /** Base64 encoded generated try-on image */
  img_generated: string;
  /** Processing metadata */
  metadata?: TryonResponseMetadata;
}

/**
 * Metadata included in the try-on response
 */
export interface TryonResponseMetadata {
  /** Processing time in milliseconds */
  processingTime?: number;
  /** API model version used */
  modelVersion?: string;
  /** Quality settings applied */
  appliedQuality?: string;
  /** Generation timestamp */
  timestamp?: string;
  /** Additional processing information */
  processingInfo?: Record<string, unknown>;
}

/**
 * Error response structure from the try-on API
 */
export interface TryonMutationError {
  /** Error message */
  error: string;
  /** Detailed error information for validation errors */
  details?: string | Array<{
    field: string;
    message: string;
  }>;
  /** Error code for programmatic handling */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Whether the error is retryable */
  retryable?: boolean;
  /** Error category for classification */
  category?: import('../utils/errorHandling').ErrorCategory;
  /** Error severity level */
  severity?: import('../utils/errorHandling').ErrorSeverity;
  /** Suggested recovery actions */
  recoveryActions?: import('../utils/errorHandling').ErrorRecoveryAction[];
}

/**
 * Context data passed through mutation lifecycle
 */
export interface TryonMutationContext {
  /** Original mutation variables */
  variables: TryonMutationVariables;
  /** Timestamp when mutation started */
  startTime: number;
  /** Retry attempt number (0 for first attempt) */
  retryCount: number;
  /** Previous error if this is a retry */
  previousError?: Error;
  /** Image processing results if processing was performed */
  imageProcessingResults?: {
    /** Model image processing result */
    modelImageResult?: import('../utils/imageProcessing').ImageProcessingResult;
    /** Apparel images processing results */
    apparelImageResults?: import('../utils/imageProcessing').ImageProcessingResult[];
    /** Total processing time for all images */
    totalProcessingTime: number;
  };
  /** Optimistic update ID if optimistic updates are enabled */
  optimisticId?: string;
}

/**
 * Hook return type for useTryonMutation
 */
export interface UseTryonMutationReturn {
  /** React Query mutation function */
  mutate: (variables: TryonMutationVariables) => void;
  /** Async version of mutation function */
  mutateAsync: (variables: TryonMutationVariables) => Promise<TryonMutationResponse>;
  /** Current mutation state */
  data: TryonMutationResponse | undefined;
  /** Current error state */
  error: TryonMutationError | null;
  /** Loading state */
  isLoading: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Error state */
  isError: boolean;
  /** Idle state */
  isIdle: boolean;
  /** Current mutation status */
  status: 'idle' | 'loading' | 'error' | 'success';
  /** Reset mutation state */
  reset: () => void;
  /** Current mutation context */
  context: TryonMutationContext | undefined;
}

/**
 * Configuration options for the useTryonMutation hook
 */
export interface UseTryonMutationConfig {
  /** Enable retry logic with exponential backoff */
  enableRetry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  initialRetryDelay?: number;
  /** Enable optimistic updates */
  enableOptimisticUpdates?: boolean;
  /** Optimistic updates configuration */
  optimisticConfig?: {
    /** Whether to show immediate preview of generated image */
    showPreview?: boolean;
    /** Whether to add optimistic entry to history */
    updateHistory?: boolean;
    /** Whether to show loading progress indicators */
    showProgress?: boolean;
    /** Custom preview image to show during processing */
    previewPlaceholder?: string;
    /** Estimated processing time for progress calculation */
    estimatedProcessingTime?: number;
  };
  /** Cache invalidation configuration */
  cacheInvalidationConfig?: {
    /** Whether to invalidate history-related queries */
    invalidateHistory?: boolean;
    /** Whether to invalidate user-specific data */
    invalidateUserData?: boolean;
    /** Whether to invalidate statistics and aggregations */
    invalidateStats?: boolean;
    /** Whether to invalidate tag-based queries */
    invalidateTags?: boolean;
    /** Whether to preload related queries after invalidation */
    preloadRelated?: boolean;
    /** Custom query keys to invalidate */
    customQueryKeys?: string[][];
    /** Context for user-specific invalidation */
    userContext?: {
      userId?: string;
      tags?: string[];
    };
  };
  /** Image processing configuration */
  imageProcessing?: {
    /** Target width for resizing (default: 1024) */
    targetWidth?: number;
    /** Target height for resizing (default: 1536) */
    targetHeight?: number;
    /** Maximum file size in KB after compression (default: 1024) */
    maxSizeKB?: number;
    /** JPEG quality for compression (0.1-1.0, default: 0.9) */
    compressionQuality?: number;
    /** Whether to preserve aspect ratio during resize (default: false) */
    preserveAspectRatio?: boolean;
  };
  /** Custom error handling */
  onError?: (error: TryonMutationError, variables: TryonMutationVariables, context: TryonMutationContext) => void;
  /** Success callback */
  onSuccess?: (data: TryonMutationResponse, variables: TryonMutationVariables, context: TryonMutationContext) => void;
  /** Mutation start callback */
  onMutate?: (variables: TryonMutationVariables) => Promise<TryonMutationContext> | TryonMutationContext | void;
  /** Settled callback (called on both success and error) */
  onSettled?: (
    data: TryonMutationResponse | undefined,
    error: TryonMutationError | null,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => void;
}