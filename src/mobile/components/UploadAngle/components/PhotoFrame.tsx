'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoFrameProps, PHOTO_FRAME_STATE } from '../types';

/**
 * Animation keyframes for styled-components
 */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

/**
 * Styled components with CSS-in-JS for complete isolation
 */
const StyledPhotoFrame = styled(motion.div)<{
  $aspectRatio: string;
  $disabled: boolean;
}>`
  position: relative;
  width: 70vw;
  height: 50vh;
  margin: 0 auto;
  border-radius: 2px;
  overflow: hidden;
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 2px solid #000000;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  box-shadow: 5px 5px 0px 0px #00BFFF, 5px 5px 0px 2px #000;
  
  /* Fallback for browsers without aspect-ratio support */
  @supports not (aspect-ratio: 1) {
    &::before {
      content: '';
      display: block;
      padding-bottom: ${props => {
        if (props.$aspectRatio === '4:3' || props.$aspectRatio === '4 / 3') return '75%';
        if (props.$aspectRatio === '16:9' || props.$aspectRatio === '16 / 9') return '56.25%';
        if (props.$aspectRatio === '1:1' || props.$aspectRatio === '1 / 1') return '100%';
        return '75%'; // Default to 4:3
      }};
    }
    
    > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
  
  &:hover:not([disabled]) {
    border-color: #000000;
    box-shadow: 4px 4px 0px 2px #00BFFF, 4px 4px 0px 4px #000000;
  }
  
  &:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  object-position: center;
  transition: opacity 0.2s ease-in-out;
  width: 100% !important;
  height: 100% !important;
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.95);
  z-index: 2;
  gap: 12px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  width: 80px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$progress}%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }
`;

const PlaceholderArea = styled(motion.div)<{ $disabled: boolean }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  gap: 16px;
  padding: 24px;
  transition: background-color 0.2s ease;
  
  &:hover:not([disabled]) {
    background: rgba(59, 130, 246, 0.05);
  }
  
  &:focus {
    background: rgba(59, 130, 246, 0.1);
  }
  
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
`;

const PlaceholderIcon = styled.svg`
  width: 80px;
  height: 80px;
  color: #22C55E;
  stroke-width: 3;
`;

const PlaceholderText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #475569;
`;

const PlaceholderHint = styled.span`
  font-size: 14px;
  color: #64748b;
  opacity: 0.8;
`;

const ErrorOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.95);
  z-index: 2;
  gap: 16px;
  padding: 24px;
  text-align: center;
`;

const ErrorIcon = styled.svg`
  width: 48px;
  height: 48px;
  color: #dc2626;
`;

const ErrorText = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
`;

