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
 * @throws Error if OPENAI_API_KEY is not found
 */
export const getEnv = (): OpenAIEnv => {
  const key = process.env.OPENAI_API_KEY;
  
  if (!key || key.trim() === '') {
    throw new Error('OPENAI_API_KEY not found');
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