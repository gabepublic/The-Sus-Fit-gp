'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  UploadAngleProps,
  UploadState,
  ImageValidationResult,
  ImageMetadata,
  DEFAULT_UPLOAD_CONFIG
} from '../types';
import { useAngleUpload } from '../hooks/useAngleUpload';
import { PhotoFrame } from './PhotoFrame';
import { UploadButton } from './UploadButton';
import { NextButton } from './NextButton';
import { ProgressIndicator } from './ProgressIndicator';
import { ErrorDisplay } from './ErrorDisplay';

/**
 * UploadAngle Component - Main container for the Upload Your Angle functionality
 *
 * Features:
 * - Complete upload workflow management
 * - File validation and processing
 * - Progress tracking with visual feedback
 * - Error handling with recovery options
 * - Responsive layout adaptation
 * - Accessibility compliance
 * - Integration with upload hooks (ready for Task 4)
 *
 * @param props UploadAngleProps
 * @returns JSX.Element
 */
export const UploadAngle = React.memo<UploadAngleProps>(function UploadAngle({
  config: userConfig,
  onUploadSuccess,
  onUploadError,
  onProgressChange,
  onNext,
  disabled = false,
  initialImageUrl,
  className = '',
  testId = 'upload-angle'
}) {
  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_UPLOAD_CONFIG,
      ...userConfig
    }),
    [userConfig]
  );

  // Use the real upload hook
  const uploadHook = useAngleUpload(config);

  // Create simplified upload state for component
  const uploadState: UploadState = useMemo(
    () => ({
      status: uploadHook.state.status,
      file: uploadHook.state.file,
      imageUrl: uploadHook.state.imageUrl || initialImageUrl || null,
      error: uploadHook.state.error,
      progress: uploadHook.state.progress
    }),
    [uploadHook.state, initialImageUrl]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      try {
        // Use the real upload hook
        const result = await uploadHook.uploadFile(file);

        if (result.success && result.data) {
          // Success - extract metadata if needed
          const metadata: ImageMetadata = {
            filename: file.name,
            size: file.size,
            type: file.type,
            width: 0, // Will be filled by hook if needed
            height: 0, // Will be filled by hook if needed
            lastModified: file.lastModified
          };

          onUploadSuccess?.(result.data, metadata);
        } else {
          onUploadError?.(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
      }
    },
    [disabled, uploadHook, onUploadSuccess, onUploadError]
  );

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (uploadState.file) {
      await handleFileSelect(uploadState.file);
    } else {
      uploadHook.reset();
    }
  }, [uploadState.file, handleFileSelect, uploadHook]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    // Image loaded successfully in PhotoFrame
  }, []);

  // Handle image load error
  const handleImageError = useCallback((error: Event) => {
    // Image display error - would be handled by hook in real implementation
    console.warn('Image display error:', error);
  }, []);

  // Handle progress updates
  React.useEffect(() => {
    if (uploadHook.state.progress > 0) {
      onProgressChange?.(uploadHook.state.progress);
    }
  }, [uploadHook.state.progress, onProgressChange]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      uploadHook.cleanup();
    };
  }, [uploadHook]);

  const containerClasses = `
    upload-angle
    upload-angle--${uploadState.status}
    ${disabled ? 'upload-angle--disabled' : ''}
    ${className}
  `.trim();

  const acceptedTypes = config.allowedTypes.join(',');

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      role='region'
      aria-label='Upload your angle image'
    >
      <div className='upload-angle__container'>
        {/* Photo Display Area */}
        <div className='upload-angle__photo-section'>
          <PhotoFrame
            imageUrl={uploadState.imageUrl}
            alt='Your uploaded angle photo'
            loading={uploadState.status === 'uploading'}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            aspectRatio='1:1'
            className='upload-angle__photo-frame'
          />
        </div>

        {/* Upload Controls */}
        <div className='upload-angle__controls'>
          {uploadState.status !== 'uploading' && (
            <UploadButton
              onFileSelect={handleFileSelect}
              accept={acceptedTypes}
              disabled={disabled}
              variant={uploadState.status === 'error' ? 'secondary' : 'primary'}
              size='medium'
              className='upload-angle__upload-button'
            >
              {uploadState.imageUrl ? 'Change Image' : 'Upload Your Angle'}
            </UploadButton>
          )}

          {/* Progress Indicator */}
          {uploadState.status === 'uploading' && (
            <div className='upload-angle__progress-section'>
              <ProgressIndicator
                progress={uploadState.progress}
                showPercentage={true}
                variant='linear'
                color='primary'
                className='upload-angle__progress'
              />
              <p className='upload-angle__progress-text'>
                Uploading your image...
              </p>
            </div>
          )}

          {/* Error Display */}
          {uploadState.status === 'error' && uploadState.error && (
            <ErrorDisplay
              error={uploadState.error}
              onRetry={handleRetry}
              showRetry={true}
              severity='error'
              className='upload-angle__error'
            />
          )}

          {/* Success Message */}
          {uploadState.status === 'success' && (
            <div
              className='upload-angle__success'
              role='status'
              aria-live='polite'
            >
              <svg
                className='upload-angle__success-icon'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                aria-hidden='true'
              >
                <path d='m9 12 2 2 4-4' />
                <circle
                  cx='12'
                  cy='12'
                  r='10'
                />
              </svg>
              <span>Image uploaded successfully!</span>
            </div>
          )}

          {/* Next Button - only show when upload is successful */}
          {uploadState.status === 'success' &&
            uploadState.imageUrl &&
            onNext && (
              <NextButton
                onClick={onNext}
                disabled={disabled}
                variant='primary'
                size='medium'
                className='upload-angle__next-button'
              />
            )}
        </div>

        {/* Upload Instructions */}
        {uploadState.status === 'idle' && !uploadState.imageUrl && (
          <div className='upload-angle__instructions'>
            <h3 className='upload-angle__instructions-title'>
              Upload Your Angle
            </h3>
            <ul className='upload-angle__instructions-list'>
              <li>Select an image from your device</li>
              <li>Or drag and drop an image file</li>
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>
                Maximum file size:{' '}
                {(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB
              </li>
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .upload-angle {
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

        .upload-angle--disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .upload-angle__container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .upload-angle__photo-section {
          display: flex;
          justify-content: center;
          min-height: 300px;
        }

        .upload-angle__photo-frame {
          width: 100%;
          max-width: 400px;
        }

        .upload-angle__controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .upload-angle__upload-button {
          min-width: 200px;
        }

        .upload-angle__progress-section {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: center;
        }

        .upload-angle__progress-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .upload-angle__error {
          width: 100%;
          max-width: 400px;
        }

        .upload-angle__success {
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

        .upload-angle__success-icon {
          width: 20px;
          height: 20px;
          color: #22c55e;
        }

        .upload-angle__instructions {
          text-align: center;
          color: #6b7280;
        }

        .upload-angle__instructions-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 16px 0;
        }

        .upload-angle__instructions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .upload-angle__instructions-list li {
          margin-bottom: 8px;
          position: relative;
          padding-left: 20px;
        }

        .upload-angle__instructions-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-weight: bold;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .upload-angle {
            padding: 16px;
            margin: 16px;
            border-radius: 12px;
          }

          .upload-angle__container {
            gap: 20px;
          }

          .upload-angle__photo-section {
            min-height: 250px;
          }

          .upload-angle__upload-button {
            min-width: 160px;
          }

          .upload-angle__instructions-title {
            font-size: 16px;
          }

          .upload-angle__instructions-list {
            font-size: 13px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .upload-angle {
            background: #1f2937;
            color: #f3f4f6;
          }

          .upload-angle__instructions-title {
            color: #f3f4f6;
          }

          .upload-angle__progress-text {
            color: #9ca3af;
          }

          .upload-angle__success {
            background-color: #064e3b;
            border-color: #065f46;
            color: #34d399;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .upload-angle {
            border: 2px solid currentColor;
          }

          .upload-angle__success {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .upload-angle {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
});

UploadAngle.displayName = 'UploadAngle';
