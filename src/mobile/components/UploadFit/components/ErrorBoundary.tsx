/**
 * @fileoverview ErrorBoundary - React Error Boundary for graceful error handling in UploadFit
 * @module @/mobile/components/UploadFit/components/ErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

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
 * ErrorBoundary Component - Catches JavaScript errors in Upload Fit components
 * 
 * Features:
 * - Graceful error handling with fallback UI
 * - Error reporting and logging
 * - Recovery mechanism with retry functionality
 * - Accessibility compliant error display
 * - Development mode error details
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
   * Static method to update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      errorTimestamp: new Date()
    };
  }

  /**
   * Handle component error and invoke callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Call error callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('UploadFit ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  /**
   * Reset error boundary state
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      errorTimestamp: new Date()
    });
  };

  /**
   * Render fallback UI or children
   */
  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          className={`error-boundary ${this.props.className || ''}`}
          data-testid={this.props.testId || 'error-boundary'}
          role="alert"
          aria-live="assertive"
        >
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="error-boundary__message">
              <h3>Something went wrong</h3>
              <p>
                {this.props.errorMessage || 
                 'An error occurred while uploading your fit image. Please try again.'}
              </p>
            </div>

            <div className="error-boundary__actions">
              <button
                type="button"
                className="error-boundary__retry-button"
                onClick={this.resetError}
                aria-label="Try again"
              >
                Try Again
              </button>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.props.showErrorDetails && (
              <details className="error-boundary__details">
                <summary>Error Details (Development)</summary>
                <div className="error-boundary__error-info">
                  <p><strong>Error:</strong> {this.state.error?.message}</p>
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p><strong>Timestamp:</strong> {this.state.errorTimestamp.toISOString()}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="error-boundary__stack">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              padding: 24px;
              background-color: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 12px;
              color: #991b1b;
            }

            .error-boundary__content {
              text-align: center;
              max-width: 400px;
            }

            .error-boundary__icon {
              width: 48px;
              height: 48px;
              margin: 0 auto 16px;
              color: #dc2626;
            }

            .error-boundary__message h3 {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 8px 0;
              color: #991b1b;
            }

            .error-boundary__message p {
              font-size: 14px;
              line-height: 1.5;
              margin: 0 0 24px 0;
              color: #7f1d1d;
            }

            .error-boundary__actions {
              margin-bottom: 16px;
            }

            .error-boundary__retry-button {
              background-color: #dc2626;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s ease;
            }

            .error-boundary__retry-button:hover {
              background-color: #b91c1c;
            }

            .error-boundary__retry-button:focus {
              outline: 2px solid #dc2626;
              outline-offset: 2px;
            }

            .error-boundary__details {
              text-align: left;
              margin-top: 16px;
              padding: 16px;
              background-color: #fff5f5;
              border: 1px solid #f87171;
              border-radius: 8px;
            }

            .error-boundary__details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 12px;
            }

            .error-boundary__error-info {
              font-size: 12px;
              line-height: 1.4;
            }

            .error-boundary__error-info p {
              margin: 8px 0;
            }

            .error-boundary__stack {
              background-color: #f3f4f6;
              padding: 8px;
              border-radius: 4px;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 11px;
              white-space: pre-wrap;
              word-break: break-all;
              max-height: 200px;
              overflow-y: auto;
            }

            /* Dark mode */
            @media (prefers-color-scheme: dark) {
              .error-boundary {
                background-color: #7f1d1d;
                border-color: #991b1b;
                color: #fecaca;
              }

              .error-boundary__message h3 {
                color: #fecaca;
              }

              .error-boundary__message p {
                color: #f87171;
              }

              .error-boundary__details {
                background-color: #991b1b;
                border-color: #dc2626;
              }

              .error-boundary__stack {
                background-color: #374151;
                color: #f3f4f6;
              }
            }

            /* High contrast mode */
            @media (prefers-contrast: high) {
              .error-boundary {
                border-width: 2px;
              }

              .error-boundary__retry-button {
                border: 2px solid currentColor;
              }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
              .error-boundary__retry-button {
                transition: none;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;