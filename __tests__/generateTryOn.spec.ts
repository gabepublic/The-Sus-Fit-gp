/**
 * Unit tests for generateTryOn wrapper function
 * 
 * Tests the OpenAI service wrapper to ensure it validates I/O,
 * returns expected data, and properly propagates errors.
 */

import { ZodError } from 'zod';

// Mock getEnv first
jest.mock('../src/lib/getEnv', () => ({
  getEnv: jest.fn(() => ({
    provider: 'OPENAI',
    openai: {
      key: 'test-api-key',
      model: 'gpt-image-1'
    },
    google: {
      key: 'test-google-key',
      model: 'gemini-1.5-pro'
    },
    dailyLimit: 100
  }))
}));

// Mock OpenAI
jest.mock('openai', () => {
  const mockImagesEdit = jest.fn();
  return jest.fn().mockImplementation(() => ({
    images: {
      edit: mockImagesEdit
    }
  }));
});

// Import after mocks are set up
import { generateTryOn } from '../src/lib/openaiClient';

describe('generateTryOn', () => {
  const validBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const mockOpenAIResponse = {
    data: [
      {
        b64_json: 'ZmFrZUJhc2U2NA=='
      }
    ]
  };

  // Get the mock function from the mocked module
  const getMockImagesEdit = () => {
    const OpenAI = require('openai');
    const mockInstance = new OpenAI();
    return mockInstance.images.edit;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully generate try-on image with valid inputs', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue(mockOpenAIResponse);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act
      const result = await generateTryOn(params);

      // Assert
      expect(result).toBe('ZmFrZUJhc2U2NA==');
      expect(mockImagesEdit).toHaveBeenCalledTimes(1);
      
      // Check the call arguments
      const callArgs = mockImagesEdit.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-image-1');
      expect(callArgs.image).toHaveLength(2);
      expect(callArgs.image[0].name).toBe('model.png');
      expect(callArgs.image[1].name).toBe('apparel.png');
      expect(callArgs.prompt).toContain('Use the **base image (first image)** as the person and scene reference');
      expect(callArgs.prompt).toContain('Replace the entire outfit in the base image with the **outfit from the second image**');
      expect(callArgs.prompt).toContain('Do **not extrapolate or extend** beyond what is shown');
      expect(callArgs.input_fidelity).toBe('high');
      expect(callArgs.size).toBe('1024x1536');
      expect(callArgs.quality).toBe('high');
    });

    it('should use the first apparel image when multiple are provided', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue(mockOpenAIResponse);
      
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
            expect.any(File),
            expect.any(File)
          ])
        })
      );
      
      // Verify only first apparel image is used
      const callArgs = mockImagesEdit.mock.calls[0][0];
      expect(callArgs.image).toHaveLength(2);
      expect(callArgs.image[0].name).toBe('model.png');
      expect(callArgs.image[1].name).toBe('apparel.png');
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
        const mockImagesEdit = getMockImagesEdit();
        expect(mockImagesEdit).not.toHaveBeenCalled();
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
        const mockImagesEdit = getMockImagesEdit();
        expect(mockImagesEdit).not.toHaveBeenCalled();
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
        const mockImagesEdit = getMockImagesEdit();
        expect(mockImagesEdit).not.toHaveBeenCalled();
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
        const mockImagesEdit = getMockImagesEdit();
        expect(mockImagesEdit).not.toHaveBeenCalled();
      }
    });
  });

  describe('OpenAI API Error Handling', () => {
    it('should propagate OpenAI API errors with custom context', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      const apiError = new Error('OpenAI API error');
      mockImagesEdit.mockRejectedValue(apiError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: OpenAI API error');
        expect((error as any).cause).toBe(apiError);
      }
    });

    it('should handle OpenAI API errors with non-Error objects', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      const apiError = 'String error';
      mockImagesEdit.mockRejectedValue(apiError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: Unknown error occurred');
        expect((error as any).cause).toBe(apiError);
      }
    });

    it('should handle OpenAI API timeout errors', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockImagesEdit.mockRejectedValue(timeoutError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: Request timeout');
        expect((error as any).cause).toBe(timeoutError);
      }
    });
  });

  describe('Response Validation', () => {
    it('should throw error when OpenAI returns no data', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue({ data: [] });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: No response data received from OpenAI API');
      }
    });

    it('should throw error when OpenAI returns undefined data', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue({ data: undefined });
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: No response data received from OpenAI API');
      }
    });

    it('should throw error when OpenAI returns invalid base64 in response', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue({
        data: [{ b64_json: 'invalid-base64' }]
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
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed');
        expect((error as any).cause).toBeInstanceOf(ZodError);
      }
    });

    it('should throw error when OpenAI returns no b64_json in response', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      mockImagesEdit.mockResolvedValue({
        data: [{}]
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
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: No image data received from OpenAI API');
      }
    });
  });

  describe('Timeout and Promise Handling', () => {
    it('should not swallow timeout errors', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      const timeoutError = new Error('Request timeout');
      mockImagesEdit.mockRejectedValue(timeoutError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('generateTryOn failed: Request timeout');
        expect((error as any).cause).toBe(timeoutError);
      }
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve original error as cause', async () => {
      // Arrange
      const mockImagesEdit = getMockImagesEdit();
      const originalError = new Error('Original error');
      mockImagesEdit.mockRejectedValue(originalError);
      
      const params = {
        modelImage: validBase64Image,
        apparelImages: [validBase64Image]
      };

      // Act & Assert
      try {
        await generateTryOn(params);
        fail('Expected function to throw an error');
      } catch (error) {
        expect((error as any).cause).toBe(originalError);
      }
    });
  });
}); 