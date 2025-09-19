/**
 * @fileoverview UploadFitWithErrorBoundary - UploadFit component wrapped with error boundary
 * @module @/mobile/components/UploadFit/components/UploadFitWithErrorBoundary
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { UploadFitContainer } from '../containers/UploadFitContainer';
import { ErrorBoundary } from '../../shared';
import type { UploadConfig } from '../../../../hooks/useImageUpload';

/**
 * Props for UploadFitWithErrorBoundary
 */
interface UploadFitWithErrorBoundaryProps {
  /** Upload configuration */
  config?: UploadConfig;
  /** Callback when upload succeeds */
  onUploadSuccess?: (imageUrl: string, metadata?: any) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Callback for progress updates */
  onProgressChange?: (progress: number) => void;
  /** Callback for Next button click */
  onNext?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Initial image URL to display */
  initialImageUrl?: string;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Show error details in development */
  showErrorDetails?: boolean;
  /** Custom error message for boundary */
  errorBoundaryMessage?: string;
}

/**
 * UploadFitWithErrorBoundary Component
 * 
 * Wraps the UploadFitContainer with an ErrorBoundary to provide:
 * - Graceful error handling
 * - Error recovery functionality
 * - Development error details
 * - User-friendly error messages
 * - Error reporting capabilities
 */
export const UploadFitWithErrorBoundary = React.memo<UploadFitWithErrorBoundaryProps>(
  function UploadFitWithErrorBoundary({
    config,
    onUploadSuccess,
    onUploadError,
    onProgressChange,
    onNext,
    disabled = false,
    initialImageUrl,
    className = '',
    testId = 'upload-fit-with-error-boundary',
    showErrorDetails = process.env.NODE_ENV === 'development',
    errorBoundaryMessage = 'An error occurred while uploading your fit image. Please try again.'
  }) {
    const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
      // Log error for monitoring
      console.error('UploadFit error boundary caught an error:', error, errorInfo);
      
      // Report error if callback provided
      onUploadError?.(error.message);
      
      // In a real app, you might send this to an error reporting service
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }, [onUploadError]);

    return (
      <ErrorBoundary
        onError={handleError}
        showErrorDetails={showErrorDetails}
        errorMessage={errorBoundaryMessage}
        testId={`${testId}-error-boundary`}
        className={className}
      >
        <UploadFitContainer
          config={config}
          onUploadSuccess={onUploadSuccess}
          onUploadError={onUploadError}
          onProgressChange={onProgressChange}
          onNext={onNext}
          disabled={disabled}
          initialImageUrl={initialImageUrl}
          testId={`${testId}-container`}
        />
      </ErrorBoundary>
    );
  }
);

UploadFitWithErrorBoundary.displayName = 'UploadFitWithErrorBoundary';