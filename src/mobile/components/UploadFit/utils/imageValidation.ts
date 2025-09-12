/**
 * @fileoverview Image Validation Utilities - Comprehensive image file validation and error handling
 * @module @/mobile/components/UploadFit/utils/imageValidation
 * @version 1.0.0
 */

// =============================================================================
// TYPES AND INTERFACES (Task 6.5)
// =============================================================================

/**
 * Image validation configuration
 */
export interface ValidationConfig {
  /** Maximum file size in bytes (default: 50MB) */
  maxFileSize?: number;
  /** Minimum file size in bytes (default: 1KB) */
  minFileSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Minimum width in pixels */
  minWidth?: number;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum aspect ratio (width/height) */
  maxAspectRatio?: number;
  /** Minimum aspect ratio (width/height) */
  minAspectRatio?: number;
  /** Whether to validate image headers */
  validateHeaders?: boolean;
  /** Whether to check for corrupted files */
  checkCorruption?: boolean;
  /** Custom validation functions */
  customValidators?: Array<(file: File) => Promise<ValidationError | null>>;
}

/**
 * Validation error types
 */
export const VALIDATION_ERRORS = {
  INVALID_TYPE: 'invalid-type',
  FILE_TOO_LARGE: 'file-too-large',
  FILE_TOO_SMALL: 'file-too-small',
  INVALID_DIMENSIONS: 'invalid-dimensions',
  INVALID_ASPECT_RATIO: 'invalid-aspect-ratio',
  CORRUPTED_FILE: 'corrupted-file',
  INVALID_HEADER: 'invalid-header',
  UNSUPPORTED_FORMAT: 'unsupported-format',
  CUSTOM_ERROR: 'custom-error'
} as const;

export type ValidationErrorType = typeof VALIDATION_ERRORS[keyof typeof VALIDATION_ERRORS];

/**
 * Validation error interface
 */
export interface ValidationError {
  /** Error type */
  type: ValidationErrorType;
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Additional error details */
  details?: any;
  /** File that caused the error */
  file?: File;
  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Image validation result
 */
export interface ValidationResult {
  /** Whether the file is valid */
  valid: boolean;
  /** Array of validation errors (empty if valid) */
  errors: ValidationError[];
  /** Array of warnings (non-blocking issues) */
  warnings: ValidationError[];
  /** Image metadata extracted during validation */
  metadata?: ImageMetadata;
  /** Validation time in milliseconds */
  validationTime: number;
}

/**
 * Image metadata extracted during validation
 */
export interface ImageMetadata {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** Aspect ratio (width/height) */
  aspectRatio: number;
  /** Estimated memory usage when decoded */
  memoryUsage: number;
  /** Color depth (bits per pixel) */
  colorDepth?: number;
  /** Whether image has transparency */
  hasTransparency?: boolean;
  /** EXIF orientation if available */
  orientation?: number;
  /** Creation date if available */
  dateCreated?: Date;
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  /** Results for each file */
  results: ValidationResult[];
  /** Overall statistics */
  stats: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    totalSize: number;
    averageValidationTime: number;
  };
  /** Combined errors from all files */
  allErrors: ValidationError[];
}

// =============================================================================
// SUPPORTED FORMATS AND LIMITS (Task 6.5)
// =============================================================================

/**
 * Default supported image formats
 */
export const DEFAULT_SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
] as const;

/**
 * File signature (magic bytes) for format validation
 */
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46],
  'image/bmp': [0x42, 0x4D],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'image/tiff': [0x49, 0x49, 0x2A, 0x00], // Little-endian TIFF
  'image/svg+xml': [0x3C, 0x3F, 0x78, 0x6D, 0x6C] // <?xml
} as const;

/**
 * Default validation limits
 */
export const DEFAULT_LIMITS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  minFileSize: 1024, // 1KB
  maxWidth: 8192,
  maxHeight: 8192,
  minWidth: 1,
  minHeight: 1,
  maxAspectRatio: 10,
  minAspectRatio: 0.1,
  maxMemoryUsage: 200 * 1024 * 1024 // 200MB when decoded
} as const;

// =============================================================================
// CORE VALIDATION FUNCTIONS (Task 6.5)
// =============================================================================

