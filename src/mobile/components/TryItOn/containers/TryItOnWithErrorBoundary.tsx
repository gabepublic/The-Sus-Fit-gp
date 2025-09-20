/**
 * @fileoverview TryItOnWithErrorBoundary - Complete try-on workflow with error boundary
 * @module @/mobile/components/TryItOn/containers/TryItOnWithErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { TryItOnContainer } from './TryItOnContainer';
import { ErrorBoundary } from '@/mobile/components/shared';
import type { TryItOnWithErrorBoundaryProps } from '../types';

// =============================================================================
// LOADING FALLBACK COMPONENT
// =============================================================================

/**
 * Loading fallback component for Suspense
 */
const LoadingFallback = React.memo(function LoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '32px',
        gap: '16px'
      }}
      role="status"
      aria-label="Loading try-on interface"
    >
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #ff69b4',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      <div style={{
        fontSize: '16px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        Loading try-on interface...
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
});

// =============================================================================
// ERROR FALLBACK COMPONENT
// =============================================================================

/**
 * Custom error fallback specifically for try-on workflow
 */
const TryItOnErrorFallback = React.memo(function TryItOnErrorFallback({
  error,
  resetErrorBoundary
}: {
  error?: Error;
  resetErrorBoundary?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '32px',
        margin: '16px',
        background: '#fef2f2',
        border: '3px solid #000000',
        borderRadius: '0',
        boxShadow: '4px 4px 0px rgba(59, 130, 246, 0.5)',
        textAlign: 'center',
        maxWidth: '500px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
      role="alert"
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
        strokeWidth="3"
        style={{ marginBottom: '16px' }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </motion.svg>

      <h2 style={{
        fontSize: '24px',
        fontWeight: 800,
        color: '#000000',
        margin: '0 0 12px 0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Try-On System Error
      </h2>

      <p style={{
        fontSize: '16px',
        color: '#374151',
        margin: '0 0 24px 0',
        lineHeight: 1.5,
        fontWeight: 500
      }}>
        The virtual try-on system encountered an unexpected error.
        {process.env.NODE_ENV === 'development' && error && (
          <span style={{ display: 'block', marginTop: '8px', fontSize: '14px', color: '#7f1d1d' }}>
            {error.message}
          </span>
        )}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Retry Button */}
        {resetErrorBoundary && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetErrorBoundary}
            style={{
              padding: '12px 24px',
              background: '#ff69b4',
              color: '#000000',
              border: '3px solid #000000',
              borderRadius: '0',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              boxShadow: '2px 2px 0px #000000'
            }}
            aria-label="Retry try-on system"
          >
            Try Again
          </motion.button>
        )}

        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            color: '#000000',
            border: '3px solid #000000',
            borderRadius: '0',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            minWidth: '44px',
            minHeight: '44px',
            boxShadow: '2px 2px 0px #000000'
          }}
          aria-label="Refresh page to reload try-on system"
        >
          Refresh Page
        </motion.button>
      </div>
    </motion.div>
  );
});

// =============================================================================
// MAIN WRAPPER COMPONENT
// =============================================================================

/**
 * TryItOnWithErrorBoundary - Complete try-on workflow with comprehensive error handling
 *
 * This component wraps the TryItOnContainer with:
 * - React Error Boundary for catching component errors
 * - Suspense boundary for code splitting and loading states
 * - Custom loading and error fallbacks
 * - Enhanced error reporting and recovery
 * - Brutalist design system consistency
 *
 * @param props TryItOnWithErrorBoundaryProps
 * @returns JSX.Element
 */
export const TryItOnWithErrorBoundary = React.memo<TryItOnWithErrorBoundaryProps>(
  function TryItOnWithErrorBoundary({
    children,
    ErrorFallback,
    LoadingFallback: CustomLoadingFallback,
    onError,
    className = '',
    testId = 'tryiton-error-boundary',
    style,
    disabled = false
  }) {

    // Handle error boundary errors
    const handleErrorBoundaryError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
      // Log error for debugging
      console.error('Try-on system error boundary triggered:', error);
      console.error('Component stack:', errorInfo.componentStack);

      // Call parent error handler
      onError?.(error, errorInfo);

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry, LogRocket, Bugsnag, etc.
        // errorReportingService.captureException(error, {
        //   tags: { component: 'TryItOn', boundary: 'system' },
        //   extra: { componentStack: errorInfo.componentStack }
        // });
      }
    }, [onError]);

    // Custom error fallback component
    const ErrorFallbackComponent = React.useCallback(({ error, resetErrorBoundary }: any) => {
      return ErrorFallback ? (
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      ) : (
        <TryItOnErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      );
    }, [ErrorFallback]);

    // Custom loading fallback
    const loadingFallback = CustomLoadingFallback ? <CustomLoadingFallback /> : <LoadingFallback />;

    return (
      <div
        className={`tryiton-error-boundary ${className}`}
        data-testid={testId}
        style={style}
      >
        <ErrorBoundary
          fallback={ErrorFallbackComponent}
          onError={handleErrorBoundaryError}
          showErrorDetails={process.env.NODE_ENV === 'development'}
          testId={`${testId}-boundary`}
        >
          <Suspense fallback={loadingFallback}>
            {children || (
              <TryItOnContainer
                disabled={disabled}
                testId={`${testId}-container`}
              />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* System status for screen readers */}
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          Try-on system ready
        </div>
      </div>
    );
  }
);

TryItOnWithErrorBoundary.displayName = 'TryItOnWithErrorBoundary';

export default TryItOnWithErrorBoundary;