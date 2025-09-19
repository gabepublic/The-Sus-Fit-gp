'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { NextButtonProps, NextButtonState } from './Button.types';
import { Button } from './Button';
import styles from './Button.module.css';

/**
 * NextButton Component - Specialized button for workflow progression
 *
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - Three-state management: hidden, visible, loading
 * - Context-aware enabling/disabling based on upload state
 * - Fade-in animation for smooth appearance
 * - Loading state with spinner animation
 * - Visual feedback for user interactions
 * - Mobile-friendly touch interactions with 44px minimum targets
 * - High contrast and reduced motion support
 * - Keyboard accessibility
 * - Next.js router integration for navigation
 * - Progressive enhancement with fallback anchor tag
 *
 * @param props NextButtonProps
 * @returns JSX.Element
 */
export const NextButton = React.memo<NextButtonProps>(function NextButton({
  onClick,
  uploadStatus = 'idle',
  disabled = false,
  variant = 'next',
  size = 'medium',
  loading = false,
  children,
  className = '',
  testId = 'shared-next-button',
  config,
  style,
  viewType = 'generic'
}) {
  const router = useRouter();

  // Component state
  const [buttonState, setButtonState] = useState<NextButtonState>('hidden');
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Configuration with defaults
  const {
    targetRoute = '/m/upload-fit',
    enablePrefetch = true,
    enableLogging = false,
    onNavigationSuccess,
    onNavigationError
  } = config || {};

  // Determine button visibility and state based on upload status
  useEffect(() => {
    switch (uploadStatus) {
      case 'idle':
        setButtonState('hidden');
        setIsVisible(false);
        break;
      case 'uploading':
        setButtonState('hidden');
        setIsVisible(false);
        break;
      case 'complete':
        setButtonState('visible');
        setIsVisible(true);
        break;
      case 'error':
        setButtonState('disabled');
        setIsVisible(true);
        break;
      default:
        setButtonState('hidden');
        setIsVisible(false);
    }
  }, [uploadStatus]);

  // Prefetch target route when button becomes visible
  useEffect(() => {
    if (isVisible && enablePrefetch) {
      try {
        router.prefetch(targetRoute);
        if (enableLogging) {
          console.log(`NextButton: Prefetched route ${targetRoute}`);
        }
      } catch (error) {
        console.warn('NextButton: Failed to prefetch route:', error);
      }
    }
  }, [isVisible, enablePrefetch, targetRoute, router, enableLogging]);

  // Handle navigation
  const handleNavigation = useCallback(async () => {
    if (isNavigating || buttonState === 'disabled') return;

    setIsNavigating(true);
    setNavigationError(null);

    try {
      if (enableLogging) {
        console.log(`NextButton: Navigating to ${targetRoute}`);
      }

      // Use Next.js router for navigation
      await router.push(targetRoute);

      onNavigationSuccess?.();

      if (enableLogging) {
        console.log(`NextButton: Successfully navigated to ${targetRoute}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Navigation failed';
      setNavigationError(errorMessage);
      onNavigationError?.(error instanceof Error ? error : new Error(errorMessage));

      if (enableLogging) {
        console.error(`NextButton: Navigation failed:`, error);
      }
    } finally {
      setIsNavigating(false);
    }
  }, [
    isNavigating,
    buttonState,
    targetRoute,
    router,
    onNavigationSuccess,
    onNavigationError,
    enableLogging
  ]);

  // Handle button click with state management and navigation
  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // Check combined disabled state
    const effectiveDisabled = disabled || buttonState === 'disabled' || loading || isNavigating;
    if (effectiveDisabled) return;

    // Execute the custom onClick callback first (if provided)
    if (onClick) {
      onClick(event);
    }

    // Navigate to target route
    await handleNavigation();
  }, [disabled, buttonState, loading, isNavigating, onClick, handleNavigation]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    const effectiveDisabled = disabled || buttonState === 'disabled' || loading || isNavigating;
    if (effectiveDisabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  }, [disabled, buttonState, loading, isNavigating, handleClick]);

  // Determine effective loading state
  const effectiveLoading = loading || isNavigating;
  const effectiveDisabled = disabled || buttonState === 'disabled';

  // Build CSS classes with slide-in animation support
  const containerClasses = [
    styles.slideInContainer,
    isVisible ? styles.slideInVisible : '',
    className
  ].filter(Boolean).join(' ');

  // Get dynamic content based on state
  const getButtonText = (): string => {
    if (children) return children as string;

    if (effectiveLoading) {
      return 'Loading...';
    }

    switch (buttonState) {
      case 'visible':
        return 'Next';
      case 'disabled':
        return 'Complete Upload First';
      default:
        return 'Next';
    }
  };

  const dynamicAriaLabel = React.useMemo(() => {
    if (effectiveLoading) return 'Navigating, please wait';
    if (effectiveDisabled) return 'Next button - disabled. Complete upload first.';
    return 'Continue to next step';
  }, [effectiveLoading, effectiveDisabled]);

  const defaultContent = (
    <>
      <span className={styles.text}>
        {getButtonText()}
      </span>
      {!effectiveLoading && buttonState === 'visible' && (
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
      {effectiveLoading && <div className={styles.spinner} />}
    </>
  );

  // Don't render anything if button should be hidden
  if (!isVisible) {
    return null;
  }

  // Progressive enhancement: provide fallback navigation via anchor tag
  const fallbackHref = targetRoute;

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
    >
      {/* Progressive enhancement wrapper - works as anchor if JS fails */}
      <a
        href={fallbackHref}
        className={styles.fallbackLink}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        onClick={(e) => {
          // Prevent default anchor navigation when JS is enabled
          e.preventDefault();
        }}
      >
        <Button
          variant={variant}
          size={size}
          disabled={effectiveDisabled || effectiveLoading}
          loading={effectiveLoading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          testId={testId}
          style={style}
          viewType={viewType}
          ariaLabel={dynamicAriaLabel}
        >
          {children || defaultContent}
        </Button>
      </a>

      {/* Screen reader enhancement for mobile */}
      <div
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      >
        {effectiveLoading && 'Navigating to next step'}
        {navigationError && `Navigation failed: ${navigationError}. Please try again.`}
      </div>
    </motion.div>
  );
});

NextButton.displayName = 'SharedNextButton';