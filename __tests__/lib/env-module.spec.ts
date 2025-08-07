/**
 * This test file specifically tests the module import behavior of env.ts
 * to ensure 100% branch coverage of the env export
 */

describe('env module import', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterAll(() => {
    // Restore original process.env after all tests
    process.env = originalEnv;
  });

  it('should call validateEnv when NODE_ENV is production', async () => {
    // Arrange
    (process.env as any).NODE_ENV = 'production';
    process.env.ANTHROPIC_API_KEY = 'prod-key';
    process.env.PINECONE_API_KEY = 'prod-pinecone';
    process.env.PINECONE_ENVIRONMENT = 'prod-env';
    process.env.PINECONE_INDEX_NAME = 'prod-index';
    process.env.LANGCHAIN_API_KEY = 'prod-langchain';
    process.env.LANGCHAIN_TRACING_V2 = 'prod-tracing';

    // Act - Import the module fresh
    const { env } = await import('../../src/lib/env');

    // Assert - Only check the values we explicitly set
    expect(env.ANTHROPIC_API_KEY).toBe('prod-key');
    expect(env.PINECONE_API_KEY).toBe('prod-pinecone');
    expect(env.PINECONE_ENVIRONMENT).toBe('prod-env');
    expect(env.PINECONE_INDEX_NAME).toBe('prod-index');
    expect(env.NODE_ENV).toBe('production');
    // Optional fields should exist but may have values from the test environment
    expect(env).toHaveProperty('LANGCHAIN_API_KEY');
    expect(env).toHaveProperty('LANGCHAIN_TRACING_V2');
    expect(env).toHaveProperty('NEXT_PUBLIC_APP_URL');
  });

  it('should call validateEnv when NODE_ENV is development', async () => {
    // Arrange
    (process.env as any).NODE_ENV = 'development';
    process.env.ANTHROPIC_API_KEY = 'dev-key';
    process.env.PINECONE_API_KEY = 'dev-pinecone';
    process.env.PINECONE_ENVIRONMENT = 'dev-env';
    process.env.PINECONE_INDEX_NAME = 'dev-index';
    process.env.LANGCHAIN_API_KEY = 'dev-langchain';
    process.env.LANGCHAIN_TRACING_V2 = 'dev-tracing';

    // Act - Import the module fresh
    const { env } = await import('../../src/lib/env');

    // Assert - Only check the values we explicitly set
    expect(env.ANTHROPIC_API_KEY).toBe('dev-key');
    expect(env.PINECONE_API_KEY).toBe('dev-pinecone');
    expect(env.PINECONE_ENVIRONMENT).toBe('dev-env');
    expect(env.PINECONE_INDEX_NAME).toBe('dev-index');
    expect(env.NODE_ENV).toBe('development');
    // Optional fields should exist but may have values from the test environment
    expect(env).toHaveProperty('LANGCHAIN_API_KEY');
    expect(env).toHaveProperty('LANGCHAIN_TRACING_V2');
    expect(env).toHaveProperty('NEXT_PUBLIC_APP_URL');
  });

  it('should call validateEnv when NODE_ENV is undefined', async () => {
    // Arrange
    delete (process.env as any).NODE_ENV;
    process.env.ANTHROPIC_API_KEY = 'undefined-key';
    process.env.PINECONE_API_KEY = 'undefined-pinecone';
    process.env.PINECONE_ENVIRONMENT = 'undefined-env';
    process.env.PINECONE_INDEX_NAME = 'undefined-index';
    process.env.LANGCHAIN_API_KEY = 'undefined-langchain';
    process.env.LANGCHAIN_TRACING_V2 = 'undefined-tracing';

    // Act - Import the module fresh
    const { env } = await import('../../src/lib/env');

    // Assert - Only check the values we explicitly set
    expect(env.ANTHROPIC_API_KEY).toBe('undefined-key');
    expect(env.PINECONE_API_KEY).toBe('undefined-pinecone');
    expect(env.PINECONE_ENVIRONMENT).toBe('undefined-env');
    expect(env.PINECONE_INDEX_NAME).toBe('undefined-index');
    expect(env.NODE_ENV).toBeUndefined();
    // Optional fields should exist but may have values from the test environment
    expect(env).toHaveProperty('LANGCHAIN_API_KEY');
    expect(env).toHaveProperty('LANGCHAIN_TRACING_V2');
    expect(env).toHaveProperty('NEXT_PUBLIC_APP_URL');
  });

  it('should return empty object when NODE_ENV is test', async () => {
    // Arrange
    (process.env as any).NODE_ENV = 'test';

    // Act - Import the module fresh
    const { env } = await import('../../src/lib/env');

    // Assert
    expect(env).toEqual({});
  });

  it('should throw error when validateEnv fails during import', async () => {
    // Arrange - Missing required environment variables
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.PINECONE_API_KEY;
    delete process.env.PINECONE_ENVIRONMENT;
    delete process.env.PINECONE_INDEX_NAME;

    // Act & Assert - Import should throw
    await expect(import('../../src/lib/env')).rejects.toThrow('Invalid environment variables');
  });
}); 