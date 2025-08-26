'use client';

import Link from 'next/link';
import { MobileHeaderProps } from '../types';

export function MobileHeader({ isMenuOpen, onMenuToggle }: MobileHeaderProps) {
  return (
    <header className='mobile-header fixed top-0 left-0 right-0 z-50 bg-transparent'>
      <div className='flex items-center justify-between px-4 py-3 h-16'>
        {/* Logo - Left side */}
        <Link
          href='/m/home'
          className='flex items-center focus:outline-none'
          aria-label='The Sus Fit - Home'
        >
          <h1 className='font-bold leading-tight susfit-logo-font mobile-title'>
            The Sus Fit
          </h1>
        </Link>

        {/* Hamburger Menu - Right side */}
        <button
          onClick={onMenuToggle}
          aria-expanded={isMenuOpen}
          aria-controls='mobile-menu'
          aria-label={
            isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          className='flex flex-col items-center justify-center w-10 h-10 focus:outline-none no-tap-highlight'
        >
          <span className='sr-only'>
            {isMenuOpen ? 'Close menu' : 'Open menu'}
          </span>

          {/* Hamburger icon - animated */}
          <div className='relative w-7 h-7'>
            <span
              className={`absolute block h-0.5 w-7 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'rotate-45 translate-y-3' : 'translate-y-1.5'
              }`}
              style={{ backgroundColor: '#1989a9' }}
            />
            <span
              className={`absolute block h-0.5 w-7 transform transition-all duration-300 ease-in-out translate-y-3 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ backgroundColor: '#1989a9' }}
            />
            <span
              className={`absolute block h-0.5 w-7 transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? '-rotate-45 translate-y-3' : 'translate-y-4.5'
              }`}
              style={{ backgroundColor: '#1989a9' }}
            />
          </div>
        </button>
      </div>
    </header>
  );
}
