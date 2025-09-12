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
 * Styled components with 3:4 aspect ratio and brutalist design for fit uploads
 */
const StyledPhotoFrame = styled(motion.div)<{
  $aspectRatio: string;
  $disabled: boolean;
}>`
  position: relative;
  width: 70vw;
  max-width: 320px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 2px solid #000000;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  box-shadow: 4px 4px 0px #0066cc;
  will-change: transform;
  
  /* 3:4 Portrait aspect ratio implementation */
  aspect-ratio: 3 / 4;
  
  /* Fallback for browsers without aspect-ratio support */
  @supports not (aspect-ratio: 1) {
    &::before {
      content: '';
      display: block;
      padding-bottom: 133.33%; /* 4/3 * 100% for 3:4 ratio */
    }
    
    > * {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
  
  /* Touch interactions with scale animation */
  &:active:not([disabled]) {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
  
  &:hover:not([disabled]) {
    border-color: #000000;
    box-shadow: 3px 3px 0px #0066cc, 3px 3px 0px 2px #000000;
  }
  
  &:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  opacity: ${props => props.$disabled ? 0.6 : 1};
  
  /* Minimum touch target size for accessibility */
  min-height: 44px;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    will-change: auto;
    
    * {
      animation: none !important;
      transition: none !important;
    }
  }
  
  /* Container queries for responsive behavior */
  @container (max-width: 300px) {
    width: 85vw;
    border-radius: 12px;
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
  border-top: 3px solid #0066cc;
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
    background: #0066cc;
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
    background: rgba(0, 102, 204, 0.05);
  }
  
  &:focus {
    background: rgba(0, 102, 204, 0.1);
  }
  
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
`;

const FitUploadIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #0066cc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  box-shadow: 2px 2px 0px #000000;
  
  &::before {
    content: '👔';
    font-size: 32px;
    filter: grayscale(1) brightness(0) invert(1);
  }
`;

const PlaceholderText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #000000;
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
  border: 2px solid #000000;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 2px 2px 0px #000000;
  min-height: 44px;
  
  &:hover:not(:disabled) {
    background: #b91c1c;
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px #000000;
  }
  
  &:active:not(:disabled) {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px #000000;
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
 * PhotoFrame Component for Fit Uploads - Portrait 3:4 aspect ratio with brutalist design
 * 
 * Features:
 * - Fixed 3:4 portrait aspect ratio optimized for fit photos
 * - Brutalist design with thick borders, sharp corners, and bold shadows
 * - Four distinct states: empty, uploading, loaded, error
 * - Touch-friendly interactions with scale animations
 * - GPU-accelerated animations for smooth mobile performance
 * - Full accessibility support with ARIA labels and keyboard navigation
 * - Fit-specific upload icon and messaging
 * - Container queries for responsive behavior
 * - Error handling with retry functionality
 * - Progress indicator with percentage display
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
  aspectRatio = '3:4',
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
  testId = 'fit-photo-frame'
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

  // Parse aspect ratio for CSS (ensure 3:4 for fits)
  const parsedAspectRatio = React.useMemo(() => {
    // Force 3:4 aspect ratio for fit uploads
    return '3 / 4';
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

  // Touch interaction handlers with proper feedback
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

  // Click handler for mouse/desktop interactions
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

  // Animation variants for GPU acceleration
  const frameVariants = {
    pressed: { scale: 0.98 },
    unpressed: { scale: 1 }
  };

  const overlayVariants = {
    enter: { opacity: 1 },
    exit: { opacity: 0 }
  };

  // ARIA attributes for fit-specific context
  const ariaLabel = React.useMemo(() => {
    switch (currentState) {
      case PHOTO_FRAME_STATE.EMPTY:
        return 'Upload your fit photo - click or press to select a portrait image';
      case PHOTO_FRAME_STATE.UPLOADING:
        return `Uploading fit photo - ${progress}% complete`;
      case PHOTO_FRAME_STATE.LOADED:
        return alt || 'Uploaded fit photo';
      case PHOTO_FRAME_STATE.ERROR:
        return `Error loading fit photo: ${error || 'Unknown error'}. Click to retry.`;
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
            sizes="(max-width: 768px) 70vw, 320px"
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
              aria-label={`Uploading fit photo - ${progress}% complete`}
            >
              <Spinner />
              {progress > 0 && (
                <>
                  <ProgressBar $progress={progress} />
                  <ProgressText>{Math.round(progress)}%</ProgressText>
                </>
              )}
              <span className="sr-only">
                {progress > 0 ? `Uploading fit... ${Math.round(progress)}%` : 'Processing fit image...'}
              </span>
            </LoadingOverlay>
          )}
        </AnimatePresence>

        {/* Empty State with Fit-Specific Icon */}
        <AnimatePresence>
          {currentState === PHOTO_FRAME_STATE.EMPTY && (
            <>
              {/* Background placeholder image - fit-specific */}
              <StyledImage
                src="/images/zestyVogueColor.jpg"
                alt="Placeholder background for fit upload"
                fill
                style={{
                  opacity: 0.3,
                  filter: 'grayscale(40%) brightness(0.7)'
                }}
                priority={false}
                sizes="(max-width: 768px) 70vw, 320px"
              />
              
              {/* Fit upload icon overlay */}
              <PlaceholderArea
                $disabled={disabled}
                variants={overlayVariants}
                initial="exit"
                animate="enter"
                exit="exit"
                aria-describedby="fit-upload-instructions"
              >
                <FitUploadIcon />
                <PlaceholderText>Upload Your Fit</PlaceholderText>
                <PlaceholderHint>Portrait photo recommended</PlaceholderHint>
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
                {error || 'Failed to load fit photo'}
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
        Fit PhotoFrame component in {currentState} state
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

PhotoFrame.displayName = 'FitPhotoFrame';