/**
 * @fileoverview ImageTransitionContainer - AnimatePresence wrapper for smooth image transitions
 * @module @/mobile/components/TryItOn/components/ImageTransitionContainer
 * @version 1.0.0
 *
 * This component provides coordinated image transitions using Framer Motion's AnimatePresence
 * with sophisticated enter/exit animations that work harmoniously with the fade effect.
 * Manages animation timing, state synchronization, and interruption handling for the
 * Try It On transformation sequence.
 *
 * @example
 * ```typescript
 * import { ImageTransitionContainer } from './ImageTransitionContainer';
 *
 * <ImageTransitionContainer
 *   currentImage="/mannequin.png"
 *   nextImage="/generated-result.jpg"
 *   isTransitioning={true}
 *   transitionMode="transform"
 *   onTransitionComplete={() => console.log('Transition complete')}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion';
import { imageSwap, fadeInFromTop, getOptimizedVariants } from '../animations/variants';
import { FadeTransition } from '../animations/FadeTransition';
import { useImagePreloader } from '../hooks/useImagePreloader';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Transition modes for different animation styles
 */
export type TransitionMode =
  | 'instant'      // No animation, instant switch
  | 'crossfade'    // Simple opacity crossfade
  | 'slide'        // Slide transition
  | 'transform'    // Full transformation with fade effect
  | 'zoom'         // Scale-based transition
  | 'custom';      // Custom animation variants

/**
 * Transition direction for directional animations
 */
export type TransitionDirection = 'up' | 'down' | 'left' | 'right' | 'center';

/**
 * Animation timing configuration
 */
export interface TransitionTiming {
  /** Duration for enter animation */
  enterDuration: number;
  /** Duration for exit animation */
  exitDuration: number;
  /** Delay between exit and enter */
  staggerDelay: number;
  /** Custom easing curve */
  easing?: string | number[];
}

/**
 * Container configuration
 */
