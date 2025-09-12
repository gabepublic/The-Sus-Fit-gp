/**
 * @fileoverview useNavigateToTryOn - React hook for handling navigation to /m/tryon with Next.js 14
 * @module @/mobile/components/UploadFit/hooks/useNavigateToTryOn
 * @version 1.0.0
 */

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// =============================================================================
// TYPES AND INTERFACES (Task 4.4)
// =============================================================================

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  /** Target route to navigate to */
  targetRoute?: string;
  /** Whether to prefetch the route */
  enablePrefetch?: boolean;
  /** Whether to replace current history entry */
  replace?: boolean;
  /** Scroll behavior after navigation */
  scroll?: boolean;
  /** Enable navigation logging for debugging */
  enableLogging?: boolean;
  /** Callback when navigation starts */
  onNavigationStart?: () => void;
  /** Callback when navigation completes successfully */
  onNavigationSuccess?: (route: string) => void;
  /** Callback when navigation fails */
  onNavigationError?: (error: Error) => void;
}

/**
 * Navigation state enum
 */
export const NAVIGATION_STATE = {
  IDLE: 'idle',
  NAVIGATING: 'navigating',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type NavigationState = typeof NAVIGATION_STATE[keyof typeof NAVIGATION_STATE];

/**
 * Navigation error types
 */
export interface NavigationError extends Error {
  code: 'NAVIGATION_FAILED' | 'ROUTE_NOT_FOUND' | 'NETWORK_ERROR';
  route?: string;
  originalError?: Error;
}

/**
 * Navigation hook return interface
 */
export interface UseNavigateToTryOnReturn {
  /** Current navigation state */
  navigationState: NavigationState;
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Whether a React transition is pending */
  isPending: boolean;
  /** Navigation error if any */
  navigationError: NavigationError | null;
  /** Navigate to try-on page */
  navigateToTryOn: () => Promise<void>;
  /** Prefetch the try-on route */
  prefetchTryOn: () => void;
  /** Reset navigation state */
  resetNavigation: () => void;
  /** Check if route can be navigated to */
  canNavigate: boolean;
}

// =============================================================================
// DEFAULT CONFIGURATION (Task 4.4)
// =============================================================================

/**
 * Default navigation configuration
 */
const defaultConfig: Required<NavigationConfig> = {
  targetRoute: '/m/tryon',
  enablePrefetch: true,
  replace: false,
  scroll: true,
  enableLogging: false,
  onNavigationStart: () => {},
  onNavigationSuccess: () => {},
  onNavigationError: () => {}
};

// =============================================================================
// HOOK IMPLEMENTATION (Task 4.4)
// =============================================================================

/**
 * Custom hook for handling navigation to the try-on page with Next.js 14 App Router
 * 
 * Features:
 * - Next.js 14 App Router integration with useRouter
 * - Route prefetching for optimal performance
 * - Loading state management with React 18 useTransition
 * - Error handling with retry capabilities
 * - Navigation state tracking
 * - Memory leak prevention
 * - Progressive enhancement support
 * 
 * @param config Configuration options for navigation behavior
 * @returns Navigation state and controls
 * 
 * @example
 * ```typescript
 * const {
 *   isNavigating,
 *   navigateToTryOn,
 *   prefetchTryOn,
 *   navigationError
 * } = useNavigateToTryOn({
 *   enablePrefetch: true,
 *   onNavigationStart: () => console.log('Navigation started'),
 *   onNavigationSuccess: () => console.log('Navigation completed')
 * });
 * 
 * // Prefetch route on component mount
 * useEffect(() => {
 *   prefetchTryOn();
 * }, [prefetchTryOn]);
 * 
 * // Handle button click
 * const handleClick = async () => {
 *   await navigateToTryOn();
 * };
 * ```
 */
export function useNavigateToTryOn(
  config: NavigationConfig = {}
): UseNavigateToTryOnReturn {
  
  // Merge config with defaults
  const finalConfig = { ...defaultConfig, ...config };
  
  // Next.js 14 router
  const router = useRouter();
  
  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>(NAVIGATION_STATE.IDLE);
  const [navigationError, setNavigationError] = useState<NavigationError | null>(null);
  
  // React 18 transition for smooth navigation
  const [isPending, startTransition] = useTransition();

  // =============================================================================
  // NAVIGATION UTILITIES (Task 4.4)
  // =============================================================================

  /**
   * Log navigation events for debugging
   */
  const logNavigation = useCallback((event: string, details?: any) => {
    if (finalConfig.enableLogging) {
      console.log(`[NavigateToTryOn] ${event}`, details);
    }
  }, [finalConfig.enableLogging]);

  /**
   * Create navigation error
   */
  const createNavigationError = useCallback((
    code: NavigationError['code'],
    message: string,
    originalError?: Error
  ): NavigationError => {
    const error = new Error(message) as NavigationError;
    error.code = code;
    error.route = finalConfig.targetRoute;
    error.originalError = originalError;
    return error;
  }, [finalConfig.targetRoute]);

  // =============================================================================
  // PREFETCHING (Task 4.4)
  // =============================================================================

  /**
   * Prefetch the try-on route for optimal performance
   */
  const prefetchTryOn = useCallback(() => {
    if (!finalConfig.enablePrefetch) return;

    try {
      logNavigation('Prefetching route', { route: finalConfig.targetRoute });
      router.prefetch(finalConfig.targetRoute);
    } catch (error) {
      logNavigation('Prefetch failed', { error, route: finalConfig.targetRoute });
      // Prefetch failures are non-critical, don't update state
    }
  }, [router, finalConfig.targetRoute, finalConfig.enablePrefetch, logNavigation]);

  // =============================================================================
  // NAVIGATION FUNCTIONS (Task 4.4)
  // =============================================================================

  /**
   * Navigate to the try-on page with error handling
   */
  const navigateToTryOn = useCallback(async (): Promise<void> => {
    // Check if we can navigate
    if (navigationState === NAVIGATION_STATE.NAVIGATING) {
      logNavigation('Navigation already in progress, ignoring request');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      startTransition(() => {
        try {
          // Update navigation state
          setNavigationState(NAVIGATION_STATE.NAVIGATING);
          setNavigationError(null);
          
          logNavigation('Navigation started', {
            route: finalConfig.targetRoute,
            replace: finalConfig.replace,
            scroll: finalConfig.scroll
          });

          // Call navigation start callback
          finalConfig.onNavigationStart();

          // Perform navigation using Next.js 14 router
          if (finalConfig.replace) {
            router.replace(finalConfig.targetRoute, { scroll: finalConfig.scroll });
          } else {
            router.push(finalConfig.targetRoute, { scroll: finalConfig.scroll });
          }

          // Update state to success
          setNavigationState(NAVIGATION_STATE.SUCCESS);
          
          logNavigation('Navigation completed', { route: finalConfig.targetRoute });
          
          // Call success callback
          finalConfig.onNavigationSuccess(finalConfig.targetRoute);
          
          resolve();

        } catch (error) {
          // Handle navigation error
          const navigationError = createNavigationError(
            'NAVIGATION_FAILED',
            `Failed to navigate to ${finalConfig.targetRoute}`,
            error as Error
          );

          setNavigationState(NAVIGATION_STATE.ERROR);
          setNavigationError(navigationError);
          
          logNavigation('Navigation failed', { error, route: finalConfig.targetRoute });
          
          // Call error callback
          finalConfig.onNavigationError(navigationError);
          
          reject(navigationError);
        }
      });
    });
  }, [
    navigationState,
    router,
    finalConfig,
    createNavigationError,
    logNavigation
  ]);

  // =============================================================================
  // STATE MANAGEMENT (Task 4.4)
  // =============================================================================

  /**
   * Reset navigation state to idle
   */
  const resetNavigation = useCallback(() => {
    setNavigationState(NAVIGATION_STATE.IDLE);
    setNavigationError(null);
    logNavigation('Navigation state reset');
  }, [logNavigation]);

  // =============================================================================
  // COMPUTED VALUES (Task 4.4)
  // =============================================================================

  /**
   * Whether navigation is currently in progress
   */
  const isNavigating = navigationState === NAVIGATION_STATE.NAVIGATING || isPending;

  /**
   * Whether we can currently navigate (not already navigating)
   */
  const canNavigate = navigationState !== NAVIGATION_STATE.NAVIGATING && !isPending;

  // =============================================================================
  // RETURN INTERFACE (Task 4.4)
  // =============================================================================

  return {
    navigationState,
    isNavigating,
    isPending,
    navigationError,
    navigateToTryOn,
    prefetchTryOn,
    resetNavigation,
    canNavigate
  };
}

