/**
 * Bridge Layer Testing Utilities
 * Specialized utilities for testing bridge layer hooks and their integration with business layer
 */

import React from 'react';
import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { waitFor, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { 
  HookTestUtils, 
  MutationTestUtils, 
  MockUtils, 
  TestProviders,
  type QueryTestConfig 
} from './react-query-test-utils';
import { ToastProvider } from '../../src/components/ToastProvider';

/**
 * Configuration for bridge layer testing
 */
export interface BridgeLayerTestConfig extends QueryTestConfig {
  /** Mock toast notifications */
  mockToast?: boolean;
  /** Mock file APIs */
  mockFileAPIs?: boolean;
  /** Mock fetch for API calls */
  mockFetch?: boolean;
  /** Initial state for workflow testing */
  initialWorkflowState?: any;
}

/**
 * Default configuration for bridge layer testing
 */
const DEFAULT_BRIDGE_CONFIG: Required<BridgeLayerTestConfig> = {
  queryClientConfig: {
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  },
  disableRetries: true,
  disableCache: true,
  onError: () => {},
  mockToast: true,
  mockFileAPIs: true,
  mockFetch: true,
  initialWorkflowState: null,
};

/**
 * Bridge layer testing utilities
 */
class BridgeLayerTestUtils extends MutationTestUtils {
  private config: Required<BridgeLayerTestConfig>;
  private mocks: {
    fetch?: jest.MockedFunction<typeof fetch>;
    toast?: jest.MockedFunction<any>;
    fileReader?: jest.MockedFunction<any>;
    URL?: jest.MockedFunction<any>;
  } = {};

  constructor(config: BridgeLayerTestConfig = {}) {
    const finalConfig = { ...DEFAULT_BRIDGE_CONFIG, ...config };
    super(finalConfig);
    this.config = finalConfig;
    this.setupMocks();
  }

  /**
   * Setup mocks for bridge layer testing
   */
  private setupMocks(): void {
    // Mock fetch if enabled
    if (this.config.mockFetch && !this.mocks.fetch) {
      this.mocks.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
      global.fetch = this.mocks.fetch;
    }

    // Mock FileReader if enabled
    if (this.config.mockFileAPIs && !this.mocks.fileReader) {
      this.mocks.fileReader = jest.fn().mockImplementation(() => ({
        readAsDataURL: jest.fn(),
        result: null,
        onload: null,
        onerror: null,
      }));
      global.FileReader = this.mocks.fileReader;
    }

    // Mock URL.createObjectURL if enabled
    if (this.config.mockFileAPIs && !this.mocks.URL) {
      this.mocks.URL = jest.fn().mockReturnValue('mock-url://test-file');
      global.URL.createObjectURL = this.mocks.URL;
      global.URL.revokeObjectURL = jest.fn();
    }

    // Mock toast if enabled
    if (this.config.mockToast && !this.mocks.toast) {
      this.mocks.toast = jest.fn();
    }
  }

  /**
   * Get mock functions for inspection
   */
  getMocks() {
    return this.mocks;
  }

  /**
   * Reset all mocks
   */
  resetMocks(): void {
    Object.values(this.mocks).forEach(mock => {
      if (mock && typeof mock.mockClear === 'function') {
        mock.mockClear();
      }
    });
  }

  /**
   * Setup successful API response mock
   */
  mockSuccessfulApiCall(
    response: any = { img_generated: 'mock-generated-image-data' },
    delay: number = 0
  ): void {
    if (this.mocks.fetch) {
      this.mocks.fetch.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(response),
          } as Response), delay)
        )
      );
    }
  }

  /**
   * Setup API error response mock
   */
  mockApiError(
    error: string = 'Test API error',
    status: number = 500,
    delay: number = 0
  ): void {
    if (this.mocks.fetch) {
      this.mocks.fetch.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: false,
            status,
            json: () => Promise.resolve({ error }),
          } as Response), delay)
        )
      );
    }
  }

  /**
   * Setup API timeout mock
   */
  mockApiTimeout(timeoutMs: number = 1000): void {
    if (this.mocks.fetch) {
      this.mocks.fetch.mockImplementation(() =>
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), timeoutMs)
        )
      );
    }
  }

  /**
   * Mock file reading operation
   */
  mockFileRead(
    result: string = 'data:image/jpeg;base64,mock-file-data',
    delay: number = 0
  ): void {
    if (this.mocks.fileReader) {
      this.mocks.fileReader.mockImplementation(() => {
        const reader = {
          readAsDataURL: jest.fn((file: File) => {
            setTimeout(() => {
              reader.result = result;
              if (reader.onload) reader.onload({ target: reader } as any);
            }, delay);
          }),
          result: null as string | null,
          onload: null as ((event: any) => void) | null,
          onerror: null as ((event: any) => void) | null,
        };
        return reader;
      });
    }
  }

  /**
   * Mock file read error
   */
  mockFileReadError(error: string = 'File read error'): void {
    if (this.mocks.fileReader) {
      this.mocks.fileReader.mockImplementation(() => {
        const reader = {
          readAsDataURL: jest.fn(() => {
            setTimeout(() => {
              if (reader.onerror) reader.onerror(new Error(error) as any);
            }, 0);
          }),
          result: null as string | null,
          onload: null as ((event: any) => void) | null,
          onerror: null as ((event: any) => void) | null,
        };
        return reader;
      });
    }
  }

  /**
   * Create wrapper with bridge layer providers
   */
  createBridgeWrapper() {
    const queryClient = this.getQueryClient();
    
    return function BridgeTestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <ToastProvider>
          <TestProviders queryClient={queryClient}>
            {children}
          </TestProviders>
        </ToastProvider>
      );
    };
  }

  /**
   * Clean up after tests
   */
  cleanup(): void {
    this.resetState();
    this.resetMocks();
  }
}

