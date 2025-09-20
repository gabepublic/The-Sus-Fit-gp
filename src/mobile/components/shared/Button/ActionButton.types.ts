/**
 * @fileoverview ActionButton Types - Type definitions for Try It On and Share action buttons
 * @module @/mobile/components/shared/Button/ActionButton.types
 * @version 1.0.0
 */

import { BaseButtonProps, HapticConfig, AccessibilityConfig } from './Button.types';

/**
 * Action button variant types for Try It On workflow
 */
export type ActionButtonVariant = 'tryon' | 'share';

/**
 * Action button state for visibility and interaction management
 */
export type ActionButtonState =
  | 'hidden'      // Button is not visible
  | 'visible'     // Button is visible and interactive
  | 'processing'  // Button is processing (disabled with loading indicator)
  | 'disabled'    // Button is visible but disabled
  | 'success';    // Button action completed successfully

/**
 * Configuration for ActionButton behavior and appearance
 */
export interface ActionButtonConfig {
  /** Auto-hide button after click */
  autoHide?: boolean;
  /** Auto-hide delay in milliseconds */
  autoHideDelay?: number;
  /** Enable haptic feedback */
  enableHapticFeedback?: boolean;
  /** Custom haptic patterns */
  hapticConfig?: HapticConfig;
  /** Enable immediate hiding on click */
  immediateHide?: boolean;
  /** Show success feedback */
  showSuccessFeedback?: boolean;
  /** Success feedback duration */
  successFeedbackDuration?: number;
}

/**
 * ActionButton component props extending BaseButtonProps
 */
export interface ActionButtonProps extends Omit<BaseButtonProps, 'variant'> {
  /** Action button variant */
  variant: ActionButtonVariant;

  /** Current button state */
  state?: ActionButtonState;

  /** ActionButton configuration */
  config?: ActionButtonConfig;

  /** Progress percentage (0-100) for loading states */
  progress?: number;

  /** Success message to display */
  successMessage?: string;

  /** Icon to display (optional) */
  icon?: React.ReactNode;

  /** Whether button should be full width */
  fullWidth?: boolean;

  /** Custom accessibility configuration */
  accessibility?: AccessibilityConfig;

  // Enhanced event handlers
  /** Called when button is clicked (before any auto-hide) */
  onBeforeAction?: (variant: ActionButtonVariant) => void;

  /** Called after action is completed */
  onAfterAction?: (variant: ActionButtonVariant) => void;

  /** Called when button becomes visible */
  onShow?: () => void;

  /** Called when button becomes hidden */
  onHide?: () => void;

  /** Called when processing state changes */
  onProcessingChange?: (isProcessing: boolean) => void;
}

/**
 * Default configuration for ActionButton
 */
export const DEFAULT_ACTION_BUTTON_CONFIG: Required<ActionButtonConfig> = {
  autoHide: true,
  autoHideDelay: 0, // Immediate hide
  enableHapticFeedback: true,
  hapticConfig: {
    tap: [50], // Light tap feedback
    success: [50, 50, 100], // Success pattern
    error: [100, 50, 100] // Error pattern
  },
  immediateHide: true,
  showSuccessFeedback: false,
  successFeedbackDuration: 1000
};

/**
 * ActionButton variant configurations
 */
export const ACTION_BUTTON_VARIANTS: Record<ActionButtonVariant, {
  defaultText: string;
  ariaLabel: string;
  variant: 'primary' | 'secondary';
  icon?: string;
}> = {
  tryon: {
    defaultText: 'Try It On',
    ariaLabel: 'Generate virtual try-on preview',
    variant: 'primary',
    icon: '✨'
  },
  share: {
    defaultText: 'Share',
    ariaLabel: 'Share try-on result',
    variant: 'primary',
    icon: '📤'
  }
} as const;

/**
 * ActionButton state ARIA descriptions for accessibility
 */
export const ACTION_BUTTON_ARIA_DESCRIPTIONS: Record<ActionButtonState, string> = {
  hidden: 'Button is hidden',
  visible: 'Button is available for interaction',
  processing: 'Button is processing, please wait',
  disabled: 'Button is currently disabled',
  success: 'Action completed successfully'
} as const;

/**
 * ActionButton CSS class mappings
 */
export const ACTION_BUTTON_CSS_CLASSES = {
  base: 'action-button',
  variants: {
    tryon: 'action-button--tryon',
    share: 'action-button--share'
  },
  states: {
    hidden: 'action-button--hidden',
    visible: 'action-button--visible',
    processing: 'action-button--processing',
    disabled: 'action-button--disabled',
    success: 'action-button--success'
  },
  animations: {
    fadeIn: 'action-button--fade-in',
    fadeOut: 'action-button--fade-out',
    slideIn: 'action-button--slide-in',
    slideOut: 'action-button--slide-out',
    pulse: 'action-button--pulse'
  }
} as const;

/**
 * ActionButton error types
 */
export interface ActionButtonError {
  /** Error type */
  type: 'state' | 'animation' | 'haptic' | 'config' | 'unknown';
  /** Error message */
  message: string;
  /** Button variant that caused the error */
  variant: ActionButtonVariant;
  /** Button state when error occurred */
  state: ActionButtonState;
  /** Original error if available */
  originalError?: Error;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Type guard to check if a value is a valid ActionButtonVariant
 */
export function isActionButtonVariant(value: unknown): value is ActionButtonVariant {
  return typeof value === 'string' && ['tryon', 'share'].includes(value);
}

/**
 * Type guard to check if a value is a valid ActionButtonState
 */
export function isActionButtonState(value: unknown): value is ActionButtonState {
  return typeof value === 'string' &&
    ['hidden', 'visible', 'processing', 'disabled', 'success'].includes(value);
}

/**
 * Utility to create an ActionButtonError
 */
export function createActionButtonError(
  type: ActionButtonError['type'],
  message: string,
  variant: ActionButtonVariant,
  state: ActionButtonState,
  originalError?: Error
): ActionButtonError {
  return {
    type,
    message,
    variant,
    state,
    originalError,
    timestamp: new Date()
  };
}

/**
 * Utility to get ARIA label for ActionButton based on variant and state
 */
export function getActionButtonAriaLabel(
  variant: ActionButtonVariant,
  state: ActionButtonState,
  customLabel?: string
): string {
  if (customLabel) return customLabel;

  const baseLabel = ACTION_BUTTON_VARIANTS[variant].ariaLabel;
  const stateDescription = ACTION_BUTTON_ARIA_DESCRIPTIONS[state];

  return `${baseLabel} - ${stateDescription}`;
}

/**
 * Utility to merge ActionButton configurations
 */
export function mergeActionButtonConfig(
  userConfig?: ActionButtonConfig
): Required<ActionButtonConfig> {
  return {
    ...DEFAULT_ACTION_BUTTON_CONFIG,
    ...userConfig,
    hapticConfig: {
      ...DEFAULT_ACTION_BUTTON_CONFIG.hapticConfig,
      ...userConfig?.hapticConfig
    }
  };
}

// Export convenience types
export type {
  ActionButtonProps as SharedActionButtonProps,
  ActionButtonConfig as SharedActionButtonConfig,
  ActionButtonState as SharedActionButtonState,
  ActionButtonVariant as SharedActionButtonVariant,
  ActionButtonError as SharedActionButtonError
};