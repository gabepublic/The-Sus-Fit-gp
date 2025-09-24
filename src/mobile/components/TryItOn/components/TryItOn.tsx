/**
 * @fileoverview TryItOn - Main presentation component for try-on interface
 * @module @/mobile/components/TryItOn/components/TryItOn
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoFrame, ProgressIndicator, ErrorDisplay } from '../../shared';
import { Button } from '../../shared/Button';
import styles from '../TryItOn.module.css';
import type {
  TryItOnProps,
  TryItOnState,
  TryItOnViewState,
  TryItOnError
} from '../types';
import {
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
   * Fade-in transformation animation variants - force opacity to 1 for all states
   */
  const transformationVariants = {
    initial: {
      opacity: 1,
      scale: 1
    },
    processing: {
      opacity: 1,
      scale: 1
    },
    transformed: {
      opacity: 1,
      scale: 1
    },
    error: {
      opacity: 1,
      scale: 1
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
        ease: [0.4, 0.0, 0.2, 1]
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
      showShare: state.viewState === 'transformed' && state.generatedImageUrl !== null
    };
  }, [state.viewState, state.isProcessing, state.generatedImageUrl]);

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
    console.log('🔘 TryItOn: Share button clicked', { disabled });
    if (disabled) return;
    console.log('🔄 TryItOn: Calling onShare callback');
    onShare();
  }, [disabled, onShare]);

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
    styles.tryiton,
    styles[`tryiton--${state.viewState}`],
    state.isProcessing ? styles['tryiton--processing'] : '',
    state.error ? styles['tryiton--error'] : '',
    disabled ? styles['tryiton--disabled'] : '',
    className
  ].filter(Boolean).join(' '), [state.viewState, state.isProcessing, state.error, disabled, className]);

  /**
   * ARIA attributes
   */
  const ariaAttributes = useMemo(() => ({
    'aria-label': ariaLabel || 'Try It On interface',
    'aria-describedby': ariaDescribedBy,
    'aria-busy': state.isProcessing,
    'aria-live': (state.isProcessing ? 'polite' : 'off') as 'polite' | 'off',
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
      <div className={styles.tryiton__content}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
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
            className={styles.tryiton__photoframe}
          />

          {/* Try It On Button - positioned to match Upload Fit button */}
          {buttonVisibility.showTryItOn && (
            <div style={{
              position: 'absolute',
              bottom: '70px',
              left: '-25px',
              zIndex: 20
            }}>
              <Button
                variant="primary"
                size="large"
                onClick={handleTryItOnClick}
                disabled={disabled || state.isProcessing}
                loading={state.isProcessing}
                testId={`${testId}-tryiton-button`}
                viewType="tryon"
                ariaLabel="Generate virtual try-on"
                className={styles.tryiton__tryiton_button}
              >
                {state.isProcessing ? 'Processing...' : 'Try It On'}
              </Button>
            </div>
          )}

          {/* Share Button - positioned to match Upload Fit Next button */}
          {buttonVisibility.showShare && (
            <div style={{
              position: 'absolute',
              bottom: '70px',
              right: '-30px',
              zIndex: 20
            }}>
              <Button
                variant="primary"
                size="large"
                onClick={handleShareClick}
                disabled={disabled}
                testId={`${testId}-share-button`}
                viewType="tryon"
                ariaLabel="Share try-on result"
                className={styles.tryiton__share_button}
              >
                Share
              </Button>
            </div>
          )}

          {/* Transformation overlay for animation effects */}
          {state.viewState === 'processing' && (
            <motion.div
              ref={imageTransitionRef}
              className={styles.tryiton__transformation}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Custom transformation effect will be added here */}
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons Container - No retry button to prevent expensive AI service spam */}

      {/* Progress Indicator */}
      {state.isProcessing && state.progress > 0 && (
        <div className={styles.tryiton__progress}>
          <ProgressIndicator
            progress={state.progress}
            testId={`${testId}-progress`}
            className={styles.tryiton__progress_indicator}
          />
        </div>
      )}

      {/* Error Display - No retry to prevent expensive AI service spam */}
      {state.error && state.viewState === 'error' && (
        <div className={styles.tryiton__error}>
          <ErrorDisplay
            error={state.error.message}
            onRetry={undefined}
            onDismiss={onClearError}
            testId={`${testId}-error`}
            className={styles.tryiton__error_display}
          />
        </div>
      )}

      {/* Status Message for Screen Readers */}
      {statusMessage && (
        <div
          className={`${styles.tryiton__status} ${styles.tryiton__sr_only}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </div>
      )}

      {/* Mock Mode Indicator */}
      {state.useMockData && process.env.NODE_ENV === 'development' && (
        <div className={styles.tryiton__mock_indicator}>
          Mock Mode
        </div>
      )}
    </motion.div>
  );
});

TryItOn.displayName = 'TryItOn';

export default TryItOn;