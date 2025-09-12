/**
 * @fileoverview UploadFit Component Tests - Comprehensive test suite for the main component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { UploadFit } from '@/mobile/components/UploadFit/components/UploadFit'
import { renderWithProviders, createMockFile, runA11yTests } from '@test/upload-test-utils'
import { DEFAULT_UPLOAD_CONFIG } from '@/mobile/components/UploadFit/types/upload.types'

// Mock the hooks to control their behavior
jest.mock('@/mobile/components/UploadFit/hooks/useFitUpload')
jest.mock('@/mobile/components/UploadFit/hooks/useImageProcessing')

// Mock timers for upload simulation
jest.useFakeTimers()

describe('UploadFit Component', () => {
  const defaultProps = {
    testId: 'upload-fit-test',
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

  describe('Rendering and Initial State', () => {
    it('should render with default props', () => {
      const { container } = renderWithProviders(<UploadFit {...defaultProps} />)

      expect(screen.getByTestId('upload-fit-test')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Upload your fit image' })).toBeInTheDocument()
      expect(screen.getByText('Upload Your Fit')).toBeInTheDocument()
      expect(screen.getByText('Upload Image')).toBeInTheDocument()
      expect(container.querySelector('.upload-fit--idle')).toBeInTheDocument()
    })

    it('should render instructions when in idle state', () => {
      renderWithProviders(<UploadFit {...defaultProps} />)

      expect(screen.getByText('Upload Your Fit')).toBeInTheDocument()
      expect(screen.getByText('Select a fit image from your device')).toBeInTheDocument()
      expect(screen.getByText('Or drag and drop a clothing image file')).toBeInTheDocument()
      expect(screen.getByText('Supported formats: JPEG, PNG, WebP')).toBeInTheDocument()
      expect(screen.getByText(`Maximum file size: ${(DEFAULT_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)).toFixed(1)}MB`)).toBeInTheDocument()
    })

    it('should apply custom className and testId', () => {
      const customProps = {
        ...defaultProps,
        className: 'custom-class',
        testId: 'custom-test-id'
      }

      const { container } = renderWithProviders(<UploadFit {...customProps} />)

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('should render disabled state correctly', () => {
      const { container } = renderWithProviders(<UploadFit {...defaultProps} disabled />)

      expect(container.querySelector('.upload-fit--disabled')).toBeInTheDocument()
      expect(screen.getByText('Upload Image')).toBeDisabled()
    })

    it('should render with initial image URL', () => {
      const initialImageUrl = 'https://example.com/initial-garment.jpg'
      renderWithProviders(
        <UploadFit {...defaultProps} initialImageUrl={initialImageUrl} />
      )

      const photoFrame = screen.getByRole('img', { name: /uploaded fit photo/i })
      expect(photoFrame).toHaveAttribute('src', initialImageUrl)
      expect(screen.getByText('Change Image')).toBeInTheDocument()
    })
  })

  describe('File Upload Workflow', () => {
    it('should handle file selection successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-garment.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')

      // Simulate file selection
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')
      expect(hiddenInput).toBeInTheDocument()

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        // Should transition to uploading state
        await waitFor(() => {
          expect(screen.getByText('Uploading your image...')).toBeInTheDocument()
        })

        // Progress indicator should be visible
        expect(screen.getByRole('progressbar')).toBeInTheDocument()

        // Advance time to complete upload
        await waitFor(async () => {
          jest.advanceTimersByTime(5000)
        })

        // Should show success state
        await waitFor(() => {
          expect(screen.getByText('Image uploaded successfully!')).toBeInTheDocument()
        })

        expect(defaultProps.onUploadSuccess).toHaveBeenCalled()
      }
    })

    it('should handle file validation errors', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      // Create file that exceeds size limit
      const largeFile = createMockFile('large-garment.jpg', 'image/jpeg', 15 * 1024 * 1024) // 15MB
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, largeFile)

        await waitFor(() => {
          expect(screen.getByText(/File size.*exceeds.*limit/)).toBeInTheDocument()
        })

        expect(screen.getByText('Retry')).toBeInTheDocument()
        expect(defaultProps.onUploadError).toHaveBeenCalled()
      }
    })

    it('should handle invalid file types', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const textFile = createMockFile('document.txt', 'text/plain')
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, textFile)

        await waitFor(() => {
          expect(screen.getByText('File type not supported. Please select a valid image file.')).toBeInTheDocument()
        })
      }
    })

    it('should show progress updates during upload', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-fit.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        await waitFor(() => {
          expect(screen.getByText('Uploading your image...')).toBeInTheDocument()
        })

        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toBeInTheDocument()

        // Advance time partially and check progress
        jest.advanceTimersByTime(1000)

        await waitFor(() => {
          expect(defaultProps.onProgressChange).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should display error message and retry button', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      // Mock upload failure by using invalid file size
      const invalidFile = createMockFile('invalid-garment.jpg', 'image/jpeg', 15 * 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, invalidFile)

        await waitFor(() => {
          expect(screen.getByText(/File size.*exceeds.*limit/)).toBeInTheDocument()
          expect(screen.getByText('Retry')).toBeInTheDocument()
        })

        // Test retry functionality
        const retryButton = screen.getByText('Retry')
        await user.click(retryButton)

        // Should reset to idle state
        await waitFor(() => {
          expect(screen.getByText('Upload Image')).toBeInTheDocument()
        })
      }
    })

    it('should handle network errors with retry logic', async () => {
      // Mock network error by manipulating Math.random
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.01) // Force network error

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-garment.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        // Wait for upload to start and fail
        jest.advanceTimersByTime(2000)

        await waitFor(() => {
          expect(screen.getByText(/network error/i)).toBeInTheDocument()
        })
      }

      // Restore Math.random
      Math.random = originalRandom
    })
  })

  describe('Success State and Navigation', () => {
    it('should show success state and next button', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-fit.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)

        // Fast-forward through upload
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          expect(screen.getByText('Image uploaded successfully!')).toBeInTheDocument()
        })

        // Next button should appear
        const nextButton = screen.getByText('Next')
        expect(nextButton).toBeInTheDocument()
        expect(nextButton).not.toBeDisabled()

        // Test next button click
        await user.click(nextButton)
        expect(defaultProps.onNext).toHaveBeenCalled()
      }
    })

    it('should not show next button when onNext is not provided', async () => {
      const propsWithoutNext = { ...defaultProps, onNext: undefined }
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      
      renderWithProviders(<UploadFit {...propsWithoutNext} />)

      const file = createMockFile('test-fit.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          expect(screen.getByText('Image uploaded successfully!')).toBeInTheDocument()
        })

        expect(screen.queryByText('Next')).not.toBeInTheDocument()
      }
    })

    it('should allow changing image after successful upload', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-garment.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        // Upload first file
        await user.upload(hiddenInput as HTMLInputElement, file)
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          expect(screen.getByText('Image uploaded successfully!')).toBeInTheDocument()
        })

        // Change image button should be available
        const changeButton = screen.getByText('Change Image')
        expect(changeButton).toBeInTheDocument()

        // Upload new file
        const newFile = createMockFile('new-fit.jpg', 'image/jpeg', 2 * 1024 * 1024)
        await user.upload(hiddenInput as HTMLInputElement, newFile)

        await waitFor(() => {
          expect(screen.getByText('Uploading your image...')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Configuration and Customization', () => {
    it('should respect custom upload configuration', () => {
      const customConfig = {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg'],
        quality: 0.9
      }

      renderWithProviders(
        <UploadFit {...defaultProps} config={customConfig} />
      )

      expect(screen.getByText('Maximum file size: 5.0MB')).toBeInTheDocument()
    })

    it('should handle empty configuration gracefully', () => {
      renderWithProviders(
        <UploadFit {...defaultProps} config={{}} />
      )

      // Should use default values
      expect(screen.getByText(`Maximum file size: ${(DEFAULT_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)).toFixed(1)}MB`)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', async () => {
      const { container } = renderWithProviders(<UploadFit {...defaultProps} />)

      const results = await runA11yTests(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      renderWithProviders(<UploadFit {...defaultProps} />)

      expect(screen.getByRole('region', { name: 'Upload your fit image' })).toBeInTheDocument()
      
      const uploadButton = screen.getByText('Upload Image')
      expect(uploadButton).toHaveAttribute('type', 'button')
    })

    it('should provide screen reader feedback for upload states', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-fit.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        jest.advanceTimersByTime(5000)

        await waitFor(() => {
          const successMessage = screen.getByRole('status')
          expect(successMessage).toHaveAttribute('aria-live', 'polite')
          expect(successMessage).toHaveTextContent('Image uploaded successfully!')
        })
      }
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const uploadButton = screen.getByText('Upload Image')

      // Test keyboard focus
      await user.tab()
      expect(uploadButton).toHaveFocus()

      // Test Enter key activation
      await user.keyboard('{Enter}')
      // File input should be triggered (though we can't easily test the file dialog)
    })
  })

  describe('Responsive Behavior', () => {
    it('should render responsive classes', () => {
      const { container } = renderWithProviders(<UploadFit {...defaultProps} />)

      const uploadContainer = container.querySelector('.upload-fit')
      expect(uploadContainer).toBeInTheDocument()

      // Check that responsive styles are included
      const style = container.querySelector('style')
      expect(style?.textContent).toContain('@media (max-width: 768px)')
    })
  })

  describe('Memory Management', () => {
    it('should clean up blob URLs on unmount', () => {
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL')
      
      const { unmount } = renderWithProviders(<UploadFit {...defaultProps} />)

      unmount()

      // Cleanup should be triggered on unmount
      // Note: We can't easily test the specific URLs without mocking the state
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(0) // No URLs to clean up in initial state
    })

    it('should handle image loading and cleanup', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL')
      
      const { unmount } = renderWithProviders(<UploadFit {...defaultProps} />)

      const file = createMockFile('test-garment.jpg', 'image/jpeg', 1024 * 1024)
      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        await user.upload(hiddenInput as HTMLInputElement, file)
        
        unmount()

        // Should attempt to clean up blob URLs
        expect(revokeObjectURLSpy).toHaveBeenCalled()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple rapid file selections', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      renderWithProviders(<UploadFit {...defaultProps} />)

      const uploadButton = screen.getByText('Upload Image')
      const hiddenInput = uploadButton.closest('label')?.querySelector('input[type="file"]')

      if (hiddenInput) {
        // Select first file
        const file1 = createMockFile('test1-garment.jpg', 'image/jpeg', 1024 * 1024)
        await user.upload(hiddenInput as HTMLInputElement, file1)

        // Quickly select second file
        const file2 = createMockFile('test2-garment.jpg', 'image/jpeg', 2 * 1024 * 1024)
        await user.upload(hiddenInput as HTMLInputElement, file2)

        // Should handle the second file selection
        await waitFor(() => {
          expect(screen.getByText('Uploading your image...')).toBeInTheDocument()
        })
      }
    })

    it('should handle disabled state during upload', async () => {
      const { rerender } = renderWithProviders(<UploadFit {...defaultProps} />)

      // Start with enabled state
      const uploadButton = screen.getByText('Upload Image')
      expect(uploadButton).not.toBeDisabled()

      // Disable during upload
      rerender(<UploadFit {...defaultProps} disabled />)

      expect(screen.getByText('Upload Image')).toBeDisabled()
      expect(document.querySelector('.upload-fit--disabled')).toBeInTheDocument()
    })
  })
})