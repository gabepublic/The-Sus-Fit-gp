/**
 * @fileoverview useAngleUpload - React hook for managing upload state with useReducer
 * @module @/mobile/components/UploadAngle/hooks/useAngleUpload
 * @version 1.0.0
 */

import {
  useReducer,
  useCallback,
  useMemo,
  useTransition,
  useRef,
  useEffect
} from 'react';
import {
  useSingleImageUpload,
  type UploadConfig as MainUploadConfig,
  type UploadedFile as MainUploadedFile,
  type UploadError as MainUploadError,
  type FileValidationResult as MainFileValidationResult
} from '../../../../hooks/useImageUpload';
import type {
  UploadState,
  UploadAction,
  UseUploadReturn,
  UploadResult,
  UploadConfig,
  ImageValidationResult,
  ValidationFunction,
  ProgressCallback,
  UploadFunction,
  ImageMetadata
} from '../types/upload.types';
import {
  UPLOAD_STATUS,
  UPLOAD_ACTIONS,
  DEFAULT_UPLOAD_CONFIG
} from '../types/upload.types';

// =============================================================================
// ENHANCED UPLOAD STATE INTERFACES (Task 4.1)
// =============================================================================

/**
 * Enhanced upload state with React 18 features and memory management
 *
 * @interface EnhancedUploadState
 * @extends UploadState
 * @example
 * ```typescript
 * const state: EnhancedUploadState = {
 *   status: 'idle',
 *   file: null,
 *   imageUrl: null,
 *   error: null,
 *   progress: 0,
 *   isTransitioning: false,
 *   uploadSpeed: 0,
 *   timeRemaining: null,
 *   retryCount: 0,
 *   abortController: null,
 *   blobUrls: new Set()
 * };
 * ```
 */
interface EnhancedUploadState extends UploadState {
  /** Whether a state transition is in progress (React 18 useTransition) */
  isTransitioning: boolean;
  /** Current upload speed in bytes per second */
  uploadSpeed: number;
  /** Estimated time remaining in seconds */
  timeRemaining: number | null;
  /** Number of retry attempts made */
  retryCount: number;
  /** AbortController for canceling uploads */
  abortController: AbortController | null;
  /** Set of blob URLs to clean up */
  blobUrls: Set<string>;
  /** Upload start timestamp */
  startTime: number | null;
  /** File metadata */
  metadata: ImageMetadata | null;
}

/**
 * Enhanced upload actions with React 18 and memory management support
 */
interface StartUploadAction {
  type: typeof UPLOAD_ACTIONS.SET_FILE;
  payload: {
    file: File;
    imageUrl: string;
    abortController: AbortController;
    metadata: ImageMetadata;
  };
}

interface UpdateProgressAction {
  type: typeof UPLOAD_ACTIONS.SET_PROGRESS;
  payload: {
    progress: number;
    uploadSpeed: number;
    timeRemaining: number | null;
  };
}

interface SetSuccessAction {
  type: typeof UPLOAD_ACTIONS.SET_SUCCESS;
  payload: { imageUrl: string };
}

interface SetErrorAction {
  type: typeof UPLOAD_ACTIONS.SET_ERROR;
  payload: {
    error: string;
    retryCount: number;
  };
}

interface ResetAction {
  type: typeof UPLOAD_ACTIONS.RESET;
}

interface SetTransitioningAction {
  type: 'SET_TRANSITIONING';
  payload: { isTransitioning: boolean };
}

interface AddBlobUrlAction {
  type: 'ADD_BLOB_URL';
  payload: { blobUrl: string };
}

/**
 * Union type of all enhanced upload actions
 */
type EnhancedUploadAction =
  | StartUploadAction
  | UpdateProgressAction
  | SetSuccessAction
  | SetErrorAction
  | ResetAction
  | SetTransitioningAction
  | AddBlobUrlAction;

/**
 * Enhanced UseUploadReturn interface with React 18 features and memory management
 *
 * @interface EnhancedUseUploadReturn
 * @extends UseUploadReturn
 * @example
 * ```typescript
 * const {
 *   state,
 *   uploadFile,
 *   reset,
 *   isUploading,
 *   canUpload,
 *   validateFile,
 *   cancelUpload,
 *   retryUpload,
 *   cleanup
 * } = useAngleUpload();
 * ```
 */
