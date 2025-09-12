'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  useSingleImageUpload,
  type UploadConfig,
  type UploadedFile,
  type UploadError
} from '../../../../hooks/useImageUpload';
import { PhotoFrame } from './PhotoFrame';
import { MobileUploadButton } from './MobileUploadButton';
import { NextButton } from './NextButton';
import { ProgressIndicator } from './ProgressIndicator';
import { ErrorDisplay } from './ErrorDisplay';

/**
 * Upload configuration for fit/garment images
 */
const FIT_UPLOAD_CONFIG: UploadConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  generateThumbnails: true,
  thumbnailSizes: [150, 300, 600],
  autoProcess: true,
  validation: {
    minWidth: 256,
    minHeight: 256,
    maxWidth: 4096,
    maxHeight: 4096,
  }
};

/**
 * Props for UploadFit component
 */
interface UploadFitProps {
  config?: UploadConfig;
  onUploadSuccess?: (imageUrl: string, metadata?: any) => void;
  onUploadError?: (error: string) => void;
  onProgressChange?: (progress: number) => void;
  onNext?: () => void;
  disabled?: boolean;
  initialImageUrl?: string;
  className?: string;
  testId?: string;
}

/**
 * UploadFit Component - Main container for the Upload Your Fit functionality
 * 
 * Features:
 * - Complete upload workflow management for clothing/garment images
 * - File validation and processing using existing hooks
 * - Progress tracking with visual feedback
 * - Error handling with recovery options
 * - Responsive layout adaptation
 * - Accessibility compliance
 * - Integration with existing upload infrastructure
 */
