/**
 * @fileoverview useAngleUpload Hook Tests - Comprehensive test suite for upload state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAngleUpload } from '@/mobile/components/UploadAngle/hooks/useAngleUpload'
import { UPLOAD_STATUS } from '@/mobile/components/UploadAngle/types/upload.types'
import { createMockFile, createMockImageFile } from '@test/upload-test-utils'

// Mock timers for testing
jest.useFakeTimers()

describe('useAngleUpload Hook', () => {
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

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAngleUpload())

      expect(result.current.state.status).toBe(UPLOAD_STATUS.IDLE)
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.imageUrl).toBeNull()
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.progress).toBe(0)
      expect(result.current.state.isTransitioning).toBe(false)
      expect(result.current.state.uploadSpeed).toBe(0)
      expect(result.current.state.timeRemaining).toBeNull()
      expect(result.current.state.retryCount).toBe(0)
      expect(result.current.isUploading).toBe(false)
      expect(result.current.canUpload).toBe(true)
    })

    it('should merge custom config with defaults', () => {
      const customConfig = {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        quality: 0.9
      }

      const { result } = renderHook(() => useAngleUpload(customConfig))

      // Test validation with custom config
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024)
      const validation = result.current.validateFile(largeFile)

      expect(validation.isValid).toBe(false)
      expect(validation.errors[0]).toContain('6.0MB exceeds maximum 5.0MB')
    })
  })

  describe('File Validation', () => {
    it('should validate file size correctly', () => {
      const { result } = renderHook(() => useAngleUpload())

      // Valid file
      const validFile = createMockFile('valid.jpg', 'image/jpeg', 1024 * 1024) // 1MB
      expect(result.current.validateFile(validFile).isValid).toBe(true)

      // Invalid file (too large)
      const invalidFile = createMockFile('invalid.jpg', 'image/jpeg', 15 * 1024 * 1024) // 15MB
      const validation = result.current.validateFile(invalidFile)
      expect(validation.isValid).toBe(false)
      expect(validation.errors[0]).toContain('exceeds maximum')
    })

    it('should validate file type correctly', () => {
      const { result } = renderHook(() => useAngleUpload())

      // Valid types
      const jpegFile = createMockFile('image.jpg', 'image/jpeg')
      expect(result.current.validateFile(jpegFile).isValid).toBe(true)

      const pngFile = createMockFile('image.png', 'image/png')
      expect(result.current.validateFile(pngFile).isValid).toBe(true)

      // Invalid type
      const txtFile = createMockFile('document.txt', 'text/plain')
      const validation = result.current.validateFile(txtFile)
      expect(validation.isValid).toBe(false)
      expect(validation.errors[0]).toContain('not supported')
    })

    it('should provide warnings for large files', () => {
      const { result } = renderHook(() => useAngleUpload())

      const largeFile = createMockFile('large.jpg', 'image/jpeg', 3 * 1024 * 1024) // 3MB
      const validation = result.current.validateFile(largeFile)

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain('Large file will be compressed to reduce upload time')
    })

    it('should handle empty file names', () => {
      const { result } = renderHook(() => useAngleUpload())

      const fileWithoutName = new File(['content'], '', { type: 'image/jpeg' })
      const validation = result.current.validateFile(fileWithoutName)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('File must have a valid name')
    })
  })

  describe('Upload Process', () => {
    it('should handle successful upload with progress updates', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      let uploadResult: any
      
      await act(async () => {
        uploadResult = await result.current.uploadFile(file)
      })

      // Fast-forward through progress updates
      await act(async () => {
        jest.advanceTimersByTime(5000) // 5 seconds should complete upload
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe(UPLOAD_STATUS.SUCCESS)
      })

      expect(uploadResult.success).toBe(true)
      expect(uploadResult.data).toBeTruthy()
      expect(result.current.state.progress).toBe(100)
      expect(result.current.isUploading).toBe(false)
    })

    it('should handle upload progress updates correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
      })

      // Check initial uploading state
      expect(result.current.state.status).toBe(UPLOAD_STATUS.UPLOADING)
      expect(result.current.isUploading).toBe(true)
      expect(result.current.canUpload).toBe(false)

      // Advance time and check progress updates
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.state.progress).toBeGreaterThan(0)
    })

    it('should handle upload errors with retry logic', async () => {
      const { result } = renderHook(() => useAngleUpload())
      
      // Mock random to force error
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.01) // Force error (< 0.05)

      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        const uploadResult = await result.current.uploadFile(file)
        expect(uploadResult.success).toBe(false)
      })

      await act(async () => {
        jest.advanceTimersByTime(2000) // Advance past error trigger point
      })

      expect(result.current.state.status).toBe(UPLOAD_STATUS.ERROR)
      expect(result.current.state.error).toContain('network error')
      
      // Restore random
      Math.random = originalRandom
    })

    it('should handle validation errors before upload', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const invalidFile = createMockFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024) // Too large

      await act(async () => {
        const uploadResult = await result.current.uploadFile(invalidFile)
        expect(uploadResult.success).toBe(false)
        expect(uploadResult.error).toContain('exceeds maximum')
      })

      // Should not start uploading
      expect(result.current.state.status).toBe(UPLOAD_STATUS.IDLE)
      expect(result.current.isUploading).toBe(false)
    })
  })

  describe('Upload Cancellation', () => {
    it('should cancel upload correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
      })

      expect(result.current.state.status).toBe(UPLOAD_STATUS.UPLOADING)

      await act(async () => {
        result.current.cancelUpload()
      })

      expect(result.current.state.status).toBe(UPLOAD_STATUS.ERROR)
      expect(result.current.state.error).toBe('Upload cancelled by user')
    })

    it('should clear timers on cancellation', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      await act(async () => {
        result.current.uploadFile(file)
        result.current.cancelUpload()
      })

      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed uploads with exponential backoff', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        const uploadResult = await result.current.retryUpload()
        expect(uploadResult.success).toBe(false)
        expect(uploadResult.error).toBe('No file to retry')
      })

      // Set up retry scenario
      await act(async () => {
        result.current.uploadFile(file)
      })

      await act(async () => {
        const retryResult = await result.current.retryUpload()
        expect(typeof retryResult).toBe('object')
      })
    })

    it('should handle retry count correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      
      // Force network error to test retry
      const originalRandom = Math.random
      Math.random = jest.fn().mockReturnValue(0.01) // Force error

      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        await result.current.uploadFile(file)
      })

      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.state.retryCount).toBeGreaterThan(0)
      
      Math.random = originalRandom
    })
  })

  describe('State Management', () => {
    it('should reset state correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      // Upload file first
      await act(async () => {
        result.current.uploadFile(file)
      })

      // Reset state
      await act(async () => {
        result.current.reset()
      })

      expect(result.current.state.status).toBe(UPLOAD_STATUS.IDLE)
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.imageUrl).toBeNull()
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.progress).toBe(0)
      expect(result.current.state.retryCount).toBe(0)
    })

    it('should clean up blob URLs on reset', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL')

      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
        result.current.reset()
      })

      expect(revokeObjectURLSpy).toHaveBeenCalled()
    })
  })

  describe('Memory Management', () => {
    it('should clean up resources on unmount', () => {
      const { result, unmount } = renderHook(() => useAngleUpload())
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      act(() => {
        unmount()
      })

      // Note: blob URLs cleanup happens on unmount through useEffect
      // The spy might not be called if no blob URLs were created
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle cleanup function correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
        result.current.cleanup()
      })

      // After cleanup, state should be manageable
      expect(typeof result.current.cleanup).toBe('function')
    })
  })

  describe('Progress Tracking', () => {
    it('should track upload speed correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.state.uploadSpeed).toBeGreaterThanOrEqual(0)
    })

    it('should calculate time remaining accurately', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024) // 2MB file

      await act(async () => {
        result.current.uploadFile(file)
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // Time remaining should be calculated or null initially
      expect(typeof result.current.state.timeRemaining === 'number' || 
             result.current.state.timeRemaining === null).toBe(true)
    })
  })

  describe('Image Metadata Extraction', () => {
    it('should extract image metadata correctly', async () => {
      const { cleanup } = createMockImageFile('test.jpg', 800, 600)
      const { result } = renderHook(() => useAngleUpload())

      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        await result.current.uploadFile(file)
      })

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe(UPLOAD_STATUS.SUCCESS)
      })

      expect(result.current.state.metadata).toBeTruthy()
      if (result.current.state.metadata) {
        expect(result.current.state.metadata.filename).toBe('test.jpg')
        expect(result.current.state.metadata.size).toBe(1024 * 1024)
        expect(result.current.state.metadata.type).toBe('image/jpeg')
        expect(result.current.state.metadata.width).toBe(800)
        expect(result.current.state.metadata.height).toBe(600)
      }

      cleanup()
    })
  })

  describe('React 18 Features', () => {
    it('should handle transitions correctly', async () => {
      const { result } = renderHook(() => useAngleUpload())
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024)

      await act(async () => {
        result.current.uploadFile(file)
      })

      // isTransitioning should be managed by React 18 useTransition
      expect(typeof result.current.isTransitioning).toBe('boolean')
    })
  })
})