import type { QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// Base query configuration types
export interface QueryConfig {
  queryKey: QueryKey;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
  retryDelay?: number | ((attemptIndex: number) => number);
  enabled?: boolean;
}

// Base mutation configuration types
export interface MutationConfig {
  retry?: number | boolean;
  retryDelay?: number | ((attemptIndex: number) => number);
  onSuccess?: (data: unknown, variables: unknown) => void;
  onError?: (error: Error, variables: unknown) => void;
}

// Query client configuration
export interface BusinessQueryClientConfig {
  defaultOptions?: {
    queries?: Partial<UseQueryOptions>;
    mutations?: Partial<UseMutationOptions>;
  };
}

// Re-export commonly used types from React Query
export type { 
  QueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions,
  QueryFunction,
  MutationFunction
} from '@tanstack/react-query';