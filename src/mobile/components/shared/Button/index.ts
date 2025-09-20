/**
 * @fileoverview Shared Button Module - Barrel exports for the unified Button system
 * @module @/mobile/components/shared/Button
 * @version 1.1.0
 *
 * COMPONENTS:
 * - Button: Base button component with brutalist design
 * - UploadButton: Specialized button for file upload workflows
 * - NextButton: Navigation button for multi-step processes
 * - ActionButton: Try It On and Share buttons with immediate hiding functionality
 *
 * FEATURES:
 * - Consistent brutalist design system (pink #ff69b4, black borders, blue shadows)
 * - Mobile-optimized touch targets (44px+ minimum)
 * - Full accessibility compliance with ARIA support
 * - Framer Motion animations for enhanced UX
 * - Haptic feedback for mobile devices
 * - TypeScript support with comprehensive type definitions
 */

// Component imports for default export
import { Button } from './Button';
import { UploadButton } from './UploadButton';
import { NextButton } from './NextButton';
import { ActionButton } from './ActionButton';

// Component exports
export { Button } from './Button';
export { UploadButton } from './UploadButton';
export { NextButton } from './NextButton';
export { ActionButton } from './ActionButton';

// Type exports
export type {
  BaseButtonProps,
  UploadButtonProps,
  NextButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonViewType,
  NextButtonState,
  NextButtonConfig,
  ButtonAnimationConfig,
  ButtonThemeConfig,
  HapticPattern,
  HapticConfig,
  DragDropConfig,
  AccessibilityConfig,
  ButtonError,
  SharedButtonProps,
  SharedUploadButtonProps,
  SharedNextButtonProps,
  SharedButtonVariant,
  SharedButtonSize,
  SharedButtonViewType
} from './Button.types';

// ActionButton type exports
export type {
  ActionButtonProps,
  ActionButtonVariant,
  ActionButtonState,
  ActionButtonConfig,
  ActionButtonError,
  SharedActionButtonProps,
  SharedActionButtonConfig,
  SharedActionButtonState,
  SharedActionButtonVariant,
  SharedActionButtonError
} from './ActionButton.types';

// ActionButton constants and utilities
export {
  DEFAULT_ACTION_BUTTON_CONFIG,
  ACTION_BUTTON_VARIANTS,
  ACTION_BUTTON_ARIA_DESCRIPTIONS,
  ACTION_BUTTON_CSS_CLASSES,
  isActionButtonVariant,
  isActionButtonState,
  createActionButtonError,
  getActionButtonAriaLabel,
  mergeActionButtonConfig
} from './ActionButton.types';

// Default exports for convenience
export default {
  Button,
  UploadButton,
  NextButton,
  ActionButton
};