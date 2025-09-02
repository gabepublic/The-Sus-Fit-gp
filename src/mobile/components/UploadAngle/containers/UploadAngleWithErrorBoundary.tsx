/**
 * @fileoverview UploadAngleWithErrorBoundary - Complete upload workflow with error boundary
 * @module @/mobile/components/UploadAngle/containers/UploadAngleWithErrorBoundary
 * @version 1.0.0
 */

'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { UploadAngleContainer } from './UploadAngleContainer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ProgressIndicator } from '../components/ProgressIndicator';
import type { UploadAngleProps } from '../types/upload.types';

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
        minHeight: '300px',
        padding: '32px',
        gap: '16px'
      }}
      role="status"
      aria-label="Loading upload interface"
    >
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      <div style={{
        fontSize: '16px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        Loading upload interface...
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
 * Custom error fallback specifically for upload workflow
 */
const UploadErrorFallback = React.memo(function UploadErrorFallback() {
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
        minHeight: '300px',
        padding: '32px',
        margin: '16px',
        background: '#fef2f2',
        border: '2px solid #fecaca',
        borderRadius: '12px',
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
        strokeWidth="2"
        style={{ marginBottom: '16px' }}
        aria-hidden="true"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </motion.svg>

      <h2 style={{
        fontSize: '24px',
        fontWeight: 600,
        color: '#dc2626',
        margin: '0 0 12px 0'
      }}>
        Upload System Error
      </h2>

      <p style={{
        fontSize: '16px',
        color: '#7f1d1d',
        margin: '0 0 24px 0',
        lineHeight: 1.5
      }}>
        The upload system encountered an unexpected error. Please refresh the page to try again.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.reload()}
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
        aria-label="Refresh page to reload upload system"
      >
        Refresh Page
      </motion.button>
    </motion.div>
  );
});

// =============================================================================
// MAIN WRAPPER COMPONENT
// =============================================================================

/**
 * Props for UploadAngleWithErrorBoundary
 */
interface UploadAngleWithErrorBoundaryProps extends UploadAngleProps {
  /** Whether to show loading indicator during Suspense */
  showLoadingIndicator?: boolean;
  /** Custom error fallback component */
  customErrorFallback?: React.ReactNode;
  /** Custom loading fallback component */
  customLoadingFallback?: React.ReactNode;
  /** Callback for error boundary errors */
  onSystemError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * UploadAngleWithErrorBoundary - Complete upload workflow with comprehensive error handling
 * 
 * This component wraps the UploadAngleContainer with:
 * - React Error Boundary for catching component errors
 * - Suspense boundary for code splitting and loading states
 * - Custom loading and error fallbacks
 * - Enhanced error reporting and recovery
 * 
 * @param props UploadAngleWithErrorBoundaryProps
 * @returns JSX.Element
 */
export const UploadAngleWithErrorBoundary = React.memo<UploadAngleWithErrorBoundaryProps>(
  function UploadAngleWithErrorBoundary({
    showLoadingIndicator = true,
    customErrorFallback,
    customLoadingFallback,
    onSystemError,
    ...uploadAngleProps
  }) {
    
    // Handle error boundary errors
    const handleErrorBoundaryError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
      // Log error for debugging
      console.error('Upload system error boundary triggered:', error);
      console.error('Component stack:', errorInfo.componentStack);
      
      // Call parent error handler
      onSystemError?.(error, errorInfo);
      
      // In production, you might want to send this to an error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry, LogRocket, Bugsnag, etc.
        // errorReportingService.captureException(error, {
        //   tags: { component: 'UploadAngle', boundary: 'system' },
        //   extra: { componentStack: errorInfo.componentStack }
        // });
      }
    }, [onSystemError]);

    // Determine which fallbacks to use
    const errorFallback = customErrorFallback || <UploadErrorFallback />;
    const loadingFallback = customLoadingFallback || (showLoadingIndicator ? <LoadingFallback /> : null);

    return (
      <ErrorBoundary
        fallback={errorFallback}
        onError={handleErrorBoundaryError}
        showErrorDetails={process.env.NODE_ENV === 'development'}
        testId="upload-angle-error-boundary"
      >
        <Suspense fallback={loadingFallback}>
          <UploadAngleContainer
            {...uploadAngleProps}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }
);

UploadAngleWithErrorBoundary.displayName = 'UploadAngleWithErrorBoundary';

export default UploadAngleWithErrorBoundary;