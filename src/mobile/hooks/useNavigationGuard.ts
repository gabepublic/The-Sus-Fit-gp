/**
 * @fileoverview useNavigationGuard - Hook for managing navigation guards and unsaved changes
 * @module @/mobile/hooks/useNavigationGuard
 * @version 1.0.0
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface NavigationGuardOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Message to show in confirmation dialog */
  message?: string;
  /** Whether to enable the navigation guard */
  enabled?: boolean;
  /** Custom confirmation handler */
  onBeforeUnload?: (event: BeforeUnloadEvent) => void;
  /** Custom route change handler */
  onRouteChangeStart?: (url: string) => boolean;
}

export interface NavigationGuardReturn {
  /** Manually trigger navigation confirmation */
  confirmNavigation: (callback: () => void) => void;
  /** Check if navigation should be blocked */
  shouldBlockNavigation: () => boolean;
  /** Clear all navigation guards */
  clearGuards: () => void;
}

/**
 * Hook for managing navigation guards and preventing accidental navigation away from unsaved changes
 */
export function useNavigationGuard({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave?',
  enabled = true,
  onBeforeUnload,
  onRouteChangeStart
}: NavigationGuardOptions): NavigationGuardReturn {
  const _router = useRouter();
  const _pathname = usePathname();
  const isBlockingRef = useRef(false);

  // Handle browser navigation (refresh, close, back/forward)
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!enabled || !hasUnsavedChanges) return;

    // Custom handler
    if (onBeforeUnload) {
      onBeforeUnload(event);
      return;
    }

    // Standard browser confirmation
    event.preventDefault();
    event.returnValue = message;
    return message;
  }, [enabled, hasUnsavedChanges, message, onBeforeUnload]);

  // Handle programmatic navigation
  const handleRouteChangeStart = useCallback((url: string) => {
    if (!enabled || !hasUnsavedChanges || isBlockingRef.current) {
      return true;
    }

    // Custom handler
    if (onRouteChangeStart) {
      return onRouteChangeStart(url);
    }

    // Default confirmation
    const shouldNavigate = window.confirm(message);
    return shouldNavigate;
  }, [enabled, hasUnsavedChanges, message, onRouteChangeStart]);

  // Set up navigation guards
  useEffect(() => {
    if (!enabled) return;

    // Browser navigation guard
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Note: Next.js App Router doesn't have a built-in route change event
    // We'll need to intercept navigation at the component level

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, handleBeforeUnload]);

  // Manually trigger navigation confirmation
  const confirmNavigation = useCallback((callback: () => void) => {
    if (!enabled || !hasUnsavedChanges) {
      callback();
      return;
    }

    const shouldProceed = handleRouteChangeStart('manual');
    if (shouldProceed) {
      isBlockingRef.current = true;
      callback();
      // Reset blocking flag after navigation
      setTimeout(() => {
        isBlockingRef.current = false;
      }, 100);
    }
  }, [enabled, hasUnsavedChanges, handleRouteChangeStart]);

  // Check if navigation should be blocked
  const shouldBlockNavigation = useCallback(() => {
    return enabled && hasUnsavedChanges && !isBlockingRef.current;
  }, [enabled, hasUnsavedChanges]);

  // Clear all guards
  const clearGuards = useCallback(() => {
    isBlockingRef.current = true;
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

  return {
    confirmNavigation,
    shouldBlockNavigation,
    clearGuards
  };
}

export default useNavigationGuard;