/**
 * Validate single image file with comprehensive checks
 * 
 * Features:
 * - File type and size validation
 * - Image dimension analysis
 * - Aspect ratio checking
 * - File header validation
 * - Corruption detection
 * - Memory usage estimation
 * - Custom validation support
 * - Detailed error reporting
 * 
 * @param file Image file to validate
 * @param config Validation configuration
 * @returns Promise resolving to validation result
 * 
 * @example
 * ```typescript
 * const result = await validateImage(file, {
 *   maxFileSize: 10 * 1024 * 1024, // 10MB
 *   maxWidth: 4096,
 *   maxHeight: 4096,
 *   allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
 *   validateHeaders: true
 * });
 * 
 * if (!result.valid) {
 *   console.log('Validation errors:', result.errors);
 *   result.errors.forEach(error => {
 *     console.log(`${error.type}: ${error.message}`);
 *     if (error.suggestions) {
 *       console.log('Suggestions:', error.suggestions);
 *     }
 *   });
 * }
 * ```
 */
export async function validateImage(
  file: File,
  config: ValidationConfig = {}
): Promise<ValidationResult> {
  const startTime = performance.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  try {
    // Merge with defaults
    const finalConfig: Required<ValidationConfig> = {
      maxFileSize: DEFAULT_LIMITS.maxFileSize,
      minFileSize: DEFAULT_LIMITS.minFileSize,
      allowedTypes: [...DEFAULT_SUPPORTED_FORMATS],
      maxWidth: DEFAULT_LIMITS.maxWidth,
      maxHeight: DEFAULT_LIMITS.maxHeight,
      minWidth: DEFAULT_LIMITS.minWidth,
      minHeight: DEFAULT_LIMITS.minHeight,
      maxAspectRatio: DEFAULT_LIMITS.maxAspectRatio,
      minAspectRatio: DEFAULT_LIMITS.minAspectRatio,
      validateHeaders: true,
      checkCorruption: true,
      customValidators: [],
      ...config
    };

    // Basic file validation
    const basicErrors = await validateBasicFile(file, finalConfig);
    errors.push(...basicErrors);

    // Header validation
    if (finalConfig.validateHeaders) {
      const headerErrors = await validateFileHeaders(file);
      errors.push(...headerErrors);
    }

    // Image dimensions and metadata
    let metadata: ImageMetadata | undefined;
    try {
      metadata = await extractImageMetadata(file);
      
      // Validate dimensions
      const dimensionErrors = validateDimensions(metadata, finalConfig);
      errors.push(...dimensionErrors);

      // Validate aspect ratio
      const aspectRatioErrors = validateAspectRatio(metadata, finalConfig);
      errors.push(...aspectRatioErrors);

      // Check memory usage
      const memoryWarnings = checkMemoryUsage(metadata);
      warnings.push(...memoryWarnings);

    } catch (error) {
      errors.push({
        type: VALIDATION_ERRORS.CORRUPTED_FILE,
        message: 'Unable to read image metadata - file may be corrupted',
        code: 'METADATA_READ_ERROR',
        file,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        suggestions: [
          'Check if the file is corrupted',
          'Try re-saving the image from the original source',
          'Verify the file is a valid image format'
        ]
      });
    }

    // Corruption check
    if (finalConfig.checkCorruption && metadata) {
      const corruptionErrors = await checkImageCorruption(file, metadata);
      errors.push(...corruptionErrors);
    }

    // Custom validators
    for (const validator of finalConfig.customValidators) {
      try {
        const customError = await validator(file);
        if (customError) {
          errors.push(customError);
        }
      } catch (error) {
        errors.push({
          type: VALIDATION_ERRORS.CUSTOM_ERROR,
          message: 'Custom validation failed',
          code: 'CUSTOM_VALIDATOR_ERROR',
          file,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    const validationTime = performance.now() - startTime;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
      validationTime
    };

  } catch (error) {
    const validationTime = performance.now() - startTime;
    
    return {
      valid: false,
      errors: [{
        type: VALIDATION_ERRORS.CUSTOM_ERROR,
        message: 'Validation process failed',
        code: 'VALIDATION_PROCESS_ERROR',
        file,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }],
      warnings: [],
      validationTime
    };
  }
}

/**
 * Validate multiple images in batch with progress tracking
 * 
 * @param files Array of image files to validate
 * @param config Validation configuration
 * @param onProgress Progress callback (0-1)
 * @returns Promise resolving to batch validation result
 */
export async function validateImages(
  files: File[],
  config: ValidationConfig = {},
  onProgress?: (progress: number) => void
): Promise<BatchValidationResult> {
  const results: ValidationResult[] = [];
  const allErrors: ValidationError[] = [];
  let totalValidationTime = 0;
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await validateImage(file, config);
      results.push(result);
      allErrors.push(...result.errors);
      totalValidationTime += result.validationTime;
      totalSize += file.size;
    } catch (error) {
      const failedResult: ValidationResult = {
        valid: false,
        errors: [{
          type: VALIDATION_ERRORS.CUSTOM_ERROR,
          message: 'Failed to validate image',
          code: 'BATCH_VALIDATION_ERROR',
          file,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }],
        warnings: [],
        validationTime: 0
      };
      
      results.push(failedResult);
      allErrors.push(...failedResult.errors);
    }
    
    onProgress?.((i + 1) / files.length);
  }

  const validCount = results.filter(r => r.valid).length;
  const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return {
    results,
    stats: {
      total: files.length,
      valid: validCount,
      invalid: files.length - validCount,
      warnings: warningCount,
      totalSize,
      averageValidationTime: totalValidationTime / files.length
    },
    allErrors
  };
}

// =============================================================================
// VALIDATION HELPER FUNCTIONS (Task 6.5)
// =============================================================================

/**
 * Validate basic file properties
 */
async function validateBasicFile(
  file: File,
  config: Required<ValidationConfig>
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check file size
  if (file.size > config.maxFileSize) {
    errors.push({
      type: VALIDATION_ERRORS.FILE_TOO_LARGE,
      message: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
      code: 'FILE_SIZE_EXCEEDED',
      file,
      details: { fileSize: file.size, maxFileSize: config.maxFileSize },
      suggestions: [
        'Compress the image to reduce file size',
        'Use a lower quality setting when saving',
        'Reduce image dimensions'
      ]
    });
  }

  if (file.size < config.minFileSize) {
    errors.push({
      type: VALIDATION_ERRORS.FILE_TOO_SMALL,
      message: `File size ${formatFileSize(file.size)} is below minimum required size of ${formatFileSize(config.minFileSize)}`,
      code: 'FILE_SIZE_TOO_SMALL',
      file,
      details: { fileSize: file.size, minFileSize: config.minFileSize }
    });
  }

  // Check MIME type
  if (!config.allowedTypes.includes(file.type)) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_TYPE,
      message: `File type "${file.type}" is not supported. Allowed types: ${config.allowedTypes.join(', ')}`,
      code: 'UNSUPPORTED_MIME_TYPE',
      file,
      details: { fileType: file.type, allowedTypes: config.allowedTypes },
      suggestions: [
        'Convert the image to a supported format (JPEG, PNG, WebP)',
        'Check if the file extension matches the actual file format'
      ]
    });
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push({
      type: VALIDATION_ERRORS.CORRUPTED_FILE,
      message: 'File appears to be empty or corrupted',
      code: 'EMPTY_FILE',
      file,
      suggestions: [
        'Check if the file was properly uploaded',
        'Try selecting the file again'
      ]
    });
  }

  return errors;
}

