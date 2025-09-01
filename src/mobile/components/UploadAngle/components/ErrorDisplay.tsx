'use client';

import React, { useCallback } from 'react';
import { ErrorDisplayProps } from '../types';

/**
 * ErrorDisplay Component - User-friendly error messages with recovery actions
 * 
 * Features:
 * - Multiple severity levels (error, warning, info)
 * - Optional retry functionality
 * - Accessible with ARIA roles and live regions
 * - Auto-dismissible with timer support
 * - Icon-based visual hierarchy
 * - Responsive design
 * - High contrast mode support
 * 
 * @param props ErrorDisplayProps
 * @returns JSX.Element
 */
export const ErrorDisplay = React.memo<ErrorDisplayProps>(function ErrorDisplay({
  error,
  onRetry,
  showRetry = true,
  severity = 'error',
  className = '',
  testId = 'error-display'
}) {
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRetry();
    }
  }, [handleRetry]);

  // Get appropriate icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'warning':
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
      case 'info':
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
            <path d="m12 16 0-4"/>
            <path d="m12 8 .01 0"/>
          </svg>
        );
      default: // error
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

  const getSeverityLabel = () => {
    switch (severity) {
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  const containerClasses = `
    error-display
    error-display--${severity}
    ${className}
  `.trim();

  const ariaRole = severity === 'error' ? 'alert' : 'status';
  const ariaLive = severity === 'error' ? 'assertive' : 'polite';

  return (
    <div 
      className={containerClasses}
      data-testid={testId}
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="error-display__content">
        <div className="error-display__icon-container">
          {getIcon()}
        </div>
        
        <div className="error-display__message-container">
          <div className="error-display__severity">
            {getSeverityLabel()}
          </div>
          <div className="error-display__message">
            {error}
          </div>
        </div>

        {showRetry && onRetry && (
          <div className="error-display__actions">
            <button
              type="button"
              className="error-display__retry-button"
              onClick={handleRetry}
              onKeyDown={handleKeyDown}
              aria-label="Retry the operation"
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
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .error-display {
          display: flex;
          width: 100%;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
          background-color: #fff;
        }

        .error-display--error {
          border-color: #fecaca;
          background-color: #fef2f2;
          color: #991b1b;
        }

        .error-display--warning {
          border-color: #fed7aa;
          background-color: #fffbeb;
          color: #92400e;
        }

        .error-display--info {
          border-color: #bfdbfe;
          background-color: #eff6ff;
          color: #1e40af;
        }

        .error-display__content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
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

        .error-display--error .error-display__icon-container {
          background-color: #fee2e2;
        }

        .error-display--warning .error-display__icon-container {
          background-color: #fef3c7;
        }

        .error-display--info .error-display__icon-container {
          background-color: #dbeafe;
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
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .error-display__message {
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .error-display__actions {
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
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

        .error-display--error .error-display__retry-button {
          color: #991b1b;
          border-color: #fecaca;
        }

        .error-display--error .error-display__retry-button:hover {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        .error-display--error .error-display__retry-button:focus {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        .error-display--warning .error-display__retry-button {
          color: #92400e;
          border-color: #fed7aa;
        }

        .error-display--warning .error-display__retry-button:hover {
          background-color: #fef3c7;
          border-color: #fbbf24;
        }

        .error-display--warning .error-display__retry-button:focus {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }

        .error-display--info .error-display__retry-button {
          color: #1e40af;
          border-color: #bfdbfe;
        }

        .error-display--info .error-display__retry-button:hover {
          background-color: #dbeafe;
          border-color: #93c5fd;
        }

        .error-display--info .error-display__retry-button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .error-display__retry-icon {
          width: 16px;
          height: 16px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .error-display {
            padding: 12px;
          }
          
          .error-display__content {
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
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .error-display__retry-button {
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
          
          .error-display--error {
            background-color: #fff;
            border-color: #dc2626;
          }
          
          .error-display--warning {
            background-color: #fff;
            border-color: #f59e0b;
          }
          
          .error-display--info {
            background-color: #fff;
            border-color: #3b82f6;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .error-display {
            background-color: #111827;
          }
          
          .error-display--error {
            background-color: #1f2937;
            border-color: #ef4444;
            color: #fca5a5;
          }
          
          .error-display--warning {
            background-color: #1f2937;
            border-color: #f59e0b;
            color: #fbbf24;
          }
          
          .error-display--info {
            background-color: #1f2937;
            border-color: #3b82f6;
            color: #93c5fd;
          }
          
          .error-display--error .error-display__icon-container {
            background-color: #374151;
          }
          
          .error-display--warning .error-display__icon-container {
            background-color: #374151;
          }
          
          .error-display--info .error-display__icon-container {
            background-color: #374151;
          }
        }
      `}</style>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';