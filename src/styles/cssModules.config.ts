/**
 * @fileoverview CSS Modules configuration and utilities for type-safe CSS class usage
 * @module styles/cssModules.config
 * @version 1.0.0
 */

/**
 * CSS Modules class name generator utility
 * Provides type safety and consistent naming for CSS module classes
 */
export interface CSSModuleClasses {
  readonly [key: string]: string;
}

/**
 * CSS Module configuration options
 */
export interface CSSModuleConfig {
  /** Enable development mode with readable class names */
  developmentMode?: boolean;
  /** Base path for CSS modules */
  basePath?: string;
  /** Class name pattern */
  localIdentName?: string;
}

/**
 * Default CSS Module configuration
 */
export const defaultCSSModuleConfig: Required<CSSModuleConfig> = {
  developmentMode: process.env.NODE_ENV === 'development',
  basePath: '/src',
  localIdentName: process.env.NODE_ENV === 'production' 
    ? '[hash:base64:8]' 
    : '[name]__[local]--[hash:base64:5]'
};

/**
 * Utility to combine CSS module classes with conditional logic
 * Similar to clsx but optimized for CSS modules
 * 
 * @param classes CSS module classes object
 * @param conditions Object mapping class names to boolean conditions
 * @returns Combined class names string
 * 
 * @example
 * ```typescript
 * import styles from './component.module.css';
 * 
 * const className = combineClasses(styles, {
 *   container: true,
 *   active: isActive,
 *   disabled: isDisabled
 * });
 * ```
 */
export function combineClasses(
  classes: CSSModuleClasses,
  conditions: Record<string, boolean | undefined | null>
): string {
  return Object.entries(conditions)
    .filter(([, condition]) => condition)
    .map(([className]) => classes[className])
    .filter(Boolean)
    .join(' ');
}

/**
 * Create a CSS module class combiner for a specific module
 * Returns a function bound to the module's classes
 * 
 * @param classes CSS module classes object
 * @returns Function to combine classes from this module
 * 
 * @example
 * ```typescript
 * import styles from './component.module.css';
 * const cx = createClassCombiner(styles);
 * 
 * // Usage
 * <div className={cx({ container: true, active: isActive })} />
 * ```
 */
export function createClassCombiner(classes: CSSModuleClasses) {
  return (conditions: Record<string, boolean | undefined | null>) => 
    combineClasses(classes, conditions);
}

/**
 * CSS Module theme configuration
 * Defines the structure for theme-aware CSS modules
 */
export interface CSSModuleTheme {
  /** Color tokens */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  
  /** Spacing tokens */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  
  /** Typography tokens */
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      normal: string;
      bold: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      loose: string;
    };
  };
  
  /** Shadow tokens */
  shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    brutalist: string;
  };
  
  /** Animation tokens */
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      bounce: string;
    };
  };
}

/**
 * Brutalist theme configuration
 */
export const brutalistTheme: CSSModuleTheme = {
  colors: {
    primary: 'var(--color-pink)',
    secondary: 'var(--color-blue)', 
    accent: 'var(--color-pink)',
    background: 'var(--color-white)',
    surface: 'var(--color-white)',
    text: 'var(--color-black)',
    textSecondary: 'var(--color-black)',
    border: 'var(--color-black)',
    error: '#ff0000',
    warning: '#ffaa00',
    success: '#00ff00'
  },
  spacing: {
    xs: 'var(--space-1)',
    sm: 'var(--space-2)',
    md: 'var(--space-3)',
    lg: 'var(--space-4)',
    xl: 'var(--space-6)',
    xxl: 'var(--space-8)'
  },
  typography: {
    fontFamily: 'var(--font-bold)',
    fontSize: {
      xs: 'var(--font-size-xs)',
      sm: 'var(--font-size-sm)',
      base: 'var(--font-size-base)',
      lg: 'var(--font-size-lg)',
      xl: 'var(--font-size-xl)',
      xxl: 'var(--font-size-2xl)'
    },
    fontWeight: {
      normal: '400',
      bold: '700'
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      loose: '1.8'
    }
  },
  shadows: {
    none: 'none',
    sm: 'var(--shadow-brutalist)',
    md: 'var(--shadow-brutalist-hover)',
    lg: 'var(--shadow-brutalist-pressed)',
    brutalist: 'var(--shadow-brutalist)'
  },
  animations: {
    duration: {
      fast: 'var(--duration-fast)',
      normal: 'var(--duration-normal)',
      slow: 'var(--duration-slow)'
    },
    easing: {
      linear: 'linear',
      easeIn: 'var(--ease-in)',
      easeOut: 'var(--ease-out)',
      easeInOut: 'var(--ease-in-out)',
      bounce: 'var(--ease-bounce)'
    }
  }
};

/**
 * Mobile-specific CSS utilities
 */
export const mobileUtils = {
  /** Safe area insets for notched devices */
  safeArea: {
    top: 'var(--mobile-safe-area-top)',
    bottom: 'var(--mobile-safe-area-bottom)'
  },
  
  /** Touch target size (minimum 44px) */
  touchTarget: 'var(--mobile-touch-target)',
  
  /** Mobile viewport height (accounting for browser UI) */
  viewportHeight: 'var(--mobile-viewport-height)',
  
  /** Common mobile breakpoint (phone only, no tablets) */
  maxWidth: '480px',
  
  /** Mobile-optimized focus styles */
  focusRing: '2px solid var(--color-blue)',
  
  /** Mobile-optimized tap highlight */
  tapHighlight: 'transparent'
};

/**
 * Performance optimizations for CSS modules
 */
export const performanceHints = {
  /** Properties that trigger GPU acceleration */
  gpuProperties: ['transform', 'opacity', 'filter', 'backdrop-filter'],
  
  /** CSS containment for performance */
  containment: {
    layout: 'contain: layout;',
    style: 'contain: style;',
    paint: 'contain: paint;',
    size: 'contain: size;',
    strict: 'contain: strict;',
    content: 'contain: content;'
  },
  
  /** Will-change property management */
  willChange: {
    auto: 'auto',
    scroll: 'scroll-position',
    contents: 'contents',
    transform: 'transform',
    opacity: 'opacity'
  }
} as const;