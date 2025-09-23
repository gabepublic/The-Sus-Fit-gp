/**
 * @fileoverview useTryItOnLogic - Main state management hook for Try It On workflow
 * @module @/mobile/components/TryItOn/hooks/useTryItOnLogic
 * @version 1.0.0
 *
 * This hook provides comprehensive state management for the Try It On component,
 * integrating with the existing useTryonWorkflow hook while providing mock data
 * capabilities for development. It handles button states, progress tracking,
 * and error management with full accessibility support.
 *
 * @example
 * ```typescript
 * import { useTryItOnLogic } from './useTryItOnLogic';
 *
 * function TryItOnContainer() {
 *   const { state, actions, utils } = useTryItOnLogic({
 *     useMockData: true,
 *     mockDelay: 2000
 *   });
 *
 *   return (
 *     <TryItOn
 *       state={state}
 *       onTryItOn={actions.tryItOn}
 *       onShare={actions.share}
 *       onRetry={actions.retry}
 *       onClearError={actions.clearError}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTryonWorkflow, type WorkflowState } from '@/hooks/useTryonWorkflow';
import type {
  TryItOnState,
  TryItOnConfig,
  TryItOnError,
  UseTryItOnReturn,
  TryItOnViewState
} from '../types';
import {
  DEFAULT_TRYITON_CONFIG
} from '../types';
import {
  generateMockTryItOnResult,
  simulateProgressUpdates,
  shouldUseMockData,
  getMockConfig,
  configureMockScenario,
  type MockScenario
} from '../utils/mockData';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Hook configuration options
 */
export interface UseTryItOnLogicConfig extends TryItOnConfig {
  /** Initial mock scenario */
  initialMockScenario?: MockScenario;
  /** Enable automatic state transitions */
  autoTransitions?: boolean;
  /** Custom progress update interval */
  progressInterval?: number;
  /** Accessibility announcement callback */
  onAccessibilityAnnouncement?: (message: string) => void;
}

/**
 * Internal hook state for managing complex interactions
 */
