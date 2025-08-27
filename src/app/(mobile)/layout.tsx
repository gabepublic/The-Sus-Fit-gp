import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'The Sus Fit - Mobile',
  description: 'Mobile experience for The Sus Fit virtual try-on platform',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
}

interface MobileGroupLayoutProps {
  children: React.ReactNode
}

export default function MobileGroupLayout({ children }: MobileGroupLayoutProps) {
  return <>{children}</>
}