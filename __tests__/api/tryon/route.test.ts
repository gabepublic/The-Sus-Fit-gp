import { POST, OPTIONS } from '../../../src/app/api/tryon/route';

// Mock Next.js server
jest.mock('next/server', () => {
  const mockNextResponse = jest.fn((body, options) => ({
    status: options?.status || 200,
    headers: options?.headers || {}
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

// Mock generateTryOn function
jest.mock('../../../src/lib/openaiClient', () => ({
  generateTryOn: jest.fn()
}));

describe('/api/tryon POST route', () => {
  const { generateTryOn } = require('../../../src/lib/openaiClient');

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn().mockReturnValue('http://localhost:3000')
      }
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('valid requests', () => {
    it('should return 200 with generated image for valid payload', async () => {
      const mockGeneratedImage = 'data:image/jpeg;base64,generatedImageData==';
      (generateTryOn as jest.Mock).mockResolvedValue(mockGeneratedImage);

      const validPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      const request = createMockRequest(validPayload);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        img_generated: mockGeneratedImage
      });
      expect(generateTryOn).toHaveBeenCalledWith({
        modelImage: validPayload.modelImage,
        apparelImages: validPayload.apparelImages
      });
    });

    it('should return 200 for payload with multiple apparel images', async () => {
      const mockGeneratedImage = 'data:image/jpeg;base64,generatedImageData==';
      (generateTryOn as jest.Mock).mockResolvedValue(mockGeneratedImage);

      const validPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: [
          'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        ]
      };

      const request = createMockRequest(validPayload);
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        img_generated: mockGeneratedImage
      });
      expect(generateTryOn).toHaveBeenCalledWith({
        modelImage: validPayload.modelImage,
        apparelImages: validPayload.apparelImages
      });
    });
  });

  describe('invalid requests', () => {
    it('should return 400 for missing modelImage', async () => {
      const invalidPayload = {
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      const request = createMockRequest(invalidPayload);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });
      expect(responseData.details).toHaveLength(1);
      expect(responseData.details[0].field).toBe('modelImage');
    });

    it('should return 400 for empty modelImage', async () => {
      const invalidPayload = {
        modelImage: '',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      const request = createMockRequest(invalidPayload);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });
      expect(responseData.details).toHaveLength(1);
      expect(responseData.details[0].field).toBe('modelImage');
    });

    it('should return 400 for missing apparelImages', async () => {
      const invalidPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      const request = createMockRequest(invalidPayload);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });
      expect(responseData.details).toHaveLength(1);
      expect(responseData.details[0].field).toBe('apparelImages');
    });

    it('should return 400 for empty apparelImages array', async () => {
      const invalidPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: []
      };

      const request = createMockRequest(invalidPayload);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Validation failed'
      });
      expect(responseData.details).toHaveLength(1);
      expect(responseData.details[0].field).toBe('apparelImages');
    });

    it('should return 500 when generateTryOn throws an error', async () => {
      const validPayload = {
        modelImage: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        apparelImages: ['data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==']
      };

      (generateTryOn as jest.Mock).mockRejectedValue(new Error('OpenAI API error'));

      const request = createMockRequest(validPayload);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        error: 'Internal Server Error'
      });
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
  });

  describe('OPTIONS requests', () => {
    it('should return 200 for OPTIONS preflight request', async () => {
      const request = createMockRequest({});
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });
  });
}); 