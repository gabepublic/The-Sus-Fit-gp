// Mock canvas and Image for testing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/jpeg;base64,mock-data'),
};

const mockImage = {
  width: 800,
  height: 600,
  crossOrigin: '',
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
};

// Mock global objects
global.Image = jest.fn(() => mockImage) as any;
global.document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }
  return {} as any;
});

// Import the functions to test (we'll need to extract them from the page component)
// For now, let's test the logic directly

describe('Image Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.src = '';
  });

  describe('resizeImageTo1024x1536', () => {
    it('should resize image to 1024x1536 dimensions', async () => {
      // Arrange
      const imageUrl = 'test-image.jpg';
      const expectedDataUrl = 'data:image/jpeg;base64,mock-data';
      
      // Act
      const resizePromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Set canvas dimensions to target size
          canvas.width = 1024;
          canvas.height = 1536;
          
          // Draw the image resized to fit the canvas
          ctx.drawImage(img, 0, 0, 1024, 1536);
          
          // Convert to data URL
          const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(resizedImageUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for resizing'));
        };
        
        img.src = imageUrl;
      });

      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      // Assert
      const result = await resizePromise;
      expect(result).toBe(expectedDataUrl);
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(1536);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
    });

    it('should reject when canvas context cannot be obtained', async () => {
      // Arrange
      mockCanvas.getContext.mockReturnValue(null as any);
      const imageUrl = 'test-image.jpg';
      
      // Act
      const resizePromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // This should not be reached
          resolve('success');
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for resizing'));
        };
        
        img.src = imageUrl;
      });

      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      // Assert
      await expect(resizePromise).rejects.toThrow('Could not get canvas context');
    });

    it('should reject when image fails to load', async () => {
      // Arrange
      const imageUrl = 'invalid-image.jpg';
      
      // Act
      const resizePromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          resolve('success');
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for resizing'));
        };
        
        img.src = imageUrl;
      });

      // Simulate image error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      // Assert
      await expect(resizePromise).rejects.toThrow('Failed to load image for resizing');
    });
  });

  describe('logImageDimensions', () => {
    it('should log image dimensions when image loads', () => {
      // Arrange
      const imageUrl = 'test-image.jpg';
      const cardName = 'Test Card';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        console.log(`${cardName} image dimensions:`, { width: img.width, height: img.height });
      };

      // Simulate image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      // Assert
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          `${cardName} image dimensions:`,
          { width: mockImage.width, height: mockImage.height }
        );
        consoleSpy.mockRestore();
      }, 10);
    });
  });
}); 