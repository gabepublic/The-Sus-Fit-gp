import OpenAI from 'openai';

// Memoized singleton instance
let openaiInstance: OpenAI | null = null;

/**
 * Get or create the OpenAI client instance
 * Throws descriptive error if API key is missing
 */
export function getOpenAIClient(): OpenAI {
  if (openaiInstance) {
    return openaiInstance;
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'OpenAI API key is missing. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file.'
    );
  }

  if (apiKey === 'your_openai_api_key_here') {
    throw new Error(
      'OpenAI API key is not configured. Please replace "your_openai_api_key_here" with your actual API key in .env.local'
    );
  }

  openaiInstance = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  return openaiInstance;
}

// Export a getter for the client (lazy-loaded)
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    const client = getOpenAIClient();
    return (client as unknown as Record<string, unknown>)[prop as string];
  }
}); 