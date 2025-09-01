'use client';

import React from 'react';
import Image from 'next/image';
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
      <div className="yellow-banner__svg-container">
        <Image
          src="/images/mobile/YellowBlob.svg"
          alt=""
          width={369}
          height={636}
          className="yellow-banner__svg"
          priority
        />
        <div className="yellow-banner__content">
          {children}
        </div>
      </div>
    </div>
  );
});

YellowBanner.displayName = 'YellowBanner';