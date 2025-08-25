import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload Your Angle - The Sus Fit Mobile',
  description: 'Upload your photo angle for virtual try-on on mobile',
}

interface MobileUploadAnglePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileUploadAnglePage({ searchParams: _searchParams }: MobileUploadAnglePageProps) {
  return (
    <div className="mobile-upload-angle-page">
      <h1>Upload Your Angle</h1>
      <p>Mobile Upload Angle Page - Capture or select your photo</p>
      {/* Placeholder content - actual implementation will be added in future tasks */}
      <div className="placeholder-content">
        <p>Take a photo or select from gallery</p>
        <p>Position yourself for the best try-on results</p>
      </div>
    </div>
  )
}