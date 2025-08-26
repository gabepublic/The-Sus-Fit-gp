// Comprehensive Error Handling for Try-On Mutations
// Error classification, user-friendly messages, and recovery suggestions

import { 
  FileTypeNotSupportedError,
  FileTooLargeError,
  CompressionFailedError
} from '../../utils/image';
import {
  ImageProcessingError,
  ImageDimensionError
} from './imageProcessing';
import type { TryonMutationError } from '../types/tryon.types';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  API_SERVER = 'api_server',
  IMAGE_PROCESSING = 'image_processing',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error recovery suggestions
 */
export interface ErrorRecoveryAction {
  /** Action type identifier */
  type: 'retry' | 'reduce_image_size' | 'check_connection' | 'contact_support' | 'try_different_image' | 'wait_and_retry';
  /** User-friendly description of the action */
  description: string;
  /** Whether this action can be automated */
  automated?: boolean;
  /** Estimated time to wait before retry (in seconds) */
  waitTime?: number;
}

/**
 * Comprehensive error information
 */
export interface ClassifiedError {
  /** Original error object */
  originalError: Error | TryonMutationError | unknown;
  /** Error category for handling logic */
  category: ErrorCategory;
  /** Severity level */
  severity: ErrorSeverity;
  /** User-friendly error message */
  userMessage: string;
  /** Technical details for developers */
  technicalMessage: string;
  /** Suggested recovery actions */
  recoveryActions: ErrorRecoveryAction[];
  /** Whether the error is retryable */
  retryable: boolean;
  /** Error code for programmatic handling */
  errorCode: string;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Error logging interface
 */
export interface ErrorLogger {
  logError(error: ClassifiedError, additionalContext?: Record<string, unknown>): void;
}

/**
 * Default console-based error logger
 */
export class ConsoleErrorLogger implements ErrorLogger {
  logError(error: ClassifiedError, additionalContext?: Record<string, unknown>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      category: error.category,
      severity: error.severity,
      errorCode: error.errorCode,
      userMessage: error.userMessage,
      technicalMessage: error.technicalMessage,
      retryable: error.retryable,
      originalError: error.originalError,
      context: error.context,
      additionalContext
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error('[TryOn Error]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[TryOn Warning]', logData);
        break;
      default:
        console.info('[TryOn Info]', logData);
    }
  }
}

/**
 * Global error logger instance
 */
let errorLogger: ErrorLogger = new ConsoleErrorLogger();

/**
 * Set custom error logger
 */
export function setErrorLogger(logger: ErrorLogger): void {
  errorLogger = logger;
}

/**
 * Get current error logger
 */
export function getErrorLogger(): ErrorLogger {
  return errorLogger;
}

/**
 * Classify and enhance error with user-friendly information
 */
