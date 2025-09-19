/**
 * @fileoverview Shared Progress Components Module - Barrel exports for progress-related components
 * @module @/mobile/components/shared/Progress
 * @version 1.0.0
 */

// Component exports
export { ProgressIndicator } from './ProgressIndicator';
export { ErrorDisplay } from './ErrorDisplay';

// Type exports
export type {
  BaseComponentProps,
  ProgressVariant,
  ProgressColorVariant,
  ProgressIndicatorProps,
  ErrorSeverity,
  ErrorDisplayVariant,
  ErrorDisplayProps,
  ProgressState,
  ProgressConfig,
  SharedProgressIndicatorProps,
  SharedErrorDisplayProps,
  SharedProgressState,
  SharedProgressConfig
} from './Progress.types';

// Component imports for default export
import { ProgressIndicator } from './ProgressIndicator';
import { ErrorDisplay } from './ErrorDisplay';

// Default exports for convenience
export default {
  ProgressIndicator,
  ErrorDisplay
};