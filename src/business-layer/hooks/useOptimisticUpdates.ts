// Optimistic Updates Hooks
// React hooks for managing optimistic UI updates and progress indicators

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  OptimisticUpdateConfig,
  OptimisticUpdateContext,
  OptimisticUpdatesManager
} from '../utils/optimisticUpdates';
import { getOptimisticUpdatesManager } from '../utils/optimisticUpdates';

/**
 * Progress data structure for try-on operations
 */
export interface TryonProgress {
  id: string;
  status: 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  stage: string;
  estimatedTimeRemaining: number;
  startTime: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

/**
 * Hook return type for optimistic updates
 */
export interface UseOptimisticUpdatesReturn {
  /** Start an optimistic update */
  startOptimistic: (config?: OptimisticUpdateConfig) => string;
  /** Complete an optimistic update */
  completeOptimistic: (optimisticId: string, result: unknown, context?: unknown) => void;
  /** Rollback an optimistic update */
  rollbackOptimistic: (optimisticId: string, error?: unknown) => void;
  /** Check if optimistic updates are enabled */
  isOptimisticEnabled: boolean;
  /** Get current active optimistic updates */
  activeUpdates: OptimisticUpdateContext[];
}

/**
 * Configuration for the optimistic updates hook
 */
export interface UseOptimisticUpdatesConfig {
  /** Variables for the try-on mutation */
  mutationVariables?: unknown;
  /** Whether optimistic updates are enabled */
  enabled?: boolean;
  /** Custom optimistic updates manager */
  optimisticManager?: OptimisticUpdatesManager;
}

/**
 * Hook for managing optimistic updates during try-on mutations
 */
export function useOptimisticUpdates(
  config: UseOptimisticUpdatesConfig = {}
): UseOptimisticUpdatesReturn {
  const queryClient = useQueryClient();
  const optimisticManager = config.optimisticManager || getOptimisticUpdatesManager();
  const activeUpdatesRef = useRef<Set<string>>(new Set());

  const isOptimisticEnabled = config.enabled !== false;

  // Get active optimistic updates
  const activeUpdates = useMemo(() => {
    return optimisticManager.getActiveOptimisticUpdates();
  }, [optimisticManager]);

  const startOptimistic = useCallback((optimisticConfig?: OptimisticUpdateConfig): string => {
    if (!isOptimisticEnabled || !config.mutationVariables) {
      return '';
    }

    const context = optimisticManager.startOptimisticUpdate(
      config.mutationVariables as any,
      optimisticConfig
    );

    activeUpdatesRef.current.add(context.optimisticId);
    return context.optimisticId;
  }, [isOptimisticEnabled, config.mutationVariables, optimisticManager]);

  const completeOptimistic = useCallback((
    optimisticId: string,
    result: unknown,
    mutationContext?: unknown
  ) => {
    if (!optimisticId || !activeUpdatesRef.current.has(optimisticId)) {
      return;
    }

    optimisticManager.completeOptimisticUpdate(
      optimisticId,
      result as any,
      mutationContext as any
    );

    activeUpdatesRef.current.delete(optimisticId);
  }, [optimisticManager]);

  const rollbackOptimistic = useCallback((optimisticId: string, error?: unknown) => {
    if (!optimisticId || !activeUpdatesRef.current.has(optimisticId)) {
      return;
    }

    optimisticManager.rollbackOptimisticUpdate(optimisticId, error);
    activeUpdatesRef.current.delete(optimisticId);
  }, [optimisticManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Rollback any remaining optimistic updates
      activeUpdatesRef.current.forEach(optimisticId => {
        optimisticManager.rollbackOptimisticUpdate(optimisticId, new Error('Component unmounted'));
      });
      activeUpdatesRef.current.clear();
    };
  }, [optimisticManager]);

  return {
    startOptimistic,
    completeOptimistic,
    rollbackOptimistic,
    isOptimisticEnabled,
    activeUpdates
  };
}

/**
 * Hook for tracking progress of try-on operations
 */
export function useTryonProgress(optimisticId: string): {
  progress: TryonProgress | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const progressQuery = useQuery({
    queryKey: ['tryon-progress', optimisticId],
    enabled: Boolean(optimisticId),
    refetchInterval: (data) => {
      // Stop refetching once completed or errored
      const progressData = data as unknown as TryonProgress | undefined;
      return progressData?.status === 'processing' ? 500 : false;
    },
    staleTime: 0, // Always fresh for real-time updates
    gcTime: 5000 // Keep in cache briefly after completion
  });

  return {
    progress: progressQuery.data as TryonProgress | undefined,
    isLoading: progressQuery.isLoading,
    error: progressQuery.error
  };
}

/**
 * Hook for tracking multiple try-on progress instances
 */
export function useMultipleTryonProgress(optimisticIds: string[]): {
  progressMap: Record<string, TryonProgress>;
  anyInProgress: boolean;
  allCompleted: boolean;
} {
  const queries = optimisticIds.map(id => 
    useQuery({
      queryKey: ['tryon-progress', id],
      enabled: Boolean(id),
      refetchInterval: 500,
      staleTime: 0
    })
  );

  const progressMap = useMemo(() => {
    const map: Record<string, TryonProgress> = {};
    optimisticIds.forEach((id, index) => {
      const data = queries[index]?.data as TryonProgress | undefined;
      if (data) {
        map[id] = data;
      }
    });
    return map;
  }, [optimisticIds, queries]);

  const anyInProgress = useMemo(() => {
    return Object.values(progressMap).some(progress => progress.status === 'processing');
  }, [progressMap]);

  const allCompleted = useMemo(() => {
    return optimisticIds.length > 0 && 
           Object.keys(progressMap).length === optimisticIds.length &&
           Object.values(progressMap).every(progress => progress.status !== 'processing');
  }, [optimisticIds, progressMap]);

  return {
    progressMap,
    anyInProgress,
    allCompleted
  };
}

