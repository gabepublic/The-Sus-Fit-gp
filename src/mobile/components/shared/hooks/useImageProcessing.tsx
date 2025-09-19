/**
 * @fileoverview useImageProcessing - Shared React hook for client-side image processing
 * @module @/mobile/components/shared/hooks/useImageProcessing
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  UseImageProcessingReturn,
  ImageProcessingOptions,
  ImageProcessingResult,
  ImageMetadata
} from './hooks.types';

/**
 * Default image processing options
 */
const DEFAULT_PROCESSING_OPTIONS: Required<ImageProcessingOptions> = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  format: 'image/jpeg',
  maintainAspectRatio: true,
  backgroundColor: '#ffffff',
  enableProgressive: true
};

/**
 * Shared image processing hook for client-side image manipulation
 *
 * Features:
 * - Canvas API-based image processing
 * - Image resizing with aspect ratio preservation
 * - Format conversion (JPEG, PNG, WebP)
 * - Quality compression
 * - Progress tracking
 * - Memory management and cleanup
 * - Browser capability detection
 * - Error handling with detailed messages
 *
 * @returns Image processing state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   processImage,
 *   isProcessing,
 *   progress,
 *   error,
 *   isSupported
 * } = useImageProcessing();
 *
 * const handleFileProcess = async (file: File) => {
 *   if (!isSupported) {
 *     console.warn('Image processing not supported in this browser');
 *     return;
 *   }
 *
 *   const result = await processImage(file, {
 *     quality: 0.8,
 *     maxWidth: 1200,
 *     maxHeight: 1200,
 *     format: 'image/jpeg'
 *   });
 *
 *   if (result.success) {
 *     console.log('Processed image:', result.blob);
 *     console.log('Preview URL:', result.dataUrl);
 *   }
 * };
 * ```
 */
export function useImageProcessing(): UseImageProcessingReturn {
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Check if image processing is supported in current browser
   */
  const isSupported = useMemo(() => {
    try {
      // Check for Canvas API support
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Check for toBlob support
      if (!canvas.toBlob) return false;

      // Check for Image constructor
      if (!window.Image) return false;

      // Check for URL.createObjectURL
      if (!URL.createObjectURL) return false;

      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  const calculateDimensions = useCallback((
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } => {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if too large
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }, []);

  /**
   * Load image from file
   */
  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }, []);

  /**
   * Process image to blob with specified options
   */
  const processToBlob = useCallback((
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        format,
        quality
      );
    });
  }, []);

  /**
   * Extract metadata from processed image
   */
  const extractMetadata = useCallback((
    originalFile: File,
    processedBlob: Blob,
    canvas: HTMLCanvasElement,
    originalWidth: number,
    originalHeight: number
  ): ImageMetadata => {
    return {
      filename: originalFile.name,
      size: processedBlob.size,
      type: processedBlob.type,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      processed: true,
      processedAt: new Date(),
      originalDimensions: {
        width: originalWidth,
        height: originalHeight
      }
    };
  }, []);

  /**
   * Clear processing state
   */
  const clearProcessing = useCallback(() => {
    cleanup();
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, [cleanup]);

  /**
   * Main image processing function
   */
  const processImage = useCallback(async (
    file: File,
    options: ImageProcessingOptions = {}
  ): Promise<ImageProcessingResult> => {
    // Check browser support
    if (!isSupported) {
      const error = 'Image processing is not supported in this browser';
      setError(error);
      return {
        blob: file,
        dataUrl: URL.createObjectURL(file),
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
          aspectRatio: 1,
          processed: false
        },
        success: false,
        error
      };
    }

    try {
      // Cleanup any existing processing
      cleanup();

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Reset state
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      // Merge options with defaults
      const finalOptions = { ...DEFAULT_PROCESSING_OPTIONS, ...options };

      // Load image
      setProgress(10);
      const img = await loadImage(file);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing was aborted');
      }

      // Calculate target dimensions
      setProgress(20);
      const dimensions = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        finalOptions.maxWidth,
        finalOptions.maxHeight,
        finalOptions.maintainAspectRatio
      );

      // Create canvas
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      // Set background for JPEG format
      if (finalOptions.format === 'image/jpeg') {
        ctx.fillStyle = finalOptions.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      setProgress(40);

      // Draw and resize image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing was aborted');
      }

      setProgress(70);

      // Convert to blob
      const blob = await processToBlob(canvas, finalOptions.format, finalOptions.quality);

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing was aborted');
      }

      setProgress(90);

      // Create data URL for preview
      const dataUrl = URL.createObjectURL(blob);

      // Extract metadata
      const metadata = extractMetadata(
        file,
        blob,
        canvas,
        img.naturalWidth,
        img.naturalHeight
      );

      setProgress(100);

      // Complete processing
      setIsProcessing(false);

      return {
        blob,
        dataUrl,
        metadata,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Image processing failed';

      setError(errorMessage);
      setIsProcessing(false);
      setProgress(0);

      return {
        blob: file,
        dataUrl: URL.createObjectURL(file),
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
          aspectRatio: 1,
          processed: false
        },
        success: false,
        error: errorMessage
      };
    }
  }, [
    isSupported,
    cleanup,
    loadImage,
    calculateDimensions,
    processToBlob,
    extractMetadata
  ]);

  return {
    processImage,
    isProcessing,
    progress,
    error,
    clearProcessing,
    isSupported
  };
}

/**
 * Hook for batch image processing
 */
export function useBatchImageProcessing() {
  const singleProcessor = useImageProcessing();
  const [batchProgress, setBatchProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const processBatch = useCallback(async (
    files: File[],
    options?: ImageProcessingOptions
  ): Promise<ImageProcessingResult[]> => {
    if (files.length === 0) return [];

    setIsProcessingBatch(true);
    setBatchProgress(0);
    setProcessedCount(0);
    setFailedCount(0);

    const results: ImageProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await singleProcessor.processImage(files[i], options);
        results.push(result);

        if (result.success) {
          setProcessedCount(prev => prev + 1);
        } else {
          setFailedCount(prev => prev + 1);
        }
      } catch (error) {
        setFailedCount(prev => prev + 1);
        results.push({
          blob: files[i],
          dataUrl: URL.createObjectURL(files[i]),
          metadata: {
            filename: files[i].name,
            size: files[i].size,
            type: files[i].type,
            width: 0,
            height: 0,
            aspectRatio: 1,
            processed: false
          },
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        });
      }

      setBatchProgress(((i + 1) / files.length) * 100);
    }

    setIsProcessingBatch(false);
    return results;
  }, [singleProcessor]);

  return {
    ...singleProcessor,
    processBatch,
    batchProgress,
    processedCount,
    failedCount,
    isProcessingBatch
  };
}