/**
 * Render hook with bridge layer providers
 */
function renderBridgeHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: {
    initialProps?: TProps;
    bridgeConfig?: BridgeLayerTestConfig;
    renderOptions?: Omit<RenderHookOptions<TProps>, 'wrapper'>;
  } = {}
): RenderHookResult<TResult, TProps> & { 
  testUtils: BridgeLayerTestUtils;
  waitForWorkflow: (predicate: (result: TResult) => boolean, timeout?: number) => Promise<void>;
} {
  const { initialProps, bridgeConfig = {}, renderOptions = {} } = options;
  
  const testUtils = new BridgeLayerTestUtils(bridgeConfig);
  const wrapper = testUtils.createBridgeWrapper();

  const result = renderHook(hook, {
    initialProps,
    wrapper,
    ...renderOptions,
  });

  /**
   * Wait for workflow state to match predicate
   */
  const waitForWorkflow = async (
    predicate: (result: TResult) => boolean,
    timeout: number = 5000
  ): Promise<void> => {
    await waitFor(() => {
      if (!predicate((result as any).current)) {
        throw new Error('Workflow state not yet matching predicate');
      }
    }, { timeout });
  };

  return {
    ...result,
    testUtils,
    waitForWorkflow,
  };
}

/**
 * Workflow testing utilities
 */
class WorkflowTestUtils {
  /**
   * Create mock files for testing
   */
  static createMockFiles() {
    return {
      userImage: MockUtils.createMockFile('user-image-data', 'user.jpg', 'image/jpeg'),
      apparelImage: MockUtils.createMockFile('apparel-image-data', 'apparel.jpg', 'image/jpeg'),
      invalidFile: MockUtils.createMockFile('invalid-data', 'document.txt', 'text/plain'),
      largeFile: MockUtils.createMockFile('x'.repeat(15 * 1024 * 1024), 'large.jpg', 'image/jpeg'), // 15MB
    };
  }

  /**
   * Create mock image URLs
   */
  static createMockImageUrls() {
    return {
      userImage: MockUtils.createMockImageUrl('user-image-data'),
      apparelImage: MockUtils.createMockImageUrl('apparel-image-data'),
      generatedImage: MockUtils.createMockImageUrl('generated-image-data'),
    };
  }

  /**
   * Create mock workflow state
   */
  static createMockWorkflowState(overrides: any = {}) {
    return {
      isCapturing: false,
      leftCardImage: null,
      rightCardImage: null,
      showPolaroid: false,
      userImageFile: null,
      apparelImageFile: null,
      generatedImage: null,
      hasError: false,
      progress: 0,
      error: null,
      ...overrides,
    };
  }

  /**
   * Simulate complete workflow
   */
  static async simulateCompleteWorkflow(
    testUtils: BridgeLayerTestUtils,
    mockFiles: ReturnType<typeof WorkflowTestUtils.createMockFiles>
  ) {
    // Setup successful responses
    testUtils.mockFileRead('data:image/jpeg;base64,user-image-data');
    testUtils.mockSuccessfulApiCall();

    return {
      userFile: mockFiles.userImage,
      apparelFile: mockFiles.apparelImage,
      expectedResult: 'mock-generated-image-data',
    };
  }
}

/**
 * Performance testing utilities for bridge layer
 */
class BridgePerformanceUtils {
  private performanceMarks: Map<string, number> = new Map();

  /**
   * Start performance measurement
   */
  startMeasurement(label: string): void {
    this.performanceMarks.set(label, performance.now());
  }

  /**
   * End performance measurement
   */
  endMeasurement(label: string): number {
    const startTime = this.performanceMarks.get(label);
    if (!startTime) {
      throw new Error(`No start time found for label: ${label}`);
    }
    
    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);
    return duration;
  }

  /**
   * Measure hook render time
   */
  async measureHookRender<T>(
    hookFn: () => T,
    label: string = 'hook-render'
  ): Promise<{ result: T; duration: number }> {
    this.startMeasurement(label);
    const result = hookFn();
    const duration = this.endMeasurement(label);
    
    return { result, duration };
  }

  /**
   * Assert performance threshold
   */
  assertPerformance(
    duration: number,
    maxDuration: number,
    operation: string
  ): void {
    if (duration > maxDuration) {
      throw new Error(
        `Performance assertion failed: ${operation} took ${duration}ms, expected < ${maxDuration}ms`
      );
    }
  }
}

/**
 * Export utilities
 */
export {
  BridgeLayerTestUtils,
  WorkflowTestUtils,
  BridgePerformanceUtils,
  renderBridgeHook,
};

/**
 * Default export
 */
export default {
  BridgeLayerTestUtils,
  WorkflowTestUtils,
  BridgePerformanceUtils,
  renderBridgeHook,
};