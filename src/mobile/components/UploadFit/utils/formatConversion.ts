/**
 * @fileoverview Format Conversion Utilities - WebP and AVIF conversion with intelligent fallback
 * @module @/mobile/components/UploadFit/utils/formatConversion
 * @version 1.0.0
 */

// =============================================================================
// TYPES AND INTERFACES (Task 6.2)
// =============================================================================

/**
 * Supported modern image formats
 */
export const MODERN_FORMATS = {
  WEBP: 'image/webp',
  AVIF: 'image/avif',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
} as const;

export type ModernFormat = typeof MODERN_FORMATS[keyof typeof MODERN_FORMATS];

/**
 * Format conversion configuration
 */
export interface FormatConversionConfig {
  /** Target format to convert to */
  targetFormat: ModernFormat;
  /** Image quality (0-1, default: 0.8) */
  quality?: number;
  /** Maximum width for conversion (default: 1920) */
  maxWidth?: number;
  /** Maximum height for conversion (default: 1920) */
  maxHeight?: number;
  /** Whether to maintain aspect ratio (default: true) */
  maintainAspectRatio?: boolean;
  /** Background color for transparent images (default: white) */
  backgroundColor?: string;
  /** Whether to preserve transparency (PNG/WebP only) */
  preserveTransparency?: boolean;
}

/**
 * Format conversion result
 */
export interface FormatConversionResult {
  /** Converted file */
  file: File;
  /** Original format */
  originalFormat: string;
  /** Target format */
  targetFormat: ModernFormat;
  /** Original file size */
  originalSize: number;
  /** Converted file size */
  convertedSize: number;
  /** Size reduction ratio */
  sizeReduction: number;
  /** Conversion time in milliseconds */
  conversionTime: number;
  /** Whether conversion was successful */
  success: boolean;
  /** Error message if conversion failed */
  error?: string;
  /** Whether fallback was used */
  usedFallback: boolean;
  /** Actual format used (may differ from target if fallback occurred) */
  actualFormat: ModernFormat;
}

/**
 * Browser support detection result
 */
export interface BrowserSupport {
  /** Whether WebP is supported */
  webp: boolean;
  /** Whether AVIF is supported */
  avif: boolean;
  /** Whether WebP animation is supported */
  webpAnimation: boolean;
  /** Whether AVIF animation is supported */
  avifAnimation: boolean;
}

// =============================================================================
// BROWSER SUPPORT DETECTION (Task 6.2)
// =============================================================================

/**
 * Cache for browser support detection
 */
let browserSupportCache: BrowserSupport | null = null;

/**
 * Detect browser support for modern image formats
 * Uses canvas.toDataURL() method to test format support
 * 
 * @returns Promise resolving to browser support information
 * 
 * @example
 * ```typescript
 * const support = await detectBrowserSupport();
 * if (support.webp) {
 *   // Use WebP format
 * } else {
 *   // Fallback to JPEG/PNG
 * }
 * ```
 */
export async function detectBrowserSupport(): Promise<BrowserSupport> {
  // Return cached result if available
  if (browserSupportCache) {
    return browserSupportCache;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback if canvas is not supported
    browserSupportCache = {
      webp: false,
      avif: false,
      webpAnimation: false,
      avifAnimation: false
    };
    return browserSupportCache;
  }

  // Draw a simple pixel
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1, 1);

  const testFormats = async (): Promise<BrowserSupport> => {
    const results: BrowserSupport = {
      webp: false,
      avif: false,
      webpAnimation: false,
      avifAnimation: false
    };

    try {
      // Test WebP support
      const webpDataUrl = canvas.toDataURL('image/webp');
      results.webp = webpDataUrl.startsWith('data:image/webp');

      // Test AVIF support
      const avifDataUrl = canvas.toDataURL('image/avif');
      results.avif = avifDataUrl.startsWith('data:image/avif');

      // Test animated WebP support (feature detection)
      results.webpAnimation = results.webp && 'animate' in HTMLImageElement.prototype;

      // Test animated AVIF support (limited browser support)
      results.avifAnimation = results.avif && typeof window !== 'undefined';

    } catch (error) {
      console.warn('Error detecting browser format support:', error);
    }

    return results;
  };

  browserSupportCache = await testFormats();
  return browserSupportCache;
}

/**
 * Check if specific format is supported by browser
 * 
 * @param format Format to check
 * @returns Promise resolving to whether format is supported
 */
export async function isFormatSupported(format: ModernFormat): Promise<boolean> {
  const support = await detectBrowserSupport();
  
  switch (format) {
    case MODERN_FORMATS.WEBP:
      return support.webp;
    case MODERN_FORMATS.AVIF:
      return support.avif;
    case MODERN_FORMATS.JPEG:
    case MODERN_FORMATS.PNG:
      return true; // Always supported
    default:
      return false;
  }
}

