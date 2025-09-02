'use client';

import React, { useCallback } from 'react';
import { NextButtonProps } from '../types';
import styles from './NextButton.module.css';

/**
 * NextButton Component - Workflow progression button with brutalist design
 * 
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - Context-aware enabling/disabling based on upload state
 * - Loading state with spinner animation
 * - Visual feedback for user interactions
 * - Mobile-friendly touch interactions with 44px minimum targets
 * - High contrast and reduced motion support
 * - Keyboard accessibility
 * 
 * @param props NextButtonProps
 * @returns JSX.Element
 */
export const NextButton = React.memo<NextButtonProps>(function NextButton({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  loading = false,
  children,
  className = '',
  testId = 'next-button'
}) {
  
  // Handle button click
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (disabled || loading) return;
    onClick();
  }, [disabled, loading, onClick]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }, [disabled, loading, onClick]);

  // Build CSS classes
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  const defaultContent = (
    <>
      <span className={styles.text}>
        {loading ? 'Processing...' : 'Next'}
      </span>
      {!loading && (
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
      )}
      {loading && <div className={styles.spinner} />}
    </>
  );

  const ariaLabel = React.useMemo(() => {
    if (loading) return 'Processing, please wait';
    if (disabled) return 'Next button - disabled';
    return 'Continue to next step';
  }, [loading, disabled]);

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      data-testid={testId}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      <div className={styles.content}>
        {children || defaultContent}
      </div>
    </button>
  );
});

NextButton.displayName = 'NextButton';