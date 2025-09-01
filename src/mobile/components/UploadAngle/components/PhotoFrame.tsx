'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { PhotoFrameProps } from '../types';

/**
 * PhotoFrame Component - Displays uploaded images with loading states and aspect ratio control
 * 
 * Features:
 * - Responsive image display with Next.js optimization
 * - Loading states with spinner animation
 * - Error handling with fallback content
 * - Accessible with proper ARIA labels
 * - Aspect ratio preservation
 * - Smooth loading transitions
 * 
 * @param props PhotoFrameProps
 * @returns JSX.Element
 */
export const PhotoFrame = React.memo<PhotoFrameProps>(function PhotoFrame({
  imageUrl,
  alt,
  onImageLoad,
  onImageError,
  aspectRatio = '1:1',
  loading = false,
  className = '',
  testId = 'photo-frame'
}) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
    setHasLoaded(true);
    onImageLoad?.();
  }, [onImageLoad]);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState('error');
    onImageError?.(error.nativeEvent);
  }, [onImageError]);

  // Parse aspect ratio (e.g., "16:9" -> { width: 16, height: 9 })
  const parseAspectRatio = (ratio: string) => {
    if (ratio === 'auto' || ratio === 'inherit') return ratio;
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  const aspectRatioValue = parseAspectRatio(aspectRatio);
  const showPlaceholder = !imageUrl || imageState === 'error';
  const showLoading = loading || (imageUrl && !hasLoaded && imageState === 'loading');

  return (
    <div 
      className={`photo-frame ${className}`}
      data-testid={testId}
      style={{
        aspectRatio: aspectRatioValue !== 'auto' && aspectRatioValue !== 'inherit' 
          ? aspectRatioValue 
          : undefined
      }}
      role="img" 
      aria-label={alt}
    >
      <div className="photo-frame__container">
        {/* Main Image */}
        {imageUrl && imageState !== 'error' && (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className={`photo-frame__image ${
              hasLoaded ? 'photo-frame__image--loaded' : 'photo-frame__image--loading'
            }`}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              transition: 'opacity 0.3s ease-in-out'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={false}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {/* Loading Spinner */}
        {showLoading && (
          <div 
            className="photo-frame__loading"
            role="status"
            aria-label="Loading image"
          >
            <div className="photo-frame__spinner">
              <svg
                className="photo-frame__spinner-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="photo-frame__spinner-circle"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset="62.83"
                />
              </svg>
            </div>
            <span className="sr-only">Loading image...</span>
          </div>
        )}

        {/* Placeholder for empty state */}
        {showPlaceholder && (
          <div 
            className="photo-frame__placeholder"
            role="button"
            tabIndex={0}
            aria-label="Upload area - click to select an image"
          >
            <div className="photo-frame__placeholder-content">
              <svg
                className="photo-frame__placeholder-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <span className="photo-frame__placeholder-text">
                {imageState === 'error' ? 'Failed to load image' : 'No image selected'}
              </span>
              {imageState !== 'error' && (
                <span className="photo-frame__placeholder-hint">
                  Click to upload or drag an image here
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {imageState === 'error' && (
          <div 
            className="photo-frame__error"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="photo-frame__error-icon"
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
            <span className="photo-frame__error-text">
              Image failed to load
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .photo-frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          border: 2px solid #e2e8f0;
          transition: all 0.2s ease-in-out;
        }

        .photo-frame:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .photo-frame__container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-frame__image--loading {
          opacity: 0;
        }

        .photo-frame__image--loaded {
          opacity: 1;
        }

        .photo-frame__loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(248, 250, 252, 0.9);
          z-index: 2;
        }

        .photo-frame__spinner {
          width: 40px;
          height: 40px;
          color: #3b82f6;
        }

        .photo-frame__spinner-icon {
          width: 100%;
          height: 100%;
          animation: spin 1s linear infinite;
        }

        .photo-frame__spinner-circle {
          animation: loading 1.5s ease-in-out infinite;
        }

        .photo-frame__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
          z-index: 1;
        }

        .photo-frame__placeholder:hover {
          background: rgba(59, 130, 246, 0.05);
        }

        .photo-frame__placeholder:focus {
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }

        .photo-frame__placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #64748b;
          gap: 12px;
        }

        .photo-frame__placeholder-icon {
          width: 48px;
          height: 48px;
          color: #94a3b8;
        }

        .photo-frame__placeholder-text {
          font-size: 16px;
          font-weight: 500;
          color: #475569;
        }

        .photo-frame__placeholder-hint {
          font-size: 14px;
          color: #64748b;
        }

        .photo-frame__error {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #dc2626;
          background: rgba(254, 242, 242, 0.9);
          z-index: 2;
          gap: 8px;
        }

        .photo-frame__error-icon {
          width: 32px;
          height: 32px;
        }

        .photo-frame__error-text {
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes loading {
          0% { stroke-dashoffset: 62.83; }
          50% { stroke-dashoffset: 15.71; }
          100% { stroke-dashoffset: 62.83; }
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

        @media (prefers-reduced-motion: reduce) {
          .photo-frame__image--loading,
          .photo-frame__image--loaded {
            transition: none;
          }

          .photo-frame__spinner-icon,
          .photo-frame__spinner-circle {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
});

PhotoFrame.displayName = 'PhotoFrame';