/**
 * Unit tests for generateTryOn wrapper function
 * 
 * Tests the OpenAI service wrapper to ensure it validates I/O,
 * returns expected data, and properly propagates errors.
 */

import { ZodError } from 'zod';

// Mock the OpenAI SDK
jest.mock('openai', () => {
  const mockImagesEdit = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      images: {
        edit: mockImagesEdit
      }
    }))
  };
});

// Mock the environment variables
jest.mock('../src/lib/getEnv', () => ({
  getEnv: jest.fn(() => ({
    key: 'test-api-key',
    model: 'gpt-image-1'
  }))
}));

// Import after mocks are set up
import { generateTryOn } from '../src/lib/openaiClient';

describe('generateTryOn', () => {
  // Valid base64 test fixtures
  const validBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const mockOpenAIResponse = {
    data: [{ b64_json: 'ZmFrZUJhc2U2NA==' }]
  };

  // Helper to get the mock OpenAI instance
  const getMockOpenAI = () => {
    const OpenAI = require('openai').default;
    return new OpenAI();
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully generate try-on image with valid inputs', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue(mockOpenAIResponse);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act
      const result = await generateTryOn(params);

      // Assert
      expect(result).toBe('ZmFrZUJhc2U2NA==');
      expect(mockOpenAI.images.edit).toHaveBeenCalledTimes(1);
      expect(mockOpenAI.images.edit).toHaveBeenCalledWith({
        model: 'gpt-image-1',
        image: [validBase64Image, validBase64Image],
        prompt: 'Change the garment of the model in the first image with the garment from the second image.',
        n: 1,
        size: '1024x1024',
        quality: 'low'
      });
    });

    it('should use the first apparel image when multiple are provided', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue(mockOpenAIResponse);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image, validBase64Image, validBase64Image]
      };

      // Act
      const result = await generateTryOn(params);

      // Assert
      expect(result).toBe('ZmFrZUJhc2U2NA==');
      expect(mockOpenAI.images.edit).toHaveBeenCalledWith(
        expect.objectContaining({
          image: [validBase64Image, validBase64Image] // Should use first apparel image only
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should throw ZodError for invalid base64 model image', async () => {
      // Arrange
      const params = {
        modelImage: 'invalid-base64-data',
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBeInstanceOf(ZodError);
        const mockOpenAI = getMockOpenAI();
        expect(mockOpenAI.images.edit).not.toHaveBeenCalled();
      }
    });

    it('should throw ZodError for invalid base64 apparel image', async () => {
      // Arrange
      const params = {
        modelImage: validBase64Image,
        apparelImages: ['invalid-base64-data']
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBeInstanceOf(ZodError);
        const mockOpenAI = getMockOpenAI();
        expect(mockOpenAI.images.edit).not.toHaveBeenCalled();
      }
    });

    it('should throw ZodError for empty apparel images array', async () => {
      // Arrange
      const params = {
        modelImage: validBase64Image,
        apparelImages: []
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBeInstanceOf(ZodError);
        const mockOpenAI = getMockOpenAI();
        expect(mockOpenAI.images.edit).not.toHaveBeenCalled();
      }
    });

    it('should throw ZodError for missing apparel images', async () => {
      // Arrange
      const params = {
        modelImage: validBase64Image,
        apparelImages: undefined as any
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBeInstanceOf(ZodError);
        const mockOpenAI = getMockOpenAI();
        expect(mockOpenAI.images.edit).not.toHaveBeenCalled();
      }
    });
  });

  describe('OpenAI API Error Handling', () => {
    it('should propagate OpenAI API errors with custom context', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      const apiError = new Error('OpenAI API rate limit exceeded');
      mockOpenAI.images.edit.mockRejectedValue(apiError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: OpenAI API rate limit exceeded');
      expect(mockOpenAI.images.edit).toHaveBeenCalledTimes(1);
    });

    it('should handle OpenAI API errors with non-Error objects', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      const apiError = 'String error from OpenAI';
      mockOpenAI.images.edit.mockRejectedValue(apiError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: Unknown error occurred');
    });

    it('should handle OpenAI API timeout errors', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockOpenAI.images.edit.mockRejectedValue(timeoutError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: Request timeout');
    });
  });

  describe('Response Validation', () => {
    it('should throw error when OpenAI returns no data', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue({ data: [] });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No response data received from OpenAI API');
    });

    it('should throw error when OpenAI returns undefined data', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue({ data: undefined });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No response data received from OpenAI API');
    });

    it('should throw error when OpenAI returns invalid base64 in response', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue({
        data: [{ b64_json: 'invalid-base64-response' }]
      });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBeInstanceOf(ZodError);
      }
    });

    it('should throw error when OpenAI returns no b64_json in response', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockResolvedValue({
        data: [{ url: 'https://example.com/image.png' }]
      });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      await expect(generateTryOn(params)).rejects.toThrow('generateTryOn failed: No image data received from OpenAI API');
    });
  });

  describe('Timeout and Promise Handling', () => {
    it('should not swallow timeout errors', async () => {
      // Arrange
      jest.useFakeTimers();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
      });
      
      const mockOpenAI = getMockOpenAI();
      mockOpenAI.images.edit.mockImplementation(() => timeoutPromise);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act
      const resultPromise = generateTryOn(params);
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(5000);
      
      // Assert
      await expect(resultPromise).rejects.toThrow('generateTryOn failed: Request timeout');
      
      jest.useRealTimers();
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve original error as cause', async () => {
      // Arrange
      const mockOpenAI = getMockOpenAI();
      const originalError = new Error('Original OpenAI error');
      mockOpenAI.images.edit.mockRejectedValue(originalError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).cause).toBe(originalError);
        expect((error as Error).message).toContain('generateTryOn failed: Original OpenAI error');
      }
    });
  });
}); 