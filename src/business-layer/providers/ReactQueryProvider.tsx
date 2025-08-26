'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../config/queryClient.config';
import { ErrorBoundary } from './ErrorBoundary';
import type { BusinessLayerError } from '../types/error.types';

interface ReactQueryProviderProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
  onError?: (error: BusinessLayerError, errorInfo: React.ErrorInfo) => void;
  ErrorFallback?: React.ComponentType<{ error: BusinessLayerError; resetError: () => void }>;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({
  children,
  enableDevtools = process.env.NODE_ENV === 'development',
  onError,
  ErrorFallback,
}) => {
  return (
    <ErrorBoundary onError={onError} fallback={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        {children}
        {enableDevtools && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Export types for convenience
export type { ReactQueryProviderProps };

// Re-export ErrorBoundary for standalone use
export { ErrorBoundary } from './ErrorBoundary';