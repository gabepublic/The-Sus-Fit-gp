/**
 * @fileoverview UploadAngleContainer - Main container orchestrating complete upload workflow
 * @module @/mobile/components/UploadAngle/containers/UploadAngleContainer
 * @version 1.0.0
 */

'use client';

import React, { useReducer, useCallback, useMemo, Suspense, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoFrame } from '../components/PhotoFrame';
import { UploadButton } from '../components/UploadButton';
import { NextButton } from '../components/NextButton';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { useAngleUpload } from '../hooks/useAngleUpload';
import { useImageProcessing } from '../hooks/useImageProcessing';
import type {
  UploadAngleProps,
  UploadState,
  UPLOAD_STATUS,
  ImageMetadata,
  UploadConfig
} from '../types/upload.types';
import { UPLOAD_STATUS as STATUS } from '../types/upload.types';

// =============================================================================
// CONTAINER STATE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Container state extending base upload state with workflow management
 */
interface ContainerState extends UploadState {
  /** Whether container is initializing */
  isInitializing: boolean;
  /** Whether Next button should be enabled */
  canProceed: boolean;
  /** Current workflow step */
  currentStep: 'select' | 'upload' | 'preview' | 'complete';
  /** Upload attempt count for retry logic */
  uploadAttempts: number;
  /** Processing metadata */
  metadata: ImageMetadata | null;
  /** User interactions tracking */
  interactions: {
    hasClickedUpload: boolean;
    hasSelectedFile: boolean;
    hasCompletedUpload: boolean;
  };
}

/**
 * Container actions for state management
 */
const CONTAINER_ACTIONS = {
  INITIALIZE: 'INITIALIZE',
  SET_STEP: 'SET_STEP',
  UPDATE_UPLOAD: 'UPDATE_UPLOAD',
  SET_METADATA: 'SET_METADATA',
  TRACK_INTERACTION: 'TRACK_INTERACTION',
  RESET_WORKFLOW: 'RESET_WORKFLOW',
  SET_CAN_PROCEED: 'SET_CAN_PROCEED'
} as const;

/**
 * Container action types
 */
interface InitializeAction {
  type: typeof CONTAINER_ACTIONS.INITIALIZE;
}

interface SetStepAction {
  type: typeof CONTAINER_ACTIONS.SET_STEP;
  payload: { step: ContainerState['currentStep'] };
}

interface UpdateUploadAction {
  type: typeof CONTAINER_ACTIONS.UPDATE_UPLOAD;
  payload: Partial<UploadState>;
}

interface SetMetadataAction {
  type: typeof CONTAINER_ACTIONS.SET_METADATA;
  payload: { metadata: ImageMetadata | null };
}

interface TrackInteractionAction {
  type: typeof CONTAINER_ACTIONS.TRACK_INTERACTION;
  payload: { interaction: keyof ContainerState['interactions'] };
}

interface ResetWorkflowAction {
  type: typeof CONTAINER_ACTIONS.RESET_WORKFLOW;
}

interface SetCanProceedAction {
  type: typeof CONTAINER_ACTIONS.SET_CAN_PROCEED;
  payload: { canProceed: boolean };
}

type ContainerAction = 
  | InitializeAction
  | SetStepAction
  | UpdateUploadAction
  | SetMetadataAction
  | TrackInteractionAction
  | ResetWorkflowAction
  | SetCanProceedAction;

/**
 * Initial container state
 */
const initialContainerState: ContainerState = {
  status: STATUS.IDLE,
  file: null,
  imageUrl: null,
  error: null,
  progress: 0,
  isInitializing: true,
  canProceed: false,
  currentStep: 'select',
  uploadAttempts: 0,
  metadata: null,
  interactions: {
    hasClickedUpload: false,
    hasSelectedFile: false,
    hasCompletedUpload: false
  }
};

/**
 * Container state reducer with workflow orchestration
 */
