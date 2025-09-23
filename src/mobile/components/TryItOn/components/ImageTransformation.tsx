/**
 * @fileoverview ImageTransformation - Main orchestration component for Try It On image transformation
 * @module @/mobile/components/TryItOn/components/ImageTransformation
 * @version 1.0.0
 *
 * This component orchestrates the complete image transformation animation sequence,
 * integrating PhotoFrame, FadeTransition, ImageTransitionContainer, and image preloading
 * to create a seamless mannequin-to-result transformation experience optimized for mobile.
 *
 * @example
 * ```typescript
 * import { ImageTransformation } from './ImageTransformation';
 *
 * <ImageTransformation
 *   mannequinImageUrl="/images/mobile/mannequin.png"
 *   generatedImageUrl="/generated-result.jpg"
 *   isTransforming={true}
 *   onTransformationComplete={() => console.log('Transformation complete')}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoFrame } from '../../shared/PhotoFrame';
import { ErrorDisplay } from '../../shared';
import { ImageTransitionContainer } from './ImageTransitionContainer';
import { FadeTransition } from '../animations/FadeTransition';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { createAriaLiveRegion, getStateAnnouncement, getProgressAnnouncement } from '../utils/accessibility';
import { transformComplete, getOptimizedVariants } from '../animations/variants';
import { PHOTOFRAME_VIEW_CONFIGS } from '../../shared/PhotoFrame/photoframe.config';
import type { PhotoFrameState } from '../../shared/PhotoFrame/PhotoFrame.types';
import { PHOTO_FRAME_STATE } from '../../shared/PhotoFrame/PhotoFrame.types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Transformation phases
 */
export type TransformationPhase =
  | 'idle'         // No transformation active
  | 'preparing'    // Preloading images and preparing
  | 'transforming' // Active transformation animation
  | 'completing'   // Finishing touches and cleanup
  | 'complete'     // Transformation finished
  | 'error';       // Error occurred

/**
 * Performance monitoring data
 */
export interface PerformanceMetrics {
  /** Total transformation duration */
  totalDuration: number;
  /** Image preload time */
  preloadDuration: number;
  /** Animation duration */
  animationDuration: number;
  /** Frame rate during animation */
  averageFrameRate: number;
  /** Memory usage estimate */
  memoryUsage: number;
}

/**
 * Transformation configuration
 */
export interface ImageTransformationConfig {
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Enable image preloading */
  enablePreloading?: boolean;
  /** Preload timeout in milliseconds */
  preloadTimeout?: number;
  /** Fallback animation for low-performance devices */
  enableFallbacks?: boolean;
  /** Error retry configuration */
  errorRetry?: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
  };
  /** Accessibility configuration */
  accessibility?: {
    enableAnnouncements: boolean;
    announceProgress: boolean;
    customMessages?: Record<string, string>;
  };
  /** Debug mode */
  debug?: boolean;
}

/**
 * Component props interface
 */
