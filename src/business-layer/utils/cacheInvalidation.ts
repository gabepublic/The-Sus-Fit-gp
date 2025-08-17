// Advanced Cache Invalidation Strategies
// Comprehensive cache management for try-on mutations and related queries

import { QueryClient } from '@tanstack/react-query';
import type { TryonMutationVariables, TryonMutationResponse, TryonMutationContext } from '../types/tryon.types';

/**
 * Configuration for cache invalidation strategies
 */
export interface CacheInvalidationConfig {
  /** Whether to invalidate history-related queries */
  invalidateHistory?: boolean;
  /** Whether to invalidate user-specific data */
  invalidateUserData?: boolean;
  /** Whether to invalidate statistics and aggregations */
  invalidateStats?: boolean;
  /** Whether to invalidate tag-based queries */
  invalidateTags?: boolean;
  /** Whether to preload related queries after invalidation */
  preloadRelated?: boolean;
  /** Custom query keys to invalidate */
  customQueryKeys?: string[][];
  /** Context for user-specific invalidation */
  userContext?: {
    userId?: string;
    tags?: string[];
  };
}

/**
 * Default cache invalidation configuration
 */
const DEFAULT_CACHE_CONFIG: Required<CacheInvalidationConfig> = {
  invalidateHistory: true,
  invalidateUserData: true,
  invalidateStats: true,
  invalidateTags: true,
  preloadRelated: true,
  customQueryKeys: [],
  userContext: {}
};

/**
 * Advanced cache invalidation manager
 */
export class CacheInvalidationManager {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate caches after successful try-on mutation
   */
  async invalidateAfterSuccess(
    data: TryonMutationResponse,
    variables: TryonMutationVariables,
    context: TryonMutationContext,
    config: CacheInvalidationConfig = {}
  ): Promise<void> {
    const mergedConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    const invalidationPromises: Promise<void>[] = [];

    // 1. Invalidate history queries
    if (mergedConfig.invalidateHistory) {
      invalidationPromises.push(this.invalidateHistoryQueries());
    }

    // 2. Invalidate user-specific data
    if (mergedConfig.invalidateUserData && mergedConfig.userContext.userId) {
      invalidationPromises.push(this.invalidateUserQueries(mergedConfig.userContext.userId));
    }

    // 3. Invalidate statistics and aggregations
    if (mergedConfig.invalidateStats) {
      invalidationPromises.push(this.invalidateStatsQueries());
    }

    // 4. Invalidate tag-based queries
    if (mergedConfig.invalidateTags && mergedConfig.userContext.tags?.length) {
      invalidationPromises.push(this.invalidateTagQueries(mergedConfig.userContext.tags));
    }

    // 5. Invalidate custom query keys
    if (mergedConfig.customQueryKeys.length > 0) {
      invalidationPromises.push(this.invalidateCustomQueries(mergedConfig.customQueryKeys));
    }

    // Execute all invalidations in parallel
    await Promise.all(invalidationPromises);

    // 6. Preload related queries if enabled
    if (mergedConfig.preloadRelated) {
      await this.preloadRelatedQueries(mergedConfig.userContext);
    }
  }

  /**
   * Selective cache invalidation after error (lighter touch)
   */
  async invalidateAfterError(
    error: unknown,
    variables: TryonMutationVariables,
    context: TryonMutationContext,
    config: Partial<CacheInvalidationConfig> = {}
  ): Promise<void> {
    const lightConfig = {
      invalidateHistory: false,
      invalidateUserData: false,
      invalidateStats: false,
      invalidateTags: false,
      preloadRelated: false,
      ...config
    };

    // Only invalidate specific queries that might be affected by the error
    if (lightConfig.invalidateHistory) {
      await this.invalidateHistoryQueries();
    }
  }