// =============================================================================
// FORMAT CONVERSION UTILITIES (Task 6.2)
// =============================================================================

/**
 * Convert image file to modern format with fallback support
 * 
 * Features:
 * - WebP and AVIF conversion with quality control
 * - Intelligent fallback to JPEG/PNG when modern formats aren't supported
 * - Aspect ratio preservation and dimension constraints
 * - Transparency handling for PNG sources
 * - Background color support for transparent images
 * - Comprehensive error handling
 * 
 * @param file Original image file
 * @param config Conversion configuration
 * @returns Promise resolving to conversion result
 * 
 * @example
 * ```typescript
 * const result = await convertToModernFormat(file, {
 *   targetFormat: MODERN_FORMATS.WEBP,
 *   quality: 0.8,
 *   maxWidth: 1920
 * });
 * 
 * if (result.success) {
 *   console.log(`Converted to ${result.actualFormat}, saved ${result.sizeReduction}%`);
 *   // Use result.file
 * }
 * ```
 */
export async function convertToModernFormat(
  file: File,
  config: FormatConversionConfig
): Promise<FormatConversionResult> {
  const startTime = performance.now();
  const originalSize = file.size;
  const originalFormat = file.type;

  try {
    // Check if target format is supported
    const isSupported = await isFormatSupported(config.targetFormat);
    let actualFormat = config.targetFormat;
    let usedFallback = false;

    // Determine fallback format if needed
    if (!isSupported) {
      usedFallback = true;
      actualFormat = originalFormat.includes('png') ? MODERN_FORMATS.PNG : MODERN_FORMATS.JPEG;
    }

    // Load image into canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Create image element and load file
    const img = new Image();
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });

    const loadedImg = await imageLoadPromise;

    // Calculate dimensions with aspect ratio preservation
    const { width, height } = calculateDimensions(
      loadedImg.width,
      loadedImg.height,
      config.maxWidth || 1920,
      config.maxHeight || 1920,
      config.maintainAspectRatio !== false
    );

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Handle background for transparent images
    if (config.backgroundColor && actualFormat !== MODERN_FORMATS.PNG) {
      ctx.fillStyle = config.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw image to canvas
    ctx.drawImage(loadedImg, 0, 0, width, height);

    // Convert to target format
    const quality = config.quality || 0.8;
    const dataUrl = canvas.toDataURL(actualFormat, quality);

    // Convert data URL to blob and then to file
    const blob = await dataUrlToBlob(dataUrl);
    const convertedFile = new File([blob], 
      `${file.name.split('.')[0]}.${getExtensionFromFormat(actualFormat)}`, 
      { type: actualFormat }
    );

    // Clean up
    URL.revokeObjectURL(img.src);

    const convertedSize = convertedFile.size;
    const sizeReduction = ((originalSize - convertedSize) / originalSize) * 100;
    const conversionTime = performance.now() - startTime;

    return {
      file: convertedFile,
      originalFormat,
      targetFormat: config.targetFormat,
      originalSize,
      convertedSize,
      sizeReduction,
      conversionTime,
      success: true,
      usedFallback,
      actualFormat
    };

  } catch (error) {
    const conversionTime = performance.now() - startTime;
    
    return {
      file,
      originalFormat,
      targetFormat: config.targetFormat,
      originalSize,
      convertedSize: originalSize,
      sizeReduction: 0,
      conversionTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
      usedFallback: false,
      actualFormat: originalFormat as ModernFormat
    };
  }
}

/**
 * Auto-convert image to best supported modern format
 * Intelligently chooses WebP, AVIF, or fallback based on browser support
 * 
 * @param file Original image file
 * @param config Optional configuration overrides
 * @returns Promise resolving to conversion result
 */
export async function convertToBestFormat(
  file: File,
  config: Partial<FormatConversionConfig> = {}
): Promise<FormatConversionResult> {
  const support = await detectBrowserSupport();
  
  // Choose best available format
  let targetFormat: ModernFormat;
  if (support.avif) {
    targetFormat = MODERN_FORMATS.AVIF;
  } else if (support.webp) {
    targetFormat = MODERN_FORMATS.WEBP;
  } else {
    // Fallback to original format or JPEG
    targetFormat = file.type.includes('png') ? MODERN_FORMATS.PNG : MODERN_FORMATS.JPEG;
  }

  return convertToModernFormat(file, {
    targetFormat,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    ...config
  });
}

/**
 * Batch convert multiple images to modern format
 * 
 * @param files Array of image files
 * @param config Conversion configuration
 * @param onProgress Progress callback
 * @returns Promise resolving to array of conversion results
 */
