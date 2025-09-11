import React, { useState, useCallback } from 'react'
import { render, screen, fireEvent, waitFor, act, within } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import SusFitPage from '@/app/page'

// Setup user event
const user = userEvent.setup()

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url')

// Mock the utility functions
jest.mock('@/utils/image', () => ({
  fileToBase64: jest.fn().mockResolvedValue('mock-base64-data'),
  compressBase64: jest.fn().mockResolvedValue('mock-compressed-data'),
  CompressionFailedError: class CompressionFailedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CompressionFailedError'
    }
  }
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock console methods to avoid noise in tests
const originalLog = console.log
const originalError = console.error
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalLog
  console.error = originalError
})

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, ...props }: any) {
    React.useEffect(() => {
      if (onLoad) {
        setTimeout(() => onLoad(), 10)
      }
    }, [onLoad])
    
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock SaucyTicker component
jest.mock('@/components/ui/saucy-ticker', () => ({
  SaucyTicker: () => <div data-testid="saucy-ticker">Saucy Ticker</div>
}))

// Mock HeroImageWithButton component to ensure button is only rendered when not disabled
jest.mock('@/components/ui/hero-image-with-button', () => ({
  HeroImageWithButton: ({ overlayButton, ...props }: any) => {
    return (
      <div className="relative w-full flex items-center justify-center h-[50vh] min-h-[400px] max-h-[800px]">
        <img src={props.src} alt={props.alt} className="object-contain drop-shadow-2xl" />
        {overlayButton && !overlayButton.disabled && (
          <button
            onClick={overlayButton.onClick}
            disabled={overlayButton.disabled}
            className={`absolute z-20 rounded-full w-8 h-8 transition-all duration-150 ease-in-out ${
              overlayButton.disabled 
                ? "cursor-not-allowed opacity-50" 
                : "hover:scale-110 active:scale-95 cursor-pointer"
            } ${overlayButton.className || ''}`}
            style={{
              left: overlayButton.position.leftPercent,
              top: overlayButton.position.topPercent,
              transform: 'translate(-50%, -50%)',
              background: `
                radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 60%),
                #D80E0E
              `,
              border: '2px solid #BF1212',
              boxShadow: `
                0 15px 25px rgba(0, 0, 0, 0.4),
                0 0 0 4px rgba(240, 228, 228, 0.5)
              `,
            }}
            aria-label="Camera capture button"
          />
        )}
      </div>
    )
  }
}))

// Mock PolaroidPhotoGenerator component
jest.mock('@/components/ui/polaroid-photo-generator', () => ({
  PolaroidPhotoGenerator: ({ 
    isGenerating, 
    onGenerationStart, 
    onGenerationComplete, 
    onClose, 
    onRetry, 
    generatedImage,
    hasError
  }: any) => {
    React.useEffect(() => {
      if (isGenerating) {
        onGenerationStart()
      }
    }, [isGenerating, onGenerationStart])

    React.useEffect(() => {
      if (generatedImage && !isGenerating) {
        onGenerationComplete(generatedImage)
      }
    }, [generatedImage, isGenerating, onGenerationComplete])

    return (
      <div data-testid="polaroid" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Generated Image</h2>
          {isGenerating && <p>Generating...</p>}
          {hasError && <p className="text-red-500">Failed to generate image</p>}
          {generatedImage && (
            <img src={generatedImage} alt="Generated" className="w-full mb-4" />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded">
              Close
            </button>
            {hasError && (
              <button onClick={onRetry} className="px-4 py-2 bg-blue-500 text-white rounded">
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}))

// Mock BrutalismCard component
jest.mock('@/components/ui/brutalism-card', () => ({
  BrutalismCard: ({ 
    title, 
    onImageUpload, 
    onFileUpload,
    imageUrl, 
    isUploading, 
    error, 
    onErrorClick, 
    onUploadClick,
    className,
    children
  }: any) => {
    return (
      <div className={`brutalism-card ${className || ''}`}>
        <h3>{title}</h3>
        {children}
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              // Call both callbacks like the real component does
              if (onFileUpload) {
                onFileUpload(file)
              }
              if (onImageUpload) {
                onImageUpload('mock-image-url')
              }
            }
          }}
          style={{ display: 'none' }}
        />
        {imageUrl && <img src={imageUrl} alt={title} />}
        {isUploading && <p>Uploading...</p>}
        {error && (
          <button onClick={onErrorClick} className="error-button">
            {error}
          </button>
        )}
        <button onClick={onUploadClick} className="upload-button">
          Upload Image
        </button>
      </div>
    )
  }
}))

describe('SusFitPage - Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ img_generated: 'data:image/jpeg;base64,mock-generated-image' }),
    })
  })

  describe('Targeted Coverage Tests', () => {
    it('covers image upload console logging', () => {
      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Mock FileReader to return a base64 data URL
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,mock-base64-data',
        onload: null as any,
      }
      
      // Mock FileReader constructor
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger image upload logging
      act(() => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // Should log the file upload (current behavior)
      expect(consoleSpy).toHaveBeenCalledWith('Left-card User file uploaded:', expect.any(File))
      
      consoleSpy.mockRestore()
    })

    it('covers resizeImage function through ResizeService API call', async () => {
      // Mock the ResizeService API call
      const mockResizeResponse = {
        success: true,
        resizedB64: 'data:image/png;base64,mock-resized',
        metadata: {
          original: {
            size: 1000,
            type: 'image/jpeg',
            width: 800,
            height: 600,
            format: 'jpeg'
          },
          resized: {
            size: 500,
            type: 'image/png',
            width: 832,
            height: 1248,
            format: 'png'
          }
        }
      }
      
      // Mock fetch for the resize API
      const originalFetch = global.fetch
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResizeResponse)
        })
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger the resizeImage function
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // Wait for the resize API call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/resize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"imageB64"')
        })
      })
      
      // Restore fetch
      global.fetch = originalFetch
    })

    it('covers generic error handling in handleCameraButtonClick', async () => {
      render(<SusFitPage />)
      
      const { fileToBase64, compressBase64 } = require('@/utils/image')
      ;(fileToBase64 as jest.Mock).mockResolvedValue('data:image/jpeg;base64,mock')
      ;(compressBase64 as jest.Mock).mockResolvedValue('data:image/jpeg;base64,mock')
      
      // Mock fetch to throw a generic error (not CompressionFailedError or AbortError)
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Generic network error'))
      
      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Simulate both image uploads
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const apparelFileInput = fileInputs[1]
      
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      const apparelMockFile = new File(['mock'], 'apparel.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
        fireEvent.change(apparelFileInput, { target: { files: [apparelMockFile] } })
      })
      
      // Click camera button
      const cameraButton = screen.getByRole('button', { name: /camera capture button/i })
      await user.click(cameraButton)
      
      // Should handle generic error gracefully
      await waitFor(() => {
        expect(screen.getByText(/Failed to generate image/)).toBeInTheDocument()
      })
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in handleCameraButtonClick:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })


  })

  describe('Utility Functions - Integration Testing', () => {
    it('tests resizeImage through component behavior', async () => {
      // Mock the ResizeService API call
      const mockResizeResponse = {
        success: true,
        resizedB64: 'data:image/png;base64,mock-resized',
        metadata: {
          original: {
            size: 1000,
            type: 'image/jpeg',
            width: 800,
            height: 600,
            format: 'jpeg'
          },
          resized: {
            size: 500,
            type: 'image/png',
            width: 832,
            height: 1248,
            format: 'png'
          }
        }
      }
      
      // Mock fetch for the resize API
      const originalFetch = global.fetch
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResizeResponse)
        })
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger the resizeImage function
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // Wait for the resize API call to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/resize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"imageB64"')
        })
      })
      
      // Restore fetch
      global.fetch = originalFetch
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('handles AbortError specifically', async () => {
      render(<SusFitPage />)
      
      const { fileToBase64, compressBase64 } = require('@/utils/image')
      ;(fileToBase64 as jest.Mock).mockResolvedValue('data:image/jpeg;base64,mock')
      ;(compressBase64 as jest.Mock).mockResolvedValue('data:image/jpeg;base64,mock')
      
      // Mock fetch to throw AbortError
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('AbortError'))
      
      // Simulate both image uploads
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const apparelFileInput = fileInputs[1]
      
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      const apparelMockFile = new File(['mock'], 'apparel.jpg', { type: 'image/jpeg' })
      
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
        fireEvent.change(apparelFileInput, { target: { files: [apparelMockFile] } })
      })
      
      // Click camera button
      const cameraButton = screen.getByRole('button', { name: /camera capture button/i })
      await user.click(cameraButton)
      
      // Should show timeout error for AbortError
      await waitFor(() => {
        expect(screen.getByText(/Request timed out/)).toBeInTheDocument()
      })
    })

  })
})
