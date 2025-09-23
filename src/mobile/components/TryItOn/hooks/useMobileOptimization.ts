/**
 * @fileoverview useMobileOptimization - Hook for mobile device optimization and detection
 * @module @/mobile/components/TryItOn/hooks/useMobileOptimization
 * @version 1.0.0
 *
 * This hook provides mobile device detection, performance optimization suggestions,
 * and accessibility enhancements specifically for phone-sized screens.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Mobile device capabilities
 */
export interface MobileCapabilities {
  /** Device has vibration support */
  hasVibration: boolean;
  /** Device supports touch events */
  hasTouch: boolean;
  /** Device has orientation support */
  hasOrientation: boolean;
  /** Device supports modern image formats */
  hasModernImageSupport: boolean;
  /** Device has high pixel density */
  hasHighDPI: boolean;
  /** Device supports reduced motion preference */
  hasReducedMotionSupport: boolean;
  /** Device supports safe area insets */
  hasSafeAreaSupport: boolean;
}

/**
 * Device performance level
 */
export type PerformanceLevel = 'low' | 'medium' | 'high';

/**
 * Screen orientation
 */
export type ScreenOrientation = 'portrait' | 'landscape';

/**
 * Mobile optimization configuration
 */
export interface MobileOptimizationConfig {
  /** Performance level of the device */
  performanceLevel: PerformanceLevel;
  /** Current screen orientation */
  orientation: ScreenOrientation;
  /** Device capabilities */
  capabilities: MobileCapabilities;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
    availableWidth: number;
    availableHeight: number;
  };
  /** Device pixel ratio */
  pixelRatio: number;
  /** Whether device is in reduced motion mode */
  prefersReducedMotion: boolean;
  /** Whether device prefers dark color scheme */
  prefersDarkMode: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Performance thresholds for device classification
 */
