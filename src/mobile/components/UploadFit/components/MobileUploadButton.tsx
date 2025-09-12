'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { UploadButtonProps } from '../types';
import styles from './MobileUploadButton.module.css';

/**
 * MobileUploadButton Component - Fit-specific upload button with brutalist design and mobile optimizations
 * 
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - Mobile-first touch interactions with haptic feedback
 * - WCAG 2.2 compliance with enhanced accessibility
 * - File input with custom styling optimized for fits
 * - Drag and drop functionality
 * - Multiple file type support with fit validation
 * - Keyboard accessibility (Space/Enter activation)
 * - Visual feedback for drag states
 * - Web Vibration API integration for haptic feedback
 * - GPU-accelerated animations for 60fps performance
 * - 44px minimum touch targets for mobile usability
 * - High contrast and reduced motion support
 * 
 * @param props UploadButtonProps
 * @returns JSX.Element
 */
export const MobileUploadButton = React.memo<UploadButtonProps>(function MobileUploadButton({
  onFileSelect,
  accept = 'image/*',
  disabled = false,
  variant = 'primary',
  size = 'medium',
  isRedo = false,
  children,
  className = '',
  testId = 'mobile-upload-button',
  loading = false,
  onTouchStart,
  onTouchEnd,
  onError,
  style
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [supportsVibration, setSupportsVibration] = useState(false);

  // Check for vibration support on component mount
  useEffect(() => {
    setSupportsVibration('vibrate' in navigator);
  }, []);

  // Haptic feedback utility function
  const triggerHapticFeedback = useCallback((pattern: number | number[] = 50) => {
    if (supportsVibration && !disabled) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
      }
    }
  }, [supportsVibration, disabled]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        triggerHapticFeedback([50, 30, 50]); // Success pattern
        onFileSelect(file);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    } catch (error) {
      triggerHapticFeedback([100, 50, 100, 50, 100]); // Error pattern
      onError?.(error instanceof Error ? error : String(error));
    }
  }, [onFileSelect, onError, triggerHapticFeedback]);

  // Handle button click
  const handleClick = useCallback(() => {
    if (disabled || loading) return;
    triggerHapticFeedback(25); // Light tap
    fileInputRef.current?.click();
  }, [disabled, loading, triggerHapticFeedback]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled || loading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerHapticFeedback(30); // Keyboard activation
      fileInputRef.current?.click();
    }
  }, [disabled, loading, triggerHapticFeedback]);

  // Handle touch events with enhanced feedback
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;
    setIsPressed(true);
    triggerHapticFeedback(15); // Light touch feedback
    onTouchStart?.(event);
  }, [disabled, loading, onTouchStart, triggerHapticFeedback]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;
    setIsPressed(false);
    onTouchEnd?.(event);
  }, [disabled, loading, onTouchEnd]);

  // Drag and drop handlers with haptic feedback
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || loading) return;
    
    setDragCounter(prev => prev + 1);
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragActive(true);
      triggerHapticFeedback(40); // Drag enter feedback
    }
  }, [disabled, loading, triggerHapticFeedback]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || loading) return;
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragActive(false);
      }
      return newCount;
    });
  }, [disabled, loading]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || loading) return;
    
    // Set the dropEffect to show the appropriate cursor
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled, loading]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || loading) return;
    
    setIsDragActive(false);
    setDragCounter(0);
    
    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      // Check if file type matches accept pattern
      if (accept && accept !== '*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          } else if (type.includes('/*')) {
            return file.type.startsWith(type.replace('/*', ''));
          } else {
            return file.type === type;
          }
        });
        
        if (isAccepted) {
          triggerHapticFeedback([50, 30, 50]); // Success drop
          onFileSelect(file);
        } else {
          triggerHapticFeedback([100, 50, 100]); // Invalid file type
          onError?.('Invalid file type');
        }
      } else {
        triggerHapticFeedback([50, 30, 50]); // Success drop
        onFileSelect(file);
      }
    }
  }, [disabled, loading, accept, onFileSelect, onError, triggerHapticFeedback]);

  // Prevent default drag behaviors on the window
  useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'] as const;
    events.forEach(eventName => {
      document.addEventListener(eventName, preventDefaults, false);
    });

    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, preventDefaults, false);
      });
    };
  }, []);

  // Build CSS classes
  const buttonClasses = [
    styles.button,
    styles[size],
    styles[variant] || styles.primary,
    isDragActive ? styles.dragActive : '',
    isPressed ? styles.pressed : '',
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className={styles.spinner} aria-hidden="true">
      <div className={styles.spinnerInner}></div>
    </div>
  );

  // Default button content
  const defaultContent = (
    <div className={styles.content}>
      {loading && <LoadingSpinner />}
      <span className={styles.text}>
        {loading ? 'Uploading...' : (isDragActive ? 'Drop Your Fit Here' : (isRedo ? 'Re-Do' : 'Upload Your Fit'))}
      </span>
    </div>
  );

  // ARIA label based on current state
  const ariaLabel = isDragActive 
    ? 'Drop fit image to upload' 
    : loading 
    ? 'Uploading fit image, please wait' 
    : isRedo 
    ? 'Re-do fit upload' 
    : 'Upload your fit image';

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.input}
        disabled={disabled || loading}
        aria-hidden="true"
        tabIndex={-1}
      />
      
      <button
        type="button"
        className={buttonClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || loading}
        data-testid={testId}
        aria-label={ariaLabel}
        aria-live={loading ? 'polite' : undefined}
        aria-busy={loading}
        style={style}
      >
        {children || defaultContent}
      </button>
    </div>
  );
});

MobileUploadButton.displayName = 'MobileUploadButton';