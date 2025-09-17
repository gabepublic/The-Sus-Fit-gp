'use client';

import React, { useCallback, useMemo } from 'react';
import { PhotoFrame } from './PhotoFrame';
import { useFitUpload } from '../hooks/useFitUpload';
import type { UploadConfig } from '../types/upload.types';

/**
 * Upload configuration for fit/garment images
 */
const FIT_UPLOAD_CONFIG: Partial<UploadConfig> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  enableCompression: true,
  quality: 0.8
};

/**
 * Props for UploadFit component
 */
interface UploadFitProps {
  config?: Partial<UploadConfig>;
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

  // Use custom fit upload hook to prevent infinite loops
  const uploadHook = useFitUpload(config);

  // Handle upload success
  React.useEffect(() => {
    if (uploadHook.state.status === 'success' && uploadHook.state.imageUrl) {
      onUploadSuccess?.(uploadHook.state.imageUrl, uploadHook.state.metadata);
    }
  }, [uploadHook.state.status, uploadHook.state.imageUrl, uploadHook.state.metadata, onUploadSuccess]);

  // Handle upload error
  React.useEffect(() => {
    if (uploadHook.state.status === 'error' && uploadHook.state.error) {
      onUploadError?.(uploadHook.state.error);
    }
  }, [uploadHook.state.status, uploadHook.state.error, onUploadError]);

  // Handle progress updates
  React.useEffect(() => {
    if (uploadHook.state.progress > 0) {
      onProgressChange?.(uploadHook.state.progress);
    }
  }, [uploadHook.state.progress, onProgressChange]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      try {
        await uploadHook.uploadFile(file);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
      }
    },
    [disabled, uploadHook.uploadFile, onUploadError]
  );

  // Handle button click to open file picker
  const handleButtonClick = useCallback(() => {
    if (disabled) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  }, [disabled, handleFileSelect]);


  // Handle image load success
  const handleImageLoad = useCallback(() => {
    // Image loaded successfully in PhotoFrame
  }, []);

  // Handle image load error
  const handleImageError = useCallback((error: Event) => {
    console.warn('Image display error:', error);
  }, []);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      // No cleanup needed for simplified useFitUpload hook
    };
  }, []);

  const currentImageUrl = uploadHook.state.imageUrl || initialImageUrl;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: '60vh'
    }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <PhotoFrame
          imageUrl={currentImageUrl}
          alt="Your uploaded fit photo"
          loading={uploadHook.state.status === 'uploading'}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          aspectRatio="3:4"
          className={className}
          data-testid={testId}
        />

        {/* Upload/Re-do button - show when not uploading */}
        {uploadHook.state.status !== 'uploading' && (
          <button
            onClick={handleButtonClick}
            disabled={disabled}
            style={{
              position: 'absolute',
              bottom: '70px',
              left: '-20px',
              background: '#fc96e8',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '2px',
              padding: '14px 36px',
              fontSize: '18px',
              fontWeight: 900,
              fontFamily: '"Montserrat Alternates", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              boxShadow: '5px 5px 0px 0px #00BFFF, 5px 5px 0px 2px #000',
              minHeight: '44px',
              zIndex: 20,
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e885d8';
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0px 0px #00BFFF, 3px 3px 0px 2px #000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fc96e8';
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '5px 5px 0px 0px #00BFFF, 5px 5px 0px 2px #000';
            }}
          >
            {currentImageUrl ? 'Re-do' : 'Select your fit'}
          </button>
        )}

        {/* "Next >" button - show when upload is successful and image exists */}
        {uploadHook.state.status === 'success' && currentImageUrl && onNext && (
          <button
            onClick={onNext}
            disabled={disabled}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '-20px',
              background: '#fc96e8',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '2px',
              padding: '14px 36px',
              fontSize: '18px',
              fontWeight: 900,
              fontFamily: '"Montserrat Alternates", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              cursor: 'pointer',
              boxShadow: '5px 5px 0px 0px #00BFFF, 5px 5px 0px 2px #000',
              minHeight: '44px',
              zIndex: 20,
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e885d8';
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '3px 3px 0px 0px #00BFFF, 3px 3px 0px 2px #000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fc96e8';
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '5px 5px 0px 0px #00BFFF, 5px 5px 0px 2px #000';
            }}
          >
            Next &gt;
          </button>
        )}
      </div>
    </div>
  );
});

UploadFit.displayName = 'UploadFit';