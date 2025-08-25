import { validateEnv, type Env, env } from '../../src/lib/env';
import { z } from 'zod';

describe('env', () => {
  const originalEnv = process.env;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset process.env before each test and clear optional variables
    process.env = { ...originalEnv };
    // Clear optional environment variables to ensure clean test state
    delete process.env.LANGCHAIN_API_KEY;
    delete process.env.LANGCHAIN_TRACING_V2;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete (process.env as any).NODE_ENV;
    // Clear CI environment to ensure tests behave consistently
    delete process.env.CI;
    // Reset console.error
    console.error = originalConsoleError;
  });

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  describe('validateEnv', () => {
    it('should return valid environment variables when all required keys are present', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';

      // Act
      const result = validateEnv();

      // Assert
      expect(result.ANTHROPIC_API_KEY).toBe('test-anthropic-key');
      expect(result.PINECONE_API_KEY).toBe('test-pinecone-key');
      expect(result.PINECONE_ENVIRONMENT).toBe('test-environment');
      expect(result.PINECONE_INDEX_NAME).toBe('test-index');
      // Optional properties should be undefined when not provided
      expect(result.LANGCHAIN_API_KEY).toBeUndefined();
      expect(result.LANGCHAIN_TRACING_V2).toBeUndefined();
      expect(result.NEXT_PUBLIC_APP_URL).toBeUndefined();
      expect(result.NODE_ENV).toBeUndefined();
    });

    it('should include optional environment variables when provided', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      process.env.LANGCHAIN_API_KEY = 'test-langchain-key';
      process.env.LANGCHAIN_TRACING_V2 = 'true';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      (process.env as any).NODE_ENV = 'development';

      // Act
      const result = validateEnv();

      // Assert
      expect(result.ANTHROPIC_API_KEY).toBe('test-anthropic-key');
      expect(result.PINECONE_API_KEY).toBe('test-pinecone-key');
      expect(result.PINECONE_ENVIRONMENT).toBe('test-environment');
      expect(result.PINECONE_INDEX_NAME).toBe('test-index');
      expect(result.LANGCHAIN_API_KEY).toBe('test-langchain-key');
      expect(result.LANGCHAIN_TRACING_V2).toBe('true');
      expect(result.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
      expect(result.NODE_ENV).toBe('development');
    });

    it('should throw error when ANTHROPIC_API_KEY is missing', () => {
      // Arrange
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      delete process.env.ANTHROPIC_API_KEY;
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when ANTHROPIC_API_KEY is empty', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = '';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when PINECONE_API_KEY is missing', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      delete process.env.PINECONE_API_KEY;
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when PINECONE_ENVIRONMENT is missing', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      delete process.env.PINECONE_ENVIRONMENT;
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when PINECONE_INDEX_NAME is missing', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      delete process.env.PINECONE_INDEX_NAME;
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when NEXT_PUBLIC_APP_URL is invalid URL', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      process.env.NEXT_PUBLIC_APP_URL = 'invalid-url';
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';
      (process.env as any).NODE_ENV = 'invalid-env';
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should accept valid NODE_ENV values', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';

      // Test each valid NODE_ENV value
      const validEnvs = ['development', 'production', 'test'];
      
      validEnvs.forEach(envValue => {
        (process.env as any).NODE_ENV = envValue;
        expect(() => validateEnv()).not.toThrow();
      });
    });

    it('should log detailed error messages when validation fails', () => {
      // Arrange
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;
      process.env.ANTHROPIC_API_KEY = '';
      process.env.PINECONE_API_KEY = '';
      process.env.PINECONE_ENVIRONMENT = '';
      process.env.PINECONE_INDEX_NAME = '';
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment variables');
      expect(mockConsoleError).toHaveBeenCalledWith('Environment validation failed:');
      expect(mockConsoleError).toHaveBeenCalledWith('- ANTHROPIC_API_KEY: Claude API key is required');
      expect(mockConsoleError).toHaveBeenCalledWith('- PINECONE_API_KEY: Pinecone API key is required');
      expect(mockConsoleError).toHaveBeenCalledWith('- PINECONE_ENVIRONMENT: Pinecone environment is required');
      expect(mockConsoleError).toHaveBeenCalledWith('- PINECONE_INDEX_NAME: Pinecone index name is required');
    });

    it('should handle non-ZodError exceptions by re-throwing them', () => {
      // Arrange - Mock process.env to throw a non-ZodError
      const originalProcessEnv = process.env;
      process.env = new Proxy({} as NodeJS.ProcessEnv, {
        get() {
          throw new Error('Unexpected error');
        }
      });
      // Ensure CI environment doesn't interfere with test
      delete process.env.CI;

      // Act & Assert
      expect(() => validateEnv()).toThrow('Unexpected error');

      // Cleanup
      process.env = originalProcessEnv;
    });
  });

  describe('env export', () => {
    it('should return empty object when NODE_ENV is test', () => {
      // Arrange
      (process.env as any).NODE_ENV = 'test';

      // Act & Assert
      expect(env).toEqual({});
    });

    it('should test the conditional logic directly', () => {
      // Arrange - Ensure NODE_ENV is set to 'test'
      (process.env as any).NODE_ENV = 'test';
      
      // Test the conditional expression logic
      const testEnv = process.env.NODE_ENV === 'test' ? {} as Env : validateEnv();
      
      // Since we're in test environment, it should return empty object
      expect(testEnv).toEqual({});
    });

    it('should test validateEnv call when NODE_ENV is not test', () => {
      // Arrange
      (process.env as any).NODE_ENV = 'development';
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';

      // Act - Test the conditional logic directly
      const result = process.env.NODE_ENV === 'test' ? {} as Env : validateEnv();

      // Assert
      expect(result).toEqual({
        ANTHROPIC_API_KEY: 'test-anthropic-key',
        PINECONE_API_KEY: 'test-pinecone-key',
        PINECONE_ENVIRONMENT: 'test-environment',
        PINECONE_INDEX_NAME: 'test-index',
        LANGCHAIN_API_KEY: undefined,
        LANGCHAIN_TRACING_V2: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NODE_ENV: 'development',
      });
    });

    it('should test validateEnv call when NODE_ENV is undefined', () => {
      // Arrange
      delete (process.env as any).NODE_ENV;
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.PINECONE_API_KEY = 'test-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'test-environment';
      process.env.PINECONE_INDEX_NAME = 'test-index';

      // Act - Test the conditional logic directly
      const result = process.env.NODE_ENV === 'test' ? {} as Env : validateEnv();

      // Assert
      expect(result).toEqual({
        ANTHROPIC_API_KEY: 'test-anthropic-key',
        PINECONE_API_KEY: 'test-pinecone-key',
        PINECONE_ENVIRONMENT: 'test-environment',
        PINECONE_INDEX_NAME: 'test-index',
        LANGCHAIN_API_KEY: undefined,
        LANGCHAIN_TRACING_V2: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NODE_ENV: undefined,
      });
    });

    // New test to cover the missing branch in the env export
    it('should call validateEnv when NODE_ENV is not test (production)', async () => {
      // Arrange - Set up environment for production
      (process.env as any).NODE_ENV = 'production';
      process.env.ANTHROPIC_API_KEY = 'prod-anthropic-key';
      process.env.PINECONE_API_KEY = 'prod-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'prod-environment';
      process.env.PINECONE_INDEX_NAME = 'prod-index';

      // Act - Use dynamic import to trigger fresh module evaluation
      jest.resetModules();
      const { env: freshEnv } = await import('../../src/lib/env');

      // Assert
      expect(freshEnv).toEqual({
        ANTHROPIC_API_KEY: 'prod-anthropic-key',
        PINECONE_API_KEY: 'prod-pinecone-key',
        PINECONE_ENVIRONMENT: 'prod-environment',
        PINECONE_INDEX_NAME: 'prod-index',
        LANGCHAIN_API_KEY: undefined,
        LANGCHAIN_TRACING_V2: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NODE_ENV: 'production',
      });
    });

    it('should call validateEnv when NODE_ENV is not test (development)', async () => {
      // Arrange - Set up environment for development
      (process.env as any).NODE_ENV = 'development';
      process.env.ANTHROPIC_API_KEY = 'dev-anthropic-key';
      process.env.PINECONE_API_KEY = 'dev-pinecone-key';
      process.env.PINECONE_ENVIRONMENT = 'dev-environment';
      process.env.PINECONE_INDEX_NAME = 'dev-index';

      // Act - Use dynamic import to trigger fresh module evaluation
      jest.resetModules();
      const { env: freshEnv } = await import('../../src/lib/env');

      // Assert
      expect(freshEnv).toEqual({
        ANTHROPIC_API_KEY: 'dev-anthropic-key',
        PINECONE_API_KEY: 'dev-pinecone-key',
        PINECONE_ENVIRONMENT: 'dev-environment',
        PINECONE_INDEX_NAME: 'dev-index',
        LANGCHAIN_API_KEY: undefined,
        LANGCHAIN_TRACING_V2: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NODE_ENV: 'development',
      });
    });

    it('should call validateEnv when NODE_ENV is undefined', async () => {
      // Arrange - Set up environment with undefined NODE_ENV
      delete (process.env as any).NODE_ENV;
      process.env.ANTHROPIC_API_KEY = 'undefined-env-key';
      process.env.PINECONE_API_KEY = 'undefined-env-pinecone';
      process.env.PINECONE_ENVIRONMENT = 'undefined-env-environment';
      process.env.PINECONE_INDEX_NAME = 'undefined-env-index';

      // Act - Use dynamic import to trigger fresh module evaluation
      jest.resetModules();
      const { env: freshEnv } = await import('../../src/lib/env');

      // Assert
      expect(freshEnv).toEqual({
        ANTHROPIC_API_KEY: 'undefined-env-key',
        PINECONE_API_KEY: 'undefined-env-pinecone',
        PINECONE_ENVIRONMENT: 'undefined-env-environment',
        PINECONE_INDEX_NAME: 'undefined-env-index',
        LANGCHAIN_API_KEY: undefined,
        LANGCHAIN_TRACING_V2: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        NODE_ENV: undefined,
      });
    });
  });

  describe('TypeScript interface', () => {
    it('should have correct Env interface', () => {
      // Arrange
      const mockEnv: Env = {
        ANTHROPIC_API_KEY: 'test-key',
        PINECONE_API_KEY: 'test-pinecone-key',
        PINECONE_ENVIRONMENT: 'test-environment',
        PINECONE_INDEX_NAME: 'test-index',
        LANGCHAIN_API_KEY: 'test-langchain-key',
        LANGCHAIN_TRACING_V2: 'true',
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        NODE_ENV: 'development',
      };

      // Act & Assert
      expect(mockEnv).toHaveProperty('ANTHROPIC_API_KEY');
      expect(mockEnv).toHaveProperty('PINECONE_API_KEY');
      expect(mockEnv).toHaveProperty('PINECONE_ENVIRONMENT');
      expect(mockEnv).toHaveProperty('PINECONE_INDEX_NAME');
      expect(typeof mockEnv.ANTHROPIC_API_KEY).toBe('string');
      expect(typeof mockEnv.PINECONE_API_KEY).toBe('string');
      expect(typeof mockEnv.PINECONE_ENVIRONMENT).toBe('string');
      expect(typeof mockEnv.PINECONE_INDEX_NAME).toBe('string');
    });
  });
}); 