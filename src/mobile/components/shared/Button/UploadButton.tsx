'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadButtonProps, HapticPattern, ButtonError } from './Button.types';
import { Button } from './Button';
import styles from './Button.module.css';

/**
 * UploadButton Component - Specialized button for file uploads with drag-and-drop support
 *
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - File input with custom styling
 * - Drag and drop functionality
 * - Multiple file type support
 * - Keyboard accessibility (Space/Enter activation)
 * - Visual feedback for drag states
 * - Mobile-friendly touch interactions with 44px minimum targets
 * - Haptic feedback support (Web Vibration API)
 * - High contrast and reduced motion support
 * - Error handling and validation
 *
 * @param props UploadButtonProps
 * @returns JSX.Element
 */
export const UploadButton = React.memo<UploadButtonProps>(function UploadButton({
  onFileSelect,
  accept = 'image/*',
  disabled = false,
  variant = 'upload',
  size = 'medium',
  isRedo = false,
  children,
  className = '',
  testId = 'shared-upload-button',
  loading = false,
  onTouchStart,
  onTouchEnd,
  onError,
  enableHapticFeedback = true,
  style,
  viewType = 'generic'
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [supportsVibration, setSupportsVibration] = useState(false);

  // Check for vibration support on component mount
  useEffect(() => {
    setSupportsVibration('vibrate' in navigator && enableHapticFeedback);
  }, [enableHapticFeedback]);

  // Haptic feedback utility function
  const triggerHapticFeedback = useCallback((pattern: HapticPattern = 50) => {
    if (supportsVibration && !disabled) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Haptic feedback not available:', error);
      }
    }
  }, [supportsVibration, disabled]);

  // Error handling utility
  const handleError = useCallback((error: string | Error, type: ButtonError['type'] = 'unknown') => {
    const buttonError: ButtonError = {
      type,
      message: typeof error === 'string' ? error : error.message,
      originalError: typeof error === 'string' ? undefined : error,
      timestamp: new Date(),
      code: type.toUpperCase()
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('UploadButton error:', buttonError);
    }

    triggerHapticFeedback([100, 50, 100, 50, 100]); // Error pattern
    onError?.(buttonError.message);
  }, [onError, triggerHapticFeedback]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        // Basic file validation
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

          if (!isAccepted) {
            handleError(`File type not accepted. Expected: ${accept}`, 'validation');
            return;
          }
        }

        triggerHapticFeedback([50, 30, 50]); // Success pattern
        onFileSelect(file);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    } catch (error) {
      handleError(error instanceof Error ? error : String(error), 'upload');
    }
  }, [onFileSelect, accept, handleError, triggerHapticFeedback]);

  // Handle button click
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    triggerHapticFeedback(25); // Light tap
    fileInputRef.current?.click();
  }, [disabled, loading, triggerHapticFeedback]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerHapticFeedback(30); // Keyboard activation
      fileInputRef.current?.click();
    }
  }, [disabled, loading, triggerHapticFeedback]);

  // Handle touch events with enhanced feedback
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    setIsPressed(true);
    triggerHapticFeedback(15); // Light touch feedback
    onTouchStart?.(event);
  }, [disabled, loading, onTouchStart, triggerHapticFeedback]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLButtonElement>) => {
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
          handleError(`File type not accepted. Expected: ${accept}`, 'validation');
        }
      } else {
        triggerHapticFeedback([50, 30, 50]); // Success drop
        onFileSelect(file);
      }
    }
  }, [disabled, loading, accept, onFileSelect, handleError, triggerHapticFeedback]);

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
  const containerClasses = [
    styles.uploadContainer,
    className
  ].filter(Boolean).join(' ');

  const buttonClasses = [
    isDragActive ? styles.dragActive : '',
    isPressed ? styles.pressed : ''
  ].filter(Boolean).join(' ');

  // Default content for upload button
  const defaultContent = (
    <span className={styles.text}>
      {loading ? 'Uploading...' : (isDragActive ? 'Drop Here' : (isRedo ? 'Re-do' : `Upload Your ${viewType === 'fit' ? 'Fit' : viewType === 'angle' ? 'Angle' : 'Image'}`))}
    </span>
  );

  // ARIA label based on current state
  const ariaLabel = isDragActive
    ? 'Drop file to upload'
    : loading
    ? 'Uploading file, please wait'
    : isRedo
    ? 'Re-upload file'
    : `Upload ${viewType} file`;

  return (
    <div className={containerClasses}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.hiddenInput}
        disabled={disabled || loading}
        aria-hidden="true"
        tabIndex={-1}
      />

      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={buttonClasses}
        animate={isPressed ? { scale: 0.98 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          loading={loading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          testId={testId}
          style={style}
          viewType={viewType}
          ariaLabel={ariaLabel}
        >
          {children || defaultContent}
        </Button>
      </motion.div>

      {/* Screen reader announcements */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {isDragActive && 'Drop zone active'}
        {loading && 'File uploading'}
      </div>
    </div>
  );
});

UploadButton.displayName = 'SharedUploadButton';