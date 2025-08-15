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
  type ReactQueryProviderProps 
} from './providers';

// Essential types that bridge and UI layers need
export type { 
  // Mutation types
  TryonMutationData,
  TryonMutationVariables,
  ImageUploadData,
  ImageUploadVariables,
  MutationState,
  // API types
  TryonRequest,
  TryonResponse,
  ApiResponse,
  ImageProcessingOptions,
  ProcessedImage,
  // Error types
  BusinessLayerError,
  ApiError,
  ValidationError,
  NetworkError,
  TimeoutError,
  // Query configuration types
  QueryConfig,
  MutationConfig
} from './types';

// Error utilities
export {
  createBusinessLayerError,
  createApiError,
  createValidationError,
  createNetworkError,
  createTimeoutError
} from './types';

// Core business logic hooks (to be implemented in later tasks)
// export { useTryonMutation } from './mutations';
// export { useImageProcessing } from './queries';