function containerReducer(state: ContainerState, action: ContainerAction): ContainerState {
  switch (action.type) {
    case CONTAINER_ACTIONS.INITIALIZE:
      return {
        ...state,
        isInitializing: false
      };

    case CONTAINER_ACTIONS.SET_STEP:
      return {
        ...state,
        currentStep: action.payload.step
      };

    case CONTAINER_ACTIONS.UPDATE_UPLOAD:
      const newState = {
        ...state,
        ...action.payload
      };
      
      // Auto-update workflow step based on upload status
      let newStep = state.currentStep;
      if (action.payload.status) {
        switch (action.payload.status) {
          case STATUS.IDLE:
            newStep = 'select';
            break;
          case STATUS.UPLOADING:
            newStep = 'upload';
            break;
          case STATUS.SUCCESS:
            newStep = 'preview';
            break;
          case STATUS.ERROR:
            newStep = state.currentStep; // Keep current step on error
            break;
        }
      }

      return {
        ...newState,
        currentStep: newStep,
        canProceed: action.payload.status === STATUS.SUCCESS
      };

    case CONTAINER_ACTIONS.SET_METADATA:
      return {
        ...state,
        metadata: action.payload.metadata
      };

    case CONTAINER_ACTIONS.TRACK_INTERACTION:
      return {
        ...state,
        interactions: {
          ...state.interactions,
          [action.payload.interaction]: true
        }
      };

    case CONTAINER_ACTIONS.SET_CAN_PROCEED:
      return {
        ...state,
        canProceed: action.payload.canProceed
      };

    case CONTAINER_ACTIONS.RESET_WORKFLOW:
      return {
        ...initialContainerState,
        isInitializing: false
      };

    default:
      return state;
  }
}

// =============================================================================
// MAIN CONTAINER COMPONENT
// =============================================================================

/**
 * UploadAngleContainer - Main orchestrating component for upload workflow
 * 
 * Features:
 * - Complete upload workflow orchestration
 * - State management with useReducer
 * - Integration of PhotoFrame, UploadButton, NextButton components
 * - Error boundary integration
 * - Loading states and Suspense support
 * - Progress indication
 * - Touch-friendly interactions
 * - Accessibility support
 * 
 * @param props UploadAngleProps
 * @returns JSX.Element
 */
