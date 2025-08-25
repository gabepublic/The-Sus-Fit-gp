// Performance Tests for Try-On Mutations
// Tests to ensure mutations perform well under various load conditions

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useTryonMutation } from '../../../src/business-layer/mutations/useTryonMutation';
import { useTryonWithProgress, useBatchTryonWithProgress } from '../../../src/business-layer/hooks/useTryonWithProgress';
import {
  createTestQueryClient,
  createQueryClientWrapper,
  mockTryonAPI,
  mockTryonResponse,
  mockConsole,
  wait
} from '../../../src/business-layer/tests/testUtils';
import type { TryonMutationVariables } from '../../../src/business-layer/types/tryon.types';

// Mock dependencies for performance testing
jest.mock('../../../src/business-layer/utils/optimisticUpdates', () => ({
  getOptimisticUpdatesManager: () => ({
    startOptimisticUpdate: jest.fn(() => ({
      optimisticId: `perf-test-${Date.now()}-${Math.random()}`,
      variables: {},
      config: {},
      startTime: Date.now(),
      rollbackFunctions: []
    })),
    completeOptimisticUpdate: jest.fn(),
    rollbackOptimisticUpdate: jest.fn(),
    getActiveOptimisticUpdates: jest.fn(() => [])
  }),
  OptimisticUpdatesManager: jest.fn()
}));

jest.mock('../../../src/business-layer/utils/cacheInvalidation', () => ({
  invalidateCacheAfterMutation: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../../src/business-layer/utils/imageProcessing', () => ({
  processImageForTryon: jest.fn().mockImplementation(() => {
    // Simulate realistic processing time
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          originalSize: 2048576,
          processedSize: 1048576,
          compressionRatio: 0.5,
          processingTime: 50 + Math.random() * 100, // 50-150ms
          processedImage: 'data:image/jpeg;base64,processed-image',
          metadata: {
            originalDimensions: { width: 1920, height: 1080 },
            processedDimensions: { width: 1024, height: 1536 },
            format: 'jpeg',
            quality: 0.9
          }
        });
      }, 50 + Math.random() * 100);
    });
  })
}));

jest.mock('../../../src/business-layer/utils/errorHandling', () => ({
  classifyTryonError: jest.fn(() => ({ userMessage: 'Error', technicalMessage: 'Error', errorCode: 'TEST', retryable: false, category: 'TEST', severity: 'MEDIUM', recoveryActions: [] })),
  logAndClassifyError: jest.fn(() => ({ userMessage: 'Error', technicalMessage: 'Error', errorCode: 'TEST', retryable: false, category: 'TEST', severity: 'MEDIUM', recoveryActions: [] })),
  isErrorRetryable: jest.fn(() => false)
}));

