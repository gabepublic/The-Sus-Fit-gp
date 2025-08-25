// Image Processing Utilities for Try-On Mutations
// Comprehensive image processing functions for the business layer

import { 
  fileToBase64, 
  compressBase64, 
  isImageFile,
  FileTypeNotSupportedError,
  FileTooLargeError,
  CompressionFailedError,
  type ImageBase64
} from '@/utils/image';

// Re-export utilities needed by other business layer modules
export { 
  compressBase64, 
  CompressionFailedError,
  FileTypeNotSupportedError,
  FileTooLargeError,
  fileToBase64,
  isImageFile,
  type ImageBase64 
};

// getBase64Size function is exported where it's defined below
import { 
  type ManagedCanvas 
} from '../providers/CanvasProvider';
import {
  AdvancedCanvasOperations,
  createAdvancedCanvasOperations
} from './canvasUtils';

/**
 * Custom error for image processing failures
 */
export class ImageProcessingError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

/**
 * Custom error for image dimension validation failures
 */
export class ImageDimensionError extends Error {
  constructor(message: string, public readonly width?: number, public readonly height?: number) {
    super(message);
    this.name = 'ImageDimensionError';
  }
}

/**
 * Configuration options for image processing
 */
export interface ImageProcessingOptions {
  /** Target width for resizing (default: 1024) */
  targetWidth?: number;
  /** Target height for resizing (default: 1536) */
  targetHeight?: number;
  /** Maximum file size in KB after compression (default: 1024) */
  maxSizeKB?: number;
  /** JPEG quality for compression (0.1-1.0, default: 0.9) */
  quality?: number;
  /** Whether to preserve aspect ratio during resize (default: false) */
  preserveAspectRatio?: boolean;
}

/**
 * Default processing options for try-on images
 */
export const DEFAULT_PROCESSING_OPTIONS: Required<ImageProcessingOptions> = {
  targetWidth: 1024,
  targetHeight: 1536,
  maxSizeKB: 1024,
  quality: 0.9,
  preserveAspectRatio: false
};

/**
 * Supported image formats for conversion
 */
export enum ImageFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  GIF = 'image/gif'
}

/**
 * Image metadata extracted from file
 */
export interface ImageMetadata {
  /** Image format/MIME type */
  format: string;
  /** Image dimensions */
  dimensions: { width: number; height: number };
  /** File size in bytes */
  size: number;
  /** Color depth information */
  colorDepth?: number;
  /** Whether image has transparency */
  hasAlpha?: boolean;
  /** Estimated quality (for JPEG) */
  estimatedQuality?: number;
  /** Creation timestamp if available */
  dateCreated?: Date;
  /** Device orientation (EXIF) */
  orientation?: number;
  /** DPI/resolution information */
  resolution?: { x: number; y: number };
}

/**
 * Advanced image processing options
 */
export interface AdvancedImageProcessingOptions extends ImageProcessingOptions {
  /** Output format */
  outputFormat?: ImageFormat;
  /** Enable sharpening after resize */
  enableSharpening?: boolean;
  /** Noise reduction strength (0-1) */
  noiseReduction?: number;
  /** Enable automatic color correction */
  autoColorCorrection?: boolean;
  /** Preserve EXIF data */
  preserveExif?: boolean;
  /** Custom canvas for processing */
  canvas?: ManagedCanvas;
}

/**
 * Enhanced result of image processing operations
 */
export interface AdvancedImageProcessingResult {
  /** Processed image as base64 data URL */
  processedImage: ImageBase64;
  /** Original image metadata */
  originalMetadata: ImageMetadata;
  /** Final image metadata */
  finalMetadata: ImageMetadata;
  /** Processing metadata */
  processingMetadata: {
    wasResized: boolean;
    wasCompressed: boolean;
    wasFormatConverted: boolean;
    wasSharpened: boolean;
    hadNoiseReduction: boolean;
    compressionRatio: number;
    processingTime: number;
    operationsApplied: string[];
  };
}

/**
 * Result of image processing operations (legacy compatibility)
 */
export interface ImageProcessingResult {
  /** Processed image as base64 data URL */
  processedImage: ImageBase64;
  /** Original image dimensions */
  originalDimensions: { width: number; height: number };
  /** Final image dimensions */
  finalDimensions: { width: number; height: number };
  /** Original file size in bytes */
  originalSize: number;
  /** Final file size in bytes */
  finalSize: number;
  /** Processing metadata */
  metadata: {
    wasResized: boolean;
    wasCompressed: boolean;
    compressionRatio: number;
    processingTime: number;
  };
}

/**
 * Get image dimensions from a data URL or image element
 */
