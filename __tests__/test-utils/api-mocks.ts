/**
 * API Mocks using MSW (Mock Service Worker)
 * Comprehensive mocking strategies for external API calls
 */

import { http, HttpResponse, delay, HttpHandler } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Mock response types
 */
export interface MockTryonResponse {
  img_generated: string;
  metadata?: {
    processingTime: number;
    modelVersion: string;
    timestamp: string;
  };
}

export interface MockErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Default mock responses
 */
export const DEFAULT_MOCK_RESPONSES = {
  success: {
    img_generated: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAMockGeneratedImageData==',
    metadata: {
      processingTime: 2500,
      modelVersion: 'v1.2.0',
      timestamp: new Date().toISOString(),
    },
  } as MockTryonResponse,
  
  error: {
    error: 'Internal Server Error',
    details: 'Failed to process try-on request',
    code: 'PROCESSING_ERROR',
  } as MockErrorResponse,
  
  validation: {
    error: 'Validation Error',
    details: 'Invalid image format or size',
    code: 'VALIDATION_ERROR',
  } as MockErrorResponse,
  
  timeout: {
    error: 'Request Timeout',
    details: 'Processing took too long',
    code: 'TIMEOUT_ERROR',
  } as MockErrorResponse,
  
  rateLimit: {
    error: 'Too Many Requests',
    details: 'Rate limit exceeded',
    code: 'RATE_LIMIT_ERROR',
  } as MockErrorResponse,
};

/**
 * API endpoint configurations
 */
export const API_ENDPOINTS = {
  tryon: '/api/tryon',
  health: '/api/health',
  upload: '/api/upload',
} as const;

/**
 * MSW request handlers
 */
const handlers: HttpHandler[] = [
  // Try-on API endpoint - success case
  http.post(API_ENDPOINTS.tryon, async ({ request }) => {
    const body = await request.json() as any;
    
    // Validate request structure
    if (!body.modelImage || !body.apparelImages || !Array.isArray(body.apparelImages)) {
      return HttpResponse.json(DEFAULT_MOCK_RESPONSES.validation, { status: 400 });
    }
    
    // Simulate processing delay
    await delay(100);
    
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.success);
  }),

  // Health check endpoint
  http.get(API_ENDPOINTS.health, () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // File upload endpoint
  http.post(API_ENDPOINTS.upload, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    return HttpResponse.json({
      url: `mock-url://uploaded-${file.name}`,
      size: file.size,
      type: file.type,
    });
  }),
];

/**
 * Error scenario handlers
 */
