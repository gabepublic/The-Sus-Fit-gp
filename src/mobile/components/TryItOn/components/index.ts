/**
 * @fileoverview TryItOn Components - Barrel exports for Try It On components
 * @module @/mobile/components/TryItOn/components
 * @version 1.0.0
 *
 * This module provides centralized exports for all Try It On UI components.
 */

// Main presentation component
export { TryItOn } from './TryItOn';

// Animation components
export { ImageTransformation } from './ImageTransformation';
export type {
  ImageTransformationProps,
  ImageTransformationConfig,
  TransformationPhase,
  PerformanceMetrics
} from './ImageTransformation';

export { ImageTransitionContainer } from './ImageTransitionContainer';
export type {
  ImageTransitionContainerProps,
  ImageTransitionConfig,
  TransitionMode,
  TransitionDirection,
  TransitionTiming
} from './ImageTransitionContainer';

// Utility exports
export {
  detectDevicePerformance,
  estimateMemoryUsage,
  PERFORMANCE_THRESHOLDS
} from './ImageTransformation';

export {
  TRANSITION_VARIANTS,
  getTransitionVariants,
  shouldReduceTransition
} from './ImageTransitionContainer';

// Default export for convenience
export { TryItOn as default } from './TryItOn';