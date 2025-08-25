/**
 * @jest-environment jsdom
 */
import { 
  FileTypeNotSupportedError, 
  FileTooLargeError, 
  CompressionFailedError 
} from '../../../src/utils/image';
import { 
  ImageProcessingError, 
  ImageDimensionError 
} from '../../../src/business-layer/utils/imageProcessing';
import {
  classifyTryonError,
  logAndClassifyError,
  getUserFriendlyErrorMessage,
  isErrorRetryable,
  getErrorRecoveryActions,
  formatErrorForDisplay,
  setErrorLogger,
  ConsoleErrorLogger,
  ErrorCategory,
  ErrorSeverity,
  type ClassifiedError,
  type ErrorLogger
} from '../../../src/business-layer/utils/errorHandling';
import type { TryonMutationError } from '../../../src/business-layer/types/tryon.types';

describe('Error Handling System', () => {
  let mockLogger: jest.Mocked<ErrorLogger>;

  beforeEach(() => {
    mockLogger = {
      logError: jest.fn()
    };
    setErrorLogger(mockLogger);
  });

  describe('Error Classification', () => {
    it('should classify FileTypeNotSupportedError correctly', () => {
      const error = new FileTypeNotSupportedError('Invalid file type');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.VALIDATION);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
      expect(classified.errorCode).toBe('INVALID_FILE_TYPE');
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('valid image file');
      expect(classified.recoveryActions).toHaveLength(1);
      expect(classified.recoveryActions[0].type).toBe('try_different_image');
    });

    it('should classify FileTooLargeError correctly', () => {
      const error = new FileTooLargeError('File too large');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.VALIDATION);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('FILE_TOO_LARGE');
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('too large');
      expect(classified.recoveryActions).toHaveLength(2);
      expect(classified.recoveryActions[0].type).toBe('reduce_image_size');
    });

    it('should classify ImageDimensionError correctly', () => {
      const error = new ImageDimensionError('Invalid dimensions', 100, 100);
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.VALIDATION);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('INVALID_DIMENSIONS');
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('dimensions');
    });

    it('should classify ImageProcessingError correctly', () => {
      const error = new ImageProcessingError('Processing failed');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.IMAGE_PROCESSING);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('IMAGE_PROCESSING_FAILED');
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('process the image');
    });

    it('should classify CompressionFailedError correctly', () => {
      const error = new CompressionFailedError('Compression failed');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.IMAGE_PROCESSING);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('IMAGE_PROCESSING_FAILED');
      expect(classified.retryable).toBe(false);
    });

    it('should classify rate limit errors correctly', () => {
      const error: TryonMutationError = {
        error: 'Rate limited',
        status: 429
      };
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('RATE_LIMITED');
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryActions[0].type).toBe('wait_and_retry');
      expect(classified.recoveryActions[0].waitTime).toBe(60);
    });

    it('should classify server errors correctly', () => {
      const error: TryonMutationError = {
        error: 'Internal server error',
        status: 500
      };
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.API_SERVER);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.errorCode).toBe('SERVER_ERROR');
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryActions[0].type).toBe('retry');
    });

    it('should classify client errors correctly', () => {
      const error: TryonMutationError = {
        error: 'Bad request',
        status: 400
      };
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.VALIDATION);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('CLIENT_ERROR');
      expect(classified.retryable).toBe(false);
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Request timeout');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.TIMEOUT);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('REQUEST_TIMEOUT');
      expect(classified.retryable).toBe(true);
      expect(classified.recoveryActions).toContainEqual(
        expect.objectContaining({ type: 'check_connection' })
      );
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network connection failed');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.errorCode).toBe('NETWORK_ERROR');
      expect(classified.retryable).toBe(true);
    });

    it('should classify unknown errors correctly', () => {
      const error = new Error('Something unexpected happened');
      const classified = classifyTryonError(error);

      expect(classified.category).toBe(ErrorCategory.UNKNOWN);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.errorCode).toBe('UNKNOWN_ERROR');
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('unexpected error');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with classification', () => {
      const error = new Error('Test error');
      const context = { test: 'context' };
      
      const classified = logAndClassifyError(error, context);

      expect(mockLogger.logError).toHaveBeenCalledWith(
        classified,
        context
      );
    });

    it('should use default console logger when no custom logger set', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = new ConsoleErrorLogger();
      setErrorLogger(logger);

      // Test critical error
      const criticalError = classifyTryonError(new Error('Critical'));
      criticalError.severity = ErrorSeverity.CRITICAL;
      logger.logError(criticalError);
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Test medium error
      const mediumError = classifyTryonError(new Error('Medium'));
      mediumError.severity = ErrorSeverity.MEDIUM;
      logger.logError(mediumError);
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Test low error
      const lowError = classifyTryonError(new Error('Low'));
      lowError.severity = ErrorSeverity.LOW;
      logger.logError(lowError);
      expect(consoleInfoSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    it('should get user-friendly error messages', () => {
      const error = new FileTypeNotSupportedError('Invalid type');
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toContain('valid image file');
      expect(message).not.toContain('Invalid type'); // Should not expose technical message
    });

    it('should determine if errors are retryable', () => {
      const retryableError = new Error('Network error');
      const nonRetryableError = new FileTypeNotSupportedError('Invalid type');

      expect(isErrorRetryable(retryableError)).toBe(true);
      expect(isErrorRetryable(nonRetryableError)).toBe(false);
    });

    it('should get recovery actions for errors', () => {
      const error = new FileTooLargeError('Too large');
      const actions = getErrorRecoveryActions(error);

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('reduce_image_size');
      expect(actions[1].type).toBe('try_different_image');
    });

    it('should format errors for display', () => {
      const error = new Error('Network connection failed');
      const formatted = formatErrorForDisplay(error);

      expect(formatted.title).toBe('Connection Issue');
      expect(formatted.message).toContain('Network connection');
      expect(formatted.canRetry).toBe(true);
      expect(formatted.actions.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery Actions', () => {
    it('should provide appropriate recovery actions for validation errors', () => {
      const error = new FileTypeNotSupportedError('Invalid type');
      const classified = classifyTryonError(error);

      expect(classified.recoveryActions).toContainEqual(
        expect.objectContaining({
          type: 'try_different_image',
          description: expect.stringContaining('JPEG, PNG, WebP, or GIF')
        })
      );
    });

    it('should provide automated recovery actions for network errors', () => {
      const error = new Error('Network error');
      const classified = classifyTryonError(error);

      const automatedAction = classified.recoveryActions.find(
        action => action.automated === true
      );
      
      expect(automatedAction).toBeDefined();
      expect(automatedAction?.type).toBe('retry');
      expect(automatedAction?.waitTime).toBeDefined();
    });

    it('should provide wait times for rate limiting', () => {
      const error: TryonMutationError = { error: 'Rate limited', status: 429 };
      const classified = classifyTryonError(error);

      const waitAction = classified.recoveryActions.find(
        action => action.type === 'wait_and_retry'
      );

      expect(waitAction).toBeDefined();
      expect(waitAction?.waitTime).toBe(60);
    });
  });

  describe('Context Handling', () => {
    it('should include context in classified errors', () => {
      const error = new Error('Test error');
      const context = { 
        userId: '123', 
        imageCount: 2,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const classified = classifyTryonError(error, context);

      expect(classified.context).toEqual(context);
    });

    it('should handle undefined context gracefully', () => {
      const error = new Error('Test error');
      const classified = classifyTryonError(error);

      expect(classified.context).toBeUndefined();
      expect(classified.originalError).toBe(error);
    });
  });

  describe('Error Chaining', () => {
    it('should preserve original error information', () => {
      const originalError = new Error('Original message');
      originalError.stack = 'Original stack trace';
      
      const classified = classifyTryonError(originalError);

      expect(classified.originalError).toBe(originalError);
      expect(classified.technicalMessage).toContain('Original message');
    });

    it('should handle non-Error objects', () => {
      const errorObject = { message: 'Custom error', code: 'CUSTOM' };
      const classified = classifyTryonError(errorObject);

      expect(classified.originalError).toBe(errorObject);
      expect(classified.category).toBe(ErrorCategory.UNKNOWN);
    });
  });
});