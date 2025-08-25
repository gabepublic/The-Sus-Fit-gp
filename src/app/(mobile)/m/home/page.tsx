import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home - The Sus Fit Mobile',
  description: 'Mobile home page for The Sus Fit virtual try-on platform',
}

interface MobileHomePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileHomePage({ searchParams: _searchParams }: MobileHomePageProps) {
  return (
    <div className="mobile-home-page">
      <h1>Welcome to The Sus Fit</h1>
      <p>Mobile Home Page - Virtual try-on platform optimized for mobile devices</p>
      {/* Placeholder content - actual implementation will be added in future tasks */}
      <div className="placeholder-content">
        <p>Try on your favorite clothes virtually</p>
        <p>Upload your photo and see how garments look on you</p>
      </div>
    </div>
  )
}