/**
 * @fileoverview UploadFit Hooks Index - Central export point for all UploadFit hooks
 * @module @/mobile/components/UploadFit/hooks
 * @version 1.0.0
 */

// Implemented hooks
export { 
  useNextButtonState, 
  type UseNextButtonStateReturn,
  type NextButtonConfig,
  NEXT_BUTTON_STATE,
  getNextButtonText,
  getNextButtonAriaLabel,
  isNextButtonState 
} from './useNextButtonState';

export {
  useSlideInAnimation,
  type UseSlideInAnimationReturn,
  type SlideInConfig,
  type SlideDirection,
  SLIDE_DIRECTION,
  createSlideInClasses,
  getSlideTransform,
  supportsAnimations
} from './useSlideInAnimation';

export {
  useNavigateToTryOn,
  type UseNavigateToTryOnReturn,
  type NavigationConfig,
  type NavigationState,
  type NavigationError,
  NAVIGATION_STATE,
  isRetryableNavigationError,
  getNavigationErrorMessage,
  createRetryNavigation
} from './useNavigateToTryOn';

// Hooks will be exported here as they are implemented
// export { useFitUpload } from './useFitUpload';
// export { useImageProcessing } from './useImageProcessing';
// export { useFileValidation } from './useFileValidation';