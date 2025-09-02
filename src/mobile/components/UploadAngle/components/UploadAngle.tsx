'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { UploadAngleProps, UploadState, ImageValidationResult, ImageMetadata, DEFAULT_UPLOAD_CONFIG } from '../types';
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
  const config = useMemo(() => ({
    ...DEFAULT_UPLOAD_CONFIG,
    ...userConfig
  }), [userConfig]);

  // Upload state management
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    file: null,
    imageUrl: initialImageUrl || null,
    error: null,
    progress: 0
  });

  // File validation function
  const validateFile = useCallback((file: File): ImageValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > config.maxFileSize) {
      const maxSizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);
      errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    if (config.allowedTypes.length > 0) {
      const isAllowed = config.allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type === type || file.type.startsWith(type.replace('/*', ''));
      });
      
      if (!isAllowed) {
        errors.push('File type not supported. Please select a valid image file.');
      }
    }

    // Add warnings for large files
    if (file.size > config.maxFileSize * 0.8) {
      warnings.push('Large file size may result in slower processing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [config]);

  // Extract image metadata
  const extractMetadata = useCallback((file: File): Promise<ImageMetadata> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          filename: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          lastModified: file.lastModified
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for metadata extraction'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Simulate upload process (will be replaced with actual upload logic in Task 4)
  const simulateUpload = useCallback(async (file: File, imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        progress = Math.min(progress, 100);
        
        setUploadState(prev => ({ ...prev, progress }));
        onProgressChange?.(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Simulate occasional failures for testing
            if (Math.random() > 0.9) {
              reject(new Error('Upload failed due to network error'));
            } else {
              resolve();
            }
          }, 500);
        }
      }, 200);
    });
  }, [onProgressChange]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      const error = validation.errors[0];
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error,
        file: null,
        imageUrl: null
      }));
      onUploadError?.(error);
      return;
    }

    // Create image URL
    const imageUrl = URL.createObjectURL(file);
    
    // Set uploading state
    setUploadState({
      status: 'uploading',
      file,
      imageUrl,
      error: null,
      progress: 0
    });

    try {
      // Extract metadata
      const metadata = await extractMetadata(file);
      
      // Perform upload simulation
      await simulateUpload(file, imageUrl);
      
      // Success state
      setUploadState(prev => ({
        ...prev,
        status: 'success',
        progress: 100
      }));
      
      onUploadSuccess?.(imageUrl, metadata);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      onUploadError?.(errorMessage);
      
      // Clean up failed upload
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }, [disabled, validateFile, extractMetadata, simulateUpload, onUploadSuccess, onUploadError]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (uploadState.file) {
      handleFileSelect(uploadState.file);
    } else {
      setUploadState({
        status: 'idle',
        file: null,
        imageUrl: initialImageUrl || null,
        error: null,
        progress: 0
      });
    }
  }, [uploadState.file, handleFileSelect, initialImageUrl]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    // Image loaded successfully in PhotoFrame
  }, []);

  // Handle image load error
  const handleImageError = useCallback((error: Event) => {
    setUploadState(prev => ({
      ...prev,
      status: 'error',
      error: 'Failed to display image'
    }));
  }, []);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (uploadState.imageUrl && uploadState.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadState.imageUrl);
      }
    };
  }, [uploadState.imageUrl]);

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
      role="region"
      aria-label="Upload your angle image"
    >
      <div className="upload-angle__container">
        {/* Photo Display Area */}
        <div className="upload-angle__photo-section">
          <PhotoFrame
            imageUrl={uploadState.imageUrl}
            alt="Your uploaded angle photo"
            loading={uploadState.status === 'uploading'}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            aspectRatio="1:1"
            className="upload-angle__photo-frame"
          />
        </div>

        {/* Upload Controls */}
        <div className="upload-angle__controls">
          {uploadState.status !== 'uploading' && (
            <UploadButton
              onFileSelect={handleFileSelect}
              accept={acceptedTypes}
              disabled={disabled}
              variant={uploadState.status === 'error' ? 'secondary' : 'primary'}
              size="medium"
              className="upload-angle__upload-button"
            >
              {uploadState.imageUrl ? 'Change Image' : 'Upload Image'}
            </UploadButton>
          )}

          {/* Progress Indicator */}
          {uploadState.status === 'uploading' && (
            <div className="upload-angle__progress-section">
              <ProgressIndicator
                progress={uploadState.progress}
                showPercentage={true}
                variant="linear"
                color="primary"
                className="upload-angle__progress"
              />
              <p className="upload-angle__progress-text">
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
              severity="error"
              className="upload-angle__error"
            />
          )}

          {/* Success Message */}
          {uploadState.status === 'success' && (
            <div 
              className="upload-angle__success"
              role="status"
              aria-live="polite"
            >
              <svg
                className="upload-angle__success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m9 12 2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span>Image uploaded successfully!</span>
            </div>
          )}

          {/* Next Button - only show when upload is successful */}
          {uploadState.status === 'success' && uploadState.imageUrl && onNext && (
            <NextButton
              onClick={onNext}
              disabled={disabled}
              variant="primary"
              size="medium"
              className="upload-angle__next-button"
            />
          )}
        </div>

        {/* Upload Instructions */}
        {uploadState.status === 'idle' && !uploadState.imageUrl && (
          <div className="upload-angle__instructions">
            <h3 className="upload-angle__instructions-title">
              Upload Your Angle
            </h3>
            <ul className="upload-angle__instructions-list">
              <li>Select an image from your device</li>
              <li>Or drag and drop an image file</li>
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>Maximum file size: {(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB</li>
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
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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