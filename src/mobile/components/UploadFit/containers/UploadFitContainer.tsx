/**
 * @fileoverview UploadFitContainer - Main container orchestrating complete upload workflow for fit images
 * @module @/mobile/components/UploadFit/containers/UploadFitContainer
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  useSingleImageUpload,
  type UploadConfig,
  type UploadedFile,
  type UploadError
} from '../../../../hooks/useImageUpload';
import { UploadFit } from '../components/UploadFit';

/**
 * Props for UploadFitContainer
 */
interface UploadFitContainerProps {
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
}

/**
 * Default upload configuration for fit images
 */
const DEFAULT_FIT_CONFIG: UploadConfig = {
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
 * UploadFitContainer Component
 * 
 * Orchestrates the complete upload workflow for fit/garment images:
 * - File selection and validation
 * - Upload progress tracking
 * - Error handling and recovery
 * - Success state management
 * - Integration with existing upload infrastructure
 */
export const UploadFitContainer = React.memo<UploadFitContainerProps>(function UploadFitContainer({
  config: userConfig,
  onUploadSuccess,
  onUploadError,
  onProgressChange,
  onNext,
  disabled = false,
  initialImageUrl,
  className = '',
  testId = 'upload-fit-container'
}) {
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_FIT_CONFIG,
    ...userConfig
  }), [userConfig]);

  // Handle successful upload
  const handleUploadSuccess = useCallback((uploadedFile: UploadedFile) => {
    onUploadSuccess?.(uploadedFile.preview, uploadedFile.metadata);
  }, [onUploadSuccess]);

  // Handle upload error
  const handleUploadError = useCallback((error: UploadError) => {
    onUploadError?.(error.message);
  }, [onUploadError]);

  // Use existing upload hook
  const upload = useSingleImageUpload(config, handleUploadSuccess, handleUploadError);

  // Handle progress updates
  useEffect(() => {
    if (upload.progress?.percentage !== undefined) {
      onProgressChange?.(upload.progress.percentage);
    }
  }, [upload.progress?.percentage, onProgressChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      upload.clearFiles();
    };
  }, [upload]);

  const containerClasses = `
    upload-fit-container
    upload-fit-container--${upload.uploadState}
    ${disabled ? 'upload-fit-container--disabled' : ''}
    ${className}
  `.trim();

  return (
    <div
      className={containerClasses}
      data-testid={testId}
      data-status={upload.uploadState}
      role="region"
      aria-label="Image upload interface"
    >
      {/* Loading State */}
      {upload.uploadState === 'idle' && !upload.file && !initialImageUrl && (
        <div role="status" aria-live="polite">
          Loading...
        </div>
      )}

      {/* Main Upload Component */}
      <div data-testid="upload-fit-container-photo-frame">
        <UploadFit
          config={config}
          onUploadSuccess={(imageUrl, metadata) => handleUploadSuccess({ 
            file: upload.file?.file || new File([], ''), 
            preview: imageUrl, 
            thumbnails: {}, 
            metadata, 
            uploadId: '', 
            uploadTime: Date.now() 
          } as UploadedFile)}
          onUploadError={handleUploadError}
          onProgressChange={onProgressChange}
          onNext={onNext}
          disabled={disabled}
          initialImageUrl={initialImageUrl}
          testId={`${testId}-upload-fit`}
        />
      </div>

      {/* Upload Button (when needed) */}
      {upload.uploadState === 'idle' && (
        <div data-testid="upload-fit-container-upload-button" />
      )}

      {/* Progress Indicator */}
      {upload.uploadState === 'processing' && (
        <div data-testid="upload-fit-container-progress" />
      )}

      {/* Next Button (when upload complete) */}
      {upload.uploadState === 'complete' && upload.file && onNext && (
        <div data-testid="upload-fit-container-next-button" />
      )}

      {/* Screen Reader Status Updates */}
      <div
        role="status"
        aria-live="polite"
        aria-label={`Uploading image: ${upload.progress?.percentage || 0}% complete`}
        className="sr-only"
      >
        {upload.uploadState === 'processing' && upload.progress?.message}
      </div>

      <style jsx>{`
        .upload-fit-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 400px;
          position: relative;
        }

        .upload-fit-container--disabled {
          opacity: 0.6;
          pointer-events: none;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Loading state */
        .upload-fit-container[data-status="idle"] [role="status"] {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          font-size: 16px;
          color: #6b7280;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .upload-fit-container {
            min-height: 350px;
          }
        }
      `}</style>
    </div>
  );
});

UploadFitContainer.displayName = 'UploadFitContainer';