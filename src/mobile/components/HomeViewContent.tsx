'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HomeViewContentProps } from '../types';

export const HomeViewContent = React.memo<HomeViewContentProps>(function HomeViewContent({
  className,
  animationDelay = 0,
}) {
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
          announceRef.current.textContent = 'Loading interactive background content';
          setLoadingAnnounced(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gifLoaded, gifError, loadingAnnounced]);

  // Announce completion for screen readers
  useEffect(() => {
    if (gifLoaded && announceRef.current) {
      announceRef.current.textContent = 'Welcome to SusFit. Interactive background loaded successfully.';
    }
    if (gifError && announceRef.current) {
      announceRef.current.textContent = 'SusFit homepage loaded with static background.';
    }
  }, [gifLoaded, gifError]);

  return (
    <main 
      className={`home-view-content ${className || ''}`}
      role="main"
      aria-label="SusFit Homepage"
      style={{
        animationDelay: `${animationDelay}ms`
      }}
    >
      {/* Screen reader announcements */}
      <div 
        ref={announceRef}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />

      {/* Animated GIF Background */}
      <div 
        className="home-view-content__background"
        role="img"
        aria-label={gifError ? "Static background pattern" : gifLoaded ? "Animated background showcasing SusFit experience" : "Loading background content"}
      >
        {!gifError && (
          <Image
            src="/images/mobile/home-page-animated.gif"
            alt=""
            fill
            priority
            unoptimized
            className={`home-view-content__gif ${gifLoaded ? 'loaded' : 'loading'} ${reducedMotion ? 'reduced-motion' : ''}`}
            onLoad={() => setGifLoaded(true)}
            onError={() => setGifError(true)}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            // Performance optimizations
            sizes="100vw"
            quality={reducedMotion ? 75 : 85}
          />
        )}
        {gifError && (
          <div 
            className="home-view-content__fallback"
            role="img"
            aria-label="SusFit brand background pattern"
          />
        )}
      </div>

      <div className="home-view-content__container">
        {/* Text masking effect to reveal GIF background */}
        <section 
          className="home-view-content__text-mask"
          aria-labelledby="main-headline"
        >
          <h1 
            id="main-headline"
            className="home-view-content__masked-text"
            aria-label="Let's Get You Fitted - Welcome to SusFit"
          >
            <span aria-hidden="true">Let's Get You Fitted</span>
            <span className="sr-only">Let's Get You Fitted - Welcome to SusFit, your personal fitting experience</span>
          </h1>
        </section>

        {/* Skip link for keyboard navigation */}
        <a 
          href="#main-content" 
          className="skip-link"
          tabIndex={0}
        >
          Skip to main content
        </a>
      </div>

      {/* Performance monitoring marker */}
      <div 
        className="performance-marker" 
        data-component="home-view-content"
        data-loaded={gifLoaded}
        data-error={gifError}
        aria-hidden="true"
      />
    </main>
  );
});

HomeViewContent.displayName = 'HomeViewContent';