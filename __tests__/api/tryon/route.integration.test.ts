import { POST, OPTIONS } from '../../../src/app/api/tryon/route';

// Mock generateTryOn function
jest.mock('../../../src/lib/openaiClient', () => ({
  generateTryOn: jest.fn()
}));

// Mock Next.js server components
jest.mock('next/server', () => {
  const mockNextResponse = jest.fn((body, options) => ({
    status: options?.status || 200,
    headers: options?.headers || {},
    json: jest.fn().mockResolvedValue(body)
  }));
  
  (mockNextResponse as any).json = jest.fn((data, options) => ({
    status: options?.status || 200,
    json: jest.fn().mockResolvedValue(data),
    headers: options?.headers || {}
  }));
  
  return {
    NextRequest: jest.fn(),
    NextResponse: mockNextResponse
  };
});

describe('/api/tryon Integration Tests', () => {
  const { generateTryOn } = require('../../../src/lib/openaiClient');

  // Valid base64 test data (1x1 pixel PNG)
  const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const createMockRequest = (body: any, origin?: string | null) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn().mockReturnValue(origin)
      }
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete (process.env as any).NEXT_PUBLIC_BASE_URL;
    delete (process.env as any).NODE_ENV;
  });

  describe('POST /api/tryon - Success Cases', () => {
    it('should return 200 with generated image for valid payload', async () => {
      const mockGeneratedImage = 'img123';
      (generateTryOn as jest.Mock).mockResolvedValue(mockGeneratedImage);

      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({
        img_generated: mockGeneratedImage
      });

      expect(generateTryOn).toHaveBeenCalledTimes(1);
      expect(generateTryOn).toHaveBeenCalledWith({
        modelImage: validPayload.modelImage,
        apparelImages: validPayload.apparelImages
      });

      // Verify CORS headers are present
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });

    it('should handle multiple apparel images correctly', async () => {
      const mockGeneratedImage = 'img456';
      (generateTryOn as jest.Mock).mockResolvedValue(mockGeneratedImage);

      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image, validBase64Image]
      };

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toEqual({
        img_generated: mockGeneratedImage
      });

      expect(generateTryOn).toHaveBeenCalledWith({
        modelImage: validPayload.modelImage,
        apparelImages: validPayload.apparelImages
      });
    });
  });

  describe('POST /api/tryon - Validation Error Cases', () => {
    it('should return 400 for missing apparelImages with Zod error', async () => {
      const invalidPayload = {
        modelImage: 'invalid-base64-data'
        // Missing apparelImages
      };

      const request = createMockRequest(invalidPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });

      // Test Zod error message snapshot
      expect(responseData.details).toMatchSnapshot();
      expect(responseData.details).toHaveLength(2);
      expect(responseData.details[0].field).toBe('modelImage');
    });

    it('should return 400 for empty apparelImages array', async () => {
      const invalidPayload = {
        modelImage: 'invalid-base64-data',
        apparelImages: []
      };

      const request = createMockRequest(invalidPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });

      expect(responseData.details).toMatchSnapshot();
      expect(responseData.details).toHaveLength(2);
      expect(responseData.details[0].field).toBe('modelImage');
    });

    it('should return 400 for missing modelImage', async () => {
      const invalidPayload = {
        apparelImages: ['invalid-base64-data']
        // Missing modelImage
      };

      const request = createMockRequest(invalidPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });

      expect(responseData.details).toMatchSnapshot();
      expect(responseData.details).toHaveLength(2);
      expect(responseData.details[0].field).toBe('modelImage');
    });

    it('should return 400 for invalid base64 data', async () => {
      const invalidPayload = {
        modelImage: 'invalid-base64-data',
        apparelImages: ['invalid-base64-data']
      };

      const request = createMockRequest(invalidPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });

      expect(responseData.details).toMatchSnapshot();
    });
  });

  describe('POST /api/tryon - Internal Error Cases', () => {
    it('should return 500 when generateTryOn throws an error', async () => {
      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      (generateTryOn as jest.Mock).mockRejectedValue(new Error('OpenAI API error'));

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Internal Server Error'
      });

      expect(generateTryOn).toHaveBeenCalledTimes(1);
    });

    it('should return 500 for malformed JSON', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: {
          get: jest.fn().mockReturnValue('http://localhost:3000')
        }
      } as any;

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Internal Server Error'
      });
    });

    it('should return detailed error message in development environment', async () => {
      (process.env as any).NODE_ENV = 'development';
      
      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      const errorMessage = 'Development error message';
      (generateTryOn as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: errorMessage
      });
    });

    it('should return generic error message in production environment', async () => {
      (process.env as any).NODE_ENV = 'production';
      
      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      (generateTryOn as jest.Mock).mockRejectedValue(new Error('Production error message'));

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Internal Server Error'
      });
    });
  });

  describe('OPTIONS /api/tryon - CORS Preflight', () => {
    it('should return 200 for OPTIONS preflight request', async () => {
      const request = createMockRequest({}, 'http://localhost:3000');
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });

    it('should use NEXT_PUBLIC_BASE_URL when origin header is null', async () => {
      (process.env as any).NEXT_PUBLIC_BASE_URL = 'https://example.com';
      
      const request = createMockRequest({}, null);
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });

    it('should use empty string when both origin header and NEXT_PUBLIC_BASE_URL are null/undefined', async () => {
      const request = createMockRequest({}, null);
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });
  });

  describe('CORS Headers in POST Responses', () => {
    it('should include CORS headers in successful POST response', async () => {
      const mockGeneratedImage = 'img123';
      (generateTryOn as jest.Mock).mockResolvedValue(mockGeneratedImage);

      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });

    it('should include CORS headers in error responses', async () => {
      const invalidPayload = {
        modelImage: validBase64Image
        // Missing apparelImages
      };

      const request = createMockRequest(invalidPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });

    it('should include CORS headers in internal error responses', async () => {
      const validPayload = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      (generateTryOn as jest.Mock).mockRejectedValue(new Error('Test error'));

      const request = createMockRequest(validPayload, 'http://localhost:3000');
      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });
  });
});
