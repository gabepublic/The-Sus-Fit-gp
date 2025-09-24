/**
 * @fileoverview SharingView Component - Main sharing view layout with PhotoFrame and ShareButtons
 * @module @/mobile/components/Share/SharingView
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { PhotoFrame } from '@/mobile/components/shared/PhotoFrame/PhotoFrame';
import { ShareButton } from './ShareButton';
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
 * - 4 ShareButton components positioned around the frame
 * - Yellow background (#faba01) matching Upload Your Angle view
 * - Responsive CSS Grid layout for proper spacing
 * - Brutalist design consistency
 * - Accessibility features and keyboard navigation
 *
 * Layout:
 * ```
 * ┌─────────────────────────┐
 * │ [BlueSky]    [Pinterest]│
 * │                         │
 * │     [PhotoFrame]        │
 * │                         │
 * │[Instagram]     [Device] │
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

            {/* BlueSky Share Button - Top Left, with adjusted spacing */}
            <div
              style={{
                position: 'absolute',
                top: '80px',    // Less vertical space (was 60px)
                left: '40px',   // More horizontal space (was 60px)
                zIndex: 20,
                transform: 'scale(1.5)' // 50% bigger
              }}
              data-testid={`${testId}-bluesky-button`}
            >
              <ShareButton
                platform="bluesky"
                imageUrl={imageUrl || undefined}
                shareData={shareData}
                onShareStart={onShareStart}
                onShareComplete={(result) => onShareComplete?.(result.platform, result.success)}
                onShareError={(platform, errorMsg) => onShareError?.(platform, errorMsg)}
                testId={`${testId}-share-bluesky`}
              />
            </div>

            {/* Pinterest Share Button - Top Right, with adjusted spacing */}
            <div
              style={{
                position: 'absolute',
                top: '80px',    // Less vertical space (was 60px)
                right: '40px',  // More horizontal space (was 60px)
                zIndex: 20,
                transform: 'scale(1.5)' // 50% bigger
              }}
              data-testid={`${testId}-pinterest-button`}
            >
              <ShareButton
                platform="pinterest"
                imageUrl={imageUrl || undefined}
                shareData={shareData}
                onShareStart={onShareStart}
                onShareComplete={(result) => onShareComplete?.(result.platform, result.success)}
                onShareError={(platform, errorMsg) => onShareError?.(platform, errorMsg)}
                testId={`${testId}-share-pinterest`}
              />
            </div>

            {/* Instagram Share Button - Bottom Left, with adjusted spacing */}
            <div
              style={{
                position: 'absolute',
                bottom: '80px',  // Less vertical space (was 60px)
                left: '40px',    // More horizontal space (was 60px)
                zIndex: 20,
                transform: 'scale(1.5)' // 50% bigger
              }}
              data-testid={`${testId}-instagram-button`}
            >
              <ShareButton
                platform="instagram"
                imageUrl={imageUrl || undefined}
                shareData={shareData}
                onShareStart={onShareStart}
                onShareComplete={(result) => onShareComplete?.(result.platform, result.success)}
                onShareError={(platform, errorMsg) => onShareError?.(platform, errorMsg)}
                testId={`${testId}-share-instagram`}
              />
            </div>

            {/* Device Share Button - Bottom Right, with adjusted spacing */}
            <div
              style={{
                position: 'absolute',
                bottom: '80px',  // Less vertical space (was 60px)
                right: '40px',   // More horizontal space (was 60px)
                zIndex: 20,
                transform: 'scale(1.5)' // 50% bigger
              }}
              data-testid={`${testId}-device-button`}
            >
              <ShareButton
                platform="device"
                imageUrl={imageUrl || undefined}
                shareData={shareData}
                onShareStart={onShareStart}
                onShareComplete={(result) => onShareComplete?.(result.platform, result.success)}
                onShareError={(platform, errorMsg) => onShareError?.(platform, errorMsg)}
                testId={`${testId}-share-device`}
              />
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