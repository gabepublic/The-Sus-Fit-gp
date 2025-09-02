/**
 * @fileoverview RouteGuard - Component for protecting routes and managing navigation
 * @module @/mobile/components/RouteGuard
 * @version 1.0.0
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationGuard } from '../hooks/useNavigationGuard';

export interface RouteGuardProps {
  /** Child components to render when access is granted */
  children: React.ReactNode;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Whether to enable navigation protection */
  enableNavigationGuard?: boolean;
  /** Message for navigation confirmation */
  confirmationMessage?: string;
  /** Whether the route is protected (requires some condition) */
  protected?: boolean;
  /** Condition that must be met to access the route */
  accessCondition?: () => boolean | Promise<boolean>;
  /** Fallback component when access is denied */
  accessDeniedFallback?: React.ReactNode;
  /** Loading component while checking access */
  loadingFallback?: React.ReactNode;
  /** Callback when access is denied */
  onAccessDenied?: () => void;
  /** Callback when navigation is blocked */
  onNavigationBlocked?: () => void;
}

/**
 * RouteGuard - Protects routes and manages navigation guards
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  hasUnsavedChanges = false,
  enableNavigationGuard = true,
  confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?',
  protected: isProtected = false,
  accessCondition,
  accessDeniedFallback,
  loadingFallback,
  onAccessDenied,
  onNavigationBlocked
}) => {
  const router = useRouter();
  const _pathname = usePathname();
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  // Navigation guard hook
  const { shouldBlockNavigation } = useNavigationGuard({
    hasUnsavedChanges,
    enabled: enableNavigationGuard,
    message: confirmationMessage,
    onRouteChangeStart: (_url) => {
      const shouldBlock = shouldBlockNavigation();
      if (shouldBlock && onNavigationBlocked) {
        onNavigationBlocked();
      }
      return !shouldBlock || window.confirm(confirmationMessage);
    }
  });

  // Check access when component mounts or dependencies change
  useEffect(() => {
    const checkAccess = async () => {
      if (!isProtected) {
        setAccessStatus('granted');
        return;
      }

      if (!accessCondition) {
        setAccessStatus('denied');
        onAccessDenied?.();
        return;
      }

      try {
        const hasAccess = await accessCondition();
        if (hasAccess) {
          setAccessStatus('granted');
        } else {
          setAccessStatus('denied');
          onAccessDenied?.();
        }
      } catch (error) {
        console.error('RouteGuard: Error checking access condition:', error);
        setAccessStatus('denied');
        onAccessDenied?.();
      }
    };

    checkAccess();
  }, [isProtected, accessCondition, onAccessDenied]);

  // Render loading state
  if (accessStatus === 'loading') {
    return (
      loadingFallback || (
        <div 
          className="flex items-center justify-center min-h-[200px] text-gray-500"
          role="status"
          aria-label="Checking access permissions"
        >
          Loading...
        </div>
      )
    );
  }

  // Render access denied state
  if (accessStatus === 'denied') {
    return (
      accessDeniedFallback || (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
          <div className="mb-4">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/m/home')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      )
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default RouteGuard;