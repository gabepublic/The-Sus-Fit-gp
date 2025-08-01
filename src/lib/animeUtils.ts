import { getOpenAIClient } from './openaiClient';

interface OpenAIImagesResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

/**
 * Validate base64 image data
 */
export function validateBase64Image(base64: string): boolean {
  // Check if it's a valid base64 string
  if (!base64 || typeof base64 !== 'string') {
    return false;
  }

  // Check if it starts with data URL prefix
  if (!base64.startsWith('data:image/')) {
    return false;
  }

  // Check minimum length (data:image/png;base64, + at least some base64 data)
  if (base64.length < 50) {
    return false;
  }

  // Extract the base64 part after the comma
  const base64Part = base64.split(',')[1];
  if (!base64Part) {
    return false;
  }

  // Validate base64 format
  try {
    // Check if it's valid base64
    atob(base64Part);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract base64 image from OpenAI Images API response
 */
export function extractBase64(response: OpenAIImagesResponse): string {
  const imageData = response.data[0];
  
  if (!imageData) {
    throw new Error('No image data received from OpenAI');
  }

  // If we have b64_json, use that
  if (imageData.b64_json) {
    return `data:image/png;base64,${imageData.b64_json}`;
  }

  // If we have a URL, we need to fetch it and convert to base64
  if (imageData.url) {
    throw new Error('URL response not supported - use b64_json format');
  }
  
  throw new Error('Invalid response format from OpenAI Images API');
}

/**
 * Generate anime portrait using OpenAI Images API with retry logic
 * @param selfie - Base64 data URL of the selfie image (e.g., "data:image/png;base64,...")
 * @returns Promise<string> - Base64 data URL of the generated anime image
 * Note: This uses image generation from text prompt since direct image-to-image
 * transformation requires specific image formats and sizes
 */
export async function generateAnime(selfie: string): Promise<string> {
  const openai = getOpenAIClient();
  
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`Anime generation attempt ${attempt + 1}/3`);
      
      // Extract base64 data from the data URL
      const base64Data = selfie.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 image format');
      }

      // Convert base64 to File object for OpenAI API
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const imageFile = new File([imageBuffer], 'selfie.png', { type: 'image/png' });

      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: 'Create a high-quality anime portrait with transparent background. The character should have a friendly, approachable expression.',
        n: 1,
        size: '1024x1024',
        quality: 'low'
      });

      console.log(`OpenAI Images API response received`);
      
      return extractBase64(response as OpenAIImagesResponse);
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt === 2) {
        throw error; // Bubble on final failure
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('All retry attempts failed');
} 