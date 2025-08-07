import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../../src/components/ToastProvider';

// Test component that uses the toast
const TestComponent = () => {
  const { showToast } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Success Toast
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error Toast
      </button>
    </div>
  );
};

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    expect(screen.getByText('Show Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Show Error Toast')).toBeInTheDocument();
  });

  it('shows toast when showToast is called', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const successButton = screen.getByText('Show Success Toast');
    
    act(() => {
      successButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('shows error toast with correct styling', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const errorButton = screen.getByText('Show Error Toast');
    
    act(() => {
      errorButton.click();
    });

    await waitFor(() => {
      const toast = screen.getByText('Error message');
      expect(toast).toBeInTheDocument();
      // Check if it has error styling (red background)
      expect(toast.closest('[class*="bg-red-500"]')).toBeInTheDocument();
    });
  });

  it('shows success toast with correct styling', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const successButton = screen.getByText('Show Success Toast');
    
    act(() => {
      successButton.click();
    });

    await waitFor(() => {
      const toast = screen.getByText('Test message');
      expect(toast).toBeInTheDocument();
      // Check if it has success styling (green background)
      expect(toast.closest('[class*="bg-green-500"]')).toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after 5 seconds', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const successButton = screen.getByText('Show Success Toast');
    
    act(() => {
      successButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleSpy.mockRestore();
  });
});
