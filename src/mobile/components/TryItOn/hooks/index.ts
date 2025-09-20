/**
 * @fileoverview TryItOn Hooks - Barrel exports for Try It On workflow hooks
 * @module @/mobile/components/TryItOn/hooks
 * @version 1.0.0
 *
 * This module provides centralized exports for all Try It On workflow hooks,
 * including the main useTryItOnLogic hook and any utility hooks.
 */

// Main hooks export
export { useTryItOnLogic } from './useTryItOnLogic';
export type {
  UseTryItOnLogicConfig
} from './useTryItOnLogic';

export { useImagePreloader } from './useImagePreloader';
export type {
  UseImagePreloaderConfig,
  UseImagePreloaderReturn,
  ImageLoadResult,
  ImageCacheEntry,
  ImageLoadingState
} from './useImagePreloader';

// Re-export types for convenience
export type {
  TryItOnState,
  TryItOnConfig,
  TryItOnError,
  UseTryItOnReturn,
  TryItOnViewState,
  TryItOnResult,
  TryItOnMockData
} from '../types';

// Default export for convenience
export { useTryItOnLogic as default } from './useTryItOnLogic';