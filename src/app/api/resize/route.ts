import { NextRequest, NextResponse } from 'next/server';
import { imageResizingService, ResizeOptions } from '@/lib/imageResizingService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageB64, options } = body;

    console.log('route: imageB64', imageB64.substring(0, 50) + '...');
    console.log('route: options', options);
    let result;

    if (options) {
      // Resize using custom options
      const resizeOptions: ResizeOptions = {
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        quality: options.quality || 80,
        format: options.format || 'jpeg',
        withoutEnlargement: options.withoutEnlargement !== false,
      };
      result = await imageResizingService.resizeImage(imageB64, resizeOptions);
    } else {
      return NextResponse.json(
        { error: 'Options must be provided' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Image resizing failed',
          details: result.error 
        },
        { status: 500 }
      );
    }


    // Return the resized image information
    return NextResponse.json({
      success: true,
      message: 'Image resized successfully',
      resizedB64: result.resizedB64,
      metadata: result.metadata,
      resizeInfo: result.resizeInfo,
      },
      { status: 200 });

  } catch (error) {
    console.error('Image resizing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during image resizing',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