export const UploadAngleContainer = React.memo<UploadAngleProps>(function UploadAngleContainer({
  config,
  onUploadSuccess,
  onUploadError,
  onProgressChange,
  onNext,
  disabled = false,
  initialImageUrl,
  className = '',
  testId = 'upload-angle-container'
}) {
  // State management
  const [containerState, dispatch] = useReducer(containerReducer, {
    ...initialContainerState,
    imageUrl: initialImageUrl || null
  });

  // Hooks for upload and image processing
  const {
    state: uploadState,
    uploadFile,
    reset: resetUpload,
    isUploading,
    canUpload,
    validateFile,
    cancelUpload,
    retryUpload,
    cleanup: cleanupUpload,
    isTransitioning
  } = useAngleUpload(config);

  const {
    processImage,
    generateThumbnail,
    getImageDimensions,
    isProcessing,
    capabilities,
    processingState
  } = useImageProcessing(config);

  // Refs for cleanup and error boundaries
  const containerRef = useRef<HTMLDivElement>(null);
  const lastErrorRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUploadStateRef = useRef<typeof uploadState | null>(null);

  // Memoized configuration
  const uploadConfig = useMemo(
    () => ({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
      enableCompression: true,
      ...config
    }),
    [config]
  );

  // Initialize container
  useEffect(() => {
    const initTimeout = setTimeout(() => {
      dispatch({ type: CONTAINER_ACTIONS.INITIALIZE });
    }, 100);

    return () => clearTimeout(initTimeout);
  }, []);

  // Memoized upload payload to prevent unnecessary dispatches
  const uploadPayload = useMemo(() => ({
    status: uploadState.status,
    file: uploadState.file,
    imageUrl: uploadState.imageUrl,
    error: uploadState.error,
    progress: uploadState.progress
  }), [uploadState.status, uploadState.file, uploadState.imageUrl, uploadState.error, uploadState.progress]);

  // Sync upload state with container state - only when payload changes
  useEffect(() => {
    dispatch({
      type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
      payload: uploadPayload
    });
  }, [uploadPayload]);

  // Handle progress changes
  useEffect(() => {
    if (onProgressChange && uploadState.progress !== containerState.progress) {
      onProgressChange(uploadState.progress);
    }
  }, [onProgressChange, uploadState.progress, containerState.progress]);

  // Handle upload success
  useEffect(() => {
    if (uploadState.status === STATUS.SUCCESS && uploadState.imageUrl) {
      dispatch({ type: CONTAINER_ACTIONS.TRACK_INTERACTION, payload: { interaction: 'hasCompletedUpload' } });
      if (onUploadSuccess && containerState.metadata) {
        onUploadSuccess(uploadState.imageUrl, containerState.metadata);
      }
    }
  }, [uploadState.status, uploadState.imageUrl, onUploadSuccess, containerState.metadata]);

  // Handle upload error
  useEffect(() => {
    if (uploadState.status === STATUS.ERROR && uploadState.error) {
      if (lastErrorRef.current !== uploadState.error) {
        lastErrorRef.current = uploadState.error;
        onUploadError?.(uploadState.error);
      }
    }
  }, [uploadState.status, uploadState.error, onUploadError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupUpload();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [cleanupUpload]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handles file selection from UploadButton
   */
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // Track interaction
      dispatch({ type: CONTAINER_ACTIONS.TRACK_INTERACTION, payload: { interaction: 'hasSelectedFile' } });

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        dispatch({
          type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
          payload: {
            status: STATUS.ERROR,
            error: validation.errors.join(', ')
          }
        });
        return;
      }

      // Get image dimensions for metadata
      const dimensionsResult = await getImageDimensions(file);
      if (dimensionsResult.success && dimensionsResult.data) {
        const metadata: ImageMetadata = {
          filename: file.name,
          size: file.size,
          type: file.type,
          width: dimensionsResult.data.width,
          height: dimensionsResult.data.height,
          lastModified: file.lastModified
        };
        dispatch({ type: CONTAINER_ACTIONS.SET_METADATA, payload: { metadata } });
      }

      // Start upload
      const result = await uploadFile(file);
      
      if (!result.success) {
        dispatch({
          type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
          payload: {
            status: STATUS.ERROR,
            error: result.error
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      dispatch({
        type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
        payload: {
          status: STATUS.ERROR,
          error: errorMessage
        }
      });
    }
  }, [validateFile, getImageDimensions, uploadFile]);

  /**
   * Handles upload trigger from PhotoFrame
   */
  const handleUploadTrigger = useCallback((event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    dispatch({ type: CONTAINER_ACTIONS.TRACK_INTERACTION, payload: { interaction: 'hasClickedUpload' } });
    // PhotoFrame will trigger file input - no additional action needed
  }, []);

  /**
   * Handles retry action
   */
  const handleRetry = useCallback(async () => {
    try {
      // Reset for retry attempt
      dispatch({
        type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
        payload: { status: STATUS.IDLE }
      });

      const result = await retryUpload();
      if (!result.success) {
        // Handle retry failure if needed
        console.warn('Retry failed:', result.error);
      }
    } catch (error) {
      console.error('Retry error:', error);
    }
  }, [retryUpload, containerState.uploadAttempts]);

  /**
   * Handles Next button click
   */
  const handleNext = useCallback(() => {
    if (!containerState.canProceed) return;
    
    dispatch({ type: CONTAINER_ACTIONS.SET_STEP, payload: { step: 'complete' } });
    onNext?.();
  }, [containerState.canProceed, onNext]);

  /**
   * Handles workflow reset
   */
  const handleReset = useCallback(() => {
    resetUpload();
    dispatch({ type: CONTAINER_ACTIONS.RESET_WORKFLOW });
    lastErrorRef.current = null;
  }, [resetUpload]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isContainerDisabled = disabled || containerState.isInitializing;
  const showUploadButton = containerState.currentStep === 'select' || containerState.status === STATUS.ERROR;
  const showNextButton = containerState.currentStep === 'preview' && containerState.canProceed;
  const showProgressIndicator = isUploading || isProcessing || isTransitioning;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const contentVariants = {
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (containerState.isInitializing) {
    return (
      <div 
        className={`upload-angle-loading ${className}`}
        data-testid={`${testId}-loading`}
        role="status"
        aria-label="Initializing upload component"
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          color: '#64748b'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div 
        role="status" 
        aria-label="Loading upload interface"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px' 
        }}
      >
        Loading upload interface...
      </div>
    }>
      <motion.div
        ref={containerRef}
        className={`upload-angle-container ${className}`}
        data-testid={testId}
        data-step={containerState.currentStep}
        data-status={containerState.status}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        role="region"
        aria-label="Image upload interface"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '24px',
          position: 'relative'
        }}
      >
        {/* Progress Indicator */}
        <AnimatePresence>
          {showProgressIndicator && (
            <motion.div
              variants={contentVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <ProgressIndicator
                progress={containerState.progress}
                showPercentage={true}
                variant="linear"
                color="primary"
                testId={`${testId}-progress`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Photo Frame */}
        <motion.div
          variants={contentVariants}
          initial="exit"
          animate="enter"
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <PhotoFrame
            imageUrl={containerState.imageUrl}
            alt={containerState.metadata?.filename || 'Uploaded image'}
            state={containerState.status === STATUS.IDLE ? 'empty' : 
                   containerState.status === STATUS.UPLOADING ? 'uploading' :
                   containerState.status === STATUS.SUCCESS ? 'loaded' : 'error'}
            progress={containerState.progress}
            error={containerState.error}
            aspectRatio="4:3"
            loading={isUploading}
            disabled={isContainerDisabled}
            onImageLoad={() => {
              dispatch({ type: CONTAINER_ACTIONS.SET_CAN_PROCEED, payload: { canProceed: true } });
            }}
            onImageError={(error) => {
              dispatch({
                type: CONTAINER_ACTIONS.UPDATE_UPLOAD,
                payload: {
                  status: STATUS.ERROR,
                  error: 'Failed to load image'
                }
              });
            }}
            onUpload={handleUploadTrigger}
            onRetry={handleRetry}
            accept="image/*"
            testId={`${testId}-photo-frame`}
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={contentVariants}
          initial="exit"
          animate="enter"
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* Upload Button */}
          <AnimatePresence>
            {showUploadButton && (
              <motion.div
                variants={contentVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <UploadButton
                  onFileSelect={handleFileSelect}
                  accept="image/*"
                  disabled={isContainerDisabled || isUploading}
                  variant="primary"
                  size="large"
                  testId={`${testId}-upload-button`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          <AnimatePresence>
            {showNextButton && (
              <motion.div
                variants={contentVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <NextButton
                  onClick={handleNext}
                  disabled={!containerState.canProceed || isContainerDisabled}
                  variant="primary"
                  size="large"
                  loading={isTransitioning}
                  testId={`${testId}-next-button`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset Button (for development/testing) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
              disabled={isContainerDisabled}
            >
              Reset
            </button>
          )}
        </motion.div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
            <summary>Debug Info</summary>
            <pre style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
              {JSON.stringify({
                step: containerState.currentStep,
                status: containerState.status,
                canProceed: containerState.canProceed,
                isUploading,
                isProcessing,
                interactions: containerState.interactions,
                metadata: containerState.metadata ? {
                  filename: containerState.metadata.filename,
                  size: containerState.metadata.size,
                  dimensions: `${containerState.metadata.width}x${containerState.metadata.height}`
                } : null
              }, null, 2)}
            </pre>
          </details>
        )}

        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {containerState.status === STATUS.UPLOADING && `Uploading image: ${containerState.progress}% complete`}
          {containerState.status === STATUS.SUCCESS && 'Image uploaded successfully'}
          {containerState.status === STATUS.ERROR && `Upload error: ${containerState.error}`}
        </div>
      </motion.div>

      {/* Global styles for screen reader only content */}
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .upload-angle-loading {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .upload-angle-container {
          position: relative;
        }

        .upload-angle-container[data-step="upload"] {
          pointer-events: none;
        }

        .upload-angle-container[data-step="upload"] button:not([disabled]) {
          pointer-events: auto;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .upload-angle-container {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .upload-angle-container * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </Suspense>
  );
});

UploadAngleContainer.displayName = 'UploadAngleContainer';

export default UploadAngleContainer;