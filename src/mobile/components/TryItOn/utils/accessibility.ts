/**
 * @fileoverview Accessibility Utilities for Try It On Component
 * @module @/mobile/components/TryItOn/utils/accessibility
 * @version 1.0.0
 *
 * This module provides comprehensive accessibility utilities for the Try It On
 * workflow, including ARIA live region management, screen reader announcements,
 * and keyboard navigation support.
 */

import type { TryItOnViewState, TryItOnError } from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Accessibility announcement priority levels
 */
export type AnnouncementPriority = 'off' | 'polite' | 'assertive';

/**
 * Accessibility configuration for Try It On workflow
 */
export interface AccessibilityConfig {
  /** Enable accessibility announcements */
  enableAnnouncements: boolean;
  /** Default announcement priority */
  defaultPriority: AnnouncementPriority;
  /** Announcement delay in milliseconds */
  announcementDelay: number;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts: boolean;
  /** Focus management settings */
  focusManagement: {
    /** Return focus to trigger element after completion */
    returnFocus: boolean;
    /** Focus button after state changes */
    autoFocus: boolean;
  };
}

/**
 * ARIA live region manager
 */
export interface AriaLiveRegion {
  /** Announce message to screen readers */
  announce: (message: string, priority?: AnnouncementPriority) => void;
  /** Clear current announcements */
  clear: () => void;
  /** Destroy live region */
  destroy: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enableAnnouncements: true,
  defaultPriority: 'polite',
  announcementDelay: 500,
  enableKeyboardShortcuts: true,
  focusManagement: {
    returnFocus: true,
    autoFocus: false
  }
};

/**
 * Screen reader messages for each state
 */
export const SCREEN_READER_MESSAGES = {
  initial: 'Try It On interface ready. Select the Try It On button to generate your virtual fitting.',
  processing: 'Generating your virtual try-on. This may take a few moments.',
  transformed: 'Virtual try-on completed successfully. Your result is now displayed. Select Share to share your look.',
  error: 'An error occurred during try-on generation. Select Retry to try again.',

  // Progress announcements
  progress: {
    started: 'Try-on generation started',
    midway: 'Try-on generation in progress',
    completing: 'Try-on generation almost complete',
    completed: 'Try-on generation completed'
  },

  // Action announcements
  actions: {
    tryItOnStarted: 'Starting virtual try-on generation',
    shareInitiated: 'Sharing your try-on result',
    retryAttempted: 'Retrying try-on generation',
    errorCleared: 'Error cleared, ready to try again'
  }
} as const;

/**
 * Keyboard shortcuts for Try It On workflow
 */
export const KEYBOARD_SHORTCUTS = {
  tryItOn: 'Enter',
  share: 's',
  retry: 'r',
  clearError: 'Escape'
} as const;

// =============================================================================
// ARIA LIVE REGION MANAGEMENT
// =============================================================================

/**
 * Create and manage ARIA live region for announcements
 * @param config - Accessibility configuration
 * @returns Live region manager
 */
export function createAriaLiveRegion(
  config: Partial<AccessibilityConfig> = {}
): AriaLiveRegion {
  const finalConfig = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };

  // Create live region elements
  const liveRegions = new Map<AnnouncementPriority, HTMLElement>();

  // Create polite and assertive regions
  (['polite', 'assertive'] as const).forEach(priority => {
    const element = document.createElement('div');
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    element.setAttribute('role', 'status');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    element.className = `tryiton-aria-live-${priority}`;

    document.body.appendChild(element);
    liveRegions.set(priority, element);
  });

  // Announcement queue to prevent overlapping announcements
  let announcementTimeout: NodeJS.Timeout | null = null;

  return {
    announce: (message: string, priority: AnnouncementPriority = finalConfig.defaultPriority) => {
      if (!finalConfig.enableAnnouncements || priority === 'off') {
        return;
      }

      // Clear previous timeout
      if (announcementTimeout) {
        clearTimeout(announcementTimeout);
      }

      // Announce after delay to ensure it's picked up by screen readers
      announcementTimeout = setTimeout(() => {
        const region = liveRegions.get(priority);
        if (region) {
          // Clear and set new message
          region.textContent = '';
          setTimeout(() => {
            region.textContent = message;
          }, 50);
        }
      }, finalConfig.announcementDelay);
    },

    clear: () => {
      liveRegions.forEach(region => {
        region.textContent = '';
      });

      if (announcementTimeout) {
        clearTimeout(announcementTimeout);
        announcementTimeout = null;
      }
    },

    destroy: () => {
      liveRegions.forEach(region => {
        document.body.removeChild(region);
      });
      liveRegions.clear();

      if (announcementTimeout) {
        clearTimeout(announcementTimeout);
      }
    }
  };
}

// =============================================================================
// STATE ANNOUNCEMENT HELPERS
// =============================================================================

/**
 * Get appropriate announcement for view state
 * @param viewState - Current view state
 * @param error - Current error if any
 * @returns Announcement message
 */
