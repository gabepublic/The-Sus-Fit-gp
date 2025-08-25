// Comprehensive Tests for Optimistic Updates and Cache Management
// Tests for optimistic updates, cache invalidation, and rollback mechanisms

import { QueryClient } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { OptimisticUpdatesManager } from '../utils/optimisticUpdates';
import { CacheInvalidationManager } from '../utils/cacheInvalidation';
import { useTryonWithProgress } from '../hooks/useTryonWithProgress';
import type { 
  TryonMutationVariables,
  TryonMutationResponse,
  TryonMutationContext
} from '../types/tryon.types';

// Mock data for testing
const mockVariables: TryonMutationVariables = {
  modelImage: 'data:image/jpeg;base64,mock-model-image',
  apparelImages: ['data:image/jpeg;base64,mock-apparel-image'],
  options: {
    quality: 'high',
    timeout: 10000
  }
};

const mockResponse: TryonMutationResponse = {
  img_generated: 'data:image/jpeg;base64,mock-generated-image',
  metadata: {
    processingTime: 5000,
    modelVersion: 'v2.1',
    appliedQuality: 'high'
  }
};

const mockContext: TryonMutationContext = {
  variables: mockVariables,
  startTime: Date.now() - 5000,
  retryCount: 0,
  optimisticId: 'test-optimistic-id'
};

// Test utilities
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });
}

