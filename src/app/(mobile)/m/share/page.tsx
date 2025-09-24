import { Metadata, Viewport } from 'next'
import ShareViewClient from './client'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/**
 * Structured Data Schema for Share View
 * Implements WebApplication schema with sharing functionality
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "The Sus Fit - Virtual Try-On Sharing",
  "description": "Share your virtual try-on results with friends on social media platforms",
  "url": "https://thesusfit.com/m/share",
  "applicationCategory": "Fashion & Style",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript enabled",
  "permissions": "camera, storage",
  "author": {
    "@type": "Organization",
    "name": "Those People",
    "url": "https://thosepeople.co"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Virtual try-on result sharing",
    "Social media integration",
    "Mobile-optimized interface",
    "Multiple sharing platforms"
  ],
  "screenshot": "https://thesusfit.com/images/screenshots/share-view.jpg",
  "softwareVersion": "1.0.0",
  "releaseNotes": "Initial release of sharing functionality",
  "applicationSubCategory": "Virtual Fashion Try-On",
  "countriesSupported": "Worldwide",
  "availableLanguage": "English"
}

export const metadata: Metadata = {
  title: 'Share Your Try-On | The Sus Fit',
  description: 'Share your virtual try-on results with friends on social media or save to your device. Show off your new look!',
  keywords: ['virtual try-on', 'fashion sharing', 'outfit sharing', 'social media', 'mobile fashion'],
  openGraph: {
    title: 'Share Your Try-On | The Sus Fit',
    description: 'Share your virtual try-on results with friends on social media or save to your device.',
    type: 'website',
    locale: 'en_US',
    siteName: 'The Sus Fit',
    images: [
      {
        url: '/images/og-share.jpg',
        width: 1200,
        height: 630,
        alt: 'Share your virtual try-on results',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share Your Try-On | The Sus Fit',
    description: 'Share your virtual try-on results with friends on social media.',
    images: ['/images/og-share.jpg'],
  },
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
  alternates: {
    canonical: '/m/share',
  },
}

interface MobileSharePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Mobile Share Page Component
 *
 * This page allows users to share their virtual try-on results generated from
 * the Try It On workflow. It provides a clean, mobile-optimized interface for
 * sharing to various social media platforms or saving locally.
 *
 * Features:
 * - Photo display in brutalist PhotoFrame design
 * - Four sharing options: BlueSky, Pinterest, Instagram, Device Share
 * - Mobile-first responsive design
 * - Accessibility compliant
 * - SEO-optimized with structured data
 *
 * @param searchParams - URL search parameters for sharing context
 * @returns JSX element for the mobile share page
 */
export default async function MobileSharePage({ searchParams }: MobileSharePageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      {/* Main Content */}
      <ShareViewClient searchParams={resolvedSearchParams} />
    </>
  )
}