export async function convertMultipleToModernFormat(
  files: File[],
  config: FormatConversionConfig,
  onProgress?: (progress: number) => void
): Promise<FormatConversionResult[]> {
  const results: FormatConversionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await convertToModernFormat(file, config);
      results.push(result);
    } catch (error) {
      results.push({
        file,
        originalFormat: file.type,
        targetFormat: config.targetFormat,
        originalSize: file.size,
        convertedSize: file.size,
        sizeReduction: 0,
        conversionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        usedFallback: false,
        actualFormat: file.type as ModernFormat
      });
    }
    
    onProgress?.((i + 1) / files.length);
  }
  
  return results;
}

// =============================================================================
// HELPER FUNCTIONS (Task 6.2)
// =============================================================================

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if necessary
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
}

/**
 * Convert data URL to blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Get file extension from format
 */
function getExtensionFromFormat(format: ModernFormat): string {
  switch (format) {
    case MODERN_FORMATS.WEBP:
      return 'webp';
    case MODERN_FORMATS.AVIF:
      return 'avif';
    case MODERN_FORMATS.PNG:
      return 'png';
    case MODERN_FORMATS.JPEG:
    default:
      return 'jpg';
  }
}

// =============================================================================
// UTILITY FUNCTIONS (Task 6.2)
// =============================================================================

/**
 * Get recommended format based on image characteristics
 * 
 * @param file Image file to analyze
 * @param support Browser support information
 * @returns Recommended format
 */
export async function getRecommendedFormat(
  file: File,
  support?: BrowserSupport
): Promise<ModernFormat> {
  const browserSupport = support || await detectBrowserSupport();
  
  // For images with transparency, prefer PNG or WebP
  if (file.type === 'image/png') {
    return browserSupport.webp ? MODERN_FORMATS.WEBP : MODERN_FORMATS.PNG;
  }
  
  // For photos, prefer AVIF > WebP > JPEG
  if (browserSupport.avif) {
    return MODERN_FORMATS.AVIF;
  } else if (browserSupport.webp) {
    return MODERN_FORMATS.WEBP;
  }
  
  return MODERN_FORMATS.JPEG;
}

/**
 * Estimate file size after conversion
 * 
 * @param originalSize Original file size in bytes
 * @param targetFormat Target format
 * @param quality Quality setting (0-1)
 * @returns Estimated size in bytes
 */
export function estimateConvertedSize(
  originalSize: number,
  targetFormat: ModernFormat,
  quality: number = 0.8
): number {
  // Rough estimates based on format characteristics
  const compressionRatios = {
    [MODERN_FORMATS.AVIF]: 0.3, // Very efficient
    [MODERN_FORMATS.WEBP]: 0.4, // Efficient
    [MODERN_FORMATS.JPEG]: 0.6, // Moderate
    [MODERN_FORMATS.PNG]: 0.9   // Less compression for quality
  };
  
  const baseRatio = compressionRatios[targetFormat] || 0.6;
  const qualityFactor = 0.5 + (quality * 0.5); // Quality affects final size
  
  return Math.round(originalSize * baseRatio * qualityFactor);
}

/**
 * Check if conversion would be beneficial
 * 
 * @param file Original file
 * @param targetFormat Target format
 * @param quality Quality setting
 * @returns Whether conversion is recommended
 */
export async function shouldConvert(
  file: File,
  targetFormat: ModernFormat,
  quality: number = 0.8
): Promise<boolean> {
  // Don't convert if target format is not supported
  if (!await isFormatSupported(targetFormat)) {
    return false;
  }
  
  // Don't convert if already in target format
  if (file.type === targetFormat) {
    return false;
  }
  
  // Check if conversion would likely reduce file size
  const estimatedSize = estimateConvertedSize(file.size, targetFormat, quality);
  const potentialSavings = (file.size - estimatedSize) / file.size;
  
  // Convert if potential savings > 10%
  return potentialSavings > 0.1;
}

/**
 * Get format conversion statistics
 * 
 * @param results Array of conversion results
 * @returns Conversion statistics
 */
export function getConversionStats(results: FormatConversionResult[]): {
  totalOriginalSize: number;
  totalConvertedSize: number;
  totalSizeSaved: number;
  averageSizeReduction: number;
  successRate: number;
  fallbackRate: number;
} {
  const successful = results.filter(r => r.success);
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalConvertedSize = successful.reduce((sum, r) => sum + r.convertedSize, 0);
  const totalSizeSaved = totalOriginalSize - totalConvertedSize;
  
  const averageSizeReduction = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.sizeReduction, 0) / successful.length 
    : 0;
  
  const successRate = results.length > 0 ? (successful.length / results.length) * 100 : 0;
  const fallbackRate = results.length > 0 
    ? (results.filter(r => r.usedFallback).length / results.length) * 100 
    : 0;

  return {
    totalOriginalSize,
    totalConvertedSize,
    totalSizeSaved,
    averageSizeReduction,
    successRate,
    fallbackRate
  };
}