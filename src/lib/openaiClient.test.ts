// Mock the OpenAI constructor
const mockOpenAI = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: mockOpenAI,
}));

describe('OpenAI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module cache to test different environment states
    jest.resetModules();
    // Clear environment variables
    delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  });

  it('should create OpenAI instance with API key', async () => {
    const mockApiKey = 'test-api-key-123';
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = mockApiKey;
    
    // Re-import to get fresh instance
    const { getOpenAIClient } = await import('./openaiClient');
    
    getOpenAIClient();
    
    expect(mockOpenAI).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      dangerouslyAllowBrowser: true,
    });
  });

  it('should throw error when API key is missing', async () => {
    // Re-import to get fresh instance
    const { getOpenAIClient } = await import('./openaiClient');
    
    expect(() => getOpenAIClient()).toThrow(
      'OpenAI API key is missing. Please set NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file.'
    );
  });

  it('should throw error when API key is placeholder', async () => {
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'your_openai_api_key_here';
    
    // Re-import to get fresh instance
    const { getOpenAIClient } = await import('./openaiClient');
    
    expect(() => getOpenAIClient()).toThrow(
      'OpenAI API key is not configured. Please replace "your_openai_api_key_here" with your actual API key in .env.local'
    );
  });

  it('should return same instance on subsequent calls (singleton)', async () => {
    const mockApiKey = 'test-api-key-456';
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = mockApiKey;
    
    // Re-import to get fresh instance
    const { getOpenAIClient } = await import('./openaiClient');
    
    const client1 = getOpenAIClient();
    const client2 = getOpenAIClient();
    
    expect(client1).toBe(client2);
    expect(mockOpenAI).toHaveBeenCalledTimes(1); // Only called once
  });
}); 