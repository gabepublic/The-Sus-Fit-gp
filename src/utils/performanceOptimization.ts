/**
 * Performance optimization utilities with modern browser API support,
 * memory management, and progressive enhancement patterns.
 * 
 * @example
 * ```typescript
 * import { 
 *   PerformanceMonitor, 
 *   MemoryManager, 
 *   ModernImageProcessor,
 *   FeatureDetector
 * } from './performanceOptimization';
 * 
 * // Feature detection
 * const detector = new FeatureDetector();
 * if (detector.hasImageBitmap()) {
 *   // Use modern APIs
 * }
 * 
 * // Performance monitoring
 * const monitor = new PerformanceMonitor();
 * monitor.startOperation('image-compression');
 * // ... perform operation
 * monitor.endOperation('image-compression');
 * 
 * // Memory management
 * MemoryManager.trackObject(imageBlob);
 * MemoryManager.cleanup();
 * ```
 */

import { PERFORMANCE_CONSTANTS, FEATURE_DETECTION, UPLOAD_CONFIG } from './constants';
import { FileProcessingError } from './errorHandling';

/**
 * Feature detection utility for progressive enhancement
 */
export class FeatureDetector {
  private features = new Map<string, boolean>();

  /**
   * Checks if ImageBitmap API is available
   */
  hasImageBitmap(): boolean {
    if (this.features.has('imageBitmap')) {
      return this.features.get('imageBitmap')!;
    }

    const available = 'createImageBitmap' in window && 
                     typeof createImageBitmap === 'function';
    this.features.set('imageBitmap', available);
    return available;
  }

  /**
   * Checks if OffscreenCanvas is available
   */
  hasOffscreenCanvas(): boolean {
    if (this.features.has('offscreenCanvas')) {
      return this.features.get('offscreenCanvas')!;
    }

    const available = 'OffscreenCanvas' in window;
    this.features.set('offscreenCanvas', available);
    return available;
  }

  /**
   * Checks if Web Workers are available
   */
  hasWebWorkers(): boolean {
    if (this.features.has('webWorkers')) {
      return this.features.get('webWorkers')!;
    }

    const available = 'Worker' in window;
    this.features.set('webWorkers', available);
    return available;
  }

  /**
   * Checks if Performance API is available
   */
  hasPerformanceAPI(): boolean {
    if (this.features.has('performance')) {
      return this.features.get('performance')!;
    }

    const available = 'performance' in window && 
                     typeof performance.now === 'function';
    this.features.set('performance', available);
    return available;
  }

  /**
   * Checks if requestIdleCallback is available
   */
  hasIdleCallback(): boolean {
    if (this.features.has('idleCallback')) {
      return this.features.get('idleCallback')!;
    }

    const available = 'requestIdleCallback' in window;
    this.features.set('idleCallback', available);
    return available;
  }

  /**
   * Checks if IntersectionObserver is available
   */
  hasIntersectionObserver(): boolean {
    if (this.features.has('intersectionObserver')) {
      return this.features.get('intersectionObserver')!;
    }

    const available = 'IntersectionObserver' in window;
    this.features.set('intersectionObserver', available);
    return available;
  }

