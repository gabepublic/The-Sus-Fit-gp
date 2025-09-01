'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { UploadButtonProps } from '../types';

/**
 * UploadButton Component - File selection with drag-and-drop support
 * 
 * Features:
 * - File input with custom styling
 * - Drag and drop functionality
 * - Multiple file type support
 * - Keyboard accessibility (Space/Enter activation)
 * - Visual feedback for drag states
 * - Mobile-friendly touch interactions
 * - Multiple size and variant options
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
  const [isFocused, setIsFocused] = useState(false);

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

  // Focus handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

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

  const buttonClasses = `
    upload-button
    upload-button--${variant}
    upload-button--${size}
    ${isDragActive ? 'upload-button--drag-active' : ''}
    ${disabled ? 'upload-button--disabled' : ''}
    ${isFocused ? 'upload-button--focused' : ''}
    ${className}
  `.trim();

  const defaultContent = (
    <div className="upload-button__content">
      <svg
        className="upload-button__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,3 7,8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span className="upload-button__text">
        {isDragActive ? 'Drop image here' : 'Upload Image'}
      </span>
      {!isDragActive && (
        <span className="upload-button__hint">
          or drag and drop
        </span>
      )}
    </div>
  );

  return (
    <div className="upload-button-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="upload-button__input"
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />
      
      <button
        type="button"
        className={buttonClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
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

      <style jsx>{`
        .upload-button-container {
          position: relative;
          display: inline-block;
        }

        .upload-button__input {
          position: absolute;
          opacity: 0;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .upload-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          text-decoration: none;
          user-select: none;
          outline: none;
          min-width: 120px;
        }

        /* Size variants */
        .upload-button--small {
          padding: 8px 16px;
          font-size: 14px;
          line-height: 1.25;
          gap: 6px;
        }

        .upload-button--medium {
          padding: 12px 24px;
          font-size: 16px;
          line-height: 1.5;
          gap: 8px;
        }

        .upload-button--large {
          padding: 16px 32px;
          font-size: 18px;
          line-height: 1.5;
          gap: 10px;
        }

        /* Variant styles */
        .upload-button--primary {
          background: linear-gradient(145deg, #3b82f6, #2563eb);
          color: white;
          border: 2px solid transparent;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .upload-button--primary:hover:not(.upload-button--disabled) {
          background: linear-gradient(145deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .upload-button--secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .upload-button--secondary:hover:not(.upload-button--disabled) {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .upload-button--outline {
          background: transparent;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .upload-button--outline:hover:not(.upload-button--disabled) {
          background: rgba(59, 130, 246, 0.05);
          border-color: #2563eb;
        }

        /* State variants */
        .upload-button--focused {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .upload-button--drag-active {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          color: #065f46;
          transform: scale(1.02);
        }

        .upload-button--drag-active.upload-button--primary {
          background: linear-gradient(145deg, #10b981, #059669);
          color: white;
        }

        .upload-button--disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .upload-button__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .upload-button__icon {
          width: 20px;
          height: 20px;
        }

        .upload-button--large .upload-button__icon {
          width: 24px;
          height: 24px;
        }

        .upload-button--small .upload-button__icon {
          width: 16px;
          height: 16px;
        }

        .upload-button__text {
          font-weight: 600;
        }

        .upload-button__hint {
          font-size: 0.75em;
          opacity: 0.8;
          font-weight: 400;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .upload-button {
            min-width: 100px;
          }
          
          .upload-button--medium {
            padding: 10px 20px;
            font-size: 15px;
          }
          
          .upload-button--large {
            padding: 12px 24px;
            font-size: 16px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .upload-button {
            transition: none;
          }
          
          .upload-button:hover:not(.upload-button--disabled) {
            transform: none;
          }
          
          .upload-button--drag-active {
            transform: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .upload-button--primary {
            background: #000;
            border-color: #000;
          }
          
          .upload-button--secondary,
          .upload-button--outline {
            border-width: 3px;
          }
        }
      `}</style>
    </div>
  );
});

UploadButton.displayName = 'UploadButton';