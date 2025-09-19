'use client';

/**
 * @fileoverview Shared ErrorDisplay Component - User-friendly error messages with recovery actions
 * @module @/mobile/components/shared/Progress/ErrorDisplay
 * @version 1.0.0
 */

import React, { useCallback, useEffect } from 'react';
import { ErrorDisplayProps } from './Progress.types';

/**
 * ErrorDisplay Component - User-friendly error messages with recovery actions
 *
 * Features:
 * - Multiple severity levels with visual hierarchy
 * - Optional retry and dismiss functionality
 * - Accessible with ARIA roles and live regions
 * - Auto-dismissible with timer support
 * - Icon-based visual hierarchy
 * - Responsive design
 * - High contrast mode support
 * - Dark mode support
 * - Multiple display variants (banner, inline, toast, modal)
 *
 * @param props ErrorDisplayProps
 * @returns JSX.Element
 *
 * @example
 * ```tsx
 * // Basic error display
 * <ErrorDisplay
 *   error="Upload failed. Please try again."
 *   severity="high"
 *   onRetry={() => uploadFile()}
 * />
 *
 * // Auto-dismissing toast
 * <ErrorDisplay
 *   error="File too large"
 *   variant="toast"
 *   severity="medium"
 *   autoHideDelay={5000}
 *   onDismiss={() => clearError()}
 * />
 * ```
 */
