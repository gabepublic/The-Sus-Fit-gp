/**
 * @fileoverview Shared PhotoFrame Module - Barrel exports for the unified PhotoFrame component
 * @module @/mobile/components/shared/PhotoFrame
 * @version 1.0.0
 */

// Main component export
export { PhotoFrame } from './PhotoFrame';

// Type exports
export type {
  PhotoFrameProps,
  PhotoFrameViewConfig,
  PhotoFrameViewType,
  PhotoFrameState,
  AspectRatio,
  PhotoFrameInternalState,
  PhotoFrameErrorDetails,
  ConfigValidationResult,
  SharedPhotoFrameProps,
  SharedPhotoFrameViewConfig,
  SharedPhotoFrameViewType,
  SharedPhotoFrameState,
  SharedAspectRatio
} from './PhotoFrame.types';

// Configuration exports
export {
  PHOTOFRAME_VIEW_CONFIGS,
  DEFAULT_PHOTOFRAME_CONFIG,
  UPLOAD_ANGLE_CONFIG,
  UPLOAD_FIT_CONFIG,
  TRY_IT_ON_CONFIG,
  getPhotoFrameConfig,
  mergePhotoFrameConfig,
  validatePhotoFrameConfig,
  parseAspectRatio,
  getAspectRatioPadding
} from './photoframe.config';

// Constants
export { PHOTO_FRAME_STATE } from './PhotoFrame.types';

// Component import for default export
import { PhotoFrame } from './PhotoFrame';

// Default export
export default PhotoFrame;