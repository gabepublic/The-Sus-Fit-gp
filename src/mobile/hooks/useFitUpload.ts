/**
 * @fileoverview useFitUpload - React hook for managing fit-specific uploads with 3:4 aspect ratio validation
 * @module @/hooks/useFitUpload
 * @version 1.0.0
 */

import {
  useReducer,
  useCallback,
  useMemo,
  useTransition,
  useRef,
  useEffect,
  useDeferredValue
} from 'react';
import imageCompression from 'browser-image-compression';
import { useAngleUpload } from '../components/UploadAngle/hooks/useAngleUpload';
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
  ImageMetadata,
  OrientationValidationResult,
  OrientationValidationFunction,
  CombinedValidationFunction,
  ImageOrientation
} from '../components/UploadFit/types/upload.types';
import {
  UPLOAD_STATUS,
  UPLOAD_ACTIONS,
  DEFAULT_UPLOAD_CONFIG,
  IMAGE_ORIENTATION,
  PORTRAIT_REQUIREMENTS,
  detectImageOrientation,
  meetsPortraitRequirements
} from '../components/UploadFit/types/upload.types';

// =============================================================================
// ENHANCED FIT UPLOAD STATE INTERFACES (Task 5.1)
// =============================================================================

/**
 * Enhanced upload state for fit-specific uploads with React 18 features
 *
 * @interface EnhancedFitUploadState
 * @extends UploadState
 * @example
 * ```typescript
 * const state: EnhancedFitUploadState = {
 *   status: 'idle',
 *   file: null,
 *   imageUrl: null,
 *   error: null,
 *   progress: 0,
 *   isTransitioning: false,
 *   compressionProgress: 0,
 *   originalFileSize: 0,
 *   compressedFileSize: 0,
 *   aspectRatio: null,
 *   orientation: null,
 *   validationResult: null,
 *   blobUrls: new Set(),
 *   abortController: null
 * };
 * ```
 */
interface EnhancedFitUploadState extends UploadState {
  /** Whether a state transition is in progress (React 18 useTransition) */
  isTransitioning: boolean;
  /** Image compression progress percentage (0-100) */
  compressionProgress: number;
  /** Original file size before compression */
  originalFileSize: number;
  /** Compressed file size */
  compressedFileSize: number;
  /** Image aspect ratio (width/height) */
  aspectRatio: number | null;
  /** Detected image orientation */
  orientation: ImageOrientation | null;
  /** Last validation result */
  validationResult: OrientationValidationResult | null;
  /** Set of blob URLs to clean up */
  blobUrls: Set<string>;
  /** AbortController for canceling operations */
  abortController: AbortController | null;
  /** File metadata */
  metadata: ImageMetadata | null;
}

/**
 * Enhanced upload actions for fit-specific uploads
 */
interface StartFitUploadAction {
  type: typeof UPLOAD_ACTIONS.SET_FILE;
  payload: {
    file: File;
    imageUrl: string;
    abortController: AbortController;
    metadata: ImageMetadata;
    aspectRatio: number;
    orientation: ImageOrientation;
    validationResult: OrientationValidationResult;
  };
}

interface UpdateProgressAction {
  type: typeof UPLOAD_ACTIONS.SET_PROGRESS;
  payload: { progress: number };
}

interface SetSuccessAction {
  type: typeof UPLOAD_ACTIONS.SET_SUCCESS;
  payload: { imageUrl: string };
}

interface SetErrorAction {
  type: typeof UPLOAD_ACTIONS.SET_ERROR;
  payload: { error: string };
}

interface ResetAction {
  type: typeof UPLOAD_ACTIONS.RESET;
}

