import { z } from 'zod';

/**
 * Zod schema for validating try-on request payload
 * 
 * Validates that:
 * - modelImage is a non-empty string (base64 encoded image)
 * - apparelImages is an array of non-empty strings (base64 encoded images)
 * - At least one apparel image is provided
 */
export const TryonSchema = z.object({
  modelImage: z.string().min(1, 'Missing model image'),
  apparelImages: z.array(z.string().min(1)).min(1, 'At least one apparel image required')
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type TryonRequest = z.infer<typeof TryonSchema>; 