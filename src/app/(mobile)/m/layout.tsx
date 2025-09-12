'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MobileHeader, MobileMenu } from '../../../mobile/components'
import '../../../mobile/styles/mobile.css'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const pathname = usePathname()

  const handleMenuToggle = () => {
    setIsMenuOpen(prev => !prev)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  // Determine header configuration based on current route
  const isUploadAnglePage = pathname === '/m/upload-angle'
  const isUploadFitPage = pathname === '/m/upload-fit'
  const showBackButton = false // Keep header consistent across all views
  const showProgress = (isUploadAnglePage || isUploadFitPage) && uploadProgress > 0 && uploadProgress < 100
  const title = undefined // Keep header consistent across all views

  // Listen for upload progress events
  useEffect(() => {
    const handleUploadProgress = (event: CustomEvent) => {
      setUploadProgress(event.detail.progress || 0)
    }

    // Listen for custom upload progress events
    window.addEventListener('upload-progress', handleUploadProgress as EventListener)
    
    return () => {
      window.removeEventListener('upload-progress', handleUploadProgress as EventListener)
    }
  }, [])

  // Reset upload progress when leaving upload page
  useEffect(() => {
    if (!isUploadAnglePage && !isUploadFitPage) {
      setUploadProgress(0)
    }
  }, [isUploadAnglePage, isUploadFitPage])

  return (
    <div className={`mobile-layout min-h-screen ${(isUploadAnglePage || isUploadFitPage) ? 'bg-transparent' : ''}`}>
      {/* Mobile Header */}
      <MobileHeader 
        isMenuOpen={isMenuOpen} 
        onMenuToggle={handleMenuToggle}
        showBackButton={showBackButton}
        showProgress={showProgress}
        progress={uploadProgress}
        title={title}
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