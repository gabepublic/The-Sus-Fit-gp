'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { PhotoFrame, UploadButton, NextButton, useViewUpload } from '../../shared';
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
  onUploadSuccess?: (imageUrl: string, metadata?: Record<string, unknown>) => void;
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

  // Use shared view upload hook for fit uploads
  const uploadHook = useViewUpload('fit', config);

  // Handle upload success
  React.useEffect(() => {
    if (uploadHook.isSuccess && uploadHook.imageUrl) {
      onUploadSuccess?.(uploadHook.imageUrl, uploadHook.state.metadata);
    }
  }, [uploadHook.isSuccess, uploadHook.imageUrl, uploadHook.state.metadata, onUploadSuccess]);

  // Handle upload error
  React.useEffect(() => {
    if (uploadHook.isError && uploadHook.error) {
      onUploadError?.(uploadHook.error);
    }
  }, [uploadHook.isError, uploadHook.error, onUploadError]);

  // Handle progress updates
  React.useEffect(() => {
    if (uploadHook.progress > 0) {
      onProgressChange?.(uploadHook.progress);
    }
  }, [uploadHook.progress, onProgressChange]);

  // Handle file selection for shared UploadButton
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
    [disabled, uploadHook, onUploadError]
  );

  // Handle upload error for shared UploadButton
  const handleUploadError = useCallback((error: string) => {
    onUploadError?.(error);
  }, [onUploadError]);

  // Create ref for hidden file input in PhotoFrame
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle PhotoFrame click to trigger upload
  const handlePhotoFrameUpload = useCallback((event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
    if (disabled) return;
    // Note: PhotoFrame component will handle triggering its internal file input
    // This callback just provides the event handling
  }, [disabled]);


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

  const currentImageUrl = uploadHook.imageUrl || initialImageUrl;
  const uploadStatus = uploadHook.isIdle ? 'idle' : uploadHook.isUploading ? 'uploading' : uploadHook.isSuccess ? 'complete' : 'error';

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
          state={uploadHook.isUploading ? 'uploading' : uploadHook.isSuccess ? 'loaded' : uploadHook.isError ? 'error' : 'empty'}
          progress={uploadHook.progress}
          loading={uploadHook.isUploading}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          onUpload={handlePhotoFrameUpload}
          aspectRatio="3:4"
          viewType="fit"
          className={className}
          testId={testId}
        />

        {/* Shared UploadButton - positioned as original */}
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '-25px',
          zIndex: 20
        }}>
          <UploadButton
            onFileSelect={handleFileSelect}
            onError={(error) => handleUploadError(typeof error === 'string' ? error : error.message)}
            loading={uploadHook.isUploading}
            disabled={disabled}
            viewType="fit"
            isRedo={!!currentImageUrl}
            accept="image/*"
            testId={`${testId}-upload-button`}
          />
        </div>

        {/* Shared NextButton - positioned up and right outside PhotoFrame */}
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '-45px',
          zIndex: 20
        }}>
          <NextButton
            uploadStatus={uploadStatus}
            onClick={onNext}
            disabled={disabled}
            viewType="fit"
            config={{
              targetRoute: '/m/tryon',
              enablePrefetch: true
            }}
            testId={`${testId}-next-button`}
          />
        </div>
      </div>
    </div>
  );
});

UploadFit.displayName = 'UploadFit';