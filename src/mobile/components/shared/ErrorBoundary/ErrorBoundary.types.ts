/**
 * @fileoverview Shared ErrorBoundary Types - Unified type definitions for error handling
 * @module @/mobile/components/shared/ErrorBoundary/ErrorBoundary.types
 * @version 1.0.0
 */

import { ReactNode, ErrorInfo } from 'react';

/**
 * Error boundary props interface
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Fallback component to render on error */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details in development */
  showErrorDetails?: boolean;
  /** Custom error message override */
  errorMessage?: string;
  /** Test ID for testing */
  testId?: string;
  /** CSS class name */
  className?: string;
  /** View context for error categorization */
  viewType?: 'angle' | 'fit' | 'tryon' | 'generic';
  /** Enable animations */
  enableAnimations?: boolean;
  /** Custom retry button text */
  retryButtonText?: string;
  /** Custom reload button text */
  reloadButtonText?: string;
  /** Hide retry button */
  hideRetryButton?: boolean;
  /** Hide reload button */
  hideReloadButton?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Error boundary state interface
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** Additional error information */
  errorInfo: ErrorInfo | null;
  /** Error ID for tracking */
  errorId: string;
  /** Timestamp when error occurred */
  errorTimestamp: Date;
  /** Number of retry attempts */
  retryCount: number;
  /** Whether currently retrying */
  isRetrying: boolean;
}

/**
 * Error details interface for logging
 */
export interface ErrorDetails {
  message: string;
  stack: string;
  componentStack: string;
  timestamp: Date;
  errorId: string;
  userAgent: string;
  url: string;
  viewType?: string;
  retryCount: number;
  sessionId?: string;
}

/**
 * Error category types
 */
export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'upload'
  | 'navigation'
  | 'render'
  | 'permission'
  | 'timeout'
  | 'unknown';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced error interface
 */
export interface EnhancedError extends Error {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  userMessage?: string;
  technicalDetails?: Record<string, any>;
  retryable?: boolean;
  timestamp?: Date;
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  /** Enable error reporting */
  enabled: boolean;
  /** Maximum number of errors to store locally */
  maxStoredErrors: number;
  /** Whether to include user agent */
  includeUserAgent: boolean;
  /** Whether to include URL */
  includeUrl: boolean;
  /** Whether to include component stack */
  includeComponentStack: boolean;
  /** Custom metadata to include */
  customMetadata?: Record<string, any>;
}

/**
 * Error recovery strategies
 */
export type RecoveryStrategy =
  | 'retry'
  | 'reload'
  | 'navigate'
  | 'fallback'
  | 'ignore';

/**
 * Error recovery configuration
 */
export interface RecoveryConfig {
  /** Primary recovery strategy */
  strategy: RecoveryStrategy;
  /** Fallback strategies */
  fallbackStrategies?: RecoveryStrategy[];
  /** Delay before retry (ms) */
  retryDelay?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Navigation target for navigate strategy */
  navigationTarget?: string;
  /** Fallback component for fallback strategy */
  fallbackComponent?: ReactNode;
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /** Error reporting configuration */
  reporting?: ErrorReportingConfig;
  /** Error recovery configuration */
  recovery?: RecoveryConfig;
  /** UI customization */
  ui?: {
    /** Enable animations */
    animations?: boolean;
    /** Custom error icon */
    errorIcon?: ReactNode;
    /** Custom loading spinner */
    loadingSpinner?: ReactNode;
    /** Color theme */
    theme?: 'light' | 'dark' | 'auto';
  };
}

/**
 * Error boundary context interface
 */
export interface ErrorBoundaryContext {
  /** Report an error manually */
  reportError: (error: Error, metadata?: Record<string, any>) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Get current error state */
  getCurrentError: () => ErrorBoundaryState;
  /** Check if error boundary has errors */
  hasErrors: boolean;
  /** Get error count */
  errorCount: number;
}

/**
 * Error event types
 */
export type ErrorEventType =
  | 'error_occurred'
  | 'error_cleared'
  | 'retry_attempted'
  | 'recovery_successful'
  | 'recovery_failed'
  | 'max_retries_reached';

/**
 * Error event interface
 */
export interface ErrorEvent {
  type: ErrorEventType;
  error?: Error;
  errorId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Error boundary hook result
 */
export interface UseErrorBoundaryResult {
  /** Trigger error boundary */
  triggerError: (error: Error) => void;
  /** Clear current error */
  clearError: () => void;
  /** Current error state */
  error: Error | null;
  /** Whether there's an active error */
  hasError: boolean;
  /** Retry current operation */
  retry: () => void;
  /** Error count */
  errorCount: number;
}

/**
 * Export convenience types
 */
export type {
  ErrorBoundaryProps as SharedErrorBoundaryProps,
  ErrorBoundaryState as SharedErrorBoundaryState,
  ErrorDetails as SharedErrorDetails,
  ErrorBoundaryConfig as SharedErrorBoundaryConfig
};