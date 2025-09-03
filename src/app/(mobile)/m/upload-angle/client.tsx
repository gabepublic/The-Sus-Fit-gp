'use client'

import { Suspense, useState } from 'react'
import { UploadAngleWithErrorBoundary } from '../../../../mobile/components/UploadAngle/containers/UploadAngleWithErrorBoundary'
import { RouteGuard } from '../../../../mobile/components/RouteGuard'
import type { UploadConfig } from '../../../../mobile/components/UploadAngle/types/upload.types'

interface MobileUploadAngleClientProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export function MobileUploadAngleClient({ searchParams: _searchParams }: MobileUploadAngleClientProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const uploadConfig: UploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048,
    enableCompression: true,
  }

  const handleUploadSuccess = (imageUrl: string, metadata: { filename: string; size: number; type: string; width: number; height: number }) => {
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
    // Navigate to next step in the flow
    console.log('Proceeding to next step')
    setHasUnsavedChanges(false);
    // This would typically navigate to the try-on or results page
  }

  const handleNavigationBlocked = () => {
    console.log('Navigation blocked due to ongoing upload');
  }

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
      <div className="mobile-upload-angle-page min-h-screen bg-gradient-to-b from-pink-50 to-yellow-50">
        <div className="px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Angle</h1>
            <p className="text-gray-600">
              Take a photo or select from gallery. Position yourself for the best try-on results.
            </p>
          </div>

          <Suspense fallback={
            <div 
              className="flex items-center justify-center min-h-[400px] text-gray-500"
              role="status"
              aria-label="Loading upload interface"
            >
              Loading upload interface...
            </div>
          }>
            <UploadAngleWithErrorBoundary
              config={uploadConfig}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onProgressChange={handleProgressChange}
              onNext={handleNext}
              className="upload-angle-mobile"
              testId="mobile-upload-angle"
            />
          </Suspense>
        </div>
      </div>
    </RouteGuard>
  )
}