/**
 * Validate file headers using magic bytes
 */
async function validateFileHeaders(file: File): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Read first 16 bytes to check file signature
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    // Check if header matches claimed MIME type
    const expectedSignature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
    
    if (expectedSignature) {
      const matches = expectedSignature.every((byte, index) => 
        headerBytes[index] === byte
      );

      if (!matches) {
        errors.push({
          type: VALIDATION_ERRORS.INVALID_HEADER,
          message: `File header does not match claimed type "${file.type}"`,
          code: 'HEADER_MISMATCH',
          file,
          details: { 
            expectedHeader: expectedSignature,
            actualHeader: Array.from(headerBytes.slice(0, expectedSignature.length))
          },
          suggestions: [
            'Check if the file extension is correct',
            'The file may be corrupted or not a valid image',
            'Try re-saving the image in the correct format'
          ]
        });
      }
    }

  } catch (error) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_HEADER,
      message: 'Unable to read file header',
      code: 'HEADER_READ_ERROR',
      file,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  return errors;
}

/**
 * Extract image metadata
 */
async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const memoryUsage = img.width * img.height * 4; // Assume 4 bytes per pixel (RGBA)
      
      resolve({
        width: img.width,
        height: img.height,
        fileSize: file.size,
        mimeType: file.type,
        aspectRatio,
        memoryUsage
      });
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for metadata extraction'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image dimensions
 */
