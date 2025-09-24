/**
 * @fileoverview PhotoFrame View Configurations - View-specific settings for Upload Angle, Upload Fit, and Try It On
 * @module @/mobile/components/shared/PhotoFrame/photoframe.config
 * @version 1.0.0
 */

import { PhotoFrameViewConfig, PhotoFrameViewType, ConfigValidationResult } from './PhotoFrame.types';

/**
 * Upload Angle view configuration
 */
const UPLOAD_ANGLE_CONFIG: PhotoFrameViewConfig = {
  defaultAspectRatio: '4:3',
  placeholderImage: '/images/zestyVogueColor.jpg',
  uploadIcon: '/images/mobile/UploadIcon.svg',
  ariaLabels: {
    empty: 'Upload area - click or press to select an angle image',
    uploading: 'Uploading angle image',
    loaded: 'Uploaded angle image',
    error: 'Error loading angle image. Click to retry.'
  },
  styleOverrides: {
    width: '70vw',
    height: '50vh'
  }
};

/**
 * Upload Fit view configuration
 */
const UPLOAD_FIT_CONFIG: PhotoFrameViewConfig = {
  defaultAspectRatio: '3:4',
  placeholderImage: '/images/ScoredGarment.jpg',
  uploadIcon: '/images/mobile/UploadIcon.svg',
  ariaLabels: {
    empty: 'Upload area - click or press to select a fit image',
    uploading: 'Uploading fit image',
    loaded: 'Uploaded fit image',
    error: 'Error loading fit image. Click to retry.'
  },
  styleOverrides: {
    width: '70vw',
    height: '50vh',
    placeholderTransform: 'translateY(-40px)'
  }
};

/**
 * Try It On view configuration
 */
const TRY_IT_ON_CONFIG: PhotoFrameViewConfig = {
  defaultAspectRatio: '3:4',
  placeholderImage: '/images/mobile/mannequin.png',
  uploadIcon: '/images/mobile/UploadIcon.svg',
  ariaLabels: {
    empty: 'Try-on area - click or press to select your image',
    uploading: 'Uploading image for try-on',
    loaded: 'Your image ready for try-on',
    error: 'Error loading try-on image. Click to retry.'
  },
  styleOverrides: {
    width: '70vw',
    height: '50vh'
  }
};

/**
 * Sharing view configuration
 *
 * This configuration is specifically for the sharing view where users
 * display and share their generated try-on results. Unlike upload views,
 * this is display-only with no upload functionality.
 */
const SHARING_CONFIG: PhotoFrameViewConfig = {
  defaultAspectRatio: '3:4',
  placeholderImage: '/images/mobile/mannequin.png',
  uploadIcon: '/images/mobile/UploadIcon.svg', // Required but not displayed
  ariaLabels: {
    empty: 'No image to share. Please generate a try-on first.',
    uploading: 'Loading your image for sharing...',
    loaded: 'Your try-on result ready to share',
    error: 'Error loading image for sharing. Please try again.'
  },
  styleOverrides: {
    width: '70vw',
    height: 'auto' // Let aspect ratio determine height for sharing layout
  }
};

/**
 * Configuration mapping for all view types
 */
export const PHOTOFRAME_VIEW_CONFIGS: Record<PhotoFrameViewType, PhotoFrameViewConfig> = {
  angle: UPLOAD_ANGLE_CONFIG,
  fit: UPLOAD_FIT_CONFIG,
  tryon: TRY_IT_ON_CONFIG,
  sharing: SHARING_CONFIG
};

/**
 * Default configuration fallback
 */
export const DEFAULT_PHOTOFRAME_CONFIG: PhotoFrameViewConfig = {
  defaultAspectRatio: '4:3',
  placeholderImage: '/images/zestyVogueColor.jpg',
  uploadIcon: '/images/mobile/UploadIcon.svg',
  ariaLabels: {
    empty: 'Upload area - click or press to select an image',
    uploading: 'Uploading image',
    loaded: 'Uploaded image',
    error: 'Error loading image. Click to retry.'
  }
};