const PERFORMANCE_THRESHOLDS = {
  memory: {
    low: 2,      // < 2GB
    medium: 4,   // 2GB - 4GB
    high: 4      // > 4GB
  },
  cores: {
    low: 2,      // < 2 cores
    medium: 4,   // 2-4 cores
    high: 4      // > 4 cores
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Detect device performance level based on available hardware info
 */
function detectPerformanceLevel(): PerformanceLevel {
  if (typeof navigator === 'undefined') return 'medium';

  // Check for device memory API (Chrome only)
  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;

  let score = 0;

  // Memory score (if available)
  if (deviceMemory) {
    if (deviceMemory >= PERFORMANCE_THRESHOLDS.memory.high) score += 2;
    else if (deviceMemory >= PERFORMANCE_THRESHOLDS.memory.medium) score += 1;
  } else {
    score += 1; // Default medium score if memory unknown
  }

  // CPU cores score
  if (hardwareConcurrency >= PERFORMANCE_THRESHOLDS.cores.high) score += 2;
  else if (hardwareConcurrency >= PERFORMANCE_THRESHOLDS.cores.medium) score += 1;

  // Connection speed (if available)
  const connection = (navigator as any).connection;
  if (connection) {
    if (connection.effectiveType === '4g') score += 1;
    else if (connection.effectiveType === '3g') score += 0.5;
  }

  if (score >= 3) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

/**
 * Detect mobile device capabilities
 */
function detectMobileCapabilities(): MobileCapabilities {
  if (typeof window === 'undefined') {
    return {
      hasVibration: false,
      hasTouch: false,
      hasOrientation: false,
      hasModernImageSupport: false,
      hasHighDPI: false,
      hasReducedMotionSupport: false,
      hasSafeAreaSupport: false
    };
  }

  return {
    hasVibration: 'vibrate' in navigator,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasOrientation: 'orientation' in window || 'onorientationchange' in window,
    hasModernImageSupport: typeof window.createImageBitmap === 'function',
    hasHighDPI: window.devicePixelRatio > 1.5,
    hasReducedMotionSupport: typeof window.matchMedia === 'function',
    hasSafeAreaSupport: CSS.supports('padding-top', 'env(safe-area-inset-top)')
  };
}

/**
 * Get current screen orientation
 */
function getScreenOrientation(): ScreenOrientation {
  if (typeof window === 'undefined') return 'portrait';

  if (window.screen?.orientation) {
    return window.screen.orientation.angle % 180 === 0 ? 'portrait' : 'landscape';
  }

  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers dark color scheme
 */
function prefersDarkMode(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for mobile device optimization and performance detection
 */
export function useMobileOptimization(): MobileOptimizationConfig {
  const [config, setConfig] = useState<MobileOptimizationConfig>(() => ({
    performanceLevel: 'medium',
    orientation: 'portrait',
    capabilities: detectMobileCapabilities(),
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 375,
      height: typeof window !== 'undefined' ? window.innerHeight : 667,
      availableWidth: typeof window !== 'undefined' ? window.screen?.availWidth || window.innerWidth : 375,
      availableHeight: typeof window !== 'undefined' ? window.screen?.availHeight || window.innerHeight : 667
    },
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    prefersReducedMotion: prefersReducedMotion(),
    prefersDarkMode: prefersDarkMode()
  }));

  /**
   * Update configuration when viewport or orientation changes
   */
  const updateConfig = useCallback(() => {
    if (typeof window === 'undefined') return;

    setConfig(prev => ({
      ...prev,
      orientation: getScreenOrientation(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        availableWidth: window.screen?.availWidth || window.innerWidth,
        availableHeight: window.screen?.availHeight || window.innerHeight
      },
      pixelRatio: window.devicePixelRatio,
      prefersReducedMotion: prefersReducedMotion(),
      prefersDarkMode: prefersDarkMode()
    }));
  }, []);

  // Initialize and listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial detection
    setConfig({
      performanceLevel: detectPerformanceLevel(),
      orientation: getScreenOrientation(),
      capabilities: detectMobileCapabilities(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        availableWidth: window.screen?.availWidth || window.innerWidth,
        availableHeight: window.screen?.availHeight || window.innerHeight
      },
      pixelRatio: window.devicePixelRatio,
      prefersReducedMotion: prefersReducedMotion(),
      prefersDarkMode: prefersDarkMode()
    });

    // Event listeners
    window.addEventListener('resize', updateConfig);
    window.addEventListener('orientationchange', updateConfig);

    // Media query listeners for preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = () => updateConfig();
    const handleDarkModeChange = () => updateConfig();

    if (reducedMotionQuery.addListener) {
      reducedMotionQuery.addListener(handleReducedMotionChange);
      darkModeQuery.addListener(handleDarkModeChange);
    } else {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
      darkModeQuery.addEventListener('change', handleDarkModeChange);
    }

    return () => {
      window.removeEventListener('resize', updateConfig);
      window.removeEventListener('orientationchange', updateConfig);

      if (reducedMotionQuery.removeListener) {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
        darkModeQuery.removeListener(handleDarkModeChange);
      } else {
        reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
        darkModeQuery.removeEventListener('change', handleDarkModeChange);
      }
    };
  }, [updateConfig]);

  return config;
}

/**
 * Get performance-optimized configuration for animations
 */
export function getPerformanceConfig(performanceLevel: PerformanceLevel, prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      enableAnimations: false,
      animationDuration: 0,
      enableTransitions: false,
      enableHaptics: false
    };
  }

  switch (performanceLevel) {
    case 'low':
      return {
        enableAnimations: true,
        animationDuration: 150,
        enableTransitions: true,
        enableHaptics: false,
        reduceComplexity: true
      };
    case 'medium':
      return {
        enableAnimations: true,
        animationDuration: 300,
        enableTransitions: true,
        enableHaptics: true,
        reduceComplexity: false
      };
    case 'high':
      return {
        enableAnimations: true,
        animationDuration: 500,
        enableTransitions: true,
        enableHaptics: true,
        reduceComplexity: false,
        enableAdvancedEffects: true
      };
    default:
      return {
        enableAnimations: true,
        animationDuration: 300,
        enableTransitions: true,
        enableHaptics: true
      };
  }
}

export default useMobileOptimization;