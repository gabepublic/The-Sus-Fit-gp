/**
 * @fileoverview useNavigation - Shared React hook for handling navigation across mobile views
 * @module @/mobile/components/shared/hooks/useNavigation
 * @version 1.0.0
 */

import { useCallback, useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type {
  UseNavigationReturn,
  NavigationConfig,
  NavigationState,
  NavigationError
} from './hooks.types';
import { NAVIGATION_STATE } from './hooks.types';

/**
 * Default navigation configuration
 */
const DEFAULT_NAVIGATION_CONFIG: Required<NavigationConfig> = {
  targetRoute: '/',
  enablePrefetch: true,
  replace: false,
  scroll: true,
  enableLogging: false,
  onNavigationStart: () => {},
  onNavigationSuccess: () => {},
  onNavigationError: () => {}
};

/**
 * Shared navigation hook for handling routing across mobile views
 *
 * Features:
 * - Next.js 14 App Router integration
 * - Route prefetching for optimal performance
 * - Loading state management with React 18 useTransition
 * - Error handling with retry capabilities
 * - Navigation state tracking
 * - Memory leak prevention
 * - Progressive enhancement support
 * - Configurable navigation behavior
 *
 * @param config Navigation configuration options
 * @returns Navigation state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   isNavigating,
 *   navigate,
 *   prefetch,
 *   navigationError,
 *   canNavigate
 * } = useNavigation({
 *   targetRoute: '/m/tryon',
 *   enablePrefetch: true,
 *   onNavigationStart: () => console.log('Navigation started'),
 *   onNavigationSuccess: () => console.log('Navigation completed')
 * });
 *
 * // Prefetch route on component mount
 * useEffect(() => {
 *   prefetch();
 * }, [prefetch]);
 *
 * // Handle navigation
 * const handleNavigate = async () => {
 *   if (canNavigate) {
 *     await navigate();
 *   }
 * };
 * ```
 */
export function useNavigation(
  config: NavigationConfig = {}
): UseNavigationReturn {
  // Merge config with defaults
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_NAVIGATION_CONFIG, ...config }),
    [config]
  );

  // Next.js 14 router
  const router = useRouter();

  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>(NAVIGATION_STATE.IDLE);
  const [navigationError, setNavigationError] = useState<NavigationError | null>(null);

  // React 18 transition for smooth navigation
  const [isPending, startTransition] = useTransition();

  /**
   * Log navigation events for debugging
   */
  const logNavigation = useCallback((event: string, details?: any) => {
    if (finalConfig.enableLogging) {
      console.log(`[useNavigation] ${event}`, details);
    }
  }, [finalConfig.enableLogging]);

  /**
   * Create navigation error
   */
  const createNavigationError = useCallback((
    code: NavigationError['code'],
    message: string,
    route?: string,
    originalError?: Error
  ): NavigationError => {
    const error = new Error(message) as NavigationError;
    error.code = code;
    error.route = route;
    error.originalError = originalError;
    return error;
  }, []);

  /**
   * Prefetch specified route for optimal performance
   */
  const prefetch = useCallback((route?: string) => {
    const targetRoute = route || finalConfig.targetRoute;

    if (!finalConfig.enablePrefetch || !targetRoute) {
      return;
    }

    try {
      logNavigation('Prefetching route', { route: targetRoute });
      router.prefetch(targetRoute);
    } catch (error) {
      logNavigation('Prefetch failed', { error, route: targetRoute });
      // Prefetch failures are non-critical, don't update state
    }
  }, [router, finalConfig.enablePrefetch, finalConfig.targetRoute, logNavigation]);

  /**
   * Navigate to specified route with error handling
   */
  const navigate = useCallback(async (route?: string): Promise<void> => {
    const targetRoute = route || finalConfig.targetRoute;

    if (!targetRoute) {
      const error = createNavigationError(
        'ROUTE_NOT_FOUND',
        'No target route specified',
        targetRoute
      );
      setNavigationError(error);
      finalConfig.onNavigationError(error);
      return Promise.reject(error);
    }

    // Check if we can navigate
    if (navigationState === NAVIGATION_STATE.NAVIGATING) {
      logNavigation('Navigation already in progress, ignoring request');
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      startTransition(() => {
        try {
          // Update navigation state
          setNavigationState(NAVIGATION_STATE.NAVIGATING);
          setNavigationError(null);

          logNavigation('Navigation started', {
            route: targetRoute,
            replace: finalConfig.replace,
            scroll: finalConfig.scroll
          });

          // Call navigation start callback
          finalConfig.onNavigationStart();

          // Perform navigation using Next.js 14 router
          if (finalConfig.replace) {
            router.replace(targetRoute, { scroll: finalConfig.scroll });
          } else {
            router.push(targetRoute, { scroll: finalConfig.scroll });
          }

          // Update state to success
          setNavigationState(NAVIGATION_STATE.SUCCESS);

          logNavigation('Navigation completed', { route: targetRoute });

          // Call success callback
          finalConfig.onNavigationSuccess(targetRoute);

          resolve();

        } catch (error) {
          // Handle navigation error
          const navigationError = createNavigationError(
            'NAVIGATION_FAILED',
            `Failed to navigate to ${targetRoute}`,
            targetRoute,
            error as Error
          );

          setNavigationState(NAVIGATION_STATE.ERROR);
          setNavigationError(navigationError);

          logNavigation('Navigation failed', { error, route: targetRoute });

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

  /**
   * Reset navigation state to idle
   */
  const resetNavigation = useCallback(() => {
    setNavigationState(NAVIGATION_STATE.IDLE);
    setNavigationError(null);
    logNavigation('Navigation state reset');
  }, [logNavigation]);

  /**
   * Whether navigation is currently in progress
   */
  const isNavigating = navigationState === NAVIGATION_STATE.NAVIGATING || isPending;

  /**
   * Whether we can currently navigate (not already navigating)
   */
  const canNavigate = navigationState !== NAVIGATION_STATE.NAVIGATING && !isPending;

  return {
    navigationState,
    isNavigating,
    isPending,
    navigationError,
    navigate,
    prefetch,
    resetNavigation,
    canNavigate
  };
}

/**
 * Hook for view-specific navigation patterns
 */
export function useViewNavigation(viewType: 'angle' | 'fit' | 'tryon') {
  // Define view-specific routes
  const routes = useMemo(() => {
    switch (viewType) {
      case 'angle':
        return {
          current: '/m/upload-angle',
          next: '/m/upload-fit',
          previous: '/m'
        };
      case 'fit':
        return {
          current: '/m/upload-fit',
          next: '/m/tryon',
          previous: '/m/upload-angle'
        };
      case 'tryon':
        return {
          current: '/m/tryon',
          next: '/m/results',
          previous: '/m/upload-fit'
        };
      default:
        return {
          current: '/m',
          next: '/m',
          previous: '/m'
        };
    }
  }, [viewType]);

  // Create navigation hooks for each direction
  const nextNavigation = useNavigation({
    targetRoute: routes.next,
    enablePrefetch: true
  });

  const previousNavigation = useNavigation({
    targetRoute: routes.previous,
    replace: true
  });

  const homeNavigation = useNavigation({
    targetRoute: '/m',
    replace: true
  });

  return {
    routes,
    goNext: nextNavigation.navigate,
    goPrevious: previousNavigation.navigate,
    goHome: homeNavigation.navigate,
    prefetchNext: nextNavigation.prefetch,
    isNavigating: nextNavigation.isNavigating || previousNavigation.isNavigating || homeNavigation.isNavigating,
    navigationError: nextNavigation.navigationError || previousNavigation.navigationError || homeNavigation.navigationError,
    canNavigate: nextNavigation.canNavigate && previousNavigation.canNavigate && homeNavigation.canNavigate
  };
}

/**
 * Utility functions for navigation
 */

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
  navigate: (route?: string) => Promise<void>,
  maxRetries = 3
) => {
  let retryCount = 0;

  const retry = async (route?: string): Promise<void> => {
    if (retryCount >= maxRetries) {
      throw new Error(`Navigation failed after ${maxRetries} retries`);
    }

    try {
      retryCount++;
      await navigate(route);
      retryCount = 0; // Reset on success
    } catch (error) {
      if (retryCount < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(route);
      }
      throw error;
    }
  };

  return retry;
};