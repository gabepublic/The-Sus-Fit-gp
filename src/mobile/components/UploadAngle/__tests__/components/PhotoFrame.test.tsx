/**
 * @fileoverview PhotoFrame Component Tests - Tests for image display and upload trigger
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoFrame } from '../../components/PhotoFrame'
import { PHOTO_FRAME_STATE } from '../../types/upload.types'
import { runA11yTests } from '@test/upload-test-utils'

// Mock framer-motion to avoid animation complexities in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, onError, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
    )
  }
})

describe('PhotoFrame Component', () => {
  const defaultProps = {
    imageUrl: null,
    alt: 'Test image',
    onImageLoad: jest.fn(),
    onImageError: jest.fn(),
    onUpload: jest.fn(),
    onRetry: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should render empty state correctly', () => {
      const { container } = render(<PhotoFrame {...defaultProps} />)

      expect(screen.getByText('Click to upload an image')).toBeInTheDocument()
      expect(screen.getByText('Or drag and drop')).toBeInTheDocument()
      expect(screen.getByLabelText('Upload image')).toBeInTheDocument()
      expect(container.querySelector('[data-state="empty"]')).toBeInTheDocument()
    })

    it('should show upload icon in empty state', () => {
      render(<PhotoFrame {...defaultProps} />)

      const uploadIcon = screen.getByRole('img', { name: 'Upload' })
      expect(uploadIcon).toBeInTheDocument()
    })

    it('should trigger upload on click', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByLabelText('Upload image')
      await user.click(frame)

      expect(defaultProps.onUpload).toHaveBeenCalled()
    })

    it('should trigger upload on keyboard interaction', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByLabelText('Upload image')
      await user.type(frame, '{enter}')

      expect(defaultProps.onUpload).toHaveBeenCalled()
    })

    it('should support drag and drop', async () => {
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByLabelText('Upload image')
      
      // Simulate dragover
      fireEvent.dragOver(frame)
      expect(frame).toHaveClass('drag-active')

      // Simulate dragleave
      fireEvent.dragLeave(frame)
      expect(frame).not.toHaveClass('drag-active')

      // Simulate drop
      fireEvent.drop(frame, {
        dataTransfer: {
          files: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })]
        }
      })

      expect(defaultProps.onUpload).toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should render loading state correctly', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} loading />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(container.querySelector('.loading-spinner')).toBeInTheDocument()
      expect(container.querySelector('[data-state="uploading"]')).toBeInTheDocument()
    })

    it('should show progress when provided', () => {
      render(
        <PhotoFrame {...defaultProps} loading progress={45} />
      )

      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45')
    })

    it('should not be clickable during loading', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} loading />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      await user.click(frame)

      expect(defaultProps.onUpload).not.toHaveBeenCalled()
    })
  })

  describe('Loaded State', () => {
    const imageUrl = 'https://example.com/test.jpg'

    it('should render image correctly', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} imageUrl={imageUrl} />
      )

      const image = screen.getByRole('img', { name: 'Test image' })
      expect(image).toHaveAttribute('src', imageUrl)
      expect(container.querySelector('[data-state="loaded"]')).toBeInTheDocument()
    })

    it('should call onImageLoad when image loads', () => {
      render(<PhotoFrame {...defaultProps} imageUrl={imageUrl} />)

      const image = screen.getByRole('img', { name: 'Test image' })
      fireEvent.load(image)

      expect(defaultProps.onImageLoad).toHaveBeenCalled()
    })

    it('should show change image option on hover', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} imageUrl={imageUrl} />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      await user.hover(frame)

      expect(screen.getByText('Change Image')).toBeInTheDocument()
    })

    it('should allow changing image', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} imageUrl={imageUrl} />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      await user.hover(frame)

      const changeButton = screen.getByText('Change Image')
      await user.click(changeButton)

      expect(defaultProps.onUpload).toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    const errorMessage = 'Failed to load image'

    it('should render error state correctly', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} error={errorMessage} state={PHOTO_FRAME_STATE.ERROR} />
      )

      expect(screen.getByText('Upload Failed')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
      expect(container.querySelector('[data-state="error"]')).toBeInTheDocument()
    })

    it('should show error icon', () => {
      render(
        <PhotoFrame {...defaultProps} error="Error" state={PHOTO_FRAME_STATE.ERROR} />
      )

      const errorIcon = screen.getByRole('img', { name: 'Error' })
      expect(errorIcon).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <PhotoFrame {...defaultProps} error="Error" state={PHOTO_FRAME_STATE.ERROR} />
      )

      const retryButton = screen.getByText('Retry')
      await user.click(retryButton)

      expect(defaultProps.onRetry).toHaveBeenCalled()
    })

    it('should handle image load errors', () => {
      const imageUrl = 'https://example.com/broken.jpg'
      render(<PhotoFrame {...defaultProps} imageUrl={imageUrl} />)

      const image = screen.getByRole('img', { name: 'Test image' })
      fireEvent.error(image)

      expect(defaultProps.onImageError).toHaveBeenCalled()
    })
  })

  describe('Aspect Ratio', () => {
    it('should apply aspect ratio correctly', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} aspectRatio="16:9" />
      )

      const frame = container.querySelector('[data-testid="photo-frame"]')
      expect(frame).toHaveStyle('aspect-ratio: 16:9')
    })

    it('should support different aspect ratios', () => {
      const aspectRatios = ['1:1', '4:3', '16:9', 'auto']

      aspectRatios.forEach(ratio => {
        const { container } = render(
          <PhotoFrame {...defaultProps} aspectRatio={ratio as any} />
        )
        
        const frame = container.querySelector('[data-testid="photo-frame"]')
        expect(frame).toHaveStyle(`aspect-ratio: ${ratio}`)
      })
    })

    it('should fallback for browsers without aspect-ratio support', () => {
      // Mock lack of aspect-ratio support
      const originalSupports = (CSS as any).supports
      ;(CSS as any).supports = jest.fn().mockReturnValue(false)

      const { container } = render(
        <PhotoFrame {...defaultProps} aspectRatio="4:3" />
      )

      // Should have fallback styles applied
      const frame = container.querySelector('[data-testid="photo-frame"]')
      expect(frame).toBeInTheDocument()

      // Restore original
      ;(CSS as any).supports = originalSupports
    })
  })

  describe('Disabled State', () => {
    it('should render disabled state correctly', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} disabled />
      )

      const frame = container.querySelector('[data-testid="photo-frame"]')
      expect(frame).toHaveAttribute('disabled')
      expect(frame).toHaveStyle('opacity: 0.6')
      expect(frame).toHaveStyle('cursor: not-allowed')
    })

    it('should not respond to interactions when disabled', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} disabled />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      await user.click(frame)

      expect(defaultProps.onUpload).not.toHaveBeenCalled()
    })
  })

  describe('Touch Support', () => {
    it('should handle touch events', () => {
      render(<PhotoFrame {...defaultProps} onTouchStart={jest.fn()} onTouchEnd={jest.fn()} />)

      const frame = screen.getByLabelText('Upload image')
      
      fireEvent.touchStart(frame)
      expect(defaultProps.onTouchStart).toHaveBeenCalled()

      fireEvent.touchEnd(frame)
      expect(defaultProps.onTouchEnd).toHaveBeenCalled()
    })

    it('should prevent default touch behavior during drag', () => {
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByLabelText('Upload image')
      const touchEvent = new TouchEvent('touchmove', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(touchEvent, 'preventDefault')

      fireEvent(frame, touchEvent)
      
      // Should prevent default during drag operations
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('File Input Integration', () => {
    it('should have hidden file input', () => {
      render(<PhotoFrame {...defaultProps} accept="image/*" />)

      const fileInput = screen.getByRole('button', { hidden: true })
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
      expect(fileInput).toHaveClass('visually-hidden')
    })

    it('should trigger file input on click', async () => {
      const user = userEvent.setup()
      const clickSpy = jest.fn()
      
      render(<PhotoFrame {...defaultProps} />)

      // Mock file input click
      const fileInput = screen.getByRole('button', { hidden: true })
      fileInput.click = clickSpy

      const frame = screen.getByLabelText('Upload image')
      await user.click(frame)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(<PhotoFrame {...defaultProps} />)

      const results = await runA11yTests(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      expect(frame).toHaveAttribute('aria-label')
      expect(frame).toHaveAttribute('tabindex', '0')
    })

    it('should announce state changes to screen readers', () => {
      const { rerender } = render(<PhotoFrame {...defaultProps} />)

      // Change to loading state
      rerender(<PhotoFrame {...defaultProps} loading />)

      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-live', 'polite')
      expect(status).toHaveTextContent('Loading...')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} />)

      const frame = screen.getByLabelText('Upload image')
      
      await user.tab()
      expect(frame).toHaveFocus()

      await user.keyboard('{enter}')
      expect(defaultProps.onUpload).toHaveBeenCalled()
    })

    it('should provide proper focus management', async () => {
      const user = userEvent.setup()
      render(<PhotoFrame {...defaultProps} imageUrl="test.jpg" />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      await user.hover(frame)

      const changeButton = screen.getByText('Change Image')
      await user.tab()
      expect(changeButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('should lazy load images when specified', () => {
      render(<PhotoFrame {...defaultProps} imageUrl="test.jpg" />)

      const image = screen.getByRole('img', { name: 'Test image' })
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    it('should optimize image sizes', () => {
      render(<PhotoFrame {...defaultProps} imageUrl="test.jpg" />)

      const image = screen.getByRole('img', { name: 'Test image' })
      expect(image).toHaveAttribute('sizes', expect.stringContaining('100vw'))
    })

    it('should preload critical images', () => {
      render(<PhotoFrame {...defaultProps} imageUrl="test.jpg" priority />)

      const image = screen.getByRole('img', { name: 'Test image' })
      expect(image).not.toHaveAttribute('loading', 'lazy')
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle render errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Component error')
      }

      const { container } = render(
        <PhotoFrame 
          {...defaultProps} 
          children={<ThrowError />}
        />
      )

      // Should still render the photo frame structure
      expect(container.querySelector('[data-testid="photo-frame"]')).toBeInTheDocument()
    })
  })

  describe('Animation and Motion', () => {
    it('should respect reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { container } = render(<PhotoFrame {...defaultProps} loading />)

      const frame = container.querySelector('[data-testid="photo-frame"]')
      const computedStyle = window.getComputedStyle(frame!)
      expect(computedStyle.animation).toBe('none')
    })

    it('should animate state transitions', () => {
      const { rerender } = render(<PhotoFrame {...defaultProps} />)

      // Change to loading state should trigger animation
      rerender(<PhotoFrame {...defaultProps} loading />)

      const frame = screen.getByRole('region', { name: 'Photo frame' })
      expect(frame).toHaveAttribute('data-state', 'uploading')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <PhotoFrame {...defaultProps} className="custom-photo-frame" />
      )

      expect(container.querySelector('.custom-photo-frame')).toBeInTheDocument()
    })

    it('should support custom testId', () => {
      render(<PhotoFrame {...defaultProps} testId="custom-test-id" />)

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
    })
  })
})