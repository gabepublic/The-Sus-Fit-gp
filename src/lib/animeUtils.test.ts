import { generateAnime, extractBase64, validateBase64Image } from './animeUtils';

// Mock the OpenAI client
const mockEdit = jest.fn();
jest.mock('./openaiClient', () => ({
  getOpenAIClient: () => ({
    images: {
      edit: mockEdit
    }
  })
}));

describe('Anime API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  describe('validateBase64Image', () => {
    it('should validate correct base64 image', () => {
      expect(validateBase64Image(validBase64Image)).toBe(true);
    });

    it('should reject invalid base64', () => {
      expect(validateBase64Image('invalid-base64')).toBe(false);
    });

    it('should reject non-image data URL', () => {
      expect(validateBase64Image('data:text/plain;base64,dGV4dA==')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateBase64Image('')).toBe(false);
    });

    it('should reject too short strings', () => {
      expect(validateBase64Image('data:image/png;base64,')).toBe(false);
    });
  });

  describe('extractBase64', () => {
    it('should extract base64 from b64_json response', () => {
      const response = {
        data: [
          {
            b64_json: 'animeBase64DataHere'
          }
        ]
      };

      const result = extractBase64(response);
      expect(result).toBe('data:image/png;base64,animeBase64DataHere');
    });

    it('should throw error for URL response format', () => {
      const response = {
        data: [
          {
            url: 'https://example.com/image.png'
          }
        ]
      };

      expect(() => extractBase64(response)).toThrow('URL response not supported - use b64_json format');
    });

    it('should throw error for empty response', () => {
      const response = {
        data: []
      };

      expect(() => extractBase64(response)).toThrow('No image data received from OpenAI');
    });

    it('should throw error for invalid response format', () => {
      const response = {
        data: [
          {}
        ]
      };

      expect(() => extractBase64(response)).toThrow('Invalid response format from OpenAI Images API');
    });
  });

  describe('generateAnime', () => {
    it('should generate anime image on successful API call', async () => {
      const mockResponse = {
        data: [
          {
            b64_json: 'animeBase64DataHere'
          }
        ]
      };

      mockEdit.mockResolvedValue(mockResponse);

      const result = await generateAnime(validBase64Image);

      expect(result).toBe('data:image/png;base64,animeBase64DataHere');
      expect(mockEdit).toHaveBeenCalledWith({
        model: 'gpt-image-1',
        image: expect.any(File),
        prompt: 'Create a high-quality anime portrait with transparent background. The character should have a friendly, approachable expression.',
        n: 1,
        size: '1024x1024',
        quality: 'low'
      });
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockResponse = {
        data: [
          {
            b64_json: 'animeBase64DataHere'
          }
        ]
      };

      // First call fails, second succeeds
      mockEdit
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await generateAnime(validBase64Image);

      expect(result).toBe('data:image/png;base64,animeBase64DataHere');
      expect(mockEdit).toHaveBeenCalledTimes(2);
    });

    it('should throw error after all retry attempts fail', async () => {
      mockEdit.mockRejectedValue(new Error('OpenAI API error'));

      await expect(generateAnime(validBase64Image)).rejects.toThrow('OpenAI API error');
      expect(mockEdit).toHaveBeenCalledTimes(3);
    });
  });
}); 