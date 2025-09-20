/**
 * @fileoverview TryItOn Utils - Barrel exports for Try It On utility functions
 * @module @/mobile/components/TryItOn/utils
 * @version 1.0.0
 *
 * This module provides centralized exports for all Try It On utility functions,
 * including mock data management and accessibility utilities.
 */

// Mock data utilities
export {
  generateMockTryItOnData,
  generateMockTryItOnResult,
  simulateDelay,
  simulateProgressUpdates,
  configureMockScenario,
  getMockConfig,
  resetMockConfig,
  updateMockConfig,
  applyMockPreset,
  shouldUseMockData,
  getMockModeInfo,
  logMockModeStatus,
  createMockWorkflowState,
  DEFAULT_MOCK_CONFIG,
  MOCK_PRESETS
} from './mockData';

export type {
  MockScenario,
  MockConfig
} from './mockData';

// Accessibility utilities
export {
  createAriaLiveRegion,
  TryItOnFocusManager,
  getStateAnnouncement,
  getProgressAnnouncement,
  getActionAnnouncement,
  handleKeyboardShortcuts,
  validateAccessibilityConfig,
  DEFAULT_ACCESSIBILITY_CONFIG,
  SCREEN_READER_MESSAGES,
  KEYBOARD_SHORTCUTS
} from './accessibility';

export type {
  AnnouncementPriority,
  AccessibilityConfig,
  AriaLiveRegion
} from './accessibility';

// Default exports for convenience
export { default as mockData } from './mockData';
export { default as accessibility } from './accessibility';