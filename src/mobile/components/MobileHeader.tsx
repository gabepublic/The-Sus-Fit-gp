'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MobileHeaderProps } from '../types';

export function MobileHeader({ 
  isMenuOpen, 
  onMenuToggle, 
  showBackButton = false,
  onBackClick,
  showProgress = false,
  progress = 0,
  title
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  return (
    <header className='mobile-header fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm'>
      {/* Progress bar */}
      {showProgress && (
        <div className='absolute bottom-0 left-0 right-0 h-1 bg-gray-200'>
          <div 
            className='h-full bg-blue-500 transition-all duration-300 ease-out'
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            role='progressbar'
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${progress}%`}
          />
        </div>
      )}

      <div className='flex items-center justify-between px-4 py-3 h-16'>
        {/* Left side - Back button or Logo */}
        <div className='flex items-center'>
          {showBackButton ? (
            <button
              onClick={handleBackClick}
              className='flex items-center justify-center w-10 h-10 mr-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-100 transition-colors'
              aria-label='Go back'
            >
              <svg 
                width='24' 
                height='24' 
                viewBox='0 0 24 24' 
                fill='none' 
                stroke='currentColor' 
                strokeWidth='2' 
                strokeLinecap='round' 
                strokeLinejoin='round'
              >
                <polyline points='15,18 9,12 15,6'></polyline>
              </svg>
            </button>
          ) : null}
          
          {title ? (
            <h1 className='text-lg font-semibold text-gray-900 truncate'>
              {title}
            </h1>
          ) : (
            <Link
              href='/m/home'
              className='flex items-center focus:outline-none rounded'
              aria-label='The Sus Fit - Home'
            >
              <h1 className='font-bold leading-tight susfit-logo-font mobile-title'>
                The Sus Fit
              </h1>
            </Link>
          )}
        </div>

        {/* Hamburger Menu - Right side */}
        <button
          onClick={onMenuToggle}
          aria-expanded={isMenuOpen}
          aria-controls='mobile-menu'
          aria-label={
            isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          className='flex flex-col items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-100 transition-colors no-tap-highlight'
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
