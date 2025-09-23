'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoFrameProps,
  PhotoFrameInternalState,
  PHOTO_FRAME_STATE,
  PhotoFrameState,
  PhotoFrameErrorDetails
} from './PhotoFrame.types';
import {
  mergePhotoFrameConfig,
  parseAspectRatio,
  getAspectRatioPadding,
  validatePhotoFrameConfig
} from './photoframe.config';
import styles from './PhotoFrame.module.css';

/**
 * SharedPhotoFrame Component - Unified photo display component for all upload views
 *
 * Features:
 * - Configurable for Upload Angle, Upload Fit, and Try It On views
 * - Four distinct states: empty, uploading, loaded, error
 * - CSS-in-JS + CSS Modules hybrid approach for complete isolation
 * - Configurable aspect ratios with browser fallback support
 * - Framer Motion animations for smooth state transitions
 * - Full accessibility support with ARIA labels
 * - Error handling with retry functionality
 * - Upload progress indicator
 * - Screen reader announcements
 * - View-specific placeholder images and styling
 * - Non-interactive display component (upload triggers handled by separate buttons)
 *
 * @param props PhotoFrameProps
 * @returns JSX.Element
 */
export const PhotoFrame = React.memo<PhotoFrameProps>(function PhotoFrame({
  imageUrl,
  alt,
  state,
  progress = 0,
  error,
  aspectRatio,
  loading = false,
  disabled = false,
  viewType = 'angle',
  customConfig,
  onImageLoad,
  onImageError,
  onUpload,
  onRetry,
  className = '',
  testId = 'shared-photo-frame',
  style
}) {
  // Get merged configuration for this view type
  const config = mergePhotoFrameConfig(viewType, customConfig);

  // Validate configuration in development
  if (process.env.NODE_ENV === 'development') {
    const validation = validatePhotoFrameConfig(config);
    if (!validation.isValid) {
      console.error('PhotoFrame configuration errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('PhotoFrame configuration warnings:', validation.warnings);
    }
  }

  // Component state
  const [internalState, setInternalState] = useState<PhotoFrameInternalState>({
    internalImageState: 'loading',
    hasLoaded: false
  });

  // Refs
  const frameRef = useRef<HTMLDivElement>(null);

  // Determine current state based on props and internal state
  const currentState: PhotoFrameState = React.useMemo(() => {
    if (state) return state;
    if (loading || (imageUrl && !internalState.hasLoaded && internalState.internalImageState === 'loading')) {
      return PHOTO_FRAME_STATE.UPLOADING;
    }
    if (error || internalState.internalImageState === 'error') {
      return PHOTO_FRAME_STATE.ERROR;
    }
    if (imageUrl && internalState.hasLoaded) {
      return PHOTO_FRAME_STATE.LOADED;
    }
    return PHOTO_FRAME_STATE.EMPTY;
  }, [state, loading, imageUrl, internalState.hasLoaded, internalState.internalImageState, error]);

  // Parse aspect ratio for CSS
  const finalAspectRatio = aspectRatio || config.defaultAspectRatio;
  const parsedAspectRatio = parseAspectRatio(finalAspectRatio);
  const aspectPadding = getAspectRatioPadding(finalAspectRatio);

  // Image load handlers
  const handleImageLoad = useCallback(() => {
    setInternalState(prev => ({
      ...prev,
      internalImageState: 'loaded',
      hasLoaded: true
    }));
    onImageLoad?.();
  }, [onImageLoad]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setInternalState(prev => ({
      ...prev,
      internalImageState: 'error'
    }));

    // Create error details for logging
    const errorDetails: PhotoFrameErrorDetails = {
      message: 'Image failed to load',
      timestamp: new Date(),
      viewType,
      imageUrl: imageUrl || undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      errorId: `photoframe_img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('PhotoFrame image load error:', errorDetails);
    }

    onImageError?.(event.nativeEvent);
  }, [onImageError, viewType, imageUrl]);


  // Retry handler
  const handleRetry = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onRetry?.();
  }, [onRetry]);


  // Reset internal state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setInternalState(prev => ({
        ...prev,
        internalImageState: 'loading',
        hasLoaded: false
      }));
    }
  }, [imageUrl]);

  // Animation variants for overlays
  const overlayVariants = {
    enter: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // ARIA attributes based on current state
  const ariaLabel = React.useMemo(() => {
    switch (currentState) {
      case PHOTO_FRAME_STATE.EMPTY:
        return config.ariaLabels.empty;
      case PHOTO_FRAME_STATE.UPLOADING:
        return progress > 0
          ? `${config.ariaLabels.uploading} - ${progress}% complete`
          : config.ariaLabels.uploading;
      case PHOTO_FRAME_STATE.LOADED:
        return alt || config.ariaLabels.loaded;
      case PHOTO_FRAME_STATE.ERROR:
        return `${config.ariaLabels.error}`;
      default:
        return alt || config.ariaLabels.empty;
    }
  }, [currentState, progress, alt, config.ariaLabels]);

  // CSS custom properties for configuration
  const cssCustomProperties = React.useMemo(() => ({
    '--photoframe-width': config.styleOverrides?.width || '70vw',
    '--photoframe-height': config.styleOverrides?.height || '50vh',
    '--photoframe-aspect-padding': aspectPadding,
    '--photoframe-placeholder-transform': config.styleOverrides?.placeholderTransform || 'translateY(0)',
    '--progress-width': `${progress}%`
  }), [config.styleOverrides, aspectPadding, progress]);

  // Combine styles
  const combinedStyle = {
    ...cssCustomProperties,
    ...style
  };

  return (
    <motion.div
      ref={frameRef}
      className={`${styles.photoFrame} ${className}`}
      data-testid={testId}
      data-state={currentState}
      data-view={viewType}
      style={combinedStyle}
      role="img"
      aria-label={ariaLabel}
    >
      <div className={styles.container}>

        {/* Main Image */}
        {imageUrl && currentState !== PHOTO_FRAME_STATE.ERROR && (
          <Image
            src={imageUrl}
            alt={alt || 'Uploaded image'}
            fill
            className={styles.image}
            style={{
              opacity: internalState.hasLoaded ? 1 : 0
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={false}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {/* Loading/Uploading State */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.UPLOADING && (
            <motion.div
              className={styles.loadingOverlay}
              variants={overlayVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              role="status"
              aria-live="polite"
              aria-label={`${config.ariaLabels.uploading}${progress > 0 ? ` - ${progress}% complete` : ''}`}
            >
              <div className={styles.spinner} />
              {progress > 0 && (
                <>
                  <div className={styles.progressBar} />
                  <span className={styles.progressText}>{Math.round(progress)}%</span>
                </>
              )}
              <span className={styles.srOnly}>
                {progress > 0 ? `Uploading... ${Math.round(progress)}%` : 'Loading image...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State with Placeholder Image */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.EMPTY && (
            <>
              {/* Background placeholder image */}
              <Image
                src={config.placeholderImage}
                alt="Placeholder image"
                fill
                className={styles.image}
                style={{
                  opacity: 0.5,
                  filter: 'grayscale(20%) brightness(0.8)'
                }}
                priority={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onLoad={() => {}} // Prevent triggering the main image load handler
              />

              {/* Upload icon overlay - only show for upload views (angle/fit), not tryon */}
              {viewType !== 'tryon' && (
                <motion.div
                  className={styles.placeholderArea}
                  data-disabled={disabled}
                  variants={overlayVariants}
                  initial="exit"
                  animate="enter"
                  exit="exit"
                  aria-describedby="upload-instructions"
                  style={{ background: 'transparent' }}
                >
                  <img
                    src={config.uploadIcon}
                    alt="Upload icon"
                    className={styles.placeholderIcon}
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.ERROR && (
            <motion.div
              className={styles.errorOverlay}
              variants={overlayVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              role="alert"
              aria-live="assertive"
            >
              <svg
                className={styles.errorIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span className={styles.errorText}>
                {error || 'Failed to load image'}
              </span>
              {onRetry && (
                <motion.button
                  className={styles.retryButton}
                  onClick={handleRetry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={disabled}
                >
                  Try Again
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Screen reader only text */}
      <span className={styles.srOnly}>
        PhotoFrame component in {currentState} state for {viewType} view
      </span>
    </motion.div>
  );
});

PhotoFrame.displayName = 'SharedPhotoFrame';