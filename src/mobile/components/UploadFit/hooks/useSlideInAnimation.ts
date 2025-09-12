/**
 * @fileoverview useSlideInAnimation - React hook for managing slide-in animations with Intersection Observer
 * @module @/mobile/components/UploadFit/hooks/useSlideInAnimation
 * @version 1.0.0
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

// =============================================================================
// TYPES AND INTERFACES (Task 4.3)
// =============================================================================

/**
 * Slide-in animation configuration
 */
export interface SlideInConfig {
  /** Root element for intersection observation (null = viewport) */
  root?: Element | null;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Intersection threshold (0-1) */
  threshold?: number | number[];
  /** Animation delay in milliseconds */
  delay?: number;
  /** Whether animation should trigger only once */
  triggerOnce?: boolean;
  /** Enable animation debugging */
  enableLogging?: boolean;
}

/**
 * Slide-in animation return interface
 */
export interface UseSlideInAnimationReturn {
  /** Ref to attach to the element that should animate */
  ref: React.RefObject<HTMLElement>;
  /** Whether the element is currently visible */
  isVisible: boolean;
  /** Whether the element has been seen (for triggerOnce) */
  hasBeenSeen: boolean;
  /** Manually trigger the animation */
  triggerAnimation: () => void;
  /** Reset the animation state */
  resetAnimation: () => void;
  /** Whether animation is supported */
  isSupported: boolean;
}

/**
 * Animation direction enum
 */
export const SLIDE_DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
} as const;

export type SlideDirection = typeof SLIDE_DIRECTION[keyof typeof SLIDE_DIRECTION];

// =============================================================================
// DEFAULT CONFIGURATION (Task 4.3)
// =============================================================================

/**
 * Default slide-in animation configuration
 */
const defaultConfig: Required<SlideInConfig> = {
  root: null,
  rootMargin: '0px 0px -50px 0px',
  threshold: 0.1,
  delay: 0,
  triggerOnce: true,
  enableLogging: false
};

// =============================================================================
// HOOK IMPLEMENTATION (Task 4.3)
// =============================================================================

/**
 * Custom hook for managing slide-in animations with Intersection Observer API
 * 
 * Features:
 * - Intersection Observer API for performance-optimized visibility detection
 * - Configurable thresholds and margins for trigger points
 * - Animation delay support for staggered animations
 * - Single-trigger mode for performance (triggerOnce)
 * - Reduced motion preference support
 * - Manual animation control
 * - Fallback for browsers without Intersection Observer support
 * 
 * @param config Configuration options for the slide-in animation
 * @returns Slide-in animation state and controls
 * 
 * @example
 * ```typescript
 * const { ref, isVisible, triggerAnimation } = useSlideInAnimation({
 *   threshold: 0.2,
 *   delay: 150,
 *   triggerOnce: true
 * });
 * 
 * // In JSX
 * <div 
 *   ref={ref} 
 *   className={`slide-container ${isVisible ? 'slide-visible' : ''}`}
 * >
 *   <button>Slide-in Button</button>
 * </div>
 * ```
 */
