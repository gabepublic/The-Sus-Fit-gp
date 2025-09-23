/**
 * @fileoverview TryItOnContainer - Main container orchestrating complete try-on workflow
 * @module @/mobile/components/TryItOn/containers/TryItOnContainer
 * @version 1.0.0
 */

'use client';

import React, { useReducer, useCallback, useMemo, Suspense, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TryItOn from '../components/TryItOn';
import { useTryonWorkflow } from '@/hooks/useTryonWorkflow';
import type {
  TryItOnContainerProps,
  TryItOnState,
  TryItOnAction,
  TryItOnConfig,
  TryItOnError,
  TryItOnMockData
} from '../types';
import {
  DEFAULT_TRYITON_CONFIG,
  TRYITON_ACTIONS
} from '../types';

// =============================================================================
// CONTAINER STATE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Container state extending base try-on state with workflow management
 */
interface ContainerState extends TryItOnState {
  /** Whether container is initializing */
  isInitializing: boolean;
  /** Whether Share navigation should be enabled */
  canNavigate: boolean;
  /** Current workflow step for tracking */
  currentStep: 'initial' | 'processing' | 'displaying' | 'sharing';
  /** Try-on attempt count for retry logic */
  tryonAttempts: number;
  /** Last generated image for caching */
  lastGeneratedImage: string | null;
  /** User interactions tracking */
  interactions: {
    hasClickedTryItOn: boolean;
    hasCompletedGeneration: boolean;
    hasNavigatedToShare: boolean;
  };
}

/**
 * Container actions for state management
 */
const CONTAINER_ACTIONS = {
  INITIALIZE: 'INITIALIZE',
  SET_STEP: 'SET_STEP',
  UPDATE_TRYITON: 'UPDATE_TRYITON',
  TRACK_INTERACTION: 'TRACK_INTERACTION',
  RESET_WORKFLOW: 'RESET_WORKFLOW',
  SET_CAN_NAVIGATE: 'SET_CAN_NAVIGATE',
  SET_MOCK_RESULT: 'SET_MOCK_RESULT'
} as const;

/**
 * Container action interfaces
 */
interface InitializeAction {
  type: typeof CONTAINER_ACTIONS.INITIALIZE;
}

interface SetStepAction {
  type: typeof CONTAINER_ACTIONS.SET_STEP;
  payload: { step: ContainerState['currentStep'] };
}

interface UpdateTryItOnAction {
  type: typeof CONTAINER_ACTIONS.UPDATE_TRYITON;
  payload: Partial<TryItOnState>;
}

interface TrackInteractionAction {
  type: typeof CONTAINER_ACTIONS.TRACK_INTERACTION;
  payload: { interaction: keyof ContainerState['interactions'] };
}

interface ResetWorkflowAction {
  type: typeof CONTAINER_ACTIONS.RESET_WORKFLOW;
}

interface SetCanNavigateAction {
  type: typeof CONTAINER_ACTIONS.SET_CAN_NAVIGATE;
  payload: { canNavigate: boolean };
}

interface SetMockResultAction {
  type: typeof CONTAINER_ACTIONS.SET_MOCK_RESULT;
  payload: { mockData: TryItOnMockData };
}

type ContainerAction =
  | InitializeAction
  | SetStepAction
  | UpdateTryItOnAction
  | TrackInteractionAction
  | ResetWorkflowAction
  | SetCanNavigateAction
  | SetMockResultAction;

// =============================================================================
// STATE REDUCER
// =============================================================================

/**
 * Initial container state
 */
const createInitialState = (config: Required<TryItOnConfig>): ContainerState => ({
  // Base TryItOn state
  viewState: 'initial',
  generatedImageUrl: null,
  isProcessing: false,
  error: null,
  progress: 0,
  hasRequiredImages: true, // Assume images are available from previous steps
  useMockData: config.useMockData,

  // Container-specific state
  isInitializing: true,
  canNavigate: false,
  currentStep: 'initial',
  tryonAttempts: 0,
  lastGeneratedImage: null,
  interactions: {
    hasClickedTryItOn: false,
    hasCompletedGeneration: false,
    hasNavigatedToShare: false
  }
});

/**
 * Container state reducer following established patterns
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

    case CONTAINER_ACTIONS.UPDATE_TRYITON:
      return {
        ...state,
        ...action.payload
      };

    case CONTAINER_ACTIONS.TRACK_INTERACTION:
      return {
        ...state,
        interactions: {
          ...state.interactions,
          [action.payload.interaction]: true
        }
      };

    case CONTAINER_ACTIONS.SET_CAN_NAVIGATE:
      return {
        ...state,
        canNavigate: action.payload.canNavigate
      };

    case CONTAINER_ACTIONS.SET_MOCK_RESULT:
      const { mockData } = action.payload;
      return {
        ...state,
        viewState: mockData.success ? 'transformed' : 'error',
        generatedImageUrl: mockData.success ? mockData.generatedImageUrl : null,
        isProcessing: false,
        error: mockData.success ? null : {
          type: 'mock',
          message: mockData.errorMessage || 'Mock generation failed',
          retryable: true
        },
        progress: 100,
        lastGeneratedImage: mockData.success ? mockData.generatedImageUrl : state.lastGeneratedImage,
        canNavigate: mockData.success
      };

    case CONTAINER_ACTIONS.RESET_WORKFLOW:
      return createInitialState({
        ...DEFAULT_TRYITON_CONFIG,
        useMockData: state.useMockData
      });

    default:
      return state;
  }
}

// =============================================================================
// MAIN CONTAINER COMPONENT
// =============================================================================

/**
 * TryItOnContainer - Main orchestrating container for try-on workflow
 *
 * Features:
 * - Complete try-on workflow management
 * - Integration with useTryonWorkflow hook
 * - Mock data support for development
 * - Error handling and recovery
 * - Animation coordination
 * - Navigation management
 * - Accessibility compliance
 *
 * @param props TryItOnContainerProps
 * @returns JSX.Element
 */
export const TryItOnContainer = React.memo<TryItOnContainerProps>(function TryItOnContainer({
  config: userConfig,
  initialImageUrl,
  onSuccess,
  onError,
  onNavigate,
  className = '',
  testId = 'tryiton-container',
  style,
  disabled = false
}) {
  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_TRYITON_CONFIG,
      ...userConfig
    }),
    [userConfig]
  );

  // Initialize container state
  const [state, dispatch] = useReducer(containerReducer, config, createInitialState);

  // Try-on workflow hook integration
  const tryonWorkflow = useTryonWorkflow(
    {
      debug: config.useMockData,
      autoRetry: config.errorHandling.autoRetry,
      maxRetries: config.errorHandling.maxRetries
    }
  );

  // Refs for cleanup and animation
  const mockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // =============================================================================
  // MOCK DATA GENERATION
  // =============================================================================

  /**
   * Generate mock try-on result for development
   */
  const generateMockResult = useCallback((): Promise<TryItOnMockData> => {
    return new Promise((resolve) => {
      const isSuccess = Math.random() < config.mockSuccessRate;
      const randomImageUrl = config.mockImageUrls[
        Math.floor(Math.random() * config.mockImageUrls.length)
      ];

      mockTimeoutRef.current = setTimeout(() => {
        resolve({
          generatedImageUrl: randomImageUrl,
          processingTime: config.mockDelay,
          success: isSuccess,
          errorMessage: isSuccess ? undefined : 'Mock try-on generation failed'
        });
      }, config.mockDelay);
    });
  }, [config.mockSuccessRate, config.mockImageUrls, config.mockDelay]);

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  /**
   * Handle try-it-on button click
   */
  const handleTryItOn = useCallback(async () => {
    if (disabled || state.isProcessing) return;

    // Track interaction
    dispatch({
      type: CONTAINER_ACTIONS.TRACK_INTERACTION,
      payload: { interaction: 'hasClickedTryItOn' }
    });

    // Set processing state
    dispatch({
      type: CONTAINER_ACTIONS.UPDATE_TRYITON,
      payload: {
        viewState: 'processing',
        isProcessing: true,
        progress: 0,
        error: null
      }
    });

    dispatch({
      type: CONTAINER_ACTIONS.SET_STEP,
      payload: { step: 'processing' }
    });

    try {
      let result: TryItOnMockData;

      if (config.useMockData) {
        // Use mock data for development
        result = await generateMockResult();
      } else {
        // TODO: Use real try-on workflow
        // For now, fall back to mock data
        result = await generateMockResult();
      }

      // Apply result
      dispatch({
        type: CONTAINER_ACTIONS.SET_MOCK_RESULT,
        payload: { mockData: result }
      });

      dispatch({
        type: CONTAINER_ACTIONS.SET_STEP,
        payload: { step: 'displaying' }
      });

      dispatch({
        type: CONTAINER_ACTIONS.TRACK_INTERACTION,
        payload: { interaction: 'hasCompletedGeneration' }
      });

      // Call success callback
      if (result.success && result.generatedImageUrl) {
        onSuccess?.(result.generatedImageUrl);
      }

    } catch (error) {
      const tryItOnError: TryItOnError = {
        type: 'workflow',
        message: error instanceof Error ? error.message : 'Try-on generation failed',
        retryable: true,
        originalError: error instanceof Error ? error : undefined
      };

      dispatch({
        type: CONTAINER_ACTIONS.UPDATE_TRYITON,
        payload: {
          viewState: 'error',
          isProcessing: false,
          error: tryItOnError
        }
      });

      onError?.(tryItOnError);
    }
  }, [disabled, state.isProcessing, config.useMockData, generateMockResult, onSuccess, onError]);

  /**
   * Handle share button click
   */
  const handleShare = useCallback(async () => {
    if (disabled || !state.canNavigate) return;

    dispatch({
      type: CONTAINER_ACTIONS.TRACK_INTERACTION,
      payload: { interaction: 'hasNavigatedToShare' }
    });

    dispatch({
      type: CONTAINER_ACTIONS.SET_STEP,
      payload: { step: 'sharing' }
    });

    try {
      onNavigate?.(config.navigation.shareRoute);
    } catch (error) {
      const navigationError: TryItOnError = {
        type: 'navigation',
        message: 'Failed to navigate to share view',
        retryable: true,
        originalError: error instanceof Error ? error : undefined
      };

      dispatch({
        type: CONTAINER_ACTIONS.UPDATE_TRYITON,
        payload: { error: navigationError }
      });

      onError?.(navigationError);
    }
  }, [disabled, state.canNavigate, config.navigation.shareRoute, onNavigate, onError]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(async () => {
    dispatch({
      type: CONTAINER_ACTIONS.UPDATE_TRYITON,
      payload: {
        error: null,
        viewState: 'initial',
        isProcessing: false,
        progress: 0
      }
    });

    dispatch({
      type: CONTAINER_ACTIONS.SET_STEP,
      payload: { step: 'initial' }
    });
  }, []);

  /**
   * Handle clear error
   */
  const handleClearError = useCallback(() => {
    dispatch({
      type: CONTAINER_ACTIONS.UPDATE_TRYITON,
      payload: { error: null }
    });
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Initialize container
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch({ type: CONTAINER_ACTIONS.INITIALIZE });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (mockTimeoutRef.current) {
        clearTimeout(mockTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // =============================================================================
  // DERIVED STATE
  // =============================================================================

  /**
   * Component state for TryItOn component
   */
  const componentState: TryItOnState = useMemo(() => ({
    viewState: state.viewState,
    generatedImageUrl: state.generatedImageUrl,
    isProcessing: state.isProcessing,
    error: state.error,
    progress: state.progress,
    hasRequiredImages: state.hasRequiredImages,
    useMockData: state.useMockData
  }), [state]);

  /**
   * ARIA attributes for accessibility
   */
  const ariaAttributes = useMemo(() => ({
    'aria-label': 'Try It On interface',
    'aria-busy': state.isProcessing,
    'aria-live': state.isProcessing ? 'polite' : 'off',
    'aria-describedby': state.error ? 'tryiton-error' : undefined
  }), [state.isProcessing, state.error]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (state.isInitializing) {
    return (
      <div
        className={`tryiton-loading ${className}`}
        data-testid={`${testId}-loading`}
        style={style}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <motion.div
      className={`tryiton-container ${className}`}
      data-testid={testId}
      style={{ ...style, opacity: 1 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      {...ariaAttributes}
    >
      <Suspense
        fallback={
          <div className="tryiton-fallback">
            <div className="loading-spinner" />
          </div>
        }
      >
        <TryItOn
          state={componentState}
          onTryItOn={handleTryItOn}
          onShare={handleShare}
          onRetry={handleRetry}
          onClearError={handleClearError}
          config={config}
          disabled={disabled}
          testId={`${testId}-component`}
        />
      </Suspense>

      {/* Error announcement for screen readers */}
      {state.error && (
        <div
          id="tryiton-error"
          className="sr-only"
          aria-live="assertive"
          role="alert"
        >
          {state.error.message}
        </div>
      )}

      {/* Loading announcement for screen readers */}
      {state.isProcessing && (
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Generating try-on result, please wait...
        </div>
      )}
    </motion.div>
  );
});

TryItOnContainer.displayName = 'TryItOnContainer';