/**
 * Image validation utilities with comprehensive error handling and type safety
 * 
 * @example
 * ```typescript
 * import { validateImage, validateFileType, validateFileSize, validateImageDimensions } from './imageValidation';
 * 
 * // Validate a complete image file
 * try {
 *   const result = await validateImage(imageFile);
 *   if (result.isValid) {
 *     console.log('Image is valid');
 *   } else {
 *     result.errors.forEach(error => console.log(error.message));
 *   }
 * } catch (error) {
 *   console.error('Validation failed:', error);
 * }
 * 
 * // Individual validations
 * const isValidType = validateFileType(file);
 * const isValidSize = validateFileSize(file);
 * const isValidDimensions = await validateImageDimensions(file);
 * ```
 */

import { IMAGE_VALIDATION_CONSTANTS } from './constants';
import { ImageValidationError } from './errorHandling';

// Re-export for convenience
export { ImageValidationError };

/**
 * Represents the result of image validation
 */
export interface ValidationResult {
  /** Whether the image passed all validations */
  isValid: boolean;
  /** Array of validation errors, empty if valid */
  errors: ImageValidationError[];
}

/**
 * Interface for image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validates if a file has an acceptable image MIME type
 * 
 * @param file - The file to validate
 * @returns true if file type is supported, false otherwise
 * 
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * if (validateFileType(file)) {
 *   console.log('File type is valid');
 * } else {
 *   console.log('Unsupported file type');
 * }
 * ```
 */
export function validateFileType(file: File): boolean {
  if (!file || !file.type) {
    return false;
  }

  return IMAGE_VALIDATION_CONSTANTS.SUPPORTED_FORMATS.includes(
    file.type as any
  );
}

/**
 * Validates if a file size is within acceptable limits
 * 
 * @param file - The file to validate
 * @returns true if file size is acceptable, false otherwise
 * 
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * if (validateFileSize(file)) {
 *   console.log('File size is acceptable');
 * } else {
 *   console.log('File is too large');
 * }
 * ```
 */
export function validateFileSize(file: File): boolean {
  if (!file) {
    return false;
  }

  return file.size <= IMAGE_VALIDATION_CONSTANTS.MAX_FILE_SIZE;
}

/**
 * Gets image dimensions from a File object using ImageBitmap API with Canvas fallback
 * 
 * @param file - The image file to analyze
 * @returns Promise resolving to image dimensions
 * @throws {ImageValidationError} When image cannot be loaded or processed
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  if (!file || !file.type.startsWith('image/')) {
    throw new ImageValidationError(
      'Invalid file: not an image',
      'INVALID_FILE_TYPE',
      'file',
      file?.type,
      'Must be an image file'
    );
  }

  // Modern browsers: Use ImageBitmap API for efficient processing
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = {
        width: bitmap.width,
        height: bitmap.height,
      };
      bitmap.close(); // Free memory
      return dimensions;
    } catch (error) {
      // Fall back to Canvas API if ImageBitmap fails
    }
  }

  // Fallback: Use Canvas API with Image element
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url); // Clean up
      reject(
        new ImageValidationError(
          'Failed to load image for dimension analysis',
          'IMAGE_LOAD_ERROR',
          'file',
          file.name,
          'Image must be a valid, non-corrupted file'
        )
      );
    };

    img.src = url;
  });
}

/**
 * Validates if image dimensions meet minimum requirements
 * 
 * @param file - The image file to validate
 * @returns Promise resolving to true if dimensions are acceptable, false otherwise
 * 
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * try {
 *   const isValidDimensions = await validateImageDimensions(file);
 *   if (isValidDimensions) {
 *     console.log('Image dimensions are acceptable');
 *   } else {
 *     console.log('Image is too small');
 *   }
 * } catch (error) {
 *   console.error('Failed to validate dimensions:', error);
 * }
 * ```
 */
