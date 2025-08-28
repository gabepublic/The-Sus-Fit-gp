'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HomeViewContentProps } from '../types';
import { YellowBanner } from './YellowBanner';

export const HomeViewContent = React.memo<HomeViewContentProps>(
  function HomeViewContent({ className, animationDelay = 0 }) {
    const [gifLoaded, setGifLoaded] = useState(false);
    const [gifError, setGifError] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [loadingAnnounced, setLoadingAnnounced] = useState(false);
    const announceRef = useRef<HTMLDivElement>(null);

    // Detect user's motion preferences
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setReducedMotion(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Announce loading state for screen readers
    useEffect(() => {
      if (!gifLoaded && !gifError && !loadingAnnounced) {
        const timer = setTimeout(() => {
          if (announceRef.current) {
            announceRef.current.textContent =
              'Loading interactive background content';
            setLoadingAnnounced(true);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [gifLoaded, gifError, loadingAnnounced]);

    // Announce completion for screen readers
    useEffect(() => {
      if (gifLoaded && announceRef.current) {
        announceRef.current.textContent =
          'Welcome to SusFit. Interactive background loaded successfully.';
      }
      if (gifError && announceRef.current) {
        announceRef.current.textContent =
          'SusFit homepage loaded with static background.';
      }
    }, [gifLoaded, gifError]);

    return (
      <main
        className={`home-view-content ${className || ''}`}
        role='main'
        aria-label='SusFit Homepage'
        style={{
          animationDelay: `${animationDelay}ms`
        }}
      >
        {/* Screen reader announcements */}
        <div
          ref={announceRef}
          className='sr-only'
          aria-live='polite'
          aria-atomic='true'
        />

        {/* Layer 1: White background (automatic via CSS) */}

        {/* Layer 2: Yellow shape */}
        <YellowBanner
          className='home-view-content__yellow-shape'
          animationDelay={animationDelay + 200}
        />

        {/* Layer 3: Text with GIF only visible through text cutout */}
        <div className='home-view-content__text-mask-container'>
          <section
            className='home-view-content__text-section'
            aria-labelledby='main-headline'
          >
            {/* Hidden image for loading state only */}
            <div className='home-view-content__hidden-gif'>
              {!gifError && (
                <Image
                  src='/images/mobile/home-page-animated.gif'
                  alt=''
                  fill
                  priority
                  unoptimized
                  className={`home-view-content__gif ${
                    gifLoaded ? 'loaded' : 'loading'
                  } ${reducedMotion ? 'reduced-motion' : ''}`}
                  onLoad={() => setGifLoaded(true)}
                  onError={() => setGifError(true)}
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  sizes='100vw'
                  quality={reducedMotion ? 75 : 85}
                />
              )}
            </div>

            {/* Text with blue stroke background layer */}
            <div className='home-view-content__text-stroke-layer'>
              <h1
                id='main-headline'
                aria-label="Let's Get You Fitted - Welcome to SusFit"
              >
                <div className='splash-title-line1'>Let's</div>
                <div className='splash-title-line2'>Get</div>
                <div className='splash-title-line3'>You</div>
                <div>Fitted</div>
              </h1>
            </div>

            {/* Text with GIF background layer - exactly like masking.html */}
            <div className='home-view-content__animated-gif-text'>
              <h1
                id='main-headline-gif'
                aria-hidden='true'
              >
                <div className='splash-title-line1'>Let's</div>
                <div className='splash-title-line2'>Get</div>
                <div className='splash-title-line3'>You</div>
                <div>Fitted</div>
              </h1>
            </div>

            <span className='sr-only'>
              Let's Get You Fitted - Welcome to SusFit, your personal fitting
              experience
            </span>
          </section>
        </div>

        {/* Skip link for keyboard navigation */}
        <a
          href='#main-content'
          className='skip-link'
          tabIndex={0}
        >
          Skip to main content
        </a>

        {/* Performance monitoring marker */}
        <div
          className='performance-marker'
          data-component='home-view-content'
          data-loaded={gifLoaded}
          data-error={gifError}
          aria-hidden='true'
        />
      </main>
    );
  }
);

HomeViewContent.displayName = 'HomeViewContent';
