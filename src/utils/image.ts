/**
 * Image utility constants and helper functions for file processing
 * 
 * @example
 * ```typescript
 * import { fileToBase64, compressBase64, isImageFile } from './utils/image';
 * 
 * // Convert file to base64
 * try {
 *   const base64 = await fileToBase64(imageFile);
 *   const compressed = await compressBase64(base64, 512); // 512KB limit
 * } catch (error) {
 *   if (error instanceof FileTypeNotSupportedError) {
 *     console.log('Please select an image file');
 *   } else if (error instanceof FileTooLargeError) {
 *     console.log('File is too large');
 *   } else if (error instanceof CompressionFailedError) {
 *     console.log('Compression failed');
 *   }
 * }
 * ```
 */

/**
 * Type alias for base64 image strings (data URL format)
 */
export type ImageBase64 = string;

/**
 * Maximum allowed image file size in bytes (5 MB)
 */
export const IMG_SIZE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Custom error for unsupported file types
 */
export class FileTypeNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileTypeNotSupportedError';
  }
}

/**
 * Custom error for files that exceed size limits
 */
export class FileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileTooLargeError';
  }
}

/**
 * Custom error for image compression failures
 */
export class CompressionFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompressionFailedError';
  }
}

/**
 * Checks if a file is an image based on its MIME type
 * @param file - The file to check
 * @returns true if the file is an image, false otherwise
 */
export const isImageFile = (file: File): boolean => file.type.startsWith('image/');

/**
 * Converts a File object to a base64 string (data URL format)
 * 
 * @param file - The file to convert to base64
 * @returns Promise that resolves to the base64 string representation (data URL format)
 * @throws {FileTypeNotSupportedError} When file type is not supported (non-image files)
 * @throws {FileTooLargeError} When file size exceeds 5 MB limit
 * 
 * @example
 * ```typescript
 * const imageFile = event.target.files[0];
 * try {
 *   const base64 = await fileToBase64(imageFile);
 *   // base64 will be: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 * } catch (error) {
 *   if (error instanceof FileTypeNotSupportedError) {
 *     alert('Please select an image file');
 *   } else if (error instanceof FileTooLargeError) {
 *     alert('Image must be under 5 MB');
 *   }
 * }
 * ```
 */
