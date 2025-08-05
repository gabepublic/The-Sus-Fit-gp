import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrutalismCard } from '@/components/ui/brutalism-card'

// Mock console.error to capture validation messages
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('BrutalismCard File Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates file types - rejects non-image files', async () => {
    const mockTextFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    render(<BrutalismCard />)
    
    // Find the hidden file input
    const fileInput = screen.getByRole('button') as HTMLLabelElement
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Simulate file selection by setting the files property and triggering change event
    Object.defineProperty(input, 'files', {
      value: [mockTextFile],
      writable: true
    })
    
    // Trigger the change event
    fireEvent.change(input)
    
    // Verify console.error was called with the correct message
    expect(console.error).toHaveBeenCalledWith('Selected file is not an image')
  })

  it('validates file size - rejects files larger than 5MB', async () => {
    const mockLargeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    
    render(<BrutalismCard />)
    
    // Find the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [mockLargeFile],
      writable: true
    })
    
    // Trigger the change event
    fireEvent.change(input)
    
    // Verify console.error was called with the correct message
    expect(console.error).toHaveBeenCalledWith('Image file is too large (max 5MB)')
  })

  it('accepts valid image files', async () => {
    const mockValidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const onFileUpload = jest.fn()
    const onImageUpload = jest.fn()
    
    render(
      <BrutalismCard 
        onFileUpload={onFileUpload}
        onImageUpload={onImageUpload}
      />
    )
    
    // Find the hidden file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [mockValidFile],
      writable: true
    })
    
    // Trigger the change event
    fireEvent.change(input)
    
    // Verify no error was logged
    expect(console.error).not.toHaveBeenCalled()
    
    // Verify callbacks were called (need to wait for FileReader)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(onFileUpload).toHaveBeenCalledWith(mockValidFile)
  })

  it('handles drag and drop with invalid file type', async () => {
    const mockTextFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    render(<BrutalismCard />)
    
    const dropZone = screen.getByText('Upload Your Angle').closest('div') as HTMLElement
    
    // Simulate drag and drop with invalid file
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockTextFile]
      }
    })
    
    // Verify no error was logged (drag and drop doesn't trigger validation for non-images)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('handles drag and drop with large file', async () => {
    const mockLargeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    
    render(<BrutalismCard />)
    
    const dropZone = screen.getByText('Upload Your Angle').closest('div') as HTMLElement
    
    // Simulate drag and drop with large file
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockLargeFile]
      }
    })
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Image file is too large (max 5MB)')
  })

  it('handles drag and drop with valid file', async () => {
    const mockValidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const onFileUpload = jest.fn()
    const onImageUpload = jest.fn()
    
    render(
      <BrutalismCard 
        onFileUpload={onFileUpload}
        onImageUpload={onImageUpload}
      />
    )
    
    const dropZone = screen.getByText('Upload Your Angle').closest('div') as HTMLElement
    
    // Simulate drag and drop with valid file
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockValidFile]
      }
    })
    
    // Verify no error was logged
    expect(console.error).not.toHaveBeenCalled()
    
    // Verify callbacks were called (need to wait for FileReader)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(onFileUpload).toHaveBeenCalledWith(mockValidFile)
  })
}) 