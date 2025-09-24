/**
 * @fileoverview ShareButton Types - Platform-specific sharing button definitions
 * @module @/mobile/components/Share/ShareButton.types
 * @version 1.0.0
 */

import { BaseButtonProps, HapticConfig, AccessibilityConfig } from '../shared/Button/Button.types';

/**
 * Supported sharing platforms
 */
export type SharePlatform = 'bluesky' | 'pinterest' | 'instagram' | 'device';

/**
 * ShareButton state for interaction management
 */
export type ShareButtonState =
  | 'idle'        // Ready for interaction
  | 'processing'  // Sharing in progress
  | 'success'     // Share completed successfully
  | 'error'       // Share failed
  | 'disabled';   // Button disabled

/**
 * Share operation result
 */
export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  error?: string;
  details?: {
    url?: string;
    postId?: string;
    message?: string;
  };
}

/**
 * Platform-specific configuration
 */
export interface SharePlatformConfig {
  /** Platform display name */
  name: string;
  /** Platform icon (can be emoji, SVG, or component) */
  icon: string | React.ReactNode;
  /** Platform primary color for theming */
  color: string;
  /** Whether platform requires authentication */
  requiresAuth: boolean;
  /** Maximum image size supported (bytes) */
  maxImageSize?: number;
  /** Supported image formats */
  supportedFormats?: string[];
  /** Platform-specific sharing metadata */
  metadata?: {
    maxTitleLength?: number;
    maxDescriptionLength?: number;
    supportsHashtags?: boolean;
    defaultHashtags?: string[];
  };
}

/**
 * ShareButton configuration
 */
export interface ShareButtonConfig {
  /** Enable haptic feedback */
  enableHaptic?: boolean;
  /** Custom haptic patterns */
  hapticConfig?: HapticConfig;
  /** Show success feedback animation */
  showSuccessFeedback?: boolean;
  /** Success feedback duration (ms) */
  successFeedbackDuration?: number;
  /** Auto-reset to idle state after error */
  autoResetOnError?: boolean;
  /** Auto-reset delay (ms) */
  autoResetDelay?: number;
  /** Enable loading animation */
  enableLoadingAnimation?: boolean;
}

/**
 * ShareButton component props
 */
export interface ShareButtonProps extends Omit<BaseButtonProps, 'variant'> {
  /** Platform to share to */
  platform: SharePlatform;

  /** Current button state */
  state?: ShareButtonState;

  /** Image URL to share */
  imageUrl?: string;

  /** Share configuration */
  config?: ShareButtonConfig;

  /** Custom platform configuration override */
  platformConfig?: Partial<SharePlatformConfig>;

  /** Share metadata */
  shareData?: {
    title?: string;
    description?: string;
    hashtags?: string[];
    url?: string;
  };

  /** Custom accessibility configuration */
  accessibility?: AccessibilityConfig;

  // Event handlers
  /** Called when share is initiated */
  onShareStart?: (platform: SharePlatform) => void;

  /** Called when share completes */
  onShareComplete?: (result: ShareResult) => void;

  /** Called when share fails */
  onShareError?: (platform: SharePlatform, error: string) => void;

  /** Called for state changes */
  onStateChange?: (state: ShareButtonState, platform: SharePlatform) => void;
}

/**
 * Default configuration for ShareButton
 */
export const DEFAULT_SHARE_BUTTON_CONFIG: Required<ShareButtonConfig> = {
  enableHaptic: true,
  hapticConfig: {
    tap: [50], // Light tap feedback
    success: [50, 50, 100], // Success pattern
    error: [100, 50, 100] // Error pattern
  },
  showSuccessFeedback: true,
  successFeedbackDuration: 2000,
  autoResetOnError: true,
  autoResetDelay: 3000,
  enableLoadingAnimation: true
};

/**
 * Platform configurations
 */
