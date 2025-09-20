/**
 * @fileoverview TryItOn Animations - Barrel exports for animation system
 * @module @/mobile/components/TryItOn/animations
 * @version 1.0.0
 *
 * This module provides centralized exports for all Try It On animation components,
 * variants, and utilities.
 */

// Animation variants and configuration
export {
  variants,
  config,
  fadeInFromTop,
  transformComplete,
  imageSwap,
  optimizedMobile,
  mannequinTransform,
  getOptimizedVariants,
  createTiming,
  createMobileConfig,
  createAnimationConfig,
  prefersReducedMotion,
  getHardwareAccelerationProps,
  createOptimizedTransition,
  applyReducedMotionFallback,
  DEFAULT_TIMING,
  MOBILE_PERFORMANCE_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  ANIMATION_PRESETS
} from './variants';

export type {
  AnimationTiming,
  MobilePerformanceConfig,
  AnimationConfig,
  CustomVariants
} from './variants';

// Fade transition component
export { FadeTransition } from './FadeTransition';
export type {
  FadeTransitionProps,
  FadeTransitionConfig,
  BrowserCapabilities
} from './FadeTransition';

export {
  detectBrowserCapabilities,
  chooseAnimationMethod,
  MASK_GRADIENTS,
  CLIP_PATH_VALUES
} from './FadeTransition';

// Default export for convenience
export { default as animations } from './variants';