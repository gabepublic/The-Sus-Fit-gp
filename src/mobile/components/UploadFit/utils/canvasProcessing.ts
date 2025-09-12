/**
 * @fileoverview Canvas API Image Processing - Resize, crop, rotate, and EXIF handling
 * @module @/mobile/components/UploadFit/utils/canvasProcessing
 * @version 1.0.0
 */

// =============================================================================
// TYPES AND INTERFACES (Task 6.3)
// =============================================================================

/**
 * EXIF orientation values
 */
export const EXIF_ORIENTATION = {
  NORMAL: 1,
  FLIP_HORIZONTAL: 2,
  ROTATE_180: 3,
  FLIP_VERTICAL: 4,
  FLIP_HORIZONTAL_ROTATE_270_CW: 5,
  ROTATE_90_CW: 6,
  FLIP_HORIZONTAL_ROTATE_90_CW: 7,
  ROTATE_270_CW: 8
} as const;

export type ExifOrientation = typeof EXIF_ORIENTATION[keyof typeof EXIF_ORIENTATION];

/**
 * Image dimensions interface
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Crop configuration
 */
export interface CropConfig {
  /** X coordinate of crop area (0-1 relative to image width) */
  x: number;
  /** Y coordinate of crop area (0-1 relative to image height) */
  y: number;
  /** Width of crop area (0-1 relative to image width) */
  width: number;
  /** Height of crop area (0-1 relative to image height) */
  height: number;
}

/**
 * Resize configuration
 */
export interface ResizeConfig {
  /** Target width in pixels */
  width?: number;
  /** Target height in pixels */
  height?: number;
  /** Whether to maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
  /** Resize quality/algorithm */
  quality?: 'low' | 'medium' | 'high';
  /** Whether to allow upscaling (default: false) */
  allowUpscale?: boolean;
}

/**
 * Canvas processing configuration
 */
export interface CanvasProcessingConfig {
  /** Target dimensions */
  resize?: ResizeConfig;
  /** Crop configuration */
  crop?: CropConfig;
  /** Whether to auto-correct EXIF orientation */
  autoOrientCorrection?: boolean;
  /** Manual rotation angle in degrees */
  rotationAngle?: number;
  /** Image smoothing enabled */
  imageSmoothingEnabled?: boolean;
  /** Image smoothing quality */
  imageSmoothingQuality?: ImageSmoothingQuality;
  /** Output format */
  outputFormat?: string;
  /** Output quality (0-1) */
  outputQuality?: number;
}

/**
 * Processing result interface
 */
export interface ProcessingResult {
  /** Processed image as File */
  file: File;
  /** Canvas element used for processing */
  canvas: HTMLCanvasElement;
  /** Original dimensions */
  originalDimensions: ImageDimensions;
  /** Final dimensions */
  finalDimensions: ImageDimensions;
  /** EXIF orientation detected */
  detectedOrientation?: ExifOrientation;
  /** Whether orientation was corrected */
  orientationCorrected: boolean;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Whether processing was successful */
  success: boolean;
  /** Error message if processing failed */
  error?: string;
}

/**
 * EXIF data interface (simplified)
 */
export interface ExifData {
  orientation?: ExifOrientation;
  make?: string;
  model?: string;
  dateTime?: string;
  software?: string;
  [key: string]: any;
}

// =============================================================================
// EXIF DATA READING (Task 6.3)
// =============================================================================

/**
 * Read EXIF orientation from image file
 * Reads binary data to extract EXIF orientation value
 * 
 * @param file Image file to read EXIF from
 * @returns Promise resolving to orientation value or null
 * 
 * @example
 * ```typescript
 * const orientation = await readExifOrientation(file);
 * if (orientation && orientation !== EXIF_ORIENTATION.NORMAL) {
 *   // Apply orientation correction
 * }
 * ```
 */
