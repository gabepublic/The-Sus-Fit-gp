/**
 * @fileoverview ErrorDisplay - Error display component for UploadFit
 * @module @/mobile/components/UploadFit/components/ErrorDisplay
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { ErrorDisplayProps } from '../types';

/**
 * ErrorDisplay Component - Shows user-friendly error messages
 * 
 * Features:
 * - Accessible error display with proper ARIA attributes
 * - Different error types (validation, network, server)
 * - Retry functionality
 * - Dismissible errors
 * - Responsive design
 * - Screen reader support
 * - Animation support
 */
export const ErrorDisplay = React.memo<ErrorDisplayProps>(function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  type = 'error',
  showRetry = true,
  showDismiss = true,
  className = '',
  testId = 'error-display'
}) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg 
            className="error-display__icon error-display__icon--warning"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'info':
        return (
          <svg 
            className="error-display__icon error-display__icon--info"
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
      default:
        return (
          <svg 
            className="error-display__icon error-display__icon--error"
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

  const getTypeClasses = () => {
    switch (type) {
      case 'warning':
        return 'error-display--warning';
      case 'info':
        return 'error-display--info';
      default:
        return 'error-display--error';
    }
  };

  const containerClasses = `
    error-display
    ${getTypeClasses()}
    ${className}
  `.trim();

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="error-display__content">
        <div className="error-display__header">
          {getErrorIcon()}
          
          <div className="error-display__message">
            <span className="error-display__text">
              {typeof error === 'string' ? error : error.message || 'An error occurred'}
            </span>
          </div>

          {showDismiss && onDismiss && (
            <button
              type="button"
              className="error-display__dismiss"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              <svg 
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
              onClick={onRetry}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .error-display {
          border-radius: 8px;
          padding: 16px;
          margin: 8px 0;
          border: 1px solid;
          font-size: 14px;
          line-height: 1.5;
        }

        .error-display--error {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .error-display--warning {
          background-color: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }

        .error-display--info {
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
        }

        .error-display__content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .error-display__header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-display__icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          margin-top: 2px;
        }

        .error-display__icon--error {
          color: #dc2626;
        }

        .error-display__icon--warning {
          color: #d97706;
        }

        .error-display__icon--info {
          color: #2563eb;
        }

        .error-display__message {
          flex: 1;
          min-width: 0;
        }

        .error-display__text {
          word-break: break-word;
          display: block;
        }

        .error-display__dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          width: 20px;
          height: 20px;
          color: inherit;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .error-display__dismiss:hover {
          opacity: 1;
        }

        .error-display__dismiss:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          border-radius: 2px;
        }

        .error-display__dismiss svg {
          width: 100%;
          height: 100%;
        }

        .error-display__actions {
          display: flex;
          justify-content: flex-start;
          padding-left: 32px;
        }

        .error-display__retry-button {
          background-color: transparent;
          border: 1px solid currentColor;
          color: inherit;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-display__retry-button:hover {
          background-color: currentColor;
          color: white;
        }

        .error-display--error .error-display__retry-button:hover {
          background-color: #dc2626;
          color: white;
        }

        .error-display--warning .error-display__retry-button:hover {
          background-color: #d97706;
          color: white;
        }

        .error-display--info .error-display__retry-button:hover {
          background-color: #2563eb;
          color: white;
        }

        .error-display__retry-button:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .error-display {
            padding: 14px;
            font-size: 13px;
          }

          .error-display__header {
            gap: 10px;
          }

          .error-display__icon {
            width: 18px;
            height: 18px;
          }

          .error-display__dismiss {
            width: 18px;
            height: 18px;
          }

          .error-display__actions {
            padding-left: 28px;
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
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .error-display--error {
            background-color: #7f1d1d;
            border-color: #991b1b;
            color: #fecaca;
          }

          .error-display--warning {
            background-color: #78350f;
            border-color: #92400e;
            color: #fde68a;
          }

          .error-display--info {
            background-color: #1e3a8a;
            border-color: #1e40af;
            color: #bfdbfe;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .error-display__dismiss,
          .error-display__retry-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';