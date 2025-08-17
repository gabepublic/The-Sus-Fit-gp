// Loading States and Progress Indicators
// React components for visual feedback during try-on operations

import React from 'react';
import { useProgressVisualization, useTryonProgress } from '../hooks/useOptimisticUpdates';

/**
 * Props for the TryonLoadingIndicator component
 */
export interface TryonLoadingIndicatorProps {
  /** Optimistic update ID for progress tracking */
  optimisticId: string;
  /** Whether to show detailed progress information */
  showDetails?: boolean;
  /** Whether to show time estimates */
  showTimeEstimate?: boolean;
  /** Whether to enable animations */
  enableAnimation?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Custom styling for the progress bar */
  progressBarStyle?: React.CSSProperties;
  /** Size variant for the indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Comprehensive loading indicator for try-on operations
 */
export function TryonLoadingIndicator({
  optimisticId,
  showDetails = true,
  showTimeEstimate = true,
  enableAnimation = true,
  className = '',
  progressBarStyle,
  size = 'md'
}: TryonLoadingIndicatorProps): React.JSX.Element | null {
  const {
    progress,
    progressPercentage,
    stageMessage,
    timeRemaining,
    progressColor,
    isAnimating
  } = useProgressVisualization(optimisticId, {
    enableStageMessages: showDetails,
    enableTimeEstimates: showTimeEstimate,
    enableAnimation
  });

  if (!progress) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-2 text-xs',
    md: 'h-3 text-sm',
    lg: 'h-4 text-base'
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`tryon-loading-indicator ${className}`}>
      {showDetails && (
        <div className="flex justify-between items-center mb-2">
          <span className={`text-gray-700 font-medium ${sizeClass.split(' ')[1]}`}>
            {stageMessage}
          </span>
          {showTimeEstimate && timeRemaining && (
            <span className={`text-gray-500 ${sizeClass.split(' ')[1]}`}>
              {timeRemaining}
            </span>
          )}
        </div>
      )}
      
      <div className="relative w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClass.split(' ')[0]} transition-all duration-500 ease-out ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: progressColor,
            ...progressBarStyle
          }}
        />
        
        {/* Shimmer effect for active processing */}
        {isAnimating && (
          <div
            className={`absolute top-0 ${sizeClass.split(' ')[0]} w-full opacity-30`}
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`,
              animation: 'shimmer 1.5s infinite'
            }}
          />
        )}
      </div>
      
      {showDetails && (
        <div className="flex justify-between items-center mt-1">
          <span className={`text-gray-600 ${sizeClass.split(' ')[1]}`}>
            {Math.round(progressPercentage)}%
          </span>
          <span className={`text-gray-500 text-xs`}>
            {progress.status === 'processing' ? 'Processing...' : 
             progress.status === 'completed' ? 'Complete!' : 
             progress.status === 'error' ? 'Error' : 'Idle'}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Props for the TryonLoadingOverlay component
 */
export interface TryonLoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Optimistic update ID for progress tracking */
  optimisticId?: string;
  /** Custom title for the overlay */
  title?: string;
  /** Custom message for the overlay */
  message?: string;
  /** Whether to show the progress indicator */
  showProgress?: boolean;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Cancel callback */
  onCancel?: () => void;
  /** Custom className for styling */
  className?: string;
}

/**
 * Full-screen loading overlay for try-on operations
 */
export function TryonLoadingOverlay({
  isVisible,
  optimisticId,
  title = 'Processing Your Try-On',
  message = 'Please wait while we generate your personalized try-on result...',
  showProgress = true,
  showCancel = false,
  onCancel,
  className = ''
}: TryonLoadingOverlayProps): React.JSX.Element | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Loading spinner */}
          <div className="mb-4 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            {message}
          </p>
          
          {/* Progress indicator */}
          {showProgress && optimisticId && (
            <div className="mb-4">
              <TryonLoadingIndicator
                optimisticId={optimisticId}
                size="md"
                showDetails={true}
                showTimeEstimate={true}
              />
            </div>
          )}
          
          {/* Cancel button */}
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the TryonLoadingPlaceholder component
 */
export interface TryonLoadingPlaceholderProps {
  /** Width of the placeholder */
  width?: number | string;
  /** Height of the placeholder */
  height?: number | string;
  /** Whether to show a loading animation */
  animated?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Preview image to show while loading */
  previewImage?: string;
  /** Optimistic update ID for progress overlay */
  optimisticId?: string;
}

/**
 * Image placeholder with loading state for try-on results
 */
export function TryonLoadingPlaceholder({
  width = 320,
  height = 480,
  animated = true,
  className = '',
  previewImage,
  optimisticId
}: TryonLoadingPlaceholderProps): React.JSX.Element {
  const { progress } = useTryonProgress(optimisticId || '');

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border ${className}`} style={style}>
      {/* Background with preview image or gradient */}
      {previewImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={previewImage}
          alt="Loading preview"
          className="w-full h-full object-cover opacity-50"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      
      {/* Loading overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80">
        {/* Loading spinner */}
        <div className={`mb-4 ${animated ? 'animate-spin' : ''}`}>
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        
        {/* Status text */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {progress?.status === 'processing' ? 'Generating...' :
             progress?.status === 'completed' ? 'Complete!' :
             progress?.status === 'error' ? 'Error occurred' :
             'Processing...'}
          </p>
          
          {progress && (
            <p className="text-xs text-gray-500">
              {Math.round(progress.progress)}% complete
            </p>
          )}
        </div>
        
        {/* Progress bar at bottom */}
        {optimisticId && (
          <div className="absolute bottom-0 left-0 right-0">
            <TryonLoadingIndicator
              optimisticId={optimisticId}
              size="sm"
              showDetails={false}
              className="px-2 pb-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Props for the TryonLoadingButton component
 */
export interface TryonLoadingButtonProps {
  /** Whether the button is in loading state */
  isLoading: boolean;
  /** Button text when not loading */
  children: React.ReactNode;
  /** Loading text override */
  loadingText?: string;
  /** Button click handler */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Optimistic update ID for progress */
  optimisticId?: string;
}

/**
 * Button with loading state for try-on actions
 */
export function TryonLoadingButton({
  isLoading,
  children,
  loadingText = 'Processing...',
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  className = '',
  optimisticId
}: TryonLoadingButtonProps): React.JSX.Element {
  const { progressPercentage } = useProgressVisualization(optimisticId || '', {
    enableAnimation: true
  });

  const baseClasses = 'relative font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 disabled:border-blue-400 disabled:text-blue-400'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
      }`}
    >
      {/* Progress background for loading state */}
      {isLoading && optimisticId && (
        <div
          className="absolute inset-0 bg-white bg-opacity-20 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      )}
      
      <div className="relative flex items-center justify-center">
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Button text */}
        <span>{isLoading ? loadingText : children}</span>
      </div>
    </button>
  );
}

/**
 * CSS styles for animations (to be included in your global CSS)
 */
export const LOADING_ANIMATIONS_CSS = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
`;