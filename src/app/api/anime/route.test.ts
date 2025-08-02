import { NextRequest } from 'next/server';
import { POST } from './route';
import { validateBase64Image, generateAnime } from '@/lib/animeUtils';

// Mock the animeUtils functions
jest.mock('@/lib/animeUtils', () => ({
  validateBase64Image: jest.fn(),
  generateAnime: jest.fn(),
}));

const mockValidateBase64Image = validateBase64Image as jest.MockedFunction<typeof validateBase64Image>;
const mockGenerateAnime = generateAnime as jest.MockedFunction<typeof generateAnime>;

describe('Anime API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when selfie parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing selfie parameter');
  });

  it('returns 400 when selfie parameter is empty', async () => {
    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: '' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing selfie parameter');
  });

  it('returns 400 when base64 image is invalid', async () => {
    mockValidateBase64Image.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: 'invalid-base64' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid base64 image format');
    expect(mockValidateBase64Image).toHaveBeenCalledWith('invalid-base64');
  });

  it('returns 500 when generateAnime throws an API key error', async () => {
    mockValidateBase64Image.mockReturnValue(true);
    mockGenerateAnime.mockRejectedValue(new Error('API key is invalid'));

    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: 'data:image/jpeg;base64,valid-base64' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('OpenAI configuration error');
  });

  it('returns 500 when generateAnime throws a generic error', async () => {
    mockValidateBase64Image.mockReturnValue(true);
    mockGenerateAnime.mockRejectedValue(new Error('Generic error'));

    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: 'data:image/jpeg;base64,valid-base64' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate anime portrait');
  });

  it('returns success response with anime image', async () => {
    mockValidateBase64Image.mockReturnValue(true);
    mockGenerateAnime.mockResolvedValue('data:image/jpeg;base64,anime-image');

    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: 'data:image/jpeg;base64,valid-base64' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.image).toBe('data:image/jpeg;base64,anime-image');
    expect(mockValidateBase64Image).toHaveBeenCalledWith('data:image/jpeg;base64,valid-base64');
    expect(mockGenerateAnime).toHaveBeenCalledWith('data:image/jpeg;base64,valid-base64');
  });

  it('handles non-Error exceptions', async () => {
    mockValidateBase64Image.mockReturnValue(true);
    mockGenerateAnime.mockRejectedValue('String error');

    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: JSON.stringify({ selfie: 'data:image/jpeg;base64,valid-base64' }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate anime portrait');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/anime', {
      method: 'POST',
      body: 'invalid-json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON in request body');
  });
}); 