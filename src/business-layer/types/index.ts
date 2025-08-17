// Business Layer Types
// Re-export all type definitions for business logic

// API and external service types
export type {
  TryonRequest,
  TryonResponse,
  ApiResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
  ImageProcessingOptions,
  ProcessedImage
} from './api.types';

// React Query configuration types
export type {
  QueryConfig,
  MutationConfig,
  BusinessQueryClientConfig,
  QueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
  QueryFunction,
  MutationFunction
} from './query.types';

// Mutation data and variable types
export type {
  TryonMutationData,
  ImageUploadVariables,
  ImageUploadData,
  MutationState,
  BusinessMutationOptions,
  // Shorter aliases
  TryonVariables,
  TryonData,
  UploadVariables,
  UploadData
} from './mutation.types';

// Error handling types
export type {
  BusinessLayerError,
  ApiError,
  ValidationError,
  NetworkError,
  TimeoutError
} from './error.types';

// Error factory functions
export {
  createBusinessLayerError,
  createApiError,
  createValidationError,
  createNetworkError,
  createTimeoutError
} from './error.types';

// Feature flag types
export type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagValue,
  FeatureFlagCategory,
  Environment,
  TryonFeatureFlags,
  ImageProcessingFeatureFlags,
  UIFeatureFlags,
  PerformanceFeatureFlags,
  ExperimentFeatureFlags,
  DebuggingFeatureFlags,
  AllFeatureFlags,
  FeatureFlagCollection,
  FeatureFlagProviderConfig,
  FeatureFlagContextValue,
  UseFeatureFlagReturn,
  FeatureFlagValidation,
  ValidatedFeatureFlag,
  ExtractFlagValue
} from './featureFlag.types';

// Feature flag constants and utilities
export {
  DEFAULT_TRYON_FLAGS,
  DEFAULT_IMAGE_PROCESSING_FLAGS,
  DEFAULT_UI_FLAGS,
  isFeatureFlag,
  isBooleanFlag,
  isStringFlag,
  isNumberFlag
} from './featureFlag.types';

// Try-on specific types
export type {
  TryonMutationVariables,
  TryonMutationVariablesWithFiles,
  TryonMutationOptions,
  TryonMutationResponse,
  TryonResponseMetadata,
  TryonMutationError,
  TryonMutationContext,
  UseTryonMutationReturn,
  UseTryonMutationConfig
} from './tryon.types';

// History management types
export type {
  TryonHistoryEntry,
  TryonHistoryMetadata,
  TryonHistoryCollection,
  TryonHistoryQueryOptions,
  CreateTryonHistoryEntryOptions,
  TryonHistoryStorageConfig,
  TryonHistoryService,
  UseTryonHistoryReturn,
  TryonHistoryContextValue
} from './history.types';