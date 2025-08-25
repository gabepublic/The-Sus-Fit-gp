/**
 * React Query Testing Utilities for Three-Layer Architecture
 * Provides comprehensive testing setup for Business Layer, Bridge Layer, and UI Components
 */

import React, { ReactElement, ComponentType } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryState, MutationState } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ToastProvider';

/**
 * Configuration for React Query testing
 */
export interface QueryTestConfig {
  /** Custom QueryClient configuration */
  queryClientConfig?: {
    defaultOptions?: {
      queries?: any;
      mutations?: any;
    };
  };
  /** Whether to disable retries (default: true) */
  disableRetries?: boolean;
  /** Whether to disable cache persistence (default: true) */
  disableCache?: boolean;
  /** Custom error handler for testing */
  onError?: (error: Error) => void;
}

/**
 * Default configuration for testing
 */
const DEFAULT_QUERY_CONFIG: Required<QueryTestConfig> = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  },
  disableRetries: true,
  disableCache: true,
  onError: (error: Error) => {
    // Only log unexpected errors in tests
    if (!error.message.includes('expected')) {
      console.error('Unexpected test error:', error);
    }
  },
};

/**
 * Creates a QueryClient configured for testing
 */
export function createTestQueryClient(config: QueryTestConfig = {}): QueryClient {
  const finalConfig = { ...DEFAULT_QUERY_CONFIG, ...config };
  
  return new QueryClient({
    ...finalConfig.queryClientConfig,
    defaultOptions: {
      ...finalConfig.queryClientConfig.defaultOptions,
      queries: {
        ...finalConfig.queryClientConfig.defaultOptions?.queries,
        retry: finalConfig.disableRetries ? false : 3,
        gcTime: finalConfig.disableCache ? 0 : 5 * 60 * 1000,
      },
      mutations: {
        ...finalConfig.queryClientConfig.defaultOptions?.mutations,
        retry: finalConfig.disableRetries ? false : 3,
      },
    },
  });
}

/**
 * Test wrapper that provides all necessary providers for our architecture
 */
export interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  queryConfig?: QueryTestConfig;
}

export function TestProviders({ 
  children, 
  queryClient, 
  queryConfig = {} 
}: TestProvidersProps): ReactElement {
  const client = queryClient || createTestQueryClient(queryConfig);

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with our providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  queryConfig?: QueryTestConfig;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient, queryConfig, ...renderOptions } = options;
  
  const client = queryClient || createTestQueryClient(queryConfig);

  function Wrapper({ children }: { children: React.ReactNode }): ReactElement {
    return (
      <TestProviders queryClient={client}>
        {children}
      </TestProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
}

/**
 * Hook testing utilities for React Query hooks
 */
class HookTestUtils {
  protected queryClient: QueryClient;

  constructor(queryConfig: QueryTestConfig = {}) {
    this.queryClient = createTestQueryClient(queryConfig);
  }

  /**
   * Get the QueryClient instance
   */
  getQueryClient(): QueryClient {
    return this.queryClient;
  }

  /**
   * Clear all caches and reset state
   */
  resetState(): void {
    this.queryClient.clear();
    this.queryClient.resetQueries();
    this.queryClient.cancelQueries();
  }

  /**
   * Set mock data in the cache
   */
  setQueryData(queryKey: unknown[], data: unknown): void {
    this.queryClient.setQueryData(queryKey, data);
  }

  /**
   * Get cached data
   */
  getQueryData(queryKey: unknown[]): unknown {
    return this.queryClient.getQueryData(queryKey);
  }

  /**
   * Invalidate queries
   */
  invalidateQueries(queryKey?: unknown[]): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey });
  }

  /**
   * Wait for all queries to settle
   */
  async waitForQueries(): Promise<void> {
    await this.queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.fetchStatus === 'fetching') {
        return query.promise;
      }
    });
  }

  /**
   * Get query state for debugging
   */
  getQueryState(queryKey: unknown[]): QueryState<unknown, Error> | undefined {
    const query = this.queryClient.getQueryCache().find({ queryKey });
    return query?.state;
  }

  /**
   * Get mutation state for debugging
   */
  getMutationState(): Array<{ state: MutationState<unknown, Error, unknown, unknown>; options: any }> {
    return this.queryClient.getMutationCache().getAll().map(mutation => ({
      state: mutation.state,
      options: mutation.options,
    }));
  }

  /**
   * Create a provider component for renderHook
   */
  createWrapper(): ComponentType<{ children: React.ReactNode }> {
    const queryClient = this.queryClient;
    
    return function TestWrapper({ children }: { children: React.ReactNode }): ReactElement {
      return (
        <TestProviders queryClient={queryClient}>
          {children}
        </TestProviders>
      );
    };
  }
}