function validateDimensions(
  metadata: ImageMetadata,
  config: Required<ValidationConfig>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (metadata.width > config.maxWidth) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_DIMENSIONS,
      message: `Image width ${metadata.width}px exceeds maximum allowed width of ${config.maxWidth}px`,
      code: 'WIDTH_EXCEEDED',
      details: { width: metadata.width, maxWidth: config.maxWidth },
      suggestions: [
        'Resize the image to a smaller width',
        'Use image compression to reduce dimensions'
      ]
    });
  }

  if (metadata.height > config.maxHeight) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_DIMENSIONS,
      message: `Image height ${metadata.height}px exceeds maximum allowed height of ${config.maxHeight}px`,
      code: 'HEIGHT_EXCEEDED',
      details: { height: metadata.height, maxHeight: config.maxHeight },
      suggestions: [
        'Resize the image to a smaller height',
        'Use image compression to reduce dimensions'
      ]
    });
  }

  if (metadata.width < config.minWidth) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_DIMENSIONS,
      message: `Image width ${metadata.width}px is below minimum required width of ${config.minWidth}px`,
      code: 'WIDTH_TOO_SMALL',
      details: { width: metadata.width, minWidth: config.minWidth }
    });
  }

  if (metadata.height < config.minHeight) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_DIMENSIONS,
      message: `Image height ${metadata.height}px is below minimum required height of ${config.minHeight}px`,
      code: 'HEIGHT_TOO_SMALL',
      details: { height: metadata.height, minHeight: config.minHeight }
    });
  }

  return errors;
}

/**
 * Validate aspect ratio
 */
function validateAspectRatio(
  metadata: ImageMetadata,
  config: Required<ValidationConfig>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (metadata.aspectRatio > config.maxAspectRatio) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_ASPECT_RATIO,
      message: `Image aspect ratio ${metadata.aspectRatio.toFixed(2)} exceeds maximum allowed ratio of ${config.maxAspectRatio}`,
      code: 'ASPECT_RATIO_TOO_HIGH',
      details: { aspectRatio: metadata.aspectRatio, maxAspectRatio: config.maxAspectRatio },
      suggestions: [
        'Crop the image to a more balanced aspect ratio',
        'Consider using a different image orientation'
      ]
    });
  }

  if (metadata.aspectRatio < config.minAspectRatio) {
    errors.push({
      type: VALIDATION_ERRORS.INVALID_ASPECT_RATIO,
      message: `Image aspect ratio ${metadata.aspectRatio.toFixed(2)} is below minimum required ratio of ${config.minAspectRatio}`,
      code: 'ASPECT_RATIO_TOO_LOW',
      details: { aspectRatio: metadata.aspectRatio, minAspectRatio: config.minAspectRatio },
      suggestions: [
        'Crop the image to a more balanced aspect ratio',
        'Consider using a different image orientation'
      ]
    });
  }

  return errors;
}

/**
 * Check memory usage and warn if excessive
 */
function checkMemoryUsage(metadata: ImageMetadata): ValidationError[] {
  const warnings: ValidationError[] = [];

  if (metadata.memoryUsage > DEFAULT_LIMITS.maxMemoryUsage) {
    warnings.push({
      type: VALIDATION_ERRORS.CUSTOM_ERROR,
      message: `Image will use ${formatFileSize(metadata.memoryUsage)} of memory when decoded, which may impact performance`,
      code: 'HIGH_MEMORY_USAGE',
      details: { memoryUsage: metadata.memoryUsage, maxMemoryUsage: DEFAULT_LIMITS.maxMemoryUsage },
      suggestions: [
        'Consider compressing the image',
        'Reduce image dimensions',
        'Use progressive loading for large images'
      ]
    });
  }

  return warnings;
}

/**
 * Check for image corruption by attempting to decode
 */