const errorHandlers: Record<string, HttpHandler> = {
  // Server error (500)
  serverError: http.post(API_ENDPOINTS.tryon, () => {
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.error, { status: 500 });
  }),

  // Validation error (400)
  validationError: http.post(API_ENDPOINTS.tryon, () => {
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.validation, { status: 400 });
  }),

  // Timeout simulation
  timeout: http.post(API_ENDPOINTS.tryon, async () => {
    await delay(30000); // Simulate very slow response
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.timeout, { status: 408 });
  }),

  // Rate limiting (429)
  rateLimit: http.post(API_ENDPOINTS.tryon, () => {
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.rateLimit, { status: 429 });
  }),

  // Network error
  networkError: http.post(API_ENDPOINTS.tryon, () => {
    return HttpResponse.error();
  }),

  // Invalid JSON response
  invalidJson: http.post(API_ENDPOINTS.tryon, () => {
    return new HttpResponse('invalid json response', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // Missing required fields in response
  incompleteResponse: http.post(API_ENDPOINTS.tryon, () => {
    return HttpResponse.json({ metadata: { processingTime: 1000 } }, { status: 200 });
  }),
};

/**
 * Performance scenario handlers
 */
const performanceHandlers: Record<string, HttpHandler> = {
  // Fast response (< 100ms)
  fast: http.post(API_ENDPOINTS.tryon, async () => {
    await delay(50);
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.success);
  }),

  // Slow response (> 5s)
  slow: http.post(API_ENDPOINTS.tryon, async () => {
    await delay(5000);
    return HttpResponse.json(DEFAULT_MOCK_RESPONSES.success);
  }),

  // Variable response times
  variable: http.post(API_ENDPOINTS.tryon, async () => {
    const delays = [100, 500, 1000, 2000, 3000];
    const randomDelay = delays[Math.floor(Math.random() * delays.length)];
    await delay(randomDelay);
    return HttpResponse.json({
      ...DEFAULT_MOCK_RESPONSES.success,
      metadata: {
        ...DEFAULT_MOCK_RESPONSES.success.metadata!,
        processingTime: randomDelay,
      },
    });
  }),
};

/**
 * Test server setup
 */
const server = setupServer(...handlers);

/**
 * Mock API utilities
 */
class MockAPIUtils {
  /**
   * Setup MSW server for tests
   */
  static setupServer() {
    // Enable API mocking before all tests
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    
    // Reset handlers after each test
    afterEach(() => server.resetHandlers());
    
    // Clean up after all tests
    afterAll(() => server.close());
  }

  /**
   * Use specific error scenario
   */
  static useErrorScenario(scenario: keyof typeof errorHandlers) {
    server.use(errorHandlers[scenario]);
  }

  /**
   * Use specific performance scenario
   */
  static usePerformanceScenario(scenario: keyof typeof performanceHandlers) {
    server.use(performanceHandlers[scenario]);
  }

  /**
   * Use custom handler
   */
  static useCustomHandler(handler: Parameters<typeof server.use>[0]) {
    server.use(handler);
  }

  /**
   * Create custom try-on response
   */
  static createCustomTryonHandler(
    response: Partial<MockTryonResponse>,
    options: {
      status?: number;
      delay?: number;
      shouldFail?: boolean;
    } = {}
  ): HttpHandler {
    const { status = 200, delay: delayMs = 0, shouldFail = false } = options;
    
    return http.post(API_ENDPOINTS.tryon, async () => {
      if (delayMs > 0) {
        await delay(delayMs);
      }
      
      if (shouldFail) {
        return HttpResponse.json(DEFAULT_MOCK_RESPONSES.error, { status: 500 });
      }
      
      const fullResponse = {
        ...DEFAULT_MOCK_RESPONSES.success,
        ...response,
      };
      
      return HttpResponse.json(fullResponse, { status });
    });
  }

  /**
   * Verify API calls
   */
  static getApiCalls(): Array<{
    method: string;
    url: string;
    body?: any;
    timestamp: number;
  }> {
    // Note: This would require implementing call tracking in the handlers
    // For now, return empty array - could be enhanced with call tracking
    return [];
  }

  /**
   * Reset all mocks and call history
   */
  static reset() {
    server.resetHandlers();
  }

  /**
   * Create mock file upload handler
   */
  static createFileUploadHandler(
    response: any = { url: 'mock-upload-url' },
    options: { status?: number; delay?: number } = {}
  ): HttpHandler {
    const { status = 200, delay: delayMs = 0 } = options;
    
    return http.post(API_ENDPOINTS.upload, async ({ request }) => {
      if (delayMs > 0) {
        await delay(delayMs);
      }
      
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      return HttpResponse.json({
        ...response,
        originalName: file?.name,
        size: file?.size,
        type: file?.type,
      }, { status });
    });
  }
}

/**
 * OpenAI API mocks (if needed for testing external integrations)
 */
const openAIMocks: Record<string, HttpHandler> = {
  // Mock OpenAI API responses
  completion: http.post('https://api.openai.com/v1/completions', () => {
    return HttpResponse.json({
      id: 'cmpl-mock',
      object: 'text_completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo',
      choices: [{
        text: 'Mock completion response',
        index: 0,
        logprobs: null,
        finish_reason: 'stop',
      }],
    });
  }),

  // Mock image generation
  imageGeneration: http.post('https://api.openai.com/v1/images/generations', () => {
    return HttpResponse.json({
      created: Date.now(),
      data: [{
        url: 'https://mock-image-url.com/generated-image.png',
      }],
    });
  }),
};

/**
 * Export everything
 */
export {
  server,
  handlers,
  errorHandlers,
  performanceHandlers,
  MockAPIUtils,
  openAIMocks,
};

/**
 * Default export
 */
const apiMocks = {
  server,
  handlers,
  errorHandlers,
  performanceHandlers,
  MockAPIUtils,
  openAIMocks,
  DEFAULT_MOCK_RESPONSES,
  API_ENDPOINTS,
};

export default apiMocks;