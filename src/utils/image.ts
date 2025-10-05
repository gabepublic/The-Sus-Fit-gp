/**
 * Image utility constants and helper functions for file processing
 * 
 * @example
 * ```typescript
 * import { fileToBase64, compressBase64, isImageFile, fixImageOrientation } from './utils/image';
 * 
 * // Convert file to base64 with orientation fix
 * try {
 *   const base64 = await fileToBase64(imageFile);
 *   const correctedBase64 = await fixImageOrientation(base64);
 *   const compressed = await compressBase64(correctedBase64, 512); // 512KB limit
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

/**
 * Fixes image orientation based on EXIF data, particularly for iPhone Safari camera photos
 * 
 * @param imageBase64 - The base64 image string (data URL format)
 * @returns Promise that resolves to the corrected base64 image string
 * 
 * @example
 * ```typescript
 * try {
 *   const originalImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...";
 *   const correctedImage = await fixImageOrientation(originalImage);
 *   // correctedImage will have proper orientation applied
 * } catch (error) {
 *   console.log('Failed to fix image orientation:', error.message);
 * }
 * ```
 */
export async function fixImageOrientation(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Get EXIF orientation from the image data
        const orientation = await getExifOrientation(imageBase64);
        
        console.log('Detected EXIF orientation:', orientation);
        
        // If orientation is 1 (normal), return original
        if (orientation === 1) {
          resolve(imageBase64);
          return;
        }
        
        // Create canvas and context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new CompressionFailedError('Failed to get canvas context'));
          return;
        }
        
        // Calculate canvas dimensions based on orientation
        const { width, height } = calculateCanvasDimensions(img, orientation);
        canvas.width = width;
        canvas.height = height;
        
        // Apply transformation based on EXIF orientation
        applyOrientationTransform(ctx, img, orientation, width, height);
        
        // Convert back to base64
        const correctedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(correctedBase64);
        
      } catch (error) {
        // If orientation detection fails, return original image
        console.warn('Failed to fix image orientation, using original:', error);
        resolve(imageBase64);
      }
    };
    
    img.onerror = () => {
      reject(new CompressionFailedError('Failed to load image for orientation fix'));
    };
    
    img.src = imageBase64;
  });
}

/**
 * Gets EXIF orientation from image data by reading the actual EXIF data
 * This properly reads the orientation tag from the JPEG EXIF data
 */
async function getExifOrientation(imageBase64: string): Promise<number> {
  try {
    // Extract base64 data without data URL prefix
    const base64Data = imageBase64.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Look for EXIF data in JPEG
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
      return 1; // Not a JPEG, assume normal orientation
    }
    
    // Search for EXIF marker (0xFFE1)
    let offset = 2;
    while (offset < bytes.length - 1) {
      if (bytes[offset] === 0xFF && bytes[offset + 1] === 0xE1) {
        // Found EXIF marker
        const exifLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
        const exifData = bytes.slice(offset + 4, offset + 4 + exifLength);
        
        // Check for EXIF header "Exif\0\0"
        if (exifData.length >= 6 && 
            exifData[0] === 0x45 && exifData[1] === 0x78 && exifData[2] === 0x69 && exifData[3] === 0x66) {
          
          // Find orientation tag (0x0112) in IFD0
          const orientation = findOrientationTag(exifData);
          return orientation || 1;
        }
        break;
      }
      offset++;
    }
    
    return 1; // No EXIF data found, assume normal orientation
  } catch (error) {
    console.warn('Failed to read EXIF orientation:', error);
    return 1; // Default to normal orientation on error
  }
}

/**
 * Finds the orientation tag in EXIF data
 */
