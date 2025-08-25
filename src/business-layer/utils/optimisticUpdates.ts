// Optimistic Updates Manager
// Handles immediate UI feedback and rollback mechanisms for try-on mutations

import { QueryClient } from '@tanstack/react-query';
import type {
  TryonMutationVariables,
  TryonMutationResponse,
  TryonMutationContext
} from '../types/tryon.types';
import type {
  TryonHistoryEntry,
  TryonHistoryCollection
} from '../types/history.types';
import { HISTORY_QUERY_KEYS } from '../hooks/useTryonHistory';

/**
 * Configuration for optimistic updates
 */
export interface OptimisticUpdateConfig {
  /** Whether to show immediate preview of generated image */
  showPreview?: boolean;
  /** Whether to add optimistic entry to history */
  updateHistory?: boolean;
  /** Whether to show loading progress indicators */
  showProgress?: boolean;
  /** Custom preview image to show during processing */
  previewPlaceholder?: string;
  /** Estimated processing time for progress calculation */
  estimatedProcessingTime?: number;
}

/**
 * Default optimistic update configuration
 */
const DEFAULT_OPTIMISTIC_CONFIG: Required<OptimisticUpdateConfig> = {
  showPreview: true,
  updateHistory: true,
  showProgress: true,
  previewPlaceholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxNTM2IiB2aWV3Qm94PSIwIDAgMTAyNCAxNTM2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxNTM2IiBmaWxsPSIjZjNmNGY2Ii8+CjxjaXJjbGUgY3g9IjUxMiIgY3k9Ijc2OCIgcj0iNjQiIGZpbGw9IiNkMWQ1ZGIiLz4KPHN2ZyBpZD0ic3Bpbm5lciIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiB2aWV3Qm94PSIwIDAgNjQgNjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjI0IiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtZGFzaGFycmF5PSIxNTAuNzk2NDQ3MzcyMTAwMiIgc3Ryb2tlLWRhc2hvZmZzZXQ9IjE1MC43OTY0NDczNzIxMDAwMiI+CjxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiB2YWx1ZXM9IjAgMzIgMzI7MzYwIDMyIDMyIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgo8L2NpcmNsZT4KPC9zdmc+', // Loading spinner SVG
  estimatedProcessingTime: 8000 // 8 seconds
};

/**
 * Context for tracking optimistic updates
 */
export interface OptimisticUpdateContext {
  /** Unique identifier for this optimistic update */
  optimisticId: string;
  /** Original mutation variables */
  variables: TryonMutationVariables;
  /** Configuration used */
  config: OptimisticUpdateConfig;
  /** Start time for progress calculation */
  startTime: number;
  /** Optimistic history entry ID if created */
  optimisticHistoryId?: string;
  /** Rollback functions */
  rollbackFunctions: Array<() => void>;
}

/**
 * Optimistic updates manager class
 */
export class OptimisticUpdatesManager {
  private queryClient: QueryClient;
  private activeOptimisticUpdates = new Map<string, OptimisticUpdateContext>();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Start optimistic updates for a try-on mutation
   */
  startOptimisticUpdate(
    variables: TryonMutationVariables,
    config: OptimisticUpdateConfig = {}
  ): OptimisticUpdateContext {
    const mergedConfig = { ...DEFAULT_OPTIMISTIC_CONFIG, ...config };
    const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: OptimisticUpdateContext = {
      optimisticId,
      variables,
      config: mergedConfig,
      startTime: Date.now(),
      rollbackFunctions: []
    };

    // Apply optimistic updates
    this.applyOptimisticUpdates(context);
    
    // Store context for potential rollback
    this.activeOptimisticUpdates.set(optimisticId, context);

    return context;
  }

  /**
   * Apply optimistic updates to the cache
   */
  private applyOptimisticUpdates(context: OptimisticUpdateContext): void {
    const { variables, config, optimisticId } = context;

    // 1. Add optimistic history entry if enabled
    if (config.updateHistory) {
      this.addOptimisticHistoryEntry(context);
    }

    // 2. Set up progress indicator data if enabled
    if (config.showProgress) {
      this.setupProgressIndicator(context);
    }

    // 3. Pre-cache expected result structure
    this.setupResultCaching(context);
  }

