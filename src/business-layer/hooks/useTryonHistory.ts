// Try-On History React Query Hooks
// Provides React Query integration for history management with caching and synchronization

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type {
  TryonHistoryEntry,
  TryonHistoryCollection,
  TryonHistoryQueryOptions,
  CreateTryonHistoryEntryOptions,
  UseTryonHistoryReturn,
  TryonHistoryService
} from '../types/history.types';
import { defaultHistoryService } from '../services/tryonHistoryService';

/**
 * Query keys for history-related React Query operations
 */
export const HISTORY_QUERY_KEYS = {
  all: ['tryon-history'] as const,
  entries: (options?: TryonHistoryQueryOptions) => ['tryon-history', 'entries', options] as const,
  entry: (id: string) => ['tryon-history', 'entry', id] as const,
  stats: () => ['tryon-history', 'stats'] as const
} as const;

/**
 * Configuration for history hooks
 */
interface UseTryonHistoryConfig {
  /** History service instance to use */
  historyService?: TryonHistoryService;
  /** Default query options */
  defaultQueryOptions?: TryonHistoryQueryOptions;
  /** Enable automatic refetch */
  enableRefetch?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  cacheTime?: number;
}

/**
 * Default hook configuration
 */
const DEFAULT_CONFIG: Required<UseTryonHistoryConfig> = {
  historyService: defaultHistoryService,
  defaultQueryOptions: {
    page: 0,
    pageSize: 20,
    sortBy: 'timestamp',
    sortDirection: 'desc'
  },
  enableRefetch: false,
  refetchInterval: 0,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
};

/**
 * Hook for managing try-on history with React Query
 */
