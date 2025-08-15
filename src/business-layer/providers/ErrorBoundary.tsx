'use client';

import React from 'react';
import type { BusinessLayerError } from '../types/error.types';

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
}) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 text-lg font-semibold mb-2">
      Something went wrong
    </div>
    <div className="text-red-500 text-sm mb-4 text-center max-w-md">
      {error.message || 'An unexpected error occurred'}
    </div>
    {error.code && (
      <div className="text-red-400 text-xs mb-4">
        Error Code: {error.code}
      </div>
    )}
    <button
      onClick={resetError}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

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

    this.props.onError?.(businessError, errorInfo);
    
    // Log to console in development
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