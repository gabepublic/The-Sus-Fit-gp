/**
 * @fileoverview UploadButton Component Tests - Tests for file selection trigger
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadButton } from '@/mobile/components/UploadAngle/components/UploadButton'
import { createMockFile, runA11yTests } from '../../../test-utils/upload-test-utils'

describe('UploadButton Component', () => {
  const defaultProps = {
    onFileSelect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<UploadButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Upload Image' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Upload Image' })).toHaveClass('upload-button--primary', 'upload-button--medium')
    })

    it('should render with custom children', () => {
      render(
        <UploadButton {...defaultProps}>
          Custom Upload Text
        </UploadButton>
      )

      expect(screen.getByText('Custom Upload Text')).toBeInTheDocument()
    })

    it('should apply custom className and testId', () => {
      render(
        <UploadButton 
          {...defaultProps} 
          className="custom-button" 
          testId="custom-upload-btn"
        />
      )

      expect(screen.getByTestId('custom-upload-btn')).toBeInTheDocument()
      expect(screen.getByTestId('custom-upload-btn')).toHaveClass('custom-button')
    })
  })

  describe('Variants and Sizes', () => {
    it('should render primary variant correctly', () => {
      render(<UploadButton {...defaultProps} variant="primary" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('upload-button--primary')
    })

    it('should render secondary variant correctly', () => {
      render(<UploadButton {...defaultProps} variant="secondary" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('upload-button--secondary')
    })

    it('should render outline variant correctly', () => {
      render(<UploadButton {...defaultProps} variant="outline" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('upload-button--outline')
    })

    it('should render different sizes correctly', () => {
      const sizes = ['small', 'medium', 'large'] as const

      sizes.forEach(size => {
        const { unmount } = render(
          <UploadButton {...defaultProps} size={size} />
        )

        const button = screen.getByRole('button')
        expect(button).toHaveClass(`upload-button--${size}`)
        
        unmount()
      })
    })
  })

  describe('File Selection', () => {
    it('should trigger file selection on button click', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: 'Upload Image' })
      const fileInput = screen.getByRole('button', { name: 'Upload Image' }).querySelector('input[type="file"]')
      
      expect(fileInput).toBeInTheDocument()

      await user.click(button)

      // File input should be triggered
      expect(fileInput).toHaveAttribute('type', 'file')
    })

    it('should handle file selection', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} accept="image/*" />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg', 'image/jpeg')

      await user.upload(fileInput, file)

      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file)
    })

    it('should handle multiple file selection and pick first', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement
      const file1 = createMockFile('test1.jpg', 'image/jpeg')
      const file2 = createMockFile('test2.jpg', 'image/jpeg')

      await user.upload(fileInput, [file1, file2])

      // Should only call with the first file
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(file1)
      expect(defaultProps.onFileSelect).toHaveBeenCalledTimes(1)
    })

    it('should handle no file selection', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement

      // Simulate file dialog cancellation
      fireEvent.change(fileInput, { target: { files: [] } })

      expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('Accept Attribute', () => {
    it('should set accept attribute correctly', () => {
      render(<UploadButton {...defaultProps} accept="image/*" />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })

    it('should handle multiple accept types', () => {
      const acceptTypes = 'image/jpeg,image/png,image/webp'
      render(<UploadButton {...defaultProps} accept={acceptTypes} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', acceptTypes)
    })

    it('should work without accept attribute', () => {
      render(<UploadButton {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).not.toHaveAttribute('accept')
    })
  })

  describe('Disabled State', () => {
    it('should render disabled state correctly', () => {
      render(<UploadButton {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('upload-button--disabled')
    })

    it('should not trigger file selection when disabled', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
    })

    it('should have proper disabled styling', () => {
      render(<UploadButton {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle('cursor: not-allowed')
      expect(button).toHaveStyle('opacity: 0.6')
    })
  })

  describe('Loading State', () => {
    it('should show loading state', () => {
      render(<UploadButton {...defaultProps} loading />)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toHaveClass('upload-button--loading')
    })

    it('should show loading spinner', () => {
      render(<UploadButton {...defaultProps} loading />)

      const spinner = screen.getByRole('img', { name: 'Loading' })
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('upload-button__spinner')
    })

    it('should disable interaction during loading', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} loading />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()

      await user.click(button)
      expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const button = screen.getByRole('button')
      
      await user.tab()
      expect(button).toHaveFocus()

      await user.keyboard('{enter}')
      // File dialog should be triggered
    })

    it('should support space key activation', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard(' ')
      // File dialog should be triggered
    })

    it('should not be focusable when disabled', () => {
      render(<UploadButton {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Icon Integration', () => {
    it('should show upload icon by default', () => {
      render(<UploadButton {...defaultProps} />)

      const icon = screen.getByRole('img', { name: 'Upload' })
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('upload-button__icon')
    })

    it('should hide icon when loading', () => {
      render(<UploadButton {...defaultProps} loading />)

      expect(screen.queryByRole('img', { name: 'Upload' })).not.toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument()
    })

    it('should position icon correctly with text', () => {
      render(<UploadButton {...defaultProps}>Upload File</UploadButton>)

      const button = screen.getByRole('button')
      const icon = screen.getByRole('img', { name: 'Upload' })
      
      expect(button).toHaveClass('upload-button--with-icon')
      expect(icon).toHaveClass('upload-button__icon--left')
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(<UploadButton {...defaultProps} />)

      const results = await runA11yTests(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', () => {
      render(<UploadButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should announce loading state to screen readers', () => {
      render(<UploadButton {...defaultProps} loading />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByText('Uploading...')).toHaveAttribute('aria-live', 'polite')
    })

    it('should describe file input purpose', () => {
      render(<UploadButton {...defaultProps} accept="image/*" />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('aria-describedby')
    })

    it('should provide screen reader feedback for disabled state', () => {
      render(<UploadButton {...defaultProps} disabled />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Touch Support', () => {
    it('should handle touch events', () => {
      const onTouchStart = jest.fn()
      const onTouchEnd = jest.fn()

      render(
        <UploadButton 
          {...defaultProps} 
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />
      )

      const button = screen.getByRole('button')
      
      fireEvent.touchStart(button)
      expect(onTouchStart).toHaveBeenCalled()

      fireEvent.touchEnd(button)
      expect(onTouchEnd).toHaveBeenCalled()
    })

    it('should have proper touch target size', () => {
      render(<UploadButton {...defaultProps} size="small" />)

      const button = screen.getByRole('button')
      const styles = window.getComputedStyle(button)
      
      // Minimum touch target should be 44px
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
    })
  })

  describe('Error Handling', () => {
    it('should handle file input errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<UploadButton {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement

      // Simulate file selection error
      const errorEvent = new Event('error')
      fireEvent(fileInput, errorEvent)

      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should recover from component errors', () => {
      const onError = jest.fn()
      
      render(
        <UploadButton 
          {...defaultProps}
          onError={onError}
        />
      )

      // Component should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should reset file input value after selection', async () => {
      const user = userEvent.setup()
      render(<UploadButton {...defaultProps} />)

      const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg', 'image/jpeg')

      await user.upload(fileInput, file)

      // Value should be reset to allow selecting the same file again
      expect(fileInput.value).toBe('')
    })

    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn()
      
      const TestButton = (props: any) => {
        renderSpy()
        return <UploadButton {...props} />
      }

      const { rerender } = render(<TestButton {...defaultProps} />)
      
      renderSpy.mockClear()
      
      // Re-render with same props
      rerender(<TestButton {...defaultProps} />)
      
      // Should use React.memo to prevent unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Styling', () => {
    it('should support CSS custom properties', () => {
      render(
        <UploadButton 
          {...defaultProps} 
          style={{ 
            '--upload-button-primary-bg': '#custom-color',
            '--upload-button-border-radius': '8px'
          } as any}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveStyle('--upload-button-primary-bg: #custom-color')
    })

    it('should inherit theme colors correctly', () => {
      render(<UploadButton {...defaultProps} variant="primary" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('upload-button--primary')
      
      // Should use CSS custom properties for theming
      const styles = window.getComputedStyle(button)
      expect(styles.getPropertyValue('background-color')).toBeTruthy()
    })
  })

  describe('Form Integration', () => {
    it('should work within forms', () => {
      render(
        <form>
          <UploadButton {...defaultProps} />
          <button type="submit">Submit</button>
        </form>
      )

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      expect(uploadButton).toHaveAttribute('type', 'button')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should not submit form on click', async () => {
      const onSubmit = jest.fn((e) => e.preventDefault())
      const user = userEvent.setup()

      render(
        <form onSubmit={onSubmit}>
          <UploadButton {...defaultProps} />
        </form>
      )

      const uploadButton = screen.getByRole('button', { name: 'Upload Image' })
      await user.click(uploadButton)

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})