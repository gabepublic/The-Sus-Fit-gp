/**
 * @fileoverview TryItOn - Main Try It On component with complete state management and UI flow
 * @module @/mobile/components/TryItOn/TryItOn
 * @version 2.0.0
 *
 * Complete Try It On component that integrates PhotoFrame, ActionButton management,
 * useTryItOnLogic hook, ImageTransformation animations, and comprehensive mobile UX.
 * This is the main component that orchestrates the entire try-on user experience.
 *
 * @example
 * ```typescript
 * import { TryItOn } from './TryItOn';
 *
 * <TryItOn
 *   config={{
 *     useMockData: true,
 *     mockDelay: 2000,
 *     enableAnimations: true
 *   }}
 *   onNavigateToShare={() => router.push('/m/share')}
 * />
 * ```
 */

'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/mobile/components/shared/hooks/useNavigation';
import { PhotoFrame } from '@/mobile/components/shared/PhotoFrame/PhotoFrame';
import type { PhotoFrameState } from '@/mobile/components/shared/PhotoFrame/PhotoFrame.types';
import { PHOTO_FRAME_STATE } from '@/mobile/components/shared/PhotoFrame/PhotoFrame.types';
import { ActionButton } from '@/mobile/components/shared/Button/ActionButton';
import { ImageTransformation } from './components/ImageTransformation';
import { useTryItOnLogic } from './hooks/useTryItOnLogic';
import { useMobileOptimization, getPerformanceConfig } from './hooks/useMobileOptimization';
import { getOptimizedVariants, transformComplete } from './animations/variants';
import type {
  TryItOnState as TryItOnStateType,
  TryItOnConfig,
  TryItOnError,
  TryItOnViewState
} from './types';
import styles from './TryItOn.module.css';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Try It On component configuration
 */
export interface TryItOnComponentConfig extends TryItOnConfig {
  /** Enable image transformation animations */
  enableAnimations?: boolean;
  /** Show mock mode indicator in development */
  showMockIndicator?: boolean;
  /** Custom navigation handler for Share button */
  customShareNavigation?: (generatedImageUrl: string) => void;
  /** Enable touch gesture support */
  enableGestures?: boolean;
  /** Custom error messages */
  customErrorMessages?: Record<string, string>;
}

/**
 * Component props interface
 */
export interface TryItOnProps {
  /** Component configuration */
  config?: TryItOnComponentConfig;
  /** Initial state override */
  initialState?: Partial<TryItOnStateType>;
  /** Custom navigation handler for Share action */
  onNavigateToShare?: (generatedImageUrl: string) => void;
  /** Callback when try-on process starts */
  onTryItOnStart?: () => void;
  /** Callback when try-on process completes */
  onTryItOnComplete?: (generatedImageUrl: string) => void;
  /** Callback when error occurs */
  onError?: (error: TryItOnError) => void;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** ARIA label for component */
  ariaLabel?: string;
  /** ARIA described by */
  ariaDescribedBy?: string;
}

/**
 * Internal component state for UI management
 */
