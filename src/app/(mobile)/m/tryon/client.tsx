'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TryItOnWithErrorBoundary, TryItOnContainer } from '@/mobile/components/TryItOn';
import { RouteGuard } from '@/mobile/components/RouteGuard';

interface MobileTryonClientProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function MobileTryonClient({ searchParams: _searchParams }: MobileTryonClientProps) {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGeneratedResult, setHasGeneratedResult] = useState(false);

  /**
   * Browser history and back button handling
   */
  useEffect(() => {
    // Add custom browser history state for this page
    const currentState = {
      page: 'tryon',
      hasUnsavedChanges: false,
      timestamp: Date.now()
    };

    // Replace current history state to include our metadata
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState(currentState, '', window.location.href);
    }

    // Handle browser back button
    const handlePopState = (_event: PopStateEvent) => {
      // If user has unsaved changes, prevent navigation and show confirmation
      if (hasUnsavedChanges && (isProcessing || hasGeneratedResult)) {
        const shouldLeave = window.confirm(
          isProcessing
            ? "Your try-on is still processing. Leaving this page will cancel the process. Are you sure?"
            : "You have a try-on result that hasn't been shared yet. Are you sure you want to leave?"
        );

        if (!shouldLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(currentState, '', window.location.href);
          return;
        }
      }

      // Allow navigation to continue
      console.log('Browser back navigation allowed');
    };

    // Handle beforeunload for page refresh/close
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (isProcessing || hasGeneratedResult)) {
        const message = isProcessing
          ? "Your try-on is still processing. Leaving this page will cancel the process."
          : "You have a try-on result that hasn't been shared yet.";

        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isProcessing, hasGeneratedResult]);

  /**
   * Update browser history state when unsaved changes occur
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const updatedState = {
        page: 'tryon',
        hasUnsavedChanges,
        isProcessing,
        hasGeneratedResult,
        timestamp: Date.now()
      };

      window.history.replaceState(updatedState, '', window.location.href);
    }
  }, [hasUnsavedChanges, isProcessing, hasGeneratedResult]);

  /**
   * Access condition - user should have uploaded photos to reach try-on
   */
  const checkTryonAccess = useCallback(async (): Promise<boolean> => {
    // In a real app, this would check if user has completed upload-fit
    // For now, we'll allow access but could add conditions like:
    // - Check for uploaded photos in session storage
    // - Verify user has completed previous steps
    // - Check authentication state

    // Basic check for development - allow access
    return true;
  }, []);

  /**
   * Handle when try-on starts processing
   */
  const _handleTryItOnStart = useCallback(() => {
    setIsProcessing(true);
    setHasUnsavedChanges(true);
  }, []);

  /**
   * Handle when try-on completes successfully
   */
  const handleTryItOnComplete = useCallback((generatedImageUrl: string) => {
    setIsProcessing(false);
    setHasGeneratedResult(true);
    setHasUnsavedChanges(true); // User has a result they might want to share
    console.log('Try-on completed with result:', generatedImageUrl);
  }, []);

  /**
   * Handle try-on errors
   */
  const handleTryItOnError = useCallback((error: Error | unknown) => {
    setIsProcessing(false);
    console.error('Try-on error:', error);
  }, []);

  /**
   * Handle when user navigates to share (completed workflow)
   */
  const _handleNavigateToShare = useCallback((generatedImageUrl: string) => {
    setHasUnsavedChanges(false); // User is proceeding with the workflow
    console.log('Navigating to share with image:', generatedImageUrl);
  }, []);

  /**
   * Handle when navigation is blocked
   */
  const handleNavigationBlocked = useCallback(() => {
    console.log('Navigation blocked - user has unsaved try-on results');
  }, []);

  /**
   * Handle access denied - redirect to upload-fit
   */
  const handleAccessDenied = useCallback(() => {
    console.log('Access denied to try-on page - redirecting to upload-fit');
    router.push('/m/upload-fit');
  }, [router]);

  /**
   * Handle navigation to share - wrapper for container's onNavigate
   */
  const handleContainerNavigate = useCallback((route: string) => {
    // Set state synchronously before navigation to prevent popstate interference
    setHasUnsavedChanges(false); // User is proceeding with the workflow

    // Use setTimeout to ensure state update is processed before navigation
    setTimeout(() => {
      router.push(route);
    }, 0);
  }, [router]);

  /**
   * Mobile layout styling effects
   */
  useEffect(() => {
    // Store original backgrounds for cleanup
    const originalBodyBackground = document.body.style.backgroundColor || '';
    const originalBodyBackgroundImage = document.body.style.backgroundImage || '';
    const mobileLayout = document.querySelector('.mobile-layout') as HTMLElement;
    const mobileHeader = document.querySelector('.mobile-header') as HTMLElement;
    const originalLayoutBackground = mobileLayout?.style.backgroundColor || '';
    const originalHeaderBackground = mobileHeader?.style.backgroundColor || '';
    const originalHeaderBorder = mobileHeader?.style.borderBottom || '';

    // Set try-on specific background styling - match Upload views
    document.body.style.backgroundColor = '#faba01'; // Yellow background to match Upload views
    document.body.style.backgroundImage = 'none';

    if (mobileLayout) {
      mobileLayout.style.backgroundColor = 'transparent';
    }

    if (mobileHeader) {
      mobileHeader.style.backgroundColor = 'transparent';
      mobileHeader.style.backdropFilter = 'none';
      mobileHeader.style.borderBottom = 'none';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.body.style.backgroundImage = originalBodyBackgroundImage;
      if (mobileLayout) {
        mobileLayout.style.backgroundColor = originalLayoutBackground;
      }
      if (mobileHeader) {
        mobileHeader.style.backgroundColor = originalHeaderBackground;
        mobileHeader.style.backdropFilter = '';
        mobileHeader.style.borderBottom = originalHeaderBorder;
      }
    };
  }, []);

  return (
    <RouteGuard
      hasUnsavedChanges={hasUnsavedChanges && (isProcessing || hasGeneratedResult)}
      enableNavigationGuard={true}
      confirmationMessage={
        isProcessing
          ? "Your try-on is still processing. Leaving this page will cancel the process. Are you sure?"
          : hasGeneratedResult
            ? "You have a try-on result that hasn't been shared yet. Are you sure you want to leave?"
            : "Are you sure you want to leave this page?"
      }
      protected={true}
      accessCondition={checkTryonAccess}
      onNavigationBlocked={handleNavigationBlocked}
      onAccessDenied={handleAccessDenied}
      loadingFallback={
        <div className="flex items-center justify-center min-h-[300px] text-gray-500">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p>Initializing try-on interface...</p>
          </div>
        </div>
      }
      accessDeniedFallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-orange-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Required</h2>
          <p className="text-gray-600 mb-4">
            You need to upload your photos before using the try-on feature.
          </p>
          <button
            onClick={() => router.push('/m/upload-fit')}
            className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
          >
            Upload Photos
          </button>
        </div>
      }
    >
      <div className="mobile-tryon-page">
        <TryItOnWithErrorBoundary
          testId="mobile-tryon-page"
          className="tryon-interface"
          onError={(error, _errorInfo) => {
            handleTryItOnError(error);

            // Log error for monitoring in production
            console.error('Try-on page error:', error);
            if (process.env.NODE_ENV === 'production') {
              // Send to error reporting service
              // errorReportingService.captureException(error, {
              //   tags: { page: 'tryon', platform: 'mobile' },
              //   extra: { componentStack: errorInfo.componentStack, searchParams }
              // });
            }
          }}
        >
          <TryItOnContainer
            testId="mobile-tryon-container"
            className="tryon-container"
            onNavigate={handleContainerNavigate}
            onSuccess={handleTryItOnComplete}
            onError={handleTryItOnError}
          />
        </TryItOnWithErrorBoundary>
      </div>
    </RouteGuard>
  );
}