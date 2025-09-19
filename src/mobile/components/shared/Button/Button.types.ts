/**
 * @fileoverview Shared Button Types - Unified type definitions for all button variants
 * @module @/mobile/components/shared/Button/Button.types
 * @version 1.0.0
 */

import { ReactNode } from 'react';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'upload' | 'next';

/**
 * Button size types
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button view context for styling
 */
export type ButtonViewType = 'angle' | 'fit' | 'tryon' | 'generic';

/**
 * Base button component props
 */
export interface BaseButtonProps {
  /** Button content */
  children?: ReactNode;
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** View context for styling */
  viewType?: ButtonViewType;
  /** ARIA label override */
  ariaLabel?: string;

  // Event handlers
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Touch start handler */
  onTouchStart?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  /** Touch end handler */
  onTouchEnd?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  /** Key down handler */
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Upload button specific props
 */
export interface UploadButtonProps extends BaseButtonProps {
  /** File selection callback */
  onFileSelect: (file: File) => void;
  /** Accepted file types */
  accept?: string;
  /** Whether this is a redo action */
  isRedo?: boolean;
  /** Error callback */
  onError?: (error: string | Error) => void;
  /** Haptic feedback support */
  enableHapticFeedback?: boolean;
}

/**
 * Next button specific props
 */
export interface NextButtonProps extends BaseButtonProps {
  /** Upload status for state management */
  uploadStatus?: 'idle' | 'uploading' | 'complete' | 'error';
  /** Navigation configuration */
  config?: NextButtonConfig;
}

/**
 * Next button configuration
 */
export interface NextButtonConfig {
  /** Target route for navigation */
  targetRoute?: string;
  /** Enable prefetching */
  enablePrefetch?: boolean;
  /** Enable logging */
  enableLogging?: boolean;
  /** Custom success callback */
  onNavigationSuccess?: () => void;
  /** Custom error callback */
  onNavigationError?: (error: Error) => void;
}

/**
 * Button state for Next button management
 */
export type NextButtonState = 'hidden' | 'visible' | 'loading' | 'disabled';

/**
 * Button animation configuration
 */
export interface ButtonAnimationConfig {
  /** Enable press animation */
  enablePressAnimation?: boolean;
  /** Enable hover animation */
  enableHoverAnimation?: boolean;
  /** Enable slide-in animation */
  enableSlideInAnimation?: boolean;
  /** Animation duration */
  duration?: number;
  /** Animation easing */
  easing?: string;
}

/**
 * Button theme configuration
 */
export interface ButtonThemeConfig {
  /** Primary color */
  primaryColor?: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Border color */
  borderColor?: string;
  /** Shadow color */
  shadowColor?: string;
  /** Text color */
  textColor?: string;
  /** Border width */
  borderWidth?: string;
  /** Border radius */
  borderRadius?: string;
}

/**
 * Haptic feedback patterns
 */
export type HapticPattern = number | number[];

/**
 * Haptic feedback configuration
 */
export interface HapticConfig {
  /** Pattern for tap feedback */
  tap?: HapticPattern;
  /** Pattern for success feedback */
  success?: HapticPattern;
  /** Pattern for error feedback */
  error?: HapticPattern;
  /** Pattern for drag enter */
  dragEnter?: HapticPattern;
}

/**
 * Drag and drop configuration for upload buttons
 */
export interface DragDropConfig {
  /** Enable drag and drop */
  enabled?: boolean;
  /** Accepted file types for validation */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Multiple file selection */
  multiple?: boolean;
}

/**
 * Button accessibility configuration
 */
export interface AccessibilityConfig {
  /** ARIA role override */
  role?: string;
  /** ARIA describedby */
  ariaDescribedBy?: string;
  /** ARIA expanded */
  ariaExpanded?: boolean;
  /** ARIA haspopup */
  ariaHaspopup?: boolean;
  /** ARIA controls */
  ariaControls?: string;
}

/**
 * Button error types
 */
export interface ButtonError {
  /** Error type */
  type: 'validation' | 'upload' | 'navigation' | 'haptic' | 'unknown';
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Original error */
  originalError?: Error;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Export convenience types
 */
export type {
  BaseButtonProps as SharedButtonProps,
  UploadButtonProps as SharedUploadButtonProps,
  NextButtonProps as SharedNextButtonProps,
  ButtonVariant as SharedButtonVariant,
  ButtonSize as SharedButtonSize,
  ButtonViewType as SharedButtonViewType
};