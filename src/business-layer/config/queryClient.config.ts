import { QueryClient } from '@tanstack/react-query';
import { QUERY_DEFAULTS, MUTATION_DEFAULTS } from './constants';
import { createNetworkError, createTimeoutError, type BusinessLayerError } from '../types/error.types';

// Error handler for React Query (utility function for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleQueryError = (error: unknown): BusinessLayerError => {
  if (error instanceof Error) {
    // Check for network errors
    if ('code' in error && error.code === 'NETWORK_ERROR') {
      return createNetworkError(error.message);
    }
    
    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return createTimeoutError(error.message);
    }
    
    // Return as-is if already a BusinessLayerError
    if ('code' in error && 'timestamp' in error) {
      return error as BusinessLayerError;
    }
  }
  
  // Default error handling
  return {
    name: 'BusinessLayerError',
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
  };
};

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.STALE_TIME,
      gcTime: QUERY_DEFAULTS.CACHE_TIME, // React Query v5 uses gcTime instead of cacheTime
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        
        return failureCount < QUERY_DEFAULTS.RETRY_COUNT;
      },
      retryDelay: QUERY_DEFAULTS.RETRY_DELAY,
      networkMode: 'online',
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        
        return failureCount < MUTATION_DEFAULTS.RETRY_COUNT;
      },
      retryDelay: MUTATION_DEFAULTS.RETRY_DELAY,
      networkMode: 'online',
    },
  },
});

// Specialized query configurations for different use cases
export const createImageProcessingQueryConfig = (enabled = true) => ({
  staleTime: QUERY_DEFAULTS.STALE_TIME,
  gcTime: QUERY_DEFAULTS.CACHE_TIME,
  retry: 1, // Less aggressive retry for image processing
  enabled,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const createApiQueryConfig = (enabled = true) => ({
  staleTime: QUERY_DEFAULTS.STALE_TIME,
  gcTime: QUERY_DEFAULTS.CACHE_TIME,
  retry: QUERY_DEFAULTS.RETRY_COUNT,
  retryDelay: QUERY_DEFAULTS.RETRY_DELAY,
  enabled,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
});

export const createMutationConfig = <TData, TVariables>(options?: {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: BusinessLayerError, variables: TVariables) => void;
}) => ({
  retry: MUTATION_DEFAULTS.RETRY_COUNT,
  retryDelay: MUTATION_DEFAULTS.RETRY_DELAY,
  networkMode: 'online' as const,
  ...options,
});

// Utility function to invalidate related queries
export const invalidateQueries = (queryKeys: string[][]) => {
  queryKeys.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
};

// Utility function to clear cache
export const clearQueryCache = () => {
  queryClient.clear();
};