/**
 * @fileoverview Shared Progress Component Types - Unified type definitions for progress indicators
 * @module @/mobile/components/shared/Progress/Progress.types
 * @version 1.0.0
 */

/**
 * Base component props interface
 */
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Progress indicator variant types
 */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Color variant types for progress indicators
 */
export type ProgressColorVariant = 'primary' | 'secondary' | 'success' | 'error';

/**
 * Progress indicator props interface
 *
 * @interface ProgressIndicatorProps
 * @extends BaseComponentProps
 * @example
 * ```tsx
 * <ProgressIndicator
 *   progress={75}
 *   variant="linear"
 *   color="primary"
 *   showPercentage={true}
 *   testId="upload-progress"
 * />
 * ```
 */
export interface ProgressIndicatorProps extends BaseComponentProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Progress bar variant */
  variant?: ProgressVariant;
  /** Color scheme */
  color?: ProgressColorVariant;
}

/**
 * Error display severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error display variant types
 */
export type ErrorDisplayVariant = 'banner' | 'modal' | 'inline' | 'toast';

/**
 * Error display props interface
 *
 * @interface ErrorDisplayProps
 * @extends BaseComponentProps
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error="Upload failed. Please try again."
 *   severity="high"
 *   variant="banner"
 *   onRetry={() => uploadFile()}
 *   onDismiss={() => clearError()}
 * />
 * ```
 */
export interface ErrorDisplayProps extends BaseComponentProps {
  /** Error message to display */
  error: string | Error | null;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Display variant */
  variant?: ErrorDisplayVariant;
  /** Whether error is dismissible */
  dismissible?: boolean;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry button text */
  retryText?: string;
  /** Dismiss button text */
  dismissText?: string;
  /** Icon to display with error */
  icon?: React.ReactNode;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Auto-dismiss timeout in milliseconds */
  autoHideDelay?: number;
  /** Additional metadata about the error */
  metadata?: Record<string, any>;
}

/**
 * Progress state interface for tracking upload progress
 */
export interface ProgressState {
  /** Current progress percentage */
  progress: number;
  /** Whether operation is in progress */
  isLoading: boolean;
  /** Current error if any */
  error: string | null;
  /** Operation start time */
  startTime?: Date;
  /** Estimated completion time */
  estimatedCompletion?: Date;
  /** Current status message */
  statusMessage?: string;
}

/**
 * Progress configuration interface
 */
export interface ProgressConfig {
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Whether to show percentage by default */
  showPercentageDefault?: boolean;
  /** Default color variant */
  defaultColor?: ProgressColorVariant;
  /** Default variant */
  defaultVariant?: ProgressVariant;
  /** Enable smooth animations */
  enableAnimations?: boolean;
  /** Update interval for progress polling */
  updateInterval?: number;
}

/**
 * Export convenience types
 */
export type {
  ProgressIndicatorProps as SharedProgressIndicatorProps,
  ErrorDisplayProps as SharedErrorDisplayProps,
  ProgressState as SharedProgressState,
  ProgressConfig as SharedProgressConfig
};