'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { AnimatedBackgroundProps } from '../types';

export const AnimatedBackground = React.memo<AnimatedBackgroundProps>(function AnimatedBackground({
  className,
  src = '/images/mobile/home-page-animated.gif',
  alt = 'Animated colorful background',
  priority = false,
  quality = 75,
  placeholder,
  onLoadError,
  onLoadSuccess,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [respectsMotion, setRespectsMotion] = useState(false);

  // Check for reduced motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setRespectsMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setRespectsMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoadSuccess?.();
  }, [onLoadSuccess]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    onLoadError?.();
  }, [onLoadError]);

  // For reduced motion users, we'll use a static version if provided
  const defaultPlaceholder = '/images/mobile/static-fallback.jpg';
  const effectivePlaceholder = placeholder ?? defaultPlaceholder;
  const imageSrc = respectsMotion ? effectivePlaceholder : src;
  const imageClassName = `
    animated-background__image
    ${respectsMotion ? 'animated-background__image--static' : 'animated-background__image--animated'}
    ${isLoaded ? 'animated-background__image--loaded' : 'animated-background__image--loading'}
    ${hasError ? 'animated-background__image--error' : ''}
  `.trim();

  return (
    <div className={`animated-background ${className || ''}`} {...props}>
      {/* Animated GIF */}
      <div className="animated-background__container">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={imageClassName}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          priority={priority}
          quality={quality}
          loading={priority ? undefined : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          sizes="(max-width: 428px) 100vw, 428px"
          unoptimized={!respectsMotion} // Don't optimize GIFs to preserve animation
        />
        
        {/* Loading placeholder */}
        {!isLoaded && !hasError && (
          <div className="animated-background__loading">
            <div className="animated-background__loading-spinner" />
          </div>
        )}

        {/* Error fallback */}
        {hasError && (
          <div className="animated-background__error">
            <div className="animated-background__error-content">
              <div className="animated-background__error-icon">📷</div>
              <p className="animated-background__error-text">Image unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Accessibility notice for screen readers */}
      <div className="sr-only" aria-live="polite">
        {respectsMotion 
          ? 'Animated background disabled due to motion preferences'
          : 'Animated background active'
        }
      </div>
    </div>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';