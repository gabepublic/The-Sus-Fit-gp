/**
 * @fileoverview ErrorBoundary - React Error Boundary for graceful error handling
 * @module @/mobile/components/UploadAngle/components/ErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// ERROR BOUNDARY TYPES
// =============================================================================

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
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
}

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
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
}

/**
 * Error details interface for logging
 */
interface ErrorDetails {
  message: string;
  stack: string;
  componentStack: string;
  timestamp: Date;
  errorId: string;
  userAgent: string;
  url: string;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * ErrorBoundary Component - React Error Boundary with enhanced error handling
 * 
 * Features:
 * - Catches JavaScript errors in component tree
 * - Graceful fallback UI with recovery options
 * - Error logging and reporting capabilities
 * - Development vs production error display modes
 * - Retry functionality for transient errors
 * - Accessibility support with proper ARIA labels
 * - Animation support for smooth error transitions
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error('Upload component error:', error);
 *     // Send to error reporting service
 *   }}
 *   fallback={<CustomErrorFallback />}
 * >
 *   <UploadAngleContainer />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutRef: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      errorTimestamp: new Date()
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      errorTimestamp: new Date()
    };
  }

  /**
   * Lifecycle method called when error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Create detailed error information
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack || 'No stack trace available',
      componentStack: errorInfo.componentStack || 'No component stack available',
      timestamp: new Date(),
      errorId: this.state.errorId || `err_${Date.now()}`,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    // Log error details
    this.logError(errorDetails);

    // Call parent error handler
    this.props.onError?.(error, errorInfo);

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ErrorBoundary caught an error (${errorDetails.errorId})`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }
  }

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }
  }

  /**
   * Logs error details for monitoring and debugging
   */
  private logError(errorDetails: ErrorDetails): void {
    try {
      // In a real application, you would send this to your error reporting service
      // Examples: Sentry, LogRocket, Bugsnag, etc.
      
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        // Store recent errors in localStorage for debugging
        const recentErrors = JSON.parse(
          localStorage.getItem('uploadAngle_errors') || '[]'
        );
        
        recentErrors.push(errorDetails);
        
        // Keep only last 10 errors to avoid storage bloat
        if (recentErrors.length > 10) {
          recentErrors.shift();
        }
        
        localStorage.setItem('uploadAngle_errors', JSON.stringify(recentErrors));
      }

      // Example integration with error reporting service:
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     tags: {
      //       component: 'UploadAngle',
      //       errorId: errorDetails.errorId
      //     },
      //     extra: errorDetails
      //   });
      // }
    } catch (loggingError) {
      console.warn('Failed to log error details:', loggingError);
    }
  }

  /**
   * Handles retry attempt
   */
  private handleRetry = (): void => {
    // Clear any existing retry timeout
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }

    // Add a small delay to prevent rapid retry loops
    this.retryTimeoutRef = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        errorTimestamp: new Date()
      });
    }, 100);
  };

  /**
   * Handles page reload (last resort recovery)
   */
  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /**
   * Renders the error fallback UI
   */
  private renderErrorFallback(): ReactNode {
    const { error, errorInfo, errorId, errorTimestamp } = this.state;
    const { fallback, showErrorDetails = process.env.NODE_ENV === 'development', errorMessage } = this.props;

    // If custom fallback is provided, use it
    if (fallback) {
      return fallback;
    }

    // Default error fallback with retry functionality
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '32px',
          margin: '16px',
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
        role="alert"
        aria-live="assertive"
      >
        {/* Error Icon */}
        <motion.svg
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          style={{ marginBottom: '16px' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </motion.svg>

        {/* Error Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#dc2626',
          margin: '0 0 12px 0'
        }}>
          Something went wrong
        </h2>

        {/* Error Message */}
        <p style={{
          fontSize: '16px',
          color: '#7f1d1d',
          margin: '0 0 24px 0',
          lineHeight: 1.5
        }}>
          {errorMessage || 'An unexpected error occurred while uploading your image.'}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={this.handleRetry}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px'
            }}
            aria-label="Retry upload operation"
          >
            Try Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px'
            }}
            aria-label="Reload page"
          >
            Reload Page
          </motion.button>
        </div>

        {/* Error Details (Development Only) */}
        {showErrorDetails && error && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              marginTop: '24px',
              width: '100%',
              maxWidth: '500px',
              textAlign: 'left'
            }}
          >
            <summary style={{
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#7f1d1d',
              marginBottom: '8px'
            }}>
              Technical Details (ID: {errorId})
            </summary>
            
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#374151',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              <div><strong>Error:</strong> {error.message}</div>
              <div><strong>Time:</strong> {errorTimestamp.toISOString()}</div>
              {error.stack && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Stack:</strong>
                  <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </motion.details>
        )}

        {/* Screen Reader Instructions */}
        <div style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }}>
          Error occurred in upload component at {errorTimestamp.toLocaleString()}. 
          Use the Try Again button to retry the operation or Reload Page to start fresh.
        </div>
      </motion.div>
    );
  }

  /**
   * Render method
   */
  render(): ReactNode {
    const { hasError } = this.state;
    const { children, testId = 'error-boundary', className = '' } = this.props;

    if (hasError) {
      return (
        <div 
          className={`error-boundary ${className}`}
          data-testid={testId}
        >
          {this.renderErrorFallback()}
        </div>
      );
    }

    return children;
  }
}

// =============================================================================
// HIGHER ORDER COMPONENT WRAPPER
// =============================================================================

/**
 * HOC to wrap components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

// =============================================================================
// HOOKS FOR ERROR BOUNDARY INTEGRATION
// =============================================================================

/**
 * Hook to trigger error boundary from function components
 */
export function useErrorHandler() {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

/**
 * Hook for error recovery state
 */
export function useErrorRecovery() {
  const [errorCount, setErrorCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const reportError = React.useCallback((error: Error) => {
    setErrorCount(prev => prev + 1);
    setLastError(error);
    
    // Log error for monitoring
    console.error('Component error reported:', error);
  }, []);

  const clearError = React.useCallback(() => {
    setErrorCount(0);
    setLastError(null);
  }, []);

  return {
    errorCount,
    lastError,
    reportError,
    clearError,
    hasErrors: errorCount > 0
  };
}

export default ErrorBoundary;