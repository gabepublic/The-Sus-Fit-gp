import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { TryonSchema } from './schema';
import { getEnv } from '../../../lib/getEnv';
import { generateTryOn as generateTryOnOpenAI } from '../../../lib/openaiClient';
import { generateTryOn as generateTryOnGoogle } from '../../../lib/googleClient';
import type { TryOnParams } from '../../../lib/tryOnSchema';

import { RateLimiterMemory } from "rate-limiter-flexible";

const { dailyLimit, provider } = getEnv();
console.log('Daily Limit:', dailyLimit);

const rateLimiter = new RateLimiterMemory({
  points: dailyLimit, // 5 requests
  duration: 86400, // per 24 hours in seconds per IP
});

// TODO: Implement try-on functionality
// - ✅ Add request validation (subtask 3.2) - COMPLETED
// - ✅ Add request parsing & payload validation (subtask 3.3) - COMPLETED
// - ✅ Add image processing logic (subtask 3.4) - COMPLETED
// - ✅ Add error handling (subtask 3.5) - COMPLETED
// - ✅ Add dynamic provider switching (subtask 3.6) - COMPLETED

/**
 * Factory function to get the appropriate generateTryOn implementation
 * based on the VISION_PROVIDER environment variable
 * 
 * @returns The generateTryOn function for the configured provider
 * @throws Error if the provider is not supported
 */
function getGenerateTryOnImplementation(): (params: TryOnParams) => Promise<string> {
  //const { provider } = getEnv();
  console.log('Provider:', provider);
  switch (provider) {
    case 'OPENAI':
      return generateTryOnOpenAI;
    case 'GOOGLE':
      return generateTryOnGoogle;
    default:
      throw new Error(`Unsupported vision provider: ${provider}. Supported providers: OPENAI, GOOGLE`);
  }
}

// Helper function to create CORS headers
function createCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? '';
  return new NextResponse(null, {
    status: 200,
    headers: createCorsHeaders(origin)
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const corsHeaders = createCorsHeaders(origin);

  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    await rateLimiter.consume(ip.toString()); // throws if limit exceeded

    // Parse request body
    const body = await request.json();
    
    // Validate payload against schema
    const { modelImage, apparelImages } = TryonSchema.parse(body);
    
    // Get the appropriate generateTryOn implementation based on VISION_PROVIDER
    const generateTryOn = getGenerateTryOnImplementation();
    
    // Generate try-on image using the configured provider
    const img_generated = await generateTryOn({ modelImage, apparelImages });
    
    // Return generated image with CORS headers
    return NextResponse.json({ 
      img_generated 
    }, { 
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Handle generateTryOn errors and other internal errors
    console.error('Try-on API error:', error);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error occurred')
      : 'Internal Server Error';
    
    return NextResponse.json({ 
      error: errorMessage
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
} 