export async function readExifOrientation(file: File): Promise<ExifOrientation | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve(null);
        return;
      }
      
      const dataView = new DataView(arrayBuffer);
      
      try {
        // Check for JPEG SOI marker
        if (dataView.getUint16(0, false) !== 0xFFD8) {
          resolve(null);
          return;
        }
        
        let offset = 2;
        let marker = dataView.getUint16(offset, false);
        
        // Find APP1 marker (0xFFE1) which contains EXIF data
        while (offset < dataView.byteLength) {
          if (marker === 0xFFE1) {
            // Found APP1 marker, look for EXIF header
            const exifHeaderOffset = offset + 4;
            
            if (dataView.getUint32(exifHeaderOffset, false) === 0x45786966) { // "Exif"
              const tiffOffset = exifHeaderOffset + 6;
              const tiffHeader = dataView.getUint16(tiffOffset, false);
              const isLittleEndian = tiffHeader === 0x4949; // "II"
              
              // Read IFD0 offset
              const ifd0Offset = tiffOffset + dataView.getUint32(tiffOffset + 4, isLittleEndian);
              const tagCount = dataView.getUint16(ifd0Offset, isLittleEndian);
              
              // Look for orientation tag (0x0112)
              for (let i = 0; i < tagCount; i++) {
                const tagOffset = ifd0Offset + 2 + (i * 12);
                const tagId = dataView.getUint16(tagOffset, isLittleEndian);
                
                if (tagId === 0x0112) { // Orientation tag
                  const orientation = dataView.getUint16(tagOffset + 8, isLittleEndian);
                  resolve(orientation as ExifOrientation);
                  return;
                }
              }
            }
            break;
          }
          
          // Move to next marker
          if (marker >= 0xFFC0 && marker <= 0xFFCF && marker !== 0xFFC4 && marker !== 0xFFC8 && marker !== 0xFFCC) {
            break;
          }
          
          const segmentLength = dataView.getUint16(offset + 2, false);
          offset += 2 + segmentLength;
          
          if (offset >= dataView.byteLength) break;
          marker = dataView.getUint16(offset, false);
        }
        
        resolve(null);
      } catch (error) {
        console.warn('Error reading EXIF data:', error);
        resolve(null);
      }
    };
    
    reader.onerror = () => resolve(null);
    
    // Read only the first 64KB which should contain EXIF data
    const blob = file.slice(0, 65536);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Get rotation angle from EXIF orientation
 * 
 * @param orientation EXIF orientation value
 * @returns Rotation angle in degrees
 */
export function getRotationFromOrientation(orientation: ExifOrientation): number {
  switch (orientation) {
    case EXIF_ORIENTATION.ROTATE_90_CW:
    case EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_90_CW:
      return 90;
    case EXIF_ORIENTATION.ROTATE_180:
      return 180;
    case EXIF_ORIENTATION.ROTATE_270_CW:
    case EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_270_CW:
      return 270;
    default:
      return 0;
  }
}

/**
 * Check if orientation requires flipping
 * 
 * @param orientation EXIF orientation value
 * @returns Whether image should be flipped horizontally
 */
export function shouldFlipHorizontal(orientation: ExifOrientation): boolean {
  return [
    EXIF_ORIENTATION.FLIP_HORIZONTAL,
    EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_90_CW,
    EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_270_CW
  ].includes(orientation);
}

// =============================================================================
// CANVAS PROCESSING UTILITIES (Task 6.3)
// =============================================================================

/**
 * Create high-DPI aware canvas
 * 
 * @param width Canvas width in CSS pixels
 * @param height Canvas height in CSS pixels
 * @returns Canvas element with proper DPI scaling
 */
export function createHighDPICanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Set actual canvas size in memory (scaled for high-DPI)
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  
  // Set display size (CSS pixels)
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Scale the context to ensure correct drawing operations
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  return canvas;
}

/**
 * Load image file into HTMLImageElement
 * 
 * @param file Image file to load
 * @returns Promise resolving to loaded image element
 */
export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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
}

/**
 * Calculate optimal dimensions for resize operation
 * 
 * @param original Original dimensions
 * @param target Target dimensions
 * @param maintainAspectRatio Whether to maintain aspect ratio
 * @param allowUpscale Whether to allow upscaling
 * @returns Calculated dimensions
 */
export function calculateResizeDimensions(
  original: ImageDimensions,
  target: Partial<ImageDimensions>,
  maintainAspectRatio: boolean = true,
  allowUpscale: boolean = false
): ImageDimensions {
  let { width: targetWidth, height: targetHeight } = target;
  
  // If neither dimension specified, return original
  if (!targetWidth && !targetHeight) {
    return original;
  }
  
  // If only one dimension specified and maintaining aspect ratio
  if (maintainAspectRatio) {
    const aspectRatio = original.width / original.height;
    
    if (targetWidth && !targetHeight) {
      targetHeight = targetWidth / aspectRatio;
    } else if (targetHeight && !targetWidth) {
      targetWidth = targetHeight * aspectRatio;
    } else if (targetWidth && targetHeight) {
      // Both specified, fit within bounds maintaining aspect ratio
      const widthRatio = targetWidth / original.width;
      const heightRatio = targetHeight / original.height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      targetWidth = original.width * ratio;
      targetHeight = original.height * ratio;
    }
  }
  
  // Set defaults if still undefined
  targetWidth = targetWidth || original.width;
  targetHeight = targetHeight || original.height;
  
  // Check upscaling limits
  if (!allowUpscale) {
    targetWidth = Math.min(targetWidth, original.width);
    targetHeight = Math.min(targetHeight, original.height);
  }
  
  return {
    width: Math.round(targetWidth),
    height: Math.round(targetHeight)
  };
}

