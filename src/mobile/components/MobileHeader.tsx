'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MobileHeaderProps } from '../types'

export function MobileHeader({ isMenuOpen, onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="mobile-header fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="flex items-center justify-between px-4 py-3 h-16">
        {/* Logo - Left side */}
        <Link 
          href="/m/home" 
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md p-1"
          aria-label="The Sus Fit - Home"
        >
          <Image
            src="/images/logo-text.svg"
            alt="The Sus Fit"
            width={120}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Hamburger Menu - Right side */}
        <button
          onClick={onMenuToggle}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex flex-col items-center justify-center w-10 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md p-1"
        >
          <span className="sr-only">
            {isMenuOpen ? 'Close menu' : 'Open menu'}
          </span>
          
          {/* Hamburger icon - animated */}
          <div className="relative w-6 h-6">
            <span
              className={`absolute block h-0.5 w-6 bg-blue-600 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-1'
              }`}
            />
            <span
              className={`absolute block h-0.5 w-6 bg-blue-600 transform transition-all duration-300 ease-in-out translate-y-2.5 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute block h-0.5 w-6 bg-blue-600 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? '-rotate-45 translate-y-2.5' : 'translate-y-4'
              }`}
            />
          </div>
        </button>
      </div>
    </header>
  )
}