interface InternalState {
  /** Whether hook is currently processing */
  isProcessing: boolean;
  /** Current operation start time */
  operationStartTime: number | null;
  /** Progress tracking interval reference */
  progressIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  /** Mock operation abort controller */
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  /** Retry count for exponential backoff */
  retryCount: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default hook configuration
 */
const DEFAULT_HOOK_CONFIG: Required<UseTryItOnLogicConfig> = {
  ...DEFAULT_TRYITON_CONFIG,
  initialMockScenario: 'success',
  autoTransitions: true,
  progressInterval: 100,
  onAccessibilityAnnouncement: undefined
};

/**
 * Initial Try It On state
 */
const INITIAL_TRYITON_STATE: TryItOnState = {
  viewState: 'initial',
  generatedImageUrl: null,
  isProcessing: false,
  error: null,
  progress: 0,
  hasRequiredImages: false,
  useMockData: shouldUseMockData()
};

/**
 * Progress increment steps for smooth animations
 */
const PROGRESS_STEPS = [0, 10, 25, 40, 60, 80, 95, 100];

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Main Try It On logic hook
 * @param config - Hook configuration options
 * @returns Complete hook interface with state, actions, and utilities
 */
export function useTryItOnLogic(
  config: Partial<UseTryItOnLogicConfig> = {}
): UseTryItOnReturn {
  // Merge configuration with defaults
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_HOOK_CONFIG, ...config }),
    [config]
  );

  // Internal refs for cleanup and control
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationStartTimeRef = useRef<number | null>(null);

  // Main component state
  const [state, setState] = useState<TryItOnState>(() => ({
    ...INITIAL_TRYITON_STATE,
    useMockData: finalConfig.useMockData,
    hasRequiredImages: true // For mock mode, assume images are available
  }));

  // Internal state for complex operations
  const [internalState, setInternalState] = useState<InternalState>({
    isProcessing: false,
    operationStartTime: null,
    progressIntervalRef,
    abortControllerRef,
    retryCount: 0
  });

  // Initialize workflow hook (will be used for real API integration)
  const workflowHook = useTryonWorkflow(
    {
      autoRetry: finalConfig.errorHandling?.autoRetry,
      maxRetries: finalConfig.errorHandling?.maxRetries,
      debug: finalConfig.useMockData
    }
  );

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Log debug messages when in development mode
   */
  const log = useCallback((...args: any[]) => {
    if (finalConfig.useMockData && process.env.NODE_ENV === 'development') {
      console.log('[useTryItOnLogic]', ...args);
    }
  }, [finalConfig.useMockData]);

  /**
   * Announce state changes for accessibility
   */
  const announceStateChange = useCallback((message: string) => {
    if (finalConfig.onAccessibilityAnnouncement) {
      finalConfig.onAccessibilityAnnouncement(message);
    }
    log('Accessibility announcement:', message);
  }, [finalConfig.onAccessibilityAnnouncement, log]);

  /**
   * Create Try It On error with proper typing
   */
  const createTryItOnError = useCallback((
    type: TryItOnError['type'],
    message: string,
    retryable: boolean = true,
    originalError?: Error
  ): TryItOnError => {
    return {
      type,
      message,
      retryable,
      originalError
    };
  }, []);

  /**
   * Update progress with smooth increments
   */
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  /**
   * Set view state with accessibility announcements
   */
  const setViewState = useCallback((viewState: TryItOnViewState) => {
    setState(prev => ({ ...prev, viewState }));

    // Announce state changes
    switch (viewState) {
      case 'initial':
        announceStateChange('Ready for try-on generation');
        break;
      case 'processing':
        announceStateChange('Generating your try-on image...');
        break;
      case 'transformed':
        announceStateChange('Try-on image generated successfully');
        break;
      case 'error':
        announceStateChange('Error generating try-on image');
        break;
    }
  }, [announceStateChange]);

  // =============================================================================
  // MOCK WORKFLOW IMPLEMENTATION
  // =============================================================================

  /**
   * Execute mock try-on workflow
   */
  const executeMockWorkflow = useCallback(async (): Promise<void> => {
    try {
      log('Starting mock workflow');

      // Set up mock scenario if configured
      if (finalConfig.initialMockScenario) {
        configureMockScenario(finalConfig.initialMockScenario, {
          processingDelay: finalConfig.mockDelay,
          debug: finalConfig.useMockData
        });
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      operationStartTimeRef.current = Date.now();

      // Set initial processing state
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0
      }));
      setViewState('processing');

      // Simulate progress updates
      await simulateProgressUpdates(
        (progress) => {
          if (!abortControllerRef.current?.signal.aborted) {
            updateProgress(progress);
          }
        },
        finalConfig.mockDelay
      );

      // Check if operation was aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      // Generate mock result
      const result = await generateMockTryItOnResult();

      if (result.success && result.imageUrl) {
        setState(prev => ({
          ...prev,
          generatedImageUrl: result.imageUrl,
          isProcessing: false,
          progress: 100
        }));
        setViewState('transformed');

        log('Mock workflow completed successfully');
      } else {
        throw new Error(result.error?.message || 'Mock generation failed');
      }

    } catch (error) {
      log('Mock workflow error:', error);

      const tryItOnError = createTryItOnError(
        'mock',
        error instanceof Error ? error.message : 'Unknown error occurred',
        true,
        error instanceof Error ? error : undefined
      );

      setState(prev => ({
        ...prev,
        error: tryItOnError,
        isProcessing: false,
        progress: 0
      }));
      setViewState('error');
    }
  }, [
    finalConfig.initialMockScenario,
    finalConfig.mockDelay,
    finalConfig.useMockData,
    log,
    setViewState,
    updateProgress,
    createTryItOnError
  ]);

  /**
   * Execute real workflow using useTryonWorkflow
   */
  const executeRealWorkflow = useCallback(async (): Promise<void> => {
    try {
      log('Starting real workflow');

      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0
      }));
      setViewState('processing');

      // Use the existing workflow hook
      await workflowHook.startGeneration();

      // The workflow hook will handle state updates
      // We'll monitor its state in useEffect

    } catch (error) {
      log('Real workflow error:', error);

      const tryItOnError = createTryItOnError(
        'workflow',
        error instanceof Error ? error.message : 'Try-on generation failed',
        true,
        error instanceof Error ? error : undefined
      );

      setState(prev => ({
        ...prev,
        error: tryItOnError,
        isProcessing: false,
        progress: 0
      }));
      setViewState('error');
    }
  }, [log, setViewState, workflowHook, createTryItOnError]);

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  /**
   * Handle try it on action
   */
  const handleTryItOn = useCallback(async (): Promise<void> => {
    if (state.isProcessing) {
      log('Try it on already in progress');
      return;
    }

    setInternalState(prev => ({
      ...prev,
      isProcessing: true,
      operationStartTime: Date.now(),
      retryCount: 0
    }));

    try {
      if (finalConfig.useMockData) {
        await executeMockWorkflow();
      } else {
        await executeRealWorkflow();
      }
    } finally {
      setInternalState(prev => ({
        ...prev,
        isProcessing: false,
        operationStartTime: null
      }));
    }
  }, [
    state.isProcessing,
    finalConfig.useMockData,
    executeMockWorkflow,
    executeRealWorkflow,
    log
  ]);

  /**
   * Handle share action
   */
  const handleShare = useCallback(async (): Promise<void> => {
    if (!state.generatedImageUrl) {
      log('No image to share');
      return;
    }

    try {
      log('Sharing try-on result');

      // Implement share logic here
      // For now, just log the action
      announceStateChange('Sharing try-on result');

      // Navigate to share route if configured
      if (finalConfig.navigation?.shareRoute) {
        // Navigation logic would go here
        log('Would navigate to:', finalConfig.navigation.shareRoute);
      }

    } catch (error) {
      log('Share error:', error);

      const shareError = createTryItOnError(
        'navigation',
        'Failed to share try-on result',
        true,
        error instanceof Error ? error : undefined
      );

      setState(prev => ({ ...prev, error: shareError }));
    }
  }, [
    state.generatedImageUrl,
    finalConfig.navigation?.shareRoute,
    log,
    announceStateChange,
    createTryItOnError
  ]);

  /**
   * Handle retry action with exponential backoff
   */
  const handleRetry = useCallback(async (): Promise<void> => {
    if (state.isProcessing || !state.error?.retryable) {
      log('Cannot retry - either processing or error not retryable');
      return;
    }

    const maxRetries = finalConfig.errorHandling?.maxRetries || 3;

    if (internalState.retryCount >= maxRetries) {
      log('Max retries exceeded');
      announceStateChange('Maximum retry attempts exceeded');
      return;
    }

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, internalState.retryCount), 10000);

    setInternalState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    setState(prev => ({ ...prev, error: null }));

    log(`Retrying in ${delay}ms (attempt ${internalState.retryCount + 1}/${maxRetries})`);

    setTimeout(() => {
      handleTryItOn();
    }, delay);
  }, [
    state.isProcessing,
    state.error,
    internalState.retryCount,
    finalConfig.errorHandling?.maxRetries,
    log,
    announceStateChange,
    handleTryItOn
  ]);

  /**
   * Handle clear error action
   */
  const handleClearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
    setViewState('initial');
    announceStateChange('Error cleared, ready for try-on');
  }, [setViewState, announceStateChange]);

  /**
   * Handle reset action
   */
  const handleReset = useCallback((): void => {
    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Reset state
    setState(INITIAL_TRYITON_STATE);
    setInternalState(prev => ({
      ...prev,
      isProcessing: false,
      operationStartTime: null,
      retryCount: 0
    }));

    setViewState('initial');
    announceStateChange('Try-on workflow reset');
  }, [setViewState, announceStateChange]);

  // =============================================================================
  // UTILITY FUNCTIONS FOR EXTERNAL USE
  // =============================================================================

  const utils = useMemo(() => ({
    /**
     * Check if try it on action can be performed
     */
    canTryItOn: (): boolean => {
      return !state.isProcessing && state.hasRequiredImages && state.viewState === 'initial';
    },

    /**
     * Check if share action can be performed
     */
    canShare: (): boolean => {
      return state.viewState === 'transformed' && state.generatedImageUrl !== null;
    },

    /**
     * Check if component is in loading state
     */
    isLoading: (): boolean => {
      return state.isProcessing || state.viewState === 'processing';
    },

    /**
     * Check if component has an error
     */
    hasError: (): boolean => {
      return state.error !== null || state.viewState === 'error';
    },

    /**
     * Get operation duration
     */
    getOperationDuration: (): number => {
      return operationStartTimeRef.current
        ? Date.now() - operationStartTimeRef.current
        : 0;
    }
  }), [state]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Monitor workflow hook state changes for real API integration
   */
  useEffect(() => {
    if (!finalConfig.useMockData && finalConfig.autoTransitions) {
      const workflowState = workflowHook.workflowState;

      switch (workflowState) {
        case WorkflowState.GENERATING:
          setViewState('processing');
          setState(prev => ({ ...prev, isProcessing: true }));
          break;

        case WorkflowState.COMPLETE:
          if (workflowHook.generatedImage) {
            setState(prev => ({
              ...prev,
              generatedImageUrl: workflowHook.generatedImage,
              isProcessing: false,
              progress: 100
            }));
            setViewState('transformed');
          }
          break;

        case WorkflowState.ERROR:
          if (workflowHook.error) {
            const error = createTryItOnError(
              'workflow',
              workflowHook.error.message,
              workflowHook.error.retryable
            );
            setState(prev => ({
              ...prev,
              error,
              isProcessing: false,
              progress: 0
            }));
            setViewState('error');
          }
          break;
      }

      // Update progress
      if (workflowHook.progress !== state.progress) {
        updateProgress(workflowHook.progress);
      }
    }
  }, [
    finalConfig.useMockData,
    finalConfig.autoTransitions,
    workflowHook.workflowState,
    workflowHook.generatedImage,
    workflowHook.error,
    workflowHook.progress,
    state.progress,
    setViewState,
    updateProgress,
    createTryItOnError
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    state,
    actions: {
      tryItOn: handleTryItOn,
      share: handleShare,
      retry: handleRetry,
      clearError: handleClearError,
      reset: handleReset
    },
    utils
  };
}

/**
 * Default export for convenience
 */
export default useTryItOnLogic;