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
  children,
  className = '',
  testId = 'upload-button'
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [onFileSelect]);

  // Handle button click
  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }, [disabled]);

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
    className
  ].filter(Boolean).join(' ');

  const defaultContent = (
    <div className={styles.content}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,3 7,8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span className={styles.text}>
        {isDragActive ? 'Drop Here' : 'Upload Image'}
      </span>
      {!isDragActive && (
        <span className={styles.hint}>
          or drag and drop
        </span>
      )}
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
        disabled={disabled}
        data-testid={testId}
        aria-label={isDragActive ? 'Drop image to upload' : 'Upload image file'}
      >
        {children || defaultContent}
      </button>
    </div>
  );
});

UploadButton.displayName = 'UploadButton';