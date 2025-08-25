import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Share - The Sus Fit Mobile',
  description: 'Share your virtual try-on results on mobile',
}

interface MobileSharePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function MobileSharePage({ searchParams }: MobileSharePageProps) {
  return (
    <div className="mobile-share-page">
      <h1>Share Your Look</h1>
      <p>Mobile Share Page - Share your virtual try-on results</p>
      {/* Placeholder content - actual implementation will be added in future tasks */}
      <div className="placeholder-content">
        <p>Share your try-on results with friends</p>
        <p>Export to social media or save to gallery</p>
      </div>
    </div>
  )
}