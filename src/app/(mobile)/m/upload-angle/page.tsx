'use client'

import { Metadata } from 'next'
import { Suspense, useState } from 'react'
import { UploadAngleWithErrorBoundary } from '../../../../mobile/components/UploadAngle/containers/UploadAngleWithErrorBoundary'
import { RouteGuard } from '../../../../mobile/components/RouteGuard'
import type { UploadConfig } from '../../../../mobile/components/UploadAngle/types/upload.types'

export const metadata: Metadata = {
  title: 'Upload Your Angle - The Sus Fit Mobile',
  description: 'Upload your photo angle for virtual try-on experience. Position yourself perfectly for the best fitting results with our mobile-optimized upload interface.',
  keywords: 'virtual try-on, photo upload, mobile fashion, angle positioning, clothing fit, fashion technology',
  authors: [{ name: 'The Sus Fit' }],
  creator: 'The Sus Fit',
  publisher: 'The Sus Fit',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Upload Your Angle - The Sus Fit Mobile',
    description: 'Upload your photo angle for virtual try-on experience. Position yourself perfectly for the best fitting results.',
    url: '/m/upload-angle',
    siteName: 'The Sus Fit',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-upload-angle.jpg',
        width: 1200,
        height: 630,
        alt: 'Upload Your Angle - The Sus Fit Virtual Try-On',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upload Your Angle - The Sus Fit Mobile',
    description: 'Upload your photo angle for virtual try-on experience. Position yourself perfectly for the best fitting results.',
    site: '@thesusfit',
    creator: '@thesusfit',
    images: ['/og-upload-angle.jpg'],
  },
  appleWebApp: {
    title: 'Upload Your Angle - The Sus Fit',
    statusBarStyle: 'default',
    capable: true,
  },
  category: 'Fashion Technology',
}

interface MobileUploadAnglePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileUploadAnglePage({ searchParams: _searchParams }: MobileUploadAnglePageProps) {
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

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Upload Your Angle - The Sus Fit",
    "description": "Upload your photo angle for virtual try-on experience",
    "applicationCategory": "FashionApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Photo upload for virtual try-on",
      "Mobile-optimized interface", 
      "Real-time progress tracking",
      "Image processing and optimization"
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
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
    </>
  )
}