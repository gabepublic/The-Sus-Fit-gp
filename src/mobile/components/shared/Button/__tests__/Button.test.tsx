/**
 * @fileoverview Shared Button Component Tests
 * @module @/mobile/components/shared/Button/__tests__/Button.test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, UploadButton, NextButton } from '../index';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockPrefetch = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch
  })
}));

describe('Shared Button System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Base Button', () => {
    const defaultProps = {
      testId: 'test-button',
      onClick: jest.fn()
    };

    it('renders correctly', () => {
      render(<Button {...defaultProps}>Test Button</Button>);

      const button = screen.getByTestId('test-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
    });

    it('handles click events', () => {
      render(<Button {...defaultProps}>Click Me</Button>);

      const button = screen.getByTestId('test-button');
      fireEvent.click(button);

      expect(defaultProps.onClick).toHaveBeenCalled();
    });

    it('handles disabled state', () => {
      render(<Button {...defaultProps} disabled>Disabled Button</Button>);

      const button = screen.getByTestId('test-button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(button);
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    it('handles loading state', () => {
      render(<Button {...defaultProps} loading>Loading Button</Button>);

      const button = screen.getByTestId('test-button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('applies size variants correctly', () => {
      const { rerender } = render(<Button {...defaultProps} size="small">Small</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('small');

      rerender(<Button {...defaultProps} size="medium">Medium</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('medium');

      rerender(<Button {...defaultProps} size="large">Large</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('large');
    });

    it('applies variant styles correctly', () => {
      const { rerender } = render(<Button {...defaultProps} variant="primary">Primary</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('primary');

      rerender(<Button {...defaultProps} variant="secondary">Secondary</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('secondary');

      rerender(<Button {...defaultProps} variant="upload">Upload</Button>);
      expect(screen.getByTestId('test-button')).toHaveClass('upload');
    });

    it('handles keyboard events', () => {
      render(<Button {...defaultProps}>Keyboard Test</Button>);

      const button = screen.getByTestId('test-button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(defaultProps.onClick).toHaveBeenCalled();
    });
  });

  describe('UploadButton', () => {
    const defaultProps = {
      testId: 'test-upload-button',
      onFileSelect: jest.fn(),
      onError: jest.fn()
    };

    beforeEach(() => {
      // Mock file input click
      HTMLInputElement.prototype.click = jest.fn();
    });

    it('renders upload button correctly', () => {
      render(<UploadButton {...defaultProps} />);

      const container = screen.getByTestId('test-upload-button').closest('.uploadContainer');
      expect(container).toBeInTheDocument();

      const fileInput = container?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('accepts custom file types', () => {
      render(<UploadButton {...defaultProps} accept="image/png,image/jpeg" />);

      const container = screen.getByTestId('test-upload-button').closest('.uploadContainer');
      const fileInput = container?.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg');
    });

    it('triggers file input on click', () => {
      render(<UploadButton {...defaultProps} />);

      const button = screen.getByTestId('test-upload-button');
      fireEvent.click(button);

      expect(HTMLInputElement.prototype.click).toHaveBeenCalled();
    });

    it('handles file selection', () => {
      render(<UploadButton {...defaultProps} />);

      const container = screen.getByTestId('test-upload-button').closest('.uploadContainer');
      const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

      // Create a mock file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file);
    });

    it('displays correct text based on state', () => {
      const { rerender } = render(<UploadButton {...defaultProps} />);
      expect(screen.getByText('Upload Your Image')).toBeInTheDocument();

      rerender(<UploadButton {...defaultProps} viewType="fit" />);
      expect(screen.getByText('Upload Your Fit')).toBeInTheDocument();

      rerender(<UploadButton {...defaultProps} isRedo />);
      expect(screen.getByText('Re-do')).toBeInTheDocument();

      rerender(<UploadButton {...defaultProps} loading />);
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('handles drag and drop events', () => {
      render(<UploadButton {...defaultProps} />);

      const button = screen.getByTestId('test-upload-button');

      // Simulate drag enter
      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        dataTransfer: {
          items: [{ kind: 'file', type: 'image/jpeg' }]
        } as any
      });

      fireEvent(button, dragEnterEvent);
      // Note: In a real test, you'd check for visual feedback of drag active state
    });
  });

  describe('NextButton', () => {
    const defaultProps = {
      testId: 'test-next-button',
      onClick: jest.fn()
    };

    it('renders hidden when uploadStatus is idle', () => {
      render(<NextButton {...defaultProps} uploadStatus="idle" />);

      const button = screen.queryByTestId('test-next-button');
      expect(button).not.toBeInTheDocument();
    });

    it('renders visible when uploadStatus is complete', () => {
      render(<NextButton {...defaultProps} uploadStatus="complete" />);

      const button = screen.getByTestId('test-next-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Next');
    });

    it('renders disabled when uploadStatus is error', () => {
      render(<NextButton {...defaultProps} uploadStatus="error" />);

      const button = screen.getByTestId('test-next-button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('shows Try It On text for fit view', () => {
      render(<NextButton {...defaultProps} uploadStatus="complete" viewType="fit" />);

      expect(screen.getByText('Try It On')).toBeInTheDocument();
    });

    it('handles navigation on click', async () => {
      render(<NextButton {...defaultProps} uploadStatus="complete" config={{ targetRoute: '/test-route' }} />);

      const button = screen.getByTestId('test-next-button');
      fireEvent.click(button);

      expect(defaultProps.onClick).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/test-route');
      });
    });

    it('prefetches route when enabled', () => {
      render(
        <NextButton
          {...defaultProps}
          uploadStatus="complete"
          config={{ targetRoute: '/test-route', enablePrefetch: true }}
        />
      );

      expect(mockPrefetch).toHaveBeenCalledWith('/test-route');
    });

    it('calls navigation callbacks', async () => {
      const onNavigationSuccess = jest.fn();
      const config = {
        targetRoute: '/test-route',
        onNavigationSuccess
      };

      render(<NextButton {...defaultProps} uploadStatus="complete" config={config} />);

      const button = screen.getByTestId('test-next-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onNavigationSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes for all button types', () => {
      const { rerender } = render(<Button testId="test">Test</Button>);

      let button = screen.getByTestId('test');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-disabled');

      rerender(<UploadButton testId="test" onFileSelect={jest.fn()} />);
      button = screen.getByTestId('test');
      expect(button).toHaveAttribute('aria-label');

      rerender(<NextButton testId="test" uploadStatus="complete" />);
      button = screen.getByTestId('test');
      expect(button).toHaveAttribute('aria-label');
    });

    it('provides screen reader announcements', () => {
      render(<UploadButton testId="test" onFileSelect={jest.fn()} />);

      const srElements = document.querySelectorAll('.srOnly');
      expect(srElements.length).toBeGreaterThan(0);
    });
  });
});