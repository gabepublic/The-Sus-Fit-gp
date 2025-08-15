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
  ProcessedImage,
  FeatureFlagConfig,
  FeatureFlagResponse
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
  TryonMutationVariables,
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