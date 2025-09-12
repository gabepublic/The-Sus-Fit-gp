/**
 * @fileoverview UploadFit Utils Index - Central export point for all UploadFit utilities
 * @module @/mobile/components/UploadFit/utils
 * @version 1.0.0
 */

// Image compression utilities
export {
  compressImage,
  compressImageWithPreset,
  compressImages,
  calculateOptimalCompression,
  formatFileSize,
  needsCompression,
  getSupportedFormats,
  isFormatSupported,
  COMPRESSION_PRESETS,
  type CompressionConfig,
  type CompressionResult,
  type CompressionError,
  type CompressionPreset
} from './imageCompression';

// Format conversion utilities
export {
  convertToModernFormat,
  convertToBestFormat,
  convertMultipleToModernFormat,
  detectBrowserSupport,
  isFormatSupported,
  getRecommendedFormat,
  estimateConvertedSize,
  shouldConvert,
  getConversionStats,
  MODERN_FORMATS,
  type ModernFormat,
  type FormatConversionConfig,
  type FormatConversionResult,
  type BrowserSupport
} from './formatConversion';

// Canvas processing utilities
export {
  processImageWithCanvas,
  resizeImage,
  cropImage,
  correctImageOrientation,
  rotateImage,
  readExifOrientation,
  getRotationFromOrientation,
  shouldFlipHorizontal,
  createHighDPICanvas,
  loadImageFromFile,
  calculateResizeDimensions,
  applyOrientationTransform,
  EXIF_ORIENTATION,
  type ExifOrientation,
  type ImageDimensions,
  type CropConfig,
  type ResizeConfig,
  type CanvasProcessingConfig,
  type ProcessingResult,
  type ExifData
} from './canvasProcessing';

// Progressive loading utilities
export {
  generateBase64Preview,
  generateMultiplePreviews,
  createProgressiveLoader,
  useProgressiveImage,
  estimatePreviewGenerationTime,
  shouldUseProgressiveLoading,
  getOptimalPreviewConfig,
  calculateBase64Size,
  clearPreviewCache,
  getCacheStats,
  LOADING_STATE,
  type PreviewConfig,
  type LoadingState,
  type ProgressiveLoadingResult,
  type ProgressiveImageState,
  type ProgressiveImageProps
} from './progressiveLoading';

// Image validation utilities
export {
  validateImage,
  validateImages,
  createCustomValidator,
  getValidationSummary,
  getValidationRecommendations,
  isLikelyImage,
  getOptimalValidationConfig,
  DEFAULT_SUPPORTED_FORMATS,
  DEFAULT_LIMITS,
  VALIDATION_ERRORS,
  type ValidationConfig,
  type ValidationResult,
  type ValidationError,
  type ValidationErrorType,
  type ImageMetadata,
  type BatchValidationResult
} from './imageValidation';

// Web Worker utilities
export {
  ImageProcessingWorkerPool,
  compressImageWithWorker,
  convertFormatWithWorker,
  processImageWithWorker,
  generatePreviewWithWorker,
  getWorkerPoolStats,
  terminateWorkerPool,
  isWorkerSupported,
  isOffscreenCanvasSupported,
  getMobileOptimizedWorkerConfig,
  processBatchWithWorkers,
  WORKER_MESSAGE_TYPES,
  type WorkerTaskConfig,
  type WorkerMessage,
  type WorkerPoolConfig,
  type WorkerTaskResult,
  type WorkerPoolStats
} from './imageWorker';