  /**
   * Add optimistic history entry
   */
  private addOptimisticHistoryEntry(context: OptimisticUpdateContext): void {
    const { variables, config, optimisticId } = context;
    
    const optimisticHistoryId = `optimistic_history_${optimisticId}`;
    context.optimisticHistoryId = optimisticHistoryId;

    // Create optimistic history entry
    const optimisticEntry: TryonHistoryEntry = {
      id: optimisticHistoryId,
      timestamp: new Date().toISOString(),
      generatedImage: config.previewPlaceholder || DEFAULT_OPTIMISTIC_CONFIG.previewPlaceholder,
      modelImage: variables.modelImage,
      apparelImages: variables.apparelImages,
      processingTime: undefined, // Will be updated on completion
      metadata: {
        processingConfig: {
          imageProcessing: variables.options?.imageProcessing,
          requestOptions: {
            timeout: variables.options?.timeout,
            quality: variables.options?.quality
          }
        }
      },
      tags: ['processing', 'optimistic'],
      notes: 'Processing...',
      isFavorite: false
    };

    // Update history cache optimistically
    const historyQueryKey = HISTORY_QUERY_KEYS.entries();
    this.queryClient.setQueryData<TryonHistoryCollection>(
      historyQueryKey,
      (oldData) => {
        if (!oldData) {
          return {
            entries: [optimisticEntry],
            totalCount: 1,
            currentPage: 0,
            pageSize: 20,
            hasMore: false,
            lastUpdated: new Date().toISOString()
          };
        }

        return {
          ...oldData,
          entries: [optimisticEntry, ...oldData.entries],
          totalCount: oldData.totalCount + 1,
          lastUpdated: new Date().toISOString()
        };
      }
    );

    // Add rollback function
    context.rollbackFunctions.push(() => {
      this.queryClient.setQueryData<TryonHistoryCollection>(
        historyQueryKey,
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            entries: oldData.entries.filter(entry => entry.id !== optimisticHistoryId),
            totalCount: Math.max(0, oldData.totalCount - 1),
            lastUpdated: new Date().toISOString()
          };
        }
      );
    });
  }

  /**
   * Set up progress indicator data
   */
  private setupProgressIndicator(context: OptimisticUpdateContext): void {
    const { optimisticId, config } = context;
    const progressQueryKey = ['tryon-progress', optimisticId];

    // Initialize progress data
    const initialProgress = {
      id: optimisticId,
      status: 'processing' as const,
      progress: 0,
      stage: 'image-processing' as const,
      estimatedTimeRemaining: config.estimatedProcessingTime,
      startTime: context.startTime
    };

    this.queryClient.setQueryData(progressQueryKey, initialProgress);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - context.startTime;
      const progress = Math.min(90, (elapsed / (config.estimatedProcessingTime || 8000)) * 100);
      
      let stage: string = 'image-processing';
      if (progress > 20) stage = 'ai-generation';
      if (progress > 60) stage = 'post-processing';
      if (progress > 80) stage = 'finalizing';

      const progressData = {
        id: optimisticId,
        status: 'processing' as const,
        progress,
        stage,
        estimatedTimeRemaining: Math.max(0, (config.estimatedProcessingTime || 8000) - elapsed),
        startTime: context.startTime
      };

      this.queryClient.setQueryData(progressQueryKey, progressData);
    }, 500);

    // Add rollback function to clear progress
    context.rollbackFunctions.push(() => {
      clearInterval(progressInterval);
      this.queryClient.removeQueries({ queryKey: progressQueryKey });
    });
  }

  /**
   * Set up result caching structure
   */
  private setupResultCaching(context: OptimisticUpdateContext): void {
    // Pre-populate the cache structure for the expected result
    const resultQueryKey = ['tryon-result', context.optimisticId];
    
    const pendingResult = {
      id: context.optimisticId,
      status: 'pending' as const,
      variables: context.variables,
      startTime: context.startTime
    };

    this.queryClient.setQueryData(resultQueryKey, pendingResult);

    // Add rollback function
    context.rollbackFunctions.push(() => {
      this.queryClient.removeQueries({ queryKey: resultQueryKey });
    });
  }

  /**
   * Complete optimistic update with actual result
   */
  completeOptimisticUpdate(
    optimisticId: string,
    result: TryonMutationResponse,
    mutationContext: TryonMutationContext
  ): void {
    const context = this.activeOptimisticUpdates.get(optimisticId);
    if (!context) return;

    const processingTime = Date.now() - context.startTime;

    // Update history entry if it was created optimistically
    if (context.optimisticHistoryId) {
      const historyQueryKey = HISTORY_QUERY_KEYS.entries();
      this.queryClient.setQueryData<TryonHistoryCollection>(
        historyQueryKey,
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            entries: oldData.entries.map(entry => 
              entry.id === context.optimisticHistoryId
                ? {
                    ...entry,
                    id: `completed_${Date.now()}`, // Generate new real ID
                    generatedImage: result.img_generated,
                    processingTime,
                    metadata: {
                      ...entry.metadata,
                      modelVersion: result.metadata?.modelVersion,
                      appliedQuality: result.metadata?.appliedQuality,
                      imageProcessingResults: mutationContext.imageProcessingResults
                    },
                    tags: entry.tags?.filter(tag => tag !== 'processing' && tag !== 'optimistic') || [],
                    notes: `Completed in ${(processingTime / 1000).toFixed(1)}s`
                  }
                : entry
            ),
            lastUpdated: new Date().toISOString()
          };
        }
      );
    }

    // Update progress to completion
    const progressQueryKey = ['tryon-progress', optimisticId];
    this.queryClient.setQueryData(progressQueryKey, {
      id: optimisticId,
      status: 'completed' as const,
      progress: 100,
      stage: 'completed',
      estimatedTimeRemaining: 0,
      startTime: context.startTime,
      completedAt: Date.now(),
      result
    });

    // Update result cache
    const resultQueryKey = ['tryon-result', optimisticId];
    this.queryClient.setQueryData(resultQueryKey, {
      id: optimisticId,
      status: 'completed' as const,
      variables: context.variables,
      startTime: context.startTime,
      completedAt: Date.now(),
      processingTime,
      result
    });

    // Clean up
    this.cleanupOptimisticUpdate(optimisticId);
  }

  /**
   * Rollback optimistic update on failure
   */
  rollbackOptimisticUpdate(optimisticId: string, error?: unknown): void {
    const context = this.activeOptimisticUpdates.get(optimisticId);
    if (!context) return;

    // Execute all rollback functions
    context.rollbackFunctions.forEach(rollback => {
      try {
        rollback();
      } catch (rollbackError) {
        console.error('Error during optimistic update rollback:', rollbackError);
      }
    });

    // Update progress to error state
    const progressQueryKey = ['tryon-progress', optimisticId];
    this.queryClient.setQueryData(progressQueryKey, {
      id: optimisticId,
      status: 'error' as const,
      progress: 0,
      stage: 'error',
      estimatedTimeRemaining: 0,
      startTime: context.startTime,
      error: error instanceof Error ? error.message : String(error)
    });

    // Clean up
    this.cleanupOptimisticUpdate(optimisticId);
  }

  /**
   * Clean up optimistic update context
   */
  private cleanupOptimisticUpdate(optimisticId: string): void {
    this.activeOptimisticUpdates.delete(optimisticId);
    
    // Schedule cleanup of progress and result caches after a delay
    setTimeout(() => {
      this.queryClient.removeQueries({ 
        queryKey: ['tryon-progress', optimisticId] 
      });
      this.queryClient.removeQueries({ 
        queryKey: ['tryon-result', optimisticId] 
      });
    }, 5000); // Keep for 5 seconds for UI transitions
  }

  /**
   * Get current progress for an optimistic update
   */
  getOptimisticProgress(optimisticId: string) {
    const progressQueryKey = ['tryon-progress', optimisticId];
    return this.queryClient.getQueryData(progressQueryKey);
  }

  /**
   * Check if an optimistic update is active
   */
  isOptimisticUpdateActive(optimisticId: string): boolean {
    return this.activeOptimisticUpdates.has(optimisticId);
  }

  /**
   * Get all active optimistic updates
   */
  getActiveOptimisticUpdates(): OptimisticUpdateContext[] {
    return Array.from(this.activeOptimisticUpdates.values());
  }
}

/**
 * Default optimistic updates manager instance
 */
export let defaultOptimisticManager: OptimisticUpdatesManager | null = null;

/**
 * Initialize the default optimistic updates manager
 */
export function initializeOptimisticUpdates(queryClient: QueryClient): OptimisticUpdatesManager {
  defaultOptimisticManager = new OptimisticUpdatesManager(queryClient);
  return defaultOptimisticManager;
}

/**
 * Get the default optimistic updates manager
 */
export function getOptimisticUpdatesManager(): OptimisticUpdatesManager {
  if (!defaultOptimisticManager) {
    throw new Error('OptimisticUpdatesManager not initialized. Call initializeOptimisticUpdates first.');
  }
  return defaultOptimisticManager;
}