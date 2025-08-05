/**
 * OpenAI Client Initialization and Try-On Service
 * 
 * Provides a singleton OpenAI client instance with secure environment variable retrieval
 * and implements the core try-on functionality using OpenAI Images Edit API.
 * This module handles the foundational SDK initialization and service wrapper logic.
 */

import OpenAI from 'openai';
import { getEnv } from './getEnv';
import { TryOnParamsSchema, TryOnResultSchema, type TryOnParams } from './tryOnSchema';

// Retrieve and validate environment variables with fail-fast approach
const { key, model } = getEnv();

// Instantiate singleton OpenAI client
const openai = new OpenAI({ apiKey: key });

// Export both the client instance and model for reuse by other modules
export { openai, model };

/**
 * Generate a try-on image by combining a model image with apparel images
 * 
 * This function uses OpenAI's Images Edit API to create a virtual try-on effect,
 * where the model's garment is replaced with the provided apparel image.
 * 
 * @param params - Object containing modelImage (base64) and apparelImages array (base64)
 * @returns Promise<string> - Base64 encoded generated image
 * @throws Error - When validation fails, API call fails, or response is invalid
 * 
 * @example
 * ```typescript
 * const result = await generateTryOn({
 *   modelImage: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
 *   apparelImages: ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]
 * });
 * // Returns: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * ```
 */
export const generateTryOn = async ({ modelImage, apparelImages }: TryOnParams): Promise<string> => {
  try {
    // Validate input parameters
    TryOnParamsSchema.parse({ modelImage, apparelImages });

    // Call OpenAI Images Edit API
    const response = await openai.images.edit({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: [modelImage, apparelImages[0]] as any, // Use first apparel image - cast to any for base64 strings
      prompt: 'Change the garment of the model in the first image with the garment from the second image.',
      n: 1,
      size: '1024x1024',
      quality: 'low'
    });

    // Extract and validate the generated image
    if (!response.data || response.data.length === 0) {
      throw new Error('No response data received from OpenAI API');
    }
    
    const b64Json = response.data[0]?.b64_json;
    if (!b64Json) {
      throw new Error('No image data received from OpenAI API');
    }

    // Validate output using schema
    const validatedResult = TryOnResultSchema.parse({ imgGenerated: b64Json });

    return validatedResult.imgGenerated;
  } catch (error) {
    // Re-throw with custom context while preserving original error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const customError = new Error(`generateTryOn failed: ${errorMessage}`);
    (customError as Error & { cause?: unknown }).cause = error; // Set cause property for error chaining
    throw customError;
  }
}; 