/**
 * @fileoverview CSS Modules TypeScript declarations
 * @module types/css-modules
 * @version 1.0.0
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

// CSS custom properties type support
declare global {
  namespace CSS {
    interface Properties {
      // Brutalist design system tokens
      '--color-pink'?: string;
      '--color-black'?: string;
      '--color-blue'?: string;
      '--color-white'?: string;
      
      // Spacing system
      '--space-1'?: string;
      '--space-2'?: string;
      '--space-3'?: string;
      '--space-4'?: string;
      '--space-5'?: string;
      '--space-6'?: string;
      '--space-8'?: string;
      '--space-10'?: string;
      '--space-12'?: string;
      '--space-16'?: string;
      '--space-20'?: string;
      '--space-24'?: string;
      '--space-32'?: string;
      
      // Typography tokens
      '--font-bold'?: string;
      '--font-size-xs'?: string;
      '--font-size-sm'?: string;
      '--font-size-base'?: string;
      '--font-size-lg'?: string;
      '--font-size-xl'?: string;
      '--font-size-2xl'?: string;
      '--font-size-3xl'?: string;
      '--font-size-4xl'?: string;
      
      // Shadow tokens
      '--shadow-brutalist'?: string;
      '--shadow-brutalist-hover'?: string;
      '--shadow-brutalist-pressed'?: string;
      '--shadow-brutalist-focus'?: string;
      
      // Border radius
      '--radius-none'?: string;
      '--radius-sm'?: string;
      '--radius-md'?: string;
      '--radius-lg'?: string;
      
      // Z-index layers
      '--z-base'?: string;
      '--z-elevated'?: string;
      '--z-sticky'?: string;
      '--z-fixed'?: string;
      '--z-modal-backdrop'?: string;
      '--z-modal'?: string;
      '--z-popover'?: string;
      '--z-tooltip'?: string;
      
      // Animation tokens
      '--duration-fast'?: string;
      '--duration-normal'?: string;
      '--duration-slow'?: string;
      '--ease-out'?: string;
      '--ease-in'?: string;
      '--ease-in-out'?: string;
      '--ease-bounce'?: string;
      
      // Mobile-specific tokens
      '--mobile-touch-target'?: string;
      '--mobile-safe-area-top'?: string;
      '--mobile-safe-area-bottom'?: string;
      '--mobile-viewport-height'?: string;
    }
  }
}