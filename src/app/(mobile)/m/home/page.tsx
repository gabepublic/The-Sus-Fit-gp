import { Metadata } from 'next'
import { Suspense } from 'react'
import { HomeViewContent } from '../../../../mobile/components'

export const metadata: Metadata = {
  title: 'Home - The Sus Fit Mobile',
  description: 'Mobile home page for The Sus Fit virtual try-on platform - Let\'s Get You Fitted',
}

interface MobileHomePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

// Loading component for suspense boundary
function HomeViewLoading() {
  return (
    <div className="home-view-loading" role="status" aria-label="Loading SusFit homepage">
      <div className="loading-container">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span className="sr-only">Loading your personalized fitting experience...</span>
      </div>
    </div>
  )
}

// Error boundary component
function HomeViewError() {
  return (
    <div className="home-view-error" role="alert">
      <h1>Welcome to SusFit</h1>
      <p>We're having trouble loading the interactive experience. Please refresh the page or try again.</p>
      <div className="error-fallback">
        <p>Virtual try-on platform optimized for mobile devices</p>
      </div>
    </div>
  )
}

export default function MobileHomePage({ searchParams: _searchParams }: MobileHomePageProps) {
  return (
    <div className="mobile-home-page">
      <Suspense fallback={<HomeViewLoading />}>
        <HomeViewContent 
          className="home-view-integrated"
          animationDelay={100}
        />
      </Suspense>
      
      {/* Hidden anchor for skip link navigation */}
      <div id="main-content" className="sr-only" tabIndex={-1}>
        Main content loaded
      </div>
    </div>
  )
}