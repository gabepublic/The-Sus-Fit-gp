import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload Your Fit - The Sus Fit Mobile',
  description: 'Upload garment photo for virtual try-on on mobile',
}

interface MobileUploadFitPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileUploadFitPage({ searchParams }: MobileUploadFitPageProps) {
  return (
    <div className="mobile-upload-fit-page">
      <h1>Upload Your Fit</h1>
      <p>Mobile Upload Fit Page - Select the garment to try on</p>
      {/* Placeholder content - actual implementation will be added in future tasks */}
      <div className="placeholder-content">
        <p>Choose the clothing item you want to try on</p>
        <p>Upload a photo of the garment or select from catalog</p>
      </div>
    </div>
  )
}