const RetryButton = styled(motion.button)`
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #b91c1c;
  }
  
  &:focus {
    outline: 2px solid #dc2626;
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProgressText = styled.span`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * PhotoFrame Component - Advanced photo display with upload states, animations, and accessibility
 * 
 * Features:
 * - Four distinct states: empty, uploading, loaded, error
 * - CSS-in-JS styling with styled-components for complete isolation
 * - Fixed 4:3 aspect ratio with responsive design
 * - Touch-friendly interactions with proper preventDefault
 * - Framer Motion animations for smooth state transitions
 * - Full accessibility support with ARIA labels and keyboard navigation
 * - Error handling with retry functionality
 * - Upload progress indicator
 * - Screen reader announcements
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
  aspectRatio = '4:3',
  loading = false,
  disabled = false,
  onImageLoad,
  onImageError,
  onUpload,
  onRetry,
  onTouchStart,
  onTouchEnd,
  accept = 'image/*',
  className = '',
  testId = 'photo-frame'
}) {
  const [internalImageState, setInternalImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Determine current state based on props and internal state
  const currentState = React.useMemo(() => {
    if (state) return state;
    if (loading || (imageUrl && !hasLoaded && internalImageState === 'loading')) {
      return PHOTO_FRAME_STATE.UPLOADING;
    }
    if (error || internalImageState === 'error') {
      return PHOTO_FRAME_STATE.ERROR;
    }
    if (imageUrl && hasLoaded) {
      return PHOTO_FRAME_STATE.LOADED;
    }
    return PHOTO_FRAME_STATE.EMPTY;
  }, [state, loading, imageUrl, hasLoaded, internalImageState, error]);

  // Parse aspect ratio for CSS
  const parsedAspectRatio = React.useMemo(() => {
    if (aspectRatio === 'auto' || aspectRatio === 'inherit') return aspectRatio;
    if (typeof aspectRatio === 'string' && aspectRatio.includes(':')) {
      const [width, height] = aspectRatio.split(':').map(Number);
      return `${width} / ${height}`;
    }
    return aspectRatio;
  }, [aspectRatio]);

  // Image load handlers
  const handleImageLoad = useCallback(() => {
    setInternalImageState('loaded');
    setHasLoaded(true);
    onImageLoad?.();
  }, [onImageLoad]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setInternalImageState('error');
    onImageError?.(event.nativeEvent);
  }, [onImageError]);

  // Touch interaction handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    setIsPressed(true);
    onTouchStart?.(event);
  }, [disabled, onTouchStart]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    setIsPressed(false);
    onTouchEnd?.(event);
    
    if (currentState === PHOTO_FRAME_STATE.EMPTY || currentState === PHOTO_FRAME_STATE.ERROR) {
      onUpload?.(event);
      fileInputRef.current?.click();
    }
  }, [disabled, currentState, onTouchEnd, onUpload]);

  // Click handler for mouse interactions
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    event.preventDefault();
    
    if (currentState === PHOTO_FRAME_STATE.EMPTY || currentState === PHOTO_FRAME_STATE.ERROR) {
      onUpload?.(event);
      fileInputRef.current?.click();
    }
  }, [disabled, currentState, onUpload]);

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (currentState === PHOTO_FRAME_STATE.EMPTY || currentState === PHOTO_FRAME_STATE.ERROR) {
        onUpload?.(event);
        fileInputRef.current?.click();
      }
    }
  }, [disabled, currentState, onUpload]);

  // Retry handler
  const handleRetry = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onRetry?.();
  }, [onRetry]);

  // File input change handler
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      const syntheticEvent = {
        ...event,
        currentTarget: frameRef.current,
        target: frameRef.current
      } as unknown as React.MouseEvent;
      onUpload(syntheticEvent);
    }
  }, [onUpload]);

  // Reset internal state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setInternalImageState('loading');
      setHasLoaded(false);
    }
  }, [imageUrl]);

  // Animation variants
  const frameVariants = {
    pressed: { scale: 0.98 },
    unpressed: { scale: 1 }
  };

  const overlayVariants = {
    enter: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // ARIA attributes
  const ariaLabel = React.useMemo(() => {
    switch (currentState) {
      case PHOTO_FRAME_STATE.EMPTY:
        return 'Upload area - click or press to select an image';
      case PHOTO_FRAME_STATE.UPLOADING:
        return `Uploading image - ${progress}% complete`;
      case PHOTO_FRAME_STATE.LOADED:
        return alt || 'Uploaded image';
      case PHOTO_FRAME_STATE.ERROR:
        return `Error loading image: ${error || 'Unknown error'}. Click to retry.`;
      default:
        return alt;
    }
  }, [currentState, progress, alt, error]);

  return (
    <StyledPhotoFrame
      ref={frameRef}
      className={className}
      data-testid={testId}
      data-state={currentState}
      $aspectRatio={parsedAspectRatio}
      $disabled={disabled}
      variants={frameVariants}
      animate={isPressed ? 'pressed' : 'unpressed'}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role={currentState === PHOTO_FRAME_STATE.LOADED ? 'img' : 'button'}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
    >
      <Container>
        {/* Hidden file input for upload */}
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Main Image */}
        {imageUrl && currentState !== PHOTO_FRAME_STATE.ERROR && (
          <StyledImage
            src={imageUrl}
            alt={alt}
            fill
            style={{
              opacity: hasLoaded ? 1 : 0
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
            <LoadingOverlay
              variants={overlayVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              role="status"
              aria-live="polite"
              aria-label={`Uploading image - ${progress}% complete`}
            >
              <Spinner />
              {progress > 0 && (
                <>
                  <ProgressBar $progress={progress} />
                  <ProgressText>{Math.round(progress)}%</ProgressText>
                </>
              )}
              <span className="sr-only">
                {progress > 0 ? `Uploading... ${Math.round(progress)}%` : 'Loading image...'}
              </span>
            </LoadingOverlay>
          )}
        </AnimatePresence>

        {/* Empty State with Placeholder Image */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.EMPTY && (
            <>
              {/* Background placeholder image */}
              <StyledImage
                src="/images/zestyVogueColor.jpg"
                alt="Placeholder image"
                fill
                style={{
                  opacity: 0.5,
                  filter: 'grayscale(20%) brightness(0.8)'
                }}
                priority={false}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Upload icon overlay */}
              <PlaceholderArea
                $disabled={disabled}
                variants={overlayVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                aria-describedby="upload-instructions"
                style={{ background: 'transparent' }}
              >
                <img 
                  src="/images/mobile/UploadIcon.svg"
                  alt="Upload icon"
                  style={{
                    width: '80px',
                    height: '80px'
                  }}
                  aria-hidden="true"
                />
              </PlaceholderArea>
            </>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.ERROR && (
            <ErrorOverlay
              variants={overlayVariants}
              initial="exit"
              animate="enter"
              exit="exit"
              role="alert"
              aria-live="assertive"
            >
              <ErrorIcon
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </ErrorIcon>
              <ErrorText>
                {error || 'Failed to load image'}
              </ErrorText>
              {onRetry && (
                <RetryButton
                  onClick={handleRetry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={disabled}
                >
                  Try Again
                </RetryButton>
              )}
            </ErrorOverlay>
          )}
        </AnimatePresence>
      </Container>

      {/* Screen reader only text */}
      <span className="sr-only">
        PhotoFrame component in {currentState} state
      </span>

      <style jsx>{`
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
      `}</style>
    </StyledPhotoFrame>
  );
});

PhotoFrame.displayName = 'PhotoFrame';