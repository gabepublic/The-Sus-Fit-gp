/**
 * @fileoverview useSlideAnimation - Shared React hook for slide animations
 * @module @/mobile/components/shared/hooks/useSlideAnimation
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  UseSlideAnimationReturn,
  SlideAnimationState,
  AnimationConfig
} from './hooks.types';

/**
 * Default animation configuration
 */
const DEFAULT_ANIMATION_CONFIG: Required<AnimationConfig> = {
  duration: 300,
  easing: 'ease-out',
  delay: 0,
  enabled: true,
  respectReducedMotion: true
};

/**
 * Initial animation state
 */
const initialState: SlideAnimationState = {
  isVisible: false,
  isAnimating: false,
  direction: 'up'
};

/**
 * Shared slide animation hook for smooth UI transitions
 *
 * Features:
 * - Smooth slide in/out animations
 * - Multiple direction support (up, down, left, right)
 * - Configurable duration and easing
 * - Reduced motion respect
 * - CSS class generation for styling
 * - Animation state tracking
 * - Memory-efficient cleanup
 *
 * @param config Animation configuration options
 * @returns Animation state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   slideIn,
 *   slideOut,
 *   toggleSlide,
 *   isVisible,
 *   isAnimating,
 *   animationClasses
 * } = useSlideAnimation({
 *   duration: 400,
 *   easing: 'ease-in-out',
 *   respectReducedMotion: true
 * });
 *
 * // Slide in from bottom
 * const handleShow = () => slideIn('up');
 *
 * // Slide out to left
 * const handleHide = () => slideOut('left');
 *
 * return (
 *   <div className={`slide-element ${animationClasses}`}>
 *     Content to animate
 *   </div>
 * );
 * ```
 */
export function useSlideAnimation(
  config: AnimationConfig = {}
): UseSlideAnimationReturn {
  // Merge config with defaults
  const animationConfig = useMemo(
    () => ({ ...DEFAULT_ANIMATION_CONFIG, ...config }),
    [config]
  );

  // Animation state
  const [animationState, setAnimationState] = useState<SlideAnimationState>(initialState);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Determine if animations should be enabled
  const animationsEnabled = useMemo(() => {
    if (!animationConfig.enabled) return false;
    if (animationConfig.respectReducedMotion && prefersReducedMotion) return false;
    return true;
  }, [animationConfig.enabled, animationConfig.respectReducedMotion, prefersReducedMotion]);

  /**
   * Start slide in animation
   */
  const slideIn = useCallback((direction: SlideAnimationState['direction'] = 'up') => {
    if (animationState.isVisible && !animationState.isAnimating) {
      return; // Already visible
    }

    setAnimationState({
      isVisible: true,
      isAnimating: animationsEnabled,
      direction
    });

    if (animationsEnabled) {
      // End animation after duration
      const timer = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false
        }));
      }, animationConfig.duration + animationConfig.delay);

      return () => clearTimeout(timer);
    }
  }, [animationState.isVisible, animationState.isAnimating, animationsEnabled, animationConfig.duration, animationConfig.delay]);

  /**
   * Start slide out animation
   */
  const slideOut = useCallback((direction: SlideAnimationState['direction'] = 'down') => {
    if (!animationState.isVisible && !animationState.isAnimating) {
      return; // Already hidden
    }

    setAnimationState({
      isVisible: false,
      isAnimating: animationsEnabled,
      direction
    });

    if (animationsEnabled) {
      // End animation after duration
      const timer = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false
        }));
      }, animationConfig.duration + animationConfig.delay);

      return () => clearTimeout(timer);
    }
  }, [animationState.isVisible, animationState.isAnimating, animationsEnabled, animationConfig.duration, animationConfig.delay]);

  /**
   * Toggle slide animation
   */
  const toggleSlide = useCallback(() => {
    if (animationState.isVisible) {
      slideOut();
    } else {
      slideIn();
    }
  }, [animationState.isVisible, slideIn, slideOut]);

  /**
   * Generate CSS classes for animation
   */
  const animationClasses = useMemo(() => {
    const classes: string[] = [];

    // Base slide class
    classes.push('slide-animation');

    // Visibility state
    if (animationState.isVisible) {
      classes.push('slide-animation--visible');
    } else {
      classes.push('slide-animation--hidden');
    }

    // Animation state
    if (animationState.isAnimating) {
      classes.push('slide-animation--animating');
    }

    // Direction class
    classes.push(`slide-animation--${animationState.direction}`);

    // Animation enabled/disabled
    if (animationsEnabled) {
      classes.push('slide-animation--enabled');
    } else {
      classes.push('slide-animation--disabled');
    }

    return classes.join(' ');
  }, [animationState, animationsEnabled]);

  return {
    animationState,
    slideIn,
    slideOut,
    toggleSlide,
    isVisible: animationState.isVisible,
    isAnimating: animationState.isAnimating,
    animationClasses
  };
}

/**
 * Hook for button-specific slide animations (like NextButton)
 */
export function useButtonSlideAnimation(uploadStatus: string) {
  const slideAnimation = useSlideAnimation({
    duration: 300,
    easing: 'ease-out',
    delay: 100
  });

  // Auto-show/hide based on upload status
  useEffect(() => {
    if (uploadStatus === 'complete' || uploadStatus === 'success') {
      slideAnimation.slideIn('up');
    } else if (uploadStatus === 'idle' || uploadStatus === 'error') {
      slideAnimation.slideOut('down');
    }
  }, [uploadStatus, slideAnimation]);

  return slideAnimation;
}

/**
 * CSS styles generator for slide animations
 */
export const generateSlideAnimationCSS = (config: AnimationConfig = {}) => {
  const finalConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

  return `
    .slide-animation {
      transition-property: transform, opacity;
      transition-duration: ${finalConfig.duration}ms;
      transition-timing-function: ${finalConfig.easing};
      transition-delay: ${finalConfig.delay}ms;
    }

    .slide-animation--disabled {
      transition: none;
    }

    .slide-animation--hidden {
      opacity: 0;
      pointer-events: none;
    }

    .slide-animation--visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* Direction-specific transforms */
    .slide-animation--up.slide-animation--hidden {
      transform: translateY(100%);
    }

    .slide-animation--up.slide-animation--visible {
      transform: translateY(0);
    }

    .slide-animation--down.slide-animation--hidden {
      transform: translateY(-100%);
    }

    .slide-animation--down.slide-animation--visible {
      transform: translateY(0);
    }

    .slide-animation--left.slide-animation--hidden {
      transform: translateX(100%);
    }

    .slide-animation--left.slide-animation--visible {
      transform: translateX(0);
    }

    .slide-animation--right.slide-animation--hidden {
      transform: translateX(-100%);
    }

    .slide-animation--right.slide-animation--visible {
      transform: translateX(0);
    }

    /* Animating state */
    .slide-animation--animating {
      will-change: transform, opacity;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .slide-animation {
        transition: none;
      }

      .slide-animation--hidden,
      .slide-animation--visible {
        transform: none;
      }
    }
  `;
};