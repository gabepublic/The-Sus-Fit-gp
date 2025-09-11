/**
 * @fileoverview Image Processing Utilities for UploadFit
 * @module @/mobile/components/UploadFit/utils/imageProcessing
 * @version 1.0.0
 */

import type {
  UploadConfig,
  UploadResult,
  ImageMetadata
} from '../types';

import { DEFAULT_UPLOAD_CONFIG } from '../types';

/**
 * Creates a canvas element for image processing
 * 
 * @param width Canvas width
 * @param height Canvas height
 * @returns Canvas element with context
 */
const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }
  
  canvas.width = width;
  canvas.height = height;
  
  return { canvas, ctx };
};

/**
 * Loads an image from a file
 * 
 * @param file Image file to load
 * @returns Promise resolving to loaded image element
 */
const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
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
};

/**
 * Calculates optimal dimensions while maintaining aspect ratio
 * 
 * @param originalWidth Original image width
 * @param originalHeight Original image height
 * @param maxWidth Maximum allowed width
 * @param maxHeight Maximum allowed height
 * @returns Optimal dimensions
 */
export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
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
    height: Math.round(height),
    aspectRatio
  };
};

/**
 * Compresses an image file
 * 
 * @param file Original image file
 * @param options Compression options
 * @returns Promise resolving to compressed blob
 */
export const compressImage = async (
  file: File,
  options: Partial<UploadConfig> = {}
): Promise<UploadResult<Blob>> => {
  try {
    const config = { ...DEFAULT_UPLOAD_CONFIG, ...options };
    const img = await loadImageFromFile(file);
    
    const { width, height } = calculateOptimalDimensions(
      img.naturalWidth,
      img.naturalHeight,
      config.maxWidth,
      config.maxHeight
    );

    const { canvas, ctx } = createCanvas(width, height);

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw and compress the image
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              error: null
            });
          } else {
            resolve({
              success: false,
              data: null,
              error: 'Failed to compress image'
            });
          }
        },
        file.type,
        config.quality
      );
    });

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Image compression failed'
    };
  }
};

/**
 * Generates a thumbnail from an image file
 * 
 * @param file Image file
 * @param maxSize Maximum thumbnail size (width or height)
 * @returns Promise resolving to thumbnail data URL
 */
export const generateThumbnail = async (
  file: File,
  maxSize: number = 200
): Promise<UploadResult<string>> => {
  try {
    const img = await loadImageFromFile(file);
    
    const { width, height } = calculateOptimalDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxSize,
      maxSize
    );

    const { canvas, ctx } = createCanvas(width, height);

    // Enable high-quality smoothing for thumbnails
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    return {
      success: true,
      data: dataUrl,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Thumbnail generation failed'
    };
  }
};

/**
 * Extracts metadata from an image file
 * 
 * @param file Image file
 * @returns Promise resolving to image metadata
 */
export const extractImageMetadata = async (file: File): Promise<UploadResult<ImageMetadata>> => {
  try {
    const img = await loadImageFromFile(file);

    const metadata: ImageMetadata = {
      filename: file.name,
      size: file.size,
      type: file.type,
      width: img.naturalWidth,
      height: img.naturalHeight,
      lastModified: file.lastModified
    };

    return {
      success: true,
      data: metadata,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to extract image metadata'
    };
  }
};

/**
 * Processes an image with all optimizations
 * 
 * @param file Original image file
 * @param config Processing configuration
 * @returns Promise resolving to processed image blob
 */
export const processImage = async (
  file: File,
  config: Partial<UploadConfig> = {}
): Promise<UploadResult<Blob>> => {
  const finalConfig = { ...DEFAULT_UPLOAD_CONFIG, ...config };

  // If compression is disabled, return original file as blob
  if (!finalConfig.enableCompression) {
    return {
      success: true,
      data: new Blob([file], { type: file.type }),
      error: null
    };
  }

  // Compress the image
  return compressImage(file, finalConfig);
};

/**
 * Converts a blob to a data URL
 * 
 * @param blob Blob to convert
 * @returns Promise resolving to data URL
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to convert blob to data URL'));
    };
    
    reader.readAsDataURL(blob);
  });
};

/**
 * Creates an object URL from a processed image
 * 
 * @param file Original file
 * @param config Processing configuration
 * @returns Promise resolving to object URL
 */
export const createImageObjectUrl = async (
  file: File,
  config: Partial<UploadConfig> = {}
): Promise<UploadResult<string>> => {
  try {
    const result = await processImage(file, config);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error || 'Failed to process image'
      };
    }

    const objectUrl = URL.createObjectURL(result.data);

    return {
      success: true,
      data: objectUrl,
      error: null
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create object URL'
    };
  }
};

/**
 * Revokes an object URL to free memory
 * 
 * @param url Object URL to revoke
 */
export const revokeObjectUrl = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('Failed to revoke object URL:', error);
  }
};