  /**
   * Gets a summary of all detected features
   */
  getFeatureSummary(): Record<string, boolean> {
    return {
      imageBitmap: this.hasImageBitmap(),
      offscreenCanvas: this.hasOffscreenCanvas(),
      webWorkers: this.hasWebWorkers(),
      performanceAPI: this.hasPerformanceAPI(),
      idleCallback: this.hasIdleCallback(),
      intersectionObserver: this.hasIntersectionObserver(),
    };
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private operations = new Map<string, number>();
  private metrics = new Map<string, Array<{
    duration: number;
    timestamp: number;
  }>>();
  private featureDetector = new FeatureDetector();

  /**
   * Starts timing an operation
   */
  startOperation(operationName: string): void {
    const startTime = this.featureDetector.hasPerformanceAPI() ? 
      performance.now() : Date.now();
    
    this.operations.set(operationName, startTime);
  }

  /**
   * Ends timing an operation and stores the result
   */
  endOperation(operationName: string): number {
    const endTime = this.featureDetector.hasPerformanceAPI() ? 
      performance.now() : Date.now();
    
    const startTime = this.operations.get(operationName);
    if (!startTime) {
      console.warn(`Operation "${operationName}" was not started`);
      return 0;
    }

    const duration = endTime - startTime;
    this.operations.delete(operationName);

    // Store metric
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    
    const operationMetrics = this.metrics.get(operationName)!;
    operationMetrics.push({ duration, timestamp: Date.now() });

    // Keep only last 100 measurements
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    return duration;
  }

  /**
   * Gets performance metrics for an operation
   */
  getMetrics(operationName: string): {
    count: number;
    averageMs: number;
    minMs: number;
    maxMs: number;
    lastMs: number;
  } | null {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    return {
      count: durations.length,
      averageMs: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minMs: Math.min(...durations),
      maxMs: Math.max(...durations),
      lastMs: durations[durations.length - 1],
    };
  }

  /**
   * Gets all performance metrics
   */
  getAllMetrics(): Record<string, ReturnType<typeof this.getMetrics>> {
    const result: Record<string, ReturnType<typeof this.getMetrics>> = {};
    
    for (const operationName of this.metrics.keys()) {
      result[operationName] = this.getMetrics(operationName);
    }
    
    return result;
  }

  /**
   * Clears all stored metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.operations.clear();
  }
}

/**
 * Memory management utility
 */
export class MemoryManager {
  private static trackedObjects = new Set<{
    object: any;
    type: string;
    timestamp: number;
  }>();
  private static cleanupHandlers = new Set<() => void>();

  /**
   * Tracks an object for memory management
   */
  static trackObject(object: any, type = 'unknown'): void {
    this.trackedObjects.add({
      object,
      type,
      timestamp: Date.now(),
    });

    // Auto-cleanup old objects
    if (this.trackedObjects.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Adds a cleanup handler
   */
  static addCleanupHandler(handler: () => void): void {
    this.cleanupHandlers.add(handler);
  }

  /**
   * Removes a cleanup handler
   */
  static removeCleanupHandler(handler: () => void): void {
    this.cleanupHandlers.delete(handler);
  }

  /**
   * Performs memory cleanup
   */
  static cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    // Clean up old tracked objects
    for (const tracked of this.trackedObjects) {
      if (now - tracked.timestamp > maxAge) {
        // Clean up specific object types
        if (tracked.object instanceof ImageBitmap) {
          tracked.object.close();
        }
        
        this.trackedObjects.delete(tracked);
      }
    }

    // Run custom cleanup handlers
    this.cleanupHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.warn('Cleanup handler failed:', error);
      }
    });

    // Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Gets memory usage statistics
   */
  static getMemoryStats(): {
    trackedObjects: number;
    cleanupHandlers: number;
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
  } {
    const stats = {
      trackedObjects: this.trackedObjects.size,
      cleanupHandlers: this.cleanupHandlers.size,
    };

    // Add browser memory info if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      (stats as any).memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    return stats;
  }

  /**
   * Checks if memory usage is high
   */
  static isMemoryHigh(): boolean {
    const stats = this.getMemoryStats();
    
    if (stats.memoryUsage) {
      return stats.memoryUsage.percentage > PERFORMANCE_CONSTANTS.MEMORY.WARNING_THRESHOLD * 100;
    }

    // Fallback: consider high if tracking many objects
    return stats.trackedObjects > 500;
  }
}

/**
 * Modern image processing utility with progressive enhancement
 */
export class ModernImageProcessor {
  private featureDetector = new FeatureDetector();
  private performanceMonitor = new PerformanceMonitor();

  /**
   * Creates an optimized canvas context
   */
  private createOptimizedCanvas(width: number, height: number): {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  } {
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    // Use OffscreenCanvas if available (better performance)
    if (this.featureDetector.hasOffscreenCanvas()) {
      canvas = new OffscreenCanvas(width, height);
      context = canvas.getContext('2d')!;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      context = canvas.getContext('2d')!;
    }

    // Configure for high-quality rendering
    context.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in context) {
      context.imageSmoothingQuality = 'high';
    }

    return { canvas, context };
  }

