// Business Layer Main Export
// Public API for the business layer - only export what should be consumed by other layers

// Configuration and setup
export { 
  queryClient,
  createImageProcessingQueryConfig,
  createApiQueryConfig,
  createMutationConfig,
  invalidateQueries,
  clearQueryCache
} from './config';

// Providers
export { 
  ReactQueryProvider,
  ErrorBoundary,
  type ReactQueryProviderProps,
  FeatureFlagProvider,
  type FeatureFlagProviderProps,
  FeatureFlagContext,
  useFeatureFlagContext,
  useFeatureFlagContextOptional
} from './providers';

// Essential types that bridge and UI layers need
export type { 
  // Mutation types
  TryonMutationData,
  TryonMutationVariables,
  TryonMutationVariablesWithFiles,
  ImageUploadData,
  ImageUploadVariables,
  MutationState,
  // Try-on specific types
  TryonMutationOptions,
  TryonMutationResponse,
  TryonResponseMetadata,
  TryonMutationError,
  TryonMutationContext,
  UseTryonMutationReturn,
  UseTryonMutationConfig,
  // API types
  TryonRequest,
  TryonResponse,
  ApiResponse,
  ProcessedImage,
  // Error types
  BusinessLayerError,
  ApiError,
  ValidationError,
  NetworkError,
  TimeoutError,
  // Query configuration types
  QueryConfig,
  MutationConfig,
  // Feature flag types
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagValue,
  FeatureFlagCategory,
  Environment,
  FeatureFlagCollection,
  FeatureFlagProviderConfig,
  FeatureFlagContextValue,
  UseFeatureFlagReturn,
  // History types
  TryonHistoryEntry,
  TryonHistoryCollection,
  TryonHistoryQueryOptions,
  CreateTryonHistoryEntryOptions,
  TryonHistoryStorageConfig,
  TryonHistoryService,
  UseTryonHistoryReturn,
  TryonHistoryContextValue
} from './types';

// Error utilities
export {
  createBusinessLayerError,
  createApiError,
  createValidationError,
  createNetworkError,
  createTimeoutError
} from './types';

// Feature flag hooks
export {
  useFeatureFlag,
  useFeatureFlagEnabled,
  useFeatureFlagString,
  useFeatureFlagNumber,
  useFeatureFlags,
  useAnyFeatureFlagEnabled,
  useAllFeatureFlagsEnabled,
  useFeatureFlagValue,
  useFeatureFlagRefresh,
  useAllFeatureFlags,
  useExperimentVariant,
} from './hooks';

// Core business logic hooks
export { useTryonMutation } from './mutations';

// History management hooks
export { 
  useTryonHistory, 
  useTryonHistoryEntry, 
  useTryonHistoryStats,
  HISTORY_QUERY_KEYS 
} from './hooks/useTryonHistory';

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
  type ImageProcessingOptions,
  type ImageProcessingResult
} from './utils';

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
} from './utils';

// History services and utilities
export {
  LocalStorageTryonHistoryService,
  defaultHistoryService
} from './services/tryonHistoryService';

export {
  createHistoryIntegratedCallbacks,
  useHistoryIntegratedMutationConfig,
  createHistoryEntryFromMutation,
  createShareableHistoryEntry
} from './utils/historyIntegration';

// Image processing queries
export {
  useImageProcessing,
  useImageMetadata,
  useImageThumbnail,
  useImageValidation,
  useFormatConversion,
  useBatchImageProcessing,
  useProcessingStats,
  useImageProcessingCache,
  imageProcessingKeys,
  ImageProcessingOperation,
  type ProcessingQueueItem,
  type BatchProcessingConfig,
  type ProcessingStats,
  type ProcessingQueueState
} from './queries';

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
} from './utils/imageExport';

// Image export hooks
export {
  useImageExport,
  useBatchImageExport,
  useSimpleImageExport,
  type UseImageExportOptions,
  type ExportState
} from './hooks/useImageExport';