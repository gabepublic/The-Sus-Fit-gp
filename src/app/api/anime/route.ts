import { NextRequest, NextResponse } from 'next/server';
import { validateBase64Image, generateAnime } from '@/lib/animeUtils';

// Types for request/response
interface AnimeRequest {
  selfie: string;
}

interface AnimeResponse {
  image: string;
}

/**
 * POST handler for anime transformation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body: AnimeRequest = await request.json();
    
    // Validate input
    if (!body.selfie) {
      return NextResponse.json(
        { error: 'Missing selfie parameter' },
        { status: 400 }
      );
    }
    
    if (!validateBase64Image(body.selfie)) {
      return NextResponse.json(
        { error: 'Invalid base64 image format' },
        { status: 400 }
      );
    }
    
    // Generate anime portrait
    const animeImage = await generateAnime(body.selfie);
    
    // Return success response
    const response: AnimeResponse = {
      image: animeImage
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Anime transformation error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return appropriate error response
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI configuration error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate anime portrait' },
      { status: 500 }
    );
  }
} 