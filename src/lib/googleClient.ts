import { GoogleGenAI } from "@google/genai";
import { getEnv } from './getEnv';
import { TryOnParamsSchema, TryOnResultSchema, type TryOnParams, normalizeBase64 } from './tryOnSchema';
import * as fs from 'fs';

// Retrieve and validate environment variables with fail-fast approach
const { google: { key, model } } = getEnv();

const googleai = new GoogleGenAI({
  apiKey: key,
});

// Export both the client instance and model for reuse by other modules
export { googleai, model };

export const generateTryOn = async ({ modelImage, apparelImages }: TryOnParams): Promise<string> => {

    try {
        // Validate input parameters
        TryOnParamsSchema.parse({ modelImage, apparelImages });
    
        if (model === 'mock') {
          console.log('Using mock model');
          // Validate output using schema
          const validatedResult = TryOnResultSchema.parse({ imgGenerated: fs.readFileSync('public/images/demo/will-sweatshirt-portrait.png', { encoding: 'base64' }) });
          return validatedResult.imgGenerated;
        }
    
        // Normalize base64 strings (remove data URL prefix if present)
        const modelImageBase64Str = normalizeBase64(modelImage);
        //console.log('modelImageBase64Str:', modelImageBase64Str.substring(0, 50) + '...');
        const apparelImageBase64Str = normalizeBase64(apparelImages[0]);

        //const PROMPT_05 = `Use the **base image (first image)** as the person and scene reference. Completely remove the outfit in the base image and then render a realistic, high-quality replacement using the **outfit from the second image**, fully adopting its **design, shape, silhouette, style, and texture**. Make sure the outfit fit naturally to the person’s body posture, maintaining correct scale, orientation, lighting, and perspective. Do **not extrapolate or extend** beyond what is shown in the base image and second image. Match the outfit’s visible length to the base image’s crop, or vice versa. Preserve all other elements of the base image exactly — including the person’s skin, hair, environment, shadows, and pose. Do not alter or obscure anything outside the outfit area.`;

        const PROMPT_07 = `Use the **base image (first image)** as the person and scene reference. Completely remove the outfit in the base image, and then render a realistic, high quality outfit replacement using the **outfit from the second image**, fully adopting its **design, shape, silhouette, style, and texture**. Make sure the outfit fit naturally to the person’s body posture, maintaining correct scale, orientation, lighting, and perspective. Do **not invent or extrapolate** beyond what is shown in the base image. Keep all other elements of the base image intact, including the person’s pose, skin, hair, environment, and shadows. Do not modify anything outside the outfit area.

**Outfit definition:** All visible clothing and accessories (upper and lower garments, footwear, and accessories such as hats, jewelry, belts, handbags, and glasses).`;

        console.log('PROMPT:\n', PROMPT_07);
        // Create content array for Google Gemini API
        const contents = [
            {
                role: 'user',
                parts: [
                    { text: PROMPT_07 },
                    { 
                        inlineData: { 
                            mimeType: 'image/png', 
                            data: modelImageBase64Str 
                        } 
                    },
                    { 
                        inlineData: { 
                            mimeType: 'image/png', 
                            data: apparelImageBase64Str 
                        } 
                    }
                ]
            }
        ];

        const response = await googleai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                temperature: 0.1,
            }
        });

        // Check if response has candidates
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No candidates returned from Google Gemini API');
        }

        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts) {
            throw new Error('No content parts returned from Google Gemini API');
        }

        // Process the response parts
        for (const part of candidate.content.parts) {
            if (part.text) {
              console.log('Generated text:', part.text);
            } else if (part.inlineData) {
              const imageData = part.inlineData.data;
              if (imageData) {
                // KEEP for TESTING; DO NOT REMOVE!!!
                //const buffer = Buffer.from(imageData, "base64");
                //fs.writeFileSync("gemini-native-image.png", buffer);
                //console.log("Image saved as gemini-native-image.png");
                // Return the base64 image data
                return imageData;
              }
            }
        }

        // If no image was found in the response, throw an error
        throw new Error('No image data found in Google Gemini API response');

    } catch (error) {
        // Re-throw with custom context while preserving original error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const customError = new Error(`generateTryOn failed: ${errorMessage}`);
        (customError as Error & { cause?: unknown }).cause = error; // Set cause property for error chaining
        throw customError;
    }
};
