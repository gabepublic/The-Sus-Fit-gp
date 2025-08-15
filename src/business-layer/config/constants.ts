// Business Layer Constants
export const QUERY_DEFAULTS = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  RETRY_COUNT: 2,
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  TIMEOUT: 30000, // 30 seconds
} as const;

export const MUTATION_DEFAULTS = {
  RETRY_COUNT: 1,
  RETRY_DELAY: 1000,
  TIMEOUT: 60000, // 1 minute for mutations (longer for image processing)
} as const;

export const QUERY_KEYS = {
  FEATURE_FLAGS: ['feature-flags'] as const,
  IMAGE_PROCESSING: ['image-processing'] as const,
  TRYON: ['tryon'] as const,
} as const;