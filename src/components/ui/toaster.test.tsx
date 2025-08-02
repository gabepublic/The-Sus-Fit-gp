import { render, screen } from '@testing-library/react';
import { Toaster } from './toaster';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock the toast components
jest.mock('./toast', () => ({
  Toast: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="toast" {...props}>{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Close</button>,
  ToastDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-description">{children}</div>,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
  ToastTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-title">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport">Viewport</div>,
}));

import { useToast } from '@/hooks/use-toast';
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('Toaster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without toasts', () => {
    mockUseToast.mockReturnValue({ toasts: [] });

    render(<Toaster />);

    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('renders single toast with title and description', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test Title',
          description: 'Test Description',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Test Description');
    expect(screen.getByTestId('toast-close')).toBeInTheDocument();
  });

  it('renders toast with only title', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test Title',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Test Title');
    expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
  });

  it('renders toast with only description', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          description: 'Test Description',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Test Description');
  });

  it('renders multiple toasts', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'First Toast',
        },
        {
          id: '2',
          title: 'Second Toast',
        },
      ],
    });

    render(<Toaster />);

    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(2);
    expect(toasts[0]).toHaveTextContent('First Toast');
    expect(toasts[1]).toHaveTextContent('Second Toast');
  });

  it('passes additional props to toast', () => {
    mockUseToast.mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Test Toast',
          className: 'custom-toast-class',
          'data-testid': 'custom-toast',
        },
      ],
    });

    render(<Toaster />);

    const toast = screen.getByTestId('custom-toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('custom-toast-class');
  });
}); 