describe('OptimisticUpdatesManager', () => {
  let queryClient: QueryClient;
  let optimisticManager: OptimisticUpdatesManager;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    optimisticManager = new OptimisticUpdatesManager(queryClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('startOptimisticUpdate', () => {
    it('should start optimistic updates with correct configuration', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables, {
        showPreview: true,
        updateHistory: true,
        showProgress: true
      });

      expect(context.optimisticId).toBeDefined();
      expect(context.variables).toEqual(mockVariables);
      expect(context.config.showPreview).toBe(true);
      expect(context.config.updateHistory).toBe(true);
      expect(context.config.showProgress).toBe(true);
      expect(context.rollbackFunctions).toHaveLength(3); // history, progress, result cache
    });

    it('should create optimistic history entry when enabled', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables, {
        updateHistory: true
      });

      const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
      expect(historyData).toBeDefined();
      expect((historyData as any).entries[0].id).toContain('optimistic_history');
      expect((historyData as any).entries[0].tags).toContain('processing');
      expect((historyData as any).entries[0].tags).toContain('optimistic');
    });

    it('should set up progress tracking when enabled', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables, {
        showProgress: true
      });

      const progressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
      expect(progressData).toBeDefined();
      expect((progressData as any).status).toBe('processing');
      expect((progressData as any).progress).toBe(0);
      expect((progressData as any).id).toBe(context.optimisticId);
    });

    it('should track active optimistic updates', () => {
      const context1 = optimisticManager.startOptimisticUpdate(mockVariables);
      const context2 = optimisticManager.startOptimisticUpdate(mockVariables);

      expect(optimisticManager.isOptimisticUpdateActive(context1.optimisticId)).toBe(true);
      expect(optimisticManager.isOptimisticUpdateActive(context2.optimisticId)).toBe(true);
      expect(optimisticManager.getActiveOptimisticUpdates()).toHaveLength(2);
    });
  });

  describe('completeOptimisticUpdate', () => {
    it('should complete optimistic updates successfully', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables, {
        updateHistory: true,
        showProgress: true
      });

      optimisticManager.completeOptimisticUpdate(
        context.optimisticId,
        mockResponse,
        mockContext
      );

      // Check that history entry was updated
      const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
      expect(historyData).toBeDefined();
      const entry = (historyData as any).entries[0];
      expect(entry.generatedImage).toBe(mockResponse.img_generated);
      expect(entry.tags).not.toContain('processing');
      expect(entry.tags).not.toContain('optimistic');

      // Check that progress was completed
      const progressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
      expect((progressData as any).status).toBe('completed');
      expect((progressData as any).progress).toBe(100);

      // Check that result was cached
      const resultData = queryClient.getQueryData(['tryon-result', context.optimisticId]);
      expect((resultData as any).status).toBe('completed');
      expect((resultData as any).result).toEqual(mockResponse);
    });

    it('should clean up active updates after completion', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables);
      
      expect(optimisticManager.isOptimisticUpdateActive(context.optimisticId)).toBe(true);
      
      optimisticManager.completeOptimisticUpdate(
        context.optimisticId,
        mockResponse,
        mockContext
      );

      expect(optimisticManager.isOptimisticUpdateActive(context.optimisticId)).toBe(false);
      expect(optimisticManager.getActiveOptimisticUpdates()).toHaveLength(0);
    });
  });

  describe('rollbackOptimisticUpdate', () => {
    it('should execute all rollback functions', () => {
      const context = optimisticManager.startOptimisticUpdate(mockVariables, {
        updateHistory: true,
        showProgress: true
      });

      // Verify initial state
      expect(queryClient.getQueryData(['tryon-history', 'entries'])).toBeDefined();
      expect(queryClient.getQueryData(['tryon-progress', context.optimisticId])).toBeDefined();

      const error = new Error('Test error');
      optimisticManager.rollbackOptimisticUpdate(context.optimisticId, error);

      // Check that history entry was removed
      const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
      expect((historyData as any).entries).toHaveLength(0);

      // Check that progress shows error state
      const progressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
      expect((progressData as any).status).toBe('error');
      expect((progressData as any).error).toBe('Test error');
    });

    it('should handle rollback errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const context = optimisticManager.startOptimisticUpdate(mockVariables);
      
      // Simulate a rollback function that throws
      context.rollbackFunctions.push(() => {
        throw new Error('Rollback failed');
      });

      // Should not throw
      expect(() => {
        optimisticManager.rollbackOptimisticUpdate(context.optimisticId);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during optimistic update rollback:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('CacheInvalidationManager', () => {
  let queryClient: QueryClient;
  let cacheManager: CacheInvalidationManager;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    cacheManager = new CacheInvalidationManager(queryClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('invalidateAfterSuccess', () => {
    it('should invalidate all configured cache types', async () => {
      // Pre-populate cache with test data
      queryClient.setQueryData(['tryon-history'], { entries: [] });
      queryClient.setQueryData(['user-data', 'user123'], { id: 'user123' });
      queryClient.setQueryData(['tryon-stats'], { totalTryons: 100 });
      queryClient.setQueryData(['tryon-by-tag', 'casual'], { results: [] });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      await cacheManager.invalidateAfterSuccess(
        mockResponse,
        mockVariables,
        mockContext,
        {
          invalidateHistory: true,
          invalidateUserData: true,
          invalidateStats: true,
          invalidateTags: true,
          userContext: {
            userId: 'user123',
            tags: ['casual']
          }
        }
      );

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tryon-history'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['user-data', 'user123'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tryon-stats'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tryon-by-tag', 'casual'] })
      );
    });

    it('should preload related queries when enabled', async () => {
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery')
        .mockResolvedValue(undefined);

      await cacheManager.invalidateAfterSuccess(
        mockResponse,
        mockVariables,
        mockContext,
        {
          preloadRelated: true,
          userContext: {
            userId: 'user123'
          }
        }
      );

      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tryon-history', 'entries'] })
      );
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['user-data', 'user123'] })
      );
    });
  });

  describe('warmCache', () => {
    it('should warm up cache with provided data', async () => {
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
      const prefetchSpy = jest.spyOn(queryClient, 'prefetchQuery')
        .mockResolvedValue(undefined);

      await cacheManager.warmCache({
        userId: 'user123',
        recentTags: ['casual', 'formal'],
        popularItems: [{ id: 1 }, { id: 2 }]
      });

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['warmup-cache', 'popular', 0],
        { id: 1 }
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['warmup-cache', 'popular', 1],
        { id: 2 }
      );
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['recent-by-tag', 'casual'] })
      );
      expect(prefetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['recent-by-tag', 'formal'] })
      );
    });
  });

  describe('cleanupStaleCache', () => {
    it('should remove stale cache entries', async () => {
      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

      await cacheManager.cleanupStaleCache();

      expect(removeQueriesSpy).toHaveBeenCalledWith({
        predicate: expect.any(Function)
      });
      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['warmup-cache'],
        exact: false
      });
      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['temp'],
        exact: false
      });
    });
  });
});