interface UIState {
  /** Whether component is mounted and ready */
  isReady: boolean;
  /** Focus management state */
  focusState: 'none' | 'button' | 'photoframe' | 'error';
  /** Last interaction timestamp */
  lastInteraction: number;
  /** Gesture state for touch interactions */
  gestureState: 'idle' | 'touching' | 'dragging';
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default component configuration
 */
const DEFAULT_CONFIG: Required<TryItOnComponentConfig> = {
  useMockData: process.env.NODE_ENV === 'development',
  mockDelay: 2000,
  mockSuccessRate: 1.0,
  mockImageUrls: [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3'
  ],
  animation: {
    fadeInDuration: 1000,
    respectReducedMotion: true
  },
  navigation: {
    shareRoute: '/m/share',
    enablePrefetch: true
  },
  errorHandling: {
    autoRetry: false,
    maxRetries: 3
  },
  enableAnimations: true,
  showMockIndicator: process.env.NODE_ENV === 'development',
  customShareNavigation: undefined,
  enableGestures: true,
  customErrorMessages: {}
};

/**
 * Animation variants for the main container
 */
const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  processing: {
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

/**
 * Button animation variants
 */
const buttonContainerVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TryItOn Component - Complete try-on experience with state management and animations
 */
export const TryItOn = React.memo<TryItOnProps>(function TryItOn({
  config = {},
  initialState,
  onNavigateToShare,
  onTryItOnStart,
  onTryItOnComplete,
  onError,
  className = '',
  testId = 'tryiton',
  disabled = false,
  style,
  ariaLabel,
  ariaDescribedBy
}) {
  // Configuration setup
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Navigation hook with prefetching for optimal performance
  const {
    navigate: navigateToShare,
    prefetch: prefetchShare,
    isNavigating: isNavigatingToShare,
    navigationError,
    canNavigate
  } = useNavigation({
    targetRoute: '/m/share',
    enablePrefetch: true,
    enableLogging: process.env.NODE_ENV === 'development',
    onNavigationStart: () => {
      // Navigation started - could trigger analytics
    },
    onNavigationSuccess: (route) => {
      // Navigation completed successfully
      if (onTryItOnComplete && state.generatedImageUrl) {
        onTryItOnComplete(state.generatedImageUrl);
      }
    },
    onNavigationError: (error) => {
      // Handle navigation error
      if (onError) {
        onError({
          type: 'navigation',
          message: `Failed to navigate to share: ${error.message}`,
          retryable: true,
          originalError: error
        });
      }
    }
  });

  // Mobile optimization hook
  const mobileConfig = useMobileOptimization();
  const performanceConfig = getPerformanceConfig(
    mobileConfig.performanceLevel,
    mobileConfig.prefersReducedMotion
  );

  // Main state management hook with mobile optimizations
  const { state, actions, utils } = useTryItOnLogic({
    ...finalConfig,
    initialMockScenario: 'success',
    autoTransitions: true,
    // Apply performance optimizations
    animation: {
      ...finalConfig.animation,
      fadeInDuration: performanceConfig.animationDuration,
      respectReducedMotion: mobileConfig.prefersReducedMotion
    }
  });

  // Internal UI state
  const [uiState, setUIState] = useState<UIState>({
    isReady: false,
    focusState: 'none',
    lastInteraction: 0,
    gestureState: 'idle'
  });

  // Refs for accessibility and interaction management
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  /**
   * Determine current button configuration based on state
   */
  const buttonConfig = useMemo(() => {
    const canTryItOn = utils.canTryItOn();
    const canShare = utils.canShare();
    const isLoading = utils.isLoading();
    const hasError = utils.hasError();

    // Define button states for each stage of the try-on workflow
    const baseConfig = {
      showTryItOn: false,
      showShare: false,
      showRetry: false,
      hideAllButtons: false,
      tryItOnState: 'hidden' as const,
      shareState: 'hidden' as const,
      retryState: 'hidden' as const
    };

    // Error state - show retry if applicable
    if (hasError && state.error?.retryable && !disabled) {
      return {
        ...baseConfig,
        showRetry: true,
        retryState: 'visible' as const
      };
    }

    // Processing state - hide all buttons
    if (isLoading || state.viewState === 'processing') {
      return {
        ...baseConfig,
        hideAllButtons: true
      };
    }

    // Initial state - show Try It On button
    if (canTryItOn && state.viewState === 'initial' && !disabled) {
      return {
        ...baseConfig,
        showTryItOn: true,
        tryItOnState: 'visible' as const
      };
    }

    // Transformed state - show Share button
    if (canShare && state.viewState === 'transformed' && !disabled) {
      return {
        ...baseConfig,
        showShare: true,
        shareState: 'visible' as const
      };
    }

    return baseConfig;
  }, [state, utils, disabled]);

  /**
   * Handle retry button click
   */
  const handleRetryClick = useCallback(async () => {
    if (disabled || !state.error?.retryable) return;

    setUIState(prev => ({ ...prev, lastInteraction: Date.now() }));

    try {
      await actions.retry();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';

      if (onError) {
        onError({
          type: 'component',
          message: errorMessage,
          retryable: true
        });
      }
    }
  }, [disabled, state.error, actions, onError]);

  /**
   * PhotoFrame configuration based on current state
   */
  const photoFrameConfig = useMemo(() => {
    // Map TryItOn state to PhotoFrame state
    const getPhotoFrameState = (): PhotoFrameState => {
      if (state.error) {
        return PHOTO_FRAME_STATE.ERROR;
      }
      if (state.isProcessing) {
        return PHOTO_FRAME_STATE.UPLOADING;
      }
      if (state.generatedImageUrl && state.viewState === 'transformed') {
        return PHOTO_FRAME_STATE.LOADED;
      }
      return PHOTO_FRAME_STATE.EMPTY;
    };

    const baseConfig = {
      viewType: 'tryon' as const,
      state: getPhotoFrameState(),
      imageUrl: state.viewState === 'transformed' ? state.generatedImageUrl : null,
      loading: state.isProcessing,
      progress: state.progress,
      error: state.error?.message,
      disabled: disabled || state.isProcessing,
      aspectRatio: '3:4' as const, // Portrait orientation for try-on results
      onRetry: state.error?.retryable ? handleRetryClick : undefined
    };

    // Add state-specific configurations
    switch (state.viewState) {
      case 'initial':
        return {
          ...baseConfig,
          alt: 'Mannequin placeholder - ready for try-on',
          imageUrl: null // Show placeholder mannequin
        };
      case 'processing':
        return {
          ...baseConfig,
          alt: 'Generating your try-on result',
          imageUrl: null // Keep placeholder during processing
        };
      case 'transformed':
        return {
          ...baseConfig,
          alt: 'Your try-on result - ready to share',
          imageUrl: state.generatedImageUrl
        };
      case 'error':
        return {
          ...baseConfig,
          alt: 'Error occurred - click to retry',
          imageUrl: null
        };
      default:
        return baseConfig;
    }
  }, [state, disabled, handleRetryClick]);

  /**
   * ARIA attributes for the container
   */
  const ariaAttributes = useMemo(() => ({
    'aria-label': ariaLabel || 'Try It On interface',
    'aria-describedby': ariaDescribedBy,
    'aria-busy': state.isProcessing,
    'aria-live': state.isProcessing ? 'polite' : 'off',
    role: 'main'
  }), [ariaLabel, ariaDescribedBy, state.isProcessing]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle Try It On button click
   */
  const handleTryItOnClick = useCallback(async () => {
    if (disabled || !utils.canTryItOn()) return;

    setUIState(prev => ({ ...prev, lastInteraction: Date.now() }));

    if (onTryItOnStart) {
      onTryItOnStart();
    }

    try {
      await actions.tryItOn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Try-on failed';

      if (onError) {
        onError({
          type: 'component',
          message: errorMessage,
          retryable: true
        });
      }
    }
  }, [disabled, utils, actions, onTryItOnStart, onError]);

  /**
   * Handle Share button click with optimized navigation
   */
  const handleShareClick = useCallback(async () => {
    if (disabled || !utils.canShare() || !state.generatedImageUrl || !canNavigate) return;

    setUIState(prev => ({ ...prev, lastInteraction: Date.now() }));

    try {
      // Check for custom navigation first
      if (finalConfig.customShareNavigation) {
        finalConfig.customShareNavigation(state.generatedImageUrl);
        return;
      }

      if (onNavigateToShare) {
        onNavigateToShare(state.generatedImageUrl);
        return;
      }

      // Use the navigation hook for optimized routing
      await navigateToShare();

      // Update try-on state after successful navigation
      await actions.share();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share navigation failed';

      if (onError) {
        onError({
          type: 'navigation',
          message: errorMessage,
          retryable: true,
          originalError: error instanceof Error ? error : undefined
        });
      }
    }
  }, [
    disabled,
    utils,
    state.generatedImageUrl,
    canNavigate,
    finalConfig,
    onNavigateToShare,
    navigateToShare,
    actions,
    onError
  ]);


  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Simple keyboard shortcuts for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      if (buttonConfig.showTryItOn) {
        event.preventDefault();
        handleTryItOnClick();
      } else if (buttonConfig.showShare) {
        event.preventDefault();
        handleShareClick();
      } else if (buttonConfig.showRetry) {
        event.preventDefault();
        handleRetryClick();
      }
    }

    // Escape key to clear error
    if (event.key === 'Escape' && state.error) {
      event.preventDefault();
      actions.clearError();
    }
  }, [buttonConfig, handleTryItOnClick, handleShareClick, handleRetryClick, state.error, actions]);

  /**
   * Handle touch interactions for gesture support and mobile optimization
   */
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!finalConfig.enableGestures) return;

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    setUIState(prev => ({
      ...prev,
      gestureState: 'touching',
      lastInteraction: Date.now()
    }));