  /**
   * Invalidate history-related queries
   */
  private async invalidateHistoryQueries(): Promise<void> {
    const historyInvalidations = [
      // Main history entries
      this.queryClient.invalidateQueries({ 
        queryKey: ['tryon-history'],
        exact: false 
      }),
      
      // History metadata
      this.queryClient.invalidateQueries({ 
        queryKey: ['history-metadata'],
        exact: false 
      }),
      
      // Recent activity
      this.queryClient.invalidateQueries({ 
        queryKey: ['recent-activity'],
        exact: false 
      }),
      
      // History search results
      this.queryClient.invalidateQueries({ 
        queryKey: ['history-search'],
        exact: false 
      })
    ];

    await Promise.all(historyInvalidations);
  }

  /**
   * Invalidate user-specific queries
   */
  private async invalidateUserQueries(userId: string): Promise<void> {
    const userInvalidations = [
      // User profile data
      this.queryClient.invalidateQueries({ 
        queryKey: ['user-data', userId],
        exact: false 
      }),
      
      // User preferences
      this.queryClient.invalidateQueries({ 
        queryKey: ['user-preferences', userId],
        exact: false 
      }),
      
      // User activity
      this.queryClient.invalidateQueries({ 
        queryKey: ['user-activity', userId],
        exact: false 
      }),
      
      // User statistics
      this.queryClient.invalidateQueries({ 
        queryKey: ['user-stats', userId],
        exact: false 
      })
    ];

    await Promise.all(userInvalidations);
  }

  /**
   * Invalidate statistics and aggregation queries
   */
  private async invalidateStatsQueries(): Promise<void> {
    const statsInvalidations = [
      // General try-on statistics
      this.queryClient.invalidateQueries({ 
        queryKey: ['tryon-stats'],
        exact: false 
      }),
      
      // Usage analytics
      this.queryClient.invalidateQueries({ 
        queryKey: ['usage-analytics'],
        exact: false 
      }),
      
      // Performance metrics
      this.queryClient.invalidateQueries({ 
        queryKey: ['performance-metrics'],
        exact: false 
      }),
      
      // Popular items/combinations
      this.queryClient.invalidateQueries({ 
        queryKey: ['popular-items'],
        exact: false 
      })
    ];

    await Promise.all(statsInvalidations);
  }

  /**
   * Invalidate tag-based queries
   */
  private async invalidateTagQueries(tags: string[]): Promise<void> {
    const tagInvalidations = tags.map(tag => 
      this.queryClient.invalidateQueries({ 
        queryKey: ['tryon-by-tag', tag],
        exact: false 
      })
    );

    // Also invalidate general tag queries
    tagInvalidations.push(
      this.queryClient.invalidateQueries({ 
        queryKey: ['available-tags'],
        exact: false 
      })
    );

    await Promise.all(tagInvalidations);
  }

  /**
   * Invalidate custom query keys
   */
  private async invalidateCustomQueries(customQueryKeys: string[][]): Promise<void> {
    const customInvalidations = customQueryKeys.map(queryKey => 
      this.queryClient.invalidateQueries({ 
        queryKey,
        exact: false 
      })
    );

    await Promise.all(customInvalidations);
  }

