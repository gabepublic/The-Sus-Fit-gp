'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import * as Toast from '@radix-ui/react-toast';

// Toast item interface
interface ToastItem {
  id: string;
  message: string;
  variant: 'error' | 'success' | 'info' | 'warning';
}

// Context interface
interface ToastContextType {
  showToast: (message: string, variant?: ToastItem['variant']) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component
interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastItem['variant'] = 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = { id, message, variant };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Get variant-specific styles
  const getVariantStyles = (variant: ToastItem['variant']) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      case 'error':
      default:
        return 'bg-red-500 text-white border-red-600';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider
        swipeDirection="right"
        duration={5000}
      >
        {children}
        
        {/* Toast viewport */}
        <Toast.Viewport className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm" />
        
        {/* Render toasts */}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            className={`
              flex items-center justify-between p-4 rounded-lg shadow-lg border
              ${getVariantStyles(toast.variant)}
              data-[state=open]:animate-slideDown
              data-[state=closed]:animate-slideUp
              data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0
              data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
            `}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(toast.id);
              }
            }}
          >
            <div className="flex-1">
              <Toast.Title className="text-sm font-medium">
                {toast.message}
              </Toast.Title>
            </div>
            
            <Toast.Close className="ml-4 text-white/80 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  );
};
