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
 * Matches standard base64 encoding with optional padding
 */
const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Zod schema for validating base64-encoded image strings
 * 
 * @example
 * // Valid: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
 * // Invalid: "not-base64-data"
 */
export const Base64Str = z.string().regex(base64Regex, 'Invalid base64 image data');

/**
 * Schema for try-on service input parameters
 * 
 * @example
 * {
 *   modelImage: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
 *   apparelImages: ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="]
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