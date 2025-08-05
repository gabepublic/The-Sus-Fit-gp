import { getEnv, getEnvOptional, OpenAIEnv } from '../src/lib/getEnv';

describe('getEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    it('should return OpenAI environment variables when API key is present', () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_MODEL = 'gpt-4';

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        key: 'test-api-key-123',
        model: 'gpt-4',
      });
    });

    it('should use default model when OPENAI_MODEL is not set', () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      delete process.env.OPENAI_MODEL;

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        key: 'test-api-key-123',
        model: 'gpt-image-1',
      });
    });

    it('should use default model when OPENAI_MODEL is empty string', () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_MODEL = '';

      // Act
      const result = getEnv();

      // Assert
      expect(result).toEqual({
        key: 'test-api-key-123',
        model: 'gpt-image-1',
      });
    });

    it('should throw error when OPENAI_API_KEY is not set', () => {
      // Arrange
      delete process.env.OPENAI_API_KEY;

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });

    it('should throw error when OPENAI_API_KEY is empty string', () => {
      // Arrange
      process.env.OPENAI_API_KEY = '';

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });

    it('should throw error when OPENAI_API_KEY is only whitespace', () => {
      // Arrange
      process.env.OPENAI_API_KEY = '   ';

      // Act & Assert
      expect(() => getEnv()).toThrow('OPENAI_API_KEY not found');
    });
  });

  describe('getEnvOptional', () => {
    it('should return OpenAI environment variables when API key is present', () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      process.env.OPENAI_MODEL = 'gpt-4';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toEqual({
        key: 'test-api-key-123',
        model: 'gpt-4',
      });
    });

    it('should use default model when OPENAI_MODEL is not set', () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key-123';
      delete process.env.OPENAI_MODEL;

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toEqual({
        key: 'test-api-key-123',
        model: 'gpt-image-1',
      });
    });

    it('should return undefined when OPENAI_API_KEY is not set', () => {
      // Arrange
      delete process.env.OPENAI_API_KEY;

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when OPENAI_API_KEY is empty string', () => {
      // Arrange
      process.env.OPENAI_API_KEY = '';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined when OPENAI_API_KEY is only whitespace', () => {
      // Arrange
      process.env.OPENAI_API_KEY = '   ';

      // Act
      const result = getEnvOptional();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('TypeScript interface', () => {
    it('should have correct OpenAIEnv interface', () => {
      // Arrange
      const mockEnv: OpenAIEnv = {
        key: 'test-key',
        model: 'test-model',
      };

      // Act & Assert
      expect(mockEnv).toHaveProperty('key');
      expect(mockEnv).toHaveProperty('model');
      expect(typeof mockEnv.key).toBe('string');
      expect(typeof mockEnv.model).toBe('string');
    });
  });
}); 