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

export interface GoogleGeminiEnv {
  key: string;
  model: string;
}

export interface VisionEnv {
  provider: 'OPENAI' | 'GOOGLE';
  openai: OpenAIEnv;
  google: GoogleGeminiEnv;
  dailyLimit: number;
}

/**
 * Retrieves and validates vision provider environment variables
 * @returns VisionEnv object with validated configuration
 * @throws Error if required environment variables are not found
 */
export const getEnv = (): VisionEnv => {
  const provider = process.env.VISION_PROVIDER?.toUpperCase() as 'OPENAI' | 'GOOGLE';
  
  if (!provider || !['OPENAI', 'GOOGLE'].includes(provider)) {
    throw new Error('VISION_PROVIDER must be one of: OPENAI, or GOOGLE');
  }

  // OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY not found');
  }
  
  const openaiModel = process.env.OPENAI_VISION_MODEL;
  const defaultOpenaiModel = 'gpt-image-1';
  
  // Google Gemini configuration
  const googleKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!googleKey || googleKey.trim() === '') {
    throw new Error('GOOGLE_GEMINI_API_KEY not found');
  }
  
  const googleModel = process.env.GOOGLE_GEMINI_VISION_MODEL;
  const defaultGoogleModel = 'gemini-2.5-flash-image-preview';
  
  // Daily limit configuration
  const dailyLimitStr = process.env.DAILY_LIMIT;
  const defaultDailyLimit = 100;
  
  let dailyLimit: number;
  if (dailyLimitStr && dailyLimitStr.trim() !== '') {
    const parsed = parseInt(dailyLimitStr, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('DAILY_LIMIT must be a positive integer');
    }
    dailyLimit = parsed;
  } else {
    dailyLimit = defaultDailyLimit;
  }
  
  return {
    provider,
    openai: {
      key: openaiKey,
      model: openaiModel && openaiModel.trim() !== '' ? openaiModel : defaultOpenaiModel,
    },
    google: {
      key: googleKey,
      model: googleModel && googleModel.trim() !== '' ? googleModel : defaultGoogleModel,
    },
    dailyLimit,
  };
};

/**
 * Alternative function that returns undefined instead of throwing
 * Useful for optional vision provider features
 */
export const getEnvOptional = (): VisionEnv | undefined => {
  const provider = process.env.VISION_PROVIDER?.toUpperCase() as 'OPENAI' | 'GOOGLE';
  
  if (!provider || !['OPENAI', 'GOOGLE'].includes(provider)) {
    return undefined;
  }

  // OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey.trim() === '') {
    return undefined;
  }
  
  const openaiModel = process.env.OPENAI_VISION_MODEL;
  const defaultOpenaiModel = 'gpt-image-1';
  
  // Google Gemini configuration
  const googleKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!googleKey || googleKey.trim() === '') {
    return undefined;
  }
  
  const googleModel = process.env.GOOGLE_GEMINI_VISION_MODEL;
  const defaultGoogleModel = 'gemini-2.5-flash-image-preview';
  
  // Daily limit configuration
  const dailyLimitStr = process.env.DAILY_LIMIT;
  const defaultDailyLimit = 100;
  
  let dailyLimit: number;
  if (dailyLimitStr && dailyLimitStr.trim() !== '') {
    const parsed = parseInt(dailyLimitStr, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return undefined; // Invalid daily limit in optional function
    }
    dailyLimit = parsed;
  } else {
    dailyLimit = defaultDailyLimit;
  }
  
  return {
    provider,
    openai: {
      key: openaiKey,
      model: openaiModel && openaiModel.trim() !== '' ? openaiModel : defaultOpenaiModel,
    },
    google: {
      key: googleKey,
      model: googleModel && googleModel.trim() !== '' ? googleModel : defaultGoogleModel,
    },
    dailyLimit,
  };
}; 