import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Sus Fit - Mobile',
  description: 'Mobile experience for The Sus Fit virtual try-on platform',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="mobile-layout min-h-screen">
      {/* Mobile header and navigation will be added in future tasks */}
      <main className="mobile-main">
        {children}
      </main>
    </div>
  )
}