  /**
   * Preload related queries that are likely to be accessed next
   */
  private async preloadRelatedQueries(
    userContext: { userId?: string; tags?: string[] } = {}
  ): Promise<void> {
    const preloadPromises: Promise<unknown>[] = [];

    // Preload history entries (most likely to be viewed)
    preloadPromises.push(
      this.queryClient.prefetchQuery({
        queryKey: ['tryon-history', 'entries'],
        staleTime: 30000, // Fresh for 30 seconds
        gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
      })
    );

    // Preload history stats
    preloadPromises.push(
      this.queryClient.prefetchQuery({
        queryKey: ['tryon-history', 'stats'],
        staleTime: 60000, // Fresh for 1 minute
        gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
      })
    );

    // Preload user data if userId available
    if (userContext.userId) {
      preloadPromises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['user-data', userContext.userId],
          staleTime: 60000,
          gcTime: 10 * 60 * 1000
        })
      );
    }

    // Preload popular items
    preloadPromises.push(
      this.queryClient.prefetchQuery({
        queryKey: ['popular-items'],
        staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
        gcTime: 15 * 60 * 1000 // Keep in cache for 15 minutes
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Smart cache warming based on usage patterns
   */
  async warmCache(
    options: {
      userId?: string;
      recentTags?: string[];
      popularItems?: unknown[];
    } = {}
  ): Promise<void> {
    const warmupPromises: Promise<unknown>[] = [];

    // Warm up frequently accessed data structures
    if (options.popularItems?.length) {
      options.popularItems.forEach((item, index) => {
        warmupPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: ['warmup-cache', 'popular', index],
            queryFn: () => Promise.resolve(item),
            staleTime: 10 * 60 * 1000, // Fresh for 10 minutes
            gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
          })
        );
      });
    }

    // Warm up user-specific frequently accessed queries
    if (options.userId) {
      warmupPromises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['user-favorites', options.userId],
          staleTime: 5 * 60 * 1000,
          gcTime: 20 * 60 * 1000
        })
      );
    }

    // Warm up recent tag queries
    if (options.recentTags?.length) {
      options.recentTags.forEach(tag => {
        warmupPromises.push(
          this.queryClient.prefetchQuery({
            queryKey: ['recent-by-tag', tag],
            staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
            gcTime: 10 * 60 * 1000
          })
        );
      });
    }

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Cleanup stale cache entries
   */
  async cleanupStaleCache(): Promise<void> {
    // Remove queries that haven't been accessed in a while
    this.queryClient.removeQueries({
      predicate: (query) => {
        const lastAccessed = query.state.dataUpdatedAt;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return lastAccessed < oneHourAgo;
      }
    });

    // Cleanup specific temporary cache entries
    this.queryClient.removeQueries({
      queryKey: ['warmup-cache'],
      exact: false
    });

    this.queryClient.removeQueries({
      queryKey: ['temp'],
      exact: false
    });
  }
}

/**
 * Default cache invalidation manager instance
 */
export let defaultCacheManager: CacheInvalidationManager | null = null;

/**
 * Initialize the default cache invalidation manager
 */
export function initializeCacheInvalidation(queryClient: QueryClient): CacheInvalidationManager {
  defaultCacheManager = new CacheInvalidationManager(queryClient);
  return defaultCacheManager;
}

/**
 * Get the default cache invalidation manager
 */
export function getCacheInvalidationManager(): CacheInvalidationManager {
  if (!defaultCacheManager) {
    throw new Error('CacheInvalidationManager not initialized. Call initializeCacheInvalidation first.');
  }
  return defaultCacheManager;
}

/**
 * Utility function for post-mutation cache invalidation
 */
export async function invalidateCacheAfterMutation(
  queryClient: QueryClient,
  data: TryonMutationResponse,
  variables: TryonMutationVariables,
  context: TryonMutationContext,
  config?: CacheInvalidationConfig
): Promise<void> {
  const cacheManager = defaultCacheManager || new CacheInvalidationManager(queryClient);
  await cacheManager.invalidateAfterSuccess(data, variables, context, config);
}

/**
 * Hook for creating cache-aware mutation callbacks
 */
export function createCacheAwareMutationCallbacks(
  queryClient: QueryClient,
  config: CacheInvalidationConfig = {}
) {
  const cacheManager = defaultCacheManager || new CacheInvalidationManager(queryClient);

  return {
    onSuccess: async (
      data: TryonMutationResponse,
      variables: TryonMutationVariables,
      context: TryonMutationContext
    ) => {
      await cacheManager.invalidateAfterSuccess(data, variables, context, config);
    },

    onError: async (
      error: unknown,
      variables: TryonMutationVariables,
      context: TryonMutationContext | undefined
    ) => {
      if (context) {
        await cacheManager.invalidateAfterError(error, variables, context, {
          invalidateHistory: false, // Don't invalidate on error by default
          invalidateUserData: false,
          ...config
        });
      }
    }
  };
}