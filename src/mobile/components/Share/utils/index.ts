/**
 * @fileoverview Share Utils - Utility functions for sharing functionality
 * @module @/mobile/components/Share/utils
 * @version 1.0.0
 */

// Image processing utilities
export {
  base64ToBlob,
  dataUrlToBlob,
  base64ToFile,
  dataUrlToFile,
  isValidDataUrl,
  extractMimeType,
  extractBase64Data,
  isSupportedImageFormat,
  getFileExtension,
  blobToDataUrl,
  ImageUtils,
  ImageProcessingError
} from './imageProcessing';

export type {
  SupportedImageFormat,
  ImageConversionOptions,
  ImageProcessingResult
} from './imageProcessing';