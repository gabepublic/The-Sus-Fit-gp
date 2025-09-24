/**
 * @fileoverview Shared PhotoFrame Types - Unified type definitions for all upload views
 * @module @/mobile/components/shared/PhotoFrame/PhotoFrame.types
 * @version 1.0.0
 */

import { ReactNode } from 'react';

/**
 * Photo frame state constants
 */
export const PHOTO_FRAME_STATE = {
  EMPTY: 'empty',
  UPLOADING: 'uploading',
  LOADED: 'loaded',
  ERROR: 'error'
} as const;

export type PhotoFrameState = typeof PHOTO_FRAME_STATE[keyof typeof PHOTO_FRAME_STATE];

/**
 * View-specific configurations for PhotoFrame
 */
export type PhotoFrameViewType = 'angle' | 'fit' | 'tryon' | 'sharing';

/**
 * Aspect ratio configuration
 */
export type AspectRatio = '4:3' | '3:4' | '16:9' | '1:1' | 'auto' | 'inherit' | string;

/**
 * View-specific configuration interface
 */
export interface PhotoFrameViewConfig {
  /** Default aspect ratio for this view */
  defaultAspectRatio: AspectRatio;
  /** Placeholder image URL for empty state */
  placeholderImage: string;
  /** Upload icon URL */
  uploadIcon: string;
  /** View-specific ARIA labels */
  ariaLabels: {
    empty: string;
    uploading: string;
    loaded: string;
    error: string;
  };
  /** View-specific styling overrides */
  styleOverrides?: {
    width?: string;
    height?: string;
    placeholderTransform?: string;
  };
}

/**
 * PhotoFrame component props interface
 */
export interface PhotoFrameProps {
  /** Image URL to display */
  imageUrl?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Current frame state */
  state?: PhotoFrameState;
  /** Upload progress (0-100) */
  progress?: number;
  /** Error message to display */
  error?: string;
  /** Aspect ratio for the frame */
  aspectRatio?: AspectRatio;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** View type for configuration */
  viewType?: PhotoFrameViewType;
  /** Custom view configuration (overrides viewType) */
  customConfig?: Partial<PhotoFrameViewConfig>;

  // Event handlers
  /** Called when image loads successfully */
  onImageLoad?: () => void;
  /** Called when image fails to load */
  onImageError?: (error: Event) => void;
  /** Called when user initiates upload */
  onUpload?: (event: React.TouchEvent | React.MouseEvent | React.KeyboardEvent) => void;
  /** Called when user clicks retry */
  onRetry?: () => void;
  /** Called on touch start */
  onTouchStart?: (event: React.TouchEvent) => void;
  /** Called on touch end */
  onTouchEnd?: (event: React.TouchEvent) => void;

  // Upload configuration
  /** Accepted file types for upload */
  accept?: string;
  /** Whether to prioritize image loading */
  priority?: boolean;
  /** Optional children content */
  children?: ReactNode;

  // Styling
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Internal component state interface
 */
export interface PhotoFrameInternalState {
  /** Internal image loading state */
  internalImageState: 'loading' | 'loaded' | 'error';
  /** Whether image has loaded at least once */
  hasLoaded: boolean;
}


/**
 * Error details interface for enhanced error reporting
 */
export interface PhotoFrameErrorDetails {
  message: string;
  timestamp: Date;
  viewType?: PhotoFrameViewType;
  imageUrl?: string;
  userAgent: string;
  errorId: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Export all types for external consumption
 */
export type {
  PhotoFrameProps as SharedPhotoFrameProps,
  PhotoFrameViewConfig as SharedPhotoFrameViewConfig,
  PhotoFrameViewType as SharedPhotoFrameViewType,
  PhotoFrameState as SharedPhotoFrameState,
  AspectRatio as SharedAspectRatio
};