/**
 * Apply EXIF orientation correction to canvas context
 * 
 * @param ctx Canvas rendering context
 * @param orientation EXIF orientation value
 * @param width Image width
 * @param height Image height
 */
export function applyOrientationTransform(
  ctx: CanvasRenderingContext2D,
  orientation: ExifOrientation,
  width: number,
  height: number
): void {
  switch (orientation) {
    case EXIF_ORIENTATION.FLIP_HORIZONTAL:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case EXIF_ORIENTATION.ROTATE_180:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case EXIF_ORIENTATION.FLIP_VERTICAL:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_270_CW:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case EXIF_ORIENTATION.ROTATE_90_CW:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_90_CW:
      ctx.transform(0, -1, -1, 0, width, height);
      break;
    case EXIF_ORIENTATION.ROTATE_270_CW:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    case EXIF_ORIENTATION.NORMAL:
    default:
      // No transformation needed
      break;
  }
}

/**
 * Process image file with comprehensive canvas operations
 * 
 * Features:
 * - Automatic EXIF orientation correction
 * - High-quality resizing with configurable algorithms
 * - Precise cropping with coordinate validation
 * - Manual rotation support
 * - High-DPI display optimization
 * - Memory-efficient processing
 * - Error handling and recovery
 * 
 * @param file Original image file
 * @param config Processing configuration
 * @returns Promise resolving to processing result
 * 
 * @example
 * ```typescript
 * const result = await processImageWithCanvas(file, {
 *   resize: { width: 1920, height: 1920, maintainAspectRatio: true },
 *   autoOrientCorrection: true,
 *   imageSmoothingEnabled: true,
 *   imageSmoothingQuality: 'high'
 * });
 * 
 * if (result.success) {
 *   console.log(`Processed to ${result.finalDimensions.width}x${result.finalDimensions.height}`);
 *   // Use result.file
 * }
 * ```
 */