export function classifyTryonError(error: unknown, context?: Record<string, unknown>): ClassifiedError {
  // Handle known error types
  if (error instanceof FileTypeNotSupportedError) {
    return {
      originalError: error,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      userMessage: 'Please select a valid image file (JPEG, PNG, WebP, or GIF).',
      technicalMessage: `File type validation failed: ${error.message}`,
      errorCode: 'INVALID_FILE_TYPE',
      retryable: false,
      recoveryActions: [
        {
          type: 'try_different_image',
          description: 'Select a different image file in JPEG, PNG, WebP, or GIF format'
        }
      ],
      context
    };
  }

  if (error instanceof FileTooLargeError) {
    return {
      originalError: error,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Image file is too large. Please select an image under 5MB or try compressing it.',
      technicalMessage: `File size validation failed: ${error.message}`,
      errorCode: 'FILE_TOO_LARGE',
      retryable: false,
      recoveryActions: [
        {
          type: 'reduce_image_size',
          description: 'Compress or resize your image to under 5MB'
        },
        {
          type: 'try_different_image',
          description: 'Select a smaller image file'
        }
      ],
      context
    };
  }

  if (error instanceof ImageDimensionError) {
    return {
      originalError: error,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Image dimensions are not suitable. Please use an image that is at least 512x512 pixels.',
      technicalMessage: `Image dimension validation failed: ${error.message}`,
      errorCode: 'INVALID_DIMENSIONS',
      retryable: false,
      recoveryActions: [
        {
          type: 'try_different_image',
          description: 'Select an image with dimensions of at least 512x512 pixels'
        }
      ],
      context
    };
  }

  if (error instanceof CompressionFailedError || error instanceof ImageProcessingError) {
    return {
      originalError: error,
      category: ErrorCategory.IMAGE_PROCESSING,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Unable to process the image. Please try a different image or reduce the file size.',
      technicalMessage: `Image processing failed: ${error.message}`,
      errorCode: 'IMAGE_PROCESSING_FAILED',
      retryable: false,
      recoveryActions: [
        {
          type: 'try_different_image',
          description: 'Try selecting a different image'
        },
        {
          type: 'reduce_image_size',
          description: 'Use a smaller or simpler image'
        }
      ],
      context
    };
  }

  // Handle TryonMutationError (API errors)
  if (error && typeof error === 'object' && 'error' in error) {
    const mutationError = error as TryonMutationError;
    
    // Rate limiting
    if (mutationError.status === 429) {
      return {
        originalError: error,
        category: ErrorCategory.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        technicalMessage: 'Rate limit exceeded',
        errorCode: 'RATE_LIMITED',
        retryable: true,
        recoveryActions: [
          {
            type: 'wait_and_retry',
            description: 'Wait 60 seconds and try again',
            automated: true,
            waitTime: 60
          }
        ],
        context
      };
    }

    // Server errors
    if (mutationError.status && mutationError.status >= 500) {
      return {
        originalError: error,
        category: ErrorCategory.API_SERVER,
        severity: ErrorSeverity.HIGH,
        userMessage: 'Server is temporarily unavailable. Please try again in a few moments.',
        technicalMessage: `Server error: ${mutationError.error}`,
        errorCode: 'SERVER_ERROR',
        retryable: true,
        recoveryActions: [
          {
            type: 'retry',
            description: 'Try again in a few moments',
            automated: true,
            waitTime: 30
          },
          {
            type: 'check_connection',
            description: 'Check your internet connection'
          }
        ],
        context
      };
    }

    // Client errors (400-499)
    if (mutationError.status && mutationError.status >= 400 && mutationError.status < 500) {
      return {
        originalError: error,
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'Request could not be processed. Please check your images and try again.',
        technicalMessage: `Client error: ${mutationError.error}`,
        errorCode: 'CLIENT_ERROR',
        retryable: false,
        recoveryActions: [
          {
            type: 'try_different_image',
            description: 'Try using different images'
          }
        ],
        context
      };
    }
  }

  // Handle network/timeout errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return {
        originalError: error,
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'Request timed out. Please check your connection and try again.',
        technicalMessage: `Timeout error: ${error.message}`,
        errorCode: 'REQUEST_TIMEOUT',
        retryable: true,
        recoveryActions: [
          {
            type: 'check_connection',
            description: 'Check your internet connection'
          },
          {
            type: 'retry',
            description: 'Try again with a stable connection',
            automated: true,
            waitTime: 10
          }
        ],
        context
      };
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        originalError: error,
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'Network connection issue. Please check your internet and try again.',
        technicalMessage: `Network error: ${error.message}`,
        errorCode: 'NETWORK_ERROR',
        retryable: true,
        recoveryActions: [
          {
            type: 'check_connection',
            description: 'Check your internet connection'
          },
          {
            type: 'retry',
            description: 'Try again when connection is stable',
            automated: true,
            waitTime: 15
          }
        ],
        context
      };
    }
  }

  // Unknown error fallback
  return {
    originalError: error,
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.HIGH,
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    technicalMessage: error instanceof Error ? error.message : 'Unknown error occurred',
    errorCode: 'UNKNOWN_ERROR',
    retryable: true,
    recoveryActions: [
      {
        type: 'retry',
        description: 'Try the operation again'
      },
      {
        type: 'contact_support',
        description: 'Contact support if the problem continues'
      }
    ],
    context
  };
}

/**
 * Log and classify error in one operation
 */
export function logAndClassifyError(
  error: unknown, 
  context?: Record<string, unknown>
): ClassifiedError {
  const classifiedError = classifyTryonError(error, context);
  errorLogger.logError(classifiedError, context);
  return classifiedError;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const classified = classifyTryonError(error);
  return classified.userMessage;
}

/**
 * Check if error is retryable
 */
export function isErrorRetryable(error: unknown): boolean {
  const classified = classifyTryonError(error);
  return classified.retryable;
}

/**
 * Get recovery actions for error
 */
export function getErrorRecoveryActions(error: unknown): ErrorRecoveryAction[] {
  const classified = classifyTryonError(error);
  return classified.recoveryActions;
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown): {
  title: string;
  message: string;
  actions: ErrorRecoveryAction[];
  canRetry: boolean;
} {
  const classified = classifyTryonError(error);
  
  let title: string;
  switch (classified.category) {
    case ErrorCategory.VALIDATION:
      title = 'Invalid Input';
      break;
    case ErrorCategory.NETWORK:
      title = 'Connection Issue';
      break;
    case ErrorCategory.TIMEOUT:
      title = 'Request Timed Out';
      break;
    case ErrorCategory.API_SERVER:
      title = 'Server Error';
      break;
    case ErrorCategory.IMAGE_PROCESSING:
      title = 'Image Processing Error';
      break;
    case ErrorCategory.RATE_LIMIT:
      title = 'Too Many Requests';
      break;
    default:
      title = 'Error';
  }

  return {
    title,
    message: classified.userMessage,
    actions: classified.recoveryActions,
    canRetry: classified.retryable
  };
}