'use client';

import React, { useCallback, useEffect } from 'react';
import { NextButtonProps } from '../types';
import { useNextButtonState, getNextButtonText, getNextButtonAriaLabel, NEXT_BUTTON_STATE } from '../hooks/useNextButtonState';
import { useSlideInAnimation } from '../hooks/useSlideInAnimation';
import { useNavigateToTryOn } from '../hooks/useNavigateToTryOn';
import styles from './NextButton.module.css';

/**
 * NextButton Component - Workflow progression button with brutalist design
 * Adapted from UploadAngle NextButton for fit upload navigation to /m/tryon
 * 
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - Three-state management: hidden, visible, loading
 * - Context-aware enabling/disabling based on upload state
 * - Slide-in animation with Intersection Observer support
 * - Loading state with spinner animation
 * - Visual feedback for user interactions
 * - Mobile-friendly touch interactions with 44px minimum targets
 * - High contrast and reduced motion support
 * - Keyboard accessibility
 * 
 * @param props NextButtonProps with enhanced state management
 * @returns JSX.Element
 */
export const NextButton = React.memo<NextButtonProps>(function NextButton({
  onClick,
  uploadStatus,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  loading = false,
  children,
  className = '',
  testId = 'fit-next-button',
  config
}) {
  
  // State management hook for NextButton visibility and states
  const {
    buttonState,
    isVisible,
    isLoading,
    isDisabled,
    setLoading,
    onNavigationComplete,
    onNavigationError
  } = useNextButtonState(uploadStatus, config);

  // Slide-in animation hook with Intersection Observer
  const {
    ref: slideInRef,
    isVisible: isAnimationVisible,
    triggerAnimation,
    resetAnimation
  } = useSlideInAnimation({
    threshold: 0.1,
    delay: 150,
    triggerOnce: true,
    rootMargin: '0px 0px -20px 0px'
  });

  // Navigation hook for Next.js 14 router integration
  const {
    isNavigating: isNavigatingToTryOn,
    navigateToTryOn,
    prefetchTryOn,
    navigationError,
    resetNavigation
  } = useNavigateToTryOn({
    targetRoute: '/m/tryon',
    enablePrefetch: true,
    enableLogging: false,
    onNavigationSuccess: () => {
      onNavigationComplete();
    },
    onNavigationError: (error) => {
      console.error('Navigation to try-on failed:', error);
      onNavigationError();
    }
  });

  // Prefetch try-on route when component mounts and button becomes visible
  useEffect(() => {
    if (isVisible) {
      prefetchTryOn();
    }
  }, [isVisible, prefetchTryOn]);

  // Sync animation state with button visibility
  useEffect(() => {
    if (isVisible && !isAnimationVisible) {
      // Button should be visible, trigger slide-in animation
      triggerAnimation();
    } else if (!isVisible && isAnimationVisible) {
      // Button should be hidden, reset animation
      resetAnimation();
    }
  }, [isVisible, isAnimationVisible, triggerAnimation, resetAnimation]);

  // Handle button click with state management and navigation
  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    // Check combined disabled state including navigation state
    const effectiveDisabled = disabled || isDisabled || isLoading || isNavigatingToTryOn;
    if (effectiveDisabled) return;
    
    // Set loading state before navigation
    setLoading();
    
    try {
      // Execute the custom onClick callback first (if provided)
      if (onClick) {
        onClick();
      }
      
      // Navigate to try-on page using Next.js 14 router
      await navigateToTryOn();
      
      // Note: onNavigationComplete is called automatically via navigation hook callback
    } catch (error) {
      // Navigation error handling is managed by the navigation hook
      console.error('Navigation error in click handler:', error);
    }
  }, [
    disabled, 
    isDisabled, 
    isLoading, 
    isNavigatingToTryOn,
    setLoading, 
    onClick, 
    navigateToTryOn
  ]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    const effectiveDisabled = disabled || isDisabled || isLoading || isNavigatingToTryOn;
    if (effectiveDisabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  }, [disabled, isDisabled, isLoading, isNavigatingToTryOn, handleClick]);

  // Determine effective loading state (external loading prop OR internal state OR navigation state)
  const effectiveLoading = loading || isLoading || isNavigatingToTryOn;
  const effectiveDisabled = disabled || isDisabled;

  // Build CSS classes with slide-in animation support
  const containerClasses = [
    styles.slideInContainer,
    isAnimationVisible ? styles.slideInVisible : '',
  ].filter(Boolean).join(' ');

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    effectiveDisabled ? styles.disabled : '',
    effectiveLoading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  // Get dynamic content based on state
  const buttonText = React.useMemo(() => {
    if (children) return children;
    return getNextButtonText(buttonState);
  }, [children, buttonState]);

  const dynamicAriaLabel = React.useMemo(() => {
    if (effectiveLoading) return 'Navigating to try-on, please wait';
    if (effectiveDisabled) return 'Try it on button - disabled';
    return getNextButtonAriaLabel(buttonState);
  }, [effectiveLoading, effectiveDisabled, buttonState]);

  const defaultContent = (
    <>
      <span className={styles.text}>
        {buttonText}
      </span>
      {!effectiveLoading && buttonState === NEXT_BUTTON_STATE.VISIBLE && (
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
  const fallbackHref = '/m/tryon';

  return (
    <div 
      ref={slideInRef}
      className={containerClasses}
    >
      {/* Progressive enhancement wrapper - works as anchor if JS fails */}
      <a
        href={fallbackHref}
        className={styles.fallbackLink}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <button
          type="button"
          className={buttonClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={effectiveDisabled || effectiveLoading}
          data-testid={testId}
          aria-label={dynamicAriaLabel}
          aria-busy={effectiveLoading}
          // Progressive enhancement: prevent default anchor navigation when JS is enabled
          onFocus={() => {
            // If button receives focus, JS is working
            const parentAnchor = (event: Event) => event.preventDefault();
            const anchor = document.querySelector(`[data-testid="${testId}"]`)?.closest('a');
            if (anchor) {
              anchor.addEventListener('click', parentAnchor);
              // Clean up listener when button loses focus or unmounts
              return () => anchor.removeEventListener('click', parentAnchor);
            }
          }}
        >
          <div className={styles.content}>
            {children || defaultContent}
          </div>
        </button>
      </a>
      
      {/* Screen reader enhancement for mobile */}
      <div 
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      >
        {effectiveLoading && 'Navigating to try on your fit'}
        {navigationError && 'Navigation failed. Please try again.'}
      </div>
    </div>
  );
});

NextButton.displayName = 'NextButton';