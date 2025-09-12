/**
 * @fileoverview useNextButtonState - React hook for managing NextButton visibility and navigation states
 * @module @/mobile/components/UploadFit/hooks/useNextButtonState
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useTransition, useMemo } from 'react';
import type { UploadStatus } from '../types/upload.types';
import { UPLOAD_STATUS } from '../types/upload.types';

// =============================================================================
// TYPES AND INTERFACES (Task 4.2)
// =============================================================================

/**
 * NextButton states enum for clear state management
 */
export const NEXT_BUTTON_STATE = {
  /** Hidden state - before upload completion */
  HIDDEN: 'hidden',
  /** Visible state - after successful upload */
  VISIBLE: 'visible', 
  /** Loading state - during navigation */
  LOADING: 'loading'
} as const;

/**
 * NextButton state union type
 */
export type NextButtonState = typeof NEXT_BUTTON_STATE[keyof typeof NEXT_BUTTON_STATE];

/**
 * NextButton state management configuration
 */
export interface NextButtonConfig {
  /** Initial button state */
  initialState?: NextButtonState;
  /** Enable auto state transitions based on upload state */
  autoTransition?: boolean;
  /** Slide-in animation delay in milliseconds */
  slideInDelay?: number;
  /** Enable state transition logging for debugging */
  enableLogging?: boolean;
}

/**
 * NextButton state management return interface
 */
export interface UseNextButtonStateReturn {
  /** Current button state */
  buttonState: NextButtonState;
  /** Whether button is visible (not hidden) */
  isVisible: boolean;
  /** Whether button is loading */
  isLoading: boolean;
  /** Whether button should be disabled */
  isDisabled: boolean;
  /** Whether a React transition is pending */
  isTransitioning: boolean;
  /** Manually set button to visible state */
  showButton: () => void;
  /** Set button to loading state */
  setLoading: () => void;
  /** Reset button to hidden state */
  resetButton: () => void;
  /** Handle navigation complete (loading -> visible) */
  onNavigationComplete: () => void;
  /** Handle navigation error (loading -> visible) */
  onNavigationError: () => void;
}

// =============================================================================
// DEFAULT CONFIGURATION (Task 4.2)
// =============================================================================

/**
 * Default NextButton state management configuration
 */
const defaultConfig: Required<NextButtonConfig> = {
  initialState: NEXT_BUTTON_STATE.HIDDEN,
  autoTransition: true,
  slideInDelay: 150,
  enableLogging: false
};

// =============================================================================
// HOOK IMPLEMENTATION (Task 4.2)
// =============================================================================

/**
 * Custom hook for managing NextButton state with three distinct states:
 * - HIDDEN: Button not visible (before upload completion)
 * - VISIBLE: Button visible with slide-in animation (after successful upload)
 * - LOADING: Button showing loading state (during navigation)
 * 
 * Features:
 * - React 18 useTransition for smooth state changes
 * - Auto state transitions based on upload status
 * - Configurable slide-in animation delay
 * - Manual state control methods
 * - Loading state management for navigation
 * - Error recovery handling
 * 
 * @param uploadStatus Current upload status from useFitUpload
 * @param config Configuration options for button behavior
 * @returns NextButton state management object
 * 
 * @example
 * ```typescript
 * const { buttonState, isVisible, setLoading, showButton } = useNextButtonState(
 *   uploadState.status,
 *   { slideInDelay: 200 }
 * );
 * 
 * // Button visibility based on upload success
 * if (uploadState.status === 'success' && !isVisible) {
 *   showButton();
 * }
 * 
 * // Handle navigation click
 * const handleNavigate = () => {
 *   setLoading();
 *   router.push('/m/tryon');
 * };
 * ```
 */
