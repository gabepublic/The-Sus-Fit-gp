/**
 * @fileoverview useImagePreloader - Robust image preloading hook for smooth Try It On animations
 * @module @/mobile/components/TryItOn/hooks/useImagePreloader
 * @version 1.0.0
 *
 * This hook provides comprehensive image preloading capabilities with memory management,
 * cache optimization, and error handling specifically designed for the Try It On
 * transformation animations. Ensures smooth transitions by preloading generated
 * result images before animation begins.
 *
 * @example
 * ```typescript
 * import { useImagePreloader } from './useImagePreloader';
 *
 * function ImageTransformation({ generatedImageUrl }) {
 *   const { preloadImage, isLoading, isLoaded, error, clearCache } = useImagePreloader({
 *     cacheSize: 10,
 *     timeout: 10000
 *   });
 *
 *   const handlePreload = async () => {
 *     await preloadImage(generatedImageUrl);
 *     // Start animation now that image is loaded
 *   };
 * }
 * ```
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Image loading state
 */
export type ImageLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Image cache entry with metadata
 */
export interface ImageCacheEntry {
  /** The loaded image element */
  image: HTMLImageElement;
  /** URL that was loaded */
  url: string;
  /** Timestamp when loaded */
  loadedAt: number;
  /** Size in bytes (estimate) */
  sizeBytes: number;
  /** Number of times accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccessed: number;
}

/**
 * Preloader configuration options
 */
export interface UseImagePreloaderConfig {
  /** Maximum number of images to cache */
  cacheSize?: number;
  /** Timeout for image loading in milliseconds */
  timeout?: number;
  /** Enable progressive loading for slow connections */
  progressiveLoading?: boolean;
  /** Retry failed loads automatically */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Preload on component mount */
  preloadOnMount?: boolean;
  /** URLs to preload on mount */
  initialUrls?: string[];
}

/**
 * Image loading result
 */
export interface ImageLoadResult {
  /** Whether loading was successful */
  success: boolean;
  /** The loaded image element (if successful) */
  image?: HTMLImageElement;
  /** Error message (if failed) */
  error?: string;
  /** Load duration in milliseconds */
  duration: number;
  /** Whether image was loaded from cache */
  fromCache: boolean;
}

/**
 * Preloader state interface
 */
export interface PreloaderState {
  /** Current loading state */
  loadingState: ImageLoadingState;
  /** Currently loading URLs */
  loadingUrls: Set<string>;
  /** Error message if any */
  error: string | null;
  /** Cache statistics */
  cacheStats: {
    size: number;
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
  };
}

/**
 * Hook return interface
 */
export interface UseImagePreloaderReturn {
  /** Preload a single image */
  preloadImage: (url: string) => Promise<ImageLoadResult>;
  /** Preload multiple images */
  preloadImages: (urls: string[]) => Promise<ImageLoadResult[]>;
  /** Check if image is in cache */
  isImageCached: (url: string) => boolean;
  /** Get cached image element */
  getCachedImage: (url: string) => HTMLImageElement | null;
  /** Clear specific image from cache */
  removeFromCache: (url: string) => void;
  /** Clear entire cache */
  clearCache: () => void;
  /** Current preloader state */
  state: PreloaderState;
  /** Whether any image is currently loading */
  isLoading: boolean;
  /** Whether specific URL is loaded */
  isLoaded: (url: string) => boolean;
  /** Get cache statistics */
  getCacheStats: () => PreloaderState['cacheStats'];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<UseImagePreloaderConfig> = {
  cacheSize: 20,
  timeout: 10000, // 10 seconds
  progressiveLoading: true,
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  debug: process.env.NODE_ENV === 'development',
  preloadOnMount: false,
  initialUrls: []
};

/**
 * Maximum cache size to prevent memory issues
 */
const MAX_CACHE_SIZE = 50;

/**
 * Estimated bytes per pixel for size calculation
 */
const BYTES_PER_PIXEL = 4; // RGBA

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Estimate image size in bytes
 */
function estimateImageSize(image: HTMLImageElement): number {
  return image.naturalWidth * image.naturalHeight * BYTES_PER_PIXEL;
}

/**
 * Create a cache key from URL
 */
function createCacheKey(url: string): string {
  // Remove query parameters that don't affect the image
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('t'); // Remove timestamp
    urlObj.searchParams.delete('cache'); // Remove cache busters
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is valid for preloading
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    // Check for common image extensions or data URLs
    return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
           url.startsWith('data:image/') ||
           url.startsWith('blob:');
  } catch {
    return false;
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Image preloader hook with caching and memory management
 */
export function useImagePreloader(
  config: UseImagePreloaderConfig = {}
): UseImagePreloaderReturn {
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Image cache with LRU eviction
  const cacheRef = useRef<Map<string, ImageCacheEntry>>(new Map());
  const loadingPromisesRef = useRef<Map<string, Promise<ImageLoadResult>>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // State management
  const [state, setState] = useState<PreloaderState>({
    loadingState: 'idle',
    loadingUrls: new Set(),
    error: null,
    cacheStats: {
      size: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheHits: 0
    }
  });

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (finalConfig.debug) {
      console.log('[useImagePreloader]', ...args);
    }
  }, [finalConfig.debug]);

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  /**
   * Update cache statistics
   */
  const updateCacheStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      cacheStats: {
        ...prev.cacheStats,
        size: cacheRef.current.size,
        hitRate: prev.cacheStats.totalRequests > 0
          ? prev.cacheStats.cacheHits / prev.cacheStats.totalRequests
          : 0
      }
    }));
  }, []);

  /**
   * Evict least recently used cache entries
   */
  const evictLRU = useCallback(() => {
    const cache = cacheRef.current;
    const maxSize = Math.min(finalConfig.cacheSize, MAX_CACHE_SIZE);

    if (cache.size <= maxSize) return;

    // Sort by last accessed time and remove oldest
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.slice(0, cache.size - maxSize);
    toRemove.forEach(([key, entry]) => {
      log('Evicting from cache:', key);
      cache.delete(key);
      // Help GC by clearing image reference
      entry.image.src = '';
    });

    updateCacheStats();
  }, [finalConfig.cacheSize, log, updateCacheStats]);

  /**
   * Add image to cache
   */
  const addToCache = useCallback((url: string, image: HTMLImageElement) => {
    const cacheKey = createCacheKey(url);
    const entry: ImageCacheEntry = {
      image,
      url,
      loadedAt: Date.now(),
      sizeBytes: estimateImageSize(image),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    cacheRef.current.set(cacheKey, entry);
    log('Added to cache:', cacheKey, `${Math.round(entry.sizeBytes / 1024)}KB`);

    evictLRU();
  }, [evictLRU, log]);

  /**
   * Get image from cache
   */
  const getFromCache = useCallback((url: string): HTMLImageElement | null => {
    const cacheKey = createCacheKey(url);
    const entry = cacheRef.current.get(cacheKey);

    if (entry) {
      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      setState(prev => ({
        ...prev,
        cacheStats: {
          ...prev.cacheStats,
          totalRequests: prev.cacheStats.totalRequests + 1,
          cacheHits: prev.cacheStats.cacheHits + 1
        }
      }));

      log('Cache hit:', cacheKey);
      return entry.image;
    }

    setState(prev => ({
      ...prev,
      cacheStats: {
        ...prev.cacheStats,
        totalRequests: prev.cacheStats.totalRequests + 1
      }
    }));

    return null;
  }, [log]);

  // =============================================================================
  // LOADING FUNCTIONS
  // =============================================================================

  /**
   * Load a single image with retry logic
   */
  const loadImageWithRetry = useCallback(async (
    url: string,
    retryCount: number = 0
  ): Promise<ImageLoadResult> => {
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedImage = getFromCache(url);
      if (cachedImage) {
        return {
          success: true,
          image: cachedImage,
          duration: Date.now() - startTime,
          fromCache: true
        };
      }

      // Create new image element
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Enable CORS for canvas operations

      // Set up abort controller for timeout
      const abortController = new AbortController();
      abortControllersRef.current.set(url, abortController);

      // Create loading promise
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        const cleanup = () => {
          abortControllersRef.current.delete(url);
          clearTimeout(timeoutId);
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Image load timeout after ${finalConfig.timeout}ms`));
        }, finalConfig.timeout);

        image.onload = () => {
          cleanup();
          resolve(image);
        };

        image.onerror = () => {
          cleanup();
          reject(new Error('Failed to load image'));
        };

        // Check if already aborted
        if (abortController.signal.aborted) {
          cleanup();
          reject(new Error('Image load aborted'));
          return;
        }

        // Start loading
        image.src = url;
      });

      const loadedImage = await loadPromise;

      // Add to cache
      addToCache(url, loadedImage);

      return {
        success: true,
        image: loadedImage,
        duration: Date.now() - startTime,
        fromCache: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (finalConfig.autoRetry && retryCount < finalConfig.maxRetries) {
        log(`Retrying image load (${retryCount + 1}/${finalConfig.maxRetries}):`, url);

        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
        return loadImageWithRetry(url, retryCount + 1);
      }

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        fromCache: false
      };
    }
  }, [
    getFromCache,
    addToCache,
    finalConfig.timeout,
    finalConfig.autoRetry,
    finalConfig.maxRetries,
    finalConfig.retryDelay,
    log
  ]);

  /**
   * Preload a single image
   */
  const preloadImage = useCallback(async (url: string): Promise<ImageLoadResult> => {
    if (!isValidImageUrl(url)) {
      return {
        success: false,
        error: 'Invalid image URL',
        duration: 0,
        fromCache: false
      };
    }

    // Check if already loading
    const existingPromise = loadingPromisesRef.current.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // Update loading state
    setState(prev => ({
      ...prev,
      loadingState: 'loading',
      loadingUrls: new Set([...prev.loadingUrls, url]),
      error: null
    }));

    // Create loading promise
    const loadPromise = loadImageWithRetry(url);
    loadingPromisesRef.current.set(url, loadPromise);

    try {
      const result = await loadPromise;

      // Update state based on result
      setState(prev => {
        const newLoadingUrls = new Set(prev.loadingUrls);
        newLoadingUrls.delete(url);

        return {
          ...prev,
          loadingState: result.success ? 'loaded' : 'error',
          loadingUrls: newLoadingUrls,
          error: result.success ? null : result.error || 'Failed to load image'
        };
      });

      return result;

    } finally {
      loadingPromisesRef.current.delete(url);
    }
  }, [loadImageWithRetry]);

  /**
   * Preload multiple images
   */
  const preloadImages = useCallback(async (urls: string[]): Promise<ImageLoadResult[]> => {
    const validUrls = urls.filter(isValidImageUrl);

    if (validUrls.length === 0) {
      return [];
    }

    log('Preloading images:', validUrls);

    // Load images in parallel
    const loadPromises = validUrls.map(url => preloadImage(url));
    return Promise.all(loadPromises);
  }, [preloadImage, log]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Check if image is cached
   */
  const isImageCached = useCallback((url: string): boolean => {
    const cacheKey = createCacheKey(url);
    return cacheRef.current.has(cacheKey);
  }, []);

  /**
   * Get cached image element
   */
  const getCachedImage = useCallback((url: string): HTMLImageElement | null => {
    return getFromCache(url);
  }, [getFromCache]);

  /**
   * Remove specific image from cache
   */
  const removeFromCache = useCallback((url: string): void => {
    const cacheKey = createCacheKey(url);
    const entry = cacheRef.current.get(cacheKey);

    if (entry) {
      entry.image.src = ''; // Help GC
      cacheRef.current.delete(cacheKey);
      updateCacheStats();
      log('Removed from cache:', cacheKey);
    }
  }, [updateCacheStats, log]);

  /**
   * Clear entire cache
   */
  const clearCache = useCallback((): void => {
    // Clear all image references to help GC
    cacheRef.current.forEach(entry => {
      entry.image.src = '';
    });

    cacheRef.current.clear();
    updateCacheStats();
    log('Cache cleared');
  }, [updateCacheStats, log]);

  /**
   * Check if specific URL is loaded
   */
  const isLoaded = useCallback((url: string): boolean => {
    return isImageCached(url) && !state.loadingUrls.has(url);
  }, [isImageCached, state.loadingUrls]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => state.cacheStats, [state.cacheStats]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  /**
   * Preload initial URLs on mount
   */
  useEffect(() => {
    if (finalConfig.preloadOnMount && finalConfig.initialUrls.length > 0) {
      preloadImages(finalConfig.initialUrls);
    }
  }, [finalConfig.preloadOnMount, finalConfig.initialUrls, preloadImages]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cancel all loading operations
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();

      // Clear promises
      loadingPromisesRef.current.clear();

      // Clear cache to prevent memory leaks
      clearCache();
    };
  }, [clearCache]);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    preloadImage,
    preloadImages,
    isImageCached,
    getCachedImage,
    removeFromCache,
    clearCache,
    state,
    isLoading: state.loadingUrls.size > 0,
    isLoaded,
    getCacheStats
  };
}

/**
 * Default export for convenience
 */
export default useImagePreloader;