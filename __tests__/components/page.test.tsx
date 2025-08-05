import { fileToBase64, compressBase64, CompressionFailedError } from '@/utils/image'

// Mock the utility functions
jest.mock('@/utils/image', () => ({
  fileToBase64: jest.fn(),
  compressBase64: jest.fn(),
  CompressionFailedError: class CompressionFailedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CompressionFailedError'
    }
  }
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

// Mock File constructor
global.File = jest.fn().mockImplementation((content, name, options) => ({
  name,
  size: content.length,
  type: options?.type || 'image/jpeg',
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(content.length)),
  stream: jest.fn(),
  text: jest.fn().mockResolvedValue(''),
  slice: jest.fn(),
  lastModified: Date.now(),
}))

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: 'mock-signal',
  abort: jest.fn(),
}))

// Mock setTimeout and clearTimeout
jest.useFakeTimers()
const mockSetTimeout = jest.spyOn(global, 'setTimeout')
const mockClearTimeout = jest.spyOn(global, 'clearTimeout')

describe('handleCameraButtonClick Logic Tests', () => {
  let mockUserFile: File
  let mockApparelFile: File

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock files
    mockUserFile = new File(['user-image-content'], 'user.jpg', { type: 'image/jpeg' })
    mockApparelFile = new File(['apparel-image-content'], 'apparel.jpg', { type: 'image/jpeg' })
    
    // Reset mock implementations
    ;(fileToBase64 as jest.Mock).mockResolvedValue('mock-base64-string')
    ;(compressBase64 as jest.Mock).mockResolvedValue('compressed-base64-string')
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  // Test the core logic function that would be extracted from handleCameraButtonClick
  const processImagesAndCallAPI = async (userFile: File, apparelFile: File) => {
    try {
      // Process images concurrently
      const [modelB64, apparelB64] = await Promise.all([
        fileToBase64(userFile),
        fileToBase64(apparelFile)
      ])

      // Compress both images
      const [compressedModel, compressedApparel] = await Promise.all([
        compressBase64(modelB64, 2048),
        compressBase64(apparelB64, 2048)
      ])

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        // Make API call
        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelImage: compressedModel,
            apparelImages: [compressedApparel]
          }),
          signal: controller.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API request failed: ${response.status} ${errorText}`)
        }

        const { img_generated } = await response.json()
        console.log('Successfully received generated image from API')
        
        return { success: true, img_generated }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error('Error in processImagesAndCallAPI:', error)
      throw error
    }
  }

  describe('Success Path', () => {
    it('should successfully process images and make API call', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'generated-image-base64' })
      })

      // Act
      const result = await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(fileToBase64).toHaveBeenCalledWith(mockUserFile)
      expect(fileToBase64).toHaveBeenCalledWith(mockApparelFile)
      expect(compressBase64).toHaveBeenCalledWith('mock-base64-string', 2048)
      expect(mockFetch).toHaveBeenCalledWith('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImage: 'compressed-base64-string',
          apparelImages: ['compressed-base64-string']
        }),
        signal: 'mock-signal'
      })
      expect(mockConsoleLog).toHaveBeenCalledWith('Successfully received generated image from API')
      expect(result).toEqual({ success: true, img_generated: 'generated-image-base64' })
    })
  })

  describe('Error Handling', () => {
    it('should handle compression failures', async () => {
      // Arrange
      ;(compressBase64 as jest.Mock).mockRejectedValueOnce(new CompressionFailedError('Compression failed'))

      // Act & Assert
      await expect(processImagesAndCallAPI(mockUserFile, mockApparelFile))
        .rejects.toThrow('Compression failed')
    })

    it('should handle API request failures', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad request')
      })

      // Act & Assert
      await expect(processImagesAndCallAPI(mockUserFile, mockApparelFile))
        .rejects.toThrow('API request failed: 400 Bad request')
    })

    it('should handle timeout errors', async () => {
      // Arrange
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      // Act & Assert
      await expect(processImagesAndCallAPI(mockUserFile, mockApparelFile))
        .rejects.toThrow('Request aborted')
    })
  })

  describe('Timeout Management', () => {
    it('should create AbortController with 30-second timeout', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'test' })
      })

      // Act
      await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(global.AbortController).toHaveBeenCalled()
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 30000)
    })

    it('should clear timeout on successful completion', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'test' })
      })

      // Act
      await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(mockClearTimeout).toHaveBeenCalled()
    })
  })

  describe('Image Processing', () => {
    it('should process both images concurrently', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'test' })
      })

      // Act
      await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(fileToBase64).toHaveBeenCalledWith(mockUserFile)
      expect(fileToBase64).toHaveBeenCalledWith(mockApparelFile)
      expect(compressBase64).toHaveBeenCalledWith('mock-base64-string', 2048)
    })

    it('should use correct compression limit', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'test' })
      })

      // Act
      await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(compressBase64).toHaveBeenCalledWith('mock-base64-string', 2048)
    })
  })

  describe('API Request Format', () => {
    it('should send correct request body format', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ img_generated: 'test' })
      })

      // Act
      await processImagesAndCallAPI(mockUserFile, mockApparelFile)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImage: 'compressed-base64-string',
          apparelImages: ['compressed-base64-string']
        }),
        signal: 'mock-signal'
      })
    })
  })
}) 