  /**
   * Processes image using modern APIs with fallbacks
   */
  async processImageModern(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: string;
    } = {}
  ): Promise<Blob> {
    this.performanceMonitor.startOperation('modern-image-process');

    try {
      // Use ImageBitmap API if available
      if (this.featureDetector.hasImageBitmap()) {
        return await this.processWithImageBitmap(file, options);
      }

      // Fallback to Canvas API
      return await this.processWithCanvas(file, options);
    } finally {
      this.performanceMonitor.endOperation('modern-image-process');
    }
  }

  /**
   * Processes image using ImageBitmap API
   */
  private async processWithImageBitmap(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: string;
    }
  ): Promise<Blob> {
    // Create ImageBitmap from file
    const bitmap = await createImageBitmap(file);
    MemoryManager.trackObject(bitmap, 'ImageBitmap');

    try {
      let { width, height } = bitmap;

      // Calculate resize if needed
      if (options.maxWidth || options.maxHeight) {
        const maxW = options.maxWidth || width;
        const maxH = options.maxHeight || height;
        
        if (width > maxW || height > maxH) {
          const aspectRatio = width / height;
          
          if (width > maxW) {
            width = maxW;
            height = maxW / aspectRatio;
          }
          
          if (height > maxH) {
            height = maxH;
            width = maxH * aspectRatio;
          }
        }
      }

      // Create optimized canvas
      const { canvas, context } = this.createOptimizedCanvas(
        Math.floor(width),
        Math.floor(height)
      );

      // Draw bitmap to canvas
      context.drawImage(bitmap, 0, 0, width, height);

      // Convert to blob
      const format = options.format || 'image/jpeg';
      const quality = options.quality || UPLOAD_CONFIG.DEFAULT_COMPRESSION_QUALITY;

      if (canvas instanceof OffscreenCanvas) {
        return await canvas.convertToBlob({ type: format, quality });
      } else {
        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new FileProcessingError('Failed to create blob', 'BLOB_CREATION_ERROR'));
            },
            format,
            quality
          );
        });
      }
    } finally {
      bitmap.close(); // Free ImageBitmap memory
    }
  }

  /**
   * Processes image using Canvas API (fallback)
   */
  private async processWithCanvas(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: string;
    }
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        try {
          let { width, height } = img;

          // Calculate resize if needed
          if (options.maxWidth || options.maxHeight) {
            const maxW = options.maxWidth || width;
            const maxH = options.maxHeight || height;
            
            if (width > maxW || height > maxH) {
              const aspectRatio = width / height;
              
              if (width > maxW) {
                width = maxW;
                height = maxW / aspectRatio;
              }
              
              if (height > maxH) {
                height = maxH;
                width = maxH * aspectRatio;
              }
            }
          }

          // Create optimized canvas
          const { canvas, context } = this.createOptimizedCanvas(
            Math.floor(width),
            Math.floor(height)
          );

          // Draw image to canvas
          context.drawImage(img, 0, 0, width, height);

          // Convert to blob
          const format = options.format || 'image/jpeg';
          const quality = options.quality || UPLOAD_CONFIG.DEFAULT_COMPRESSION_QUALITY;

          if (canvas instanceof HTMLCanvasElement) {
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new FileProcessingError('Failed to create blob', 'BLOB_CREATION_ERROR'));
              },
              format,
              quality
            );
          } else {
            // OffscreenCanvas
            (canvas as OffscreenCanvas).convertToBlob({ type: format, quality })
              .then(resolve)
              .catch(reject);
          }
        } catch (error) {
          reject(new FileProcessingError(
            'Canvas processing error',
            'CANVAS_ERROR',
            { error }
          ));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new FileProcessingError('Failed to load image', 'IMAGE_LOAD_ERROR'));
      };

      img.src = url;
    });
  }

  /**
   * Gets performance metrics for this processor
   */
  getPerformanceMetrics(): Record<string, any> {
    return this.performanceMonitor.getAllMetrics();
  }
}

/**
 * Idle callback utility with fallback
 */
export class IdleCallbackManager {
  private featureDetector = new FeatureDetector();
  private pendingCallbacks = new Set<number>();

  /**
   * Schedules a callback for idle time with fallback to setTimeout
   */
  requestIdleCallback(
    callback: (deadline?: IdleDeadline) => void,
    options?: { timeout?: number }
  ): number {
    if (this.featureDetector.hasIdleCallback()) {
      const id = requestIdleCallback(callback, options);
      this.pendingCallbacks.add(id);
      return id;
    }

    // Fallback to setTimeout
    const id = setTimeout(() => {
      callback();
      this.pendingCallbacks.delete(id);
    }, options?.timeout || 0) as any;
    
    this.pendingCallbacks.add(id);
    return id;
  }

  /**
   * Cancels an idle callback
   */
  cancelIdleCallback(id: number): void {
    this.pendingCallbacks.delete(id);
    
    if (this.featureDetector.hasIdleCallback()) {
      cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }

  /**
   * Cancels all pending callbacks
   */
  cancelAllCallbacks(): void {
    this.pendingCallbacks.forEach(id => this.cancelIdleCallback(id));
    this.pendingCallbacks.clear();
  }

  /**
   * Gets number of pending callbacks
   */
  getPendingCount(): number {
    return this.pendingCallbacks.size;
  }
}

/**
 * Global performance optimization utilities
 */
export const PerformanceUtils = {
  /**
   * Global feature detector instance
   */
  featureDetector: new FeatureDetector(),

  /**
   * Global performance monitor instance
   */
  monitor: new PerformanceMonitor(),

  /**
   * Global modern image processor instance
   */
  imageProcessor: new ModernImageProcessor(),

  /**
   * Global idle callback manager instance
   */
  idleManager: new IdleCallbackManager(),

  /**
   * Initializes performance optimization
   */
  initialize(): void {
    // Start memory cleanup interval
    setInterval(() => {
      MemoryManager.cleanup();
    }, PERFORMANCE_CONSTANTS.MONITORING.CLEANUP_INTERVAL);

    // Log feature detection results in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Performance Features Detected:', 
        this.featureDetector.getFeatureSummary()
      );
    }
  },

  /**
   * Gets comprehensive performance stats
   */
  getStats(): {
    features: Record<string, boolean>;
    memory: ReturnType<typeof MemoryManager.getMemoryStats>;
    metrics: Record<string, any>;
  } {
    return {
      features: this.featureDetector.getFeatureSummary(),
      memory: MemoryManager.getMemoryStats(),
      metrics: this.monitor.getAllMetrics(),
    };
  },
};

// Classes are already exported above