/**
 * @fileoverview Mock Data Management for Try It On Development Workflow
 * @module @/mobile/components/TryItOn/utils/mockData
 * @version 1.0.0
 *
 * This module provides mock data configuration and management system for the Try It On
 * workflow during development. It enables testing of different scenarios without
 * making actual API calls, saving costs and enabling faster development iteration.
 *
 * @example
 * ```typescript
 * import { generateMockTryItOnResult, configureMockScenario } from './mockData';
 *
 * // Configure mock behavior
 * configureMockScenario('success');
 *
 * // Generate mock result
 * const result = await generateMockTryItOnResult();
 * ```
 */

import type { TryItOnMockData, TryItOnError, TryItOnResult } from '../types';

// =============================================================================
// MOCK CONFIGURATION
// =============================================================================

/**
 * Mock scenario types for testing different workflows
 */
export type MockScenario =
  | 'success'           // Successful generation
  | 'error'             // API error simulation
  | 'timeout'           // Request timeout simulation
  | 'slow'              // Slow response simulation
  | 'intermittent';     // Random success/failure

/**
 * Mock configuration interface
 */
export interface MockConfig {
  /** Current mock scenario */
  scenario: MockScenario;
  /** Processing delay in milliseconds */
  processingDelay: number;
  /** Success rate for intermittent scenario (0-1) */
  successRate: number;
  /** Available mock image URLs */
  imageUrls: string[];
  /** Mock error messages by scenario */
  errorMessages: Record<string, string>;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default mock configuration
 */
export const DEFAULT_MOCK_CONFIG: MockConfig = {
  scenario: 'success',
  processingDelay: 2000,
  successRate: 0.8,
  imageUrls: [
    'https://picsum.photos/400/600?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/400/600?random=3',
    'https://picsum.photos/400/600?random=4',
    'https://picsum.photos/400/600?random=5'
  ],
  errorMessages: {
    timeout: 'Request timed out. Please try again.',
    error: 'Failed to generate try-on image. Please check your images and try again.',
    intermittent: 'Service temporarily unavailable. Please try again.',
    slow: 'Processing is taking longer than expected...'
  },
  debug: process.env.NODE_ENV === 'development'
};

/**
 * Current mock configuration (mutable for runtime changes)
 */
let currentMockConfig: MockConfig = { ...DEFAULT_MOCK_CONFIG };

// =============================================================================
// CONFIGURATION MANAGEMENT
// =============================================================================

/**
 * Configure mock scenario and behavior
 * @param scenario - Mock scenario to use
 * @param options - Additional configuration options
 */
export function configureMockScenario(
  scenario: MockScenario,
  options: Partial<Omit<MockConfig, 'scenario'>> = {}
): void {
  currentMockConfig = {
    ...currentMockConfig,
    scenario,
    ...options
  };

  if (currentMockConfig.debug) {
    console.log('[mockData] Configured scenario:', scenario, options);
  }
}

/**
 * Get current mock configuration
 * @returns Current mock configuration
 */
export function getMockConfig(): MockConfig {
  return { ...currentMockConfig };
}

/**
 * Reset mock configuration to defaults
 */
export function resetMockConfig(): void {
  currentMockConfig = { ...DEFAULT_MOCK_CONFIG };

  if (currentMockConfig.debug) {
    console.log('[mockData] Reset to default configuration');
  }
}

/**
 * Update mock configuration partially
 * @param updates - Partial configuration updates
 */
export function updateMockConfig(updates: Partial<MockConfig>): void {
  currentMockConfig = { ...currentMockConfig, ...updates };

  if (currentMockConfig.debug) {
    console.log('[mockData] Updated configuration:', updates);
  }
}

// =============================================================================
// MOCK DATA GENERATION
// =============================================================================

/**
 * Generate mock Try It On data based on current configuration
 * @returns Promise resolving to mock data
 */
export async function generateMockTryItOnData(): Promise<TryItOnMockData> {
  const config = getMockConfig();

  if (config.debug) {
    console.log('[mockData] Generating mock data with scenario:', config.scenario);
  }

  // Simulate processing delay
  await simulateDelay(config.processingDelay);

  // Determine success based on scenario
  const isSuccess = determineSuccess(config.scenario, config.successRate);

  // Select random image URL
  const randomIndex = Math.floor(Math.random() * config.imageUrls.length);
  const generatedImageUrl = config.imageUrls[randomIndex];

  const mockData: TryItOnMockData = {
    generatedImageUrl: isSuccess ? generatedImageUrl : '',
    processingTime: config.processingDelay,
    success: isSuccess,
    errorMessage: isSuccess ? undefined : config.errorMessages[config.scenario] || config.errorMessages.error
  };

  if (config.debug) {
    console.log('[mockData] Generated mock data:', mockData);
  }

  return mockData;
}

/**
 * Generate mock Try It On result with error handling
 * @returns Promise resolving to TryItOnResult
 */
export async function generateMockTryItOnResult(): Promise<TryItOnResult> {
  try {
    const mockData = await generateMockTryItOnData();
    const startTime = Date.now();

    if (mockData.success && mockData.generatedImageUrl) {
      return {
        success: true,
        imageUrl: mockData.generatedImageUrl,
        duration: Date.now() - startTime
      };
    } else {
      const error: TryItOnError = {
        type: 'mock',
        message: mockData.errorMessage || 'Mock generation failed',
        retryable: true
      };

      return {
        success: false,
        error,
        duration: Date.now() - startTime
      };
    }
  } catch (error) {
    const tryItOnError: TryItOnError = {
      type: 'mock',
      message: error instanceof Error ? error.message : 'Unknown mock error',
      retryable: true,
      originalError: error instanceof Error ? error : undefined
    };

    return {
      success: false,
      error: tryItOnError,
      duration: 0
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Simulate processing delay with Promise
 * @param delay - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function simulateDelay(delay: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Determine success based on scenario and success rate
 * @param scenario - Current mock scenario
 * @param successRate - Success rate for intermittent scenario
 * @returns Whether operation should succeed
 */
function determineSuccess(scenario: MockScenario, successRate: number): boolean {
  switch (scenario) {
    case 'success':
    case 'slow':
      return true;
    case 'error':
    case 'timeout':
      return false;
    case 'intermittent':
      return Math.random() < successRate;
    default:
      return true;
  }
}

/**
 * Generate random processing progress updates
 * @param onProgress - Progress callback function
 * @param totalDuration - Total duration in milliseconds
 * @returns Promise that resolves when progress is complete
 */
export async function simulateProgressUpdates(
  onProgress: (progress: number) => void,
  totalDuration: number = 2000
): Promise<void> {
  const steps = [10, 25, 40, 60, 80, 95, 100];
  const stepDuration = totalDuration / steps.length;

  for (const progress of steps) {
    await simulateDelay(stepDuration);
    onProgress(progress);

    if (currentMockConfig.debug) {
      console.log(`[mockData] Progress: ${progress}%`);
    }
  }
}

/**
 * Create mock workflow state for testing
 * @param overrides - Optional state overrides
 * @returns Mock workflow state
 */
export function createMockWorkflowState(overrides: Partial<any> = {}): any {
  return {
    workflowState: 'idle',
    isCapturing: false,
    showPolaroid: false,
    generatedImage: null,
    hasError: false,
    userImageFile: null,
    apparelImageFile: null,
    leftCardImage: null,
    rightCardImage: null,
    progress: 0,
    error: null,
    retryCount: 0,
    lastOperationTime: null,
    ...overrides
  };
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Preset configurations for common testing scenarios
 */
export const MOCK_PRESETS = {
  /** Fast development testing */
  fast: {
    scenario: 'success' as MockScenario,
    processingDelay: 500,
    debug: true
  },

  /** Realistic production simulation */
  realistic: {
    scenario: 'intermittent' as MockScenario,
    processingDelay: 3000,
    successRate: 0.9,
    debug: false
  },

  /** Error testing */
  errorTesting: {
    scenario: 'error' as MockScenario,
    processingDelay: 1000,
    debug: true
  },

  /** Timeout testing */
  timeoutTesting: {
    scenario: 'timeout' as MockScenario,
    processingDelay: 5000,
    debug: true
  },

  /** Slow network simulation */
  slowNetwork: {
    scenario: 'slow' as MockScenario,
    processingDelay: 8000,
    debug: true
  }
} as const;

/**
 * Apply a preset configuration
 * @param presetName - Name of the preset to apply
 */
export function applyMockPreset(presetName: keyof typeof MOCK_PRESETS): void {
  const preset = MOCK_PRESETS[presetName];
  updateMockConfig(preset);

  if (currentMockConfig.debug) {
    console.log('[mockData] Applied preset:', presetName, preset);
  }
}

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Enable mock mode flag for development
 * @returns Whether mock mode should be enabled
 */
export function shouldUseMockData(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    Boolean(currentMockConfig)
  );
}

/**
 * Get mock mode status for debugging
 * @returns Mock mode information
 */
export function getMockModeInfo(): {
  enabled: boolean;
  scenario: MockScenario;
  config: MockConfig;
} {
  return {
    enabled: shouldUseMockData(),
    scenario: currentMockConfig.scenario,
    config: getMockConfig()
  };
}

/**
 * Log mock mode status to console (development only)
 */
export function logMockModeStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const info = getMockModeInfo();
    console.group('[mockData] Mock Mode Status');
    console.log('Enabled:', info.enabled);
    console.log('Scenario:', info.scenario);
    console.log('Config:', info.config);
    console.groupEnd();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default export with commonly used functions
 */
export default {
  generate: generateMockTryItOnResult,
  configure: configureMockScenario,
  preset: applyMockPreset,
  shouldUse: shouldUseMockData,
  simulate: {
    delay: simulateDelay,
    progress: simulateProgressUpdates
  }
};