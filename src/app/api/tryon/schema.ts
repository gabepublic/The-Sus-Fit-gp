import { z } from 'zod';

/**
 * Base64 regex pattern for validating image data
 * Matches both data URLs (data:image/...;base64,...) and pure base64 strings
 * with optional padding
 */
const base64Regex = /^(?:data:image\/[a-zA-Z]+;base64,)?(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Zod schema for validating try-on request payload
 * 
 * Validates that:
 * - modelImage is a valid base64 string (data URL or pure base64)
 * - apparelImages is an array of valid base64 strings (data URL or pure base64)
 * - At least one apparel image is provided
 */
export const TryonSchema = z.object({
  modelImage: z.string().regex(base64Regex, 'Invalid base64 image data').min(1, 'Missing model image'),
  apparelImages: z.array(z.string().regex(base64Regex, 'Invalid base64 image data').min(1, 'Invalid apparel image')).min(1, 'At least one apparel image required')
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type TryonRequest = z.infer<typeof TryonSchema>; 