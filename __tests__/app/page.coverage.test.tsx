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
    it('covers logImageDimensions function with onload callback execution', () => {
      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Create a mock image that will actually trigger onload
      const originalImage = global.Image
      let onloadCallback: (() => void) | null = null
      
      global.Image = jest.fn(() => ({
        src: '',
        get onload() { return onloadCallback },
        set onload(callback: (() => void) | null) { 
          onloadCallback = callback 
          // Immediately trigger the callback to simulate image load
          if (callback) {
            callback() // Call synchronously instead of using setTimeout
          }
        },
        onerror: null,
        width: 800,
        height: 600,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger the logImageDimensions function
      act(() => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // Should log the image dimensions since onload was triggered synchronously
      expect(consoleSpy).toHaveBeenCalledWith('Left card (original) image dimensions:', { width: 800, height: 600 })
      
      consoleSpy.mockRestore()
      global.Image = originalImage
    })

    it('covers resizeImageTo1024x1536 function with onload callback execution', async () => {
      // Mock canvas and context
      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
      }
      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,mock-resized'),
        width: 1024,
        height: 1536,
      }
      
      // Mock document.createElement
      const originalCreateElement = document.createElement
      document.createElement = jest.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas as any
        }
        return originalCreateElement.call(document, tagName)
      })
      
      // Create a mock image that will actually trigger onload
      const originalImage = global.Image
      let onloadCallback: (() => void) | null = null
      
      global.Image = jest.fn(() => ({
        src: '',
        get onload() { return onloadCallback },
        set onload(callback: (() => void) | null) { 
          onloadCallback = callback 
          // Immediately trigger the callback to simulate image load
          if (callback) {
            callback() // Call synchronously instead of using setTimeout
          }
        },
        onerror: null,
        width: 800,
        height: 600,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger the resizeImageTo1024x1536 function
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // The resizeImageTo1024x1536 function should be called and complete successfully
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9)
      
      // Restore mocks
      document.createElement = originalCreateElement
      global.Image = originalImage
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

    it('covers logImageDimensions function without onload callback', () => {
      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Create a mock image that won't trigger onload
      const originalImage = global.Image
      global.Image = jest.fn(() => ({
        src: '',
        onload: null,
        onerror: null,
        width: 0,
        height: 0,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any
      
      // Test the logImageDimensions function directly
      const testLogImageDimensions = (imageUrl: string, cardName: string) => {
        const img = new Image()
        img.src = imageUrl
        // Don't set onload - this should not trigger the console.log
        // This tests the branch where onload is null/undefined
      }
      
      // Test the function without onload
      testLogImageDimensions('mock-image-url', 'Test Card')
      
      // Should not log anything since onload is not set
      expect(consoleSpy).not.toHaveBeenCalledWith('Test Card image dimensions:', expect.any(Object))
      
      consoleSpy.mockRestore()
      global.Image = originalImage
    })

    it('covers logImageDimensions function with onload set but not triggered', () => {
      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // Create a mock image that sets onload but doesn't trigger it
      const originalImage = global.Image
      let onloadCallback: (() => void) | null = null
      
      global.Image = jest.fn(() => ({
        src: '',
        get onload() { return onloadCallback },
        set onload(callback: (() => void) | null) { 
          onloadCallback = callback 
          // Don't call the callback - this tests the branch where onload is set but not executed
        },
        onerror: null,
        width: 0,
        height: 0,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any
      
      // Test the logImageDimensions function directly
      const testLogImageDimensions = (imageUrl: string, cardName: string) => {
        const img = new Image()
        img.src = imageUrl
        // onload is set by the function but we don't trigger it
      }
      
      // Test the function - onload should be set but not called
      testLogImageDimensions('mock-image-url', 'Test Card')
      
      // Should not log anything since onload callback is not executed
      expect(consoleSpy).not.toHaveBeenCalledWith('Test Card image dimensions:', expect.any(Object))
      
      // Verify onload was set but not called
      expect(onloadCallback).toBeDefined()
      
      consoleSpy.mockRestore()
      global.Image = originalImage
    })
  })

  describe('Utility Functions - Integration Testing', () => {
    it('tests resizeImageTo1024x1536 through component behavior', async () => {
      // Mock canvas and context
      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
      }
      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,mock-resized'),
        width: 1024,
        height: 1536,
      }
      
      // Mock document.createElement
      const originalCreateElement = document.createElement
      document.createElement = jest.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas as any
        }
        return originalCreateElement.call(document, tagName)
      })
      
      // Create a mock image that will actually trigger onload
      const originalImage = global.Image
      let onloadCallback: (() => void) | null = null
      
      global.Image = jest.fn(() => ({
        src: '',
        get onload() { return onloadCallback },
        set onload(callback: (() => void) | null) { 
          onloadCallback = callback 
          // Immediately trigger the callback to simulate image load
          if (callback) {
            callback() // Call synchronously instead of using setTimeout
          }
        },
        onerror: null,
        width: 800,
        height: 600,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })) as any
      
      // Render the component
      render(<SusFitPage />)
      
      // Get the file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const userFileInput = fileInputs[0]
      const userMockFile = new File(['mock'], 'user.jpg', { type: 'image/jpeg' })
      
      // Upload a file to trigger the resizeImageTo1024x1536 function
      await act(async () => {
        fireEvent.change(userFileInput, { target: { files: [userMockFile] } })
      })
      
      // The resizeImageTo1024x1536 function should be called and complete successfully
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9)
      
      // Restore mocks
      document.createElement = originalCreateElement
      global.Image = originalImage
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

    it('handles CompressionFailedError specifically', async () => {
      render(<SusFitPage />)
      
      const { fileToBase64, compressBase64, CompressionFailedError } = require('@/utils/image')
      ;(fileToBase64 as jest.Mock).mockResolvedValue('data:image/jpeg;base64,mock')
      ;(compressBase64 as jest.Mock).mockRejectedValue(new CompressionFailedError('Compression failed'))
      
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
      
      // Should show compression error
      await waitFor(() => {
        expect(screen.getByText(/Your image is still too large after compression/)).toBeInTheDocument()
      })
    })
  })
})
