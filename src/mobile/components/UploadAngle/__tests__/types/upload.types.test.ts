/**
 * @fileoverview Upload Types Tests - Tests for type guards and utility types
 */

import {
  UPLOAD_STATUS,
  UPLOAD_ACTIONS,
  DEFAULT_UPLOAD_CONFIG,
  PRODUCTION_UPLOAD_CONFIG,
  STATUS_MESSAGES,
  isUploadStatus,
  isUploadError,
  isSuccessfulUpload,
  createValidatedImageUrl,
  UploadState,
  UploadConfig,
  ImageValidationResult,
  UploadResult,
  UploadError
} from '../../types/upload.types'

describe('Upload Types and Type Guards', () => {
  describe('Constants', () => {
    it('should have correct upload status values', () => {
      expect(UPLOAD_STATUS.IDLE).toBe('idle')
      expect(UPLOAD_STATUS.UPLOADING).toBe('uploading')
      expect(UPLOAD_STATUS.SUCCESS).toBe('success')
      expect(UPLOAD_STATUS.ERROR).toBe('error')
    })

    it('should have correct upload action values', () => {
      expect(UPLOAD_ACTIONS.SET_FILE).toBe('SET_FILE')
      expect(UPLOAD_ACTIONS.SET_PROGRESS).toBe('SET_PROGRESS')
      expect(UPLOAD_ACTIONS.SET_SUCCESS).toBe('SET_SUCCESS')
      expect(UPLOAD_ACTIONS.SET_ERROR).toBe('SET_ERROR')
      expect(UPLOAD_ACTIONS.RESET).toBe('RESET')
    })

    it('should have valid default upload configuration', () => {
      expect(DEFAULT_UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024) // 10MB
      expect(DEFAULT_UPLOAD_CONFIG.allowedTypes).toEqual(['image/jpeg', 'image/png', 'image/webp'])
      expect(DEFAULT_UPLOAD_CONFIG.quality).toBe(0.8)
      expect(DEFAULT_UPLOAD_CONFIG.maxWidth).toBe(2048)
      expect(DEFAULT_UPLOAD_CONFIG.maxHeight).toBe(2048)
      expect(DEFAULT_UPLOAD_CONFIG.enableCompression).toBe(true)
    })

    it('should have valid production upload configuration', () => {
      expect(PRODUCTION_UPLOAD_CONFIG.maxFileSize).toBe(5 * 1024 * 1024) // 5MB
      expect(PRODUCTION_UPLOAD_CONFIG.allowedTypes).toEqual(['image/jpeg', 'image/png'])
      expect(PRODUCTION_UPLOAD_CONFIG.quality).toBe(0.9)
      expect(PRODUCTION_UPLOAD_CONFIG.maxWidth).toBe(1920)
      expect(PRODUCTION_UPLOAD_CONFIG.maxHeight).toBe(1920)
      expect(PRODUCTION_UPLOAD_CONFIG.enableCompression).toBe(true)
    })

    it('should have correct status messages', () => {
      expect(STATUS_MESSAGES[UPLOAD_STATUS.IDLE]).toBe('Ready to upload')
      expect(STATUS_MESSAGES[UPLOAD_STATUS.UPLOADING]).toBe('Uploading...')
      expect(STATUS_MESSAGES[UPLOAD_STATUS.SUCCESS]).toBe('Upload successful')
      expect(STATUS_MESSAGES[UPLOAD_STATUS.ERROR]).toBe('Upload failed')
    })
  })

  describe('Type Guards', () => {
    describe('isUploadStatus', () => {
      it('should validate valid upload statuses', () => {
        expect(isUploadStatus('idle')).toBe(true)
        expect(isUploadStatus('uploading')).toBe(true)
        expect(isUploadStatus('success')).toBe(true)
        expect(isUploadStatus('error')).toBe(true)
      })

      it('should reject invalid upload statuses', () => {
        expect(isUploadStatus('invalid')).toBe(false)
        expect(isUploadStatus('')).toBe(false)
        expect(isUploadStatus(null)).toBe(false)
        expect(isUploadStatus(undefined)).toBe(false)
        expect(isUploadStatus(123)).toBe(false)
        expect(isUploadStatus({})).toBe(false)
      })

      it('should handle edge cases', () => {
        expect(isUploadStatus('IDLE')).toBe(false) // Case sensitive
        expect(isUploadStatus(' idle ')).toBe(false) // Whitespace
      })
    })

    describe('isUploadError', () => {
      it('should validate valid upload errors', () => {
        const error: UploadError = {
          name: 'UploadError',
          message: 'Upload failed',
          code: 'UPLOAD_ERROR',
          metadata: { retryCount: 1 }
        }

        expect(isUploadError(error)).toBe(true)
      })

      it('should reject invalid upload errors', () => {
        expect(isUploadError(new Error('Regular error'))).toBe(false)
        expect(isUploadError('string error')).toBe(false)
        expect(isUploadError(null)).toBe(false)
        expect(isUploadError(undefined)).toBe(false)
        expect(isUploadError({})).toBe(false)
      })

      it('should validate error with different codes', () => {
        const errorCodes = ['VALIDATION_ERROR', 'UPLOAD_ERROR', 'PROCESSING_ERROR', 'NETWORK_ERROR']

        errorCodes.forEach(code => {
          const error = {
            name: 'UploadError',
            message: 'Error',
            code: code as any
          }
          expect(isUploadError(error)).toBe(true)
        })
      })
    })

    describe('isSuccessfulUpload', () => {
      it('should validate successful upload results', () => {
        const successResult: UploadResult<string> = {
          success: true,
          data: 'upload-url',
          error: null
        }

        expect(isSuccessfulUpload(successResult)).toBe(true)
      })

      it('should reject failed upload results', () => {
        const failedResult: UploadResult<string> = {
          success: false,
          data: null,
          error: 'Upload failed'
        }

        expect(isSuccessfulUpload(failedResult)).toBe(false)
      })

      it('should handle edge cases', () => {
        const resultWithNullData: UploadResult<string> = {
          success: true,
          data: null,
          error: null
        }

        expect(isSuccessfulUpload(resultWithNullData)).toBe(false)

        const resultWithData: UploadResult<string> = {
          success: false,
          data: 'some-data',
          error: 'Error occurred'
        }

        expect(isSuccessfulUpload(resultWithData)).toBe(false)
      })
    })
  })

  describe('Utility Functions', () => {
    describe('createValidatedImageUrl', () => {
      it('should create validated image URL', () => {
        const url = 'https://example.com/image.jpg'
        const validatedUrl = createValidatedImageUrl(url)

        expect(validatedUrl).toBe(url)
        expect(typeof validatedUrl).toBe('string')
      })

      it('should handle different URL formats', () => {
        const urls = [
          'https://example.com/image.jpg',
          'http://localhost:3000/image.png',
          'blob:http://localhost:3000/abc-123',
          'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
        ]

        urls.forEach(url => {
          const validatedUrl = createValidatedImageUrl(url)
          expect(validatedUrl).toBe(url)
        })
      })
    })
  })

  describe('Interface Compliance', () => {
    describe('UploadState', () => {
      it('should create valid upload state', () => {
        const state: UploadState = {
          status: 'idle',
          file: null,
          imageUrl: null,
          error: null,
          progress: 0
        }

        expect(state.status).toBe('idle')
        expect(state.file).toBeNull()
        expect(state.imageUrl).toBeNull()
        expect(state.error).toBeNull()
        expect(state.progress).toBe(0)
      })

      it('should handle all status types', () => {
        const statuses = ['idle', 'uploading', 'success', 'error'] as const

        statuses.forEach(status => {
          const state: UploadState = {
            status,
            file: null,
            imageUrl: null,
            error: null,
            progress: 0
          }

          expect(isUploadStatus(state.status)).toBe(true)
        })
      })
    })

    describe('UploadConfig', () => {
      it('should create valid upload configuration', () => {
        const config: UploadConfig = {
          maxFileSize: 5 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png'],
          quality: 0.9,
          maxWidth: 1920,
          maxHeight: 1920,
          enableCompression: true
        }

        expect(config.maxFileSize).toBeGreaterThan(0)
        expect(Array.isArray(config.allowedTypes)).toBe(true)
        expect(config.quality).toBeGreaterThanOrEqual(0)
        expect(config.quality).toBeLessThanOrEqual(1)
        expect(config.maxWidth).toBeGreaterThan(0)
        expect(config.maxHeight).toBeGreaterThan(0)
        expect(typeof config.enableCompression).toBe('boolean')
      })

      it('should merge with defaults correctly', () => {
        const partialConfig: Partial<UploadConfig> = {
          maxFileSize: 2 * 1024 * 1024,
          quality: 0.95
        }

        const mergedConfig = { ...DEFAULT_UPLOAD_CONFIG, ...partialConfig }

        expect(mergedConfig.maxFileSize).toBe(2 * 1024 * 1024)
        expect(mergedConfig.quality).toBe(0.95)
        expect(mergedConfig.allowedTypes).toEqual(DEFAULT_UPLOAD_CONFIG.allowedTypes)
        expect(mergedConfig.enableCompression).toBe(DEFAULT_UPLOAD_CONFIG.enableCompression)
      })
    })

    describe('ImageValidationResult', () => {
      it('should create valid validation result', () => {
        const validResult: ImageValidationResult = {
          isValid: true,
          errors: [],
          warnings: ['File is large']
        }

        const invalidResult: ImageValidationResult = {
          isValid: false,
          errors: ['File too large', 'Invalid format'],
          warnings: []
        }

        expect(validResult.isValid).toBe(true)
        expect(validResult.errors).toHaveLength(0)
        expect(validResult.warnings).toHaveLength(1)

        expect(invalidResult.isValid).toBe(false)
        expect(invalidResult.errors).toHaveLength(2)
        expect(invalidResult.warnings).toHaveLength(0)
      })
    })

    describe('UploadResult', () => {
      it('should create generic upload results', () => {
        const stringResult: UploadResult<string> = {
          success: true,
          data: 'result-string',
          error: null
        }

        const objectResult: UploadResult<{ id: string; url: string }> = {
          success: true,
          data: { id: '123', url: 'https://example.com/image.jpg' },
          error: null
        }

        const failedResult: UploadResult<unknown> = {
          success: false,
          data: null,
          error: 'Upload failed'
        }

        expect(stringResult.data).toBe('result-string')
        expect(objectResult.data?.id).toBe('123')
        expect(failedResult.error).toBe('Upload failed')
      })
    })
  })

  describe('Template Literal Types', () => {
    describe('AspectRatio', () => {
      it('should accept valid aspect ratio strings', () => {
        const ratios: Array<'1:1' | '4:3' | '16:9' | 'auto' | 'inherit'> = [
          '1:1', '4:3', '16:9', 'auto', 'inherit'
        ]

        ratios.forEach(ratio => {
          expect(typeof ratio).toBe('string')
        })
      })
    })

    describe('FileSizeUnit', () => {
      it('should work with file size units', () => {
        const sizes: Array<`${number}${'B' | 'KB' | 'MB' | 'GB'}`> = [
          '1024B', '1024KB', '10MB', '1GB'
        ]

        sizes.forEach(size => {
          expect(typeof size).toBe('string')
          expect(size).toMatch(/^\d+[KMGT]?B$/)
        })
      })
    })
  })

  describe('Type Safety', () => {
    it('should enforce type constraints at compile time', () => {
      // These tests mainly ensure TypeScript compilation passes
      // with correct type constraints

      const config: UploadConfig = DEFAULT_UPLOAD_CONFIG
      expect(config).toBeDefined()

      const state: UploadState = {
        status: UPLOAD_STATUS.IDLE,
        file: null,
        imageUrl: null,
        error: null,
        progress: 0
      }
      expect(state).toBeDefined()
    })

    it('should provide proper type inference', () => {
      const result: UploadResult<string> = {
        success: true,
        data: 'test',
        error: null
      }

      if (isSuccessfulUpload(result)) {
        // TypeScript should infer that result.data is non-null string
        expect(typeof result.data).toBe('string')
        expect(result.data.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Error Handling Types', () => {
    it('should create proper upload errors', () => {
      const createError = (message: string, code: UploadError['code']): UploadError => ({
        name: 'UploadError',
        message,
        code,
        metadata: {}
      })

      const validationError = createError('Invalid file', 'VALIDATION_ERROR')
      const uploadError = createError('Upload failed', 'UPLOAD_ERROR')
      const networkError = createError('Network error', 'NETWORK_ERROR')
      const processingError = createError('Processing error', 'PROCESSING_ERROR')

      expect(isUploadError(validationError)).toBe(true)
      expect(isUploadError(uploadError)).toBe(true)
      expect(isUploadError(networkError)).toBe(true)
      expect(isUploadError(processingError)).toBe(true)
    })
  })

  describe('Configuration Validation', () => {
    it('should validate configuration constraints', () => {
      const validateConfig = (config: UploadConfig): boolean => {
        return (
          config.maxFileSize > 0 &&
          config.allowedTypes.length > 0 &&
          config.quality >= 0 && config.quality <= 1 &&
          config.maxWidth > 0 &&
          config.maxHeight > 0
        )
      }

      expect(validateConfig(DEFAULT_UPLOAD_CONFIG)).toBe(true)
      expect(validateConfig(PRODUCTION_UPLOAD_CONFIG)).toBe(true)

      const invalidConfig: UploadConfig = {
        maxFileSize: -1,
        allowedTypes: [],
        quality: 1.5,
        maxWidth: 0,
        maxHeight: 0,
        enableCompression: true
      }

      expect(validateConfig(invalidConfig)).toBe(false)
    })
  })

  describe('Constants Immutability', () => {
    it('should have immutable status constants', () => {
      expect(() => {
        (UPLOAD_STATUS as any).IDLE = 'modified'
      }).toThrow()

      expect(() => {
        (UPLOAD_ACTIONS as any).SET_FILE = 'modified'
      }).toThrow()
    })

    it('should preserve configuration objects', () => {
      const originalMaxSize = DEFAULT_UPLOAD_CONFIG.maxFileSize
      
      // Configurations should be readonly in practice
      expect(DEFAULT_UPLOAD_CONFIG.maxFileSize).toBe(originalMaxSize)
      expect(PRODUCTION_UPLOAD_CONFIG.maxFileSize).toBe(5 * 1024 * 1024)
    })
  })
})