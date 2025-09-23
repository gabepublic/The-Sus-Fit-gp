/**
 * @fileoverview Framer Motion Animation Variants for Try It On Image Transformation
 * @module @/mobile/components/TryItOn/animations/variants
 * @version 1.0.0
 *
 * This module provides optimized Framer Motion animation variants specifically designed
 * for mobile devices with 60fps performance targets. Includes hardware acceleration,
 * reduced motion support, and comprehensive configuration options for the image
 * transformation animation sequence.
 *
 * @example
 * ```typescript
 * import { fadeInFromTop, transformComplete, getOptimizedVariants } from './variants';
 *
 * <motion.div
 *   variants={fadeInFromTop}
 *   initial="hidden"
 *   animate="visible"
 *   custom={{ duration: 1000, reducedMotion: false }}
 * />
 * ```
 */

import type { Variants, Transition, Target } from 'framer-motion';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Animation timing configuration
 */
export interface AnimationTiming {
  /** Base duration in milliseconds */
  duration: number;
  /** Delay before animation starts */
  delay?: number;
  /** Custom easing curve */
  ease?: string | number[];
  /** Whether to use spring animation */
  useSpring?: boolean;
  /** Spring configuration if useSpring is true */
  spring?: {
    stiffness: number;
    damping: number;
    mass: number;
  };
}

/**
 * Mobile performance configuration
 */
export interface MobilePerformanceConfig {
  /** Enable hardware acceleration */
  hardwareAcceleration: boolean;
  /** Use will-change CSS property */
  useWillChange: boolean;
  /** Prefer transform3d over transform */
  preferTransform3d: boolean;
  /** Reduce animation complexity on low-end devices */
  adaptiveComplexity: boolean;
  /** Target frame rate */
  targetFPS: number;
}

/**
 * Animation configuration with mobile optimizations
 */