export interface ImageTransitionConfig {
  /** Animation timing settings */
  timing?: Partial<TransitionTiming>;
  /** Enable image preloading */
  enablePreloading?: boolean;
  /** Preload next image when transition starts */
  preloadOnTransition?: boolean;
  /** Enable hardware acceleration */
  useHardwareAcceleration?: boolean;
  /** Respect reduced motion preference */
  respectReducedMotion?: boolean;
  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Component props interface
 */
export interface ImageTransitionContainerProps {
  /** Current image URL */
  currentImage: string;
  /** Next image URL (for preloading and transition) */
  nextImage?: string;
  /** Whether transition is currently active */
  isTransitioning: boolean;
  /** Transition animation mode */
  transitionMode?: TransitionMode;
  /** Direction for directional transitions */
  direction?: TransitionDirection;
  /** Transition progress (0-1) for controlled animations */
  progress?: number;
  /** Container configuration */
  config?: ImageTransitionConfig;
  /** Callback when transition starts */
  onTransitionStart?: () => void;
  /** Callback when transition completes */
  onTransitionComplete?: () => void;
  /** Callback for progress updates */
  onProgressUpdate?: (progress: number) => void;
  /** Callback when image fails to load */
  onImageError?: (error: string) => void;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Alternative text for images */
  alt?: string;
  /** Custom animation variants */
  customVariants?: any;
  /** Aspect ratio for container */
  aspectRatio?: string;
}

/**
 * Internal transition state
 */
interface TransitionState {
  /** Current phase of transition */
  phase: 'idle' | 'exiting' | 'entering' | 'complete';
  /** Currently displayed image */
  displayedImage: string;
  /** Image being transitioned to */
  targetImage: string | null;
  /** Animation start timestamp */
  startTime: number | null;
  /** Whether transition was interrupted */
  wasInterrupted: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default timing configuration
 */
const DEFAULT_TIMING: TransitionTiming = {
  enterDuration: 800,
  exitDuration: 400,
  staggerDelay: 100,
  easing: [0.25, 0.46, 0.45, 0.94]
};

/**
 * Default container configuration
 */
const DEFAULT_CONFIG: Required<ImageTransitionConfig> = {
  timing: DEFAULT_TIMING,
  enablePreloading: true,
  preloadOnTransition: true,
  useHardwareAcceleration: true,
  respectReducedMotion: true,
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Mode-specific animation variants
 */
const TRANSITION_VARIANTS = {
  instant: {
    enter: { opacity: 1 },
    exit: { opacity: 0 }
  },
  crossfade: {
    enter: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  },
  slide: {
    enter: (direction: TransitionDirection) => ({
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    }),
    exit: (direction: TransitionDirection) => ({
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeIn' }
    })
  },
  zoom: {
    enter: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
    exit: {
      scale: 1.1,
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeIn' }
    }
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get animation variants based on transition mode
 */
function getTransitionVariants(
  mode: TransitionMode,
  direction: TransitionDirection,
  customVariants?: any
) {
  if (mode === 'custom' && customVariants) {
    return customVariants;
  }

  if (mode === 'transform') {
    return fadeInFromTop;
  }

  const variants = TRANSITION_VARIANTS[mode as keyof typeof TRANSITION_VARIANTS];

  if (!variants) {
    return TRANSITION_VARIANTS.crossfade;
  }

  // Apply direction to variants that support it
  if (typeof variants.enter === 'function') {
    return {
      enter: variants.enter(direction),
      exit: variants.exit(direction)
    };
  }

  return variants;
}

/**
 * Check if transition should be reduced for accessibility
 */
function shouldReduceTransition(respectReducedMotion: boolean): boolean {
  if (!respectReducedMotion || typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ImageTransitionContainer Component - Coordinated image transitions with AnimatePresence
 */
export const ImageTransitionContainer = React.memo<ImageTransitionContainerProps>(
function ImageTransitionContainer({
  currentImage,
  nextImage,
  isTransitioning,
  transitionMode = 'crossfade',
  direction = 'center',
  progress,
  config = {},
  onTransitionStart,
  onTransitionComplete,
  onProgressUpdate,
  onImageError,
  className = '',
  testId = 'image-transition-container',
  alt = 'Image transition',
  customVariants,
  aspectRatio = '3:4'
}) {
  // Configuration setup
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  const timing = useMemo(
    () => ({ ...DEFAULT_TIMING, ...finalConfig.timing }),
    [finalConfig.timing]
  );

  // Image preloader hook
  const imagePreloader = useImagePreloader({
    cacheSize: 10,
    timeout: 8000,
    debug: finalConfig.debug
  });

  // Internal state
  const [transitionState, setTransitionState] = useState<TransitionState>({
    phase: 'idle',
    displayedImage: currentImage,
    targetImage: null,
    startTime: null,
    wasInterrupted: false
  });

  // Animation controls
  const controls = useAnimation();
  const progressMotionValue = useMotionValue(0);

  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (finalConfig.debug) {
      console.log('[ImageTransitionContainer]', ...args);
    }
  }, [finalConfig.debug]);

  // =============================================================================
  // ANIMATION MANAGEMENT
  // =============================================================================

  /**
   * Start transition animation
   */
  const startTransition = useCallback(async () => {
    if (!nextImage || transitionState.phase !== 'idle') {
      return;
    }

    log('Starting transition:', currentImage, '->', nextImage);

    // Preload next image if enabled
    if (finalConfig.enablePreloading && finalConfig.preloadOnTransition) {
      try {
        await imagePreloader.preloadImage(nextImage);
        log('Next image preloaded successfully');
      } catch (error) {
        log('Failed to preload next image:', error);
        if (onImageError) {
          onImageError(`Failed to preload image: ${error}`);
        }
      }
    }

    // Update transition state
    setTransitionState(prev => ({
      ...prev,
      phase: 'exiting',
      targetImage: nextImage,
      startTime: performance.now(),
      wasInterrupted: false
    }));

    if (onTransitionStart) {
      onTransitionStart();
    }
  }, [
    nextImage,
    currentImage,
    transitionState.phase,
    finalConfig.enablePreloading,
    finalConfig.preloadOnTransition,
    imagePreloader,
    onTransitionStart,
    onImageError,
    log
  ]);

  /**
   * Complete transition animation
   */
  const completeTransition = useCallback(() => {
    log('Completing transition');

    setTransitionState(prev => ({
      ...prev,
      phase: 'complete',
      displayedImage: prev.targetImage || prev.displayedImage,
      targetImage: null
    }));

    // Reset to idle after a brief delay
    timeoutRef.current = setTimeout(() => {
      setTransitionState(prev => ({
        ...prev,
        phase: 'idle',
        startTime: null
      }));

      if (onTransitionComplete) {
        onTransitionComplete();
      }
    }, 50);
  }, [onTransitionComplete, log]);

  /**
   * Handle animation exit complete
   */
  const handleExitComplete = useCallback(() => {
    if (transitionState.phase === 'exiting') {
      log('Exit animation complete, starting enter');

      setTransitionState(prev => ({
        ...prev,
        phase: 'entering'
      }));
    }
  }, [transitionState.phase, log]);

  /**
   * Handle animation enter complete
   */
  const handleEnterComplete = useCallback(() => {
    if (transitionState.phase === 'entering') {
      log('Enter animation complete');
      completeTransition();
    }
  }, [transitionState.phase, completeTransition, log]);

  // =============================================================================
  // ANIMATION VARIANTS
  // =============================================================================

  /**
   * Get optimized animation variants for current configuration
   */
  const animationVariants = useMemo(() => {
    const baseVariants = getTransitionVariants(transitionMode, direction, customVariants);

    // Apply reduced motion if needed
    if (shouldReduceTransition(finalConfig.respectReducedMotion)) {
      return {
        enter: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } }
      };
    }

    // Apply custom timing
    const enhancedVariants = { ...baseVariants };
    if (enhancedVariants.enter && typeof enhancedVariants.enter === 'object') {
      enhancedVariants.enter = {
        ...enhancedVariants.enter,
        transition: {
          duration: timing.enterDuration / 1000,
          ease: timing.easing,
          ...enhancedVariants.enter.transition
        }
      };
    }

    if (enhancedVariants.exit && typeof enhancedVariants.exit === 'object') {
      enhancedVariants.exit = {
        ...enhancedVariants.exit,
        transition: {
          duration: timing.exitDuration / 1000,
          ease: timing.easing,
          ...enhancedVariants.exit.transition
        }
      };
    }

    return enhancedVariants;
  }, [
    transitionMode,
    direction,
    customVariants,
    finalConfig.respectReducedMotion,
    timing
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Handle transition state changes
   */
  useEffect(() => {
    if (isTransitioning && nextImage && transitionState.phase === 'idle') {
      startTransition();
    }
  }, [isTransitioning, nextImage, transitionState.phase, startTransition]);

  /**
   * Handle current image changes
   */
  useEffect(() => {
    if (!isTransitioning && currentImage !== transitionState.displayedImage) {
      setTransitionState(prev => ({
        ...prev,
        displayedImage: currentImage,
        phase: 'idle'
      }));
    }
  }, [currentImage, isTransitioning, transitionState.displayedImage]);

  /**
   * Handle controlled progress updates
   */
  useEffect(() => {
    if (typeof progress === 'number' && onProgressUpdate) {
      progressMotionValue.set(progress);
      onProgressUpdate(progress);
    }
  }, [progress, onProgressUpdate, progressMotionValue]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: aspectRatio,
    overflow: 'hidden',
    ...finalConfig.useHardwareAcceleration && {
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden',
      willChange: 'transform, opacity'
    }
  };

  const imageStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center'
  };

  // Special handling for transform mode
  if (transitionMode === 'transform' && transitionState.targetImage) {
    return (
      <div
        className={`image-transition-container ${className}`}
        style={containerStyles}
        data-testid={testId}
        data-mode={transitionMode}
        data-phase={transitionState.phase}
      >
        <FadeTransition
          fromImage={transitionState.displayedImage}
          toImage={transitionState.targetImage}
          isAnimating={isTransitioning}
          progress={progress}
          onAnimationComplete={completeTransition}
          onAnimationStart={onTransitionStart}
          onProgressUpdate={onProgressUpdate}
          alt={alt}
          respectReducedMotion={finalConfig.respectReducedMotion}
        />
      </div>
    );
  }

  // Standard AnimatePresence transitions
  return (
    <div
      className={`image-transition-container ${className}`}
      style={containerStyles}
      data-testid={testId}
      data-mode={transitionMode}
      data-phase={transitionState.phase}
    >
      <AnimatePresence
        mode="wait"
        onExitComplete={handleExitComplete}
      >
        <motion.img
          key={transitionState.displayedImage}
          src={transitionState.displayedImage}
          alt={alt}
          style={imageStyles}
          variants={animationVariants}
          initial="exit"
          animate="enter"
          exit="exit"
          onAnimationComplete={handleEnterComplete}
          custom={direction}
          loading="eager"
        />
      </AnimatePresence>

      {/* Debug overlay */}
      {finalConfig.debug && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 10
          }}
        >
          Mode: {transitionMode} | Phase: {transitionState.phase} |
          {transitionState.startTime && ` Duration: ${Math.round(performance.now() - transitionState.startTime)}ms`}
        </div>
      )}
    </div>
  );
});

ImageTransitionContainer.displayName = 'ImageTransitionContainer';

// =============================================================================
// EXPORTS
// =============================================================================

export default ImageTransitionContainer;

export type {
  ImageTransitionContainerProps,
  ImageTransitionConfig,
  TransitionMode,
  TransitionDirection,
  TransitionTiming
};

export {
  TRANSITION_VARIANTS,
  getTransitionVariants,
  shouldReduceTransition
};