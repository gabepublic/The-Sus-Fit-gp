/**
 * @fileoverview File Validation Utilities for UploadFit
 * @module @/mobile/components/UploadFit/utils/fileValidation
 * @version 1.0.0
 */

import type {
  UploadConfig,
  ImageValidationResult,
  OrientationValidationResult,
  ImageOrientation,
  ValidationFunction,
  FileSizeUnit
} from '../types';

import {
  DEFAULT_UPLOAD_CONFIG,
  IMAGE_ORIENTATION,
  PORTRAIT_REQUIREMENTS,
  detectImageOrientation,
  meetsPortraitRequirements
} from '../types';

/**
 * Validates file size against configuration limits
 * 
 * @param file File to validate
 * @param maxSize Maximum allowed file size in bytes
 * @returns Validation result
 */
export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Validates file type against allowed MIME types
 * 
 * @param file File to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns Whether file type is valid
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Formats file size to human-readable string
 * 
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): FileSizeUnit => {
  if (bytes === 0) return '0B' as FileSizeUnit;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'] as const;

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
  return `${size}${sizes[i]}` as FileSizeUnit;
};

/**
 * Gets image dimensions from a file
 * 
 * @param file Image file to analyze
 * @returns Promise resolving to image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension analysis'));
    };

    img.src = url;
  });
};

/**
 * Comprehensive file validation function
 * 
 * @param file File to validate
 * @param config Upload configuration
 * @returns Basic validation result
 */
export const validateFile = (file: File, config: UploadConfig = DEFAULT_UPLOAD_CONFIG): ImageValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // File size validation
  if (!validateFileSize(file, config.maxFileSize)) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(config.maxFileSize)})`
    );
  }

  // File type validation
  if (!validateFileType(file, config.allowedTypes)) {
    errors.push(
      `File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
    );
  }

  // File name validation
  if (!file.name || file.name.trim() === '') {
    warnings.push('File has no name or empty name');
  }

  // Check for potentially corrupted files
  if (file.size === 0) {
    errors.push('File appears to be empty or corrupted');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates image orientation and portrait requirements
 * 
 * @param file Image file to validate
 * @param config Upload configuration
 * @returns Promise resolving to orientation validation result
 */
export const validateOrientation = async (
  file: File, 
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<OrientationValidationResult> => {
  const baseValidation = validateFile(file, config);
  const orientationFeedback: string[] = [];

  try {
    const { width, height } = await getImageDimensions(file);
    const orientation = detectImageOrientation(width, height);
    const aspectRatio = width / height;
    
    // Check if orientation is allowed
    const allowedOrientations = config.allowedOrientations || [IMAGE_ORIENTATION.PORTRAIT];
    const orientationAllowed = allowedOrientations.includes(orientation);
    
    if (!orientationAllowed) {
      baseValidation.errors.push(
        `Image orientation "${orientation}" is not allowed. Required: ${allowedOrientations.join(' or ')}`
      );
    }

    // Portrait-specific validation
    if (config.enforcePortraitOrientation && orientation !== IMAGE_ORIENTATION.PORTRAIT) {
      baseValidation.errors.push(
        'Portrait orientation is required for fit uploads. Please rotate your image and try again.'
      );
      orientationFeedback.push('Image must be taller than it is wide (portrait orientation)');
    }

    // Aspect ratio validation
    if (config.minAspectRatio && aspectRatio < config.minAspectRatio) {
      baseValidation.errors.push(
        `Image is too narrow. Minimum aspect ratio: ${config.minAspectRatio.toFixed(2)}, current: ${aspectRatio.toFixed(2)}`
      );
    }

    if (config.maxAspectRatio && aspectRatio > config.maxAspectRatio) {
      baseValidation.errors.push(
        `Image is too wide. Maximum aspect ratio: ${config.maxAspectRatio.toFixed(2)}, current: ${aspectRatio.toFixed(2)}`
      );
    }

    // Portrait requirements check
    const meetsRequirements = meetsPortraitRequirements(width, height);
    if (config.enforcePortraitOrientation && !meetsRequirements) {
      if (width < PORTRAIT_REQUIREMENTS.MIN_WIDTH) {
        baseValidation.errors.push(
          `Image width (${width}px) is below minimum requirement (${PORTRAIT_REQUIREMENTS.MIN_WIDTH}px)`
        );
      }
      if (height < PORTRAIT_REQUIREMENTS.MIN_HEIGHT) {
        baseValidation.errors.push(
          `Image height (${height}px) is below minimum requirement (${PORTRAIT_REQUIREMENTS.MIN_HEIGHT}px)`
        );
      }
    }

    // Provide helpful feedback
    if (orientation === IMAGE_ORIENTATION.LANDSCAPE && config.enforcePortraitOrientation) {
      orientationFeedback.push('Try rotating your image 90 degrees for better fit analysis');
    } else if (orientation === IMAGE_ORIENTATION.PORTRAIT) {
      orientationFeedback.push('Perfect! Portrait orientation is ideal for fit uploads');
    }

    return {
      ...baseValidation,
      orientation,
      aspectRatio,
      meetsOrientationRequirements: meetsRequirements,
      orientationFeedback,
      isValid: baseValidation.isValid && orientationAllowed && (!config.enforcePortraitOrientation || meetsRequirements)
    };

  } catch (error) {
    baseValidation.errors.push('Failed to analyze image orientation');
    
    return {
      ...baseValidation,
      orientation: IMAGE_ORIENTATION.SQUARE, // fallback
      aspectRatio: 1,
      meetsOrientationRequirements: false,
      orientationFeedback: ['Unable to determine image orientation'],
      isValid: false
    };
  }
};

/**
 * Combined validation function that includes both basic and orientation checks
 * 
 * @param file File to validate
 * @param config Upload configuration
 * @returns Promise resolving to complete validation result
 */
export const validateFileWithOrientation = async (
  file: File,
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<OrientationValidationResult> => {
  return validateOrientation(file, config);
};

/**
 * Batch validate multiple files
 * 
 * @param files Files to validate
 * @param config Upload configuration
 * @returns Array of validation results
 */
export const validateFiles = async (
  files: File[],
  config: UploadConfig = DEFAULT_UPLOAD_CONFIG
): Promise<OrientationValidationResult[]> => {
  return Promise.all(
    files.map(file => validateFileWithOrientation(file, config))
  );
};

/**
 * Get validation summary for multiple files
 * 
 * @param results Array of validation results
 * @returns Summary of validation results
 */
export const getValidationSummary = (results: OrientationValidationResult[]) => {
  const validFiles = results.filter(result => result.isValid);
  const invalidFiles = results.filter(result => !result.isValid);
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = results.reduce((sum, result) => sum + result.warnings.length, 0);

  return {
    totalFiles: results.length,
    validFiles: validFiles.length,
    invalidFiles: invalidFiles.length,
    totalErrors,
    totalWarnings,
    allValid: invalidFiles.length === 0,
    validationPassed: validFiles.length > 0
  };
};