export const UploadFit = React.memo<UploadFitProps>(function UploadFit({
  config: userConfig,
  onUploadSuccess,
  onUploadError,
  onProgressChange,
  onNext,
  disabled = false,
  initialImageUrl,
  className = '',
  testId = 'upload-fit'
}) {
  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...FIT_UPLOAD_CONFIG,
      ...userConfig
    }),
    [userConfig]
  );

  // Use existing upload hook
  const upload = useSingleImageUpload(
    config,
    (uploadedFile: UploadedFile) => {
      onUploadSuccess?.(uploadedFile.preview, uploadedFile.metadata);
    },
    (error: UploadError) => {
      onUploadError?.(error.message);
    }
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;
      
      try {
        await upload.uploadFile(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
      }
    },
    [disabled, upload, onUploadError]
  );

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (upload.currentFile?.file) {
      await handleFileSelect(upload.currentFile.file);
    } else {
      upload.clearFiles();
    }
  }, [upload, handleFileSelect]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    // Image loaded successfully in PhotoFrame
  }, []);

  // Handle image load error
  const handleImageError = useCallback((error: Event) => {
    console.warn('Image display error:', error);
  }, []);

  // Handle progress updates
  React.useEffect(() => {
    if (upload.progress?.percentage !== undefined && upload.progress.percentage > 0) {
      onProgressChange?.(upload.progress.percentage);
    }
  }, [upload.progress?.percentage, onProgressChange]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      upload.clearFiles();
    };
  }, [upload]);

  const containerClasses = `
    upload-fit
    upload-fit--${upload.uploadState}
    ${disabled ? 'upload-fit--disabled' : ''}
    ${className}
  `.trim();

  const acceptedTypes = config.allowedTypes?.join(',') || '';
  const currentImageUrl = upload.file?.preview || initialImageUrl;

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role="region"
      aria-label="Upload your fit image"
    >
      <div className="upload-fit__container">
        {/* Photo Display Area */}
        <div className="upload-fit__photo-section">
          <PhotoFrame
            imageUrl={currentImageUrl}
            alt="Your uploaded fit photo"
            loading={upload.uploadState === 'processing'}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            aspectRatio="1:1"
            className="upload-fit__photo-frame"
          />
        </div>

        {/* Upload Controls */}
        <div className="upload-fit__controls">
          {upload.uploadState !== 'processing' && (
            <MobileUploadButton
              onFileSelect={handleFileSelect}
              accept={acceptedTypes}
              disabled={disabled}
              variant={upload.uploadState === 'error' ? 'secondary' : 'primary'}
              size="medium"
              className="upload-fit__upload-button"
            >
              {currentImageUrl ? 'Change Image' : 'Upload Image'}
            </MobileUploadButton>
          )}

          {/* Progress Indicator */}
          {upload.uploadState === 'processing' && (
            <div className="upload-fit__progress-section">
              <ProgressIndicator
                progress={upload.progress?.percentage || 0}
                showPercentage={true}
                variant="linear"
                color="primary"
                className="upload-fit__progress"
              />
              <p className="upload-fit__progress-text">
                {upload.progress?.message || 'Uploading your image...'}
              </p>
            </div>
          )}

          {/* Error Display */}
          {upload.uploadState === 'error' && upload.error && (
            <ErrorDisplay
              error={upload.error.message}
              onRetry={handleRetry}
              showRetry={true}
              severity="error"
              className="upload-fit__error"
            />
          )}

          {/* Success Message */}
          {upload.uploadState === 'complete' && (
            <div
              className="upload-fit__success"
              role="status"
              aria-live="polite"
            >
              <svg
                className="upload-fit__success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Image uploaded successfully!</span>
            </div>
          )}

          {/* Next Button - only show when upload is successful */}
          {upload.uploadState === 'complete' && currentImageUrl && onNext && (
            <NextButton
              onClick={onNext}
              disabled={disabled}
              variant="primary"
              size="medium"
              className="upload-fit__next-button"
            />
          )}
        </div>

        {/* Upload Instructions */}
        {upload.uploadState === 'idle' && !currentImageUrl && (
          <div className="upload-fit__instructions">
            <h3 className="upload-fit__instructions-title">Upload Your Fit</h3>
            <ul className="upload-fit__instructions-list">
              <li>Select a fit image from your device</li>
              <li>Or drag and drop a clothing image file</li>
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>
                Maximum file size:{' '}
                {((config.maxSizeBytes || FIT_UPLOAD_CONFIG.maxSizeBytes!) / (1024 * 1024)).toFixed(1)}MB
              </li>
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .upload-fit {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          background: transparent;
          border-radius: 16px;
          padding: 24px;
          transition: opacity 0.2s ease-in-out;
        }

        .upload-fit--disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .upload-fit__container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .upload-fit__photo-section {
          display: flex;
          justify-content: center;
          min-height: 300px;
        }

        .upload-fit__photo-frame {
          width: 100%;
          max-width: 400px;
        }

        .upload-fit__controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .upload-fit__upload-button {
          min-width: 200px;
        }

        .upload-fit__progress-section {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: center;
        }

        .upload-fit__progress-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .upload-fit__error {
          width: 100%;
          max-width: 400px;
        }

        .upload-fit__success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          color: #166534;
          font-weight: 500;
          font-size: 14px;
        }

        .upload-fit__success-icon {
          width: 20px;
          height: 20px;
          color: #22c55e;
        }

        .upload-fit__instructions {
          text-align: center;
          color: #6b7280;
        }

        .upload-fit__instructions-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 16px 0;
        }

        .upload-fit__instructions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .upload-fit__instructions-list li {
          margin-bottom: 8px;
          position: relative;
          padding-left: 20px;
        }

        .upload-fit__instructions-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-weight: bold;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .upload-fit {
            padding: 16px;
            margin: 16px;
            border-radius: 12px;
          }

          .upload-fit__container {
            gap: 20px;
          }

          .upload-fit__photo-section {
            min-height: 250px;
          }

          .upload-fit__upload-button {
            min-width: 160px;
          }

          .upload-fit__instructions-title {
            font-size: 16px;
          }

          .upload-fit__instructions-list {
            font-size: 13px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .upload-fit {
            background: #1f2937;
            color: #f3f4f6;
          }

          .upload-fit__instructions-title {
            color: #f3f4f6;
          }

          .upload-fit__progress-text {
            color: #9ca3af;
          }

          .upload-fit__success {
            background-color: #064e3b;
            border-color: #065f46;
            color: #34d399;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .upload-fit {
            border: 2px solid currentColor;
          }

          .upload-fit__success {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .upload-fit {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
});

UploadFit.displayName = 'UploadFit';