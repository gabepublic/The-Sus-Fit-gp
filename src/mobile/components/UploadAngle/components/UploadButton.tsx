'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { UploadButtonProps } from '../types';
import styles from './UploadButton.module.css';

/**
 * UploadButton Component - File selection with brutalist design and drag-and-drop support
 * 
 * Features:
 * - Brutalist design system (Pink #ff69b4, black borders, blue shadows)
 * - File input with custom styling
 * - Drag and drop functionality
 * - Multiple file type support
 * - Keyboard accessibility (Space/Enter activation)
 * - Visual feedback for drag states
 * - Mobile-friendly touch interactions with 44px minimum targets
 * - High contrast and reduced motion support
 * 
 * @param props UploadButtonProps
 * @returns JSX.Element
 */
export const UploadButton = React.memo<UploadButtonProps>(function UploadButton({
  onFileSelect,
  accept = 'image/*',
  disabled = false,
  variant = 'primary',
  size = 'medium',
  isRedo = false,
  children,
  className = '',
  testId = 'upload-button',
  loading = false,
  onTouchStart,
  onTouchEnd,
  onError,
  style
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    } catch (error) {
      onError?.(error instanceof Error ? error : String(error));
    }
  }, [onFileSelect, onError]);

  // Handle button click
  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled || loading) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }, [disabled, loading]);

  // Handle touch events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;
    onTouchStart?.(event);
  }, [disabled, loading, onTouchStart]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled || loading) return;
    onTouchEnd?.(event);
  }, [disabled, loading, onTouchEnd]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    
    setDragCounter(prev => prev + 1);
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragActive(false);
      }
      return newCount;
    });
  }, [disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    
    // Set the dropEffect to show the appropriate cursor
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    
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
          onFileSelect(file);
        }
      } else {
        onFileSelect(file);
      }
    }
  }, [disabled, accept, onFileSelect]);

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
    isDragActive ? styles.dragActive : '',
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  const defaultContent = (
    <div className={styles.content}>
      <span className={styles.text}>
        {loading ? 'Uploading...' : (isDragActive ? 'Drop Here' : (isRedo ? 'Re-do' : 'Upload Your Angle'))}
      </span>
    </div>
  );

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.input}
        disabled={disabled}
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
        aria-label={isDragActive ? 'Drop image to upload' : 'Upload image file'}
        style={style}
      >
        {children || defaultContent}
      </button>
    </div>
  );
});

UploadButton.displayName = 'UploadButton';