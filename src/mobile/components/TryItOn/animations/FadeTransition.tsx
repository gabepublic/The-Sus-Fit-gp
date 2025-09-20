/**
 * @fileoverview FadeTransition - Top-to-bottom fade effect component for Try It On transformation
 * @module @/mobile/components/TryItOn/animations/FadeTransition
 * @version 1.0.0
 *
 * This component implements a sophisticated top-to-bottom fade effect using CSS mask
 * and clip-path properties with cross-browser fallbacks. Optimized for mobile devices
 * with hardware acceleration and 60fps performance targets.
 *
 * @example
 * ```typescript
 * import { FadeTransition } from './FadeTransition';
 *
 * <FadeTransition
 *   fromImage="/mannequin.png"
 *   toImage="/generated-result.jpg"
 *   isAnimating={true}
 *   progress={0.5}
 *   onAnimationComplete={() => console.log('Animation complete')}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { fadeInFromTop, mannequinTransform, getOptimizedVariants } from './variants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Browser capability detection result
 */
interface BrowserCapabilities {
  /** Supports CSS mask property */
  supportsMask: boolean;
  /** Supports CSS clip-path property */
  supportsClipPath: boolean;
  /** Supports backdrop-filter */
  supportsBackdropFilter: boolean;
  /** Detected GPU acceleration support */
  hasGPUAcceleration: boolean;
  /** Browser performance tier (low, medium, high) */
  performanceTier: 'low' | 'medium' | 'high';
}

/**
 * Fade transition configuration
 */
export interface FadeTransitionConfig {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing curve */
  easing?: string | number[];
  /** Enable hardware acceleration */
  useHardwareAcceleration?: boolean;
  /** Prefer mask over clip-path */
  preferMask?: boolean;
  /** Fallback animation for unsupported browsers */
  fallbackAnimation?: 'opacity' | 'slide' | 'none';
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Component props interface
 */
export interface FadeTransitionProps {
  /** Source image (mannequin) */
  fromImage: string;
  /** Target image (generated result) */
  toImage: string;
  /** Whether animation is currently active */
  isAnimating: boolean;
  /** Animation progress (0-1) */
  progress?: number;
  /** Animation configuration */
  config?: FadeTransitionConfig;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback for progress updates */
  onProgressUpdate?: (progress: number) => void;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Alternative text for images */
  alt?: string;
  /** Whether to respect reduced motion */
  respectReducedMotion?: boolean;
}

/**
 * Animation method type
 */
type AnimationMethod = 'mask' | 'clipPath' | 'fallback';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FadeTransitionConfig> = {
  duration: 1200,
  easing: [0.25, 0.46, 0.45, 0.94],
  useHardwareAcceleration: true,
  preferMask: true,
  fallbackAnimation: 'opacity',
  debug: process.env.NODE_ENV === 'development'
};

/**
 * CSS mask gradients for different browser support levels
 */
const MASK_GRADIENTS = {
  webkit: (progress: number) =>
    `-webkit-linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${progress * 100}%, rgba(0,0,0,0) ${progress * 100 + 5}%, rgba(0,0,0,0) 100%)`,
  standard: (progress: number) =>
    `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${progress * 100}%, rgba(0,0,0,0) ${progress * 100 + 5}%, rgba(0,0,0,0) 100%)`
};

/**
 * Clip-path values for different progress stages
 */
const CLIP_PATH_VALUES = {
  fromTop: (progress: number) => `inset(0 0 ${(1 - progress) * 100}% 0)`,
  fromBottom: (progress: number) => `inset(${progress * 100}% 0 0 0)`,
  reveal: (progress: number) => `inset(${(1 - progress) * 50}% 0 ${(1 - progress) * 50}% 0)`
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Detect browser capabilities for optimal animation method
 */
function detectBrowserCapabilities(): BrowserCapabilities {
  if (typeof window === 'undefined') {
    return {
      supportsMask: false,
      supportsClipPath: false,
      supportsBackdropFilter: false,
      hasGPUAcceleration: false,
      performanceTier: 'medium'
    };
  }

  const testElement = document.createElement('div');
  const style = testElement.style;

  // Test CSS mask support
  const supportsMask = (
    'mask' in style ||
    'webkitMask' in style ||
    'mozMask' in style
  );

  // Test CSS clip-path support
  const supportsClipPath = (
    'clipPath' in style ||
    'webkitClipPath' in style
  );

  // Test backdrop-filter support
  const supportsBackdropFilter = (
    'backdropFilter' in style ||
    'webkitBackdropFilter' in style
  );

  // Estimate GPU acceleration support
  const hasGPUAcceleration = (() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  })();

  // Estimate performance tier based on hardware concurrency and memory
  const getPerformanceTier = (): 'low' | 'medium' | 'high' => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4;

    if (hardwareConcurrency >= 8 && deviceMemory >= 8) return 'high';
    if (hardwareConcurrency >= 4 && deviceMemory >= 4) return 'medium';
    return 'low';
  };

