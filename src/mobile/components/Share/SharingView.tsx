/**
 * @fileoverview SharingView Component - Main sharing view layout with PhotoFrame and ShareButtons
 * @module @/mobile/components/Share/SharingView
 * @version 1.0.0
 */

'use client';

import React, { useCallback } from 'react';
import { PhotoFrame } from '@/mobile/components/shared/PhotoFrame/PhotoFrame';
import { Button } from '@/mobile/components/shared/Button';
import type { SharePlatform } from './ShareButton.types';

/**
 * Props for the SharingView component
 */
export interface SharingViewProps {
  /** Image URL to display and share */
  imageUrl?: string | null;

  /** Alt text for the image */
  imageAlt?: string;

  /** Loading state */
  loading?: boolean;

  /** Error message */
  error?: string;

  /** Share metadata */
  shareData?: {
    title?: string;
    description?: string;
    hashtags?: string[];
    url?: string;
  };

  /** Custom CSS class */
  className?: string;

  /** Test ID for testing */
  testId?: string;

  // Event handlers
  /** Called when image loads successfully */
  onImageLoad?: () => void;

  /** Called when image fails to load */
  onImageError?: () => void;

  /** Called when user retries loading */
  onRetry?: () => void;

  /** Called when sharing starts */
  onShareStart?: (platform: SharePlatform) => void;

  /** Called when sharing completes */
  onShareComplete?: (platform: SharePlatform, success: boolean) => void;

  /** Called when sharing fails */
  onShareError?: (platform: SharePlatform, error: string) => void;
}

/**
 * SharingView Component - Main sharing view layout
 *
 * Features:
 * - Central PhotoFrame display with sharing view configuration
 * - Single Share button positioned at bottom center of frame
 * - Yellow background (#faba01) matching Upload Your Angle view
 * - Responsive layout for proper spacing
 * - Brutalist design consistency
 * - Accessibility features and keyboard navigation
 *
 * Layout:
 * ```
 * ┌─────────────────────────┐
 * │                         │
 * │     [PhotoFrame]        │
 * │         [Share]         │
 * │                         │
 * └─────────────────────────┘
 * ```
 *
 * @param props SharingViewProps
 * @returns JSX.Element
 */
export const SharingView = React.memo<SharingViewProps>(function SharingView({
  imageUrl,
  imageAlt = 'Your virtual try-on result',
  loading = false,
  error,
  shareData,
  className = '',
  testId = 'sharing-view',
  onImageLoad,
  onImageError,
  onRetry,
  onShareStart,
  onShareComplete,
  onShareError
}) {
  /**
   * Handle share button click - uses Web Share API
   */
  const handleShareClick = useCallback(async () => {
    if (!imageUrl) {
      onShareError?.('device', 'No image to share');
      return;
    }

    onShareStart?.('device');

    try {
      // Convert image URL to blob for sharing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'tryon-result.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: shareData?.title || 'My Virtual Try-On Result',
          text: shareData?.description || 'Check out my virtual try-on!',
          files: [file]
        });
        onShareComplete?.('device', true);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        onShareComplete?.('device', true);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled sharing - this is normal behavior
        console.debug('User cancelled sharing');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Share failed';
        onShareError?.('device', errorMessage);
      }
    }
  }, [imageUrl, shareData, onShareStart, onShareComplete, onShareError]);
  return (
    <div
      className={`sharing-view mobile-upload-fit-page ${className}`}
      data-testid={testId}
      style={{
        minHeight: '100vh',
        fontFamily: '"Courier New", monospace'
      }}
    >
      <div style={{ padding: '24px 16px' }}>
        {/* Main PhotoFrame Container - matches Upload Fit layout */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '60vh'
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <PhotoFrame
              imageUrl={imageUrl}
              alt={imageAlt}
              viewType="fit"
              aspectRatio="3:4"
              loading={loading}
              error={error}
              onImageLoad={onImageLoad}
              onImageError={onImageError}
              onRetry={onRetry}
              testId={`${testId}-photo`}
            />

            {/* Share Button - positioned at bottom center, overlapping frame edge */}
            <div style={{
              position: 'absolute',
              bottom: '-25px', // Overlapping the bottom edge of PhotoFrame
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20
            }}>
              <Button
                variant="primary"
                size="large"
                onClick={handleShareClick}
                disabled={loading || !imageUrl}
                testId={`${testId}-share-button`}
                viewType="fit"
                ariaLabel="Share your try-on result"
              >
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite">
          Sharing view with your try-on result and social media sharing options
        </div>
      </div>
    </div>
  );
});

SharingView.displayName = 'SharingView';