export function useNextButtonState(
  uploadStatus: UploadStatus,
  config: NextButtonConfig = {}
): UseNextButtonStateReturn {
  
  // Merge config with defaults
  const finalConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config]);

  // Internal button state
  const [buttonState, setButtonState] = useState<NextButtonState>(finalConfig.initialState);
  
  // React 18 transition for smooth state updates
  const [isTransitioning, startTransition] = useTransition();

  // =============================================================================
  // STATE TRANSITION HELPERS (Task 4.2)
  // =============================================================================

  /**
   * Log state transitions for debugging
   */
  const logStateTransition = useCallback((from: NextButtonState, to: NextButtonState, reason: string) => {
    if (finalConfig.enableLogging) {
      console.log(`[NextButton] State transition: ${from} -> ${to} (${reason})`);
    }
  }, [finalConfig.enableLogging]);

  /**
   * Transition to new button state with React 18 optimization
   */
  const transitionToState = useCallback((newState: NextButtonState, reason: string) => {
    startTransition(() => {
      setButtonState(currentState => {
        if (currentState !== newState) {
          logStateTransition(currentState, newState, reason);
          return newState;
        }
        return currentState;
      });
    });
  }, [logStateTransition]);

  // =============================================================================
  // AUTO STATE TRANSITIONS (Task 4.2)
  // =============================================================================

  /**
   * Handle auto state transitions based on upload status
   */
  useEffect(() => {
    if (!finalConfig.autoTransition) return;

    switch (uploadStatus) {
      case UPLOAD_STATUS.SUCCESS:
        // Show button after successful upload with optional delay
        if (buttonState === NEXT_BUTTON_STATE.HIDDEN) {
          const timeoutId = setTimeout(() => {
            transitionToState(NEXT_BUTTON_STATE.VISIBLE, 'upload success');
          }, finalConfig.slideInDelay);
          
          return () => clearTimeout(timeoutId);
        }
        break;

      case UPLOAD_STATUS.UPLOADING:
        // Keep button hidden during upload
        if (buttonState === NEXT_BUTTON_STATE.VISIBLE) {
          transitionToState(NEXT_BUTTON_STATE.HIDDEN, 'upload started');
        }
        break;

      case UPLOAD_STATUS.ERROR:
        // Hide button on upload error
        if (buttonState !== NEXT_BUTTON_STATE.HIDDEN) {
          transitionToState(NEXT_BUTTON_STATE.HIDDEN, 'upload error');
        }
        break;

      case UPLOAD_STATUS.IDLE:
        // Reset to hidden when upload is reset
        if (buttonState !== NEXT_BUTTON_STATE.HIDDEN) {
          transitionToState(NEXT_BUTTON_STATE.HIDDEN, 'upload reset');
        }
        break;

      default:
        break;
    }
  }, [uploadStatus, buttonState, finalConfig.autoTransition, finalConfig.slideInDelay, transitionToState]);

  // =============================================================================
  // MANUAL STATE CONTROL METHODS (Task 4.2)
  // =============================================================================

  /**
   * Manually show the button (hidden -> visible)
   */
  const showButton = useCallback(() => {
    if (buttonState === NEXT_BUTTON_STATE.HIDDEN) {
      transitionToState(NEXT_BUTTON_STATE.VISIBLE, 'manual show');
    }
  }, [buttonState, transitionToState]);

  /**
   * Set button to loading state (visible -> loading)
   */
  const setLoading = useCallback(() => {
    if (buttonState === NEXT_BUTTON_STATE.VISIBLE) {
      transitionToState(NEXT_BUTTON_STATE.LOADING, 'navigation start');
    }
  }, [buttonState, transitionToState]);

  /**
   * Reset button to hidden state (any -> hidden)
   */
  const resetButton = useCallback(() => {
    transitionToState(NEXT_BUTTON_STATE.HIDDEN, 'manual reset');
  }, [transitionToState]);

  /**
   * Handle navigation completion (loading -> visible)
   */
  const onNavigationComplete = useCallback(() => {
    if (buttonState === NEXT_BUTTON_STATE.LOADING) {
      transitionToState(NEXT_BUTTON_STATE.VISIBLE, 'navigation complete');
    }
  }, [buttonState, transitionToState]);

  /**
   * Handle navigation error (loading -> visible for retry)
   */
  const onNavigationError = useCallback(() => {
    if (buttonState === NEXT_BUTTON_STATE.LOADING) {
      transitionToState(NEXT_BUTTON_STATE.VISIBLE, 'navigation error');
    }
  }, [buttonState, transitionToState]);

  // =============================================================================
  // COMPUTED STATE VALUES (Task 4.2)
  // =============================================================================

  /**
   * Whether button is visible (not hidden)
   */
  const isVisible = useMemo(() => 
    buttonState !== NEXT_BUTTON_STATE.HIDDEN, 
    [buttonState]
  );

  /**
   * Whether button is in loading state
   */
  const isLoading = useMemo(() => 
    buttonState === NEXT_BUTTON_STATE.LOADING, 
    [buttonState]
  );

  /**
   * Whether button should be disabled
   * Button is disabled during loading or when upload is not successful
   */
  const isDisabled = useMemo(() => 
    isLoading || 
    uploadStatus !== UPLOAD_STATUS.SUCCESS || 
    buttonState === NEXT_BUTTON_STATE.HIDDEN,
    [isLoading, uploadStatus, buttonState]
  );

  // =============================================================================
  // RETURN INTERFACE (Task 4.2)
  // =============================================================================

  return {
    buttonState,
    isVisible,
    isLoading,
    isDisabled,
    isTransitioning,
    showButton,
    setLoading,
    resetButton,
    onNavigationComplete,
    onNavigationError
  };
}

// =============================================================================
// UTILITY FUNCTIONS (Task 4.2)
// =============================================================================

/**
 * Type guard to check if value is a valid NextButtonState
 */
export const isNextButtonState = (value: unknown): value is NextButtonState => {
  return typeof value === 'string' && Object.values(NEXT_BUTTON_STATE).includes(value as NextButtonState);
};

/**
 * Get display text for NextButton based on current state
 */
export const getNextButtonText = (state: NextButtonState): string => {
  switch (state) {
    case NEXT_BUTTON_STATE.HIDDEN:
      return '';
    case NEXT_BUTTON_STATE.VISIBLE:
      return 'Try It On';
    case NEXT_BUTTON_STATE.LOADING:
      return 'Going to Try-On...';
    default:
      return 'Try It On';
  }
};

/**
 * Get ARIA label for NextButton based on current state
 */
export const getNextButtonAriaLabel = (state: NextButtonState): string => {
  switch (state) {
    case NEXT_BUTTON_STATE.HIDDEN:
      return 'Try it on button - hidden';
    case NEXT_BUTTON_STATE.VISIBLE:
      return 'Continue to try on your fit';
    case NEXT_BUTTON_STATE.LOADING:
      return 'Navigating to try-on, please wait';
    default:
      return 'Continue to try on your fit';
  }
};