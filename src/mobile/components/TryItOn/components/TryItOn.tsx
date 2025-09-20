/**
 * @fileoverview TryItOn - Main presentation component for try-on interface
 * @module @/mobile/components/TryItOn/components/TryItOn
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoFrame, ProgressIndicator, ErrorDisplay } from '../../shared';
import { ActionButton, Button } from '../../shared/Button';
import type {
  TryItOnProps,
  TryItOnState,
  TryItOnViewState,
  TryItOnError,
  TRYITON_STATUS_MESSAGES
} from '../types';

/**
 * TryItOn Component - Main presentation component for try-on interface
 *
 * Features:
 * - PhotoFrame integration for mannequin and generated images
 * - ActionButton components for Try It On and Share actions
 * - Smooth fade-in transformation animation
 * - Loading states and error displays
 * - Responsive design for mobile devices
 * - Accessibility compliance with ARIA attributes
 * - Brutalist design system consistency
 *
 * @param props TryItOnProps
 * @returns JSX.Element
 */
export const TryItOn = React.memo<TryItOnProps>(function TryItOn({
  state,
  onTryItOn,
  onShare,
  onRetry,
  onClearError,
  config,
  disabled = false,
  className = '',
  testId = 'tryiton',
  style,
  ariaLabel,
  ariaDescribedBy
}) {
  // Refs for animation control
  const containerRef = useRef<HTMLDivElement>(null);
  const imageTransitionRef = useRef<HTMLDivElement>(null);

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  /**
   * Fade-in transformation animation variants
   */
  const transformationVariants = {
    initial: {
      opacity: 0,
      scale: 0.95
    },
    processing: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    transformed: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: config?.animation?.fadeInDuration ? config.animation.fadeInDuration / 1000 : 1,
        ease: 'easeInOut'
      }
    },
    error: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  /**
   * Button animation variants
   */
  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  /**
   * Determine PhotoFrame configuration based on view state
   */
  const photoFrameConfig = useMemo(() => {
    const baseConfig = {
      viewType: 'tryon' as const,
      aspectRatio: '3:4' as const
    };

    switch (state.viewState) {
      case 'initial':
        return {
          ...baseConfig,
          state: 'empty' as const
        };
      case 'processing':
        return {
          ...baseConfig,
          state: 'uploading' as const
        };
      case 'transformed':
        return {
          ...baseConfig,
          state: 'loaded' as const
        };
      case 'error':
        return {
          ...baseConfig,
          state: 'error' as const
        };
      default:
        return baseConfig;
    }
  }, [state.viewState]);

  /**
   * Determine which buttons should be visible
   */
  const buttonVisibility = useMemo(() => {
    return {
      showTryItOn: state.viewState === 'initial' && !state.isProcessing,
      showShare: state.viewState === 'transformed' && state.generatedImageUrl !== null,
      showRetry: state.viewState === 'error' && state.error?.retryable
    };
  }, [state.viewState, state.isProcessing, state.generatedImageUrl, state.error]);

  /**
   * Status message for current state
   */
  const statusMessage = useMemo(() => {
    if (state.isProcessing) {
      return TRYITON_STATUS_MESSAGES.PROCESSING;
    }
    if (state.error) {
      return state.error.message;
    }
    if (state.viewState === 'transformed') {
      return TRYITON_STATUS_MESSAGES.SUCCESS;
    }
    if (state.useMockData) {
      return TRYITON_STATUS_MESSAGES.MOCK_MODE;
    }
    return null;
  }, [state.isProcessing, state.error, state.viewState, state.useMockData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle try it on button click
   */
  const handleTryItOnClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled || state.isProcessing) return;
    onTryItOn();
  }, [disabled, state.isProcessing, onTryItOn]);

  /**
   * Handle share button click
   */
  const handleShareClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled) return;
    onShare();
  }, [disabled, onShare]);

  /**
   * Handle retry button click
   */
  const handleRetryClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled) return;
    onRetry();
  }, [disabled, onRetry]);

  /**
   * Handle PhotoFrame image load
   */
  const handleImageLoad = useCallback(() => {
    // Image loaded successfully
  }, []);

  /**
   * Handle PhotoFrame image error
   */
  const handleImageError = useCallback((error: Event) => {
    console.warn('PhotoFrame image error:', error);
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Clear error on successful state change
   */
  useEffect(() => {
    if (state.viewState === 'transformed' && state.error) {
      onClearError();
    }
  }, [state.viewState, state.error, onClearError]);

  /**
   * Reduced motion support
   */
  useEffect(() => {
    if (config?.animation?.respectReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        // Apply reduced motion styles if needed
        if (containerRef.current) {
          containerRef.current.style.transition = 'none';
        }
      }
    }
  }, [config?.animation?.respectReducedMotion]);

  // =============================================================================
  // STYLING
  // =============================================================================

  /**
   * Container CSS classes
   */
  const containerClasses = useMemo(() => [
    'tryiton',
    `tryiton--${state.viewState}`,
    state.isProcessing ? 'tryiton--processing' : '',
    state.error ? 'tryiton--error' : '',
    disabled ? 'tryiton--disabled' : '',
    className
  ].filter(Boolean).join(' '), [state.viewState, state.isProcessing, state.error, disabled, className]);

  /**
   * ARIA attributes
   */
  const ariaAttributes = useMemo(() => ({
    'aria-label': ariaLabel || 'Try It On interface',
    'aria-describedby': ariaDescribedBy,
    'aria-busy': state.isProcessing,
    'aria-live': state.isProcessing ? 'polite' : 'off',
    role: 'region'
  }), [ariaLabel, ariaDescribedBy, state.isProcessing]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <motion.div
      ref={containerRef}
      className={containerClasses}
      data-testid={testId}
      style={style}
      variants={transformationVariants}
      initial="initial"
      animate={state.viewState}
      {...ariaAttributes}
    >
      {/* Main PhotoFrame Container */}
      <div className="tryiton__photo-container">
        <PhotoFrame
          imageUrl={state.generatedImageUrl}
          alt={state.generatedImageUrl ? 'Generated try-on result' : 'Mannequin placeholder'}
          {...photoFrameConfig}
          progress={state.progress}
          error={state.error?.message}
          loading={state.isProcessing}
          disabled={disabled}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          testId={`${testId}-photoframe`}
          className="tryiton__photoframe"
        />

        {/* Transformation overlay for animation effects */}
        {state.viewState === 'processing' && (
          <motion.div
            ref={imageTransitionRef}
            className="tryiton__transformation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Custom transformation effect will be added here */}
          </motion.div>
        )}
      </div>

      {/* Action Buttons Container */}
      <div className="tryiton__actions">
        <AnimatePresence mode="wait">
          {/* Try It On Button */}
          {buttonVisibility.showTryItOn && (
            <motion.div
              key="tryiton-button"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="tryiton__action-container"
            >
              <ActionButton
                variant="tryon"
                size="large"
                onClick={handleTryItOnClick}
                disabled={disabled || state.isProcessing}
                state={state.isProcessing ? 'processing' : 'visible'}
                progress={state.progress}
                testId={`${testId}-tryiton-button`}
                viewType="tryon"
                ariaLabel="Generate virtual try-on"
                className="tryiton__tryiton-button"
                fullWidth
                config={{
                  immediateHide: true,
                  enableHapticFeedback: true
                }}
              />
            </motion.div>
          )}

          {/* Share Button */}
          {buttonVisibility.showShare && (
            <motion.div
              key="share-button"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="tryiton__action-container"
            >
              <ActionButton
                variant="share"
                size="large"
                onClick={handleShareClick}
                disabled={disabled}
                state="visible"
                testId={`${testId}-share-button`}
                viewType="tryon"
                ariaLabel="Share try-on result"
                className="tryiton__share-button"
                fullWidth
                config={{
                  immediateHide: true,
                  enableHapticFeedback: true
                }}
              />
            </motion.div>
          )}

          {/* Retry Button */}
          {buttonVisibility.showRetry && (
            <motion.div
              key="retry-button"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="tryiton__action-container"
            >
              <Button
                variant="secondary"
                size="medium"
                onClick={handleRetryClick}
                disabled={disabled}
                testId={`${testId}-retry-button`}
                viewType="tryon"
                ariaLabel="Retry try-on generation"
                className="tryiton__retry-button"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      {state.isProcessing && state.progress > 0 && (
        <div className="tryiton__progress">
          <ProgressIndicator
            progress={state.progress}
            message={statusMessage || undefined}
            testId={`${testId}-progress`}
            className="tryiton__progress-indicator"
          />
        </div>
      )}

      {/* Error Display */}
      {state.error && state.viewState === 'error' && (
        <div className="tryiton__error">
          <ErrorDisplay
            error={state.error.message}
            onRetry={state.error.retryable ? handleRetryClick : undefined}
            onDismiss={onClearError}
            testId={`${testId}-error`}
            className="tryiton__error-display"
          />
        </div>
      )}

      {/* Status Message for Screen Readers */}
      {statusMessage && (
        <div
          className="tryiton__status sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </div>
      )}

      {/* Mock Mode Indicator */}
      {state.useMockData && process.env.NODE_ENV === 'development' && (
        <div className="tryiton__mock-indicator">
          Mock Mode
        </div>
      )}
    </motion.div>
  );
});

TryItOn.displayName = 'TryItOn';