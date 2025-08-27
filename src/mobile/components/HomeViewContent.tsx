'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { HomeViewContentProps } from '../types';

export const HomeViewContent = React.memo<HomeViewContentProps>(function HomeViewContent({
  className,
  animationDelay = 0,
}) {
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);

  return (
    <div 
      className={`home-view-content ${className || ''}`}
      style={{
        animationDelay: `${animationDelay}ms`
      }}
    >
      {/* Animated GIF Background */}
      <div className="home-view-content__background">
        {!gifError && (
          <Image
            src="/images/mobile/home-page-animated.gif"
            alt=""
            fill
            priority
            unoptimized
            className={`home-view-content__gif ${gifLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setGifLoaded(true)}
            onError={() => setGifError(true)}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}
        {gifError && (
          <div className="home-view-content__fallback" />
        )}
      </div>

      <div className="home-view-content__container">
        {/* Main content will be added in subsequent tasks */}
        <div className="home-view-content__placeholder">
          <p>Home View Content - Ready for implementation</p>
        </div>
      </div>
    </div>
  );
});

HomeViewContent.displayName = 'HomeViewContent';