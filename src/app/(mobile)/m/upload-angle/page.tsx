import { Metadata } from 'next'
import { MobileUploadAngleClient } from './client'

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

export default async function MobileUploadAnglePage({ searchParams }: MobileUploadAnglePageProps) {
  const resolvedSearchParams = await searchParams;
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
      
      <MobileUploadAngleClient searchParams={resolvedSearchParams} />
    </>
  )
}