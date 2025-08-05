/**
 * Try-On Service Schema Definitions
 * 
 * Provides compile-time and runtime contracts for inputs and outputs of the OpenAI
 * Images Edit wrapper. These schemas ensure type safety and validate base64 image data.
 * 
 * @see https://platform.openai.com/docs/api-reference/images/edit
 */

import { z } from 'zod';

/**
 * Base64 regex pattern for validating image data
 * Matches both data URLs (data:image/...;base64,...) and pure base64 strings
 * with optional padding
 */
const base64Regex = /^(?:data:image\/[a-zA-Z]+;base64,)?(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Utility function to normalize base64 strings
 * Strips data URL prefix if present, returns pure base64
 * 
 * @param base64String - The base64 string to normalize
 * @returns Pure base64 string without data URL prefix
 * 
 * @example
 * // Input: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * // Output: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 */
export const normalizeBase64 = (base64String: string): string => {
  // If it's a data URL, extract the base64 part
  if (base64String.startsWith('data:image/')) {
    const commaIndex = base64String.indexOf(',');
    if (commaIndex !== -1) {
      return base64String.substring(commaIndex + 1);
    }
  }
  // If it's already pure base64, return as is
  return base64String;
};

/**
 * Zod schema for validating base64-encoded image strings
 * Accepts both data URLs and pure base64 strings
 * 
 * @example
 * // Valid data URL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * // Valid pure base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * // Invalid: "not-base64-data"
 */
export const Base64Str = z.string().regex(base64Regex, 'Invalid base64 image data');

/**
 * Schema for try-on service input parameters
 * 
 * @example
 * {
 *   modelImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
 *   apparelImages: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]
 * }
 */
export const TryOnParamsSchema = z.object({
  modelImage: Base64Str,
  apparelImages: z.array(Base64Str).min(1, 'At least one apparel image is required')
});

/**
 * Schema for try-on service output result
 * 
 * @example
 * {
 *   imgGenerated: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * }
 */
export const TryOnResultSchema = z.object({
  imgGenerated: Base64Str
});

/**
 * TypeScript type for try-on service input parameters
 * Inferred from TryOnParamsSchema for compile-time type safety
 */
export type TryOnParams = z.infer<typeof TryOnParamsSchema>;

/**
 * TypeScript type for try-on service output result
 * Inferred from TryOnResultSchema for compile-time type safety
 */
export type TryOnResult = z.infer<typeof TryOnResultSchema>; 