async function checkImageCorruption(
  file: File,
  metadata: ImageMetadata
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    // Create a small canvas to test if image can be decoded
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return errors;
    }

    canvas.width = Math.min(metadata.width, 100);
    canvas.height = Math.min(metadata.height, 100);

    const img = new Image();
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Try to draw the image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Try to read pixel data
          ctx.getImageData(0, 0, 1, 1);
          
          resolve();
        } catch (error) {
          reject(new Error('Failed to decode image data'));
        }
      };
      
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = URL.createObjectURL(file);
    });

  } catch (error) {
    errors.push({
      type: VALIDATION_ERRORS.CORRUPTED_FILE,
      message: 'Image appears to be corrupted and cannot be properly decoded',
      code: 'DECODE_ERROR',
      details: { error: error instanceof Error ? error.message : 'Unknown decode error' },
      suggestions: [
        'Check if the file was properly uploaded',
        'Try re-saving the image from the original source',
        'Verify the image opens correctly in other applications'
      ]
    });
  }

  return errors;
}

// =============================================================================
// UTILITY FUNCTIONS (Task 6.5)
// =============================================================================

/**
 * Format file size for human-readable display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Create custom validator for specific requirements
 * 
 * @param validator Custom validation function
 * @returns Validation function that can be added to config
 * 
 * @example
 * ```typescript
 * const squareImageValidator = createCustomValidator(async (file) => {
 *   const metadata = await extractImageMetadata(file);
 *   if (metadata.width !== metadata.height) {
 *     return {
 *       type: VALIDATION_ERRORS.CUSTOM_ERROR,
 *       message: 'Image must be square',
 *       code: 'NOT_SQUARE'
 *     };
 *   }
 *   return null;
 * });
 * ```
 */
export function createCustomValidator(
  validator: (file: File) => Promise<ValidationError | null>
): (file: File) => Promise<ValidationError | null> {
  return validator;
}

/**
 * Get validation summary for display
 * 
 * @param result Validation result
 * @returns Human-readable summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid) {
    const warningText = result.warnings.length > 0 
      ? ` (${result.warnings.length} warnings)`
      : '';
    return `✅ Valid image${warningText}`;
  }

  const errorCount = result.errors.length;
  return `❌ Invalid image (${errorCount} error${errorCount === 1 ? '' : 's'})`;
}

/**
 * Get recommendations based on validation errors
 * 
 * @param errors Array of validation errors
 * @returns Array of actionable recommendations
 */
export function getValidationRecommendations(errors: ValidationError[]): string[] {
  const recommendations = new Set<string>();

  errors.forEach(error => {
    if (error.suggestions) {
      error.suggestions.forEach(suggestion => recommendations.add(suggestion));
    }
  });

  return Array.from(recommendations);
}

/**
 * Check if file is likely to be a valid image based on extension
 * 
 * @param filename File name to check
 * @returns Whether file appears to be an image
 */
export function isLikelyImage(filename: string): boolean {
  const imageExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', 
    '.bmp', '.tiff', '.tif', '.svg'
  ];
  
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
}

/**
 * Get optimal validation config for different use cases
 * 
 * @param useCase Intended use case
 * @returns Optimized validation configuration
 */
export function getOptimalValidationConfig(
  useCase: 'profile-picture' | 'upload-fit' | 'general-photo' | 'thumbnail'
): ValidationConfig {
  switch (useCase) {
    case 'profile-picture':
      return {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxWidth: 2048,
        maxHeight: 2048,
        minWidth: 100,
        minHeight: 100,
        maxAspectRatio: 2,
        minAspectRatio: 0.5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      };
      
    case 'upload-fit':
      return {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxWidth: 4096,
        maxHeight: 4096,
        minWidth: 400,
        minHeight: 300,
        maxAspectRatio: 2,
        minAspectRatio: 0.5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        validateHeaders: true,
        checkCorruption: true
      };
      
    case 'thumbnail':
      return {
        maxFileSize: 1 * 1024 * 1024, // 1MB
        maxWidth: 500,
        maxHeight: 500,
        minWidth: 50,
        minHeight: 50,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      };
      
    case 'general-photo':
    default:
      return {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        maxWidth: 8192,
        maxHeight: 8192,
        minWidth: 1,
        minHeight: 1,
        allowedTypes: [...DEFAULT_SUPPORTED_FORMATS],
        validateHeaders: true,
        checkCorruption: false // Skip for performance
      };
  }
}