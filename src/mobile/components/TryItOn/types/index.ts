/**
 * @fileoverview TryItOn Types - Isolated type definitions for the Try It On View component
 * @module @/mobile/components/TryItOn/types
 * @version 1.0.0
 *
 * This module provides comprehensive TypeScript type definitions for the TryItOn component system.
 * All types are isolated from the main application to prevent circular dependencies and ensure
 * clean separation of concerns.
 *
 * @example
 * ```typescript
 * import { TryItOnState, TryItOnProps, UseTryItOnReturn } from '@/mobile/components/TryItOn/types';
 *
 * const initialState: TryItOnState = {
 *   viewState: 'initial',
 *   generatedImageUrl: null,
 *   isProcessing: false,
 *   error: null
 * };
 * ```
 */

// Re-export workflow types from the hook for integration
export type {
  WorkflowState,
  WorkflowError,
  WorkflowConfig,
  TryonWorkflowState,
  TryonWorkflowActions
} from '@/hooks/useTryonWorkflow';

export {
  WorkflowState
} from '@/hooks/useTryonWorkflow';

// =============================================================================
// CORE STATE TYPES
// =============================================================================

/**
 * Try It On view states representing different UI phases
 */
export type TryItOnViewState =
  | 'initial'     // Showing mannequin with "Try It On" button
  | 'processing'  // Processing the try-on request
  | 'transformed' // Showing generated result with "Share" button
  | 'error';      // Error state with retry options

/**
 * Main component state interface
 */
export interface TryItOnState {
  /** Current view state determining UI layout */
  viewState: TryItOnViewState;

  /** Generated try-on image URL */
  generatedImageUrl: string | null;

  /** Processing state for showing loading indicators */
  isProcessing: boolean;

  /** Current error if any */
  error: TryItOnError | null;

  /** Progress percentage (0-100) */
  progress: number;

  /** Whether user has uploaded required images */
  hasRequiredImages: boolean;

  /** Mock mode flag for development */
  useMockData: boolean;
}

/**
 * Try It On specific error types
 */
export interface TryItOnError {
  type: 'workflow' | 'navigation' | 'animation' | 'mock' | 'component';
  message: string;
  retryable: boolean;
  originalError?: Error;
}

/**
 * State actions for reducer pattern
 */