/**
 * Get configuration for a specific view type
 */
export function getPhotoFrameConfig(viewType?: PhotoFrameViewType): PhotoFrameViewConfig {
  if (!viewType) {
    return DEFAULT_PHOTOFRAME_CONFIG;
  }

  return PHOTOFRAME_VIEW_CONFIGS[viewType] || DEFAULT_PHOTOFRAME_CONFIG;
}

/**
 * Merge custom configuration with view-specific defaults
 */
export function mergePhotoFrameConfig(
  viewType?: PhotoFrameViewType,
  customConfig?: Partial<PhotoFrameViewConfig>
): PhotoFrameViewConfig {
  const baseConfig = getPhotoFrameConfig(viewType);

  if (!customConfig) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...customConfig,
    ariaLabels: {
      ...baseConfig.ariaLabels,
      ...customConfig.ariaLabels
    },
    styleOverrides: {
      ...baseConfig.styleOverrides,
      ...customConfig.styleOverrides
    }
  };
}

/**
 * Validate PhotoFrame configuration
 */
export function validatePhotoFrameConfig(config: Partial<PhotoFrameViewConfig>): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!config.defaultAspectRatio) {
    errors.push('defaultAspectRatio is required');
  }

  if (!config.placeholderImage) {
    errors.push('placeholderImage is required');
  }

  if (!config.uploadIcon) {
    errors.push('uploadIcon is required');
  }

  if (!config.ariaLabels) {
    errors.push('ariaLabels is required');
  } else {
    const requiredLabels = ['empty', 'uploading', 'loaded', 'error'];
    for (const label of requiredLabels) {
      if (!config.ariaLabels[label as keyof typeof config.ariaLabels]) {
        errors.push(`ariaLabels.${label} is required`);
      }
    }
  }

  // Validate aspect ratio format
  if (config.defaultAspectRatio) {
    const aspectRatio = config.defaultAspectRatio;
    if (aspectRatio !== 'auto' && aspectRatio !== 'inherit') {
      const aspectRatioRegex = /^\d+:\d+$|^\d+\s*\/\s*\d+$/;
      if (!aspectRatioRegex.test(aspectRatio)) {
        warnings.push(`Invalid aspect ratio format: ${aspectRatio}. Expected format: "4:3" or "4/3"`);
      }
    }
  }

  // Validate image URLs (basic check)
  if (config.placeholderImage && !config.placeholderImage.startsWith('/') && !config.placeholderImage.startsWith('http')) {
    warnings.push('placeholderImage should be an absolute path or URL');
  }

  if (config.uploadIcon && !config.uploadIcon.startsWith('/') && !config.uploadIcon.startsWith('http')) {
    warnings.push('uploadIcon should be an absolute path or URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get aspect ratio CSS value from string
 */
export function parseAspectRatio(aspectRatio: string): string {
  if (aspectRatio === 'auto' || aspectRatio === 'inherit') {
    return aspectRatio;
  }

  if (aspectRatio.includes(':')) {
    const [width, height] = aspectRatio.split(':').map(Number);
    return `${width} / ${height}`;
  }

  return aspectRatio;
}

/**
 * Get fallback padding for browsers without aspect-ratio support
 */
export function getAspectRatioPadding(aspectRatio: string): string {
  switch (aspectRatio) {
    case '4:3':
    case '4 / 3':
      return '75%';
    case '3:4':
    case '3 / 4':
      return '133.33%';
    case '16:9':
    case '16 / 9':
      return '56.25%';
    case '1:1':
    case '1 / 1':
      return '100%';
    default:
      return '75%'; // Default to 4:3
  }
}

/**
 * Export configuration constants for external use
 */
export {
  UPLOAD_ANGLE_CONFIG,
  UPLOAD_FIT_CONFIG,
  TRY_IT_ON_CONFIG,
  SHARING_CONFIG
};