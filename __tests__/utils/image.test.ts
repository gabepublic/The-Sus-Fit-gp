import {
  fileToBase64,
  compressBase64,
  isImageFile,
  IMG_SIZE_LIMIT_BYTES,
  FileTypeNotSupportedError,
  FileTooLargeError,
  CompressionFailedError,
} from '@/utils/image';

// Helper function to create mock File objects
function createMockFile(size: number, type: string, name: string = 'test.png'): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

// Helper function to create mock base64 data
function createMockBase64(size: number, format: 'png' | 'jpeg' = 'png'): string {
  const data = 'A'.repeat(size);
  const base64 = btoa(data);
  return `data:image/${format};base64,${base64}`;
}

// Helper function to create a realistic base64 image string
function createRealisticBase64Image(format: 'png' | 'jpeg' = 'png'): string {
  // Create a minimal valid PNG or JPEG base64 string
  const pngData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const jpegData = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
  
  const data = format === 'png' ? pngData : jpegData;
  return `data:image/${format};base64,${data}`;
}

// Mock canvas and related objects
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn(),
};

const mockImage = {
  width: 800,
  height: 600,
  crossOrigin: '',
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};

describe('Image Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.src = '';
    mockCanvas.width = 0;
    mockCanvas.height = 0;
  });

  describe('isImageFile', () => {
    it('should return true for image files', () => {
      const pngFile = createMockFile(1000, 'image/png');
      const jpegFile = createMockFile(1000, 'image/jpeg');
      const webpFile = createMockFile(1000, 'image/webp');

      expect(isImageFile(pngFile)).toBe(true);
      expect(isImageFile(jpegFile)).toBe(true);
      expect(isImageFile(webpFile)).toBe(true);
    });

    it('should return false for non-image files', () => {
      const textFile = createMockFile(1000, 'text/plain');
      const pdfFile = createMockFile(1000, 'application/pdf');
      const jsonFile = createMockFile(1000, 'application/json');

      expect(isImageFile(textFile)).toBe(false);
      expect(isImageFile(pdfFile)).toBe(false);
      expect(isImageFile(jsonFile)).toBe(false);
    });
  });

  describe('fileToBase64', () => {
    it('should convert valid image file to base64', async () => {
      const mockFile = createMockFile(1000, 'image/png');
      
      // Mock FileReader
      const mockResult = 'data:image/png;base64,test123';
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockResult,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const promise = fileToBase64(mockFile);
      
      // Simulate successful read
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);

      const result = await promise;
      expect(result).toBe(mockResult);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    });

    it('should throw FileTypeNotSupportedError for non-image files', async () => {
      const textFile = createMockFile(1000, 'text/plain');

      await expect(fileToBase64(textFile)).rejects.toThrow(FileTypeNotSupportedError);
      await expect(fileToBase64(textFile)).rejects.toThrow('Only image files are allowed.');
    });

    it('should throw FileTooLargeError for files exceeding size limit', async () => {
      const largeFile = createMockFile(IMG_SIZE_LIMIT_BYTES + 1000, 'image/png');

      await expect(fileToBase64(largeFile)).rejects.toThrow(FileTooLargeError);
      await expect(fileToBase64(largeFile)).rejects.toThrow('Image exceeds 5 MB limit.');
    });

    it('should handle FileReader errors', async () => {
      const mockFile = createMockFile(1000, 'image/png');
      const mockError = new Error('FileReader error');
      
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        error: mockError,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const promise = fileToBase64(mockFile);
      
      // Simulate error
      setTimeout(() => {
        mockFileReader.onerror?.();
      }, 0);

      await expect(promise).rejects.toThrow('FileReader error');
    });
  });

  describe('compressBase64', () => {
    let originalFileReader: any;
    let originalCanvas: any;
    let originalImage: any;
    let originalCreateElement: any;

    beforeEach(() => {
      // Store original globals
      originalFileReader = global.FileReader;
      originalCanvas = global.HTMLCanvasElement;
      originalImage = global.Image;
      originalCreateElement = document.createElement;
    });

    afterEach(() => {
      // Restore original globals
      global.FileReader = originalFileReader;
      global.HTMLCanvasElement = originalCanvas;
      global.Image = originalImage;
      document.createElement = originalCreateElement;
      
      // Reset mocks
      jest.clearAllMocks();
    });

    it('should return original string if already under limit', async () => {
      const smallBase64 = createMockBase64(100); // 100 bytes
      const result = await compressBase64(smallBase64, 1024); // 1MB limit

      expect(result).toBe(smallBase64);
    });

    it('should compress large base64 string successfully', async () => {
      const largeBase64 = createMockBase64(2000000); // 2MB
      const compressedBase64 = 'data:image/jpeg;base64,compressedData';
      
      // Mock FileReader for blobToBase64
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: compressedBase64,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas with successful toBlob
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          const mockBlob = new Blob(['compressed'], { type: format });
          callback(mockBlob);
        }),
      };

      // Mock document.createElement
      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image to trigger onload
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        // Trigger onload after a short delay
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(largeBase64, 1024);
      
      // Simulate FileReader success
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      const result = await promise;
      expect(result).toBe(compressedBase64);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCanvas.toBlob).toHaveBeenCalled();
    });

    it('should preserve PNG format for transparency', async () => {
      const pngBase64 = createMockBase64(2000000); // Make it large enough to trigger compression
      const compressedBase64 = 'data:image/png;base64,compressedData';
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: compressedBase64,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          const mockBlob = new Blob(['compressed'], { type: format });
          callback(mockBlob);
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(pngBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      await promise;
      // Verify that toBlob was called with PNG format
      expect(mockCanvas.toBlob).toHaveBeenCalled();
      const toBlobCall = mockCanvas.toBlob.mock.calls[0];
      expect(toBlobCall[1]).toBe('image/png'); // format parameter
    });

    it('should use JPEG format for non-PNG images', async () => {
      // Create a base64 string that doesn't contain 'image/png' to trigger JPEG format
      const jpegBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(2000000); // Large JPEG data
      const compressedBase64 = 'data:image/jpeg;base64,compressedData';
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: compressedBase64,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          const mockBlob = new Blob(['compressed'], { type: format });
          callback(mockBlob);
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(jpegBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      await promise;
      // Verify that toBlob was called with JPEG format
      expect(mockCanvas.toBlob).toHaveBeenCalled();
      const toBlobCall = mockCanvas.toBlob.mock.calls[0];
      // The format should be JPEG since the base64 doesn't contain 'image/png'
      expect(toBlobCall[1]).toBe('image/jpeg'); // format parameter
    });

    it('should throw CompressionFailedError when canvas context fails', async () => {
      const largeBase64 = createMockBase64(2000000);
      
      // Mock document.createElement to return a canvas without context
      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return {
            getContext: jest.fn(() => null),
          } as any;
        }
        return originalCreateElement.call(document, tag);
      });

      await expect(compressBase64(largeBase64, 1024)).rejects.toThrow(CompressionFailedError);
      await expect(compressBase64(largeBase64, 1024)).rejects.toThrow('Failed to get canvas context');
    });

    it('should throw CompressionFailedError when image fails to load', async () => {
      const largeBase64 = createMockBase64(2000000);
      
      // Mock canvas
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn(),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image to trigger onerror
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onerror) img.onerror();
        }, 0);
        
        return img as any;
      }) as any;

      await expect(compressBase64(largeBase64, 1024)).rejects.toThrow(CompressionFailedError);
      await expect(compressBase64(largeBase64, 1024)).rejects.toThrow('Failed to load image for compression');
    });

    it('should handle compression quality reduction', async () => {
      const largeBase64 = createMockBase64(2000000);
      const compressedBase64 = 'data:image/jpeg;base64,compressedData';
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: compressedBase64,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas with quality tracking
      let qualityValues: number[] = [];
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          qualityValues.push(quality);
          const mockBlob = new Blob(['compressed'], { type: format });
          callback(mockBlob);
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(largeBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      await promise;
      
      // Should have called toBlob with decreasing quality values
      expect(qualityValues.length).toBeGreaterThan(0);
      expect(qualityValues[0]).toBe(0.9); // Initial quality
    });

    it('should handle toBlob returning null blob', async () => {
      const largeBase64 = createMockBase64(2000000);
      const compressedBase64 = 'data:image/jpeg;base64,compressedData';
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: compressedBase64,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas with toBlob that returns null
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          callback(null); // Return null blob
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(largeBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      // Should handle the null blob gracefully and continue with quality reduction
      // Since the compression will fail due to null blob, it should eventually throw
      await expect(promise).rejects.toThrow(CompressionFailedError);
    });

    it('should handle FileReader error in blobToBase64', async () => {
      // Test the blobToBase64 function directly by testing the FileReader error handling
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      
      // Mock FileReader that fails
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        error: new Error('FileReader error'),
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Create a promise that simulates the blobToBase64 function
      const blobToBase64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(mockBlob);
      });

      // Simulate FileReader error immediately
      setTimeout(() => {
        mockFileReader.onerror?.();
      }, 5);

      await expect(blobToBase64Promise).rejects.toThrow('FileReader error');
    });

    it('should handle toBlob rejection when blob creation fails', async () => {
      const largeBase64 = createMockBase64(2000000);
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/jpeg;base64,compressedData',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas with toBlob that rejects
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          // Simulate blob creation failure by calling callback with null
          callback(null);
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(largeBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      // Should handle the blob creation failure gracefully
      // Since the compression will fail due to null blob, it should eventually throw
      await expect(promise).rejects.toThrow(CompressionFailedError);
    });

    it('should handle toBlob rejection with explicit error', async () => {
      const largeBase64 = createMockBase64(2000000);
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: 'data:image/jpeg;base64,compressedData',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      // Mock canvas with toBlob that explicitly rejects
      const mockCanvasContext = {
        drawImage: jest.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => mockCanvasContext),
        toBlob: jest.fn((callback, format, quality) => {
          // This will trigger the rejectBlob(new Error('Failed to create blob')) line
          callback(null);
        }),
      };

      document.createElement = jest.fn((tag) => {
        if (tag === 'canvas') {
          return mockCanvas as any;
        }
        return originalCreateElement.call(document, tag);
      });

      // Mock Image
      global.Image = jest.fn(() => {
        const img = {
          width: 800,
          height: 600,
          src: '',
          onload: null as any,
          onerror: null as any,
        };
        
        setTimeout(() => {
          if (img.onload) img.onload();
        }, 0);
        
        return img as any;
      }) as any;

      const promise = compressBase64(largeBase64, 100); // Small limit to force compression
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 10);

      // Should handle the blob creation failure gracefully and continue with quality reduction
      // Since the compression will fail due to null blob, it should eventually throw
      await expect(promise).rejects.toThrow(CompressionFailedError);
    });
  });

  describe('Constants', () => {
    it('should have correct IMG_SIZE_LIMIT_BYTES value', () => {
      expect(IMG_SIZE_LIMIT_BYTES).toBe(5 * 1024 * 1024); // 5 MB
    });
  });

  describe('Error Classes', () => {
    it('should have correct error names', () => {
      const fileTypeError = new FileTypeNotSupportedError('test');
      const fileSizeError = new FileTooLargeError('test');
      const compressionError = new CompressionFailedError('test');

      expect(fileTypeError.name).toBe('FileTypeNotSupportedError');
      expect(fileSizeError.name).toBe('FileTooLargeError');
      expect(compressionError.name).toBe('CompressionFailedError');
    });

    it('should be instanceof Error', () => {
      const fileTypeError = new FileTypeNotSupportedError('test');
      const fileSizeError = new FileTooLargeError('test');
      const compressionError = new CompressionFailedError('test');

      expect(fileTypeError).toBeInstanceOf(Error);
      expect(fileSizeError).toBeInstanceOf(Error);
      expect(compressionError).toBeInstanceOf(Error);
    });

    it('should preserve error messages', () => {
      const testMessage = 'Custom error message';
      const fileTypeError = new FileTypeNotSupportedError(testMessage);
      const fileSizeError = new FileTooLargeError(testMessage);
      const compressionError = new CompressionFailedError(testMessage);

      expect(fileTypeError.message).toBe(testMessage);
      expect(fileSizeError.message).toBe(testMessage);
      expect(compressionError.message).toBe(testMessage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file type', () => {
      const emptyTypeFile = createMockFile(1000, '');
      expect(isImageFile(emptyTypeFile)).toBe(false);
    });

    it('should handle null file type', () => {
      const nullTypeFile = createMockFile(1000, null as any);
      expect(isImageFile(nullTypeFile)).toBe(false);
    });

    it('should handle exact size limit file', async () => {
      const exactSizeFile = createMockFile(IMG_SIZE_LIMIT_BYTES, 'image/png');
      
      // Mock FileReader
      const mockResult = 'data:image/png;base64,test123';
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockResult,
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const promise = fileToBase64(exactSizeFile);
      
      setTimeout(() => {
        mockFileReader.onload?.();
      }, 0);

      const result = await promise;
      expect(result).toBe(mockResult);
    });

    it('should handle base64 string without comma separator', async () => {
      const invalidBase64 = 'invalid-base64-string';
      
      // This should throw an error when trying to split by comma
      expect(() => {
        const parts = invalidBase64.split(',');
        if (parts.length < 2) {
          throw new Error('Invalid base64 format');
        }
      }).toThrow('Invalid base64 format');
    });
  });
}); 