/**
 * Comprehensive error handling utilities for image processing and upload operations
 * with user-friendly messaging and error classification.
 * 
 * @example
 * ```typescript
 * import { 
 *   ImageValidationError, 
 *   CompressionError, 
 *   FileProcessingError, 
 *   createUserFriendlyErrorMessage,
 *   isRetryableError,
 *   ErrorReporter
 * } from './errorHandling';
 * 
 * // Handle validation errors
 * try {
 *   await validateImage(file);
 * } catch (error) {
 *   if (error instanceof ImageValidationError) {
 *     const friendlyMessage = createUserFriendlyErrorMessage(error);
 *     showUserError(friendlyMessage);
 *   }
 * }
 * 
 * // Error reporting
 * ErrorReporter.report(error, { context: 'image-upload', userId: '123' });
 * ```
 */

import { ERROR_CODES } from './constants';

/**
 * Base interface for all application errors
 */
export interface BaseError extends Error {
  code: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Custom error class for image validation failures
 */
export class ImageValidationError extends Error implements BaseError {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly field?: string;
  public readonly value?: unknown;
  public readonly constraint?: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    field?: string,
    value?: unknown,
    constraint?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ImageValidationError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.field = field;
    this.value = value;
    this.constraint = constraint;
    this.context = context;
    
    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageValidationError);
    }
  }

  /**
   * Returns a serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      field: this.field,
      value: this.value,
      constraint: this.constraint,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Custom error class for image compression failures
 */
export class CompressionError extends Error implements BaseError {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    isRetryable = false
  ) {
    super(message);
    this.name = 'CompressionError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.isRetryable = isRetryable;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CompressionError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }
}

/**
 * Custom error class for general file processing failures
 */
export class FileProcessingError extends Error implements BaseError {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;
  public readonly isRetryable: boolean;
  public readonly category: 'network' | 'client' | 'server' | 'unknown';

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    isRetryable = false,
    category: 'network' | 'client' | 'server' | 'unknown' = 'unknown'
  ) {
    super(message);
    this.name = 'FileProcessingError';
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.isRetryable = isRetryable;
    this.category = category;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileProcessingError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      isRetryable: this.isRetryable,
      category: this.category,
      stack: this.stack,
    };
  }
}

/**
 * Error factory functions for consistent error creation
 */
export const ErrorFactory = {
  /**
   * Creates a validation error with standardized format
   */
  validation: (
    message: string,
    field?: string,
    value?: unknown,
    constraint?: string,
    context?: Record<string, unknown>
  ): ImageValidationError => {
    const code = field ? 
      ERROR_CODES.VALIDATION[field.toUpperCase() as keyof typeof ERROR_CODES.VALIDATION] || 
      ERROR_CODES.VALIDATION.INVALID_FILE_TYPE :
      ERROR_CODES.VALIDATION.INVALID_FILE_TYPE;

    return new ImageValidationError(message, code, field, value, constraint, context);
  },

  /**
   * Creates a compression error with standardized format
   */
  compression: (
    message: string,
    code?: string,
    context?: Record<string, unknown>,
    isRetryable = false
  ): CompressionError => {
    const errorCode = code || ERROR_CODES.PROCESSING.COMPRESSION_FAILED;
    return new CompressionError(message, errorCode, context, isRetryable);
  },

  /**
   * Creates a file processing error with standardized format
   */
  processing: (
    message: string,
    code?: string,
    context?: Record<string, unknown>,
    isRetryable = false,
    category: 'network' | 'client' | 'server' | 'unknown' = 'unknown'
  ): FileProcessingError => {
    const errorCode = code || ERROR_CODES.PROCESSING.COMPRESSION_FAILED;
    return new FileProcessingError(message, errorCode, context, isRetryable, category);
  },

  /**
   * Creates a timeout error
   */
  timeout: (
    operation: string,
    duration: number,
    context?: Record<string, unknown>
  ): FileProcessingError => {
    return new FileProcessingError(
      `${operation} timed out after ${duration}ms`,
      ERROR_CODES.PROCESSING.TIMEOUT_ERROR,
      { ...context, operation, duration },
      true, // Timeout errors are typically retryable
      'client'
    );
  },

  /**
   * Creates a memory error
   */
  memory: (
    message: string,
    context?: Record<string, unknown>
  ): FileProcessingError => {
    return new FileProcessingError(
      message,
      ERROR_CODES.PROCESSING.MEMORY_ERROR,
      context,
      false, // Memory errors typically aren't retryable
      'client'
    );
  },
};

/**
 * Determines if an error is retryable based on its type and characteristics
 */
export function isRetryableError(error: Error): boolean {
  // Check for explicit retryable flag
  if ('isRetryable' in error && typeof error.isRetryable === 'boolean') {
    return error.isRetryable;
  }

  // Network errors are typically retryable
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.message.includes('5') && error.message.includes('server')) {
    return true;
  }

  // Memory errors and validation errors are not retryable
  if (error instanceof ImageValidationError) {
    return false;
  }

  // Canvas/browser capability errors are not retryable
  if (error.message.includes('canvas') || error.message.includes('context')) {
    return false;
  }

  // Default to non-retryable for safety
  return false;
}