/**
 * Hook for getting try-on results
 */
export function useTryonResult(optimisticId: string): {
  result: unknown;
  isLoading: boolean;
  isCompleted: boolean;
  error: Error | null;
  processingTime?: number;
} {
  const resultQuery = useQuery({
    queryKey: ['tryon-result', optimisticId],
    enabled: Boolean(optimisticId),
    staleTime: Infinity, // Results don't change once set
    gcTime: 60000 // Keep results for 1 minute
  });

  const data = resultQuery.data as any;
  
  return {
    result: data?.result,
    isLoading: resultQuery.isLoading,
    isCompleted: data?.status === 'completed',
    error: resultQuery.error,
    processingTime: data?.processingTime
  };
}

/**
 * Hook for progress visualization and UI feedback
 */
export function useProgressVisualization(
  optimisticId: string,
  config: {
    enableStageMessages?: boolean;
    enableTimeEstimates?: boolean;
    enableAnimation?: boolean;
  } = {}
): {
  progress: TryonProgress | undefined;
  progressPercentage: number;
  stageMessage: string;
  timeRemaining: string;
  progressColor: string;
  isAnimating: boolean;
} {
  const { progress } = useTryonProgress(optimisticId);
  
  const progressPercentage = progress?.progress || 0;
  
  const stageMessage = useMemo(() => {
    if (!config.enableStageMessages || !progress) return '';
    
    switch (progress.stage) {
      case 'image-processing':
        return 'Processing images...';
      case 'ai-generation':
        return 'Generating your try-on...';
      case 'post-processing':
        return 'Adding final touches...';
      case 'finalizing':
        return 'Almost done...';
      case 'completed':
        return 'Complete!';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Processing...';
    }
  }, [config.enableStageMessages, progress]);
  
  const timeRemaining = useMemo(() => {
    if (!config.enableTimeEstimates || !progress?.estimatedTimeRemaining) return '';
    
    const seconds = Math.ceil(progress.estimatedTimeRemaining / 1000);
    if (seconds <= 0) return '';
    if (seconds < 60) return `${seconds}s remaining`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  }, [config.enableTimeEstimates, progress]);
  
  const progressColor = useMemo(() => {
    if (!progress) return '#e5e7eb';
    
    switch (progress.status) {
      case 'processing':
        return '#3b82f6'; // Blue for processing
      case 'completed':
        return '#10b981'; // Green for completed
      case 'error':
        return '#ef4444'; // Red for error
      default:
        return '#e5e7eb'; // Gray for idle
    }
  }, [progress]);
  
  const isAnimating = useMemo(() => {
    return config.enableAnimation !== false && 
           progress?.status === 'processing';
  }, [config.enableAnimation, progress]);

  return {
    progress,
    progressPercentage,
    stageMessage,
    timeRemaining,
    progressColor,
    isAnimating
  };
}

/**
 * Hook for optimistic cache invalidation strategies
 */
export function useOptimisticCacheInvalidation(): {
  invalidateRelatedQueries: (context?: { userId?: string; tags?: string[] }) => Promise<void>;
  preloadRelatedQueries: (context?: { userId?: string }) => Promise<void>;
  warmupCache: (prefetchData?: unknown[]) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const invalidateRelatedQueries = useCallback(async (context?: { userId?: string; tags?: string[] }) => {
    // Invalidate history queries
    await queryClient.invalidateQueries({ 
      queryKey: ['tryon-history'],
      exact: false 
    });

    // Invalidate user-specific queries if userId provided
    if (context?.userId) {
      await queryClient.invalidateQueries({ 
        queryKey: ['user-data', context.userId],
        exact: false 
      });
    }

    // Invalidate tag-specific queries if tags provided
    if (context?.tags?.length) {
      for (const tag of context.tags) {
        await queryClient.invalidateQueries({ 
          queryKey: ['tryon-by-tag', tag],
          exact: false 
        });
      }
    }

    // Invalidate stats and aggregations
    await queryClient.invalidateQueries({ 
      queryKey: ['tryon-stats'],
      exact: false 
    });
  }, [queryClient]);

  const preloadRelatedQueries = useCallback(async (context?: { userId?: string }) => {
    // Preload frequently accessed queries
    const preloadPromises = [];

    // Preload history
    preloadPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['tryon-history', 'entries'],
        staleTime: 30000
      })
    );

    // Preload stats
    preloadPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['tryon-history', 'stats'],
        staleTime: 60000
      })
    );

    if (context?.userId) {
      preloadPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['user-data', context.userId],
          staleTime: 60000
        })
      );
    }

    await Promise.all(preloadPromises);
  }, [queryClient]);

  const warmupCache = useCallback(async (prefetchData?: unknown[]) => {
    // Warm up the cache with commonly used data
    if (prefetchData?.length) {
      prefetchData.forEach((data, index) => {
        queryClient.setQueryData(['warmup-cache', index], data);
      });
    }

    // Prefetch critical queries that are likely to be needed
    await preloadRelatedQueries();
  }, [queryClient, preloadRelatedQueries]);

  return {
    invalidateRelatedQueries,
    preloadRelatedQueries,
    warmupCache
  };
}