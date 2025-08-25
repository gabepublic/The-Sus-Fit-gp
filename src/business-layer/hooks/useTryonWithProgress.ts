// Try-On Hook with Progress Tracking
// Combines mutation, optimistic updates, and progress tracking for easy component integration

import { useCallback, useMemo, useState } from 'react';
import { useTryonMutation } from '../mutations/useTryonMutation';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import type {
  TryonMutationVariables,
  TryonMutationResponse,
  UseTryonMutationConfig
} from '../types/tryon.types';

/**
 * Configuration for the try-on with progress hook
 */
export interface UseTryonWithProgressConfig extends UseTryonMutationConfig {
  /** Whether to automatically start optimistic updates */
  autoOptimistic?: boolean;
  /** Default optimistic configuration */
  defaultOptimisticConfig?: {
    showPreview?: boolean;
    updateHistory?: boolean;
    showProgress?: boolean;
    previewPlaceholder?: string;
    estimatedProcessingTime?: number;
  };
  /** Default cache invalidation configuration */
  defaultCacheConfig?: {
    invalidateHistory?: boolean;
    invalidateUserData?: boolean;
    invalidateStats?: boolean;
    invalidateTags?: boolean;
    preloadRelated?: boolean;
    userContext?: {
      userId?: string;
      tags?: string[];
    };
  };
}

/**
 * Return type for the try-on with progress hook
 */
export interface UseTryonWithProgressReturn {
  /** Execute try-on mutation with automatic progress tracking */
  executeTryon: (variables: TryonMutationVariables) => Promise<TryonMutationResponse>;
  /** Execute try-on mutation synchronously (fire and forget) */
  executeTryonSync: (variables: TryonMutationVariables) => void;
  /** Current mutation result */
  data: TryonMutationResponse | undefined;
  /** Current error */
  error: unknown;
  /** Whether mutation is loading */
  isLoading: boolean;
  /** Whether mutation succeeded */
  isSuccess: boolean;
  /** Whether mutation failed */
  isError: boolean;
  /** Whether mutation is idle */
  isIdle: boolean;
  /** Current mutation status */
  status: 'idle' | 'loading' | 'error' | 'success';
  /** Reset mutation state */
  reset: () => void;
  /** Current optimistic update ID */
  currentOptimisticId: string | null;
  /** Whether optimistic updates are active */
  hasActiveOptimistic: boolean;
  /** Start optimistic update manually */
  startOptimistic: (variables: TryonMutationVariables) => string;
  /** Complete optimistic update manually */
  completeOptimistic: (optimisticId: string, result: TryonMutationResponse) => void;
  /** Rollback optimistic update manually */
  rollbackOptimistic: (optimisticId: string, error?: unknown) => void;
  /** Active optimistic updates */
  activeOptimisticUpdates: any[];
}

/**
 * Default configuration
 */
const DEFAULT_PROGRESS_CONFIG: Required<Pick<UseTryonWithProgressConfig, 'autoOptimistic'>> = {
  autoOptimistic: true
};

/**
 * Hook that combines try-on mutation with progress tracking and optimistic updates
 */
export function useTryonWithProgress(
  config: UseTryonWithProgressConfig = {}
): UseTryonWithProgressReturn {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_PROGRESS_CONFIG,
    enableOptimisticUpdates: config.autoOptimistic !== false,
    optimisticConfig: {
      showPreview: true,
      updateHistory: true,
      showProgress: true,
      estimatedProcessingTime: 8000,
      ...config.defaultOptimisticConfig
    },
    cacheInvalidationConfig: {
      invalidateHistory: true,
      invalidateUserData: true,
      invalidateStats: true,
      invalidateTags: true,
      preloadRelated: true,
      ...config.defaultCacheConfig
    },
    ...config
  }), [config]);

  const [currentOptimisticId, setCurrentOptimisticId] = useState<string | null>(null);

  // Initialize mutation hook with optimistic updates enabled
  const mutation = useTryonMutation(mergedConfig);

  // Initialize optimistic updates hook
  const optimisticUpdates = useOptimisticUpdates({
    enabled: mergedConfig.enableOptimisticUpdates
  });

  // Enhanced execute function with automatic progress tracking
  const executeTryon = useCallback(async (variables: TryonMutationVariables): Promise<TryonMutationResponse> => {
    let optimisticId: string | null = null;

    try {
      // Start optimistic updates if enabled
      if (mergedConfig.enableOptimisticUpdates) {
        optimisticId = optimisticUpdates.startOptimistic(mergedConfig.optimisticConfig);
        setCurrentOptimisticId(optimisticId);
      }

      // Execute mutation
      const result = await mutation.mutateAsync(variables);

      // Complete optimistic updates if they were started
      if (optimisticId && mergedConfig.enableOptimisticUpdates) {
        optimisticUpdates.completeOptimistic(optimisticId, result);
        setCurrentOptimisticId(null);
      }

      return result;
    } catch (error) {
      // Rollback optimistic updates on error
      if (optimisticId && mergedConfig.enableOptimisticUpdates) {
        optimisticUpdates.rollbackOptimistic(optimisticId, error);
        setCurrentOptimisticId(null);
      }
      throw error;
    }
  }, [mutation, optimisticUpdates, mergedConfig]);

  // Sync version that doesn't return a promise
  const executeTryonSync = useCallback((variables: TryonMutationVariables): void => {
    executeTryon(variables).catch(error => {
      console.error('Try-on execution failed:', error);
    });
  }, [executeTryon]);

  // Manual optimistic update controls
  const startOptimistic = useCallback((variables: TryonMutationVariables): string => {
    const optimisticId = optimisticUpdates.startOptimistic(mergedConfig.optimisticConfig);
    setCurrentOptimisticId(optimisticId);
    return optimisticId;
  }, [optimisticUpdates, mergedConfig.optimisticConfig]);

  const completeOptimistic = useCallback((optimisticId: string, result: TryonMutationResponse) => {
    optimisticUpdates.completeOptimistic(optimisticId, result);
    if (currentOptimisticId === optimisticId) {
      setCurrentOptimisticId(null);
    }
  }, [optimisticUpdates, currentOptimisticId]);

  const rollbackOptimistic = useCallback((optimisticId: string, error?: unknown) => {
    optimisticUpdates.rollbackOptimistic(optimisticId, error);
    if (currentOptimisticId === optimisticId) {
      setCurrentOptimisticId(null);
    }
  }, [optimisticUpdates, currentOptimisticId]);

  // Derived state
  const hasActiveOptimistic = Boolean(currentOptimisticId) || optimisticUpdates.activeUpdates.length > 0;

  return {
    // Execution methods
    executeTryon,
    executeTryonSync,
    
    // Mutation state
    data: mutation.data,
    error: mutation.error,
    isLoading: mutation.isLoading,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    isIdle: mutation.isIdle,
    status: mutation.status,
    reset: mutation.reset,
    
    // Optimistic updates state
    currentOptimisticId,
    hasActiveOptimistic,
    activeOptimisticUpdates: optimisticUpdates.activeUpdates,
    
    // Manual optimistic controls
    startOptimistic,
    completeOptimistic,
    rollbackOptimistic
  };
}

