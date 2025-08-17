'use client';

import React from 'react';
import type { BusinessLayerError } from '../types/error.types';
import { 
  formatErrorForDisplay, 
  logAndClassifyError,
  type ErrorRecoveryAction 
} from '../utils/errorHandling';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: BusinessLayerError;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: BusinessLayerError; resetError: () => void }>;
  onError?: (error: BusinessLayerError, errorInfo: React.ErrorInfo) => void;
}

const DefaultErrorFallback: React.FC<{ error: BusinessLayerError; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => {
  // Use comprehensive error handling to format the error
  const { title, message, actions, canRetry } = formatErrorForDisplay(error);

  const handleActionClick = (action: ErrorRecoveryAction) => {
    switch (action.type) {
      case 'retry':
        resetError();
        break;
      case 'check_connection':
        // Could open a help modal or redirect to network troubleshooting
        window.open('https://support.google.com/chrome/answer/95669', '_blank');
        break;
      case 'contact_support':
        // Could open support modal or redirect to support page
        console.log('Contact support requested');
        break;
      default:
        console.log(`Action not implemented: ${action.type}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 text-lg font-semibold mb-2">
        {title}
      </div>
      <div className="text-red-500 text-sm mb-4 text-center max-w-md">
        {message}
      </div>
      {error.code && (
        <div className="text-red-400 text-xs mb-4">
          Error Code: {error.code}
        </div>
      )}
      
      {/* Recovery Actions */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            {action.description}
          </button>
        ))}
        
        {/* Always show reset button if no other retry action */}
        {canRetry && !actions.some(a => a.type === 'retry') && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const businessError: BusinessLayerError = {
      name: error.name,
      message: error.message,
      code: 'COMPONENT_ERROR',
      timestamp: new Date().toISOString(),
      ...(('cause' in error) && { details: { cause: (error as Error & { cause?: unknown }).cause } }),
    };

    return {
      hasError: true,
      error: businessError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const businessError: BusinessLayerError = {
      name: error.name,
      message: error.message,
      code: 'COMPONENT_ERROR',
      timestamp: new Date().toISOString(),
      details: {
        componentStack: errorInfo.componentStack,
      },
    };

    // Use comprehensive error logging system
    logAndClassifyError(businessError, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.props.onError?.(businessError, errorInfo);
    
    // Log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}