export interface AnimationConfig {
  /** Animation timing settings */
  timing: AnimationTiming;
  /** Mobile performance optimizations */
  performance: MobilePerformanceConfig;
  /** Respect user's reduced motion preference */
  respectReducedMotion: boolean;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Custom animation variants with configuration
 */
export interface CustomVariants {
  [key: string]: any;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default animation timing for mobile devices
 */
export const DEFAULT_TIMING: AnimationTiming = {
  duration: 1000, // 1 second
  delay: 0,
  ease: [0.25, 0.46, 0.45, 0.94], // Custom easing curve for smooth feel
  useSpring: false
};

/**
 * Optimized mobile performance configuration
 */
export const MOBILE_PERFORMANCE_CONFIG: MobilePerformanceConfig = {
  hardwareAcceleration: true,
  useWillChange: true,
  preferTransform3d: true,
  adaptiveComplexity: true,
  targetFPS: 60
};

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  timing: DEFAULT_TIMING,
  performance: MOBILE_PERFORMANCE_CONFIG,
  respectReducedMotion: true,
  debug: process.env.NODE_ENV === 'development'
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get hardware acceleration CSS properties
 */
export function getHardwareAccelerationProps(config: MobilePerformanceConfig): Record<string, string> {
  const props: Record<string, string> = {};

  if (config.hardwareAcceleration) {
    if (config.preferTransform3d) {
      props.transform = 'translate3d(0, 0, 0)';
    }
    props.backfaceVisibility = 'hidden';
    props.perspective = '1000px';
  }

  if (config.useWillChange) {
    props.willChange = 'transform, opacity';
  }

  return props;
}

/**
 * Create optimized transition based on configuration
 */
export function createOptimizedTransition(
  timing: AnimationTiming,
  performance: MobilePerformanceConfig
): Transition {
  const transition: Transition = {
    duration: timing.duration / 1000, // Convert to seconds
    delay: (timing.delay || 0) / 1000,
    ease: (timing.ease || DEFAULT_TIMING.ease) as any
  };

  if (timing.useSpring && timing.spring) {
    return {
      type: 'spring',
      ...timing.spring,
      duration: undefined // Spring animations don't use duration
    };
  }

  // Optimize for mobile performance
  if (performance.targetFPS === 60) {
    transition.type = 'tween';
  }

  return transition;
}

/**
 * Apply reduced motion fallbacks
 */
export function applyReducedMotionFallback<T extends Record<string, any>>(
  variants: T,
  config: AnimationConfig
): T {
  if (!config.respectReducedMotion || !prefersReducedMotion()) {
    return variants;
  }

  // Create reduced motion version
  const reducedVariants = { ...variants };

  Object.keys(reducedVariants).forEach(key => {
    if (typeof reducedVariants[key] === 'object' && reducedVariants[key] !== null) {
      const variant = reducedVariants[key];

      // Simplify animations for reduced motion
      if ('transition' in variant) {
        variant.transition = {
          duration: 0.2, // Very fast
          ease: 'linear'
        };
      }

      // Remove complex transforms
      if ('scale' in variant && variant.scale !== 1) {
        delete variant.scale;
      }

      if ('rotateX' in variant || 'rotateY' in variant || 'rotateZ' in variant) {
        delete variant.rotateX;
        delete variant.rotateY;
        delete variant.rotateZ;
      }

      // Keep only opacity changes for accessibility
      if ('opacity' in variant) {
        // Keep opacity but make it instant
        if (variant.opacity === 0) {
          variant.opacity = 0.1; // Slight visibility for screen readers
        }
      }
    }
  });

  return reducedVariants;
}

// =============================================================================
// CORE ANIMATION VARIANTS
// =============================================================================

/**
 * Fade in from top animation - main transformation effect
 */
export const fadeInFromTop: CustomVariants = {
  hidden: {
    opacity: 0,
    clipPath: 'inset(0 0 100% 0)',
    scale: 1.02,
    ...getHardwareAccelerationProps(MOBILE_PERFORMANCE_CONFIG)
  },
  visible: (custom?: { timing?: AnimationTiming; performance?: MobilePerformanceConfig }) => ({
    opacity: 1,
    clipPath: 'inset(0 0 0% 0)',
    scale: 1,
    transition: createOptimizedTransition(
      custom?.timing || DEFAULT_TIMING,
      custom?.performance || MOBILE_PERFORMANCE_CONFIG
    ),
    ...getHardwareAccelerationProps(custom?.performance || MOBILE_PERFORMANCE_CONFIG)
  }),
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  },
  _config: {
    timing: { ...DEFAULT_TIMING, duration: 1200 },
    performance: MOBILE_PERFORMANCE_CONFIG
  }
};

/**
 * Transform complete animation - celebrates successful generation
 */
export const transformComplete: CustomVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    ...getHardwareAccelerationProps(MOBILE_PERFORMANCE_CONFIG)
  },
  animate: (custom?: { timing?: AnimationTiming }) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...createOptimizedTransition(
        custom?.timing || { ...DEFAULT_TIMING, duration: 800 },
        MOBILE_PERFORMANCE_CONFIG
      ),
      delay: 0.2 // Wait for main animation to start
    }
  }),
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  _config: {
    timing: { ...DEFAULT_TIMING, duration: 800, delay: 200 }
  }
};

/**
 * Image swap animation for smooth transitions between states
 */
