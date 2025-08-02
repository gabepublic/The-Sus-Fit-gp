import { validateEnv } from './env';
import type { ProcessEnv } from 'node:process';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates correct environment variables', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
      LANGCHAIN_API_KEY: 'test-langchain-key',
      LANGCHAIN_TRACING_V2: 'true',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      NODE_ENV: 'development',
    };

    const result = validateEnv();

    expect(result).toEqual({
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
      LANGCHAIN_API_KEY: 'test-langchain-key',
      LANGCHAIN_TRACING_V2: 'true',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      NODE_ENV: 'development',
    });
  });

  it('validates environment with optional variables missing', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
      // Remove optional variables to test they default to undefined
      LANGCHAIN_API_KEY: undefined,
      LANGCHAIN_TRACING_V2: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      NODE_ENV: undefined,
    };

    const result = validateEnv();

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

  it('throws error when required ANTHROPIC_API_KEY is missing', () => {
    process.env = {
      ...process.env,
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
    };

    // Remove ANTHROPIC_API_KEY if it exists
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when required PINECONE_API_KEY is missing', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
    };

    // Remove PINECONE_API_KEY if it exists
    delete process.env.PINECONE_API_KEY;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when required PINECONE_ENVIRONMENT is missing', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_INDEX_NAME: 'test-index',
    };

    // Remove PINECONE_ENVIRONMENT if it exists
    delete process.env.PINECONE_ENVIRONMENT;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when required PINECONE_INDEX_NAME is missing', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
    };

    // Remove PINECONE_INDEX_NAME if it exists
    delete process.env.PINECONE_INDEX_NAME;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when ANTHROPIC_API_KEY is empty', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: '',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
    };

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when NEXT_PUBLIC_APP_URL is invalid URL', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
      NEXT_PUBLIC_APP_URL: 'invalid-url',
    };

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('throws error when NODE_ENV is invalid', () => {
    process.env = {
      ...process.env,
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_ENVIRONMENT: 'test-environment',
      PINECONE_INDEX_NAME: 'test-index',
      NODE_ENV: 'invalid-env',
    };

    expect(() => validateEnv()).toThrow('Invalid environment variables');
    expect(console.error).toHaveBeenCalledWith('Environment validation failed:');
  });

  it('accepts valid NODE_ENV values', () => {
    const validEnvs = ['development', 'production', 'test'];

    validEnvs.forEach(env => {
      process.env = {
        ...process.env,
        ANTHROPIC_API_KEY: 'test-anthropic-key',
        PINECONE_API_KEY: 'test-pinecone-key',
        PINECONE_ENVIRONMENT: 'test-environment',
        PINECONE_INDEX_NAME: 'test-index',
        NODE_ENV: env,
      };

      const result = validateEnv();
      expect(result.NODE_ENV).toBe(env);
    });
  });

  it('re-throws non-ZodError exceptions', () => {
    // Mock process.env to cause a different type of error
    const originalProcessEnv = process.env;
    process.env = null as unknown as ProcessEnv;

    expect(() => validateEnv()).toThrow();
    
    process.env = originalProcessEnv;
  });
}); 