export const SHARE_PLATFORM_CONFIGS: Record<SharePlatform, SharePlatformConfig> = {
  bluesky: {
    name: 'BlueSky',
    icon: '🦋',
    color: '#00B4D8',
    requiresAuth: true,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    metadata: {
      maxTitleLength: 300,
      maxDescriptionLength: 300,
      supportsHashtags: true,
      defaultHashtags: ['tryiton', 'virtualfashion', 'style']
    }
  },
  pinterest: {
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    requiresAuth: true,
    maxImageSize: 32 * 1024 * 1024, // 32MB
    supportedFormats: ['image/jpeg', 'image/png'],
    metadata: {
      maxTitleLength: 100,
      maxDescriptionLength: 500,
      supportsHashtags: true,
      defaultHashtags: ['fashion', 'style', 'outfit']
    }
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    requiresAuth: false, // Uses device sharing
    maxImageSize: 8 * 1024 * 1024, // 8MB
    supportedFormats: ['image/jpeg', 'image/png'],
    metadata: {
      maxTitleLength: 60,
      maxDescriptionLength: 200,
      supportsHashtags: true,
      defaultHashtags: ['fashion', 'ootd', 'style']
    }
  },
  device: {
    name: 'Share',
    icon: '📤',
    color: '#6B7280',
    requiresAuth: false,
    maxImageSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    metadata: {
      maxTitleLength: 200,
      maxDescriptionLength: 500,
      supportsHashtags: false,
      defaultHashtags: []
    }
  }
} as const;

/**
 * ShareButton CSS class mappings
 */
export const SHARE_BUTTON_CSS_CLASSES = {
  base: 'share-button',
  platforms: {
    bluesky: 'share-button--bluesky',
    pinterest: 'share-button--pinterest',
    instagram: 'share-button--instagram',
    device: 'share-button--device'
  },
  states: {
    idle: 'share-button--idle',
    processing: 'share-button--processing',
    success: 'share-button--success',
    error: 'share-button--error',
    disabled: 'share-button--disabled'
  }
} as const;

/**
 * ARIA descriptions for ShareButton states
 */
export const SHARE_BUTTON_ARIA_DESCRIPTIONS: Record<ShareButtonState, string> = {
  idle: 'Ready to share',
  processing: 'Sharing in progress',
  success: 'Shared successfully',
  error: 'Share failed, click to retry',
  disabled: 'Sharing not available'
} as const;

/**
 * Type guard to check if value is a valid SharePlatform
 */
export function isSharePlatform(value: unknown): value is SharePlatform {
  return typeof value === 'string' &&
    ['bluesky', 'pinterest', 'instagram', 'device'].includes(value);
}

/**
 * Type guard to check if value is a valid ShareButtonState
 */
export function isShareButtonState(value: unknown): value is ShareButtonState {
  return typeof value === 'string' &&
    ['idle', 'processing', 'success', 'error', 'disabled'].includes(value);
}

/**
 * Utility to get platform display name
 */
export function getPlatformDisplayName(platform: SharePlatform): string {
  return SHARE_PLATFORM_CONFIGS[platform].name;
}

/**
 * Utility to get platform icon
 */
export function getPlatformIcon(platform: SharePlatform): string | React.ReactNode {
  return SHARE_PLATFORM_CONFIGS[platform].icon;
}

/**
 * Utility to get ARIA label for ShareButton
 */
export function getShareButtonAriaLabel(
  platform: SharePlatform,
  state: ShareButtonState,
  customLabel?: string
): string {
  if (customLabel) return customLabel;

  const platformName = getPlatformDisplayName(platform);
  const stateDescription = SHARE_BUTTON_ARIA_DESCRIPTIONS[state];

  return `Share to ${platformName} - ${stateDescription}`;
}

/**
 * Utility to merge ShareButton configurations
 */
export function mergeShareButtonConfig(
  userConfig?: ShareButtonConfig
): Required<ShareButtonConfig> {
  return {
    ...DEFAULT_SHARE_BUTTON_CONFIG,
    ...userConfig,
    hapticConfig: {
      ...DEFAULT_SHARE_BUTTON_CONFIG.hapticConfig,
      ...userConfig?.hapticConfig
    }
  };
}

/**
 * Utility to create a ShareResult
 */
export function createShareResult(
  success: boolean,
  platform: SharePlatform,
  error?: string,
  details?: ShareResult['details']
): ShareResult {
  return {
    success,
    platform,
    error,
    details
  };
}

// Export convenience types
export type {
  ShareButtonProps as SharedShareButtonProps,
  ShareButtonConfig as SharedShareButtonConfig,
  ShareButtonState as SharedShareButtonState,
  SharePlatform as SharedSharePlatform,
  ShareResult as SharedShareResult
};