export function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new ImageProcessingError('Failed to load image for dimension analysis'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Resize image to specific dimensions
 * 
 * @param imageUrl - Source image data URL
 * @param options - Resize options
 * @returns Promise resolving to resized image data URL
 */
export function resizeImageTo1024x1536(
  imageUrl: string, 
  options: Partial<ImageProcessingOptions> = {}
): Promise<string> {
  const config = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new ImageProcessingError('Could not get canvas context'));
          return;
        }
        
        let { targetWidth, targetHeight } = config;
        
        // Calculate dimensions preserving aspect ratio if requested
        if (config.preserveAspectRatio) {
          const aspectRatio = img.width / img.height;
          const targetAspectRatio = targetWidth / targetHeight;
          
          if (aspectRatio > targetAspectRatio) {
            // Image is wider, fit to width
            targetHeight = Math.round(targetWidth / aspectRatio);
          } else {
            // Image is taller, fit to height
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }
        
        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Apply high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image resized to fit the canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Convert to data URL with specified quality
        const resizedImageUrl = canvas.toDataURL('image/jpeg', config.quality);
        resolve(resizedImageUrl);
      } catch (error) {
        reject(new ImageProcessingError(
          'Failed to resize image',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };
    
    img.onerror = () => {
      reject(new ImageProcessingError('Failed to load image for resizing'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Validate image dimensions against requirements
 */
export async function validateImageDimensions(
  imageUrl: string,
  minWidth = 512,
  minHeight = 512,
  maxWidth = 4096,
  maxHeight = 4096
): Promise<void> {
  const dimensions = await getImageDimensions(imageUrl);
  
  if (dimensions.width < minWidth || dimensions.height < minHeight) {
    throw new ImageDimensionError(
      `Image dimensions too small. Minimum: ${minWidth}x${minHeight}, got: ${dimensions.width}x${dimensions.height}`,
      dimensions.width,
      dimensions.height
    );
  }
  
  if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
    throw new ImageDimensionError(
      `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}, got: ${dimensions.width}x${dimensions.height}`,
      dimensions.width,
      dimensions.height
    );
  }
}

/**
 * Calculate file size from base64 data URL
 */
export function getBase64Size(base64: string): number {
  const base64Data = base64.split(',')[1];
  return atob(base64Data).length;
}

/**
 * Process a file through the complete try-on image pipeline
 * 
 * @param file - Input image file
 * @param options - Processing options
 * @returns Promise resolving to processing result
 */
export async function processImageForTryon(
  file: File,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ImageProcessingResult> {
  const startTime = Date.now();
  const config = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    // Step 1: Validate file type and convert to base64
    if (!isImageFile(file)) {
      throw new FileTypeNotSupportedError('Only image files are allowed');
    }
    
    const originalBase64 = await fileToBase64(file);
    const originalSize = file.size;
    const originalDimensions = await getImageDimensions(originalBase64);
    
    // Step 2: Validate dimensions
    await validateImageDimensions(originalBase64);
    
    // Step 3: Resize image to target dimensions
    const resizedImage = await resizeImageTo1024x1536(originalBase64, config);
    const finalDimensions = await getImageDimensions(resizedImage);
    
    // Step 4: Compress if needed
    let processedImage = resizedImage;
    let wasCompressed = false;
    
    const resizedSize = getBase64Size(resizedImage);
    const targetSizeBytes = config.maxSizeKB * 1024;
    
    if (resizedSize > targetSizeBytes) {
      processedImage = await compressBase64(resizedImage, config.maxSizeKB);
      wasCompressed = true;
    }
    
    const finalSize = getBase64Size(processedImage);
    const processingTime = Date.now() - startTime;
    
    return {
      processedImage,
      originalDimensions,
      finalDimensions,
      originalSize,
      finalSize,
      metadata: {
        wasResized: originalDimensions.width !== finalDimensions.width || 
                   originalDimensions.height !== finalDimensions.height,
        wasCompressed,
        compressionRatio: originalSize / finalSize,
        processingTime
      }
    };
  } catch (error) {
    if (error instanceof FileTypeNotSupportedError ||
        error instanceof FileTooLargeError ||
        error instanceof CompressionFailedError ||
        error instanceof ImageDimensionError ||
        error instanceof ImageProcessingError) {
      throw error;
    }
    
    throw new ImageProcessingError(
      'Unexpected error during image processing',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Process multiple images for try-on (model + apparel images)
 */
export async function processTryonImages(
  modelImage: File,
  apparelImages: File[],
  options: Partial<ImageProcessingOptions> = {}
): Promise<{
  modelImageResult: ImageProcessingResult;
  apparelImageResults: ImageProcessingResult[];
}> {
  // Process model image
  const modelImageResult = await processImageForTryon(modelImage, options);
  
  // Process all apparel images in parallel
  const apparelImageResults = await Promise.all(
    apparelImages.map(file => processImageForTryon(file, options))
  );
  
  return {
    modelImageResult,
    apparelImageResults
  };
}

/**
 * Extract comprehensive metadata from image
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const imageUrl = await fileToBase64(file);
  const dimensions = await getImageDimensions(imageUrl);
  
  return {
    format: file.type,
    dimensions,
    size: file.size,
    dateCreated: file.lastModified ? new Date(file.lastModified) : undefined,
    // Additional metadata would require EXIF parsing library
    // For now, we'll provide basic metadata
  };
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  imageUrl: string,
  targetFormat: ImageFormat,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new ImageProcessingError('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // For PNG with transparency, fill with white background for JPEG
        if (targetFormat === ImageFormat.JPEG) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        const convertedImageUrl = canvas.toDataURL(targetFormat, quality);
        resolve(convertedImageUrl);
      } catch (error) {
        reject(new ImageProcessingError(
          'Failed to convert image format',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };
    
    img.onerror = () => {
      reject(new ImageProcessingError('Failed to load image for format conversion'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Apply sharpening filter to image
 */
export function applySharpeningFilter(canvas: HTMLCanvasElement, strength: number = 0.5): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Could not get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Simple unsharp mask implementation
  const sharpenKernel = [
    0, -strength, 0,
    -strength, 1 + 4 * strength, -strength,
    0, -strength, 0
  ];
  
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += data[pixelIndex] * sharpenKernel[kernelIndex];
          }
        }
        newData[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  
  // Copy the new data back
  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply noise reduction filter
 */
export function applyNoiseReduction(canvas: HTMLCanvasElement, strength: number = 0.3): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Could not get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Simple blur for noise reduction
  const radius = Math.ceil(strength * 3);
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += data[(ny * width + nx) * 4 + c];
              count++;
            }
          }
        }
        
        newData[(y * width + x) * 4 + c] = sum / count;
      }
    }
  }
  
  // Copy the new data back
  for (let i = 0; i < data.length; i += 4) {
    data[i] = newData[i];     // R
    data[i + 1] = newData[i + 1]; // G
    data[i + 2] = newData[i + 2]; // B
    // Keep original alpha
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply automatic color correction
 */
export function applyAutoColorCorrection(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Could not get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate histogram
  const histogram = {
    r: new Array(256).fill(0),
    g: new Array(256).fill(0),
    b: new Array(256).fill(0)
  };
  
  for (let i = 0; i < data.length; i += 4) {
    histogram.r[data[i]]++;
    histogram.g[data[i + 1]]++;
    histogram.b[data[i + 2]]++;
  }
  
  // Find min/max values for each channel
  const getMinMax = (hist: number[]) => {
    let min = 0, max = 255;
    for (let i = 0; i < 256; i++) {
      if (hist[i] > 0) { min = i; break; }
    }
    for (let i = 255; i >= 0; i--) {
      if (hist[i] > 0) { max = i; break; }
    }
    return { min, max };
  };
  
  const rMinMax = getMinMax(histogram.r);
  const gMinMax = getMinMax(histogram.g);
  const bMinMax = getMinMax(histogram.b);
  
  // Apply histogram stretching
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, 
      ((data[i] - rMinMax.min) / (rMinMax.max - rMinMax.min)) * 255));
    data[i + 1] = Math.max(0, Math.min(255, 
      ((data[i + 1] - gMinMax.min) / (gMinMax.max - gMinMax.min)) * 255));
    data[i + 2] = Math.max(0, Math.min(255, 
      ((data[i + 2] - bMinMax.min) / (bMinMax.max - bMinMax.min)) * 255));
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Advanced image processing with comprehensive options
 */