describe('Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should handle complete optimistic update lifecycle', async () => {
    const optimisticManager = new OptimisticUpdatesManager(queryClient);
    
    // Start optimistic update
    const context = optimisticManager.startOptimisticUpdate(mockVariables, {
      updateHistory: true,
      showProgress: true
    });

    // Verify optimistic state
    const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
    expect((historyData as any).entries).toHaveLength(1);
    expect((historyData as any).entries[0].generatedImage).toContain('loading');

    const progressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
    expect((progressData as any).status).toBe('processing');

    // Complete the update
    optimisticManager.completeOptimisticUpdate(
      context.optimisticId,
      mockResponse,
      mockContext
    );

    // Verify completion state
    const finalHistoryData = queryClient.getQueryData(['tryon-history', 'entries']);
    expect((finalHistoryData as any).entries).toHaveLength(1);
    expect((finalHistoryData as any).entries[0].generatedImage).toBe(mockResponse.img_generated);

    const finalProgressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
    expect((finalProgressData as any).status).toBe('completed');
    expect((finalProgressData as any).progress).toBe(100);
  });

  it('should handle rollback after failure', async () => {
    const optimisticManager = new OptimisticUpdatesManager(queryClient);
    
    // Start optimistic update
    const context = optimisticManager.startOptimisticUpdate(mockVariables, {
      updateHistory: true,
      showProgress: true
    });

    // Verify optimistic state exists
    expect(queryClient.getQueryData(['tryon-history', 'entries'])).toBeDefined();
    expect(queryClient.getQueryData(['tryon-progress', context.optimisticId])).toBeDefined();

    // Rollback due to error
    const error = new Error('API request failed');
    optimisticManager.rollbackOptimisticUpdate(context.optimisticId, error);

    // Verify rollback state
    const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
    expect((historyData as any).entries).toHaveLength(0);

    const progressData = queryClient.getQueryData(['tryon-progress', context.optimisticId]);
    expect((progressData as any).status).toBe('error');
    expect((progressData as any).error).toBe('API request failed');
  });
});

// Performance Tests
describe('Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should handle multiple concurrent optimistic updates', async () => {
    const optimisticManager = new OptimisticUpdatesManager(queryClient);
    const numUpdates = 10;
    const contexts: any[] = [];

    // Start multiple optimistic updates concurrently
    const startTime = Date.now();
    
    for (let i = 0; i < numUpdates; i++) {
      const context = optimisticManager.startOptimisticUpdate({
        ...mockVariables,
        modelImage: `${mockVariables.modelImage}-${i}`
      });
      contexts.push(context);
    }

    const startDuration = Date.now() - startTime;
    expect(startDuration).toBeLessThan(100); // Should be fast

    // Verify all updates are tracked
    expect(optimisticManager.getActiveOptimisticUpdates()).toHaveLength(numUpdates);

    // Complete all updates
    const completeTime = Date.now();
    
    await Promise.all(
      contexts.map(context =>
        optimisticManager.completeOptimisticUpdate(
          context.optimisticId,
          mockResponse,
          mockContext
        )
      )
    );

    const completeDuration = Date.now() - completeTime;
    expect(completeDuration).toBeLessThan(200); // Should be reasonably fast

    // Verify cleanup
    expect(optimisticManager.getActiveOptimisticUpdates()).toHaveLength(0);
  });

  it('should efficiently handle cache invalidation for large datasets', async () => {
    const cacheManager = new CacheInvalidationManager(queryClient);
    
    // Pre-populate cache with many entries
    const numEntries = 100;
    for (let i = 0; i < numEntries; i++) {
      queryClient.setQueryData([`test-query-${i}`], { id: i });
    }

    const startTime = Date.now();
    
    await cacheManager.invalidateAfterSuccess(
      mockResponse,
      mockVariables,
      mockContext,
      {
        customQueryKeys: Array.from({ length: numEntries }, (_, i) => [`test-query-${i}`])
      }
    );

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Should handle large invalidation efficiently
  });
});