/**
 * Simplified hook for basic try-on with progress (most common use case)
 */
export function useSimpleTryonWithProgress(
  options: {
    userId?: string;
    tags?: string[];
    estimatedProcessingTime?: number;
    showProgress?: boolean;
  } = {}
): Pick<UseTryonWithProgressReturn, 'executeTryon' | 'isLoading' | 'currentOptimisticId' | 'error' | 'data'> {
  const config: UseTryonWithProgressConfig = {
    defaultOptimisticConfig: {
      showProgress: options.showProgress !== false,
      estimatedProcessingTime: options.estimatedProcessingTime || 8000
    },
    defaultCacheConfig: {
      userContext: {
        userId: options.userId,
        tags: options.tags
      }
    }
  };

  const {
    executeTryon,
    isLoading,
    currentOptimisticId,
    error,
    data
  } = useTryonWithProgress(config);

  return {
    executeTryon,
    isLoading,
    currentOptimisticId,
    error,
    data
  };
}

/**
 * Hook for batch try-on operations with progress tracking
 */
export function useBatchTryonWithProgress(
  config: UseTryonWithProgressConfig = {}
): {
  executeBatch: (variablesList: TryonMutationVariables[]) => Promise<TryonMutationResponse[]>;
  batchProgress: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    progressPercentage: number;
  };
  activeBatchIds: string[];
  cancelBatch: () => void;
} {
  const [activeBatchIds, setActiveBatchIds] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<{ success: number; failed: number; total: number }>({
    success: 0,
    failed: 0,
    total: 0
  });

  const tryonWithProgress = useTryonWithProgress(config);

  const executeBatch = useCallback(async (variablesList: TryonMutationVariables[]): Promise<TryonMutationResponse[]> => {
    setBatchResults({ success: 0, failed: 0, total: variablesList.length });
    const batchIds: string[] = [];

    try {
      const results = await Promise.allSettled(
        variablesList.map(async (variables) => {
          const optimisticId = tryonWithProgress.startOptimistic(variables);
          batchIds.push(optimisticId);
          setActiveBatchIds(prev => [...prev, optimisticId]);

          try {
            const result = await tryonWithProgress.executeTryon(variables);
            setBatchResults(prev => ({ ...prev, success: prev.success + 1 }));
            return result;
          } catch (error) {
            setBatchResults(prev => ({ ...prev, failed: prev.failed + 1 }));
            throw error;
          } finally {
            setActiveBatchIds(prev => prev.filter(id => id !== optimisticId));
          }
        })
      );

      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          throw result.reason;
        }
      });
    } finally {
      setActiveBatchIds([]);
    }
  }, [tryonWithProgress]);

  const cancelBatch = useCallback(() => {
    activeBatchIds.forEach(id => {
      tryonWithProgress.rollbackOptimistic(id, new Error('Batch cancelled'));
    });
    setActiveBatchIds([]);
    setBatchResults({ success: 0, failed: 0, total: 0 });
  }, [activeBatchIds, tryonWithProgress]);

  const batchProgress = useMemo(() => {
    const { success, failed, total } = batchResults;
    const completed = success + failed;
    const inProgress = total - completed;
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed: success,
      failed,
      inProgress,
      progressPercentage
    };
  }, [batchResults]);

  return {
    executeBatch,
    batchProgress,
    activeBatchIds,
    cancelBatch
  };
}