export function useSlideInAnimation(
  config: SlideInConfig = {}
): UseSlideInAnimationReturn {
  
  // Merge config with defaults
  const finalConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config]);

  // Element ref for intersection observation
  const elementRef = useRef<HTMLElement>(null);
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  
  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Check if Intersection Observer is supported
  const isSupported = useMemo(() => 
    typeof window !== 'undefined' && 'IntersectionObserver' in window,
    []
  );

  // Check if user prefers reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // =============================================================================
  // ANIMATION CONTROL FUNCTIONS (Task 4.3)
  // =============================================================================

  /**
   * Log animation events for debugging
   */
  const logAnimation = useCallback((event: string, details?: any) => {
    if (finalConfig.enableLogging) {
      console.log(`[SlideInAnimation] ${event}`, details);
    }
  }, [finalConfig.enableLogging]);

  /**
   * Trigger the slide-in animation
   */
  const triggerAnimation = useCallback(() => {
    logAnimation('Manual trigger');
    
    if (prefersReducedMotion) {
      // Immediately show without animation for reduced motion
      setIsVisible(true);
      setHasBeenSeen(true);
      return;
    }

    // Apply delay if configured
    if (finalConfig.delay > 0) {
      setTimeout(() => {
        setIsVisible(true);
        setHasBeenSeen(true);
        logAnimation('Animation triggered after delay', { delay: finalConfig.delay });
      }, finalConfig.delay);
    } else {
      setIsVisible(true);
      setHasBeenSeen(true);
      logAnimation('Animation triggered immediately');
    }
  }, [finalConfig.delay, prefersReducedMotion, logAnimation]);

  /**
   * Reset the animation state
   */
  const resetAnimation = useCallback(() => {
    setIsVisible(false);
    if (!finalConfig.triggerOnce) {
      setHasBeenSeen(false);
    }
    logAnimation('Animation reset');
  }, [finalConfig.triggerOnce, logAnimation]);

  // =============================================================================
  // INTERSECTION OBSERVER SETUP (Task 4.3)
  // =============================================================================

  /**
   * Handle intersection observer entries
   */
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      logAnimation('Intersection change', {
        isIntersecting: entry.isIntersecting,
        intersectionRatio: entry.intersectionRatio,
        hasBeenSeen
      });

      if (entry.isIntersecting && (!finalConfig.triggerOnce || !hasBeenSeen)) {
        // Element is visible and should trigger animation
        triggerAnimation();
      } else if (!entry.isIntersecting && !finalConfig.triggerOnce && !hasBeenSeen) {
        // Element is not visible and can be reset (only if triggerOnce is false)
        setIsVisible(false);
        logAnimation('Element not visible, hiding animation');
      }
    });
  }, [triggerAnimation, finalConfig.triggerOnce, hasBeenSeen, logAnimation]);

  /**
   * Setup Intersection Observer
   */
  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || !isSupported) {
      // Fallback: immediately trigger animation if no observer support
      if (!isSupported) {
        logAnimation('Intersection Observer not supported, triggering immediately');
        triggerAnimation();
      }
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: finalConfig.root,
      rootMargin: finalConfig.rootMargin,
      threshold: finalConfig.threshold
    });

    // Start observing
    observerRef.current.observe(element);
    logAnimation('Observer setup complete', finalConfig);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        logAnimation('Observer disconnected');
      }
    };
  }, [
    handleIntersection,
    finalConfig.root,
    finalConfig.rootMargin,
    finalConfig.threshold,
    triggerAnimation,
    isSupported,
    logAnimation,
    finalConfig
  ]);

  // =============================================================================
  // CLEANUP ON UNMOUNT (Task 4.3)
  // =============================================================================

  /**
   * Cleanup intersection observer on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // =============================================================================
  // RETURN INTERFACE (Task 4.3)
  // =============================================================================

  return {
    ref: elementRef,
    isVisible,
    hasBeenSeen,
    triggerAnimation,
    resetAnimation,
    isSupported
  };
}

// =============================================================================
// UTILITY FUNCTIONS (Task 4.3)
// =============================================================================

/**
 * Create CSS classes for slide-in animation
 */
export const createSlideInClasses = (
  isVisible: boolean,
  direction: SlideDirection = SLIDE_DIRECTION.UP,
  baseClass = 'slide-in'
): string => {
  return [
    `${baseClass}-container`,
    `${baseClass}-${direction}`,
    isVisible ? `${baseClass}-visible` : `${baseClass}-hidden`
  ].join(' ');
};

/**
 * Get CSS transform value for slide direction
 */
export const getSlideTransform = (direction: SlideDirection, distance = 100): string => {
  switch (direction) {
    case SLIDE_DIRECTION.UP:
      return `translateY(${distance}px)`;
    case SLIDE_DIRECTION.DOWN:
      return `translateY(-${distance}px)`;
    case SLIDE_DIRECTION.LEFT:
      return `translateX(${distance}px)`;
    case SLIDE_DIRECTION.RIGHT:
      return `translateX(-${distance}px)`;
    default:
      return `translateY(${distance}px)`;
  }
};

/**
 * Check if device supports smooth animations
 */
export const supportsAnimations = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  
  // Check for basic animation support
  const testElement = document.createElement('div');
  const prefixes = ['animation', 'webkitAnimation', 'mozAnimation'];
  
  return prefixes.some(prefix => prefix in testElement.style);
};