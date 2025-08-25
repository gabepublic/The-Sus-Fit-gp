import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try It On - The Sus Fit Mobile',
  description: 'Virtual try-on results on mobile',
}

interface MobileTryonPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileTryonPage({ searchParams }: MobileTryonPageProps) {
  return (
    <div className="mobile-tryon-page">
      <h1>Try It On</h1>
      <p>Mobile Try-on Page - See how the garment looks on you</p>
      {/* Placeholder content - actual implementation will be added in future tasks */}
      <div className="placeholder-content">
        <p>Virtual try-on results will appear here</p>
        <p>See how the selected garment looks on your photo</p>
      </div>
    </div>
  )
}