/**
 * @fileoverview ActionButton Component - Specialized buttons for Try It On and Share actions
 * @module @/mobile/components/shared/Button/ActionButton
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import type {
  ActionButtonProps,
  ActionButtonVariant,
  ActionButtonState
} from './ActionButton.types';
import {
  ACTION_BUTTON_VARIANTS,
  ACTION_BUTTON_CSS_CLASSES,
  mergeActionButtonConfig,
  getActionButtonAriaLabel
} from './ActionButton.types';
import styles from './Button.module.css';

/**
 * ActionButton Component - Specialized button for Try It On workflow actions
 *
 * Features:
 * - Support for 'tryon' and 'share' variants
 * - Immediate hiding functionality to prevent spam clicking
 * - Brutalist design system integration
 * - Enhanced haptic feedback for mobile devices
 * - Full accessibility compliance with ARIA support and reduced motion support
 * - Advanced Framer Motion animations with spring physics and 3D transforms
 * - Enhanced mobile touch interactions with gesture recognition
 * - Animated progress indication for loading states
 * - Success feedback states with celebration animations
 * - 52px+ touch targets for optimal mobile usability
 * - Performance optimized for 60fps animations on mobile devices
 *
 * @param props ActionButtonProps
 * @returns JSX.Element
 */
export const ActionButton = React.memo<ActionButtonProps>(function ActionButton({
  variant,
  state = 'visible',
  config: userConfig,
  progress = 0,
  successMessage,
  icon,
  fullWidth = false,
  accessibility,
  children,
  size = 'large',
  disabled = false,
  className = '',
  testId = 'action-button',
  style,
  viewType = 'tryon',
  ariaLabel,
  onClick,
  onBeforeAction,
  onAfterAction,
  onShow,
  onHide,
  onProcessingChange,
  onTouchStart,
  onTouchEnd,
  onKeyDown
}) {
  // Merge configuration with defaults
  const config = useMemo(() => mergeActionButtonConfig(userConfig), [userConfig]);

  // Internal component state
  const [internalState, setInternalState] = useState<ActionButtonState>(state || 'visible');
  const [isVisible, setIsVisible] = useState(state !== 'hidden');
  const [hapticSupported, setHapticSupported] = useState(false);

  // Check haptic feedback support
  useEffect(() => {
    setHapticSupported('vibrate' in navigator && config.enableHapticFeedback);
  }, [config.enableHapticFeedback]);

  // Sync internal state with prop state
  useEffect(() => {
    if (state !== internalState) {
      setInternalState(state as ActionButtonState);
      setIsVisible(state !== 'hidden');

      // Notify visibility changes
      if (state === 'hidden' && internalState !== 'hidden') {
        onHide?.();
      } else if (state !== 'hidden' && internalState === 'hidden') {
        onShow?.();
      }

      // Notify processing changes
      if ((state === 'processing') !== (internalState === 'processing')) {
        onProcessingChange?.(state === 'processing');
      }
    }
  }, [state, internalState, onHide, onShow, onProcessingChange]);

  // =============================================================================
  // HAPTIC FEEDBACK
  // =============================================================================

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (hapticSupported && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [hapticSupported]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle button click with immediate hiding and haptic feedback
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing' || internalState === 'disabled') {
      event.preventDefault();
      return;
    }

    // Trigger haptic feedback
    if (config.hapticConfig.tap) {
      triggerHaptic(config.hapticConfig.tap);
    }

    // Call before action callback
    onBeforeAction?.(variant);

    // Immediately hide button if configured
    if (config.immediateHide) {
      setInternalState('hidden' as ActionButtonState);
      setIsVisible(false);
      onHide?.();
    } else if (config.autoHide) {
      // Auto-hide after delay
      setTimeout(() => {
        setInternalState('hidden' as ActionButtonState);
        setIsVisible(false);
        onHide?.();
      }, config.autoHideDelay);
    }

    // Call original onClick handler
    onClick?.(event);

    // Call after action callback
    onAfterAction?.(variant);
  }, [
    disabled,
    internalState,
    variant,
    config.immediateHide,
    config.autoHide,
    config.autoHideDelay,
    config.hapticConfig.tap,
    triggerHaptic,
    onBeforeAction,
    onAfterAction,
    onHide,
    onClick
  ]);

  /**
   * Enhanced touch event handlers with improved mobile interactions
   */
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing') return;

    // Enhanced haptic feedback on touch start
    if (config.enableHapticFeedback && config.hapticConfig.tap) {
      triggerHaptic(config.hapticConfig.tap); // Use configured haptic pattern
    }

    onTouchStart?.(event);
  }, [disabled, internalState, config.enableHapticFeedback, config.hapticConfig.tap, triggerHaptic, onTouchStart]);

  /**
   * Handle touch end with completion haptic feedback
   */
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing') return;

    // Success haptic feedback on touch end
    if (config.enableHapticFeedback && internalState === 'success' && config.hapticConfig.success) {
      triggerHaptic(config.hapticConfig.success);
    }

    onTouchEnd?.(event);
  }, [disabled, internalState, config.enableHapticFeedback, config.hapticConfig.success, triggerHaptic, onTouchEnd]);

  /**
   * Enhanced keyboard handling
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing') return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }

    onKeyDown?.(event);
  }, [disabled, internalState, handleClick, onKeyDown]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  /**
   * Get variant configuration
   */
  const variantConfig = useMemo(() => ACTION_BUTTON_VARIANTS[variant], [variant]);

  /**
   * Build CSS classes
   */
  const actionButtonClasses = useMemo(() => [
    ACTION_BUTTON_CSS_CLASSES.base,
    ACTION_BUTTON_CSS_CLASSES.variants[variant],
    ACTION_BUTTON_CSS_CLASSES.states[internalState],
    fullWidth ? 'action-button--full-width' : '',
    className
  ].filter(Boolean).join(' '), [variant, internalState, fullWidth, className]);

  /**
   * Determine if button should be rendered
   */
  const shouldRender = useMemo(() => {
    return isVisible || internalState !== 'hidden';
  }, [isVisible, internalState]);

  /**
   * Get effective loading state
   */
  const effectiveLoading = useMemo(() => {
    return internalState === 'processing' || (progress > 0 && progress < 100);
  }, [internalState, progress]);

  /**
   * Get effective disabled state
   */
  const effectiveDisabled = useMemo(() => {
    return disabled || internalState === 'disabled' || internalState === 'processing';
  }, [disabled, internalState]);

  /**
   * Get button content
   */
  const buttonContent = useMemo(() => {
    if (children) return children;

    if (internalState === 'success' && successMessage) {
      return (
        <>
          {icon && <span className="action-button__icon">{icon}</span>}
          <span className="action-button__text">{successMessage}</span>
          <span className="action-button__success-icon">✓</span>
        </>
      );
    }

    if (effectiveLoading) {
      return (
        <>
          <span className="action-button__text">
            {variant === 'tryon' ? 'Generating...' : 'Processing...'}
          </span>
          {progress > 0 && (
            <span className="action-button__progress">
              {Math.round(progress)}%
            </span>
          )}
        </>
      );
    }

    return (
      <>
        {icon && <span className="action-button__icon">{icon}</span>}
        <span className="action-button__text">{variantConfig.defaultText}</span>
      </>
    );
  }, [
    children,
    internalState,
    successMessage,
    icon,
    effectiveLoading,
    variant,
    progress,
    variantConfig.defaultText
  ]);

  /**
   * Get ARIA label
   */
  const effectiveAriaLabel = useMemo(() => {
    return ariaLabel || getActionButtonAriaLabel(variant, internalState);
  }, [ariaLabel, variant, internalState]);

  /**
   * Animation variants for enhanced mobile interactions
   */
  const animationVariants = useMemo(() => ({
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      scale: 0.85,
      y: -15,
      rotateX: 15,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as const // Custom cubic-bezier for smooth exit
      }
    },
    processing: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    success: {
      scale: [1, 1.1, 1],
      rotateZ: [0, 5, -5, 0],
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const
      }
    }
  }), []);

  /**
   * Enhanced gesture animations for mobile touch
   */
  const gestureVariants = useMemo(() => ({
    hover: {
      scale: 1.02,
      y: -2,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const
      }
    },
    tap: {
      scale: 0.96,
      y: 1,
      transition: {
        duration: 0.1,
        ease: 'easeInOut' as const
      }
    },
    focus: {
      boxShadow: '0 0 0 3px rgba(255, 105, 180, 0.3)', // Pink focus ring
      transition: {
        duration: 0.15
      }
    }
  }), []);

  /**
   * Check for reduced motion preference
   */
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  /**
   * Get appropriate animation variant based on state and reduced motion preference
   */
  const getCurrentAnimationVariant = useMemo(() => {
    if (prefersReducedMotion) {
      // Simplified animations for reduced motion
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.15 } }
      };
    }

    // Enhanced animations for processing and success states
    if (internalState === 'processing') {
      return { ...animationVariants.visible, ...animationVariants.processing };
    }
    if (internalState === 'success') {
      return { ...animationVariants.visible, ...animationVariants.success };
    }

    return animationVariants;
  }, [animationVariants, internalState, prefersReducedMotion]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (!shouldRender) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={`action-button-${variant}-${internalState}`}
          className={actionButtonClasses}
          variants={getCurrentAnimationVariant}
          initial="hidden"
          animate="visible"
          exit="exit"
          whileHover={effectiveDisabled || prefersReducedMotion ? {} : gestureVariants.hover}
          whileTap={effectiveDisabled || prefersReducedMotion ? {} : gestureVariants.tap}
          whileFocus={effectiveDisabled || prefersReducedMotion ? {} : gestureVariants.focus}
          style={{
            width: fullWidth ? '100%' : undefined,
            perspective: '1000px', // Enable 3D transforms
            transformStyle: 'preserve-3d',
            ...style
          }}
        >
          <Button
            variant={variantConfig.variant}
            size={size}
            disabled={effectiveDisabled}
            loading={effectiveLoading}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            testId={`${testId}-${variant}`}
            viewType={viewType}
            ariaLabel={effectiveAriaLabel}
            className="action-button__button"
            style={{
              width: '100%',
              minHeight: '52px', // Ensure 44px+ touch target
              // Disable Button's own hover/tap animations to avoid conflicts
              pointerEvents: effectiveDisabled ? 'none' : 'auto'
            }}
            {...accessibility}
          >
            {buttonContent}
          </Button>

          {/* Enhanced progress bar for loading states */}
          {effectiveLoading && progress > 0 && (
            <motion.div
              className="action-button__progress-bar"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div
                className="action-button__progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.5,
                  ease: 'easeInOut' as const,
                  // Add a subtle bounce when progress completes
                  ...(progress >= 100 && {
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  })
                }}
              />
            </motion.div>
          )}

          {/* Screen reader announcements */}
          <div
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {internalState === 'processing' && `${variantConfig.defaultText} in progress`}
            {internalState === 'success' && `${variantConfig.defaultText} completed successfully`}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ActionButton.displayName = 'ActionButton';