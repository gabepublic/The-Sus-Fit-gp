// Error Display Components
// React components for displaying try-on errors with recovery actions

import React from 'react';
import {
  formatErrorForDisplay,
  type ErrorRecoveryAction
} from '../utils/errorHandling';

/**
 * Props for the TryonErrorDisplay component
 */
export interface TryonErrorDisplayProps {
  /** Error to display */
  error: unknown;
  /** Called when user clicks retry */
  onRetry?: () => void;
  /** Called when user performs a recovery action */
  onRecoveryAction?: (action: ErrorRecoveryAction) => void;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Comprehensive error display component for try-on errors
 */
export function TryonErrorDisplay({
  error,
  onRetry,
  onRecoveryAction,
  showTechnicalDetails = false,
  className = '',
  size = 'md'
}: TryonErrorDisplayProps): React.JSX.Element {
  const { title, message, actions, canRetry } = formatErrorForDisplay(error);

  const handleActionClick = (action: ErrorRecoveryAction) => {
    if (onRecoveryAction) {
      onRecoveryAction(action);
    } else {
      // Default action handlers
      switch (action.type) {
        case 'retry':
          onRetry?.();
          break;
        case 'check_connection':
          window.open('https://support.google.com/chrome/answer/95669', '_blank');
          break;
        case 'reduce_image_size':
          // Could trigger a modal with image compression tips
          alert('Try reducing your image size to under 5MB or use a different image format.');
          break;
        case 'try_different_image':
          alert('Please select a different image and try again.');
          break;
        case 'contact_support':
          // Could open support modal or redirect to support page
          alert('Please contact support if this issue persists.');
          break;
        case 'wait_and_retry':
          if (action.waitTime) {
            setTimeout(() => onRetry?.(), action.waitTime * 1000);
            alert(`Will retry automatically in ${action.waitTime} seconds.`);
          }
          break;
        default:
          console.log(`Action not implemented: ${action.type}`);
      }
    }
  };

  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${sizeClass} ${className}`}>
      {/* Error Icon */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          {/* Error Title */}
          <h3 className="text-red-800 font-medium">
            {title}
          </h3>
          
          {/* Error Message */}
          <p className="mt-1 text-red-700">
            {message}
          </p>
          
          {/* Technical Details (if enabled) */}
          {showTechnicalDetails && error instanceof Error && (
            <details className="mt-2">
              <summary className="text-red-600 text-sm cursor-pointer hover:text-red-800">
                Technical Details
              </summary>
              <div className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded font-mono">
                <div><strong>Error:</strong> {error.message}</div>
                {(error as Error & { code?: string }).code && (
                  <div><strong>Code:</strong> {(error as Error & { code?: string }).code}</div>
                )}
                {error.stack && (
                  <div className="mt-1">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          {/* Recovery Actions */}
          {actions.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {action.description}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Default Retry Button */}
          {canRetry && !actions.some(a => a.type === 'retry') && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the ErrorToast component
 */
export interface ErrorToastProps {
  /** Error to display */
  error: unknown;
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Called when toast should be dismissed */
  onDismiss: () => void;
  /** Auto-dismiss timeout in milliseconds */
  autoHideDuration?: number;
  /** Position of the toast */
  position?: 'top' | 'bottom';
}

/**
 * Toast notification for errors
 */
export function ErrorToast({
  error,
  isVisible,
  onDismiss,
  autoHideDuration = 5000,
  position = 'top'
}: ErrorToastProps): React.JSX.Element | null {
  const { title, message } = formatErrorForDisplay(error);

  React.useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(onDismiss, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onDismiss]);

  if (!isVisible) {
    return null;
  }

  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} right-4 z-50 max-w-sm w-full`}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">
              {title}
            </p>
            <p className="mt-1 text-sm text-red-700">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the ErrorModal component
 */
export interface ErrorModalProps {
  /** Error to display */
  error: unknown;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should be closed */
  onClose: () => void;
  /** Called when user clicks retry */
  onRetry?: () => void;
  /** Called when user performs a recovery action */
  onRecoveryAction?: (action: ErrorRecoveryAction) => void;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
}

/**
 * Modal dialog for displaying detailed error information
 */
export function ErrorModal({
  error,
  isOpen,
  onClose,
  onRetry,
  onRecoveryAction,
  showTechnicalDetails = false
}: ErrorModalProps): React.JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <TryonErrorDisplay
                error={error}
                onRetry={onRetry}
                onRecoveryAction={onRecoveryAction}
                showTechnicalDetails={showTechnicalDetails}
                size="sm"
                className="border-0 bg-transparent p-0"
              />
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing error display state
 */
export function useErrorDisplay() {
  const [error, setError] = React.useState<unknown>(null);
  const [showToast, setShowToast] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const displayError = (error: unknown, mode: 'toast' | 'modal' = 'toast') => {
    setError(error);
    if (mode === 'toast') {
      setShowToast(true);
    } else {
      setShowModal(true);
    }
  };

  const clearError = () => {
    setError(null);
    setShowToast(false);
    setShowModal(false);
  };

  const dismissToast = () => {
    setShowToast(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return {
    error,
    showToast,
    showModal,
    displayError,
    clearError,
    dismissToast,
    closeModal
  };
}