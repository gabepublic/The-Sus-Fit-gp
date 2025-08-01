import { requestAnime, TimeoutError } from './animeRequest';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock FileReader with a simpler approach
const mockFileReader = {
  readAsDataURL: jest.fn(),
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  result: null as string | null,
};

Object.defineProperty(global, 'FileReader', {
  value: jest.fn(() => mockFileReader),
  writable: true,
});

describe('animeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset FileReader mock
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.result = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockBlob = (): Blob => {
    return new Blob(['test image data'], { type: 'image/png' });
  };

  const createMockResponse = (data: unknown, ok: boolean = true) => {
    return {
      ok,
      status: ok ? 200 : 400,
      statusText: ok ? 'OK' : 'Bad Request',
      json: jest.fn().mockResolvedValue(data),
    };
  };

  describe('requestAnime', () => {
    it('should successfully request anime transformation', async () => {
      const mockBlob = createMockBlob();
      const mockResponse = createMockResponse({ image: 'data:image/png;base64,animeData' });
      
      mockFetch.mockResolvedValue(mockResponse);
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      const result = await promise;
      
      expect(result).toBe('data:image/png;base64,animeData');
      expect(mockFetch).toHaveBeenCalledWith('/api/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selfie: 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh' }),
        signal: undefined,
      });
    });

    it('should handle HTTP error responses', async () => {
      const mockBlob = createMockBlob();
      const mockResponse = createMockResponse(
        { error: 'Invalid base64 image format' }, 
        false
      );
      
      mockFetch.mockResolvedValue(mockResponse);
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Invalid base64 image format');
    });

    it('should handle missing image data in response', async () => {
      const mockBlob = createMockBlob();
      const mockResponse = createMockResponse({});
      
      mockFetch.mockResolvedValue(mockResponse);
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('No image data received from server');
    });

    it('should handle FileReader errors', async () => {
      const mockBlob = createMockBlob();
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader error
      setTimeout(() => {
        mockFileReader.onerror?.();
      }, 0);
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Failed to read blob');
    });

    it('should handle network errors', async () => {
      const mockBlob = createMockBlob();
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors in error response', async () => {
      const mockBlob = createMockBlob();
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      
      mockFetch.mockResolvedValue(mockResponse);
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      await expect(promise).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should pass abort signal to fetch', async () => {
      const mockBlob = createMockBlob();
      const abortController = new AbortController();
      const mockResponse = createMockResponse({ image: 'data:image/png;base64,animeData' });
      
      mockFetch.mockResolvedValue(mockResponse);
      
      // Simulate FileReader success
      mockFileReader.result = 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh';
      
      const promise = requestAnime(mockBlob, abortController.signal);
      
      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);
      
      jest.runAllTimers();
      
      await promise;
      
      expect(mockFetch).toHaveBeenCalledWith('/api/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selfie: 'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh' }),
        signal: abortController.signal,
      });
    });
  });

  describe('TimeoutError', () => {
    it('should create TimeoutError with default message', () => {
      const error = new TimeoutError();
      expect(error.message).toBe('Request timed out');
      expect(error.name).toBe('TimeoutError');
    });

    it('should create TimeoutError with custom message', () => {
      const error = new TimeoutError('Custom timeout message');
      expect(error.message).toBe('Custom timeout message');
      expect(error.name).toBe('TimeoutError');
    });
  });
}); 