    // Prevent default to avoid iOS bounce effects
    event.preventDefault();
  }, [finalConfig.enableGestures]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!finalConfig.enableGestures || !touchStartRef.current) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // If user is dragging beyond threshold, update gesture state
    if (deltaX > 10 || deltaY > 10) {
      setUIState(prev => ({ ...prev, gestureState: 'dragging' }));
    }
  }, [finalConfig.enableGestures]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!finalConfig.enableGestures || !touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Small tap detection for accessibility
    if (deltaX < 10 && deltaY < 10) {
      // Handle tap gestures if needed
      const target = event.target as HTMLElement;
      if (target.closest('[role="button"]') || target.closest('button')) {
        // Tap on interactive element - add haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }

    setUIState(prev => ({ ...prev, gestureState: 'idle' }));
    touchStartRef.current = null;
  }, [finalConfig.enableGestures]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Initialize component and handle cleanup
   */
  useEffect(() => {
    setUIState(prev => ({ ...prev, isReady: true }));

    // Cleanup function for component unmount
    return () => {
      // The hook handles its own cleanup, but we can add component-specific cleanup here
      setUIState({
        isReady: false,
        focusState: 'none',
        lastInteraction: 0,
        gestureState: 'idle'
      });
    };
  }, []);

  /**
   * Prefetch share route and optimize performance
   */
  useEffect(() => {
    // Prefetch the share route when component mounts
    prefetchShare();

    // Preload critical resources for share page
    const preloadCriticalResources = () => {
      // Preload share page CSS
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/m/share';
      link.as = 'document';
      document.head.appendChild(link);

      // Preload common social sharing icons/scripts if needed
      // This would be specific to the share page implementation
    };

    // Delay preloading to avoid blocking initial render
    const timeoutId = setTimeout(preloadCriticalResources, 1000);

    return () => clearTimeout(timeoutId);
  }, [prefetchShare]);

  /**
   * Intelligent prefetching based on user interactions
   */
  useEffect(() => {
    // If user has a generated image and is in transformed state, aggressively prefetch
    if (state.generatedImageUrl && state.viewState === 'transformed') {
      // User is likely to share, prefetch again to ensure route is ready
      prefetchShare();
    }
  }, [state.generatedImageUrl, state.viewState, prefetchShare]);

  /**
   * Performance monitoring for navigation
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Mark navigation performance when share navigation starts/ends
      if (isNavigatingToShare) {
        performance.mark('share-navigation-start');
      } else if (!isNavigatingToShare && performance.getEntriesByName('share-navigation-start').length > 0) {
        performance.mark('share-navigation-end');
        try {
          performance.measure('share-navigation-duration', 'share-navigation-start', 'share-navigation-end');

          if (process.env.NODE_ENV === 'development') {
            const measure = performance.getEntriesByName('share-navigation-duration')[0];
            console.log(`[TryItOn] Share navigation took ${measure.duration}ms`);
          }

          // Clean up performance marks
          performance.clearMarks('share-navigation-start');
          performance.clearMarks('share-navigation-end');
          performance.clearMeasures('share-navigation-duration');
        } catch (error) {
          // Performance API errors are non-critical
          console.warn('[TryItOn] Performance measurement failed:', error);
        }
      }
    }
  }, [isNavigatingToShare]);

  /**
   * Handle state changes for accessibility announcements and callbacks
   */
  useEffect(() => {
    if (!uiState.isReady) return;

    // Call external callbacks based on state changes
    switch (state.viewState) {
      case 'processing':
        document.title = 'Generating your try-on result...';
        if (onTryItOnStart && !state.error) {
          // Only call onTryItOnStart if we just entered processing and there's no error
        }
        break;
      case 'transformed':
        document.title = 'Try-on result ready - Share your look';
        if (onTryItOnComplete && state.generatedImageUrl) {
          onTryItOnComplete(state.generatedImageUrl);
        }
        break;
      case 'error':
        document.title = `Error: ${state.error?.message || 'Something went wrong'}`;
        if (onError && state.error) {
          onError(state.error);
        }
        break;
      default:
        document.title = 'Try It On - Virtual Fashion';
        break;
    }
  }, [state.viewState, state.error, state.generatedImageUrl, uiState.isReady, onTryItOnStart, onTryItOnComplete, onError]);

  /**
   * Handle focus management during state transitions
   */
  useEffect(() => {
    if (!uiState.isReady) return;

    // Manage focus based on state
    if (buttonConfig.showTryItOn) {
      setUIState(prev => ({ ...prev, focusState: 'button' }));
    } else if (buttonConfig.showShare) {
      setUIState(prev => ({ ...prev, focusState: 'button' }));
    } else if (state.error) {
      setUIState(prev => ({ ...prev, focusState: 'error' }));
    } else {
      setUIState(prev => ({ ...prev, focusState: 'photoframe' }));
    }
  }, [buttonConfig, state.error, uiState.isReady]);

  /**
   * Handle progress updates for PhotoFrame integration
   */
  useEffect(() => {
    // Ensure progress is properly propagated to PhotoFrame configuration
    if (state.isProcessing && state.progress > 0) {
      // Progress is already handled by photoFrameConfig memoization
      // This effect ensures the progress updates trigger re-renders
    }
  }, [state.progress, state.isProcessing]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const containerClasses = [
    styles.tryiton,
    styles[`tryiton--${state.viewState}`] || '',
    state.isProcessing ? styles['tryiton--processing'] : '',
    state.error ? styles['tryiton--error'] : '',
    disabled ? styles['tryiton--disabled'] : '',
    uiState.gestureState !== 'idle' ? styles[`tryiton--${uiState.gestureState}`] || '' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      ref={containerRef}
      className={containerClasses}
      style={style}
      data-testid={testId}
      data-state={state.viewState}
      data-ready={uiState.isReady}
      variants={containerVariants}
      initial="hidden"
      animate={state.viewState === 'processing' ? 'processing' : 'visible'}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      {...ariaAttributes}
    >
      {/* Main Photo Frame / Image Transformation Area */}
      <div className={styles.tryiton__content}>
        {finalConfig.enableAnimations && state.viewState === 'processing' && state.generatedImageUrl ? (
          <ImageTransformation
            mannequinImageUrl="/images/mobile/mannequin.png"
            generatedImageUrl={state.generatedImageUrl}
            isTransforming={true}
            progress={state.progress / 100}
            onTransformationComplete={() => {
              // Animation complete, trigger state update if needed
            }}
            onError={(errorMessage) => {
              if (onError) {
                onError({
                  type: 'animation',
                  message: errorMessage,
                  retryable: true
                });
              }
            }}
            config={{
              enablePerformanceMonitoring: finalConfig.showMockIndicator,
              animationDuration: finalConfig.animation?.fadeInDuration || 1000,
              accessibility: {
                enableAnnouncements: true,
                announceProgress: true
              },
              debug: finalConfig.showMockIndicator
            }}
            className={styles.tryiton__transformation}
            testId={`${testId}-transformation`}
            alt="Try-on transformation animation"
          />
        ) : (
          <PhotoFrame
            {...photoFrameConfig}
            onImageLoad={() => {
              // Handle image load
            }}
            onImageError={(error) => {
              if (onError) {
                onError({
                  type: 'component',
                  message: 'Failed to load image',
                  retryable: true,
                  originalError: error
                });
              }
            }}
            testId={`${testId}-photoframe`}
            className={styles.tryiton__photoframe}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.tryiton__actions}>
        <AnimatePresence mode="wait">
          {/* Try It On Button */}
          {buttonConfig.showTryItOn && (
            <motion.div
              key="tryiton-button"
              variants={buttonContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.tryiton__button_container}
            >
              <ActionButton
                variant="tryon"
                size="large"
                onClick={handleTryItOnClick}
                disabled={disabled || state.isProcessing}
                state={buttonConfig.tryItOnState}
                testId={`${testId}-tryiton-button`}
                viewType="tryon"
                ariaLabel="Generate virtual try-on"
                className={styles.tryiton__tryiton_button}
                fullWidth
                config={{
                  immediateHide: true,
                  enableHapticFeedback: performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration,
                  autoHide: true,
                  autoHideDelay: 100 // Quick hide after click
                }}
                onBeforeAction={(variant) => {
                  // Performance-aware haptic feedback
                  if (performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration) {
                    navigator.vibrate(50);
                  }
                }}
              />
            </motion.div>
          )}

          {/* Share Button */}
          {buttonConfig.showShare && (
            <motion.div
              key="share-button"
              variants={buttonContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.tryiton__button_container}
            >
              <ActionButton
                variant="share"
                size="large"
                onClick={handleShareClick}
                disabled={disabled || !state.generatedImageUrl || isNavigatingToShare}
                state={buttonConfig.shareState}
                testId={`${testId}-share-button`}
                viewType="tryon"
                ariaLabel="Share try-on result"
                className={styles.tryiton__share_button}
                fullWidth
                config={{
                  immediateHide: false, // Don't auto-hide share button
                  enableHapticFeedback: performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration,
                  showSuccessFeedback: performanceConfig.enableAnimations,
                  successFeedbackDuration: performanceConfig.animationDuration,
                  // Performance optimizations for navigation
                  prefetchOnHover: true, // Prefetch when user hovers/touches
                  optimizeForNavigation: true // Reduce animation complexity during navigation
                }}
                onBeforeAction={(variant) => {
                  // Success haptic pattern for share action
                  if (performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration) {
                    navigator.vibrate([50, 50, 100]);
                  }
                }}
              />
            </motion.div>
          )}

          {/* Retry Button */}
          {buttonConfig.showRetry && (
            <motion.div
              key="retry-button"
              variants={buttonContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.tryiton__button_container}
            >
              <ActionButton
                variant="tryon"
                size="large"
                onClick={handleRetryClick}
                disabled={disabled || !state.error?.retryable}
                state={buttonConfig.retryState}
                testId={`${testId}-retry-button`}
                viewType="tryon"
                ariaLabel="Retry try-on generation"
                className={styles.tryiton__retry_button}
                fullWidth
                config={{
                  immediateHide: true,
                  enableHapticFeedback: performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration,
                  autoHide: true,
                  autoHideDelay: 100
                }}
                onBeforeAction={(variant) => {
                  // Error retry haptic pattern
                  if (performanceConfig.enableHaptics && mobileConfig.capabilities.hasVibration) {
                    navigator.vibrate([100, 50, 100]);
                  }
                }}
              >
                Try Again
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      {state.isProcessing && state.progress > 0 && (
        <div className={styles.tryiton__progress}>
          <div className={styles.tryiton__progress_bar}>
            <div
              className={styles.tryiton__progress_fill}
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <span className={styles.tryiton__progress_text}>
            Generating your try-on... {Math.round(state.progress)}%
          </span>
        </div>
      )}

      {/* Error Display */}
      {state.error && state.viewState === 'error' && (
        <div className={styles.tryiton__error}>
          <div className={styles.tryiton__error_message}>
            {finalConfig.customErrorMessages[state.error.type] || state.error.message}
          </div>
          {state.error.retryable && (
            <button
              onClick={handleRetryClick}
              className={styles.tryiton__error_retry}
              disabled={disabled}
            >
              Try Again
            </button>
          )}
          <button
            onClick={actions.clearError}
            className={styles.tryiton__error_dismiss}
            disabled={disabled}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mock Mode Indicator */}
      {finalConfig.showMockIndicator && state.useMockData && (
        <div className={styles.tryiton__mock_indicator}>
          <span>Mock Mode</span>
        </div>
      )}

      {/* Comprehensive Accessibility live regions */}
      <div
        className={styles.tryiton__sr_only}
        aria-live="polite"
        aria-atomic="true"
        id={`${testId}-status`}
        role="status"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {state.viewState === 'processing' && `Generating try-on... ${Math.round(state.progress)}% complete`}
        {state.viewState === 'transformed' && 'Try-on complete. Share button is now available.'}
        {isNavigatingToShare && 'Navigating to share page...'}
        {state.error && `Error: ${state.error.message}`}
        {navigationError && `Navigation error: ${navigationError.message}`}
      </div>

      {/* Alert region for important announcements */}
      <div
        className={styles.tryiton__sr_only}
        aria-live="assertive"
        aria-atomic="true"
        id={`${testId}-alert`}
        role="alert"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {state.error && state.viewState === 'error' && `Alert: ${state.error.message}${state.error.retryable ? ' You can try again.' : ''}`}
      </div>
    </motion.div>
  );
});

TryItOn.displayName = 'TryItOn';

// =============================================================================
// EXPORTS
// =============================================================================

export default TryItOn;

export type {
  TryItOnProps,
  TryItOnComponentConfig,
  UIState
};