export const ErrorDisplay = React.memo<ErrorDisplayProps>(function ErrorDisplay({
  error,
  severity = 'medium',
  variant = 'banner',
  dismissible = true,
  showRetry = true,
  retryText = 'Retry',
  dismissText = 'Dismiss',
  icon,
  onRetry,
  onDismiss,
  autoHideDelay,
  metadata,
  className = '',
  testId = 'error-display'
}) {
  // Early return if no error
  if (!error) return null;

  // Handle auto-hide functionality
  useEffect(() => {
    if (autoHideDelay && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, onDismiss]);

  // Handle retry action
  const handleRetry = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  // Handle dismiss action
  const handleDismiss = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent, action: 'retry' | 'dismiss') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (action === 'retry') {
        handleRetry(event);
      } else {
        handleDismiss(event);
      }
    }
  }, [handleRetry, handleDismiss]);

  // Get appropriate icon based on severity
  const getIcon = () => {
    if (icon) return icon;

    switch (severity) {
      case 'low':
        return (
          <svg
            className="error-display__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        );
      case 'medium':
        return (
          <svg
            className="error-display__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/>
            <path d="m12 17 .01 0"/>
          </svg>
        );
      case 'high':
      case 'critical':
      default:
        return (
          <svg
            className="error-display__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
    }
  };

  // Get severity label for screen readers
  const getSeverityLabel = () => {
    switch (severity) {
      case 'low':
        return 'Information';
      case 'medium':
        return 'Warning';
      case 'high':
        return 'Error';
      case 'critical':
        return 'Critical Error';
      default:
        return 'Error';
    }
  };

  // Format error message
  const getErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred';
  };

  // Build CSS classes
  const containerClasses = `
    error-display
    error-display--${severity}
    error-display--${variant}
    ${className}
  `.trim();

  // Determine ARIA attributes based on severity
  const ariaRole = severity === 'critical' || severity === 'high' ? 'alert' : 'status';
  const ariaLive = severity === 'critical' || severity === 'high' ? 'assertive' : 'polite';

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      data-severity={severity}
      data-variant={variant}
    >
      <div className="error-display__content">
        <div className="error-display__header">
          <div className="error-display__icon-container">
            {getIcon()}
          </div>

          <div className="error-display__message-container">
            <div className="error-display__severity" aria-hidden="true">
              {getSeverityLabel()}
            </div>
            <div className="error-display__message">
              {getErrorMessage()}
            </div>
            {metadata && process.env.NODE_ENV === 'development' && (
              <details className="error-display__metadata">
                <summary>Error Details</summary>
                <pre>{JSON.stringify(metadata, null, 2)}</pre>
              </details>
            )}
          </div>

          {dismissible && onDismiss && (
            <button
              type="button"
              className="error-display__dismiss-button"
              onClick={handleDismiss}
              onKeyDown={(e) => handleKeyDown(e, 'dismiss')}
              aria-label={dismissText}
              title={dismissText}
            >
              <svg
                className="error-display__dismiss-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {showRetry && onRetry && (
          <div className="error-display__actions">
            <button
              type="button"
              className="error-display__retry-button"
              onClick={handleRetry}
              onKeyDown={(e) => handleKeyDown(e, 'retry')}
              aria-label={`${retryText} the operation`}
            >
              <svg
                className="error-display__retry-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              <span>{retryText}</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .error-display {
          display: flex;
          width: 100%;
          border-radius: 8px;
          border: 1px solid;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Variant: Banner (default) */
        .error-display--banner {
          padding: 16px;
        }

        /* Variant: Inline */
        .error-display--inline {
          padding: 12px;
          border-radius: 6px;
        }

        /* Variant: Toast */
        .error-display--toast {
          padding: 12px 16px;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Variant: Modal */
        .error-display--modal {
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          max-width: 500px;
        }

        /* Severity: Low (Info) */
        .error-display--low {
          border-color: #bfdbfe;
          background-color: #eff6ff;
          color: #1e40af;
        }

        /* Severity: Medium (Warning) */
        .error-display--medium {
          border-color: #fed7aa;
          background-color: #fffbeb;
          color: #92400e;
        }

        /* Severity: High (Error) */
        .error-display--high {
          border-color: #fecaca;
          background-color: #fef2f2;
          color: #991b1b;
        }

        /* Severity: Critical */
        .error-display--critical {
          border-color: #fca5a5;
          background-color: #fee2e2;
          color: #7f1d1d;
          border-width: 2px;
        }

        .error-display__content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .error-display__header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-display__icon-container {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .error-display--low .error-display__icon-container {
          background-color: #dbeafe;
        }

        .error-display--medium .error-display__icon-container {
          background-color: #fef3c7;
        }

        .error-display--high .error-display__icon-container {
          background-color: #fee2e2;
        }

        .error-display--critical .error-display__icon-container {
          background-color: #fecaca;
        }

        .error-display__icon {
          width: 20px;
          height: 20px;
        }

        .error-display__message-container {
          flex: 1;
          min-width: 0;
        }

        .error-display__severity {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          opacity: 0.8;
        }

        .error-display__message {
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          font-weight: 500;
        }

        .error-display__metadata {
          margin-top: 8px;
          font-size: 12px;
        }

        .error-display__metadata summary {
          cursor: pointer;
          opacity: 0.7;
        }

        .error-display__metadata pre {
          margin-top: 4px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          font-size: 11px;
          overflow-x: auto;
        }

        .error-display__dismiss-button {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          background-color: transparent;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
          outline: none;
        }

        .error-display__dismiss-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .error-display__dismiss-button:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        .error-display__dismiss-icon {
          width: 16px;
          height: 16px;
        }

        .error-display__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 52px;
        }

        .error-display__retry-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid;
          border-radius: 6px;
          background-color: transparent;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          outline: none;
        }

        .error-display--low .error-display__retry-button {
          color: #1e40af;
          border-color: #bfdbfe;
        }

        .error-display--low .error-display__retry-button:hover {
          background-color: #dbeafe;
          border-color: #93c5fd;
        }

        .error-display--low .error-display__retry-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .error-display--medium .error-display__retry-button {
          color: #92400e;
          border-color: #fed7aa;
        }

        .error-display--medium .error-display__retry-button:hover {
          background-color: #fef3c7;
          border-color: #fbbf24;
        }

        .error-display--medium .error-display__retry-button:focus {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        .error-display--high .error-display__retry-button,
        .error-display--critical .error-display__retry-button {
          color: #991b1b;
          border-color: #fecaca;
        }

        .error-display--high .error-display__retry-button:hover,
        .error-display--critical .error-display__retry-button:hover {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        .error-display--high .error-display__retry-button:focus,
        .error-display--critical .error-display__retry-button:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        .error-display__retry-icon {
          width: 16px;
          height: 16px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .error-display--banner,
          .error-display--modal {
            padding: 12px;
          }

          .error-display__header {
            gap: 8px;
          }

          .error-display__icon-container {
            width: 32px;
            height: 32px;
          }

          .error-display__icon {
            width: 16px;
            height: 16px;
          }

          .error-display__message,
          .error-display__retry-button {
            font-size: 13px;
          }

          .error-display__retry-button {
            padding: 6px 10px;
          }

          .error-display__retry-icon {
            width: 14px;
            height: 14px;
          }

          .error-display__actions {
            margin-left: 40px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .error-display__retry-button,
          .error-display__dismiss-button {
            transition: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .error-display {
            border-width: 2px;
          }

          .error-display__retry-button {
            border-width: 2px;
          }

          .error-display--low {
            background-color: #fff;
            border-color: #3b82f6;
          }

          .error-display--medium {
            background-color: #fff;
            border-color: #f59e0b;
          }

          .error-display--high {
            background-color: #fff;
            border-color: #dc2626;
          }

          .error-display--critical {
            background-color: #fff;
            border-color: #7f1d1d;
            border-width: 3px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .error-display {
            background-color: #111827;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          .error-display--low {
            background-color: #1f2937;
            border-color: #3b82f6;
            color: #93c5fd;
          }

          .error-display--medium {
            background-color: #1f2937;
            border-color: #f59e0b;
            color: #fbbf24;
          }

          .error-display--high {
            background-color: #1f2937;
            border-color: #ef4444;
            color: #fca5a5;
          }

          .error-display--critical {
            background-color: #1f2937;
            border-color: #dc2626;
            color: #fecaca;
          }

          .error-display--low .error-display__icon-container,
          .error-display--medium .error-display__icon-container,
          .error-display--high .error-display__icon-container,
          .error-display--critical .error-display__icon-container {
            background-color: #374151;
          }

          .error-display__metadata pre {
            background: rgba(255, 255, 255, 0.05);
          }

          .error-display__dismiss-button:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';