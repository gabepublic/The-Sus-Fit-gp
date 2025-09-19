/**
 * @fileoverview Shared ErrorBoundary Module - Barrel exports for the unified ErrorBoundary system
 * @module @/mobile/components/shared/ErrorBoundary
 * @version 1.0.0
 */

// Component imports for default export
import { ErrorBoundary } from './ErrorBoundary';

// Component exports
export { ErrorBoundary } from './ErrorBoundary';

// Hook exports
export {
  useErrorBoundary,
  useErrorRecovery,
  useErrorBoundaryContext
} from './useErrorBoundary';

// Type exports
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorDetails,
  ErrorCategory,
  ErrorSeverity,
  EnhancedError,
  ErrorReportingConfig,
  RecoveryStrategy,
  RecoveryConfig,
  ErrorBoundaryConfig,
  ErrorBoundaryContext,
  ErrorEventType,
  ErrorEvent,
  UseErrorBoundaryResult,
  SharedErrorBoundaryProps,
  SharedErrorBoundaryState,
  SharedErrorDetails,
  SharedErrorBoundaryConfig
} from './ErrorBoundary.types';

// Default export
export default ErrorBoundary;