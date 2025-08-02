import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

// Mock the cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

// Mock Radix UI toast primitives
jest.mock('@radix-ui/react-toast', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
  Viewport: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="viewport" className={className} {...props} />,
  Root: ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="toast" className={className} {...props}>{children}</div>,
  Action: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => <button data-testid="toast-action" className={className} {...props}>{children}</button>,
  Close: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => <button data-testid="toast-close" className={className} {...props}>{children}</button>,
  Title: ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="toast-title" className={className} {...props}>{children}</div>,
  Description: ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div data-testid="toast-description" className={className} {...props}>{children}</div>,
}));

describe('Toast Components', () => {
  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Test Child</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    });
  });

  describe('ToastViewport', () => {
    it('renders with default props', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );
      expect(screen.getByTestId('viewport')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <ToastViewport className="custom-class" data-testid="viewport" />
        </ToastProvider>
      );
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveClass('custom-class');
    });
  });

  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <ToastProvider>
          <Toast data-testid="toast">
            Toast content
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByText('Toast content')).toBeInTheDocument();
    });

    it('renders with destructive variant', () => {
      render(
        <ToastProvider>
          <Toast variant="destructive" data-testid="toast">
            Destructive toast
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByText('Destructive toast')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast className="custom-toast-class" data-testid="toast">
            Custom toast
          </Toast>
        </ToastProvider>
      );
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('custom-toast-class');
    });
  });

  describe('ToastAction', () => {
    it('renders action button', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastAction data-testid="action">
              Action
            </ToastAction>
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('action')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastAction className="custom-action-class" data-testid="action">
              Action
            </ToastAction>
          </Toast>
        </ToastProvider>
      );
      const action = screen.getByTestId('action');
      expect(action).toHaveClass('custom-action-class');
    });
  });

  describe('ToastClose', () => {
    it('renders close button', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastClose data-testid="close" />
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('close')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastClose className="custom-close-class" data-testid="close" />
          </Toast>
        </ToastProvider>
      );
      const close = screen.getByTestId('close');
      expect(close).toHaveClass('custom-close-class');
    });
  });

  describe('ToastTitle', () => {
    it('renders title', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle data-testid="title">Toast Title</ToastTitle>
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('title')).toBeInTheDocument();
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle className="custom-title-class" data-testid="title">
              Title
            </ToastTitle>
          </Toast>
        </ToastProvider>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('custom-title-class');
    });
  });

  describe('ToastDescription', () => {
    it('renders description', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription data-testid="description">
              Toast Description
            </ToastDescription>
          </Toast>
        </ToastProvider>
      );
      expect(screen.getByTestId('description')).toBeInTheDocument();
      expect(screen.getByText('Toast Description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription className="custom-desc-class" data-testid="description">
              Description
            </ToastDescription>
          </Toast>
        </ToastProvider>
      );
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('custom-desc-class');
    });
  });
}); 