export async function processImageAdvanced(
  file: File,
  options: Partial<AdvancedImageProcessingOptions> = {}
): Promise<AdvancedImageProcessingResult> {
  const startTime = Date.now();
  const config = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  const operationsApplied: string[] = [];
  
  try {
    // Step 1: Extract original metadata
    const originalMetadata = await extractImageMetadata(file);
    operationsApplied.push('metadata-extraction');
    
    // Step 2: Validate file type and convert to base64
    if (!isImageFile(file)) {
      throw new FileTypeNotSupportedError('Only image files are allowed');
    }
    
    let currentImage = await fileToBase64(file);
    operationsApplied.push('base64-conversion');
    
    // Step 3: Validate dimensions
    await validateImageDimensions(currentImage);
    operationsApplied.push('dimension-validation');
    
    // Step 4: Format conversion (if needed)
    let wasFormatConverted = false;
    if (options.outputFormat && options.outputFormat !== file.type) {
      currentImage = await convertImageFormat(currentImage, options.outputFormat, config.quality);
      wasFormatConverted = true;
      operationsApplied.push('format-conversion');
    }
    
    // Step 5: Create canvas for advanced processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageProcessingError('Could not get canvas context');
    
    // Load image onto canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new ImageProcessingError('Failed to load image'));
      img.src = currentImage;
    });
    
    // Set canvas dimensions based on resize requirements
    const finalWidth = config.targetWidth || img.width;
    const finalHeight = config.targetHeight || img.height;
    
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    
    const wasResized = img.width !== finalWidth || img.height !== finalHeight;
    if (wasResized) {
      operationsApplied.push('resize');
    }
    
    // Step 6: Apply advanced processing
    let wasSharpened = false;
    if (options.enableSharpening && wasResized) {
      applySharpeningFilter(canvas, 0.3);
      wasSharpened = true;
      operationsApplied.push('sharpening');
    }
    
    let hadNoiseReduction = false;
    if (options.noiseReduction && options.noiseReduction > 0) {
      applyNoiseReduction(canvas, options.noiseReduction);
      hadNoiseReduction = true;
      operationsApplied.push('noise-reduction');
    }
    
    if (options.autoColorCorrection) {
      applyAutoColorCorrection(canvas);
      operationsApplied.push('color-correction');
    }
    
    // Step 7: Convert back to data URL
    const outputFormat = options.outputFormat || ImageFormat.JPEG;
    let processedImage = canvas.toDataURL(outputFormat, config.quality);
    
    // Step 8: Compress if needed
    let wasCompressed = false;
    const processedSize = getBase64Size(processedImage);
    const targetSizeBytes = config.maxSizeKB * 1024;
    
    if (processedSize > targetSizeBytes) {
      processedImage = await compressBase64(processedImage, config.maxSizeKB);
      wasCompressed = true;
      operationsApplied.push('compression');
    }
    
    // Step 9: Generate final metadata
    const finalDimensions = await getImageDimensions(processedImage);
    const finalSize = getBase64Size(processedImage);
    const processingTime = Date.now() - startTime;
    
    const finalMetadata: ImageMetadata = {
      format: outputFormat,
      dimensions: finalDimensions,
      size: finalSize
    };
    
    return {
      processedImage,
      originalMetadata,
      finalMetadata,
      processingMetadata: {
        wasResized,
        wasCompressed,
        wasFormatConverted,
        wasSharpened,
        hadNoiseReduction,
        compressionRatio: originalMetadata.size / finalSize,
        processingTime,
        operationsApplied
      }
    };
    
  } catch (error) {
    if (error instanceof FileTypeNotSupportedError ||
        error instanceof FileTooLargeError ||
        error instanceof CompressionFailedError ||
        error instanceof ImageDimensionError ||
        error instanceof ImageProcessingError) {
      throw error;
    }
    
    throw new ImageProcessingError(
      'Unexpected error during advanced image processing',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Batch process multiple images with progress tracking
 */
export async function processImagesInBatch(
  files: File[],
  options: Partial<AdvancedImageProcessingOptions> = {},
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<AdvancedImageProcessingResult[]> {
  const results: AdvancedImageProcessingResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name);
    
    try {
      const result = await processImageAdvanced(file, options);
      results.push(result);
    } catch (error) {
      // For batch processing, we might want to continue with other files
      console.error(`Failed to process ${file.name}:`, error);
      // You could push a failed result or skip, depending on requirements
    }
  }
  
  onProgress?.(files.length, files.length, 'Complete');
  return results;
}

/**
 * Create image thumbnail with consistent dimensions
 */
export async function createImageThumbnail(
  file: File,
  size: number = 150,
  quality: number = 0.8
): Promise<string> {
  const imageUrl = await fileToBase64(file);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new ImageProcessingError('Could not get canvas context'));
          return;
        }
        
        // Calculate dimensions to maintain aspect ratio
        const aspectRatio = img.width / img.height;
        let width = size;
        let height = size;
        
        if (aspectRatio > 1) {
          height = size / aspectRatio;
        } else {
          width = size * aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(new ImageProcessingError(
          'Failed to create thumbnail',
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    };
    
    img.onerror = () => {
      reject(new ImageProcessingError('Failed to load image for thumbnail creation'));
    };
    
    img.src = imageUrl;
  });
}