// =============================================================================
// UTILITY FUNCTIONS (Task 4.4)
// =============================================================================

/**
 * Check if navigation error is retryable
 */
export const isRetryableNavigationError = (error: NavigationError): boolean => {
  return error.code === 'NETWORK_ERROR' || error.code === 'NAVIGATION_FAILED';
};

/**
 * Get user-friendly error message
 */
export const getNavigationErrorMessage = (error: NavigationError): string => {
  switch (error.code) {
    case 'ROUTE_NOT_FOUND':
      return 'The requested page could not be found.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection and try again.';
    case 'NAVIGATION_FAILED':
      return 'Navigation failed. Please try again.';
    default:
      return 'An unexpected error occurred during navigation.';
  }
};

/**
 * Create retry function for failed navigation
 */
export const createRetryNavigation = (
  navigateToTryOn: () => Promise<void>,
  maxRetries = 3
) => {
  let retryCount = 0;
  
  const retry = async (): Promise<void> => {
    if (retryCount >= maxRetries) {
      throw new Error(`Navigation failed after ${maxRetries} retries`);
    }
    
    try {
      retryCount++;
      await navigateToTryOn();
      retryCount = 0; // Reset on success
    } catch (error) {
      if (retryCount < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry();
      }
      throw error;
    }
  };
  
  return retry;
};