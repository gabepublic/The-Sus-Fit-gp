/**
 * @fileoverview Shared Button Module - Barrel exports for the unified Button system
 * @module @/mobile/components/shared/Button
 * @version 1.0.0
 */

// Component imports for default export
import { Button } from './Button';
import { UploadButton } from './UploadButton';
import { NextButton } from './NextButton';

// Component exports
export { Button } from './Button';
export { UploadButton } from './UploadButton';
export { NextButton } from './NextButton';

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

// Default exports for convenience
export default {
  Button,
  UploadButton,
  NextButton
};