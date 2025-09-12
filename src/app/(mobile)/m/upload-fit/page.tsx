import { Metadata } from 'next'
import { MobileUploadFitClient } from './client'

export const metadata: Metadata = {
  title: 'Upload Your Fit - The Sus Fit Mobile',
  description: 'Upload your fit photo for virtual try-on experience. Select and upload clothing items to see how they look on your uploaded angle photo.',
  keywords: 'virtual try-on, clothing upload, mobile fashion, garment selection, fashion technology, fit visualization',
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
    title: 'Upload Your Fit - The Sus Fit Mobile',
    description: 'Upload your fit photo for virtual try-on experience. Select and upload clothing items to see how they look on your uploaded angle photo.',
    url: '/m/upload-fit',
    siteName: 'The Sus Fit',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-upload-fit.jpg',
        width: 1200,
        height: 630,
        alt: 'Upload Your Fit - The Sus Fit Virtual Try-On',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upload Your Fit - The Sus Fit Mobile',
    description: 'Upload your fit photo for virtual try-on experience. Select and upload clothing items to see how they look on your uploaded angle photo.',
    site: '@thesusfit',
    creator: '@thesusfit',
    images: ['/og-upload-fit.jpg'],
  },
  appleWebApp: {
    title: 'Upload Your Fit - The Sus Fit',
    statusBarStyle: 'default',
    capable: true,
  },
  category: 'Fashion Technology',
}

interface MobileUploadFitPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function MobileUploadFitPage({ searchParams }: MobileUploadFitPageProps) {
  const resolvedSearchParams = await searchParams;
  
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Upload Your Fit - The Sus Fit",
    "description": "Upload your fit photo for virtual try-on experience",
    "applicationCategory": "FashionApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Clothing item upload and selection",
      "Mobile-optimized interface",
      "Virtual try-on visualization", 
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
      
      <MobileUploadFitClient searchParams={resolvedSearchParams} />
    </>
  )
}