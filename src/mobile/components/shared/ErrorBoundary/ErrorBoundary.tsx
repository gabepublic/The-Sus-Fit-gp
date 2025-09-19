/**
 * @fileoverview Shared ErrorBoundary - Enhanced React Error Boundary for graceful error handling
 * @module @/mobile/components/shared/ErrorBoundary/ErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorDetails,
  ErrorBoundaryConfig,
  EnhancedError,
  ErrorCategory
} from './ErrorBoundary.types';

/**
 * Default configuration for ErrorBoundary
 */
const DEFAULT_CONFIG: ErrorBoundaryConfig = {
  reporting: {
    enabled: true,
    maxStoredErrors: 10,
    includeUserAgent: true,
    includeUrl: true,
    includeComponentStack: true
  },
  recovery: {
    strategy: 'retry',
    fallbackStrategies: ['reload'],
    retryDelay: 1000,
    maxRetries: 3
  },
  ui: {
    animations: true,
    theme: 'auto'
  }
};

/**
 * SharedErrorBoundary Component - Enhanced React Error Boundary with comprehensive error handling
 *
 * Features:
 * - Catches JavaScript errors in component tree
 * - Graceful fallback UI with recovery options
 * - Error logging and reporting capabilities
 * - Development vs production error display modes
 * - Retry functionality with configurable limits
 * - Accessibility support with proper ARIA labels
 * - Animation support for smooth error transitions
 * - Enhanced error categorization and severity levels
 * - Local storage for error tracking
 * - Multiple recovery strategies
 * - Customizable UI themes
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   viewType="fit"
 *   onError={(error, errorInfo) => {
 *     console.error('Component error:', error);
 *     // Send to error reporting service
 *   }}
 *   maxRetries={3}
 *   enableAnimations={true}
 * >
 *   <UploadFitContainer />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutRef: NodeJS.Timeout | null = null;
  private config: ErrorBoundaryConfig;
  private sessionId: string;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    // Merge props with default config
    this.config = {
      ...DEFAULT_CONFIG,
      recovery: {
        ...DEFAULT_CONFIG.recovery,
        strategy: DEFAULT_CONFIG.recovery?.strategy || 'retry',
        maxRetries: props.maxRetries || DEFAULT_CONFIG.recovery?.maxRetries || 3
      }
    };

    // Generate session ID for error tracking
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      errorTimestamp: new Date(),
      retryCount: 0,
      isRetrying: false
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
      errorTimestamp: new Date(),
      isRetrying: false
    };
  }

  /**
   * Lifecycle method called when error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Enhance error with additional metadata
    const enhancedError = this.enhanceError(error);

    // Create detailed error information
    const errorDetails: ErrorDetails = {
      message: enhancedError.message,
      stack: enhancedError.stack || 'No stack trace available',
      componentStack: errorInfo.componentStack || 'No component stack available',
      timestamp: new Date(),
      errorId: this.state.errorId || `err_${Date.now()}`,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      viewType: this.props.viewType,
      retryCount: this.state.retryCount,
      sessionId: this.sessionId
    };

    // Log error details
    this.logError(errorDetails);

    // Call parent error handler
    this.props.onError?.(enhancedError, errorInfo);

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ErrorBoundary caught an error (${errorDetails.errorId})`);
      console.error('Error:', enhancedError);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // Auto-retry if configured and under retry limit
    this.scheduleAutoRetry();
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
   * Enhance error with additional metadata
   */
  private enhanceError(error: Error): EnhancedError {
    const enhancedError = error as EnhancedError;

    // Add error categorization
    enhancedError.category = this.categorizeError(error);
    enhancedError.severity = this.determineSeverity(error);
    enhancedError.retryable = this.isRetryable(error);
    enhancedError.timestamp = new Date();

    // Add user-friendly message
    enhancedError.userMessage = this.getUserMessage(error);

    return enhancedError;
  }

  /**
   * Categorize error based on error message and stack
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (stack.includes('upload') || message.includes('upload')) {
      return 'upload';
    }
    if (stack.includes('navigate') || message.includes('navigate')) {
      return 'navigation';
    }
    if (message.includes('validation')) {
      return 'validation';
    }
    if (stack.includes('render')) {
      return 'render';
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): EnhancedError['severity'] {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    if (message.includes('network') || message.includes('permission')) {
      return 'high';
    }
    if (message.includes('validation') || message.includes('upload')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Non-retryable errors
    if (message.includes('permission') || message.includes('unauthorized')) {
      return false;
    }

    // Retryable errors
    if (message.includes('network') || message.includes('timeout') || message.includes('upload')) {
      return true;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Get user-friendly error message
   */
  private getUserMessage(error: Error): string {
    const enhancedError = error as EnhancedError;

    switch (enhancedError.category) {
      case 'network':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'upload':
        return 'Upload failed. Please try uploading your image again.';
      case 'permission':
        return 'Permission denied. Please check your browser settings.';
      case 'timeout':
        return 'Request timed out. Please try again.';
      case 'validation':
        return 'Invalid data. Please check your input and try again.';
      default:
        return this.props.errorMessage || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Logs error details for monitoring and debugging
   */
  private logError(errorDetails: ErrorDetails): void {
    try {
      if (!this.config.reporting?.enabled) return;

      // Store in localStorage for debugging
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const storageKey = `errorBoundary_errors_${this.props.viewType || 'generic'}`;
        const recentErrors = JSON.parse(localStorage.getItem(storageKey) || '[]');

        recentErrors.push(errorDetails);

        // Keep only max configured errors
        const maxErrors = this.config.reporting?.maxStoredErrors || 10;
        if (recentErrors.length > maxErrors) {
          recentErrors.splice(0, recentErrors.length - maxErrors);
        }

        localStorage.setItem(storageKey, JSON.stringify(recentErrors));
      }

      // Integration point for external error reporting services
      // Example integrations:
      // - Sentry: Sentry.captureException(error, { extra: errorDetails })
      // - LogRocket: LogRocket.captureException(error)
      // - Bugsnag: Bugsnag.notify(error, { metaData: errorDetails })

    } catch (loggingError) {
      console.warn('Failed to log error details:', loggingError);
    }
  }

  /**
   * Schedule automatic retry if configured
   */
  private scheduleAutoRetry(): void {
    const maxRetries = this.config.recovery?.maxRetries || 3;
    const error = this.state.error as EnhancedError;

    if (
      this.state.retryCount < maxRetries &&
      error?.retryable !== false &&
      this.config.recovery?.strategy === 'retry'
    ) {
      const delay = this.config.recovery?.retryDelay || 1000;

      this.retryTimeoutRef = setTimeout(() => {
        this.handleRetry();
      }, delay * (this.state.retryCount + 1)); // Exponential backoff
    }
  }

  /**
   * Handles retry attempt
   */
  private handleRetry = (): void => {
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }

    const maxRetries = this.config.recovery?.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      isRetrying: true
    }));

    // Add a small delay to prevent rapid retry loops
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        errorTimestamp: new Date(),
        isRetrying: false
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
    const { error, errorInfo, errorId, errorTimestamp, retryCount, isRetrying } = this.state;
    const {
      fallback,
      showErrorDetails = process.env.NODE_ENV === 'development',
      retryButtonText = 'Try Again',
      reloadButtonText = 'Reload Page',
      hideRetryButton = false,
      hideReloadButton = false,
      enableAnimations = true
    } = this.props;

    const maxRetries = this.config.recovery?.maxRetries || 3;
    const canRetry = retryCount < maxRetries && !hideRetryButton;
    const enhancedError = error as EnhancedError;

    // If custom fallback is provided, use it
    if (fallback) {
      return fallback;
    }

    // Animation wrapper
    const AnimationWrapper = enableAnimations ? motion.div : 'div';
    const animationProps = enableAnimations ? {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
    } : {};

    return (
      <AnimationWrapper
        {...animationProps}
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
          initial={enableAnimations ? { scale: 0 } : {}}
          animate={enableAnimations ? { scale: 1 } : {}}
          transition={enableAnimations ? { delay: 0.1, type: 'spring', stiffness: 200 } : {}}
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
          {enhancedError?.userMessage || this.getUserMessage(error || new Error('Unknown error'))}
        </p>

        {/* Retry Information */}
        {retryCount > 0 && (
          <p style={{
            fontSize: '14px',
            color: '#92400e',
            margin: '0 0 16px 0'
          }}>
            Attempt {retryCount} of {maxRetries}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {canRetry && (
            <motion.button
              whileHover={enableAnimations ? { scale: 1.05 } : {}}
              whileTap={enableAnimations ? { scale: 0.95 } : {}}
              onClick={this.handleRetry}
              disabled={isRetrying}
              style={{
                padding: '12px 24px',
                background: isRetrying ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                opacity: isRetrying ? 0.6 : 1
              }}
              aria-label={isRetrying ? 'Retrying...' : `${retryButtonText} (${maxRetries - retryCount} attempts remaining)`}
            >
              {isRetrying ? 'Retrying...' : retryButtonText}
            </motion.button>
          )}

          {!hideReloadButton && (
            <motion.button
              whileHover={enableAnimations ? { scale: 1.05 } : {}}
              whileTap={enableAnimations ? { scale: 0.95 } : {}}
              onClick={this.handleReload}
              disabled={isRetrying}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                minWidth: '44px',
                minHeight: '44px',
                opacity: isRetrying ? 0.6 : 1
              }}
              aria-label="Reload page"
            >
              {reloadButtonText}
            </motion.button>
          )}
        </div>

        {/* Error Details (Development Only) */}
        {showErrorDetails && error && (
          <motion.details
            initial={enableAnimations ? { opacity: 0 } : {}}
            animate={enableAnimations ? { opacity: 1 } : {}}
            transition={enableAnimations ? { delay: 0.3 } : {}}
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
              <div><strong>Category:</strong> {enhancedError?.category || 'unknown'}</div>
              <div><strong>Severity:</strong> {enhancedError?.severity || 'unknown'}</div>
              <div><strong>Retryable:</strong> {enhancedError?.retryable ? 'Yes' : 'No'}</div>
              <div><strong>Time:</strong> {errorTimestamp.toISOString()}</div>
              <div><strong>View:</strong> {this.props.viewType || 'generic'}</div>
              <div><strong>Session:</strong> {this.sessionId}</div>
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
          Error occurred in {this.props.viewType || 'application'} at {errorTimestamp.toLocaleString()}.
          {canRetry && ` ${maxRetries - retryCount} retry attempts remaining.`}
          Use the Try Again button to retry the operation or Reload Page to start fresh.
        </div>
      </AnimationWrapper>
    );
  }

  /**
   * Render method
   */
  render(): ReactNode {
    const { hasError } = this.state;
    const { children, testId = 'shared-error-boundary', className = '' } = this.props;

    if (hasError) {
      return (
        <div
          className={`error-boundary ${className}`}
          data-testid={testId}
          data-view-type={this.props.viewType}
        >
          {this.renderErrorFallback()}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;