export const imageSwap: CustomVariants = {
  enter: (custom?: { direction?: 'up' | 'down' }) => ({
    opacity: 0,
    y: custom?.direction === 'up' ? -20 : 20,
    scale: 0.95,
    ...getHardwareAccelerationProps(MOBILE_PERFORMANCE_CONFIG)
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: (custom?: { direction?: 'up' | 'down' }) => ({
    opacity: 0,
    y: custom?.direction === 'up' ? 20 : -20,
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }),
  _config: {
    timing: { ...DEFAULT_TIMING, duration: 500 }
  }
};

/**
 * Optimized mobile variant with reduced complexity for performance
 */
export const optimizedMobile: CustomVariants = {
  hidden: {
    opacity: 0,
    transform: 'translate3d(0, 10px, 0)',
    ...getHardwareAccelerationProps(MOBILE_PERFORMANCE_CONFIG)
  },
  visible: {
    opacity: 1,
    transform: 'translate3d(0, 0, 0)',
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'tween' // Simpler than spring for mobile
    }
  },
  _config: {
    timing: { ...DEFAULT_TIMING, duration: 400 },
    performance: { ...MOBILE_PERFORMANCE_CONFIG, adaptiveComplexity: true }
  }
};

/**
 * Mannequin to result transformation with mask effect
 */
export const mannequinTransform: CustomVariants = {
  mannequin: {
    opacity: 1,
    clipPath: 'inset(0 0 0 0)',
    filter: 'brightness(1)',
    ...getHardwareAccelerationProps(MOBILE_PERFORMANCE_CONFIG)
  },
  transforming: (custom?: { progress?: number }) => {
    const progress = custom?.progress || 0;
    const clipValue = Math.min(100, progress);

    return {
      opacity: 1,
      clipPath: `inset(0 0 ${100 - clipValue}% 0)`,
      filter: `brightness(${1 - progress * 0.2})`,
      transition: {
        duration: 0.1,
        ease: 'linear'
      }
    };
  },
  result: {
    opacity: 1,
    clipPath: 'inset(0 0 0 0)',
    filter: 'brightness(1)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  _config: {
    timing: { ...DEFAULT_TIMING, duration: 1200 }
  }
};

// =============================================================================
// CONFIGURATION BUILDERS
// =============================================================================

/**
 * Get optimized variants based on device capabilities and user preferences
 */
export function getOptimizedVariants(
  baseVariants: CustomVariants,
  config: Partial<AnimationConfig> = {}
): CustomVariants {
  const finalConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

  // Apply reduced motion if needed
  let optimizedVariants = applyReducedMotionFallback(baseVariants, finalConfig);

  // Apply mobile optimizations
  if (finalConfig.performance.adaptiveComplexity) {
    // Detect low-end devices (simplified heuristic)
    const isLowEndDevice = typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

    if (isLowEndDevice) {
      // Use simpler animations for low-end devices
      optimizedVariants = optimizedMobile;
    }
  }

  return optimizedVariants;
}

/**
 * Create custom timing configuration
 */
export function createTiming(overrides: Partial<AnimationTiming>): AnimationTiming {
  return { ...DEFAULT_TIMING, ...overrides };
}

/**
 * Create mobile performance configuration
 */
export function createMobileConfig(overrides: Partial<MobilePerformanceConfig>): MobilePerformanceConfig {
  return { ...MOBILE_PERFORMANCE_CONFIG, ...overrides };
}

/**
 * Create complete animation configuration
 */
export function createAnimationConfig(overrides: Partial<AnimationConfig>): AnimationConfig {
  return { ...DEFAULT_ANIMATION_CONFIG, ...overrides };
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Preset configurations for common use cases
 */
export const ANIMATION_PRESETS = {
  /** Fast animations for quick feedback */
  fast: createAnimationConfig({
    timing: createTiming({ duration: 400 }),
    performance: createMobileConfig({ targetFPS: 60 })
  }),

  /** Standard animations for normal use */
  standard: createAnimationConfig({
    timing: createTiming({ duration: 1000 }),
    performance: MOBILE_PERFORMANCE_CONFIG
  }),

  /** Smooth animations for premium feel */
  smooth: createAnimationConfig({
    timing: createTiming({
      duration: 1200,
      ease: [0.23, 1, 0.32, 1] // easeOutQuint
    }),
    performance: createMobileConfig({ targetFPS: 60 })
  }),

  /** Reduced complexity for performance */
  performance: createAnimationConfig({
    timing: createTiming({ duration: 600 }),
    performance: createMobileConfig({ adaptiveComplexity: true })
  }),

  /** Accessibility-first with reduced motion */
  accessible: createAnimationConfig({
    timing: createTiming({ duration: 200 }),
    respectReducedMotion: true,
    performance: createMobileConfig({ adaptiveComplexity: true })
  })
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Main variants export
 */
export const variants = {
  fadeInFromTop,
  transformComplete,
  imageSwap,
  optimizedMobile,
  mannequinTransform
};

/**
 * Configuration utilities export
 */
export const config = {
  getOptimizedVariants,
  createTiming,
  createMobileConfig,
  createAnimationConfig,
  presets: ANIMATION_PRESETS
};

/**
 * Default export for convenience
 */
export default {
  variants,
  config,
  utils: {
    prefersReducedMotion,
    getHardwareAccelerationProps,
    createOptimizedTransition,
    applyReducedMotionFallback
  }
};