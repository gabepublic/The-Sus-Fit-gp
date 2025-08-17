// Business Layer Utilities
// Re-export utility functions for business logic

// Image processing utilities
export {
  resizeImageTo1024x1536,
  processImageForTryon,
  processTryonImages,
  validateImageDimensions,
  getImageDimensions,
  getBase64Size,
  ImageProcessingError,
  ImageDimensionError,
  DEFAULT_PROCESSING_OPTIONS,
  extractImageMetadata,
  convertImageFormat,
  applySharpeningFilter,
  applyNoiseReduction,
  applyAutoColorCorrection,
  processImageAdvanced,
  processImagesInBatch,
  createImageThumbnail,
  ImageFormat,
  type ImageProcessingOptions,
  type ImageProcessingResult,
  type ImageMetadata,
  type AdvancedImageProcessingOptions,
  type AdvancedImageProcessingResult
} from './imageProcessing';

// Error handling utilities
export {
  classifyTryonError,
  logAndClassifyError,
  getUserFriendlyErrorMessage,
  isErrorRetryable,
  getErrorRecoveryActions,
  formatErrorForDisplay,
  setErrorLogger,
  getErrorLogger,
  ConsoleErrorLogger,
  ErrorCategory,
  ErrorSeverity,
  type ClassifiedError,
  type ErrorRecoveryAction,
  type ErrorLogger
} from './errorHandling';

// Canvas utilities
export {
  AdvancedCanvasOperations,
  CanvasPerformanceUtils,
  CanvasAnimationUtils,
  createAdvancedCanvasOperations,
  createCanvasAnimationUtils,
  BlendMode,
  type Transform,
  type CanvasState
} from './canvasUtils';

// Text overlay utilities
export {
  TextOverlayRenderer,
  TextOverlayUtils,
  createTextOverlayRenderer,
  TextAlign,
  TextBaseline,
  DEFAULT_TEXT_STYLE,
  type TextStyle,
  type TextPosition,
  type TextOverlayConfig,
  type TextMeasurement,
  type TextDecoration,
  type TextShadow,
  type TextOutline,
  type TextGradient,
  type TextWrapOptions
} from './textOverlay';

// Sticker placement utilities
export {
  StickerManager,
  createStickerManager,
  StickerAnchor,
  DEFAULT_STICKER_CONFIG,
  type Sticker,
  type StickerConfig,
  type StickerTransform,
  type StickerVisualProps,
  type StickerBounds,
  type StickerInteractionState,
  type GridSnapConfig,
  type CollisionResult
} from './stickerPlacement';

// Image filter utilities
export {
  ImageFilterEngine,
  FilterPresetLibrary,
  createImageFilterEngine,
  createFilterPresetLibrary,
  FilterType,
  DEFAULT_FILTER_PARAMETERS,
  type FilterConfig,
  type FilterParameter,
  type FilterPreset,
  type FilterResult,
  type FilterPreviewConfig
} from './imageFilters';

// Undo/Redo utilities
export {
  UndoRedoManager,
  createUndoRedoManager,
  OperationType,
  DEFAULT_UNDO_REDO_CONFIG,
  type UndoRedoConfig,
  type UndoRedoState,
  type Operation,
  type CompositeOperation,
  type CanvasSnapshot,
  type OperationPerformance
} from './undoRedoStack';

// Image export utilities
export {
  ImageExporter,
  BatchExportManager,
  createImageExporter,
  createBatchExportManager,
  ExportFormat,
  QualityPreset,
  getOptimalFormat,
  estimateFileSize,
  DEFAULT_EXPORT_CONFIG,
  type ExportConfig,
  type ExportResult,
  type ExportMetadata,
  type WatermarkConfig,
  type CompressionConfig,
  type BatchExportConfig
} from './imageExport';