'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CSSTransition } from 'react-transition-group'
import { FocusTrap } from 'focus-trap-react'
import { MobileMenuProps, MobileRoute } from '../types'

// Mobile routes configuration
const mobileRoutes: MobileRoute[] = [
  { path: '/m/home', label: 'Home', icon: '🏠' },
  { path: '/m/upload-angle', label: 'Upload Your Angle', icon: '📸' },
  { path: '/m/upload-fit', label: 'Upload Your Fit', icon: '👕' },
  { path: '/m/tryon', label: 'Try It On', icon: '✨' },
  { path: '/m/share', label: 'Share', icon: '📱' },
]

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle route change - close menu when navigating
  const prevPathname = useRef(pathname)
  useEffect(() => {
    if (isOpen && pathname !== prevPathname.current) {
      onClose()
    }
    prevPathname.current = pathname
  }, [pathname, onClose, isOpen])

  if (!isOpen) return null

  return (
    <CSSTransition
      in={isOpen}
      timeout={300}
      classNames="mobile-menu"
      unmountOnExit
    >
      <FocusTrap
        focusTrapOptions={{
          initialFocus: '[data-autofocus]',
          allowOutsideClick: false,
          returnFocusOnDeactivate: true,
        }}
      >
        <div
          className="mobile-menu fixed inset-0 z-200 backdrop-blur-sm"
          style={{ backgroundColor: '#d4940b' }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop - clicking closes menu */}
          <div
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <nav
            id="mobile-menu"
            className="mobile-menu-panel relative ml-auto h-full w-80 max-w-sm shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ backgroundColor: '#faba01' }}
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#d4940b' }}>
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>Navigation</h2>
              <button
                data-autofocus
                onClick={onClose}
                className="p-2 rounded-md text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800"
                style={{ backgroundColor: 'rgba(212, 148, 11, 0.1)' }}
                aria-label="Close navigation menu"
              >
                <span className="sr-only">Close menu</span>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="#1989a9"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <ul className="space-y-2" role="list">
                {mobileRoutes.map((route) => {
                  const isActive = pathname === route.path
                  return (
                    <li key={route.path}>
                      <Link
                        href={route.path}
                        className="flex items-center px-4 py-3 text-base font-semibold rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 text-gray-700 hover:text-gray-900 border-l-4"
                        style={{
                          ...(isActive
                            ? { backgroundColor: '#dcaa30', borderColor: '#8b6508', color: '#1f2937' }
                            : { borderColor: 'transparent' }
                          ),
                          '--tw-ring-color': 'rgb(139, 101, 8)',
                          '--tw-ring-opacity': '0.4'
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'rgba(212, 148, 11, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="mr-3 text-lg" aria-hidden="true" style={{ textShadow: '0px 0px 6px #000000' }}>
                          {route.icon}
                        </span>
                        <span style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>{route.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t p-4" style={{ borderColor: '#d4940b' }}>
              <p className="text-sm text-gray-700 text-center" style={{ fontFamily: 'Montserrat Alternates, sans-serif' }}>
                The Sus Fit Mobile
              </p>
            </div>
          </nav>
        </div>
      </FocusTrap>
    </CSSTransition>
  )
}