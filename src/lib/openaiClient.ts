/**
 * OpenAI Client Initialization and Try-On Service
 * 
 * Provides a singleton OpenAI client instance with secure environment variable retrieval
 * and implements the core try-on functionality using OpenAI Images Edit API.
 * This module handles the foundational SDK initialization and service wrapper logic.
 */

import OpenAI from 'openai';
import { getEnv } from './getEnv';
import { TryOnParamsSchema, TryOnResultSchema, type TryOnParams, normalizeBase64 } from './tryOnSchema';
import * as fs from 'fs';

// Retrieve and validate environment variables with fail-fast approach
const { key, model } = getEnv();

// Instantiate singleton OpenAI client
const openai = new OpenAI({ apiKey: key });

// Export both the client instance and model for reuse by other modules
export { openai, model };

/**
 * Convert base64 string to File object for OpenAI API
 * 
 * @param base64String - Base64 encoded image string (with or without data URL prefix)
 * @param filename - Name for the file (default: 'image.png')
 * @returns File object suitable for OpenAI API
 */
const base64ToFile = (base64String: string, filename: string = 'image.png'): File => {
  // Normalize base64 (strip data URL prefix if present)
  const normalizedBase64 = normalizeBase64(base64String);
  
  // Convert base64 to binary data using Node.js Buffer
  const buffer = Buffer.from(normalizedBase64, 'base64');

  // KEEP for TESTING; DO NOT REMOVE
  // Save file to local drive
  //const fs = require('fs');
  //const path = require('path');
  //const savePath = path.join(process.cwd(), 'uploads', filename);
  //fs.mkdirSync(path.dirname(savePath), { recursive: true });
  //fs.writeFileSync(savePath, buffer);
  
  // Create blob and file
  const blob = new Blob([buffer], { type: 'image/png' });
  return new File([blob], filename, { type: 'image/png' });
};

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
 *   modelImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
 *   apparelImages: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]
 * });
 * // Returns: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * ```
 */
export const generateTryOn = async ({ modelImage, apparelImages }: TryOnParams): Promise<string> => {
  try {
    // Validate input parameters
    TryOnParamsSchema.parse({ modelImage, apparelImages });

    // Convert base64 strings to File objects for OpenAI API
    const modelFile = base64ToFile(modelImage, 'model.png');
    const apparelFile = base64ToFile(apparelImages[0], 'apparel.png');

    if (model == 'mock') {
      console.log('Using mock model');
      // Validate output using schema
      const validatedResult = TryOnResultSchema.parse({ imgGenerated: fs.readFileSync('public/images/demo/WillShalom.jpg', { encoding: 'base64' }) });
      return validatedResult.imgGenerated;
    }

    // Call OpenAI Images Edit API
    const response = await openai.images.edit({
      model,
      image: [modelFile, apparelFile],
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
    console.log('Generated image length: ', b64Json.length);
    
    // KEEP for TESTING; DO NOT REMOVE
    // Save generated image to file
    //const generatedImageFile = base64ToFile(b64Json, 'generated.png');

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