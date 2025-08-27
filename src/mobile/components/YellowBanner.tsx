'use client';

import React from 'react';
import { YellowBannerProps } from '../types';

export const YellowBanner = React.memo<YellowBannerProps>(function YellowBanner({
  className,
  children,
  animationDelay = 0,
  useSvgFallback = false,
}) {
  return (
    <div 
      className={`yellow-banner ${className || ''}`}
      style={{
        animationDelay: `${animationDelay}ms`
      }}
    >
      {useSvgFallback ? (
        <div className="yellow-banner__svg-container">
          <svg
            className="yellow-banner__svg"
            viewBox="0 0 400 300"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="rgba(0,0,0,0.15)"/>
              </filter>
            </defs>
            <path
              d="M80 30 Q160 25 240 36 Q320 60 360 105 Q380 165 352 225 Q300 255 220 270 Q140 264 60 234 Q32 180 48 120 Q60 75 80 30 Z"
              fill="var(--color-susfit-yellow, #f9b801)"
              filter="url(#drop-shadow)"
            />
          </svg>
          <div className="yellow-banner__content yellow-banner__content--svg">
            {children}
          </div>
        </div>
      ) : (
        <div className="yellow-banner__shape">
          <div className="yellow-banner__content">
            {children}
          </div>
        </div>
      )}
    </div>
  );
});

YellowBanner.displayName = 'YellowBanner';