export async function validateImageDimensions(file: File): Promise<boolean> {
  try {
    const dimensions = await getImageDimensions(file);
    
    return (
      dimensions.width >= IMAGE_VALIDATION_CONSTANTS.MIN_DIMENSIONS.width &&
      dimensions.height >= IMAGE_VALIDATION_CONSTANTS.MIN_DIMENSIONS.height
    );
  } catch {
    return false;
  }
}

/**
 * Performs comprehensive validation on an image file
 * 
 * @param file - The image file to validate
 * @returns Promise resolving to validation result with detailed error information
 * 
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * 
 * try {
 *   const result = await validateImage(file);
 *   
 *   if (result.isValid) {
 *     console.log('Image passed all validations');
 *     // Proceed with upload
 *   } else {
 *     console.log('Validation failed:');
 *     result.errors.forEach(error => {
 *       console.log(`- ${error.message} (${error.code})`);
 *     });
 *   }
 * } catch (error) {
 *   console.error('Validation process failed:', error);
 * }
 * ```
 */
export async function validateImage(file: File): Promise<ValidationResult> {
  const errors: ImageValidationError[] = [];

  // Basic file existence check
  if (!file) {
    errors.push(
      new ImageValidationError(
        'No file provided',
        'NO_FILE',
        'file',
        null,
        'A file must be selected'
      )
    );
    return { isValid: false, errors };
  }

  // File type validation
  if (!validateFileType(file)) {
    const supportedTypes = IMAGE_VALIDATION_CONSTANTS.SUPPORTED_FORMATS.join(', ');
    errors.push(
      new ImageValidationError(
        `Unsupported file type: ${file.type}. Supported formats: ${supportedTypes}`,
        'INVALID_FILE_TYPE',
        'type',
        file.type,
        `Must be one of: ${supportedTypes}`
      )
    );
  }

  // File size validation
  if (!validateFileSize(file)) {
    const maxSizeMB = Math.round(IMAGE_VALIDATION_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024));
    const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
    errors.push(
      new ImageValidationError(
        `File size too large: ${fileSizeMB}MB. Maximum allowed: ${maxSizeMB}MB`,
        'FILE_TOO_LARGE',
        'size',
        file.size,
        `Must be under ${maxSizeMB}MB`
      )
    );
  }

  // Dimension validation (only if file type is valid)
  if (validateFileType(file)) {
    try {
      const dimensions = await getImageDimensions(file);
      const { MIN_DIMENSIONS } = IMAGE_VALIDATION_CONSTANTS;
      
      if (
        dimensions.width < MIN_DIMENSIONS.width ||
        dimensions.height < MIN_DIMENSIONS.height
      ) {
        errors.push(
          new ImageValidationError(
            `Image dimensions too small: ${dimensions.width}x${dimensions.height}. Minimum required: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}`,
            'DIMENSIONS_TOO_SMALL',
            'dimensions',
            dimensions,
            `Minimum ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} pixels`
          )
        );
      }
    } catch (dimensionError) {
      if (dimensionError instanceof ImageValidationError) {
        errors.push(dimensionError);
      } else {
        errors.push(
          new ImageValidationError(
            'Failed to analyze image dimensions',
            'DIMENSION_ANALYSIS_FAILED',
            'dimensions',
            undefined,
            'Image must be a valid, readable format'
          )
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a user-friendly error message from validation errors
 * 
 * @param errors - Array of validation errors
 * @returns Human-readable error message
 * 
 * @example
 * ```typescript
 * const result = await validateImage(file);
 * if (!result.isValid) {
 *   const message = createUserFriendlyErrorMessage(result.errors);
 *   alert(message);
 * }
 * ```
 */
export function createUserFriendlyErrorMessage(errors: ImageValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message;
  }

  const messages = errors.map((error, index) => `${index + 1}. ${error.message}`);
  return `Multiple issues found:\n${messages.join('\n')}`;
}

// Types are already exported above