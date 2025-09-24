/**
 * @fileoverview Share Components - Exports for sharing functionality
 * @module @/mobile/components/Share
 * @version 1.0.0
 */

export { ShareButton } from './ShareButton';
export { SharingView } from './SharingView';
export type {
  ShareButtonProps,
  ShareButtonState,
  SharePlatform,
  ShareResult,
  ShareButtonConfig,
  SharePlatformConfig
} from './ShareButton.types';
export type { SharingViewProps } from './SharingView';
export {
  SHARE_PLATFORM_CONFIGS,
  getPlatformDisplayName,
  getPlatformIcon,
  getShareButtonAriaLabel,
  createShareResult
} from './ShareButton.types';