export interface ImageTransformationProps {
  /** Mannequin/placeholder image URL */
  mannequinImageUrl: string;
  /** Generated result image URL */
  generatedImageUrl: string | null;
  /** Whether transformation is currently active */
  isTransforming: boolean;
  /** Current transformation progress (0-1) */
  progress?: number;
  /** PhotoFrame state override */
  photoFrameState?: keyof typeof PHOTO_FRAME_STATE;
  /** Transformation configuration */
  config?: ImageTransformationConfig;
  /** Callback when transformation starts */
  onTransformationStart?: () => void;
  /** Callback when transformation completes */
  onTransformationComplete?: () => void;
  /** Callback for progress updates */
  onProgressUpdate?: (progress: number) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Callback for performance metrics */
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Alternative text for images */
  alt?: string;
  /** Error boundary fallback */
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ImageTransformationConfig> = {
  enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
  animationDuration: 1200,
  enablePreloading: true,
  preloadTimeout: 8000,
  enableFallbacks: true,
  errorRetry: {
    enabled: true,
    maxAttempts: 3,
    delay: 1000
  },
  accessibility: {
    enableAnnouncements: true,
    announceProgress: true,
    customMessages: {}
  },
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Performance thresholds for device classification
 */
const PERFORMANCE_THRESHOLDS = {
  lowEnd: {
    maxMemoryMB: 2048,
    maxConcurrency: 2,
    targetFPS: 30
  },
  midRange: {
    maxMemoryMB: 4096,
    maxConcurrency: 4,
    targetFPS: 45
  },
  highEnd: {
    targetFPS: 60
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Detect device performance tier
 */
function detectDevicePerformance(): 'low' | 'mid' | 'high' {
  if (typeof navigator === 'undefined') return 'mid';

  const memory = (navigator as any).deviceMemory || 4;
  const concurrency = navigator.hardwareConcurrency || 4;

  if (memory <= 2 || concurrency <= 2) return 'low';
  if (memory <= 4 || concurrency <= 4) return 'mid';
  return 'high';
}

/**
 * Calculate memory usage estimate
 */
function estimateMemoryUsage(imageUrls: string[]): number {
  // Rough estimate: 4 bytes per pixel for RGBA, assuming 1024x1536 average
  const bytesPerImage = 1024 * 1536 * 4;
  return imageUrls.length * bytesPerImage;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Error boundary for transformation animations
 */
class TransformationErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <ErrorDisplay
          error="Animation system error occurred"
          onRetry={this.retry}
          testId="transformation-error"
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ImageTransformation Component - Main orchestration for image transformation animations
 */
export const ImageTransformation = React.memo<ImageTransformationProps>(
function ImageTransformation({
  mannequinImageUrl,
  generatedImageUrl,
  isTransforming,
  progress,
  photoFrameState,
  config = {},
  onTransformationStart,
  onTransformationComplete,
  onProgressUpdate,
  onError,
  onPerformanceUpdate,
  className = '',
  testId = 'image-transformation',
  alt = 'Try-on transformation',
  errorFallback
}) {
  // Configuration setup
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Device performance detection
  const devicePerformance = useMemo(() => detectDevicePerformance(), []);

  // Image preloader
  const imagePreloader = useImagePreloader({
    cacheSize: 15,
    timeout: finalConfig.preloadTimeout,
    debug: finalConfig.debug
  });

  // State management
  const [transformationPhase, setTransformationPhase] = useState<TransformationPhase>('idle');
  const [internalProgress, setInternalProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalDuration: 0,
    preloadDuration: 0,
    animationDuration: 0,
    averageFrameRate: 0,
    memoryUsage: 0
  });

  // Refs for performance monitoring
  const startTimeRef = useRef<number | null>(null);
  const preloadStartRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const ariaLiveRegionRef = useRef(createAriaLiveRegion());

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (finalConfig.debug) {
      console.log('[ImageTransformation]', ...args);
    }
  }, [finalConfig.debug]);

  // =============================================================================
  // ACCESSIBILITY MANAGEMENT
  // =============================================================================

  /**
   * Announce state changes for screen readers
   */
  const announceStateChange = useCallback((phase: TransformationPhase, progressValue?: number) => {
    if (!finalConfig.accessibility.enableAnnouncements) return;

    const ariaRegion = ariaLiveRegionRef.current;
    if (!ariaRegion) return;

    let message = '';

    switch (phase) {
      case 'preparing':
        message = 'Preparing your try-on transformation';
        break;
      case 'transforming':
        if (finalConfig.accessibility.announceProgress && typeof progressValue === 'number') {
          const progressAnnouncement = getProgressAnnouncement(progressValue * 100);
          if (progressAnnouncement) {
            message = progressAnnouncement;
          }
        } else {
          message = 'Transforming your image';
        }
        break;
      case 'complete':
        message = 'Try-on transformation completed successfully';
        break;
      case 'error':
        message = 'Error occurred during transformation';
        break;
    }

    if (message) {
      ariaRegion.announce(message, 'polite');
    }
  }, [finalConfig.accessibility]);

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  /**
   * Update performance metrics
   */
  const updatePerformanceMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    if (!finalConfig.enablePerformanceMonitoring) return;

    setPerformanceMetrics(prev => {
      const newMetrics = { ...prev, ...updates };

      if (onPerformanceUpdate) {
        onPerformanceUpdate(newMetrics);
      }

      return newMetrics;
    });
  }, [finalConfig.enablePerformanceMonitoring, onPerformanceUpdate]);

  /**
   * Monitor frame rate during animation
   */
  const monitorFrameRate = useCallback(() => {
    if (!finalConfig.enablePerformanceMonitoring) return;

    frameCountRef.current++;

    requestAnimationFrame(() => {
      if (transformationPhase === 'transforming') {
        monitorFrameRate();
      }
    });
  }, [finalConfig.enablePerformanceMonitoring, transformationPhase]);

  // =============================================================================
  // TRANSFORMATION LIFECYCLE
  // =============================================================================

  /**
   * Start the transformation process
   */
  const startTransformation = useCallback(async () => {
    if (transformationPhase !== 'idle' || !generatedImageUrl) {
      return;
    }

    log('Starting transformation process');
    startTimeRef.current = performance.now();
    setTransformationPhase('preparing');
    setRetryCount(0);

    announceStateChange('preparing');

    if (onTransformationStart) {
      onTransformationStart();
    }

    try {
      // Preload generated image
      if (finalConfig.enablePreloading) {
        preloadStartRef.current = performance.now();

        const preloadResult = await imagePreloader.preloadImage(generatedImageUrl);

        if (preloadStartRef.current) {
          const preloadDuration = performance.now() - preloadStartRef.current;
          updatePerformanceMetrics({ preloadDuration });
        }

        if (!preloadResult.success) {
          throw new Error(preloadResult.error || 'Failed to preload image');
        }

        log('Image preloaded successfully');
      }

      // Calculate memory usage
      const memoryUsage = estimateMemoryUsage([mannequinImageUrl, generatedImageUrl]);
      updatePerformanceMetrics({ memoryUsage });

      // Start animation phase
      animationStartRef.current = performance.now();
      setTransformationPhase('transforming');
      announceStateChange('transforming');

      // Start frame rate monitoring
      if (finalConfig.enablePerformanceMonitoring) {
        frameCountRef.current = 0;
        monitorFrameRate();
      }

    } catch (error) {
      log('Error during preparation:', error);
      handleTransformationError(error instanceof Error ? error.message : 'Preparation failed');
    }
  }, [
    transformationPhase,
    generatedImageUrl,
    finalConfig.enablePreloading,
    finalConfig.enablePerformanceMonitoring,
    imagePreloader,
    mannequinImageUrl,
    updatePerformanceMetrics,
    announceStateChange,
    onTransformationStart,
    monitorFrameRate,
    log
  ]);

  /**
   * Complete the transformation
   */
  const completeTransformation = useCallback(() => {
    log('Completing transformation');
    setTransformationPhase('completing');

    // Calculate final performance metrics
    if (finalConfig.enablePerformanceMonitoring && animationStartRef.current) {
      const animationDuration = performance.now() - animationStartRef.current;
      const averageFrameRate = frameCountRef.current > 0
        ? (frameCountRef.current / (animationDuration / 1000))
        : 0;

      updatePerformanceMetrics({
        animationDuration,
        averageFrameRate
      });
    }

    if (startTimeRef.current) {
      const totalDuration = performance.now() - startTimeRef.current;
      updatePerformanceMetrics({ totalDuration });
    }

    // Transition to complete state
    setTimeout(() => {
      setTransformationPhase('complete');
      announceStateChange('complete');

      if (onTransformationComplete) {
        onTransformationComplete();
      }

      // Return to idle after brief delay
      setTimeout(() => {
        setTransformationPhase('idle');
      }, 500);
    }, 200);
  }, [
    finalConfig.enablePerformanceMonitoring,
    updatePerformanceMetrics,
    announceStateChange,
    onTransformationComplete,
    log
  ]);

  /**
   * Handle transformation errors
   */
  const handleTransformationError = useCallback((errorMessage: string) => {
    log('Transformation error:', errorMessage);
    setTransformationPhase('error');
    announceStateChange('error');

    if (onError) {
      onError(errorMessage);
    }

    // Auto-retry if configured
    if (finalConfig.errorRetry.enabled && retryCount < finalConfig.errorRetry.maxAttempts) {
      log(`Auto-retrying in ${finalConfig.errorRetry.delay}ms (attempt ${retryCount + 1})`);

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setTransformationPhase('idle');
        startTransformation();
      }, finalConfig.errorRetry.delay);
    }
  }, [
    finalConfig.errorRetry,
    retryCount,
    onError,
    announceStateChange,
    startTransformation,
    log
  ]);

  /**
   * Handle progress updates
   */
  const handleProgressUpdate = useCallback((newProgress: number) => {
    setInternalProgress(newProgress);

    if (finalConfig.accessibility.announceProgress) {
      announceStateChange('transforming', newProgress);
    }

    if (onProgressUpdate) {
      onProgressUpdate(newProgress);
    }

    // Complete transformation when progress reaches 100%
    if (newProgress >= 1 && transformationPhase === 'transforming') {
      completeTransformation();
    }
  }, [
    finalConfig.accessibility.announceProgress,
    transformationPhase,
    announceStateChange,
    onProgressUpdate,
    completeTransformation
  ]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Handle transformation state changes
   */
  useEffect(() => {
    if (isTransforming && transformationPhase === 'idle' && generatedImageUrl) {
      startTransformation();
    }
  }, [isTransforming, transformationPhase, generatedImageUrl, startTransformation]);

  /**
   * Handle external progress updates
   */
  useEffect(() => {
    if (typeof progress === 'number' && transformationPhase === 'transforming') {
      handleProgressUpdate(progress);
    }
  }, [progress, transformationPhase, handleProgressUpdate]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (ariaLiveRegionRef.current) {
        ariaLiveRegionRef.current.destroy();
      }
    };
  }, []);

  // =============================================================================
  // RENDER LOGIC
  // =============================================================================

  /**
   * Determine PhotoFrame state based on transformation phase
   */
  const photoFrameStateValue = useMemo(() => {
    if (photoFrameState) return photoFrameState;

    switch (transformationPhase) {
      case 'preparing':
      case 'transforming':
        return PHOTO_FRAME_STATE.UPLOADING;
      case 'complete':
        return PHOTO_FRAME_STATE.LOADED;
      case 'error':
        return PHOTO_FRAME_STATE.ERROR;
      default:
        return PHOTO_FRAME_STATE.EMPTY;
    }
  }, [photoFrameState, transformationPhase]);

  /**
   * Get optimized animation variants based on device performance
   */
  const animationVariants = useMemo(() => {
    const baseVariants = transformComplete;

    return getOptimizedVariants(baseVariants, {
      timing: {
        duration: devicePerformance === 'low' ? 600 : finalConfig.animationDuration
      },
      performance: {
        hardwareAcceleration: true,
        useWillChange: true,
        preferTransform3d: true,
        adaptiveComplexity: devicePerformance === 'low',
        targetFPS: PERFORMANCE_THRESHOLDS[devicePerformance === 'low' ? 'lowEnd' :
                   devicePerformance === 'mid' ? 'midRange' : 'highEnd'].targetFPS
      }
    });
  }, [devicePerformance, finalConfig.animationDuration]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%'
  };

  return (
    <TransformationErrorBoundary
      onError={(error, errorInfo) => {
        log('Error boundary caught:', error, errorInfo);
        handleTransformationError(error.message);
      }}
      fallback={errorFallback}
    >
      <motion.div
        className={`image-transformation ${className}`}
        style={containerStyles}
        data-testid={testId}
        data-phase={transformationPhase}
        data-progress={Math.round(internalProgress * 100)}
        data-device-performance={devicePerformance}
        variants={animationVariants}
        initial="initial"
        animate="animate"
      >
        {/* Main transformation container */}
        {transformationPhase === 'transforming' && generatedImageUrl ? (
          <ImageTransitionContainer
            currentImage={mannequinImageUrl}
            nextImage={generatedImageUrl}
            isTransitioning={true}
            transitionMode="transform"
            progress={internalProgress}
            onTransitionComplete={completeTransformation}
            onProgressUpdate={handleProgressUpdate}
            onImageError={handleTransformationError}
            aspectRatio="3:4"
            alt={alt}
            config={{
              enablePreloading: false, // Already preloaded
              useHardwareAcceleration: devicePerformance !== 'low',
              respectReducedMotion: true,
              debug: finalConfig.debug
            }}
          />
        ) : (
          <PhotoFrame
            imageUrl={transformationPhase === 'complete' ? generatedImageUrl : null}
            state={photoFrameStateValue as PhotoFrameState}
            viewType="tryon"
            progress={Math.round(internalProgress * 100)}
            loading={transformationPhase === 'preparing' || transformationPhase === 'transforming'}
            error={transformationPhase === 'error' ? 'Transformation failed' : undefined}
            alt={alt}
            testId={`${testId}-photoframe`}
            className="image-transformation__photoframe"
          />
        )}

        {/* Performance monitoring overlay (development only) */}
        {finalConfig.debug && finalConfig.enablePerformanceMonitoring && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px',
              fontSize: '11px',
              fontFamily: 'monospace',
              zIndex: 1000,
              maxWidth: '200px'
            }}
          >
            <div>Phase: {transformationPhase}</div>
            <div>Progress: {Math.round(internalProgress * 100)}%</div>
            <div>Device: {devicePerformance}</div>
            <div>FPS: {Math.round(performanceMetrics.averageFrameRate)}</div>
            <div>Memory: {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB</div>
            {retryCount > 0 && <div>Retries: {retryCount}</div>}
          </div>
        )}
      </motion.div>
    </TransformationErrorBoundary>
  );
});

ImageTransformation.displayName = 'ImageTransformation';

// =============================================================================
// EXPORTS
// =============================================================================

export default ImageTransformation;


export {
  detectDevicePerformance,
  estimateMemoryUsage,
  PERFORMANCE_THRESHOLDS
};