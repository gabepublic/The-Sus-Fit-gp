/**
 * @fileoverview Tests for useFitUpload hook - 3:4 aspect ratio validation
 * @module @/hooks/__tests__/useFitUpload.test
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFitUpload } from '../../../src/mobile/hooks/useFitUpload';
import { IMAGE_ORIENTATION, PORTRAIT_REQUIREMENTS } from '../../../src/mobile/components/UploadFit/types/upload.types';

// Mock browser-image-compression
jest.mock('browser-image-compression', () => ({
  __esModule: true,
  default: jest.fn((file) => Promise.resolve(file))
}));

// Mock Image constructor for testing
let mockImageWidth = 0;
let mockImageHeight = 0;

global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  naturalWidth = 0;
  naturalHeight = 0;

  constructor() {}

  set src(value: string) {
    this._src = value;
    this.naturalWidth = mockImageWidth;
    this.naturalHeight = mockImageHeight;
    // Simulate async image load
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }

  get src() {
    return this._src;
  }
} as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Query client wrapper for tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFitUpload - Aspect Ratio Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = (name: string, type = 'image/jpeg', size = 1024 * 1024) => {
    // Create a mock file with the correct properties
    const content = new Array(size).fill(0);
    return new File([new Uint8Array(content)], name, { type, lastModified: Date.now() });
  };

  const mockImageLoad = (width: number, height: number) => {
    mockImageWidth = width;
    mockImageHeight = height;
  };

  describe('validateOrientation', () => {
    it('should accept perfect 3:4 aspect ratio', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(600, 800); // 3:4 ratio

      const file = createMockFile('test-perfect-fit.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(true);
      expect(validation.aspectRatio).toBeCloseTo(0.75, 2); // 600/800 = 0.75
      expect(validation.orientation).toBe(IMAGE_ORIENTATION.PORTRAIT);
      expect(validation.meetsOrientationRequirements).toBe(true);
      expect(validation.orientationFeedback.some(feedback => 
        feedback.includes('Perfect!'))).toBe(true);
    });

    it('should accept 3:4 ratio within 5% tolerance', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(580, 800); // 0.725 ratio - within tolerance of 0.75

      const file = createMockFile('test-tolerance-fit.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(true);
      expect(validation.aspectRatio).toBeCloseTo(0.725, 3);
      expect(validation.orientation).toBe(IMAGE_ORIENTATION.PORTRAIT);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject images that are too wide (landscape)', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(800, 600); // Landscape orientation

      const file = createMockFile('test-landscape.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.aspectRatio).toBeCloseTo(1.33, 2); // 800/600
      expect(validation.orientation).toBe(IMAGE_ORIENTATION.LANDSCAPE);
      expect(validation.errors.some(error => error.includes('portrait orientation'))).toBe(true);
      expect(validation.orientationFeedback.some(feedback => 
        feedback.includes('rotate'))).toBe(true);
    });

    it('should reject images that are too narrow', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(300, 1000); // Too narrow - 0.3 aspect ratio

      const file = createMockFile('test-too-narrow.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.aspectRatio).toBe(0.3);
      expect(validation.errors.some(error => 
        error.includes('too tall and narrow'))).toBe(true);
      expect(validation.orientationFeedback.some(feedback => 
        feedback.includes('cropping the top/bottom'))).toBe(true);
    });

    it('should reject images that are too wide', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(900, 800); // Too wide - 1.125 aspect ratio

      const file = createMockFile('test-too-wide.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.aspectRatio).toBe(1.125);
      expect(validation.errors.some(error => 
        error.includes('too wide'))).toBe(true);
      expect(validation.orientationFeedback.some(feedback => 
        feedback.includes('cropping the sides'))).toBe(true);
    });

    it('should reject images below minimum resolution', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(300, 400); // Below minimum 400x800

      const file = createMockFile('test-low-res.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('resolution too low'))).toBe(true);
      expect(validation.errors.some(error => 
        error.includes(`${PORTRAIT_REQUIREMENTS.MIN_WIDTH}x${PORTRAIT_REQUIREMENTS.MIN_HEIGHT}`))).toBe(true);
    });

    it('should handle square images correctly', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(800, 800); // Square 1:1

      const file = createMockFile('test-square.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.aspectRatio).toBe(1.0);
      expect(validation.orientation).toBe(IMAGE_ORIENTATION.SQUARE);
      expect(validation.errors.some(error => 
        error.includes('portrait orientation'))).toBe(true);
    });
  });

  describe('validateFileWithOrientation', () => {
    it('should combine basic validation with orientation validation', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(600, 800); // Perfect 3:4

      const file = createMockFile('test-combined.jpg');
      const validation = await result.current.validateFileWithOrientation(file);

      expect(validation.isValid).toBe(true);
      expect(validation.aspectRatio).toBeCloseTo(0.75, 2);
      expect(validation.orientation).toBe(IMAGE_ORIENTATION.PORTRAIT);
    });

    it('should fail basic validation for oversized files', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(600, 800); // Perfect aspect ratio

      const oversizedFile = createMockFile('test-oversized.jpg', 'image/jpeg', 20 * 1024 * 1024); // 20MB (over 15MB limit)
      const validation = await result.current.validateFileWithOrientation(oversizedFile);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('exceeds maximum'))).toBe(true);
    });

    it('should fail basic validation for unsupported file types', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      
      const unsupportedFile = createMockFile('test-unsupported.gif', 'image/gif');
      const validation = await result.current.validateFileWithOrientation(unsupportedFile);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('not supported'))).toBe(true);
    });

    it('should include warnings for large files that will be compressed', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      mockImageLoad(600, 800); // Perfect aspect ratio

      const largeFile = createMockFile('test-large.jpg', 'image/jpeg', 3 * 1024 * 1024); // 3MB (over 2MB warning threshold)
      const validation = await result.current.validateFileWithOrientation(largeFile);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(warning => 
        warning.includes('compressed'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle image load errors gracefully', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      
      // Mock Image to simulate load error
      const OriginalImage = global.Image;
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: ((error: any) => void) | null = null;
        private _src = '';

        constructor() {}

        set src(value: string) {
          this._src = value;
          // Simulate error
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Failed to load'));
            }
          }, 10);
        }

        get src() {
          return this._src;
        }
      } as any;

      const file = createMockFile('test-error.jpg');
      const validation = await result.current.validateOrientation(file);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('validation failed') || error.includes('Failed to load'))).toBe(true);

      // Restore original Image
      global.Image = OriginalImage;
    });

    it('should handle timeout for image loading', async () => {
      const { result } = renderHook(() => useFitUpload(), { wrapper: createWrapper() });
      
      // Mock Image that never calls onload/onerror - will timeout
      const OriginalImage = global.Image;
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        private _src = '';

        constructor() {}

        set src(value: string) {
          this._src = value;
          // Never calls onload or onerror - will timeout
        }

        get src() {
          return this._src;
        }
      } as any;

      const file = createMockFile('test-timeout.jpg');
      const validationPromise = result.current.validateOrientation(file);

      // Wait for timeout result
      const validationResult = await validationPromise;
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.some(error => 
        error.includes('validation failed') || error.includes('timed out'))).toBe(true);

      // Restore original Image
      global.Image = OriginalImage;
    }, 15000);
  });
});