interface UpdateCompressionProgressAction {
  type: 'SET_COMPRESSION_PROGRESS';
  payload: {
    compressionProgress: number;
    originalSize: number;
    compressedSize: number;
  };
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
 * Union type of all enhanced fit upload actions
 */
type EnhancedFitUploadAction =
  | StartFitUploadAction
  | UpdateProgressAction
  | SetSuccessAction
  | SetErrorAction
  | ResetAction
  | UpdateCompressionProgressAction
  | SetTransitioningAction
  | AddBlobUrlAction;

/**
 * Enhanced UseFitUploadReturn interface with fit-specific features
 */
export interface EnhancedUseFitUploadReturn extends Omit<UseUploadReturn, 'state'> {
  /** Enhanced fit upload state */
  state: EnhancedFitUploadState;
  /** Cancel current upload/compression */
  cancelOperation: () => void;
  /** Manual cleanup function */
  cleanup: () => void;
  /** Whether state is transitioning (React 18) */
  isTransitioning: boolean;
  /** Compress image with progress tracking */
  compressImage: (file: File) => Promise<UploadResult<File>>;
  /** Deferred aspect ratio for performance optimization */
  deferredAspectRatio: number | null;
}

// =============================================================================
// INITIAL STATE AND REDUCER (Task 5.1)
// =============================================================================

/**
 * Initial fit upload state with React 18 and fit-specific features
 */
const initialState: EnhancedFitUploadState = {
  status: UPLOAD_STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0,
  isTransitioning: false,
  compressionProgress: 0,
  originalFileSize: 0,
  compressedFileSize: 0,
  aspectRatio: null,
  orientation: null,
  validationResult: null,
  blobUrls: new Set(),
  abortController: null,
  metadata: null
};

/**
 * Fit upload state reducer with immutable updates and React 18 support
 */
function fitUploadReducer(
  state: EnhancedFitUploadState,
  action: EnhancedFitUploadAction
): EnhancedFitUploadState {
  switch (action.type) {
    case UPLOAD_ACTIONS.SET_FILE:
      if (action.type === UPLOAD_ACTIONS.SET_FILE && 'aspectRatio' in action.payload) {
        // Enhanced fit upload action
        const payload = action.payload as StartFitUploadAction['payload'];
        return {
          ...state,
          status: UPLOAD_STATUS.UPLOADING,
          file: payload.file,
          imageUrl: payload.imageUrl,
          error: null,
          progress: 0,
          compressionProgress: 0,
          abortController: payload.abortController,
          metadata: payload.metadata,
          aspectRatio: payload.aspectRatio,
          orientation: payload.orientation,
          validationResult: payload.validationResult,
          originalFileSize: payload.file.size,
          blobUrls: new Set([
            ...Array.from(state.blobUrls),
            payload.imageUrl
          ])
        };
      } else {
        // Basic upload action
        return {
          ...state,
          status: UPLOAD_STATUS.UPLOADING,
          file: action.payload.file,
          imageUrl: action.payload.imageUrl,
          error: null,
          progress: 0,
          compressionProgress: 0,
          originalFileSize: action.payload.file.size,
          blobUrls: new Set([
            ...Array.from(state.blobUrls),
            action.payload.imageUrl
          ])
        };
      }

    case UPLOAD_ACTIONS.SET_PROGRESS:
      return {
        ...state,
        progress: Math.min(100, Math.max(0, action.payload.progress))
      };

    case 'SET_COMPRESSION_PROGRESS':
      return {
        ...state,
        compressionProgress: Math.min(100, Math.max(0, action.payload.compressionProgress)),
        originalFileSize: action.payload.originalSize,
        compressedFileSize: action.payload.compressedSize
      };

    case UPLOAD_ACTIONS.SET_SUCCESS:
      return {
        ...state,
        status: UPLOAD_STATUS.SUCCESS,
        imageUrl: action.payload.imageUrl,
        error: null,
        progress: 100,
        compressionProgress: 100,
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
// IMAGE VALIDATION UTILITIES (Task 5.2)
// =============================================================================

/**
 * Validates image dimensions for 3:4 aspect ratio and portrait orientation
 */
const validateImageDimensions = async (file: File): Promise<OrientationValidationResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.warn('Failed to revoke object URL during validation:', error);
      }
    };

    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Image validation timed out'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeoutId);
      const { naturalWidth: width, naturalHeight: height } = img;
      const aspectRatio = width / height;
      const orientation = detectImageOrientation(width, height);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const orientationFeedback: string[] = [];

      // Check minimum resolution
      if (width < PORTRAIT_REQUIREMENTS.MIN_WIDTH || height < PORTRAIT_REQUIREMENTS.MIN_HEIGHT) {
        errors.push(
          `Image resolution too low (${width}x${height}). Minimum required: ${PORTRAIT_REQUIREMENTS.MIN_WIDTH}x${PORTRAIT_REQUIREMENTS.MIN_HEIGHT}`
        );
      }

      // Check aspect ratio for 3:4 portrait (0.75 ±5% tolerance)
      const targetAspectRatio = PORTRAIT_REQUIREMENTS.PREFERRED_ASPECT_RATIO;
      const tolerance = 0.05; // 5% tolerance
      const aspectRatioDiff = Math.abs(aspectRatio - targetAspectRatio);
      
      if (aspectRatioDiff > tolerance) {
        if (aspectRatio > targetAspectRatio + tolerance) {
          errors.push(
            `Image is too wide for fit analysis. Expected 3:4 portrait ratio (${targetAspectRatio.toFixed(2)}), got ${aspectRatio.toFixed(2)}`
          );
          orientationFeedback.push('Try cropping the sides of your image or taking a more vertical photo');
        } else {
          errors.push(
            `Image is too tall and narrow. Expected 3:4 portrait ratio (${targetAspectRatio.toFixed(2)}), got ${aspectRatio.toFixed(2)}`
          );
          orientationFeedback.push('Try including more width in your photo or cropping the top/bottom');
        }
      }

      // Check portrait orientation
      if (orientation !== IMAGE_ORIENTATION.PORTRAIT) {
        errors.push(
          `Image must be in portrait orientation. Detected: ${orientation}`
        );
        orientationFeedback.push('Please rotate your image or take a vertical photo');
      }

      // Portrait requirements check
      const meetsRequirements = meetsPortraitRequirements(width, height);
      if (!meetsRequirements && errors.length === 0) {
        warnings.push('Image dimensions are at the edge of acceptable range for optimal fit analysis');
      }

      // Success feedback
      if (errors.length === 0) {
        orientationFeedback.push(`Perfect! Your ${width}x${height} portrait image is ideal for fit analysis`);
      }

      cleanup();
      
      resolve({
        isValid: errors.length === 0,
        errors,
        warnings,
        orientation,
        aspectRatio,
        meetsOrientationRequirements: meetsRequirements,
        orientationFeedback
      });
    };

