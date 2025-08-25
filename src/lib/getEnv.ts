/**
 * OpenAI Environment Configuration Helper
 * 
 * Centralized retrieval and validation of OpenAI secrets for all server code.
 * This helper provides fail-fast validation to ensure required environment
 * variables are present before the application starts.
 */

export interface OpenAIEnv {
  key: string;
  model: string;
}

/**
 * Retrieves and validates OpenAI environment variables
 * @returns OpenAIEnv object with validated API key and model
 * @throws Error if OPENAI_API_KEY is not found (except during build/CI)
 */
export const getEnv = (): OpenAIEnv => {
  const key = process.env.OPENAI_API_KEY;
  
  // During build time or CI, provide a mock key to allow the build to complete
  if (!key || key.trim() === '') {
    if (process.env.NODE_ENV === 'production' && !process.env.CI) {
      throw new Error('OPENAI_API_KEY not found');
    }
    // For CI/build environments, use a mock key and mock model
    console.warn('OPENAI_API_KEY not found, using mock key for build/CI environment');
    return {
      key: 'sk-mock-key-for-build',
      model: 'mock', // Use mock model for CI builds
    };
  }
  
  const model = process.env.OPENAI_MODEL;
  const defaultModel = 'gpt-image-1';
  
  return {
    key,
    model: model && model.trim() !== '' ? model : defaultModel,
  };
};

/**
 * Alternative function that returns undefined instead of throwing
 * Useful for optional OpenAI features
 */
export const getEnvOptional = (): OpenAIEnv | undefined => {
  const key = process.env.OPENAI_API_KEY;
  
  if (!key || key.trim() === '') {
    return undefined;
  }
  
  const model = process.env.OPENAI_MODEL;
  const defaultModel = 'gpt-image-1';
  
  return {
    key,
    model: model && model.trim() !== '' ? model : defaultModel,
  };
}; 