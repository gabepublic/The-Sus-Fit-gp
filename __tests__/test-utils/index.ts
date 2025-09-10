/**
 * Test Utilities Index
 * Central export point for all testing utilities
 */

// React Query testing utilities
export {
  createTestQueryClient,
  renderWithProviders,
  TestProviders,
  HookTestUtils,
  MutationTestUtils,
  MockUtils,
  TimeTestUtils,
  type QueryTestConfig,
  type TestProvidersProps,
  type CustomRenderOptions,
} from './react-query-test-utils';

// Bridge layer testing utilities
export {
  BridgeLayerTestUtils,
  WorkflowTestUtils,
  BridgePerformanceUtils,
  renderBridgeHook,
  type BridgeLayerTestConfig,
} from './bridge-layer-test-utils';

// API mocking utilities
export {
  server,
  handlers,
  errorHandlers,
  performanceHandlers,
  MockAPIUtils,
  openAIMocks,
  DEFAULT_MOCK_RESPONSES,
  API_ENDPOINTS,
  type MockTryonResponse,
  type MockErrorResponse,
} from './api-mocks';

// Upload testing utilities
export {
  createMockFile,
  createMockImageFile,
  createFileUploadEvent,
  renderWithProviders as renderWithUploadProviders,
  runA11yTests,
} from './upload-test-utils';

/**
 * Convenience re-exports with shorter names
 */
export {
  renderWithProviders as render,
  createTestQueryClient as createQueryClient,
  TestProviders as Providers,
} from './react-query-test-utils';

export {
  renderBridgeHook as renderHook,
  BridgeLayerTestUtils as TestUtils,
} from './bridge-layer-test-utils';

export {
  MockAPIUtils as MockAPI,
  server as mockServer,
} from './api-mocks';

/**
 * Complete test setup function
 */
export function setupTestEnvironment(options: {
  enableApiMocks?: boolean;
  enableQueryCache?: boolean;
  enableConsoleSuppress?: boolean;
} = {}) {
  const {
    enableApiMocks = true,
    enableQueryCache = false,
    enableConsoleSuppress = true,
  } = options;

  // Setup API mocks
  if (enableApiMocks) {
    try {
      const { MockAPIUtils } = require('./api-mocks');
      MockAPIUtils.setupServer();
    } catch (e) {
      // MockAPIUtils not available
    }
  }

  // Suppress console logs in tests
  if (enableConsoleSuppress) {
    const originalConsole = { ...console };
    
    beforeEach(() => {
      console.log = jest.fn();
      console.info = jest.fn();
      console.warn = jest.fn();
      // Keep console.error for debugging
    });
    
    afterEach(() => {
      Object.assign(console, originalConsole);
    });
  }

  // Global test cleanup
  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset API mocks
    if (enableApiMocks) {
      try {
        const { MockAPIUtils } = require('./api-mocks');
        MockAPIUtils.reset();
      } catch (e) {
        // MockAPIUtils not available
      }
    }
  });
}

/**
 * Export a default configuration for common testing scenarios
 */
export const testConfigs = {
  // Basic unit test configuration
  unit: {
    queryTestConfig: {
      disableRetries: true,
      disableCache: true,
    },
    bridgeConfig: {
      mockToast: true,
      mockFileAPIs: true,
      mockFetch: false, // Use real fetch with MSW
    },
  },

  // Integration test configuration
  integration: {
    queryTestConfig: {
      disableRetries: false,
      disableCache: false,
    },
    bridgeConfig: {
      mockToast: true,
      mockFileAPIs: true,
      mockFetch: false, // Use MSW for API calls
    },
  },

  // Performance test configuration
  performance: {
    queryTestConfig: {
      disableRetries: true,
      disableCache: false, // Enable cache for realistic performance
    },
    bridgeConfig: {
      mockToast: false, // Don't mock for realistic performance
      mockFileAPIs: false,
      mockFetch: false,
    },
  },

  // End-to-end test configuration
  e2e: {
    queryTestConfig: {
      disableRetries: false,
      disableCache: false,
    },
    bridgeConfig: {
      mockToast: false,
      mockFileAPIs: false,
      mockFetch: false,
    },
  },
} as const;

/**
 * Quick setup functions for common scenarios
 */
export const quickSetup = {
  /**
   * Setup for testing business layer hooks
   */
  businessLayer: () => {
    setupTestEnvironment({ enableApiMocks: true });
    const { HookTestUtils } = require('./react-query-test-utils');
    return new HookTestUtils(testConfigs.unit.queryTestConfig);
  },

  /**
   * Setup for testing bridge layer hooks
   */
  bridgeLayer: () => {
    setupTestEnvironment({ enableApiMocks: true });
    const { BridgeLayerTestUtils } = require('./bridge-layer-test-utils');
    return new BridgeLayerTestUtils(testConfigs.integration.bridgeConfig);
  },

  /**
   * Setup for testing mutations
   */
  mutations: () => {
    setupTestEnvironment({ enableApiMocks: true });
    const { MutationTestUtils } = require('./react-query-test-utils');
    return new MutationTestUtils(testConfigs.unit.queryTestConfig);
  },

  /**
   * Setup for performance testing
   */
  performance: () => {
    setupTestEnvironment({ enableApiMocks: true, enableConsoleSuppress: false });
    const { BridgePerformanceUtils } = require('./bridge-layer-test-utils');
    return new BridgePerformanceUtils();
  },
};

// Note: Default export removed to avoid circular reference issues
// Use named exports instead: import { createTestQueryClient, renderBridgeHook, etc. }