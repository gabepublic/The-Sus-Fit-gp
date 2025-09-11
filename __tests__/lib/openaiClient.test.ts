/**
 * Unit tests for OpenAI Client Wrapper
 * 
 * Tests the generateTryOn function with mocked OpenAI SDK to ensure:
 * - Happy path scenarios work correctly
 * - Error scenarios are properly handled
 * - Correct parameters are passed to the SDK
 * - Full branch and line coverage is achieved
 */

import { ZodError } from 'zod';

// Mock getEnv first
jest.mock('../../src/lib/getEnv', () => ({
  getEnv: jest.fn(() => ({
    provider: 'OPENAI',
    openai: {
      key: 'test-api-key',
      model: 'dall-e-2'
    },
    google: {
      key: 'test-google-key',
      model: 'gemini-1.5-pro'
    },
    dailyLimit: 100
  }))
}));

// Mock OpenAI SDK
jest.mock('openai', () => {
  const mockImagesEdit = jest.fn();
  return jest.fn().mockImplementation(() => ({
    images: {
      edit: mockImagesEdit
    }
  }));
});

// Import after mocks are set up
import { generateTryOn } from '../../src/lib/openaiClient';

describe('openaiClient', () => {
  const validBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const validDataUrlImage = `data:image/png;base64,${validBase64Image}`;
  
  // Get the mock function from the mocked module
  const getMockImagesEdit = () => {
    const OpenAI = require('openai');
    const mockInstance = new OpenAI();
    return mockInstance.images.edit;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTryOn', () => {
    describe('Happy Path Scenarios', () => {
      it('should resolve base64 URL when SDK returns b64_json data', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act
        const result = await generateTryOn(params);

        // Assert
        expect(result).toBe('ZmFrZUJhc2U2NA==');
        expect(mockImagesEdit).toHaveBeenCalledTimes(1);
      });

      it('should handle data URL format for model image', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validDataUrlImage,
          apparelImages: [validBase64Image]
        };

        // Act
        const result = await generateTryOn(params);

        // Assert
        expect(result).toBe('ZmFrZUJhc2U2NA==');
        expect(mockImagesEdit).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'dall-e-2',
            image: expect.arrayContaining([
              expect.any(File),
              expect.any(File)
            ]),
            prompt: expect.stringContaining('Use the **base image (first image)** as the person and scene reference'),
            input_fidelity: 'high',
            size: '1024x1536',
            quality: 'high'
          })
        );
      });

      it('should handle data URL format for apparel images', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validDataUrlImage]
        };

        // Act
        const result = await generateTryOn(params);

        // Assert
        expect(result).toBe('ZmFrZUJhc2U2NA==');
        expect(mockImagesEdit).toHaveBeenCalledWith(
          expect.objectContaining({
            image: expect.arrayContaining([
              expect.any(File),
              expect.any(File)
            ])
          })
        );
      });

      it('should use only the first apparel image when multiple are provided', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image, validBase64Image, validBase64Image]
        };

        // Act
        const result = await generateTryOn(params);

        // Assert
        expect(result).toBe('ZmFrZUJhc2U2NA==');
        expect(mockImagesEdit).toHaveBeenCalledWith(
          expect.objectContaining({
            image: expect.arrayContaining([
              expect.any(File), // model.png
              expect.any(File)  // apparel.png (only first one)
            ])
          })
        );
        
        // Verify only 2 files are passed (model + first apparel)
        const callArgs = mockImagesEdit.mock.calls[0][0];
        expect(callArgs.image).toHaveLength(2);
        expect(callArgs.image[0].name).toBe('model.png');
        expect(callArgs.image[1].name).toBe('apparel.png');
      });

      it('should pass correct parameters to OpenAI SDK', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act
        await generateTryOn(params);

        // Assert
        expect(mockImagesEdit).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'dall-e-2',
            image: expect.arrayContaining([
              expect.any(File),
              expect.any(File)
            ]),
            prompt: expect.stringContaining('Use the **base image (first image)** as the person and scene reference'),
            input_fidelity: 'high',
            size: '1024x1536',
            quality: 'high'
          })
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should propagate SDK rejection with custom error context', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const sdkError = new Error('OpenAI API error');
        mockImagesEdit.mockRejectedValueOnce(sdkError);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: OpenAI API error');
        
        // Verify the original error is preserved as cause
        try {
          await generateTryOn(params);
        } catch (error) {
          expect((error as Error & { cause?: unknown }).cause).toBe(sdkError);
        }
      });

      it('should handle SDK returning empty data array', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = { data: [] };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No response data received from OpenAI API');
      });

      it('should handle SDK returning data without b64_json', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = { data: [{ url: 'https://example.com/image.png' }] };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No image data received from OpenAI API');
      });

      it('should handle SDK returning null/undefined data', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = { data: null };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No response data received from OpenAI API');
      });

      it('should handle SDK returning data with null b64_json', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = { data: [{ b64_json: null }] };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No image data received from OpenAI API');
      });

      it('should handle non-Error objects thrown by SDK', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const nonError = 'String error';
        mockImagesEdit.mockRejectedValueOnce(nonError);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: Unknown error occurred');
      });
    });

    describe('Input Validation', () => {
      it('should reject invalid model image format', async () => {
        // Arrange
        const params = {
          modelImage: 'invalid-base64!@#',
          apparelImages: [validBase64Image]
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow();
      });

      it('should reject empty apparel images array', async () => {
        // Arrange
        const params = {
          modelImage: validBase64Image,
          apparelImages: []
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow();
      });

      it('should reject invalid apparel image format', async () => {
        // Arrange
        const params = {
          modelImage: validBase64Image,
          apparelImages: ['invalid-base64!@#']
        };

        // Act & Assert
        await expect(generateTryOn(params)).rejects.toThrow();
      });
    });

    describe('File Object Creation', () => {
      it('should create File objects with correct names and types', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validBase64Image,
          apparelImages: [validBase64Image]
        };

        // Act
        await generateTryOn(params);

        // Assert
        const callArgs = mockImagesEdit.mock.calls[0][0];
        const [modelFile, apparelFile] = callArgs.image;
        
        expect(modelFile).toBeInstanceOf(File);
        expect(apparelFile).toBeInstanceOf(File);
        expect(modelFile.name).toBe('model.png');
        expect(apparelFile.name).toBe('apparel.png');
        expect(modelFile.type).toBe('image/png');
        expect(apparelFile.type).toBe('image/png');
      });

      it('should handle base64 strings with and without data URL prefix', async () => {
        // Arrange
        const mockImagesEdit = getMockImagesEdit();
        const mockResponse = {
          data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
        };
        mockImagesEdit.mockResolvedValue(mockResponse);
        
        const params = {
          modelImage: validDataUrlImage, // with data URL prefix
          apparelImages: [validBase64Image] // without data URL prefix
        };

        // Act
        await generateTryOn(params);

        // Assert - should work with both formats
        expect(mockImagesEdit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