export function useTryonHistory(
  queryOptions: TryonHistoryQueryOptions = {},
  config: UseTryonHistoryConfig = {}
): UseTryonHistoryReturn {
  const queryClient = useQueryClient();
  
  // Merge configuration with defaults
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  // Merge query options with defaults
  const mergedQueryOptions = useMemo(() => ({
    ...mergedConfig.defaultQueryOptions,
    ...queryOptions
  }), [mergedConfig.defaultQueryOptions, queryOptions]);

  // Query for history entries
  const historyQuery = useQuery<TryonHistoryCollection>({
    queryKey: HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
    queryFn: () => mergedConfig.historyService.getEntries(mergedQueryOptions),
    staleTime: mergedConfig.staleTime,
    gcTime: mergedConfig.cacheTime,
    refetchInterval: mergedConfig.enableRefetch ? mergedConfig.refetchInterval : false,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Mutation for adding new entries
  const addEntryMutation = useMutation({
    mutationFn: (options: CreateTryonHistoryEntryOptions) => 
      mergedConfig.historyService.addEntry(options),
    onSuccess: (newEntry) => {
      // Invalidate and refetch history entries
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.all });
      
      // Optimistically update the cache
      queryClient.setQueryData<TryonHistoryCollection>(
        HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            entries: [newEntry, ...oldData.entries],
            totalCount: oldData.totalCount + 1,
            lastUpdated: new Date().toISOString()
          };
        }
      );
    }
  });

  // Mutation for updating entries
  const updateEntryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TryonHistoryEntry> }) =>
      mergedConfig.historyService.updateEntry(id, updates),
    onSuccess: (updatedEntry) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.entry(updatedEntry.id) });
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.entries() });
      
      // Update the entry in all relevant caches
      queryClient.setQueryData(HISTORY_QUERY_KEYS.entry(updatedEntry.id), updatedEntry);
      
      // Update the entry in the entries list cache
      queryClient.setQueryData<TryonHistoryCollection>(
        HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            entries: oldData.entries.map(entry => 
              entry.id === updatedEntry.id ? updatedEntry : entry
            ),
            lastUpdated: new Date().toISOString()
          };
        }
      );
    }
  });

  // Mutation for deleting entries
  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => mergedConfig.historyService.deleteEntry(id),
    onSuccess: (success, deletedId) => {
      if (success) {
        // Remove from all caches
        queryClient.removeQueries({ queryKey: HISTORY_QUERY_KEYS.entry(deletedId) });
        queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.entries() });
        
        // Optimistically remove from entries list
        queryClient.setQueryData<TryonHistoryCollection>(
          HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
          (oldData) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              entries: oldData.entries.filter(entry => entry.id !== deletedId),
              totalCount: Math.max(0, oldData.totalCount - 1),
              lastUpdated: new Date().toISOString()
            };
          }
        );
      }
    }
  });

  // Mutation for clearing all entries
  const clearAllMutation = useMutation({
    mutationFn: () => mergedConfig.historyService.clearAll(),
    onSuccess: (success) => {
      if (success) {
        // Clear all history-related caches
        queryClient.removeQueries({ queryKey: HISTORY_QUERY_KEYS.all });
        
        // Set empty state
        queryClient.setQueryData<TryonHistoryCollection>(
          HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
          {
            entries: [],
            totalCount: 0,
            currentPage: 0,
            pageSize: mergedQueryOptions.pageSize!,
            hasMore: false,
            lastUpdated: new Date().toISOString()
          }
        );
      }
    }
  });

  // Memoized callback functions
  const addEntry = useCallback(async (options: CreateTryonHistoryEntryOptions) => {
    return addEntryMutation.mutateAsync(options);
  }, [addEntryMutation]);

  const updateEntry = useCallback(async (id: string, updates: Partial<TryonHistoryEntry>) => {
    await updateEntryMutation.mutateAsync({ id, updates });
  }, [updateEntryMutation]);

  const deleteEntry = useCallback(async (id: string) => {
    await deleteEntryMutation.mutateAsync(id);
  }, [deleteEntryMutation]);

  const loadMore = useCallback(async () => {
    if (!historyQuery.data?.hasMore || historyQuery.isFetching) return;
    
    const nextPage = historyQuery.data.currentPage + 1;
    const nextPageOptions = { ...mergedQueryOptions, page: nextPage };
    
    // Fetch next page
    const nextPageData = await queryClient.fetchQuery({
      queryKey: HISTORY_QUERY_KEYS.entries(nextPageOptions),
      queryFn: () => mergedConfig.historyService.getEntries(nextPageOptions),
      staleTime: mergedConfig.staleTime
    });
    
    // Merge with current data
    queryClient.setQueryData<TryonHistoryCollection>(
      HISTORY_QUERY_KEYS.entries(mergedQueryOptions),
      (oldData) => {
        if (!oldData) return nextPageData;
        
        return {
          ...nextPageData,
          entries: [...oldData.entries, ...nextPageData.entries],
          currentPage: nextPage
        };
      }
    );
  }, [historyQuery.data, historyQuery.isFetching, mergedQueryOptions, queryClient, mergedConfig.historyService, mergedConfig.staleTime]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEYS.entries(mergedQueryOptions) });
  }, [queryClient, mergedQueryOptions]);

  const clearAll = useCallback(async () => {
    await clearAllMutation.mutateAsync();
  }, [clearAllMutation]);

  // Return hook interface
  return useMemo<UseTryonHistoryReturn>(() => ({
    entries: historyQuery.data?.entries || [],
    isLoading: historyQuery.isLoading || historyQuery.isFetching,
    error: historyQuery.error,
    hasMore: historyQuery.data?.hasMore || false,
    currentPage: historyQuery.data?.currentPage || 0,
    totalCount: historyQuery.data?.totalCount || 0,
    addEntry,
    updateEntry,
    deleteEntry,
    loadMore,
    refresh,
    clearAll
  }), [
    historyQuery.data,
    historyQuery.isLoading,
    historyQuery.isFetching,
    historyQuery.error,
    addEntry,
    updateEntry,
    deleteEntry,
    loadMore,
    refresh,
    clearAll
  ]);
}

/**
 * Hook for getting a single history entry by ID
 */
export function useTryonHistoryEntry(
  id: string,
  config: Pick<UseTryonHistoryConfig, 'historyService' | 'staleTime' | 'cacheTime'> = {}
): UseQueryResult<TryonHistoryEntry | null> {
  const mergedConfig = useMemo(() => ({
    historyService: defaultHistoryService,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...config
  }), [config]);

  return useQuery({
    queryKey: HISTORY_QUERY_KEYS.entry(id),
    queryFn: () => mergedConfig.historyService.getEntry(id),
    staleTime: mergedConfig.staleTime,
    gcTime: mergedConfig.cacheTime,
    enabled: Boolean(id),
    retry: 2
  });
}

/**
 * Hook for getting storage statistics
 */
export function useTryonHistoryStats(
  config: Pick<UseTryonHistoryConfig, 'historyService' | 'staleTime' | 'cacheTime'> = {}
): UseQueryResult<any> {
  const mergedConfig = useMemo(() => ({
    historyService: defaultHistoryService,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...config
  }), [config]);

  return useQuery({
    queryKey: HISTORY_QUERY_KEYS.stats(),
    queryFn: () => mergedConfig.historyService.getStorageStats(),
    staleTime: mergedConfig.staleTime,
    gcTime: mergedConfig.cacheTime,
    refetchOnWindowFocus: false
  });
}