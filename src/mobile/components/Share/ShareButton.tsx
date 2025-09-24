/**
 * @fileoverview ShareButton Component - Circular sharing buttons with brutalist design
 * @module @/mobile/components/Share/ShareButton
 * @version 1.0.0
 */

'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import type {
  ShareButtonProps,
  ShareButtonState,
  SharePlatform,
  ShareResult
} from './ShareButton.types';
import {
  SHARE_PLATFORM_CONFIGS,
  SHARE_BUTTON_CSS_CLASSES,
  getShareButtonAriaLabel,
  getPlatformDisplayName,
  getPlatformIcon,
  mergeShareButtonConfig,
  createShareResult
} from './ShareButton.types';

/**
 * ShareButton Component - Circular sharing buttons with brutalist design
 *
 * Features:
 * - Circular design with 52px minimum touch target
 * - Brutalist styling with white background, black borders, pink drop-shadows
 * - Platform-specific icons and colors
 * - Framer Motion animations for interactions
 * - Haptic feedback support
 * - Full accessibility compliance
 * - Loading and success states
 *
 * @param props ShareButtonProps
 * @returns JSX.Element
 */
export const ShareButton = React.memo<ShareButtonProps>(function ShareButton({
  platform,
  state = 'idle',
  imageUrl,
  config: userConfig,
  platformConfig: userPlatformConfig,
  shareData,
  accessibility,
  disabled = false,
  className = '',
  testId = 'share-button',
  style,
  ariaLabel,
  onClick,
  onShareStart,
  onShareComplete,
  onShareError,
  onStateChange,
  onTouchStart,
  onTouchEnd,
  onKeyDown
}) {
  // Merge configurations with defaults
  const config = useMemo(() => mergeShareButtonConfig(userConfig), [userConfig]);
  const platformConfig = useMemo(() => ({
    ...SHARE_PLATFORM_CONFIGS[platform],
    ...userPlatformConfig
  }), [platform, userPlatformConfig]);

  // Internal component state
  const [internalState, setInternalState] = useState<ShareButtonState>(state);
  const [hapticSupported, setHapticSupported] = useState(false);

  // Check haptic feedback support
  useEffect(() => {
    setHapticSupported('vibrate' in navigator && config.enableHaptic);
  }, [config.enableHaptic]);

  // Sync internal state with prop state
  useEffect(() => {
    if (state !== internalState) {
      setInternalState(state);
      onStateChange?.(state, platform);
    }
  }, [state, internalState, platform, onStateChange]);

  // Auto-reset on error
  useEffect(() => {
    if (internalState === 'error' && config.autoResetOnError) {
      const timer = setTimeout(() => {
        setInternalState('idle');
        onStateChange?.('idle', platform);
      }, config.autoResetDelay);

      return () => clearTimeout(timer);
    }
  }, [internalState, config.autoResetOnError, config.autoResetDelay, platform, onStateChange]);

  // =============================================================================
  // HAPTIC FEEDBACK
  // =============================================================================

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (hapticSupported && navigator.vibrate) {
      // Only trigger haptic feedback if user has interacted with the page
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Suppress haptic errors in development/testing environments
        if (process.env.NODE_ENV === 'development') {
          console.debug('Haptic feedback blocked (expected in development):', error);
        }
      }
    }
  }, [hapticSupported]);

  // =============================================================================
  // SHARING LOGIC
  // =============================================================================

  /**
   * Handle sharing based on platform
   */
  const handleShare = useCallback(async (): Promise<ShareResult> => {
    if (!imageUrl) {
      throw new Error('No image to share');
    }

    switch (platform) {
      case 'device':
        // Use Web Share API
        if (navigator.share) {
          try {
            // Convert image URL to blob for sharing
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'tryon-result.png', { type: 'image/png' });

            await navigator.share({
              title: shareData?.title || 'My Virtual Try-On Result',
              text: shareData?.description || 'Check out my virtual try-on!',
              files: [file]
            });

            return createShareResult(true, platform);
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              // User cancelled sharing
              return createShareResult(false, platform, 'Share cancelled by user');
            }
            throw error;
          }
        } else {
          // Fallback to clipboard
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
            ]);
            return createShareResult(true, platform, undefined, {
              message: 'Image copied to clipboard'
            });
          } catch (error) {
            throw new Error('Sharing not supported on this device');
          }
        }

      case 'bluesky':
      case 'pinterest':
      case 'instagram':
        // For now, fallback to device sharing (API integrations deferred)
        // Use Web Share API if available
        if (navigator.share) {
          try {
            // Convert image URL to blob for sharing
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'tryon-result.png', { type: 'image/png' });

            await navigator.share({
              title: shareData?.title || 'My Virtual Try-On Result',
              text: shareData?.description || 'Check out my virtual try-on!',
              files: [file]
            });

            return createShareResult(true, platform);
          } catch (error) {
            if ((error as Error).name === 'AbortError') {
              // User cancelled sharing
              return createShareResult(false, platform, 'Share cancelled by user');
            }
            throw error;
          }
        } else {
          // Fallback to clipboard
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
            ]);
            return createShareResult(true, platform, undefined, {
              message: 'Image copied to clipboard'
            });
          } catch (error) {
            throw new Error('Sharing not supported on this device');
          }
        }

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }, [platform, imageUrl, shareData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handle button click
   */
  const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing' || internalState === 'disabled') {
      event.preventDefault();
      return;
    }

    // Trigger haptic feedback
    if (config.hapticConfig.tap) {
      triggerHaptic(config.hapticConfig.tap);
    }

    // Start sharing process
    setInternalState('processing');
    onStateChange?.('processing', platform);
    onShareStart?.(platform);

    try {
      const result = await handleShare();

      if (result.success) {
        setInternalState('success');
        onStateChange?.('success', platform);
        onShareComplete?.(result);

        // Success haptic feedback
        if (config.hapticConfig.success) {
          triggerHaptic(config.hapticConfig.success);
        }

        // Auto-reset to idle after success
        if (config.showSuccessFeedback) {
          setTimeout(() => {
            setInternalState('idle');
            onStateChange?.('idle', platform);
          }, config.successFeedbackDuration);
        }
      } else {
        // User cancelled sharing - this is normal behavior, not an error
        if (result.error === 'Share cancelled by user') {
          setInternalState('idle');
          onStateChange?.('idle', platform);
          // Don't call onShareError for user cancellations
          console.debug(`User cancelled ${platform} sharing`);
        } else {
          // Actual error occurred
          throw new Error(result.error || 'Share failed');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      setInternalState('error');
      onStateChange?.('error', platform);
      onShareError?.(platform, errorMessage);

      // Error haptic feedback
      if (config.hapticConfig.error) {
        triggerHaptic(config.hapticConfig.error);
      }
    }

    // Call original onClick handler
    onClick?.(event);
  }, [
    disabled,
    internalState,
    platform,
    config,
    triggerHaptic,
    handleShare,
    onStateChange,
    onShareStart,
    onShareComplete,
    onShareError,
    onClick
  ]);

  /**
   * Handle touch events
   */
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || internalState === 'processing') return;

    // Light haptic feedback on touch start
    if (config.enableHaptic && config.hapticConfig.tap) {
      triggerHaptic([25]); // Lighter feedback for touch start
    }

    onTouchStart?.(event);
  }, [disabled, internalState, config.enableHaptic, config.hapticConfig.tap, triggerHaptic, onTouchStart]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    onTouchEnd?.(event);
  }, [onTouchEnd]);

  /**
   * Handle keyboard events
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
   * Build CSS classes
   */
  const shareButtonClasses = useMemo(() => [
    SHARE_BUTTON_CSS_CLASSES.base,
    SHARE_BUTTON_CSS_CLASSES.platforms[platform],
    SHARE_BUTTON_CSS_CLASSES.states[internalState],
    className
  ].filter(Boolean).join(' '), [platform, internalState, className]);

  /**
   * Get effective disabled state
   */
  const effectiveDisabled = useMemo(() => {
    return disabled || internalState === 'disabled' || internalState === 'processing';
  }, [disabled, internalState]);

  /**
   * Get platform icon
   */
  const platformIcon = useMemo(() => {
    return getPlatformIcon(platform);
  }, [platform]);

  /**
   * Get effective ARIA label
   */
  const effectiveAriaLabel = useMemo(() => {
    return ariaLabel || getShareButtonAriaLabel(platform, internalState);
  }, [ariaLabel, platform, internalState]);

  /**
   * Animation variants
   */
  const animationVariants: Variants = useMemo(() => ({
    idle: {
      scale: 1,
      rotate: 0,
      boxShadow: '4px 4px 0px #FF69B4, 4px 4px 0px 2px #000'
    },
    hover: {
      scale: 1.05,
      y: -2,
      boxShadow: '6px 6px 0px #FF69B4, 6px 6px 0px 2px #000',
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    tap: {
      scale: 0.95,
      y: 1,
      boxShadow: '2px 2px 0px #FF69B4, 2px 2px 0px 2px #000',
      transition: {
        duration: 0.1
      }
    },
    processing: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    },
    success: {
      scale: 1.1,
      boxShadow: '6px 6px 0px #10B981, 6px 6px 0px 2px #000',
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    error: {
      scale: 1.05,
      rotate: [-5, 5, -5, 0],
      boxShadow: '4px 4px 0px #EF4444, 4px 4px 0px 2px #000',
      transition: {
        duration: 0.5,
        ease: 'easeInOut'
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

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <motion.button
      className={shareButtonClasses}
      disabled={effectiveDisabled}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      data-testid={`${testId}-${platform}`}
      aria-label={effectiveAriaLabel}
      style={{
        // Base brutalist circular button styles
        width: '52px',
        height: '52px',
        minWidth: '52px', // Ensure minimum touch target
        minHeight: '52px',
        borderRadius: '50%',
        border: '2px solid #000',
        backgroundColor: '#FFF',
        cursor: effectiveDisabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        transition: 'none', // Disable CSS transitions to let Framer Motion handle animations
        ...style
      }}
      variants={prefersReducedMotion ? undefined : animationVariants}
      initial="idle"
      animate={internalState === 'processing' ? 'processing' :
               internalState === 'success' ? 'success' :
               internalState === 'error' ? 'error' : 'idle'}
      whileHover={effectiveDisabled || prefersReducedMotion ? undefined : 'hover'}
      whileTap={effectiveDisabled || prefersReducedMotion ? undefined : 'tap'}
      {...accessibility}
    >
      {/* Platform Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        {internalState === 'processing' ? (
          // Loading spinner
          <span style={{ fontSize: '16px' }}>⟳</span>
        ) : internalState === 'success' ? (
          // Success checkmark
          <span style={{ fontSize: '16px', color: '#10B981' }}>✓</span>
        ) : internalState === 'error' ? (
          // Error icon
          <span style={{ fontSize: '16px', color: '#EF4444' }}>!</span>
        ) : (
          // Platform icon
          platformIcon
        )}
      </span>

      {/* Screen reader announcements */}
      <span className="sr-only">
        {getPlatformDisplayName(platform)} sharing button - {internalState}
      </span>
    </motion.button>
  );
});

ShareButton.displayName = 'ShareButton';