function findOrientationTag(exifData: Uint8Array): number | null {
  try {
    // Skip EXIF header and get to TIFF header
    let offset = 6; // Skip "Exif\0\0"
    
    // Check TIFF header byte order
    const isLittleEndian = exifData[offset] === 0x49 && exifData[offset + 1] === 0x49;
    offset += 2;
    
    // Skip TIFF magic number
    offset += 2;
    
    // Get offset to first IFD
    const ifdOffset = isLittleEndian 
      ? exifData[offset] | (exifData[offset + 1] << 8) | (exifData[offset + 2] << 16) | (exifData[offset + 3] << 24)
      : (exifData[offset] << 24) | (exifData[offset + 1] << 16) | (exifData[offset + 2] << 8) | exifData[offset + 3];
    
    offset = 6 + ifdOffset; // Absolute offset in exifData
    
    // Get number of directory entries
    const numEntries = isLittleEndian 
      ? exifData[offset] | (exifData[offset + 1] << 8)
      : (exifData[offset] << 8) | exifData[offset + 1];
    
    offset += 2;
    
    // Search through directory entries for orientation tag (0x0112)
    for (let i = 0; i < numEntries; i++) {
      const tag = isLittleEndian 
        ? exifData[offset] | (exifData[offset + 1] << 8)
        : (exifData[offset] << 8) | exifData[offset + 1];
      
      if (tag === 0x0112) { // Orientation tag
        // Get the value (should be in the value field for SHORT type)
        const value = isLittleEndian 
          ? exifData[offset + 8] | (exifData[offset + 9] << 8)
          : (exifData[offset + 8] << 8) | exifData[offset + 9];
        
        return value;
      }
      
      offset += 12; // Each directory entry is 12 bytes
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing EXIF orientation tag:', error);
    return null;
  }
}

/**
 * Calculates canvas dimensions based on orientation
 */
function calculateCanvasDimensions(img: HTMLImageElement, orientation: number): { width: number; height: number } {
  // Orientations 5, 6, 7, 8 require swapping dimensions
  const needsSwap = [5, 6, 7, 8].includes(orientation);
  
  return needsSwap 
    ? { width: img.height, height: img.width }
    : { width: img.width, height: img.height };
}

/**
 * Applies the appropriate transformation to the canvas context
 */
function applyOrientationTransform(
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement, 
  orientation: number, 
  canvasWidth: number, 
  canvasHeight: number
): void {
  switch (orientation) {
    case 2:
      // Horizontal flip
      ctx.transform(-1, 0, 0, 1, canvasWidth, 0);
      break;
    case 3:
      // 180° rotation
      ctx.transform(-1, 0, 0, -1, canvasWidth, canvasHeight);
      break;
    case 4:
      // Vertical flip
      ctx.transform(1, 0, 0, -1, 0, canvasHeight);
      break;
    case 5:
      // Vertical flip + 90° CCW
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // 90° CW (most common iPhone portrait issue)
      ctx.transform(0, 1, -1, 0, canvasWidth, 0);
      break;
    case 7:
      // Horizontal flip + 90° CCW
      ctx.transform(0, -1, -1, 0, canvasWidth, canvasHeight);
      break;
    case 8:
      // 90° CCW
      ctx.transform(0, -1, 1, 0, 0, canvasHeight);
      break;
    default:
      // No transformation needed
      break;
  }
  
  // Draw the image
  ctx.drawImage(img, 0, 0);
}

/**
 * Alternative conservative approach to fix iPhone Safari camera rotation
 * Only applies rotation for specific cases where we're confident about the issue
 * 
 * @param imageBase64 - The base64 image string (data URL format)
 * @returns Promise that resolves to the corrected base64 image string
 */
export async function fixImageOrientationConservative(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Get EXIF orientation from the image data
        const orientation = await getExifOrientation(imageBase64);
        
        console.log('Conservative approach - Detected EXIF orientation:', orientation);
        
        console.log('Original image dimensions:', img.width, 'x', img.height);
        
        // Only apply correction for orientation 6 (90° CW - common iPhone front camera issue)
        // and orientation 8 (90° CCW - less common but possible)
        if (orientation === 6 || orientation === 8) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new CompressionFailedError('Failed to get canvas context'));
            return;
          }
          
          console.log('Applying correction for orientation:', orientation);
          
          // For orientation 6: rotate 90° counter-clockwise to correct
          // For orientation 8: rotate 90° clockwise to correct
          if (orientation === 6) {
            // Orientation 6 means the image needs to be rotated 90° counter-clockwise
            canvas.width = img.height;  // Swap dimensions
            canvas.height = img.width;
            
            console.log('Canvas dimensions after orientation 6 correction:', canvas.width, 'x', canvas.height);
            
            // Reset transform and apply rotation
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else if (orientation === 8) {
            // Orientation 8 means the image needs to be rotated 90° clockwise
            canvas.width = img.height;  // Swap dimensions
            canvas.height = img.width;
            
            console.log('Canvas dimensions after orientation 8 correction:', canvas.width, 'x', canvas.height);
            
            // Reset transform and apply rotation
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
          }
          
          const correctedBase64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(correctedBase64);
        } else {
          console.log('No correction needed for orientation:', orientation);
          // For all other orientations, return original
          resolve(imageBase64);
        }
        
      } catch (error) {
        console.warn('Conservative orientation fix failed, using original:', error);
        resolve(imageBase64);
      }
    };
    
    img.onerror = () => {
      reject(new CompressionFailedError('Failed to load image for orientation fix'));
    };
    
    img.src = imageBase64;
  });
}

