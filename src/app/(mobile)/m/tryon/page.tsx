import { Metadata, Viewport } from 'next'
import MobileTryonClient from './client'

export const metadata: Metadata = {
  title: 'Try It On - The Sus Fit Mobile',
  description: 'Virtual try-on results on mobile - see how garments look on you with AI-powered fashion technology',
  keywords: 'virtual try-on, fashion, AI, mobile, augmented reality, clothing visualization, garment fitting, fashion technology',
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
    title: 'Try It On - The Sus Fit Mobile',
    description: 'Virtual try-on results on mobile - see how garments look on you with AI-powered fashion technology',
    url: '/m/tryon',
    siteName: 'The Sus Fit',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-tryon.jpg',
        width: 1200,
        height: 630,
        alt: 'Try It On - The Sus Fit Virtual Try-On Results',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Try It On - The Sus Fit Mobile',
    description: 'Virtual try-on results on mobile - see how garments look on you with AI-powered fashion technology',
    site: '@thesusfit',
    creator: '@thesusfit',
    images: ['/og-tryon.jpg'],
  },
  appleWebApp: {
    title: 'Try It On - The Sus Fit',
    statusBarStyle: 'default',
    capable: true,
  },
  category: 'Fashion Technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

interface MobileTryonPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function MobileTryonPage({ searchParams }: MobileTryonPageProps) {
  const resolvedSearchParams = await searchParams;

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Try It On - The Sus Fit",
    "description": "Virtual try-on results on mobile - see how garments look on you with AI-powered fashion technology",
    "applicationCategory": "FashionApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI-powered virtual try-on visualization",
      "Real-time garment rendering",
      "Mobile-optimized interface",
      "Interactive try-on results",
      "Share and save functionality"
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

      <MobileTryonClient searchParams={resolvedSearchParams} />
    </>
  )
}