/**
 * Utilities for testing mutations
 */
class MutationTestUtils extends HookTestUtils {
  /**
   * Wait for a mutation to complete
   */
  async waitForMutation(
    mutationKey?: unknown[],
    timeout: number = 5000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const mutations = this.queryClient.getMutationCache().getAll();
      const targetMutation = mutationKey 
        ? mutations.find(m => JSON.stringify(m.options.mutationKey) === JSON.stringify(mutationKey))
        : mutations[0];

      if (!targetMutation || targetMutation.state.status !== 'pending') {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error(`Mutation did not complete within ${timeout}ms`);
  }

  /**
   * Get the latest mutation result
   */
  getLatestMutationResult(): MutationState<unknown, Error, unknown, unknown> | undefined {
    const mutations = this.queryClient.getMutationCache().getAll();
    const latestMutation = mutations[mutations.length - 1];
    return latestMutation?.state;
  }

  /**
   * Check if any mutations are pending
   */
  hasPendingMutations(): boolean {
    return this.queryClient.getMutationCache().getAll()
      .some(mutation => mutation.state.status === 'pending');
  }
}

/**
 * Mock utilities for testing
 */
class MockUtils {
  /**
   * Create a mock File object for testing file uploads
   */
  static createMockFile(
    content: string = 'mock-file-content',
    filename: string = 'test-image.jpg',
    type: string = 'image/jpeg'
  ): File {
    const blob = new Blob([content], { type });
    return new File([blob], filename, { type });
  }

  /**
   * Create a mock image URL
   */
  static createMockImageUrl(
    content: string = 'mock-image-data'
  ): string {
    return `data:image/jpeg;base64,${btoa(content)}`;
  }

  /**
   * Create mock API response
   */
  static createMockApiResponse<T>(
    data: T,
    options: {
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
    } = {}
  ): Response {
    const { status = 200, statusText = 'OK', headers = {} } = options;
    
    return new Response(JSON.stringify(data), {
      status,
      statusText,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  /**
   * Create mock error response
   */
  static createMockErrorResponse(
    message: string = 'Test error',
    status: number = 500
  ): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Time utilities for testing async operations
 */
class TimeTestUtils {
  /**
   * Wait for a specific amount of time
   */
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for next tick
   */
  static waitForNextTick(): Promise<void> {
    return new Promise(resolve => process.nextTick(resolve));
  }

  /**
   * Wait for multiple ticks
   */
  static async waitForTicks(count: number = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.waitForNextTick();
    }
  }

  /**
   * Execute function with fake timers
   */
  static async withFakeTimers<T>(fn: () => Promise<T>): Promise<T> {
    jest.useFakeTimers();
    try {
      const result = await fn();
      return result;
    } finally {
      jest.useRealTimers();
    }
  }
}

/**
 * Export commonly used utilities
 */
export { 
  createTestQueryClient as createQueryClient,
  renderWithProviders as render,
  TestProviders as Providers,
  HookTestUtils,
  MutationTestUtils,
  MockUtils,
  TimeTestUtils,
};

/**
 * Default export for convenience
 */
export default {
  createQueryClient: createTestQueryClient,
  render: renderWithProviders,
  Providers: TestProviders,
  HookTestUtils,
  MutationTestUtils,
  MockUtils,
  TimeTestUtils,
};