interface EnhancedUseUploadReturn extends Omit<UseUploadReturn, 'state'> {
  /** Enhanced upload state */
  state: EnhancedUploadState;
  /** Cancel current upload */
  cancelUpload: () => void;
  /** Retry failed upload */
  retryUpload: () => Promise<UploadResult<string>>;
  /** Manual cleanup function */
  cleanup: () => void;
  /** Whether state is transitioning (React 18) */
  isTransitioning: boolean;
}

// =============================================================================
// INITIAL STATE AND REDUCER (Task 4.1)
// =============================================================================

/**
 * Initial upload state with React 18 and memory management features
 */
const initialState: EnhancedUploadState = {
  status: UPLOAD_STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0,
  isTransitioning: false,
  uploadSpeed: 0,
  timeRemaining: null,
  retryCount: 0,
  abortController: null,
  blobUrls: new Set(),
  startTime: null,
  metadata: null
};

/**
 * Upload state reducer with immutable updates and React 18 support
 *
 * @param state Current upload state
 * @param action Action to process
 * @returns New upload state
 *
 * @example
 * ```typescript
 * const newState = uploadReducer(currentState, {
 *   type: 'SET_FILE',
 *   payload: { file, imageUrl, abortController, metadata }
 * });
 * ```
 */
function uploadReducer(
  state: EnhancedUploadState,
  action: EnhancedUploadAction
): EnhancedUploadState {
  switch (action.type) {
    case UPLOAD_ACTIONS.SET_FILE:
      return {
        ...state,
        status: UPLOAD_STATUS.UPLOADING,
        file: action.payload.file,
        imageUrl: action.payload.imageUrl,
        error: null,
        progress: 0,
        uploadSpeed: 0,
        timeRemaining: null,
        retryCount: 0,
        abortController: action.payload.abortController,
        startTime: Date.now(),
        metadata: action.payload.metadata,
        blobUrls: new Set([
          ...Array.from(state.blobUrls),
          action.payload.imageUrl
        ])
      };

    case UPLOAD_ACTIONS.SET_PROGRESS:
      return {
        ...state,
        progress: Math.min(100, Math.max(0, action.payload.progress)),
        uploadSpeed: action.payload.uploadSpeed,
        timeRemaining: action.payload.timeRemaining
      };

    case UPLOAD_ACTIONS.SET_SUCCESS:
      return {
        ...state,
        status: UPLOAD_STATUS.SUCCESS,
        imageUrl: action.payload.imageUrl,
        error: null,
        progress: 100,
        abortController: null,
        blobUrls: new Set([
          ...Array.from(state.blobUrls),
          action.payload.imageUrl
        ])
      };

    case UPLOAD_ACTIONS.SET_ERROR:
      return {
        ...state,
        status: UPLOAD_STATUS.ERROR,
        error: action.payload.error,
        retryCount: action.payload.retryCount,
        abortController: null
      };

    case UPLOAD_ACTIONS.RESET:
      return {
        ...initialState,
        // Preserve blob URLs for cleanup
        blobUrls: state.blobUrls
      };

    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.payload.isTransitioning
      };

    case 'ADD_BLOB_URL':
      return {
        ...state,
        blobUrls: new Set([
          ...Array.from(state.blobUrls),
          action.payload.blobUrl
        ])
      };

    default:
      return state;
  }
}

// =============================================================================
// HOOK IMPLEMENTATION (Task 4.1)
// =============================================================================

/**
 * Custom React hook for managing upload state with React 18 features and memory management
 *
 * @param config - Optional upload configuration
 * @returns Enhanced upload state and methods
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const {
 *     state,
 *     uploadFile,
 *     reset,
 *     isUploading,
 *     canUpload,
 *     validateFile,
 *     cancelUpload,
 *     cleanup
 *   } = useAngleUpload({
 *     maxFileSize: 5 * 1024 * 1024,
 *     quality: 0.8
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         onChange={(e) => {
 *           const file = e.target.files?.[0];
 *           if (file && validateFile(file).isValid) {
 *             uploadFile(file);
 *           }
 *         }}
 *         disabled={!canUpload}
 *       />
 *       {state.imageUrl && <img src={state.imageUrl} alt="Uploaded" />}
 *       {isUploading && <div>Progress: {state.progress}%</div>}
 *     </div>
 *   );
 * }
 * ```
 */
/**
 * Convert main app upload config to mobile config format
 */
