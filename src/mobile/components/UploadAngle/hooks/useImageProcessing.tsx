/**
 * @fileoverview useImageProcessing - React hook for client-side image processing with Canvas API
 * @module @/mobile/components/UploadAngle/hooks/useImageProcessing
 * @version 1.0.0
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  UseImageProcessingReturn,
  UploadResult,
  UploadConfig,
  ImageMetadata
} from '../types/upload.types';
import { DEFAULT_UPLOAD_CONFIG } from '../types/upload.types';

// =============================================================================
// CANVAS API FEATURE DETECTION & TYPES (Task 4.4)
// =============================================================================

/**
 * Image processing options interface
 * 
 * @interface ImageProcessingOptions
 * @example
 * ```typescript
 * const options: ImageProcessingOptions = {
 *   quality: 0.8,
 *   maxWidth: 1920,
 *   maxHeight: 1920,
 *   format: 'image/jpeg',
 *   maintainAspectRatio: true,
 *   enableProgressive: true
 * };
 * ```
 */
interface ImageProcessingOptions {
  /** Image quality (0-1) */
  quality?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Output format (MIME type) */
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Whether to maintain aspect ratio during resize */
  maintainAspectRatio?: boolean;
  /** Enable progressive JPEG encoding */
  enableProgressive?: boolean;
  /** Background color for transparent images when converting to JPEG */
  backgroundColor?: string;
}

/**
 * Canvas processing capabilities detection result
 * 
 * @interface CanvasCapabilities
 */
interface CanvasCapabilities {
  /** OffscreenCanvas support (for Web Workers) */
  hasOffscreenCanvas: boolean;
  /** WebP format support */
  hasWebPSupport: boolean;
  /** Canvas 2D context support */
  hasCanvas2D: boolean;
  /** ImageBitmap support */
  hasImageBitmap: boolean;
  /** WebGL context support */
  hasWebGL: boolean;
}

/**
 * Image processing state interface
 * 
 * @interface ProcessingState
 */
interface ProcessingState {
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Current processing progress (0-100) */
  progress: number;
  /** Number of concurrent processing operations */
  activeOperations: number;
  /** Queue of pending operations */
  operationQueue: string[];
}

// =============================================================================
// CANVAS UTILITIES AND FEATURE DETECTION (Task 4.4)
// =============================================================================

/**
 * Detects Canvas API and related feature support
 * 
 * @returns Canvas capabilities object
 */
const detectCanvasCapabilities = (): CanvasCapabilities => {
  const capabilities: CanvasCapabilities = {
    hasOffscreenCanvas: false,
    hasWebPSupport: false,
    hasCanvas2D: false,
    hasImageBitmap: false,
    hasWebGL: false
  };

  try {
    // Check OffscreenCanvas support
    capabilities.hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    
    // Check Canvas 2D support
    const canvas = document.createElement('canvas');
    const ctx2d = canvas.getContext('2d');
    capabilities.hasCanvas2D = ctx2d !== null;
    
    // Check WebGL support
    const webglCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    capabilities.hasWebGL = webglCtx !== null;
    
    // Check ImageBitmap support
    capabilities.hasImageBitmap = typeof ImageBitmap !== 'undefined' && 
                                  typeof createImageBitmap === 'function';
    
    // Check WebP support
    if (ctx2d) {
      capabilities.hasWebPSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    }
    
  } catch (error) {
    console.warn('Canvas capability detection failed:', error);
  }

  return capabilities;
};

/**
 * Creates an optimized canvas context with proper settings
 * 
 * @param width - Canvas width
 * @param height - Canvas height
 * @param useOffscreen - Whether to use OffscreenCanvas if available
 * @returns Canvas and 2D context
 */
const createOptimizedCanvas = (
  width: number,
  height: number,
  useOffscreen: boolean = true
): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } => {
  const capabilities = detectCanvasCapabilities();
  
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  if (useOffscreen && capabilities.hasOffscreenCanvas) {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d')!;
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d')!;
  }

  // Configure context for optimal performance
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  return { canvas, ctx };
};

/**
 * Calculates optimal dimensions maintaining aspect ratio
 * 
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns Optimal dimensions
 */