describe('Mutation Performance Tests', () => {
  let queryClient: QueryClient;
  let consoleRef: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    consoleRef = mockConsole();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
    consoleRef.restore();
  });

  describe('Single Mutation Performance', () => {
    it('should complete basic mutation within performance threshold', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 200); // 200ms API delay

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonMutation(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.current.data).toEqual(mockTryonResponse);
    });

    it('should handle large base64 images efficiently', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 300);

      // Create a large base64 string to simulate real image data
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(1000000); // ~1MB base64
      
      const testVariables: TryonMutationVariables = {
        modelImage: largeBase64,
        apparelImages: [largeBase64, largeBase64],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonMutation(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1500); // Should handle large images within 1.5 seconds
    });

    it('should process File objects within reasonable time', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 250);

      const mockFile = new File(
        [new ArrayBuffer(5 * 1024 * 1024)], // 5MB file
        'large-image.jpg',
        { type: 'image/jpeg' }
      );

      const testVariables = {
        modelImage: mockFile,
        apparelImages: [mockFile],
        options: {
          imageProcessing: {
            targetWidth: 1024,
            targetHeight: 1536,
            maxSizeKB: 1024,
            compressionQuality: 0.9
          }
        }
      };

      const { result } = renderHook(
        () => useTryonMutation(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables as any);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 5000 });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(2000); // Should process files within 2 seconds
    });
  });

  describe('Concurrent Mutations Performance', () => {
    it('should handle multiple concurrent mutations efficiently', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 300);

      const numConcurrentMutations = 5;
      const mutations: any[] = [];
      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      // Create multiple mutation hooks
      for (let i = 0; i < numConcurrentMutations; i++) {
        const { result } = renderHook(
          () => useTryonMutation(),
          { wrapper: createQueryClientWrapper(queryClient) }
        );
        mutations.push(result);
      }

      const startTime = performance.now();

      // Start all mutations concurrently
      await act(async () => {
        mutations.forEach(mutation => {
          mutation.current.mutate(testVariables);
        });
      });

      // Wait for all to complete
      await waitFor(() => {
        expect(mutations.every(m => m.current.isSuccess)).toBe(true);
      }, { timeout: 10000 });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(5000); // Should handle 5 concurrent within 5 seconds
      mutations.forEach(mutation => {
        expect(mutation.current.data).toEqual(mockTryonResponse);
      });
    });

    it('should handle batch operations efficiently', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 200);

      const batchSize = 3;
      const testVariablesList: TryonMutationVariables[] = Array.from(
        { length: batchSize },
        (_, i) => ({
          modelImage: `data:image/jpeg;base64,test-model-${i}`,
          apparelImages: [`data:image/jpeg;base64,test-apparel-${i}`],
          options: {}
        })
      );

      const { result } = renderHook(
        () => useBatchTryonWithProgress(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      let batchResults: any[] = [];
      await act(async () => {
        batchResults = await result.current.executeBatch(testVariablesList);
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(3000); // Should handle batch within 3 seconds
      expect(batchResults).toHaveLength(batchSize);
      expect(result.current.batchProgress.completed).toBe(batchSize);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with repeated mutations', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 100);

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonMutation(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const numIterations = 20;
      
      for (let i = 0; i < numIterations; i++) {
        await act(async () => {
          result.current.mutate(testVariables);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Reset between iterations
        act(() => {
          result.current.reset();
        });

        // Small delay to allow cleanup
        await wait(10);
      }

      // Verify final state is clean
      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should cleanup optimistic updates efficiently', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 150);

      const config = {
        enableOptimisticUpdates: true,
        optimisticConfig: {
          showPreview: true,
          updateHistory: true,
          showProgress: true
        }
      };

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonWithProgress(config),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const numIterations = 10;

      for (let i = 0; i < numIterations; i++) {
        const startTime = performance.now();

        await act(async () => {
          await result.current.executeTryon(testVariables);
        });

        const iterationTime = performance.now() - startTime;
        expect(iterationTime).toBeLessThan(1000); // Each iteration should be fast

        // Verify cleanup (accept null or empty string as both indicate no active optimistic update)
        expect(result.current.currentOptimisticId == null || result.current.currentOptimisticId === "").toBe(true);
        expect(result.current.hasActiveOptimistic).toBe(false);
      }
    });
  });

  describe('Cache Performance', () => {
    it('should handle cache invalidation efficiently', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 200);

      // Pre-populate cache with many entries
      const numCacheEntries = 100;
      for (let i = 0; i < numCacheEntries; i++) {
        queryClient.setQueryData([`test-cache-${i}`], { data: `entry-${i}` });
      }

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const config = {
        cacheInvalidationConfig: {
          invalidateHistory: true,
          invalidateUserData: true,
          invalidateStats: true,
          invalidateTags: true,
          preloadRelated: true
        }
      };

      const { result } = renderHook(
        () => useTryonMutation(config),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1500); // Should handle cache operations efficiently
    });

    it('should perform well with large query cache', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 100);

      // Create a large query cache
      const numQueries = 500;
      for (let i = 0; i < numQueries; i++) {
        queryClient.setQueryData([`large-cache-${i}`], {
          data: Array.from({ length: 100 }, (_, j) => ({ id: j, value: `item-${i}-${j}` }))
        });
      }

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonMutation(),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Should not be significantly slowed by large cache
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle retries efficiently', async () => {
      let attemptCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server Error' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTryonResponse)
        });
      });

      const config = {
        enableRetry: true,
        maxRetries: 3,
        initialRetryDelay: 50 // Fast retries for testing
      };

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonMutation(config),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.mutate(testVariables);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 5000 });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Should handle retries quickly
      expect(attemptCount).toBe(3); // Initial + 2 retries
    });

    it('should cleanup efficiently after errors', async () => {
      const apiError = new Error('API Error');
      mockTryonAPI(undefined, apiError);

      const config = {
        enableOptimisticUpdates: true,
        optimisticConfig: {
          showPreview: true,
          updateHistory: true
        }
      };

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result } = renderHook(
        () => useTryonWithProgress(config),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      const startTime = performance.now();

      await act(async () => {
        try {
          await result.current.executeTryon(testVariables);
        } catch (error) {
          // Expected to fail
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(500); // Error handling should be fast
      // Should cleanup optimistic state (accept null or empty string)
      expect(result.current.currentOptimisticId == null || result.current.currentOptimisticId === "").toBe(true);
    });
  });

  describe('Resource Cleanup Performance', () => {
    it('should cleanup resources quickly on component unmount', async () => {
      mockTryonAPI(mockTryonResponse, undefined, 1000); // Long delay

      const config = {
        enableOptimisticUpdates: true
      };

      const testVariables: TryonMutationVariables = {
        modelImage: 'data:image/jpeg;base64,test-model',
        apparelImages: ['data:image/jpeg;base64,test-apparel'],
        options: {}
      };

      const { result, unmount } = renderHook(
        () => useTryonWithProgress(config),
        { wrapper: createQueryClientWrapper(queryClient) }
      );

      // Start mutation
      await act(async () => {
        result.current.executeTryon(testVariables).catch(() => {}); // Ignore rejection
      });

      const unmountStart = performance.now();
      
      // Unmount component
      unmount();

      const unmountTime = performance.now() - unmountStart;

      expect(unmountTime).toBeLessThan(100); // Unmount should be very fast
    });
  });
});