export function getStateAnnouncement(
  viewState: TryItOnViewState,
  error?: TryItOnError | null
): string {
  switch (viewState) {
    case 'initial':
      return SCREEN_READER_MESSAGES.initial;
    case 'processing':
      return SCREEN_READER_MESSAGES.processing;
    case 'transformed':
      return SCREEN_READER_MESSAGES.transformed;
    case 'error':
      return error?.message || SCREEN_READER_MESSAGES.error;
    default:
      return SCREEN_READER_MESSAGES.initial;
  }
}

/**
 * Get progress announcement based on percentage
 * @param progress - Progress percentage (0-100)
 * @returns Progress announcement
 */
export function getProgressAnnouncement(progress: number): string | null {
  if (progress <= 0) {
    return SCREEN_READER_MESSAGES.progress.started;
  } else if (progress >= 100) {
    return SCREEN_READER_MESSAGES.progress.completed;
  } else if (progress >= 80) {
    return SCREEN_READER_MESSAGES.progress.completing;
  } else if (progress >= 40) {
    return SCREEN_READER_MESSAGES.progress.midway;
  }

  return null; // Don't announce for every progress update
}

/**
 * Get action announcement for specific actions
 * @param action - Action type
 * @returns Action announcement
 */
export function getActionAnnouncement(
  action: 'tryItOn' | 'share' | 'retry' | 'clearError'
): string {
  switch (action) {
    case 'tryItOn':
      return SCREEN_READER_MESSAGES.actions.tryItOnStarted;
    case 'share':
      return SCREEN_READER_MESSAGES.actions.shareInitiated;
    case 'retry':
      return SCREEN_READER_MESSAGES.actions.retryAttempted;
    case 'clearError':
      return SCREEN_READER_MESSAGES.actions.errorCleared;
    default:
      return '';
  }
}

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Focus management utilities for Try It On workflow
 */
export class TryItOnFocusManager {
  private previousFocus: HTMLElement | null = null;
  private config: AccessibilityConfig;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
  }

  /**
   * Store current focus for later restoration
   */
  storeFocus(): void {
    if (this.config.focusManagement.returnFocus) {
      this.previousFocus = document.activeElement as HTMLElement;
    }
  }

  /**
   * Restore previously stored focus
   */
  restoreFocus(): void {
    if (this.config.focusManagement.returnFocus && this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }

  /**
   * Focus element by test ID
   */
  focusElement(testId: string): boolean {
    const element = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
    if (element && this.config.focusManagement.autoFocus) {
      element.focus();
      return true;
    }
    return false;
  }

  /**
   * Focus first interactive element in container
   */
  focusFirstInteractive(container: HTMLElement): boolean {
    const interactiveElements = container.querySelectorAll(
      'button, [role="button"], input, select, textarea, [tabindex="0"]'
    );

    const firstElement = interactiveElements[0] as HTMLElement;
    if (firstElement && this.config.focusManagement.autoFocus) {
      firstElement.focus();
      return true;
    }
    return false;
  }
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Keyboard event handler for Try It On shortcuts
 * @param event - Keyboard event
 * @param actions - Available actions
 * @param config - Accessibility configuration
 */
export function handleKeyboardShortcuts(
  event: KeyboardEvent,
  actions: {
    tryItOn?: () => void;
    share?: () => void;
    retry?: () => void;
    clearError?: () => void;
  },
  config: Partial<AccessibilityConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };

  if (!finalConfig.enableKeyboardShortcuts) {
    return false;
  }

  // Handle shortcuts
  switch (event.key) {
    case KEYBOARD_SHORTCUTS.tryItOn:
      if (actions.tryItOn && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        actions.tryItOn();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.share:
      if (actions.share && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        actions.share();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.retry:
      if (actions.retry && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        actions.retry();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.clearError:
      if (actions.clearError) {
        event.preventDefault();
        actions.clearError();
        return true;
      }
      break;
  }

  return false;
}

// =============================================================================
// ACCESSIBILITY VALIDATION
// =============================================================================

/**
 * Validate accessibility configuration
 * @param config - Configuration to validate
 * @returns Validation result with warnings
 */
export function validateAccessibilityConfig(
  config: Partial<AccessibilityConfig>
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (config.announcementDelay !== undefined && config.announcementDelay < 100) {
    warnings.push('Announcement delay should be at least 100ms for reliable screen reader support');
  }

  if (config.defaultPriority === 'assertive') {
    warnings.push('Using assertive priority may be disruptive to users. Consider using polite priority.');
  }

  if (config.enableAnnouncements === false) {
    warnings.push('Disabling announcements may reduce accessibility for screen reader users');
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default export with commonly used utilities
 */
export default {
  createLiveRegion: createAriaLiveRegion,
  FocusManager: TryItOnFocusManager,
  getStateAnnouncement,
  getProgressAnnouncement,
  getActionAnnouncement,
  handleKeyboardShortcuts,
  validateConfig: validateAccessibilityConfig,
  messages: SCREEN_READER_MESSAGES,
  shortcuts: KEYBOARD_SHORTCUTS
};