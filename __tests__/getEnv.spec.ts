import { getEnv, getEnvOptional, VisionEnv } from '../src/lib/getEnv';

// Unmock the getEnv functions for this specific test
jest.unmock('../src/lib/getEnv');

describe('getEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear any cached modules to ensure fresh imports
    jest.resetModules();
  });

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    it('should return vision environment variables when all required keys are present', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_VISION_MODEL = 'gpt-4';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';
      process.env.GOOGLE_GEMINI_VISION_MODEL = 'gemini-2.5-flash-image-preview';
      process.env.DAILY_LIMIT = '50';

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        provider: 'OPENAI',
        openai: {
          key: 'test-api-key-123',
          model: 'gpt-4',
        },
        google: {
          key: 'test-google-key-456',
          model: 'gemini-2.5-flash-image-preview',
        },
        dailyLimit: 50,
      });
    });

    it('should use default models when vision models are not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';
      delete process.env.OPENAI_VISION_MODEL;
      delete process.env.GOOGLE_GEMINI_VISION_MODEL;

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        provider: 'OPENAI',
        openai: {
          key: 'test-api-key-123',
          model: 'gpt-image-1',
        },
        google: {
          key: 'test-google-key-456',
          model: 'gemini-2.5-flash-image-preview',
        },
        dailyLimit: 100,
      });
    });

    it('should use default models when vision models are empty strings', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';
      process.env.OPENAI_VISION_MODEL = '';
      process.env.GOOGLE_GEMINI_VISION_MODEL = '';

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        provider: 'OPENAI',
        openai: {
          key: 'test-api-key-123',
          model: 'gpt-image-1',
        },
        google: {
          key: 'test-google-key-456',
          model: 'gemini-2.5-flash-image-preview',
        },
        dailyLimit: 100,
      });
    });

    it('should throw error when VISION_PROVIDER is not set', () => {
      // Arrange
      delete process.env.VISION_PROVIDER;

      // Act & Assert
      expect(() => getEnv()).toThrow('VISION_PROVIDER must be one of: OPENAI, or GOOGLE');
    });

    it('should throw error when OPENAI_API_KEY is not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      delete process.env.OPENAI_API_KEY;
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });

    it('should throw error when OPENAI_API_KEY is empty string', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = '';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });

    it('should throw error when OPENAI_API_KEY is only whitespace', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = '   ';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });

    it('should throw error when GOOGLE_GEMINI_API_KEY is not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      delete process.env.GOOGLE_GEMINI_API_KEY;

      // Act & Assert
      expect(() => getEnv()).toThrow('GOOGLE_GEMINI_API_KEY not found');
    });
  });

  describe('getEnvOptional', () => {
    it('should return vision environment variables when all required keys are present', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_VISION_MODEL = 'gpt-4';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';
      process.env.GOOGLE_GEMINI_VISION_MODEL = 'gemini-2.5-flash-image-preview';
      process.env.DAILY_LIMIT = '50';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toEqual({
        provider: 'OPENAI',
        openai: {
          key: 'test-api-key-123',
          model: 'gpt-4',
        },
        google: {
          key: 'test-google-key-456',
          model: 'gemini-2.5-flash-image-preview',
        },
        dailyLimit: 50,
      });
    });

    it('should use default models when vision models are not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';
      delete process.env.OPENAI_VISION_MODEL;
      delete process.env.GOOGLE_GEMINI_VISION_MODEL;

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toEqual({
        provider: 'OPENAI',
        openai: {
          key: 'test-api-key-123',
          model: 'gpt-image-1',
        },
        google: {
          key: 'test-google-key-456',
          model: 'gemini-2.5-flash-image-preview',
        },
        dailyLimit: 100,
      });
    });

    it('should return undefined when VISION_PROVIDER is not set', () => {
      // Arrange
      delete process.env.VISION_PROVIDER;

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when OPENAI_API_KEY is not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      delete process.env.OPENAI_API_KEY;
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when OPENAI_API_KEY is empty string', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = '';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when OPENAI_API_KEY is only whitespace', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = '   ';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-google-key-456';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when GOOGLE_GEMINI_API_KEY is not set', () => {
      // Arrange
      process.env.VISION_PROVIDER = 'OPENAI';
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      delete process.env.GOOGLE_GEMINI_API_KEY;

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('TypeScript interface', () => {
    it('should have correct VisionEnv interface', () => {
      // Arrange
      const mockEnv: VisionEnv = {
        provider: 'OPENAI',
        openai: {
          key: 'test-openai-key',
          model: 'test-openai-model',
        },
        google: {
          key: 'test-google-key',
          model: 'test-google-model',
        },
        dailyLimit: 100,
      };

      // Act & Assert
      expect(mockEnv).toHaveProperty('provider');
      expect(mockEnv).toHaveProperty('openai');
      expect(mockEnv).toHaveProperty('google');
      expect(mockEnv).toHaveProperty('dailyLimit');
      expect(typeof mockEnv.provider).toBe('string');
      expect(typeof mockEnv.openai.key).toBe('string');
      expect(typeof mockEnv.openai.model).toBe('string');
      expect(typeof mockEnv.google.key).toBe('string');
      expect(typeof mockEnv.google.model).toBe('string');
      expect(typeof mockEnv.dailyLimit).toBe('number');
    });
  });
}); 