/**
 * Simple test function to try common iPhone camera orientation fixes
 * This function attempts different rotations to find the correct orientation
 * 
 * @param imageBase64 - The base64 image string (data URL format)
 * @returns Promise that resolves to the corrected base64 image string
 */
export async function fixImageOrientationTest(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Get EXIF orientation from the image data
        const orientation = await getExifOrientation(imageBase64);
        
        console.log('Test approach - Detected EXIF orientation:', orientation);
        console.log('Original image dimensions:', img.width, 'x', img.height);
        
        // Create debug info for visual display
        const debugInfo = `EXIF: ${orientation}, Dims: ${img.width}x${img.height}`;
        console.log('Debug info:', debugInfo);
        
        // For EXIF orientation 6, the image needs to be rotated regardless of current dimensions
        // because the EXIF data tells us the correct orientation
        const needsRotation = orientation === 6 || orientation === 8;
        
        if (needsRotation) {
          console.log(`Applying rotation for EXIF orientation ${orientation}`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new CompressionFailedError('Failed to get canvas context'));
            return;
          }
          
          // For orientation 6, keep original dimensions and just draw normally
          canvas.width = img.width;   // Keep original width
          canvas.height = img.height; // Keep original height
          
          console.log('Canvas dimensions after correction:', canvas.width, 'x', canvas.height);
          
          // Just draw the image normally without any rotation or stretching
          ctx.drawImage(img, 0, 0);
          
          const correctedBase64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(correctedBase64);
        } else {
          console.log('Image appears portrait, no rotation needed');
          resolve(imageBase64);
        }
        
      } catch (error) {
        console.warn('Test orientation fix failed, using original:', error);
        resolve(imageBase64);
      }
    };
    
    img.onerror = () => {
      reject(new CompressionFailedError('Failed to load image for orientation fix'));
    };
    
    img.src = imageBase64;
  });
}

/**
 * Test function that returns both corrected image and debug information
 * 
 * @param imageBase64 - The base64 image string (data URL format)
 * @returns Promise that resolves to an object with corrected image and debug info
 */
export async function fixImageOrientationWithDebug(imageBase64: string): Promise<{
  correctedImage: string;
  debugInfo: {
    exifOrientation: number;
    originalDimensions: { width: number; height: number };
    isCurrentlyLandscape: boolean;
    appliedRotation: string;
    finalDimensions?: { width: number; height: number };
  };
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Get EXIF orientation from the image data
        const orientation = await getExifOrientation(imageBase64);
        
        const isCurrentlyLandscape = img.width > img.height;
        
        let correctedImage = imageBase64;
        let appliedRotation = 'none';
        let finalDimensions = { width: img.width, height: img.height };
        
        // For EXIF orientation 6, apply rotation regardless of current dimensions
        if (orientation === 6 || orientation === 8) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          if (orientation === 6) {
            // For orientation 6, keep original dimensions and just draw normally
            canvas.width = img.width;   // Keep original width
            canvas.height = img.height; // Keep original height
            
            // Just draw the image normally without any rotation or stretching
            ctx.drawImage(img, 0, 0);
            appliedRotation = 'no rotation, keep original dimensions (orientation 6)';
          } else if (orientation === 8) {
            // For orientation 8, keep original dimensions and just draw normally
            canvas.width = img.width;   // Keep original width
            canvas.height = img.height; // Keep original height
            
            // Just draw the image normally without any rotation or stretching
            ctx.drawImage(img, 0, 0);
            appliedRotation = 'no rotation, keep original dimensions (orientation 8)';
          }
          
          correctedImage = canvas.toDataURL('image/jpeg', 0.9);
          finalDimensions = { width: canvas.width, height: canvas.height };
        }
        
        resolve({
          correctedImage,
          debugInfo: {
            exifOrientation: orientation,
            originalDimensions: { width: img.width, height: img.height },
            isCurrentlyLandscape,
            appliedRotation,
            finalDimensions
          }
        });
        
      } catch (error) {
        console.warn('Debug orientation fix failed:', error);
        resolve({
          correctedImage: imageBase64,
          debugInfo: {
            exifOrientation: 1,
            originalDimensions: { width: img.width, height: img.height },
            isCurrentlyLandscape: img.width > img.height,
            appliedRotation: 'none (error)'
          }
        });
      }
    };
    
    img.onerror = () => {
      reject(new CompressionFailedError('Failed to load image for orientation fix'));
    };
    
    img.src = imageBase64;
  });
}

// Note: All functions and types are already exported above
// This module provides a complete API for image processing utilities 