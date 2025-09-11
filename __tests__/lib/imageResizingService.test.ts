import { logResizeResult, ResizeResult } from '../../src/lib/imageResizingService';

// Mock console.log and console.error to capture output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('logResizeResult', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should log successful resize result with detailed information', () => {
    const successResult: ResizeResult = {
      success: true,
      resizedB64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      metadata: {
        original: {
          name: 'test.jpg',
          size: 1024000, // 1MB
          type: 'image/jpeg',
          width: 1920,
          height: 1080,
          format: 'jpeg',
          hasAlpha: false,
          channels: 3,
          space: 'srgb'
        },
        resized: {
          name: 'test_resized.png',
          size: 512000, // 512KB
          type: 'image/png',
          width: 800,
          height: 600,
          format: 'png',
          hasAlpha: true,
          channels: 4,
          space: 'srgb'
        }
      },
      resizeInfo: {
        options: {
          width: 800,
          height: 600,
          fit: 'cover',
          format: 'png',
          quality: 85,
          compressionLevel: 9,
          withoutEnlargement: true
        },
        compressionRatio: 50.0
      }
    };

    logResizeResult(successResult, 'testContext');


    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] ✅ Resize completed successfully');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📊 Original: 1920x1080 (1000 KB)');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📊 Resized:  800x600 (500 KB)');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📈 Compression: 50% reduction');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 🎯 Options:', {
      width: 800,
      height: 600,
      fit: 'cover',
      format: 'png',
      quality: 85,
      compressionLevel: 9,
      withoutEnlargement: true
    });
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📝 Format: jpeg → png');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📝 Has Alpha: false → true');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📝 Channels: 3 → 4');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📝 Space: srgb → srgb');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 📦 Resized Base64 length: 118 characters');
    expect(mockConsoleLog).toHaveBeenCalledWith('[testContext] 🔍 Resized Base64: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEA...');
  });

  it('should log failed resize result with error information', () => {
    const errorResult: ResizeResult = {
      success: false,
      resizedB64: '',
      metadata: {
        original: {
          name: 'test.jpg',
          size: 1024000,
          type: 'image/jpeg',
          width: 1920,
          height: 1080,
          format: 'jpeg'
        },
        resized: {
          name: '',
          size: 0,
          type: 'image/jpeg',
          width: 0,
          height: 0,
          format: 'jpeg'
        }
      },
      resizeInfo: {
        options: {
          width: 800,
          height: 600,
          fit: 'cover',
          format: 'png',
          quality: 85
        },
        compressionRatio: 0
      },
      error: 'Image processing failed: Invalid format'
    };

    logResizeResult(errorResult);

    expect(mockConsoleError).toHaveBeenCalledWith('[ImageResize] ❌ Resize failed');
    expect(mockConsoleError).toHaveBeenCalledWith('[ImageResize] 🚨 Error: Image processing failed: Invalid format');
    expect(mockConsoleError).toHaveBeenCalledWith('[ImageResize] 📊 Original: 1920x1080 (1000 KB)');
    expect(mockConsoleError).toHaveBeenCalledWith('[ImageResize] 🎯 Attempted options:', {
      width: 800,
      height: 600,
      fit: 'cover',
      format: 'png',
      quality: 85
    });
  });

  it('should use default context when none provided', () => {
    const result: ResizeResult = {
      success: true,
      resizedB64: 'data:image/png;base64,test',
      metadata: {
        original: {
          name: 'test.jpg',
          size: 1000,
          type: 'image/jpeg',
          width: 100,
          height: 100,
          format: 'jpeg'
        },
        resized: {
          name: 'test.png',
          size: 500,
          type: 'image/png',
          width: 50,
          height: 50,
          format: 'png'
        }
      },
      resizeInfo: {
        options: { width: 50, height: 50 },
        compressionRatio: 50
      }
    };

    logResizeResult(result);

    expect(mockConsoleLog).toHaveBeenCalledWith('[ImageResize] ✅ Resize completed successfully');
  });

  it('should handle file size formatting correctly', () => {
    const result: ResizeResult = {
      success: true,
      resizedB64: 'data:image/png;base64,test',
      metadata: {
        original: {
          name: 'test.jpg',
          size: 0, // 0 bytes
          type: 'image/jpeg',
          width: 100,
          height: 100,
          format: 'jpeg'
        },
        resized: {
          name: 'test.png',
          size: 1073741824, // 1GB
          type: 'image/png',
          width: 50,
          height: 50,
          format: 'png'
        }
      },
      resizeInfo: {
        options: { width: 50, height: 50 },
        compressionRatio: 0
      }
    };

    logResizeResult(result);

    expect(mockConsoleLog).toHaveBeenCalledWith('[ImageResize] 📊 Original: 100x100 (0 B)');
    expect(mockConsoleLog).toHaveBeenCalledWith('[ImageResize] 📊 Resized:  50x50 (1 GB)');
  });
});