export async function processImageWithCanvas(
  file: File,
  config: CanvasProcessingConfig = {}
): Promise<ProcessingResult> {
  const startTime = performance.now();
  
  try {
    // Load image
    const img = await loadImageFromFile(file);
    const originalDimensions = { width: img.width, height: img.height };
    
    // Read EXIF orientation if auto-correction is enabled
    let detectedOrientation: ExifOrientation | undefined;
    let orientationCorrected = false;
    
    if (config.autoOrientCorrection) {
      detectedOrientation = await readExifOrientation(file) || undefined;
    }
    
    // Calculate final dimensions considering orientation and resize
    let finalDimensions = originalDimensions;
    
    // Account for orientation rotation affecting dimensions
    if (detectedOrientation && [EXIF_ORIENTATION.ROTATE_90_CW, EXIF_ORIENTATION.ROTATE_270_CW, 
        EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_90_CW, EXIF_ORIENTATION.FLIP_HORIZONTAL_ROTATE_270_CW]
        .includes(detectedOrientation)) {
      finalDimensions = { width: originalDimensions.height, height: originalDimensions.width };
    }
    
    // Apply resize configuration
    if (config.resize) {
      finalDimensions = calculateResizeDimensions(
        finalDimensions,
        config.resize,
        config.resize.maintainAspectRatio,
        config.resize.allowUpscale
      );
    }
    
    // Create canvas with calculated dimensions
    const canvas = createHighDPICanvas(finalDimensions.width, finalDimensions.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Unable to get canvas context');
    }
    
    // Configure image smoothing
    ctx.imageSmoothingEnabled = config.imageSmoothingEnabled !== false;
    if (config.imageSmoothingQuality) {
      ctx.imageSmoothingQuality = config.imageSmoothingQuality;
    }
    
    // Apply orientation correction if needed
    if (detectedOrientation && detectedOrientation !== EXIF_ORIENTATION.NORMAL) {
      applyOrientationTransform(ctx, detectedOrientation, finalDimensions.width, finalDimensions.height);
      orientationCorrected = true;
    }
    
    // Apply manual rotation if specified
    if (config.rotationAngle && config.rotationAngle !== 0) {
      const centerX = finalDimensions.width / 2;
      const centerY = finalDimensions.height / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((config.rotationAngle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
    
    // Handle cropping
    let drawX = 0, drawY = 0, drawWidth = finalDimensions.width, drawHeight = finalDimensions.height;
    let sourceX = 0, sourceY = 0, sourceWidth = originalDimensions.width, sourceHeight = originalDimensions.height;
    
    if (config.crop) {
      // Validate crop coordinates
      const crop = {
        x: Math.max(0, Math.min(1, config.crop.x)),
        y: Math.max(0, Math.min(1, config.crop.y)),
        width: Math.max(0, Math.min(1, config.crop.width)),
        height: Math.max(0, Math.min(1, config.crop.height))
      };
      
      // Calculate source crop area
      sourceX = crop.x * originalDimensions.width;
      sourceY = crop.y * originalDimensions.height;
      sourceWidth = crop.width * originalDimensions.width;
      sourceHeight = crop.height * originalDimensions.height;
      
      // Ensure crop doesn't exceed image bounds
      sourceWidth = Math.min(sourceWidth, originalDimensions.width - sourceX);
      sourceHeight = Math.min(sourceHeight, originalDimensions.height - sourceY);
    }
    
    // Draw image to canvas
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      drawX, drawY, drawWidth, drawHeight
    );
    
    // Convert canvas to file
    const outputFormat = config.outputFormat || file.type || 'image/jpeg';
    const outputQuality = config.outputQuality || 0.9;
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, outputFormat, outputQuality);
    });
    
    const processedFile = new File(
      [blob],
      file.name,
      { type: outputFormat }
    );
    
    const processingTime = performance.now() - startTime;
    
    return {
      file: processedFile,
      canvas,
      originalDimensions,
      finalDimensions,
      detectedOrientation,
      orientationCorrected,
      processingTime,
      success: true
    };
    
  } catch (error) {
    const processingTime = performance.now() - startTime;
    
    // Create fallback canvas
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 1;
    fallbackCanvas.height = 1;
    
    return {
      file,
      canvas: fallbackCanvas,
      originalDimensions: { width: 0, height: 0 },
      finalDimensions: { width: 0, height: 0 },
      orientationCorrected: false,
      processingTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS (Task 6.3)
// =============================================================================

/**
 * Quick resize image maintaining aspect ratio
 * 
 * @param file Image file to resize
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @param quality Output quality (0-1)
 * @returns Promise resolving to resized file
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9
): Promise<File> {
  const result = await processImageWithCanvas(file, {
    resize: {
      width: maxWidth,
      height: maxHeight,
      maintainAspectRatio: true,
      allowUpscale: false
    },
    autoOrientCorrection: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    outputQuality: quality
  });
  
  if (!result.success) {
    throw new Error(`Resize failed: ${result.error}`);
  }
  
  return result.file;
}

/**
 * Crop image to specified area
 * 
 * @param file Image file to crop
 * @param crop Crop configuration (relative coordinates 0-1)
 * @returns Promise resolving to cropped file
 */
export async function cropImage(file: File, crop: CropConfig): Promise<File> {
  const result = await processImageWithCanvas(file, {
    crop,
    autoOrientCorrection: true,
    imageSmoothingEnabled: true,
    outputQuality: 0.95
  });
  
  if (!result.success) {
    throw new Error(`Crop failed: ${result.error}`);
  }
  
  return result.file;
}

/**
 * Auto-correct image orientation based on EXIF data
 * 
 * @param file Image file to correct
 * @returns Promise resolving to orientation-corrected file
 */
export async function correctImageOrientation(file: File): Promise<File> {
  const result = await processImageWithCanvas(file, {
    autoOrientCorrection: true,
    imageSmoothingEnabled: true,
    outputQuality: 0.98
  });
  
  if (!result.success) {
    throw new Error(`Orientation correction failed: ${result.error}`);
  }
  
  return result.file;
}

/**
 * Rotate image by specified angle
 * 
 * @param file Image file to rotate
 * @param angle Rotation angle in degrees
 * @returns Promise resolving to rotated file
 */
export async function rotateImage(file: File, angle: number): Promise<File> {
  const result = await processImageWithCanvas(file, {
    rotationAngle: angle,
    imageSmoothingEnabled: true,
    outputQuality: 0.95
  });
  
  if (!result.success) {
    throw new Error(`Rotation failed: ${result.error}`);
  }
  
  return result.file;
}