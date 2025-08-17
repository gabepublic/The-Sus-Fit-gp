// Test Utilities for Optimistic Updates and Cache Management
// Common utilities and mocks for testing optimistic updates functionality

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { 
  TryonMutationVariables,
  TryonMutationResponse,
  TryonMutationContext,
  TryonMutationError
} from '../types/tryon.types';

/**
 * Create a test query client with appropriate settings
 */
export function createTestQueryClient(options?: {
  defaultOptions?: {
    queries?: any;
    mutations?: any;
  };
}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        ...options?.defaultOptions?.queries
      },
      mutations: {
        retry: false,
        ...options?.defaultOptions?.mutations
      }
    }
  });
}

/**
 * Create a wrapper component with QueryClient for hook testing
 */
export function createQueryClientWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client }, children)
  );
}

/**
 * Render hook with query client wrapper
 */
export function renderHookWithQueryClient<T>(
  hook: () => T,
  queryClient?: QueryClient
) {
  const wrapper = createQueryClientWrapper(queryClient);
  return renderHook(hook, { wrapper });
}

/**
 * Mock try-on mutation variables
 */
export const mockTryonVariables: TryonMutationVariables = {
  modelImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/mock-model-image',
  apparelImages: [
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/mock-apparel-1',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/mock-apparel-2'
  ],
  options: {
    quality: 'high',
    timeout: 10000,
    enableOptimisticUpdates: true,
    metadata: {
      testMode: true,
      timestamp: '2024-01-15T10:30:00Z'
    },
    imageProcessing: {
      targetWidth: 1024,
      targetHeight: 1536,
      maxSizeKB: 1024,
      compressionQuality: 0.9,
      preserveAspectRatio: false
    }
  }
};

/**
 * Mock try-on mutation response
 */
export const mockTryonResponse: TryonMutationResponse = {
  img_generated: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/mock-generated-result',
  metadata: {
    processingTime: 5234,
    modelVersion: 'v2.1.0',
    appliedQuality: 'high',
    timestamp: '2024-01-15T10:30:05Z',
    processingInfo: {
      stepsCompleted: ['image-processing', 'ai-generation', 'post-processing'],
      totalSteps: 3,
      gpuUsage: 0.85,
      memoryUsage: 0.67
    }
  }
};

/**
 * Mock try-on mutation context
 */
export const mockTryonContext: TryonMutationContext = {
  variables: mockTryonVariables,
  startTime: Date.now() - 5234,
  retryCount: 0,
  optimisticId: 'test-optimistic-12345',
  imageProcessingResults: {
    modelImageResult: {
      originalSize: 2048576, // 2MB
      finalSize: 1048576, // 1MB
      originalDimensions: { width: 1920, height: 1080 },
      finalDimensions: { width: 1024, height: 1536 },
      processedImage: mockTryonVariables.modelImage,
      metadata: {
        wasResized: true,
        wasCompressed: true,
        compressionRatio: 0.5,
        processingTime: 123
      }
    },
    apparelImageResults: [
      {
        originalSize: 1536000,
        finalSize: 768000,
        originalDimensions: { width: 1200, height: 800 },
        finalDimensions: { width: 1024, height: 1536 },
        processedImage: mockTryonVariables.apparelImages[0],
        metadata: {
          wasResized: true,
          wasCompressed: true,
          compressionRatio: 0.5,
          processingTime: 89
        }
      }
    ],
    totalProcessingTime: 212
  }
};

/**
 * Mock try-on mutation error
 */
export const mockTryonError: TryonMutationError = {
  error: 'Processing failed: Invalid image format',
  details: 'The provided model image is not in a supported format. Please use JPEG, PNG, or WebP.',
  code: 'INVALID_IMAGE_FORMAT',
  status: 400,
  retryable: false,
  category: 'VALIDATION_ERROR' as any,
  severity: 'HIGH' as any,
  recoveryActions: [
    {
      type: 'USER_ACTION' as any,
      description: 'Convert image to a supported format'
    }
  ]
};

/**
 * Create mock fetch response for API testing
 */
export function createMockFetchResponse(
  data: any,
  status = 200,
  ok = true
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic',
    url: 'http://localhost:3000/api/tryon',
    body: null,
    bodyUsed: false,
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn()
  } as unknown as Response;
}

/**
 * Mock the try-on API endpoint
 */
export function mockTryonAPI(
  response?: TryonMutationResponse,
  error?: TryonMutationError | Error,
  delay = 0
): jest.SpyInstance {
  const mockResponse = response || mockTryonResponse;
  const mockError = error;

  return jest.spyOn(global, 'fetch').mockImplementation(
    (url: string | URL | Request) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      if (urlString.includes('/api/tryon')) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (mockError) {
              // Handle basic Error objects by converting them to TryonMutationError format
              let errorResponse;
              if (mockError instanceof Error && !('status' in mockError)) {
                // Convert basic Error to TryonMutationError format
                errorResponse = {
                  error: 'An error occurred',
                  details: mockError.message,
                  code: 'UNKNOWN_ERROR',
                  status: 400,
                  retryable: false,
                  category: 'NETWORK_ERROR' as any,
                  severity: 'MEDIUM' as any,
                  recoveryActions: []
                };
              } else {
                // Use the error as-is if it's already in TryonMutationError format
                errorResponse = mockError as TryonMutationError;
              }
              const mockResponse = createMockFetchResponse(errorResponse, errorResponse.status || 500, false);
              resolve(mockResponse);
            } else {
              resolve(createMockFetchResponse(mockResponse));
            }
          }, delay);
        });
      }
      
      return Promise.reject(new Error(`Unmocked fetch call to ${urlString}`));
    }
  );
}

