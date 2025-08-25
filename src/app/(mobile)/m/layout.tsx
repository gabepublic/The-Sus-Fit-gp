'use client'

import { useState } from 'react'
import { MobileHeader, MobileMenu } from '../../../mobile/components'
import '../../../mobile/styles/mobile.css'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMenuOpen(prev => !prev)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="mobile-layout min-h-screen bg-gradient-to-b from-pink-50 to-yellow-50">
      {/* Mobile Header */}
      <MobileHeader 
        isMenuOpen={isMenuOpen} 
        onMenuToggle={handleMenuToggle} 
      />
      
      {/* Mobile Navigation Menu */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={handleMenuClose} 
      />
      
      {/* Main Content */}
      <main className="mobile-main pt-16">
        {children}
      </main>
    </div>
  )
}