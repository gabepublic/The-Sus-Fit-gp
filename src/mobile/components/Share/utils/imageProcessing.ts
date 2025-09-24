/**
 * @fileoverview Image Processing Utilities - Convert and optimize images for sharing
 * @module @/mobile/components/Share/utils/imageProcessing
 * @version 1.0.0
 */

/**
 * Supported image formats for processing
 */
export type SupportedImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Image conversion options
 */
export interface ImageConversionOptions {
  /** Target MIME type for conversion */
  mimeType?: SupportedImageFormat;
  /** Output quality for JPEG (0-1) */
  quality?: number;
  /** Custom filename for File object */
  filename?: string;
}

/**
 * Image processing result
 */
export interface ImageProcessingResult {
  /** Success status */
  success: boolean;
  /** Processed blob/file or error message */
  data?: Blob | File;
  /** Error message if processing failed */
  error?: string;
  /** Original size in bytes */
  originalSize?: number;
  /** Processed size in bytes */
  processedSize?: number;
  /** Compression ratio achieved */
  compressionRatio?: number;
}

/**
 * Validates if a string is a valid data URL
 */
export function isValidDataUrl(dataUrl: string): boolean {
  if (typeof dataUrl !== 'string') return false;

  // Check for data URL prefix
  if (!dataUrl.startsWith('data:')) return false;

  // Check for proper format: data:[mediatype][;base64],data
  const dataUrlRegex = /^data:([a-zA-Z0-9][a-zA-Z0-9\/+\-]*);base64,([A-Za-z0-9+\/=]+)$/;
  return dataUrlRegex.test(dataUrl);
}

/**
 * Extracts MIME type from data URL
 */
export function extractMimeType(dataUrl: string): string | null {
  if (!isValidDataUrl(dataUrl)) return null;

  const match = dataUrl.match(/^data:([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Extracts base64 data from data URL
 */
export function extractBase64Data(dataUrl: string): string | null {
  if (!isValidDataUrl(dataUrl)) return null;

  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return null;

  return dataUrl.substring(base64Index + 1);
}

/**
 * Converts base64 string to Blob
 *
 * @param base64Data - Base64 encoded image data (without data URL prefix)
 * @param mimeType - MIME type of the image
 * @returns Promise<ImageProcessingResult>
 *
 * @example
 * ```typescript
 * const result = await base64ToBlob('iVBORw0KGgoAAAANSUhEUgAA...', 'image/png');
 * if (result.success && result.data) {
 *   console.log('Blob created:', result.data);
 * }
 * ```
 */
export async function base64ToBlob(
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<ImageProcessingResult> {
  try {
    // Validate input
    if (!base64Data || typeof base64Data !== 'string') {
      return {
        success: false,
        error: 'Invalid base64 data provided'
      };
    }

    // Clean base64 data (remove any whitespace)
    const cleanBase64 = base64Data.replace(/\s/g, '');

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+\/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      return {
        success: false,
        error: 'Invalid base64 format'
      };
    }

    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob
    const blob = new Blob([bytes], { type: mimeType });

    return {
      success: true,
      data: blob,
      originalSize: cleanBase64.length,
      processedSize: blob.size,
      compressionRatio: blob.size / (cleanBase64.length * 0.75) // Approximate original binary size
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert base64 to blob'
    };
  }
}

/**
 * Converts data URL to Blob
 *
 * @param dataUrl - Data URL string (data:image/...;base64,...)
 * @returns Promise<ImageProcessingResult>
 *
 * @example
 * ```typescript
 * const result = await dataUrlToBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');
 * if (result.success && result.data) {
 *   console.log('Blob created:', result.data);
 * }
 * ```
 */
export async function dataUrlToBlob(dataUrl: string): Promise<ImageProcessingResult> {
  try {
    // Validate data URL
    if (!isValidDataUrl(dataUrl)) {
      return {
        success: false,
        error: 'Invalid data URL format'
      };
    }

    // Extract MIME type and base64 data
    const mimeType = extractMimeType(dataUrl);
    const base64Data = extractBase64Data(dataUrl);

    if (!mimeType || !base64Data) {
      return {
        success: false,
        error: 'Failed to parse data URL components'
      };
    }

    // Convert to blob
    return await base64ToBlob(base64Data, mimeType);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert data URL to blob'
    };
  }
}

/**
 * Converts base64 string to File object
 *
 * @param base64Data - Base64 encoded image data
 * @param filename - Name for the file
 * @param mimeType - MIME type of the image
 * @returns Promise<ImageProcessingResult>
 *
 * @example
 * ```typescript
 * const result = await base64ToFile('iVBORw0KGgoAAAANSUhEUgAA...', 'tryon-result.png', 'image/png');
 * if (result.success && result.data) {
 *   console.log('File created:', result.data);
 * }
 * ```
 */
export async function base64ToFile(
  base64Data: string,
  filename: string = 'tryon-result.png',
  mimeType: string = 'image/png'
): Promise<ImageProcessingResult> {
  try {
    // First convert to blob
    const blobResult = await base64ToBlob(base64Data, mimeType);

    if (!blobResult.success || !blobResult.data) {
      return blobResult;
    }

    // Convert blob to file
    const file = new File([blobResult.data], filename, {
      type: mimeType,
      lastModified: Date.now()
    });

    return {
      ...blobResult,
      data: file
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert base64 to file'
    };
  }
}

/**
 * Converts data URL to File object
 *
 * @param dataUrl - Data URL string
 * @param filename - Name for the file
 * @returns Promise<ImageProcessingResult>
 *
 * @example
 * ```typescript
 * const result = await dataUrlToFile('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', 'my-image.png');
 * if (result.success && result.data) {
 *   console.log('File created:', result.data);
 * }
 * ```
 */
export async function dataUrlToFile(
  dataUrl: string,
  filename?: string
): Promise<ImageProcessingResult> {
  try {
    // Validate data URL
    if (!isValidDataUrl(dataUrl)) {
      return {
        success: false,
        error: 'Invalid data URL format'
      };
    }

    // Extract MIME type and determine filename
    const mimeType = extractMimeType(dataUrl);
    if (!mimeType) {
      return {
        success: false,
        error: 'Could not determine MIME type from data URL'
      };
    }

    // Generate filename if not provided
    const finalFilename = filename || `tryon-result.${mimeType.split('/')[1]}`;

    // Extract base64 data
    const base64Data = extractBase64Data(dataUrl);
    if (!base64Data) {
      return {
        success: false,
        error: 'Could not extract base64 data from data URL'
      };
    }

    // Convert to file
    return await base64ToFile(base64Data, finalFilename, mimeType);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert data URL to file'
    };
  }
}

/**
 * Validates image format support
 */
export function isSupportedImageFormat(mimeType: string): mimeType is SupportedImageFormat {
  const supportedFormats: SupportedImageFormat[] = ['image/jpeg', 'image/png', 'image/webp'];
  return supportedFormats.includes(mimeType as SupportedImageFormat);
}

/**
 * Gets appropriate file extension for MIME type
 */
export function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'png'; // Default fallback
  }
}

/**
 * Converts blob to data URL
 *
 * @param blob - Blob to convert
 * @returns Promise<string> - Data URL string
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Error class for image processing operations
 */
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'PROCESSING_ERROR',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Export all utilities as a namespace for convenience
export const ImageUtils = {
  isValidDataUrl,
  extractMimeType,
  extractBase64Data,
  base64ToBlob,
  dataUrlToBlob,
  base64ToFile,
  dataUrlToFile,
  isSupportedImageFormat,
  getFileExtension,
  blobToDataUrl
} as const;