  return {
    supportsMask,
    supportsClipPath,
    supportsBackdropFilter,
    hasGPUAcceleration,
    performanceTier: getPerformanceTier()
  };
}

/**
 * Choose optimal animation method based on browser capabilities
 */
function chooseAnimationMethod(
  capabilities: BrowserCapabilities,
  config: Required<FadeTransitionConfig>
): AnimationMethod {
  // Prefer mask if supported and preferred
  if (capabilities.supportsMask && config.preferMask) {
    return 'mask';
  }

  // Fall back to clip-path if supported
  if (capabilities.supportsClipPath) {
    return 'clipPath';
  }

  // Use fallback for unsupported browsers
  return 'fallback';
}

/**
 * Generate CSS properties for hardware acceleration
 */
function getHardwareAccelerationStyles(
  useAcceleration: boolean,
  hasGPUSupport: boolean
): React.CSSProperties {
  if (!useAcceleration || !hasGPUSupport) return {};

  return {
    transform: 'translate3d(0, 0, 0)',
    backfaceVisibility: 'hidden',
    perspective: '1000px',
    willChange: 'transform, opacity, mask, clip-path'
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * FadeTransition Component - Top-to-bottom fade effect with cross-browser support
 */
export const FadeTransition = React.memo<FadeTransitionProps>(function FadeTransition({
  fromImage,
  toImage,
  isAnimating,
  progress = 0,
  config = {},
  onAnimationComplete,
  onAnimationStart,
  onProgressUpdate,
  className = '',
  testId = 'fade-transition',
  alt = 'Transformation animation',
  respectReducedMotion = true
}) {
  // Configuration and capabilities
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  const capabilities = useMemo(() => detectBrowserCapabilities(), []);
  const animationMethod = useMemo(
    () => chooseAnimationMethod(capabilities, finalConfig),
    [capabilities, finalConfig]
  );

  // Animation state
  const [animationState, setAnimationState] = useState<'idle' | 'animating' | 'complete'>('idle');
  const [internalProgress, setInternalProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Motion values for smooth animations
  const progressMotionValue = useMotionValue(0);
  const maskValue = useTransform(progressMotionValue, [0, 1], [0, 100]);
  const clipValue = useTransform(progressMotionValue, [0, 1], [0, 100]);

  // Animation controls
  const controls = useAnimation();

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (finalConfig.debug) {
      console.log('[FadeTransition]', ...args);
    }
  }, [finalConfig.debug]);

  // =============================================================================
  // ANIMATION FUNCTIONS
  // =============================================================================

  /**
   * Update animation progress
   */
  const updateProgress = useCallback((newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, newProgress));
    setInternalProgress(clampedProgress);
    progressMotionValue.set(clampedProgress);

    if (onProgressUpdate) {
      onProgressUpdate(clampedProgress);
    }
  }, [progressMotionValue, onProgressUpdate]);

  /**
   * Start the fade animation
   */
  const startAnimation = useCallback(() => {
    if (animationState === 'animating') return;

    log('Starting fade animation with method:', animationMethod);
    setAnimationState('animating');
    startTimeRef.current = performance.now();

    if (onAnimationStart) {
      onAnimationStart();
    }

    // Animate progress from 0 to 1
    const animateProgress = (timestamp: number) => {
      if (!startTimeRef.current) return;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / finalConfig.duration, 1);

      // Apply easing if it's a cubic-bezier array
      let easedProgress = progress;
      if (Array.isArray(finalConfig.easing) && finalConfig.easing.length === 4) {
        // Simple cubic-bezier approximation
        const [x1, y1, x2, y2] = finalConfig.easing;
        easedProgress = progress; // Simplified - in production, use proper cubic-bezier calculation
      }

      updateProgress(easedProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateProgress);
      } else {
        setAnimationState('complete');
        log('Animation completed');

        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    animationRef.current = requestAnimationFrame(animateProgress);
  }, [
    animationState,
    animationMethod,
    finalConfig.duration,
    finalConfig.easing,
    updateProgress,
    onAnimationStart,
    onAnimationComplete,
    log
  ]);

  /**
   * Stop the animation
   */
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // =============================================================================
  // ANIMATION STYLES
  // =============================================================================

  /**
   * Generate mask styles for the transition
   */
  const getMaskStyles = useCallback((progress: number): React.CSSProperties => {
    if (animationMethod !== 'mask') return {};

    const maskImage = capabilities.supportsMask
      ? MASK_GRADIENTS.standard(progress)
      : MASK_GRADIENTS.webkit(progress);

    return {
      maskImage,
      WebkitMaskImage: maskImage,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%'
    };
  }, [animationMethod, capabilities.supportsMask]);

  /**
   * Generate clip-path styles for the transition
   */
  const getClipPathStyles = useCallback((progress: number): React.CSSProperties => {
    if (animationMethod !== 'clipPath') return {};

    const clipPath = CLIP_PATH_VALUES.fromTop(progress);

    return {
      clipPath,
      WebkitClipPath: clipPath
    };
  }, [animationMethod]);

  /**
   * Generate fallback styles for unsupported browsers
   */
  const getFallbackStyles = useCallback((progress: number): React.CSSProperties => {
    if (animationMethod !== 'fallback') return {};

    switch (finalConfig.fallbackAnimation) {
      case 'opacity':
        return { opacity: progress };
      case 'slide':
        return {
          transform: `translateY(${(1 - progress) * 100}%)`,
          opacity: progress
        };
      case 'none':
      default:
        return { opacity: progress > 0.5 ? 1 : 0 };
    }
  }, [animationMethod, finalConfig.fallbackAnimation]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Handle external progress changes
   */
  useEffect(() => {
    if (typeof progress === 'number' && !isAnimating) {
      updateProgress(progress);
    }
  }, [progress, isAnimating, updateProgress]);

  /**
   * Handle animation state changes
   */
  useEffect(() => {
    if (isAnimating && animationState === 'idle') {
      startAnimation();
    } else if (!isAnimating && animationState === 'animating') {
      stopAnimation();
      setAnimationState('idle');
    }
  }, [isAnimating, animationState, startAnimation, stopAnimation]);

  /**
   * Handle reduced motion preference
   */
  useEffect(() => {
    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Instantly complete animation for reduced motion
      if (isAnimating) {
        updateProgress(1);
        setAnimationState('complete');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }
  }, [isAnimating, respectReducedMotion, updateProgress, onAnimationComplete]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...getHardwareAccelerationStyles(
      finalConfig.useHardwareAcceleration,
      capabilities.hasGPUAcceleration
    )
  };

  const baseImageStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center'
  };

  const fromImageStyles: React.CSSProperties = {
    ...baseImageStyles,
    zIndex: 1
  };

  const toImageStyles: React.CSSProperties = {
    ...baseImageStyles,
    zIndex: 2,
    ...getMaskStyles(internalProgress),
    ...getClipPathStyles(internalProgress),
    ...getFallbackStyles(internalProgress)
  };

  return (
    <div
      className={`fade-transition ${className}`}
      style={containerStyles}
      data-testid={testId}
      data-animation-method={animationMethod}
      data-state={animationState}
      data-progress={internalProgress}
    >
      {/* Base image (mannequin) */}
      <img
        src={fromImage}
        alt={`${alt} - before`}
        style={fromImageStyles}
        className="fade-transition__from-image"
        loading="eager"
      />

      {/* Overlay image (generated result) with animation */}
      <img
        src={toImage}
        alt={`${alt} - after`}
        style={toImageStyles}
        className="fade-transition__to-image"
        loading="eager"
      />

      {/* Debug information */}
      {finalConfig.debug && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            zIndex: 10,
            fontFamily: 'monospace'
          }}
        >
          {animationMethod} | {Math.round(internalProgress * 100)}%
        </div>
      )}
    </div>
  );
});

FadeTransition.displayName = 'FadeTransition';

// =============================================================================
// EXPORTS
// =============================================================================

export default FadeTransition;

export type {
  FadeTransitionProps,
  FadeTransitionConfig,
  BrowserCapabilities
};

export {
  detectBrowserCapabilities,
  chooseAnimationMethod,
  MASK_GRADIENTS,
  CLIP_PATH_VALUES
};