/**
 * Creates user-friendly error messages from technical errors
 */
export function createUserFriendlyErrorMessage(error: Error): string {
  // Handle validation errors
  if (error instanceof ImageValidationError) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION.NO_FILE:
        return 'Please select a file to upload.';
      case ERROR_CODES.VALIDATION.INVALID_FILE_TYPE:
        return 'Please select a valid image file (JPEG, PNG, or WebP format).';
      case ERROR_CODES.VALIDATION.FILE_TOO_LARGE:
        return 'The selected image is too large. Please choose an image under 10MB.';
      case ERROR_CODES.VALIDATION.DIMENSIONS_TOO_SMALL:
        return 'The image is too small. Please use an image at least 400×300 pixels.';
      case ERROR_CODES.VALIDATION.DIMENSIONS_TOO_LARGE:
        return 'The image is too large. Please use an image under 4096×4096 pixels.';
      default:
        return 'The selected image is not valid. Please choose a different image.';
    }
  }

  // Handle compression errors
  if (error instanceof CompressionError) {
    switch (error.code) {
      case ERROR_CODES.PROCESSING.COMPRESSION_FAILED:
        return 'Failed to process the image. Please try again or choose a different image.';
      case ERROR_CODES.PROCESSING.CANVAS_ERROR:
        return 'Your browser doesn\'t support image processing. Please try using a different browser.';
      case ERROR_CODES.PROCESSING.MEMORY_ERROR:
        return 'The image is too complex to process. Please try a smaller or simpler image.';
      case ERROR_CODES.PROCESSING.TIMEOUT_ERROR:
        return 'Image processing is taking too long. Please try a smaller image.';
      default:
        return 'Failed to process the image. Please try again.';
    }
  }

  // Handle file processing errors
  if (error instanceof FileProcessingError) {
    switch (error.category) {
      case 'network':
        return 'Network error occurred. Please check your connection and try again.';
      case 'server':
        return 'Server error occurred. Please try again in a few moments.';
      case 'client':
        switch (error.code) {
          case ERROR_CODES.PROCESSING.MEMORY_ERROR:
            return 'Not enough memory to process this image. Please try a smaller image.';
          case ERROR_CODES.PROCESSING.TIMEOUT_ERROR:
            return 'Processing took too long. Please try a smaller image.';
          default:
            return 'Failed to process the image. Please try again.';
        }
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Handle generic errors
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'The operation timed out. Please try again.';
  }

  if (error.message.includes('memory') || error.message.includes('quota')) {
    return 'Not enough memory or storage space. Please try a smaller image.';
  }

  // Fallback to sanitized error message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Error reporting utility for analytics and debugging
 */
export class ErrorReporter {
  private static errors: Array<{
    error: BaseError;
    context: Record<string, unknown>;
    timestamp: string;
  }> = [];

  /**
   * Reports an error with context for analytics
   */
  static report(
    error: Error,
    context: Record<string, unknown> = {}
  ): void {
    const baseError: BaseError = error as BaseError;
    
    // Ensure error has required properties
    if (!baseError.code) {
      (baseError as any).code = 'UNKNOWN_ERROR';
    }
    if (!baseError.timestamp) {
      (baseError as any).timestamp = new Date().toISOString();
    }

    // Store error (in production, this would send to analytics service)
    this.errors.push({
      error: baseError,
      context,
      timestamp: new Date().toISOString(),
    });

    // Limit stored errors to prevent memory leaks
    if (this.errors.length > 100) {
      this.errors.splice(0, 50); // Remove oldest 50 errors
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Reported: ${error.name}`);
      console.error('Message:', error.message);
      console.error('Code:', baseError.code);
      console.error('Context:', context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }

  /**
   * Gets recent errors for debugging
   */
  static getRecentErrors(limit = 10): Array<{
    error: BaseError;
    context: Record<string, unknown>;
    timestamp: string;
  }> {
    return this.errors.slice(-limit);
  }

  /**
   * Clears stored errors
   */
  static clear(): void {
    this.errors = [];
  }

  /**
   * Gets error statistics
   */
  static getStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByCode: Record<string, number>;
    recentErrors: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentErrors = this.errors.filter(
      ({ timestamp }) => new Date(timestamp).getTime() > oneHourAgo
    );

    const errorsByType: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};

    this.errors.forEach(({ error }) => {
      errorsByType[error.name] = (errorsByType[error.name] || 0) + 1;
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsByCode,
      recentErrors: recentErrors.length,
    };
  }
}

/**
 * Utility to wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Record<string, unknown> = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorReporter.report(error as Error, {
        ...context,
        functionName: fn.name,
        arguments: args,
      });
      throw error;
    }
  }) as T;
}

/**
 * Utility to create a retry wrapper for functions
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxAttempts = 3,
  baseDelay = 1000,
  backoffFactor = 2
): T {
  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if error is not retryable
        if (!isRetryableError(lastError)) {
          throw lastError;
        }
        
        // Don't delay on last attempt
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }) as T;
}

// Error classes are already exported above