const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number; scale: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if exceeds maximum dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  const scale = width / originalWidth;
  
  return {
    width: Math.round(width),
    height: Math.round(height),
    scale
  };
};

// =============================================================================
// HOOK IMPLEMENTATION (Task 4.4)
// =============================================================================

/**
 * Custom React hook for client-side image processing with Canvas API
 * 
 * @param config - Optional upload configuration
 * @returns Image processing methods and state
 * 
 * @example
 * ```typescript
 * function ImageUploader() {
 *   const {
 *     processImage,
 *     generateThumbnail,
 *     getImageDimensions,
 *     isProcessing,
 *     capabilities
 *   } = useImageProcessing({
 *     quality: 0.9,
 *     maxWidth: 1920,
 *     maxHeight: 1920
 *   });
 * 
 *   const handleFileSelect = async (file: File) => {
 *     const result = await processImage(file, { quality: 0.8 });
 *     if (result.success) {
 *       console.log('Processed image:', result.data);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
 *       {isProcessing && <div>Processing image...</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageProcessing(
  config: Partial<UploadConfig> = {}
): UseImageProcessingReturn & { 
  capabilities: CanvasCapabilities;
  processingState: ProcessingState;
} {
  // Merge config with defaults
  const processingConfig = useMemo(
    () => ({ ...DEFAULT_UPLOAD_CONFIG, ...config }),
    [config]
  );

  // Processing state
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    activeOperations: 0,
    operationQueue: []
  });

  // Canvas capabilities (memoized for performance)
  const capabilities = useMemo(() => detectCanvasCapabilities(), []);

  // Refs for cleanup
  const canvasesRef = useRef<Set<HTMLCanvasElement | OffscreenCanvas>>(new Set());
  const operationCounterRef = useRef<number>(0);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup canvases on unmount
      canvasesRef.current.forEach(canvas => {
        if (canvas instanceof HTMLCanvasElement && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      });
      canvasesRef.current.clear();
    };
  }, []);

  /**
   * Updates processing state safely
   */
  const updateProcessingState = useCallback((updates: Partial<ProcessingState>) => {
    setProcessingState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Loads an image file into an HTMLImageElement
   * 
   * @param file - Image file to load
   * @returns Promise resolving to loaded image
   */
  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = objectUrl;
    });
  }, []);

  /**
   * Processes an image with compression, resizing, and format conversion
   * 
   * @param file - Image file to process
   * @param options - Processing options
   * @returns Promise resolving to processed image blob
   * 
   * @example
   * ```typescript
   * const result = await processImage(file, {
   *   quality: 0.8,
   *   maxWidth: 1920,
   *   format: 'image/jpeg'
   * });
   * ```
   */
  const processImage = useCallback(
    async (file: File, options: Partial<ImageProcessingOptions> = {}): Promise<UploadResult<Blob>> => {
      const operationId = `process_${++operationCounterRef.current}`;
      
      try {
        // Update processing state
        updateProcessingState({
          isProcessing: true,
          progress: 0,
          activeOperations: processingState.activeOperations + 1,
          operationQueue: [...processingState.operationQueue, operationId]
        });

        // Merge options with defaults
        const processingOptions: ImageProcessingOptions = {
          quality: options.quality ?? processingConfig.quality,
          maxWidth: options.maxWidth ?? processingConfig.maxWidth,
          maxHeight: options.maxHeight ?? processingConfig.maxHeight,
          format: options.format ?? 'image/jpeg',
          maintainAspectRatio: options.maintainAspectRatio ?? true,
          enableProgressive: options.enableProgressive ?? true,
          backgroundColor: options.backgroundColor ?? '#FFFFFF'
        };

        // Load source image
        updateProcessingState({ progress: 20 });
        const img = await loadImage(file);

        // Calculate optimal dimensions
        updateProcessingState({ progress: 40 });
        const dimensions = calculateOptimalDimensions(
          img.naturalWidth,
          img.naturalHeight,
          processingOptions.maxWidth!,
          processingOptions.maxHeight!
        );

        // Create optimized canvas
        const { canvas, ctx } = createOptimizedCanvas(
          dimensions.width,
          dimensions.height,
          capabilities.hasOffscreenCanvas
        );

        // Track canvas for cleanup
        canvasesRef.current.add(canvas);

        // Handle transparent backgrounds for JPEG conversion
        if (processingOptions.format === 'image/jpeg') {
          ctx.fillStyle = processingOptions.backgroundColor!;
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        // Draw and resize image
        updateProcessingState({ progress: 60 });
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Convert to blob
        updateProcessingState({ progress: 80 });
        let blob: Blob;

        if (canvas instanceof OffscreenCanvas) {
          blob = await canvas.convertToBlob({
            type: processingOptions.format,
            quality: processingOptions.quality
          });
        } else {
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(new Error('Failed to convert canvas to blob'));
                }
              },
              processingOptions.format,
              processingOptions.quality
            );
          });
        }

        // Cleanup canvas
        canvasesRef.current.delete(canvas);

        // Update final state
        updateProcessingState({
          progress: 100,
          activeOperations: Math.max(0, processingState.activeOperations - 1),
          operationQueue: processingState.operationQueue.filter(id => id !== operationId)
        });

        // Check if all operations complete
        if (processingState.activeOperations <= 1) {
          updateProcessingState({ isProcessing: false, progress: 0 });
        }

        return {
          success: true,
          data: blob,
          error: null
        };

      } catch (error) {
        // Cleanup on error
        updateProcessingState({
          activeOperations: Math.max(0, processingState.activeOperations - 1),
          operationQueue: processingState.operationQueue.filter(id => id !== operationId)
        });

        if (processingState.activeOperations <= 1) {
          updateProcessingState({ isProcessing: false, progress: 0 });
        }

        const errorMessage = error instanceof Error ? error.message : 'Image processing failed';
        
        return {
          success: false,
          data: null,
          error: errorMessage
        };
      }
    },
    [processingConfig, capabilities, processingState, updateProcessingState, loadImage]
  );

  /**
   * Generates a thumbnail from an image file
   * 
   * @param file - Image file
   * @param maxSize - Maximum thumbnail size (width and height)
   * @returns Promise resolving to thumbnail data URL
   */
  const generateThumbnail = useCallback(
    async (file: File, maxSize: number = 150): Promise<UploadResult<string>> => {
      try {
        updateProcessingState({ isProcessing: true, progress: 0 });

        const img = await loadImage(file);
        
        // Calculate square thumbnail dimensions
        const size = Math.min(maxSize, Math.min(img.naturalWidth, img.naturalHeight));
        const { canvas, ctx } = createOptimizedCanvas(size, size, false); // Use regular canvas for data URL

        // Calculate crop area for centered square thumbnail
        const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
        const offsetX = (img.naturalWidth - sourceSize) / 2;
        const offsetY = (img.naturalHeight - sourceSize) / 2;

        // Draw cropped and resized image
        ctx.drawImage(
          img,
          offsetX, offsetY, sourceSize, sourceSize, // source
          0, 0, size, size // destination
        );

        // Convert to data URL
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.8);

        updateProcessingState({ isProcessing: false, progress: 100 });

        return {
          success: true,
          data: dataUrl,
          error: null
        };

      } catch (error) {
        updateProcessingState({ isProcessing: false, progress: 0 });
        
        const errorMessage = error instanceof Error ? error.message : 'Thumbnail generation failed';
        
        return {
          success: false,
          data: null,
          error: errorMessage
        };
      }
    },
    [loadImage, updateProcessingState]
  );

  /**
   * Gets image dimensions without full processing
   * 
   * @param file - Image file
   * @returns Promise resolving to image dimensions
   */
  const getImageDimensions = useCallback(
    async (file: File): Promise<UploadResult<{ width: number; height: number }>> => {
      try {
        const img = await loadImage(file);
        
        return {
          success: true,
          data: {
            width: img.naturalWidth,
            height: img.naturalHeight
          },
          error: null
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get image dimensions';
        
        return {
          success: false,
          data: null,
          error: errorMessage
        };
      }
    },
    [loadImage]
  );

  // Computed property for external API compatibility
  const isProcessing = useMemo(() => processingState.isProcessing, [processingState.isProcessing]);

  return {
    processImage,
    generateThumbnail,
    getImageDimensions,
    isProcessing,
    capabilities,
    processingState
  };
}

export default useImageProcessing;