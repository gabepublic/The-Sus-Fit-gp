import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Sus Fit - Mobile',
  description: 'Mobile experience for The Sus Fit virtual try-on platform',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3B82F6',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
  }
}

interface MobileGroupLayoutProps {
  children: React.ReactNode
}

export default function MobileGroupLayout({ children }: MobileGroupLayoutProps) {
  return <>{children}</>
}