/**
 * Wait for all pending promises to resolve
 */
export function waitForPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock history entries for testing
 */
export function createMockHistoryEntries(count = 5) {
  return Array.from({ length: count }, (_, index) => ({
    id: `history-entry-${index}`,
    timestamp: new Date(Date.now() - index * 60000).toISOString(),
    generatedImage: `data:image/jpeg;base64,mock-generated-${index}`,
    modelImage: `data:image/jpeg;base64,mock-model-${index}`,
    apparelImages: [`data:image/jpeg;base64,mock-apparel-${index}`],
    processingTime: 3000 + Math.random() * 2000,
    metadata: {
      modelVersion: 'v2.1.0',
      appliedQuality: 'high',
      processingConfig: {
        imageProcessing: mockTryonVariables.options?.imageProcessing,
        requestOptions: {
          timeout: 10000,
          quality: 'high'
        }
      }
    },
    tags: index % 2 === 0 ? ['casual'] : ['formal'],
    notes: `Test entry ${index}`,
    isFavorite: index % 3 === 0
  }));
}

/**
 * Assert that optimistic update was created correctly
 */
export function assertOptimisticUpdateCreated(
  queryClient: QueryClient,
  optimisticId: string,
  config: {
    expectHistory?: boolean;
    expectProgress?: boolean;
    expectResult?: boolean;
  } = {}
) {
  const { expectHistory = true, expectProgress = true, expectResult = true } = config;

  if (expectHistory) {
    const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
    expect(historyData).toBeDefined();
    expect((historyData as any).entries).toContainEqual(
      expect.objectContaining({
        id: expect.stringContaining('optimistic_history'),
        tags: expect.arrayContaining(['processing', 'optimistic'])
      })
    );
  }

  if (expectProgress) {
    const progressData = queryClient.getQueryData(['tryon-progress', optimisticId]);
    expect(progressData).toBeDefined();
    expect(progressData).toMatchObject({
      id: optimisticId,
      status: 'processing',
      progress: expect.any(Number),
      stage: expect.any(String)
    });
  }

  if (expectResult) {
    const resultData = queryClient.getQueryData(['tryon-result', optimisticId]);
    expect(resultData).toBeDefined();
    expect(resultData).toMatchObject({
      id: optimisticId,
      status: 'pending',
      variables: expect.any(Object)
    });
  }
}

/**
 * Assert that optimistic update was completed correctly
 */
export function assertOptimisticUpdateCompleted(
  queryClient: QueryClient,
  optimisticId: string,
  expectedResult: TryonMutationResponse
) {
  // Check history was updated
  const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
  expect(historyData).toBeDefined();
  const entry = (historyData as any).entries.find((e: any) => 
    !e.id.includes('optimistic_history')
  );
  expect(entry).toBeDefined();
  expect(entry.generatedImage).toBe(expectedResult.img_generated);
  expect(entry.tags).not.toContain('processing');
  expect(entry.tags).not.toContain('optimistic');

  // Check progress was completed
  const progressData = queryClient.getQueryData(['tryon-progress', optimisticId]);
  expect(progressData).toMatchObject({
    id: optimisticId,
    status: 'completed',
    progress: 100,
    stage: 'completed'
  });

  // Check result was cached
  const resultData = queryClient.getQueryData(['tryon-result', optimisticId]);
  expect(resultData).toMatchObject({
    id: optimisticId,
    status: 'completed',
    result: expectedResult
  });
}

/**
 * Assert that optimistic update was rolled back correctly
 */
export function assertOptimisticUpdateRolledBack(
  queryClient: QueryClient,
  optimisticId: string,
  expectedError?: string
) {
  // Check history entry was removed
  const historyData = queryClient.getQueryData(['tryon-history', 'entries']);
  expect(historyData).toBeDefined();
  const optimisticEntry = (historyData as any).entries.find((e: any) => 
    e.id.includes('optimistic_history')
  );
  expect(optimisticEntry).toBeUndefined();

  // Check progress shows error state
  const progressData = queryClient.getQueryData(['tryon-progress', optimisticId]);
  expect(progressData).toMatchObject({
    id: optimisticId,
    status: 'error',
    progress: 0,
    stage: 'error'
  });

  if (expectedError) {
    expect((progressData as any).error).toBe(expectedError);
  }
}

/**
 * Mock console methods to avoid test output pollution
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  const consoleMocks = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation()
  };

  return {
    mocks: consoleMocks,
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
}