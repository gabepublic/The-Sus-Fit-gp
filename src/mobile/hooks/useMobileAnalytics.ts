'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { MobileAnalyticsEvent } from '../types';

export interface MobileAnalyticsHook {
  trackRouteChange: (event: Omit<MobileAnalyticsEvent, 'timestamp'>) => void;
  trackCustomEvent: (eventName: string, data: Record<string, any>) => void;
}

export const useMobileAnalytics = (): MobileAnalyticsHook => {
  const pathname = usePathname();

  const trackRouteChange = useCallback((event: Omit<MobileAnalyticsEvent, 'timestamp'>) => {
    const analyticsEvent: MobileAnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Placeholder for future analytics implementation
    console.log('📱 Mobile Route Analytics:', analyticsEvent);
  }, []);

  const trackCustomEvent = useCallback((eventName: string, data: Record<string, any>) => {
    const customEvent = {
      eventName,
      timestamp: new Date(),
      route: pathname,
      ...data,
    };

    // Placeholder for future analytics implementation
    console.log('📱 Mobile Custom Event:', customEvent);
  }, [pathname]);

  // Track route changes automatically for mobile routes
  useEffect(() => {
    // Only track if we're in a mobile route (starts with /m/)
    if (pathname?.startsWith('/m/')) {
      const deviceType = window.innerWidth >= 768 ? 'tablet' : 'mobile';
      
      trackRouteChange({
        route: pathname,
        deviceType,
        action: 'page_view',
      });
    }
  }, [pathname, trackRouteChange]);

  return {
    trackRouteChange,
    trackCustomEvent,
  };
};