/**
 * @fileoverview useErrorBoundary Hook - Hook for triggering error boundaries from function components
 * @module @/mobile/components/shared/ErrorBoundary/useErrorBoundary
 * @version 1.0.0
 */

import React, { useCallback, useState, useEffect } from 'react';
import { UseErrorBoundaryResult, ErrorEvent, ErrorEventType } from './ErrorBoundary.types';

/**
 * Hook to trigger error boundary from function components
 *
 * This hook provides utilities for function components to interact with
 * error boundaries, including triggering errors, clearing errors, and
 * tracking error state.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { triggerError, clearError, hasError, retry } = useErrorBoundary();
 *
 *   const handleUpload = async (file: File) => {
 *     try {
 *       await uploadFile(file);
 *     } catch (error) {
 *       triggerError(error);
 *     }
 *   };
 *
 *   if (hasError) {
 *     return <div>Error occurred! <button onClick={retry}>Retry</button></div>;
 *   }
 *
 *   return <button onClick={handleUpload}>Upload</button>;
 * }
 * ```
 */
export function useErrorBoundary(): UseErrorBoundaryResult {
  const [error, setError] = useState<Error | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [events, setEvents] = useState<ErrorEvent[]>([]);

  // Function to trigger error boundary
  const triggerError = useCallback((newError: Error) => {
    const errorEvent: ErrorEvent = {
      type: 'error_occurred',
      error: newError,
      errorId: `hook_err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      metadata: {
        source: 'useErrorBoundary',
        errorCount: errorCount + 1
      }
    };

    setError(newError);
    setErrorCount(prev => prev + 1);
    setEvents(prev => [...prev, errorEvent]);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('useErrorBoundary: Error triggered:', newError);
    }

    // Use React's error boundary mechanism
    const [, setState] = React.useState();
    setState(() => {
      throw newError;
    });
  }, [errorCount]);

  // Function to clear current error
  const clearError = useCallback(() => {
    const clearEvent: ErrorEvent = {
      type: 'error_cleared',
      timestamp: new Date(),
      metadata: {
        source: 'useErrorBoundary',
        previousError: error?.message
      }
    };

    setError(null);
    setEvents(prev => [...prev, clearEvent]);

    if (process.env.NODE_ENV === 'development') {
      console.log('useErrorBoundary: Error cleared');
    }
  }, [error]);

  // Function to retry current operation
  const retry = useCallback(() => {
    const retryEvent: ErrorEvent = {
      type: 'retry_attempted',
      timestamp: new Date(),
      metadata: {
        source: 'useErrorBoundary',
        retryCount: errorCount
      }
    };

    setEvents(prev => [...prev, retryEvent]);
    clearError();

    if (process.env.NODE_ENV === 'development') {
      console.log('useErrorBoundary: Retry attempted');
    }
  }, [clearError, errorCount]);

  // Clean up old events to prevent memory leaks
  useEffect(() => {
    const maxEvents = 50;
    if (events.length > maxEvents) {
      setEvents(prev => prev.slice(-maxEvents));
    }
  }, [events.length]);

  return {
    triggerError,
    clearError,
    error,
    hasError: error !== null,
    retry,
    errorCount
  };
}

/**
 * Hook for error recovery state management
 *
 * This hook provides advanced error recovery capabilities including
 * automatic retry logic, error categorization, and recovery strategies.
 *
 * @param maxRetries Maximum number of automatic retries
 * @param retryDelay Delay between retries in milliseconds
 */
export function useErrorRecovery(maxRetries: number = 3, retryDelay: number = 1000) {
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const reportError = useCallback((error: Error) => {
    setErrorCount(prev => prev + 1);
    setLastError(error);

    // Log error for monitoring
    console.error('useErrorRecovery: Error reported:', error);

    const errorEvent: ErrorEvent = {
      type: 'error_occurred',
      error,
      timestamp: new Date(),
      metadata: {
        source: 'useErrorRecovery',
        totalErrors: errorCount + 1
      }
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Error event:', errorEvent);
    }
  }, [errorCount]);

  const attemptRecovery = useCallback(async (recoveryFn?: () => Promise<void> | void) => {
    if (retryAttempts >= maxRetries) {
      const maxRetriesEvent: ErrorEvent = {
        type: 'max_retries_reached',
        timestamp: new Date(),
        metadata: {
          source: 'useErrorRecovery',
          maxRetries,
          totalAttempts: retryAttempts
        }
      };

      console.warn('useErrorRecovery: Maximum retries reached', maxRetriesEvent);
      return false;
    }

    setIsRecovering(true);
    setRetryAttempts(prev => prev + 1);

    try {
      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryAttempts));

      // Execute recovery function if provided
      if (recoveryFn) {
        await recoveryFn();
      }

      // Recovery successful
      const successEvent: ErrorEvent = {
        type: 'recovery_successful',
        timestamp: new Date(),
        metadata: {
          source: 'useErrorRecovery',
          attempts: retryAttempts
        }
      };

      setLastError(null);
      setRetryAttempts(0);
      setIsRecovering(false);

      if (process.env.NODE_ENV === 'development') {
        console.log('useErrorRecovery: Recovery successful', successEvent);
      }

      return true;
    } catch (recoveryError) {
      const failureEvent: ErrorEvent = {
        type: 'recovery_failed',
        error: recoveryError instanceof Error ? recoveryError : new Error('Recovery failed'),
        timestamp: new Date(),
        metadata: {
          source: 'useErrorRecovery',
          attempts: retryAttempts,
          originalError: lastError?.message
        }
      };

      console.error('useErrorRecovery: Recovery failed', failureEvent);

      setIsRecovering(false);
      return false;
    }
  }, [retryAttempts, maxRetries, retryDelay, lastError]);

  const clearError = useCallback(() => {
    setErrorCount(0);
    setLastError(null);
    setRetryAttempts(0);
    setIsRecovering(false);
  }, []);

  return {
    errorCount,
    lastError,
    isRecovering,
    retryAttempts,
    maxRetries,
    reportError,
    attemptRecovery,
    clearError,
    hasErrors: errorCount > 0,
    canRetry: retryAttempts < maxRetries
  };
}

/**
 * Hook for error boundary context
 *
 * This hook provides access to the nearest error boundary context,
 * allowing components to interact with the error boundary.
 */
export function useErrorBoundaryContext() {
  // This would be implemented with React Context in a full implementation
  // For now, we'll provide a basic implementation

  const { triggerError, clearError, error, hasError, errorCount } = useErrorBoundary();

  const reportError = useCallback((error: Error, metadata?: Record<string, any>) => {
    // Enhance error with metadata
    if (metadata) {
      (error as any).metadata = metadata;
    }
    triggerError(error);
  }, [triggerError]);

  const getCurrentError = useCallback(() => {
    return {
      hasError,
      error,
      errorInfo: null,
      errorId: error ? `ctx_${Date.now()}` : '',
      errorTimestamp: new Date(),
      retryCount: 0,
      isRetrying: false
    };
  }, [hasError, error]);

  return {
    reportError,
    clearError,
    getCurrentError,
    hasErrors: hasError,
    errorCount
  };
}