export type TryItOnAction =
  | { type: 'START_PROCESSING' }
  | { type: 'SET_GENERATED_IMAGE'; payload: { imageUrl: string } }
  | { type: 'SET_ERROR'; payload: { error: TryItOnError } }
  | { type: 'SET_PROGRESS'; payload: { progress: number } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' }
  | { type: 'SET_MOCK_MODE'; payload: { useMockData: boolean } };

/**
 * Action type constants for type safety
 */
export const TRYITON_ACTIONS = {
  START_PROCESSING: 'START_PROCESSING',
  SET_GENERATED_IMAGE: 'SET_GENERATED_IMAGE',
  SET_ERROR: 'SET_ERROR',
  SET_PROGRESS: 'SET_PROGRESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STATE: 'RESET_STATE',
  SET_MOCK_MODE: 'SET_MOCK_MODE'
} as const;

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration for Try It On component behavior
 */
export interface TryItOnConfig {
  /** Enable mock data for development */
  useMockData?: boolean;

  /** Mock processing delay in milliseconds */
  mockDelay?: number;

  /** Mock success rate (0-1) for testing error scenarios */
  mockSuccessRate?: number;

  /** Mock image URLs for generated results */
  mockImageUrls?: string[];

  /** Animation configuration */
  animation?: {
    /** Fade transition duration in milliseconds */
    fadeInDuration?: number;
    /** Enable reduced motion support */
    respectReducedMotion?: boolean;
  };

  /** Navigation configuration */
  navigation?: {
    /** Target route for Share button */
    shareRoute?: string;
    /** Enable route prefetching */
    enablePrefetch?: boolean;
  };

  /** Error handling configuration */
  errorHandling?: {
    /** Auto retry failed operations */
    autoRetry?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_TRYITON_CONFIG: Required<TryItOnConfig> = {
  useMockData: process.env.NODE_ENV === 'development',
  mockDelay: 2000,
  mockSuccessRate: 1.0,
  mockImageUrls: [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3'
  ],
  animation: {
    fadeInDuration: 1000,
    respectReducedMotion: true
  },
  navigation: {
    shareRoute: '/m/share',
    enablePrefetch: true
  },
  errorHandling: {
    autoRetry: false,
    maxRetries: 3
  }
};

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Base props shared across Try It On components
 */
export interface BaseTryItOnProps {
  /** Custom CSS classes */
  className?: string;

  /** Test ID for automated testing */
  testId?: string;

  /** Custom inline styles */
  style?: React.CSSProperties;

  /** Whether component is disabled */
  disabled?: boolean;
}

/**
 * Main TryItOn component props
 */
export interface TryItOnProps extends BaseTryItOnProps {
  /** Current component state */
  state: TryItOnState;

  /** Action handlers */
  onTryItOn: () => void;
  onShare: () => void;
  onRetry: () => void;
  onClearError: () => void;

  /** Component configuration */
  config?: TryItOnConfig;

  /** Accessibility props */
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * Container component props
 */
export interface TryItOnContainerProps extends BaseTryItOnProps {
  /** Component configuration */
  config?: TryItOnConfig;

  /** Initial image URL if any */
  initialImageUrl?: string;

  /** Callback for successful try-on generation */
  onSuccess?: (imageUrl: string) => void;

  /** Callback for try-on errors */
  onError?: (error: TryItOnError) => void;

  /** Callback for navigation events */
  onNavigate?: (route: string) => void;
}

/**
 * Error boundary wrapper props
 */
export interface TryItOnWithErrorBoundaryProps extends BaseTryItOnProps {
  /** Child components */
  children: React.ReactNode;

  /** Custom error fallback component */
  ErrorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;

  /** Custom loading fallback component */
  LoadingFallback?: React.ComponentType;

  /** Error recovery callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Custom hook return type for Try It On logic
 */
export interface UseTryItOnReturn {
  /** Current component state */
  state: TryItOnState;

  /** Actions for state manipulation */
  actions: {
    tryItOn: () => Promise<void>;
    share: () => Promise<void>;
    retry: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
  };

  /** Utility functions */
  utils: {
    canTryItOn: () => boolean;
    canShare: () => boolean;
    isLoading: () => boolean;
    hasError: () => boolean;
  };
}

// =============================================================================
// RESULT & UTILITY TYPES
// =============================================================================

/**
 * Try-on operation result
 */
export interface TryItOnResult {
  success: boolean;
  imageUrl?: string;
  error?: TryItOnError;
  duration?: number;
}

/**
 * Mock data interface for development
 */
export interface TryItOnMockData {
  generatedImageUrl: string;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

/**
 * Type guard to check if value is a valid TryItOnViewState
 */
export function isTryItOnViewState(value: unknown): value is TryItOnViewState {
  return typeof value === 'string' &&
    ['initial', 'processing', 'transformed', 'error'].includes(value);
}

/**
 * Type guard to check if error is a TryItOnError
 */
export function isTryItOnError(error: unknown): error is TryItOnError {
  return typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'retryable' in error;
}

/**
 * Utility to create a TryItOnError
 */
export function createTryItOnError(
  type: TryItOnError['type'],
  message: string,
  retryable: boolean = true,
  originalError?: Error
): TryItOnError {
  return {
    type,
    message,
    retryable,
    originalError
  };
}

/**
 * Status messages for user feedback
 */
export const TRYITON_STATUS_MESSAGES = {
  PROCESSING: 'Generating your try-on...',
  SUCCESS: 'Try-on generated successfully!',
  ERROR: 'Failed to generate try-on. Please try again.',
  MOCK_MODE: 'Using mock data for development'
} as const;

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * Most commonly used types - re-exported for convenience
 */
export type {
  TryItOnState as State,
  TryItOnConfig as Config,
  UseTryItOnReturn as Hook,
  TryItOnResult as Result,
  TryItOnError as Error
};