// Business Layer Configuration
// Re-export configuration utilities and constants

export { 
  queryClient,
  createImageProcessingQueryConfig,
  createApiQueryConfig,
  createMutationConfig,
  invalidateQueries,
  clearQueryCache
} from './queryClient.config';

export { 
  QUERY_DEFAULTS, 
  MUTATION_DEFAULTS, 
  QUERY_KEYS 
} from './constants';