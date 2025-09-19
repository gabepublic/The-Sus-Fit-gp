/**
 * @fileoverview SharedPhotoFrame Component Tests
 * @module @/mobile/components/shared/PhotoFrame/__tests__/PhotoFrame.test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PhotoFrame } from '../PhotoFrame';
import { PHOTO_FRAME_STATE } from '../PhotoFrame.types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, onError, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  )
}));

describe('SharedPhotoFrame', () => {
  const defaultProps = {
    testId: 'test-photo-frame',
    onUpload: jest.fn(),
    onImageLoad: jest.fn(),
    onImageError: jest.fn(),
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state correctly', () => {
      render(<PhotoFrame {...defaultProps} />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toBeInTheDocument();
      expect(frame).toHaveAttribute('data-state', PHOTO_FRAME_STATE.EMPTY);
    });

    it('displays upload angle placeholder by default', () => {
      render(<PhotoFrame {...defaultProps} viewType="angle" />);

      const placeholder = screen.getByAltText('Placeholder image');
      expect(placeholder).toHaveAttribute('src', '/images/zestyVogueColor.jpg');
    });

    it('displays upload fit placeholder for fit view', () => {
      render(<PhotoFrame {...defaultProps} viewType="fit" />);

      const placeholder = screen.getByAltText('Placeholder image');
      expect(placeholder).toHaveAttribute('src', '/images/ScoredGarment.jpg');
    });

    it('triggers upload on click', () => {
      render(<PhotoFrame {...defaultProps} />);

      const frame = screen.getByTestId('test-photo-frame');
      fireEvent.click(frame);

      expect(defaultProps.onUpload).toHaveBeenCalled();
    });

    it('triggers upload on keyboard interaction', () => {
      render(<PhotoFrame {...defaultProps} />);

      const frame = screen.getByTestId('test-photo-frame');
      fireEvent.keyDown(frame, { key: 'Enter' });

      expect(defaultProps.onUpload).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('renders loading state correctly', () => {
      render(<PhotoFrame {...defaultProps} loading={true} />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('data-state', PHOTO_FRAME_STATE.UPLOADING);

      const spinner = frame.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('displays progress when provided', () => {
      render(<PhotoFrame {...defaultProps} loading={true} progress={50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Loaded State', () => {
    it('renders loaded state with image', async () => {
      render(<PhotoFrame {...defaultProps} imageUrl="/test-image.jpg" />);

      const image = screen.getByAltText('Uploaded image');
      expect(image).toHaveAttribute('src', '/test-image.jpg');

      // Simulate image load
      fireEvent.load(image);

      await waitFor(() => {
        const frame = screen.getByTestId('test-photo-frame');
        expect(frame).toHaveAttribute('data-state', PHOTO_FRAME_STATE.LOADED);
      });

      expect(defaultProps.onImageLoad).toHaveBeenCalled();
    });

    it('uses custom alt text when provided', () => {
      render(<PhotoFrame {...defaultProps} imageUrl="/test-image.jpg" alt="Custom alt text" />);

      const image = screen.getByAltText('Custom alt text');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error state correctly', () => {
      render(<PhotoFrame {...defaultProps} state={PHOTO_FRAME_STATE.ERROR} />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('data-state', PHOTO_FRAME_STATE.ERROR);

      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });

    it('displays custom error message', () => {
      render(<PhotoFrame {...defaultProps} state={PHOTO_FRAME_STATE.ERROR} error="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('triggers retry callback', () => {
      render(<PhotoFrame {...defaultProps} state={PHOTO_FRAME_STATE.ERROR} />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(defaultProps.onRetry).toHaveBeenCalled();
    });

    it('handles image load error', async () => {
      render(<PhotoFrame {...defaultProps} imageUrl="/broken-image.jpg" />);

      const image = screen.getByAltText('Uploaded image');
      fireEvent.error(image);

      expect(defaultProps.onImageError).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('renders disabled state correctly', () => {
      render(<PhotoFrame {...defaultProps} disabled={true} />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('aria-disabled', 'true');
      expect(frame).toHaveAttribute('tabIndex', '-1');
    });

    it('does not trigger upload when disabled', () => {
      render(<PhotoFrame {...defaultProps} disabled={true} />);

      const frame = screen.getByTestId('test-photo-frame');
      fireEvent.click(frame);

      expect(defaultProps.onUpload).not.toHaveBeenCalled();
    });
  });

  describe('View Type Configuration', () => {
    it('applies angle view configuration', () => {
      render(<PhotoFrame {...defaultProps} viewType="angle" />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('data-view', 'angle');
    });

    it('applies fit view configuration', () => {
      render(<PhotoFrame {...defaultProps} viewType="fit" />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('data-view', 'fit');
    });

    it('applies tryon view configuration', () => {
      render(<PhotoFrame {...defaultProps} viewType="tryon" />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('data-view', 'tryon');
    });
  });

  describe('Custom Configuration', () => {
    it('accepts custom configuration', () => {
      const customConfig = {
        placeholderImage: '/custom-placeholder.jpg',
        ariaLabels: {
          empty: 'Custom empty label',
          uploading: 'Custom uploading label',
          loaded: 'Custom loaded label',
          error: 'Custom error label'
        }
      };

      render(<PhotoFrame {...defaultProps} customConfig={customConfig} />);

      const placeholder = screen.getByAltText('Placeholder image');
      expect(placeholder).toHaveAttribute('src', '/custom-placeholder.jpg');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<PhotoFrame {...defaultProps} />);

      const frame = screen.getByTestId('test-photo-frame');
      expect(frame).toHaveAttribute('role', 'button');
      expect(frame).toHaveAttribute('aria-label');
      expect(frame).toHaveAttribute('tabIndex', '0');
    });

    it('provides screen reader announcements', () => {
      render(<PhotoFrame {...defaultProps} loading={true} />);

      const srText = screen.getByText(/PhotoFrame component in uploading state/);
      expect(srText).toBeInTheDocument();
    });
  });

  describe('File Input', () => {
    it('handles file selection', () => {
      render(<PhotoFrame {...defaultProps} />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('accepts custom file types', () => {
      render(<PhotoFrame {...defaultProps} accept="image/png,image/jpeg" />);

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg');
    });
  });
});