    img.onerror = (error) => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error(`Failed to load image for validation: ${error}`));
    };

    img.src = objectUrl;
  });
};

// =============================================================================
// IMAGE COMPRESSION UTILITIES (Task 5.3)
// =============================================================================

/**
 * Browser-image-compression configuration optimized for mobile fit uploads
 */
const getCompressionOptions = (file: File) => ({
  maxSizeMB: 1, // 1MB maximum for mobile optimization
  maxWidthOrHeight: 1024, // Sufficient for fit analysis
  useWebWorker: true, // Non-blocking compression
  quality: 0.8, // Good balance of quality vs size
  initialQuality: 0.8,
  alwaysKeepResolution: false,
  exifOrientation: 1, // Ensure proper orientation
  onProgress: (progress: number) => {
    // Progress callback will be handled in the hook
  }
});

// =============================================================================
// HOOK IMPLEMENTATION (Task 5.1)
// =============================================================================

/**
 * Custom React hook for fit-specific uploads with 3:4 aspect ratio validation
 *
 * @param config - Optional upload configuration
 * @returns Enhanced fit upload state and methods
 *
 * @example
 * ```typescript
 * function FitUploadComponent() {
 *   const {
 *     state,
 *     uploadFile,
 *     reset,
 *     isUploading,
 *     canUpload,
 *     validateFile,
 *     validateOrientation,
 *     validateFileWithOrientation,
 *     compressImage,
 *     cleanup
 *   } = useFitUpload({
 *     maxFileSize: 15 * 1024 * 1024,
 *     quality: 0.85
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         accept="image/*"
 *         onChange={async (e) => {
 *           const file = e.target.files?.[0];
 *           if (file) {
 *             const validation = await validateFileWithOrientation(file);
 *             if (validation.isValid) {
 *               await uploadFile(file);
 *             }
 *           }
 *         }}
 *         disabled={!canUpload}
 *       />
 *       {state.imageUrl && <img src={state.imageUrl} alt="Fit preview" />}
 *       {state.compressionProgress > 0 && (
 *         <div>Compression: {state.compressionProgress}%</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFitUpload(
  config: Partial<UploadConfig> = {}
): EnhancedUseFitUploadReturn {
  // Merge config with fit-specific defaults
  const uploadConfig = useMemo(
    () => ({ ...DEFAULT_UPLOAD_CONFIG, ...config }),
    [config]
  );

  // Use base angle upload hook to get core functionality
  const baseUpload = useAngleUpload(uploadConfig);

  // State management with useReducer for fit-specific enhancements
  const [state, dispatch] = useReducer(fitUploadReducer, initialState);

  // React 18 useTransition for non-blocking updates
  const [isPending, startTransition] = useTransition();

  // React 18 useDeferredValue for performance optimization
  const deferredAspectRatio = useDeferredValue(state.aspectRatio);

  // Refs for cleanup and abort functionality
  const compressionAbortRef = useRef<AbortController | null>(null);

  // Update transitioning state when isPending changes
  useEffect(() => {
    if (state.isTransitioning !== isPending) {
      dispatch({
        type: 'SET_TRANSITIONING',
        payload: { isTransitioning: isPending }
      });
    }
  }, [isPending, state.isTransitioning]);

  // Cleanup effect for blob URLs and abort controllers
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

      // Abort any ongoing operations
      if (state.abortController) {
        state.abortController.abort();
      }
      if (compressionAbortRef.current) {
        compressionAbortRef.current.abort();
      }
    };
  }, []); // Empty dependency array for unmount cleanup only


  /**
   * Orientation-specific validation for fit uploads
   */
  const validateOrientation: OrientationValidationFunction = useCallback(
    async (file: File): Promise<OrientationValidationResult> => {
      try {
        const orientationResult = await validateImageDimensions(file);
        return orientationResult;
      } catch (error) {
        return {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Orientation validation failed'],
          warnings: [],
          orientation: IMAGE_ORIENTATION.PORTRAIT,
          aspectRatio: 0,
          meetsOrientationRequirements: false,
          orientationFeedback: ['Unable to analyze image orientation']
        };
      }
    },
    []
  );

  /**
   * Combined validation including basic checks and orientation
   */
  const validateFileWithOrientation: CombinedValidationFunction = useCallback(
    async (file: File): Promise<OrientationValidationResult> => {
      // First run basic validation using base hook
      const basicValidation = baseUpload.validateFile(file);
      if (!basicValidation.isValid) {
        return {
          isValid: false,
          errors: basicValidation.errors,
          warnings: basicValidation.warnings,
          orientation: IMAGE_ORIENTATION.PORTRAIT,
          aspectRatio: 0,
          meetsOrientationRequirements: false,
          orientationFeedback: []
        };
      }

      // Then run orientation validation
      const orientationValidation = await validateOrientation(file);
      
      return {
        ...orientationValidation,
        warnings: [...basicValidation.warnings, ...orientationValidation.warnings]
      };
    },
    [baseUpload.validateFile, validateOrientation]
  );

  /**
   * Image compression with progress tracking
   */
  const compressImage = useCallback(
    async (file: File): Promise<UploadResult<File>> => {
      try {
        compressionAbortRef.current = new AbortController();
        
        const compressionOptions = {
          ...getCompressionOptions(file),
          signal: compressionAbortRef.current.signal,
          onProgress: (progress: number) => {
            startTransition(() => {
              dispatch({
                type: 'SET_COMPRESSION_PROGRESS',
                payload: {
                  compressionProgress: progress,
                  originalSize: file.size,
                  compressedSize: 0 // Will be updated when compression completes
                }
              });
            });
          }
        };

        const compressedFile = await imageCompression(file, compressionOptions);
        
        // Update final compression progress
        startTransition(() => {
          dispatch({
            type: 'SET_COMPRESSION_PROGRESS',
            payload: {
              compressionProgress: 100,
              originalSize: file.size,
              compressedSize: compressedFile.size
            }
          });
        });

        return {
          success: true,
          data: compressedFile,
          error: null
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            data: null,
            error: 'Compression was cancelled'
          };
        }

        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Compression failed'
        };
      } finally {
        compressionAbortRef.current = null;
      }
    },
    []
  );

  /**
   * Creates image metadata from a file
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
   * Upload function with compression and validation
   */
  const uploadFile: UploadFunction = useCallback(
    async (file: File): Promise<UploadResult<string>> => {
      try {
        // Combined validation
        const validation = await validateFileWithOrientation(file);
        if (!validation.isValid) {
          return {
            success: false,
            data: null,
            error: validation.errors.join('; ')
          };
        }

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
              metadata,
              aspectRatio: validation.aspectRatio,
              orientation: validation.orientation,
              validationResult: validation
            }
          });
        });

        // Compress image if it's large
        let processedFile = file;
        if (file.size > 2 * 1024 * 1024) { // Compress files > 2MB
          const compressionResult = await compressImage(file);
          if (compressionResult.success && compressionResult.data) {
            processedFile = compressionResult.data;
          }
        }

        // Create final image URL
        const finalImageUrl = URL.createObjectURL(processedFile);
        
        // Update success state
        startTransition(() => {
          dispatch({
            type: UPLOAD_ACTIONS.SET_SUCCESS,
            payload: { imageUrl: finalImageUrl }
          });
        });

        return {
          success: true,
          data: finalImageUrl,
          error: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        startTransition(() => {
          dispatch({
            type: UPLOAD_ACTIONS.SET_ERROR,
            payload: { error: errorMessage }
          });
        });

        return {
          success: false,
          data: null,
          error: errorMessage
        };
      }
    },
    [validateFileWithOrientation, createImageMetadata, compressImage]
  );

  /**
   * Resets upload state and cleans up all resources
   */
  const reset = useCallback(() => {
    // Cleanup blob URLs
    Array.from(state.blobUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke blob URL during reset:', error);
      }
    });

    // Abort ongoing operations
    if (state.abortController) {
      state.abortController.abort();
    }
    if (compressionAbortRef.current) {
      compressionAbortRef.current.abort();
    }

    // Reset state with transition for better UX
    startTransition(() => {
      dispatch({ type: UPLOAD_ACTIONS.RESET });
    });
  }, [state.blobUrls, state.abortController]);

  /**
   * Cancels current upload or compression
   */
  const cancelOperation = useCallback(() => {
    // Abort current upload
    if (state.abortController) {
      state.abortController.abort();
    }

    // Abort compression
    if (compressionAbortRef.current) {
      compressionAbortRef.current.abort();
    }

    // Update state to cancelled
    startTransition(() => {
      dispatch({
        type: UPLOAD_ACTIONS.SET_ERROR,
        payload: { error: 'Operation cancelled by user' }
      });
    });
  }, [state.abortController]);

  /**
   * Manual cleanup function with comprehensive resource cleanup
   */
  const cleanup = useCallback(() => {
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
    if (compressionAbortRef.current) {
      compressionAbortRef.current.abort();
    }
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
    validateFile: baseUpload.validateFile,
    validateOrientation,
    validateFileWithOrientation,
    cancelOperation,
    cleanup,
    isTransitioning: state.isTransitioning,
    compressImage,
    deferredAspectRatio
  };
}

export default useFitUpload;