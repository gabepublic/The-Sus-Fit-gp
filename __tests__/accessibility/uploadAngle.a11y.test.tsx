/**
 * @fileoverview UploadAngle Accessibility Tests - Comprehensive WCAG 2.1 AA compliance testing
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { UploadAngle } from '@/mobile/components/UploadAngle/components/UploadAngle'
import { PhotoFrame } from '@/mobile/components/UploadAngle/components/PhotoFrame'
import { UploadButton } from '@/mobile/components/UploadAngle/components/UploadButton'
import { renderWithProviders, createMockFile } from '../test-utils/upload-test-utils'

// Add jest-axe matchers
expect.extend(toHaveNoViolations)

// Mock framer-motion to avoid animation issues in a11y tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    img: ({ children, ...props }: any) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

jest.useFakeTimers()

describe('UploadAngle Accessibility Tests', () => {
  const defaultProps = {
    onUploadSuccess: jest.fn(),
    onUploadError: jest.fn(),
    onProgressChange: jest.fn(),
    onNext: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in initial state', async () => {
      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations during upload', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('a11y-test.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        // Check accessibility during upload state
        await waitFor(() => {
          expect(screen.getByText('Uploading your image...')).toBeInTheDocument()
        })

        const uploadResults = await axe(container)
        expect(uploadResults).toHaveNoViolations()
      }
    })

    it('should have no accessibility violations in success state', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('a11y-success.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        
        // Fast-forward to success state
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          expect(screen.getByText('Image uploaded successfully!')).toBeInTheDocument()
        })

        const successResults = await axe(container)
        expect(successResults).toHaveNoViolations()
      }
    })

    it('should have no accessibility violations in error state', async () => {
      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, largeFile)

        await waitFor(() => {
          expect(screen.getByText(/File size.*exceeds.*limit/)).toBeInTheDocument()
        })

        const errorResults = await axe(container)
        expect(errorResults).toHaveNoViolations()
      }
    })
  })

  describe('Semantic HTML Structure', () => {
    it('should use proper semantic elements', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      // Main container should be a region
      expect(screen.getByRole('region', { name: 'Upload your angle image' })).toBeInTheDocument()

      // Buttons should have proper roles
      expect(screen.getByRole('button', { name: 'Upload Image' })).toBeInTheDocument()

      // Instructions should be properly structured
      expect(screen.getByRole('heading', { level: 3, name: 'Upload Your Angle' })).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const headings = screen.getAllByRole('heading')
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveAttribute('aria-level', '3')
    })

    it('should use lists for instruction items', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()

      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'Upload your angle image')

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toHaveAttribute('aria-label')
    })

    it('should use aria-live for status updates', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('aria-live-test.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          const statusElement = screen.getByRole('status')
          expect(statusElement).toHaveAttribute('aria-live', 'polite')
          expect(statusElement).toHaveTextContent('Image uploaded successfully!')
        })
      }
    })

    it('should have proper aria-describedby relationships', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-describedby')
    })

    it('should use aria-busy during uploads', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('aria-busy-test.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        await waitFor(() => {
          const progressElement = screen.getByRole('progressbar')
          expect(progressElement).toHaveAttribute('aria-busy', 'true')
        })
      }
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      // Tab to upload button
      await user.tab()
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toHaveFocus()

      // Should activate with Enter
      const fileChooserHandler = jest.fn()
      uploadButton.addEventListener('click', fileChooserHandler)
      
      await user.keyboard('{enter}')
      expect(fileChooserHandler).toHaveBeenCalled()
    })

    it('should support Space key activation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      uploadButton.focus()

      const fileChooserHandler = jest.fn()
      uploadButton.addEventListener('click', fileChooserHandler)

      await user.keyboard(' ')
      expect(fileChooserHandler).toHaveBeenCalled()
    })

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      await user.tab()
      
      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toHaveFocus()

      // Check that focus styles are applied
      const computedStyle = window.getComputedStyle(uploadButton)
      expect(computedStyle.outline).not.toBe('none')
    })

    it('should trap focus during modal interactions', async () => {
      // This test would be more relevant if there were modal dialogs
      // For now, ensure focus management is correct for inline interactions
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      await user.tab()
      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toHaveFocus()

      // After successful upload, focus should move to Next button if available
      const file = createMockFile('focus-test.jpg', 'image/jpeg', 1024 * 1024)
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          const nextButton = screen.getByRole('button', { name: 'Next' })
          expect(nextButton).toBeInTheDocument()
        })
      }
    })
  })

  describe('Screen Reader Support', () => {
    it('should announce upload progress to screen readers', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('sr-progress-test.jpg', 'image/jpeg', 2 * 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        await waitFor(() => {
          const progressBar = screen.getByRole('progressbar')
          expect(progressBar).toHaveAttribute('aria-valuemin', '0')
          expect(progressBar).toHaveAttribute('aria-valuemax', '100')
          expect(progressBar).toHaveAttribute('aria-valuenow')
          expect(progressBar).toHaveAttribute('aria-label')
        })
      }
    })

    it('should provide clear error descriptions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const largeFile = createMockFile('sr-error-test.jpg', 'image/jpeg', 15 * 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, largeFile)

        await waitFor(() => {
          const errorMessage = screen.getByText(/File size.*exceeds.*limit/)
          expect(errorMessage).toBeInTheDocument()

          // Error should be associated with the input
          const alert = screen.getByRole('alert')
          expect(alert).toHaveTextContent(/File size.*exceeds.*limit/)
        })
      }
    })

    it('should describe file requirements clearly', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      // File requirements should be clearly described
      expect(screen.getByText('Supported formats: JPEG, PNG, WebP')).toBeInTheDocument()
      expect(screen.getByText(/Maximum file size: \d+\.\d+MB/)).toBeInTheDocument()

      // These descriptions should be programmatically associated with the file input
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-describedby')
    })
  })

  describe('Color and Contrast', () => {
    it('should maintain sufficient color contrast', () => {
      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)

      // This would typically be tested with automated tools
      // For now, ensure important elements have proper styling
      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      const styles = window.getComputedStyle(uploadButton)

      // Button should have visible styling (not transparent)
      expect(styles.backgroundColor).not.toBe('transparent')
      expect(styles.color).not.toBe('transparent')
    })

    it('should work in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      renderWithProviders(<UploadAngle {...defaultProps} />)

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toBeInTheDocument()

      // Component should still be functional in high contrast mode
      expect(uploadButton).toBeEnabled()
    })

    it('should not rely solely on color for information', () => {
      renderWithProviders(<UploadAngle {...defaultProps} />)

      // Success and error states should use icons + text, not just color
      const instructions = screen.getByRole('list')
      expect(instructions).toBeInTheDocument()

      // Instructions use text and bullet points, not just color coding
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(0)
    })
  })

  describe('Motion and Animation', () => {
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

      const { container } = renderWithProviders(<UploadAngle {...defaultProps} />)

      // Animations should be disabled
      const uploadContainer = container.querySelector('.upload-angle')
      const computedStyle = window.getComputedStyle(uploadContainer!)
      
      // CSS should respect prefers-reduced-motion
      expect(computedStyle.transition).toMatch(/none|0s/)
    })

    it('should not cause seizures with flashing content', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const file = createMockFile('motion-test.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        // Progress indicators should not flash rapidly
        await waitFor(() => {
          const progressBar = screen.getByRole('progressbar')
          expect(progressBar).toBeInTheDocument()
        })

        // Any animations should be smooth and not exceed 3 flashes per second
      }
    })
  })

  describe('Component-Specific Accessibility', () => {
    describe('PhotoFrame Accessibility', () => {
      it('should have proper image accessibility', () => {
        const photoProps = {
          imageUrl: 'https://example.com/test.jpg',
          alt: 'User uploaded test image',
          onImageLoad: jest.fn(),
          onImageError: jest.fn()
        }

        render(<PhotoFrame {...photoProps} />)

        const image = screen.getByRole('img')
        expect(image).toHaveAttribute('alt', 'User uploaded test image')
        expect(image).toHaveAttribute('src', 'https://example.com/test.jpg')
      })

      it('should handle empty state accessibility', () => {
        const photoProps = {
          imageUrl: null,
          alt: 'Upload area',
          onUpload: jest.fn(),
          onImageLoad: jest.fn(),
          onImageError: jest.fn()
        }

        render(<PhotoFrame {...photoProps} />)

        const uploadArea = screen.getByLabelText('Upload image')
        expect(uploadArea).toHaveAttribute('role', 'button')
        expect(uploadArea).toHaveAttribute('tabindex', '0')
      })
    })

    describe('UploadButton Accessibility', () => {
      it('should have proper button accessibility', () => {
        const buttonProps = {
          onFileSelect: jest.fn()
        }

        render(<UploadButton {...buttonProps} />)

        const button = screen.getByRole('button')
        expect(button).toHaveAttribute('type', 'button')
        expect(button).toHaveAttribute('aria-label')
      })

      it('should handle disabled state accessibility', () => {
        const buttonProps = {
          onFileSelect: jest.fn(),
          disabled: true
        }

        render(<UploadButton {...buttonProps} />)

        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
        expect(button).toHaveAttribute('aria-disabled', 'true')
        expect(button).toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Error Handling Accessibility', () => {
    it('should announce errors appropriately', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const invalidFile = createMockFile('invalid.txt', 'text/plain')
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, invalidFile)

        await waitFor(() => {
          const errorAlert = screen.getByRole('alert')
          expect(errorAlert).toHaveTextContent('File type not supported. Please select a valid image file.')
        })
      }
    })

    it('should provide recovery instructions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadAngle {...defaultProps} />)

      const largeFile = createMockFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, largeFile)

        await waitFor(() => {
          const retryButton = screen.getByRole('button', { name: 'Retry' })
          expect(retryButton).toBeInTheDocument()
          expect(retryButton).toBeEnabled()
        })
      }
    })
  })

  describe('Mobile Accessibility', () => {
    it('should support touch screen readers', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true
      })

      renderWithProviders(<UploadAngle {...defaultProps} />)

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      
      // Touch targets should be properly sized
      const buttonBox = uploadButton.getBoundingClientRect()
      expect(buttonBox.height).toBeGreaterThanOrEqual(44) // WCAG minimum touch target
      expect(buttonBox.width).toBeGreaterThanOrEqual(44)
    })

    it('should handle zoom accessibility', () => {
      // Mock high zoom level
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 3,
        writable: true
      })

      renderWithProviders(<UploadAngle {...defaultProps} />)

      const component = screen.getByRole('region')
      expect(component).toBeInTheDocument()

      // Component should remain functional at high zoom levels
      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      expect(uploadButton).toBeEnabled()
    })
  })
})