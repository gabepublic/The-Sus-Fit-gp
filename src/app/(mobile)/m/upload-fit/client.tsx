'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UploadFit } from '../../../../mobile/components/UploadFit/components/UploadFit'
import { RouteGuard } from '../../../../mobile/components/RouteGuard'

interface MobileUploadFitClientProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function MobileUploadFitClient({ searchParams: _searchParams }: MobileUploadFitClientProps) {
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  // Upload configuration matching the pattern from UploadAngle
  const uploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048,
    enableCompression: true,
  }

  const handleUploadSuccess = (imageUrl: string, metadata?: Record<string, unknown>) => {
    console.log('Upload successful:', { imageUrl, metadata })
    setHasUnsavedChanges(false);
    setUploadInProgress(false);
    // Additional success handling can be added here
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    setUploadInProgress(false);
    // Additional error handling can be added here
  }

  const handleProgressChange = (progress: number) => {
    // Progress updates can be used for header progress indication
    console.log('Upload progress:', progress)
    
    // Track upload state for navigation guard
    if (progress > 0 && progress < 100) {
      setUploadInProgress(true);
      setHasUnsavedChanges(true);
    } else if (progress >= 100) {
      setUploadInProgress(false);
    }
    
    // Emit custom event for mobile header to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('upload-progress', {
        detail: { progress }
      }))
    }
  }

  const handleNext = () => {
    // Navigate to Try-On View
    console.log('Proceeding to Try-On View')
    setHasUnsavedChanges(false);
    router.push('/m/tryon');
  }

  const handleNavigationBlocked = () => {
    console.log('Navigation blocked due to ongoing upload');
  }

  // Set and clean up background colors (different from UploadAngle)
  useEffect(() => {
    // Store original backgrounds
    const originalBodyBackground = document.body.style.backgroundColor || '';
    const originalBodyBackgroundImage = document.body.style.backgroundImage || '';
    const mobileLayout = document.querySelector('.mobile-layout') as HTMLElement;
    const mobileHeader = document.querySelector('.mobile-header') as HTMLElement;
    const originalLayoutBackground = mobileLayout?.style.backgroundColor || '';
    const originalHeaderBackground = mobileHeader?.style.backgroundColor || '';
    const originalHeaderBorder = mobileHeader?.style.borderBottom || '';
    
    // Set different background for Upload Fit view (could be another brand color)
    document.body.style.backgroundColor = '#faba01'; // Orange background for fit upload
    document.body.style.backgroundImage = 'none'; // Override the global gradient
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
      hasUnsavedChanges={hasUnsavedChanges || uploadInProgress}
      enableNavigationGuard={true}
      confirmationMessage="You have an upload in progress. Leaving this page will cancel the upload. Are you sure?"
      onNavigationBlocked={handleNavigationBlocked}
      loadingFallback={
        <div className="flex items-center justify-center min-h-[300px] text-gray-500">
          Initializing upload interface...
        </div>
      }
    >
      <div className="mobile-upload-fit-page min-h-screen">
        <div className="px-4 py-6">
          <Suspense fallback={
            <div
              className="flex items-center justify-center min-h-[400px] text-gray-500"
              role="status"
              aria-label="Loading upload interface"
            >
              Loading upload interface...
            </div>
          }>
            <UploadFit
              config={uploadConfig}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onProgressChange={handleProgressChange}
              onNext={handleNext}
              className="upload-fit-mobile"
              testId="mobile-upload-fit"
            />
          </Suspense>
        </div>
      </div>
    </RouteGuard>
  )
}