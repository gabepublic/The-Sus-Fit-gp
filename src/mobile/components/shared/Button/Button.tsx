'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { BaseButtonProps } from './Button.types';
import styles from './Button.module.css';

/**
 * Base Button Component - Foundation for all button variants
 *
 * Features:
 * - Brutalist design system with pink/black/blue color scheme
 * - Multiple size variants (small, medium, large)
 * - Multiple style variants (primary, secondary, outline, upload, next)
 * - Loading state with spinner animation
 * - Disabled state handling
 * - Touch-friendly interactions
 * - Full accessibility support
 * - Mobile-responsive design
 * - Animation support with framer-motion
 *
 * @param props BaseButtonProps
 * @returns JSX.Element
 */
export const Button = React.memo<BaseButtonProps>(function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  testId = 'shared-button',
  style,
  viewType = 'generic',
  ariaLabel,
  onClick,
  onTouchStart,
  onTouchEnd,
  onKeyDown
}) {
  // Handle button click
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }, [disabled, loading, onClick]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event as any);
    }

    onKeyDown?.(event);
  }, [disabled, loading, onClick, onKeyDown]);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onTouchStart?.(event);
  }, [disabled, loading, onTouchStart]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onTouchEnd?.(event);
  }, [disabled, loading, onTouchEnd]);

  // Build CSS classes
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  // Default content based on variant
  const getDefaultContent = () => {
    if (loading) {
      return (
        <>
          <span className={styles.text}>
            {variant === 'upload' ? 'Uploading...' : 'Loading...'}
          </span>
          <div className={styles.spinner} />
        </>
      );
    }

    switch (variant) {
      case 'upload':
        return (
          <span className={styles.text}>
            Upload
          </span>
        );
      case 'next':
        return (
          <>
            <span className={styles.text}>
              Next
            </span>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </>
        );
      default:
        return (
          <span className={styles.text}>
            Button
          </span>
        );
    }
  };

  // ARIA attributes
  const ariaAttributes = {
    'aria-label': ariaLabel || getAriaLabel(),
    'aria-busy': loading,
    'aria-disabled': disabled
  };

  function getAriaLabel(): string {
    if (loading) {
      return variant === 'upload' ? 'Uploading, please wait' : 'Loading, please wait';
    }
    if (disabled) {
      return `${variant} button - disabled`;
    }
    switch (variant) {
      case 'upload':
        return 'Upload file';
      case 'next':
        return 'Continue to next step';
      default:
        return `${variant} button`;
    }
  }

  return (
    <motion.button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      data-testid={testId}
      data-view={viewType}
      style={style}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      {...ariaAttributes}
    >
      <div className={styles.content}>
        {children || getDefaultContent()}
      </div>
    </motion.button>
  );
});

Button.displayName = 'SharedButton';