export async function fileToBase64(file: File): Promise<string> {
  if (!isImageFile(file)) throw new FileTypeNotSupportedError('Only image files are allowed.');
  if (file.size > IMG_SIZE_LIMIT_BYTES) throw new FileTooLargeError('Image exceeds 5 MB limit.');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper function to convert a Blob to base64 string
 * @param blob - The blob to convert
 * @returns Promise that resolves to the base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Compresses a base64 image string to reduce file size using canvas-based compression
 * 
 * @param b64 - The base64 string to compress (data URL format)
 * @param maxSizeKB - Maximum size in KB (default: 1024)
 * @returns Promise that resolves to the compressed base64 string (data URL format)
 * @throws {CompressionFailedError} When compression fails (canvas errors, image loading failures, or unable to meet size target)
 * 
 * @example
 * ```typescript
 * try {
 *   const originalBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
 *   const compressed = await compressBase64(originalBase64, 512); // 512KB limit
 *   // compressed will be a smaller base64 string
 * } catch (error) {
 *   if (error instanceof CompressionFailedError) {
 *     console.log('Failed to compress image:', error.message);
 *   }
 * }
 * ```
 * 
 * @note This function preserves transparency for PNG images and uses JPEG for other formats
 */
export async function compressBase64(b64: string, maxSizeKB = 1024): Promise<string> {
  const byteLimit = maxSizeKB * 1024;
  
  // Early return if already under limit
  const base64Data = b64.split(',')[1];
  if (atob(base64Data).length <= byteLimit) {
    return b64;
  }
  
  // Create canvas and image for compression
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CompressionFailedError('Failed to get canvas context');
  }
  
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Determine format (preserve alpha for PNG, use JPEG otherwise)
        const hasTransparency = b64.includes('image/png');
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        
        // Compression loop - more aggressive quality reduction
        let quality = 0.9;
        let compressed = b64;
        let attempts = 0;
        const maxAttempts = 15; // More attempts for better compression
        
        while (quality > 0.1 && attempts < maxAttempts) {
          try {
            const blob = await new Promise<Blob>((resolveBlob, rejectBlob) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) resolveBlob(blob);
                  else rejectBlob(new Error('Failed to create blob'));
                },
                format,
                quality
              );
            });
            
            compressed = await blobToBase64(blob);
            
            // Check if compressed size is under limit
            const compressedData = compressed.split(',')[1];
            if (atob(compressedData).length <= byteLimit) {
              break;
            }
            
            quality -= 0.05; // Smaller steps for finer control
            attempts++;
          } catch {
            quality -= 0.05;
            attempts++;
            continue;
          }
        }
        
        // If still too large, try reducing dimensions as last resort
        if (atob(compressed.split(',')[1]).length > byteLimit) {
          // Calculate scale factor to reduce dimensions
          const currentSize = atob(compressed.split(',')[1]).length;
          const scaleFactor = Math.sqrt(byteLimit / currentSize) * 0.9; // 10% safety margin
          
          if (scaleFactor < 0.5) { // Don't scale below 50% of original size
            throw new CompressionFailedError('Unable to compress image below limit');
          }
          
          // Resize canvas and try again
          const newWidth = Math.floor(img.width * scaleFactor);
          const newHeight = Math.floor(img.height * scaleFactor);
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          const resizedBlob = await new Promise<Blob>((resolveBlob, rejectBlob) => {
            canvas.toBlob(
              (blob) => {
                if (blob) resolveBlob(blob);
                else rejectBlob(new Error('Failed to create resized blob'));
              },
              format,
              0.8 // Use 80% quality for resized image
            );
          });
          
          compressed = await blobToBase64(resizedBlob);
          
          // Final check after resizing
          const finalData = compressed.split(',')[1];
          if (atob(finalData).length > byteLimit) {
            throw new CompressionFailedError('Unable to compress image below limit even after resizing');
          }
        }
        
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new CompressionFailedError('Failed to load image for compression'));
    };
    
    img.src = b64;
  });
}

/**
 * Converts a base64-encoded string to a data URL format for use in web applications.
 * 
 * @param base64String - The base64-encoded string to convert. Can be a raw base64 string or an existing data URL.
 * @param mimeType - The MIME type for the data URL. Defaults to 'image/png'. Common values include 'image/jpeg', 'image/gif', 'image/webp'.
 * @returns A Promise that resolves to a data URL string in the format `data:[mimeType];base64,[base64String]`
 * 
 * @example
 * ```typescript
 * // Convert base64 string to PNG data URL
 * const dataUrl = await base64ToDataUrl('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
 * // Returns: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
 * 
 * // Convert to JPEG data URL
 * const jpegUrl = await base64ToDataUrl(base64String, 'image/jpeg');
 * 
 * // If input is already a data URL, it's returned unchanged
 * const existingUrl = 'data:image/png;base64,abc123';
 * const result = await base64ToDataUrl(existingUrl);
 * console.log(result === existingUrl); // true
 * ```
 * 
 * @remarks
 * - This function is idempotent: if the input is already a data URL, it returns the string unchanged
 * - Data URLs can be used directly in `src` attributes of `<img>` tags, `background-image` CSS properties, and canvas operations
 * - The function returns a resolved Promise for consistency with other async functions in the module
 * 
 * @since 1.0.0
 */
export async function base64ToDataUrl (base64String: string, mimeType: string = 'image/png'): Promise<string> {
  // If it's already a data URL, return as is
  if (base64String.startsWith('data:')) {
      return base64String
  }
  
  // Convert base64 string to data URL format
  return Promise.resolve(`data:${mimeType};base64,${base64String}`)
}

// Note: All functions and types are already exported above
// This module provides a complete API for image processing utilities 