function convertToMainConfig(
  mobileConfig: UploadConfig
): Partial<MainUploadConfig> {
  return {
    maxSizeBytes: mobileConfig.maxFileSize,
    allowedTypes: mobileConfig.allowedTypes,
    generateThumbnails: true,
    thumbnailSizes: [150, 300],
    enableDragDrop: false, // Mobile doesn't need drag/drop
    autoProcess: false,
    validation: {
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096
    }
  };
}

export function useAngleUpload(
  config: Partial<UploadConfig> = {}
): EnhancedUseUploadReturn {
  // Merge config with defaults
  const uploadConfig = useMemo(
    () => ({ ...DEFAULT_UPLOAD_CONFIG, ...config }),
    [config]
  );

  // Convert to main app config format
  const mainAppConfig = useMemo(
    () => convertToMainConfig(uploadConfig),
    [uploadConfig]
  );

  // State management with useReducer
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  // React 18 useTransition for non-blocking updates
  const [isPending, startTransition] = useTransition();

  // Refs for cleanup and retry functionality
  const lastFileRef = useRef<File | null>(null);
  const progressCallbackRef = useRef<ProgressCallback | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the main app upload hook
  const mainUpload = useSingleImageUpload(
    mainAppConfig,
    (uploadedFile: MainUploadedFile) => {
      // Handle successful upload - ensure state updates
      console.log('useAngleUpload: Main upload success callback triggered', uploadedFile);
      startTransition(() => {
        dispatch({
          type: UPLOAD_ACTIONS.SET_SUCCESS,
          payload: { imageUrl: uploadedFile.preview }
        });
      });
    },
    (error: MainUploadError) => {
      // Handle upload error
      console.log('useAngleUpload: Main upload error callback triggered', error);
      startTransition(() => {
        dispatch({
          type: UPLOAD_ACTIONS.SET_ERROR,
          payload: {
            error: error.message,
            retryCount: state.retryCount + 1
          }
        });
      });
    }
  );

  // Update transitioning state when isPending changes
  useEffect(() => {
    if (state.isTransitioning !== isPending) {
      dispatch({
        type: 'SET_TRANSITIONING',
        payload: { isTransitioning: isPending }
      });
    }
  }, [isPending, state.isTransitioning]);

  // Sync progress from main upload hook
  useEffect(() => {
    if (
      mainUpload.progress &&
      mainUpload.progress.percentage &&
      state.status === UPLOAD_STATUS.UPLOADING
    ) {
      startTransition(() => {
        dispatch({
          type: UPLOAD_ACTIONS.SET_PROGRESS,
          payload: {
            progress: mainUpload.progress?.percentage ?? 0,
            uploadSpeed: 0, // Main hook doesn't provide speed
            timeRemaining: null // Main hook doesn't provide time remaining
          }
        });
      });
    }
  }, [mainUpload.progress, state.status]);

  // Cleanup effect for blob URLs, abort controllers, and timers
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      Array.from(state.blobUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('Failed to revoke blob URL:', error);
        }
      });

      // Abort any ongoing upload
      if (state.abortController) {
        state.abortController.abort();
      }

      // Clear timers
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []); // Empty dependency array for unmount cleanup only

  /**
   * Calculates exponential backoff delay for retry attempts
   *
   * @param retryCount - Current retry attempt number
   * @param baseDelay - Base delay in milliseconds (default: 1000)
   * @param maxDelay - Maximum delay in milliseconds (default: 30000)
   * @returns Delay in milliseconds
   */
  const calculateBackoffDelay = useCallback(
    (
      retryCount: number,
      baseDelay: number = 1000,
      maxDelay: number = 30000
    ): number => {
      const exponentialDelay = baseDelay * Math.pow(2, retryCount);
      const jitterDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
      return Math.min(jitterDelay, maxDelay);
    },
    []
  );

  /**
   * Determines if an error is retryable based on error type and retry count
   *
   * @param error - Error to check
   * @param retryCount - Current retry count
   * @returns Whether the error is retryable
   */
  const isRetryableError = useCallback(
    (error: Error, retryCount: number): boolean => {
      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        return false;
      }

      // Network errors are retryable
      if (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('fetch')
      ) {
        return true;
      }

      // Server errors (5xx) are retryable
      if (
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')
      ) {
        return true;
      }

      // Client errors (4xx) and validation errors are not retryable
      return false;
    },
    []
  );

  /**
   * Creates user-friendly error messages based on error type
   *
   * @param error - Error to process
   * @param retryCount - Current retry count
   * @returns User-friendly error message
   */
  const createUserFriendlyError = useCallback(
    (error: Error, retryCount: number): string => {
      if (error.message.includes('cancelled')) {
        return 'Upload was cancelled';
      }

      if (error.message.includes('network')) {
        return retryCount > 0
          ? `Network error (attempt ${
              retryCount + 1
            }). Please check your connection.`
          : 'Network error. Please check your connection and try again.';
      }

      if (error.message.includes('timeout')) {
        return 'Upload timed out. Please try again with a smaller file or check your connection.';
      }

      if (error.message.includes('size')) {
        return 'File is too large. Please select a smaller file.';
      }

      if (error.message.includes('type')) {
        return 'File type not supported. Please select a valid image file.';
      }

      if (error.message.includes('500')) {
        return 'Server error occurred. Please try again in a moment.';
      }

      return retryCount > 0
        ? `Upload failed (attempt ${retryCount + 1}). Please try again.`
        : 'Upload failed. Please try again.';
    },
    []
  );

  /**
   * Validates a file against the upload configuration
   *
   * @param file - File to validate
   * @returns Validation result with errors and warnings
   */
  const validateFile: ValidationFunction<File> = useCallback(
    (file: File): ImageValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // File size validation
      if (file.size > uploadConfig.maxFileSize) {
        errors.push(
          `File size ${(file.size / 1024 / 1024).toFixed(
            1
          )}MB exceeds maximum ${(
            uploadConfig.maxFileSize /
            1024 /
            1024
          ).toFixed(1)}MB`
        );
      }

      // File type validation
      if (!uploadConfig.allowedTypes.includes(file.type)) {
        errors.push(
          `File type ${
            file.type
          } is not supported. Allowed types: ${uploadConfig.allowedTypes.join(
            ', '
          )}`
        );
      }

      // File name validation
      if (!file.name || file.name.trim().length === 0) {
        errors.push('File must have a valid name');
      }

      // Warning for large files that will be compressed
      if (file.size > 2 * 1024 * 1024 && uploadConfig.enableCompression) {
        warnings.push('Large file will be compressed to reduce upload time');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    },
    [uploadConfig]
  );

  /**
   * Creates image metadata from a file
   *
   * @param file - File to extract metadata from
   * @returns Promise resolving to image metadata
   */
  const createImageMetadata = useCallback(
    async (file: File): Promise<ImageMetadata> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            filename: file.name,
            size: file.size,
            type: file.type,
            width: img.naturalWidth,
            height: img.naturalHeight,
            lastModified: file.lastModified
          });
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load image for metadata extraction'));
        };

        img.src = objectUrl;
      });
    },
    []
  );

  /**
   * Upload function that delegates to the main app upload hook
   *
   * @param file - File to upload
   * @returns Promise resolving to upload result
   */
  const uploadFile: UploadFunction = useCallback(
    async (file: File): Promise<UploadResult<string>> => {
      // Validation using mobile config
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          data: null,
          error: validation.errors.join('; ')
        };
      }

      try {
        // Store file reference for retry functionality
        lastFileRef.current = file;

        // Extract image metadata
        const metadata = await createImageMetadata(file);

        // Set initial upload state
        startTransition(() => {
          dispatch({
            type: UPLOAD_ACTIONS.SET_FILE,
            payload: {
              file,
              imageUrl: URL.createObjectURL(file),
              abortController: new AbortController(),
              metadata
            }
          });
        });

        // Use the main app upload hook
        console.log('useAngleUpload: Starting main upload...', { fileName: file.name, fileSize: file.size });
        const uploadResult = await mainUpload.uploadFile(file);
        console.log('useAngleUpload: Main upload completed', uploadResult);

        return {
          success: true,
          data: uploadResult.preview,
          error: null
        };
      } catch (error) {
        const uploadError =
          error instanceof Error ? error : new Error('Unknown upload error');
        const currentRetryCount = state.retryCount;

        // Create user-friendly error message
        const userFriendlyMessage = createUserFriendlyError(
          uploadError,
          currentRetryCount
        );

        // Check if error is retryable and schedule automatic retry
        if (isRetryableError(uploadError, currentRetryCount)) {
          const retryDelay = calculateBackoffDelay(currentRetryCount);

          // Update state to show error with retry information
          startTransition(() => {
            dispatch({
              type: UPLOAD_ACTIONS.SET_ERROR,
              payload: {
                error: `${userFriendlyMessage} Retrying in ${Math.ceil(
                  retryDelay / 1000
                )} seconds...`,
                retryCount: currentRetryCount + 1
              }
            });
          });

          // Schedule automatic retry with exponential backoff
          retryTimeoutRef.current = setTimeout(async () => {
            try {
              const retryResult = await uploadFile(file);
              return retryResult;
            } catch (retryError) {
              console.warn('Automatic retry failed:', retryError);
            }
          }, retryDelay);

          return {
            success: false,
            data: null,
            error: userFriendlyMessage,
            willRetry: true
          } as UploadResult<string> & { willRetry: boolean };
        } else {
          // Final failure - no more retries
          startTransition(() => {
            dispatch({
              type: UPLOAD_ACTIONS.SET_ERROR,
              payload: {
                error: userFriendlyMessage,
                retryCount: currentRetryCount + 1
              }
            });
          });

          return {
            success: false,
            data: null,
            error: userFriendlyMessage
          };
        }
      }
    },
    [validateFile, createImageMetadata, mainUpload, state.retryCount]
  );

  /**
   * Resets upload state and cleans up all resources with enhanced cleanup
   */
  const reset = useCallback(() => {
    // Clear all timers
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    // Cleanup blob URLs
    Array.from(state.blobUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke blob URL during reset:', error);
      }
    });

    // Abort any ongoing upload
    if (state.abortController) {
      state.abortController.abort();
    }

    // Reset main upload hook
    mainUpload.clearFiles();

    // Reset state with transition for better UX
    startTransition(() => {
      dispatch({ type: UPLOAD_ACTIONS.RESET });
    });

    // Clear refs
    lastFileRef.current = null;
    progressCallbackRef.current = null;
  }, [state.blobUrls, state.abortController, mainUpload]);

  /**
   * Cancels current upload and clears any pending retries
   */
  const cancelUpload = useCallback(() => {
    // Clear retry timeout if pending
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Clear progress timer
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    // Abort current upload
    if (state.abortController) {
      state.abortController.abort();
    }

    // Update state to cancelled
    startTransition(() => {
      dispatch({
        type: UPLOAD_ACTIONS.SET_ERROR,
        payload: {
          error: 'Upload cancelled by user',
          retryCount: state.retryCount
        }
      });
    });
  }, [state.abortController, state.retryCount]);

  /**
   * Manually retries failed upload with reset retry count for fresh attempt
   */
  const retryUpload = useCallback(async (): Promise<UploadResult<string>> => {
    if (!lastFileRef.current) {
      return {
        success: false,
        data: null,
        error: 'No file to retry'
      };
    }

    // Clear any pending automatic retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Reset retry count for manual retry (gives user fresh attempts)
    startTransition(() => {
      dispatch({
        type: 'SET_TRANSITIONING',
        payload: { isTransitioning: true }
      });
    });

    // Wait a moment for state to update, then retry with fresh state
    await new Promise((resolve) => setTimeout(resolve, 100));

    return uploadFile(lastFileRef.current);
  }, [uploadFile]);

  /**
   * Manual cleanup function with comprehensive resource cleanup
   */
  const cleanup = useCallback(() => {
    // Clear all timers
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    // Cleanup blob URLs
    Array.from(state.blobUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke blob URL during cleanup:', error);
      }
    });

    // Abort ongoing operations
    if (state.abortController) {
      state.abortController.abort();
    }

    // Clear refs
    lastFileRef.current = null;
    progressCallbackRef.current = null;
  }, [state.blobUrls, state.abortController]);

  // Computed properties
  const isUploading = useMemo(
    () => state.status === UPLOAD_STATUS.UPLOADING,
    [state.status]
  );

  const canUpload = useMemo(
    () =>
      state.status === UPLOAD_STATUS.IDLE ||
      state.status === UPLOAD_STATUS.ERROR,
    [state.status]
  );

  return {
    state,
    uploadFile,
    reset,
    isUploading,
    canUpload,
    validateFile,
    cancelUpload,
    retryUpload,
    cleanup,
    isTransitioning: state.isTransitioning
  };
}

export default useAngleUpload;
