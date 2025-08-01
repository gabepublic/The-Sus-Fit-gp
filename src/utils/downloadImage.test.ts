import { downloadImage } from './downloadImage';

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockWindowOpen = jest.fn();
const mockConsoleWarn = jest.fn();

describe('downloadImage', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock document.createElement
    global.document.createElement = mockCreateElement;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;
    
    // Mock URL APIs
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Mock window.open
    global.window.open = mockWindowOpen;
    
    // Mock console.warn
    global.console.warn = mockConsoleWarn;
    
    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should download image from string URL', () => {
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);

    const testUrl = 'data:image/jpeg;base64,test';
    const filename = 'test-image.jpg';

    downloadImage(testUrl, filename);

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe(testUrl);
    expect(mockLink.download).toBe(filename);
    expect(mockLink.style.display).toBe('none');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
  });

  it('should download image from Blob', () => {
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('blob:test-url');

    const testBlob = new Blob(['test'], { type: 'image/jpeg' });
    const filename = 'test-blob.jpg';

    downloadImage(testBlob, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(testBlob);
    expect(mockLink.href).toBe('blob:test-url');
    expect(mockLink.download).toBe(filename);
    expect(mockLink.style.display).toBe('none');
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
  });

  it('should revoke object URL after delay when using Blob', () => {
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
    mockCreateObjectURL.mockReturnValue('blob:test-url');

    const testBlob = new Blob(['test'], { type: 'image/jpeg' });
    const filename = 'test-blob.jpg';

    downloadImage(testBlob, filename);

    // Initially, revokeObjectURL should not be called
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    // After advancing timers by 1000ms, revokeObjectURL should be called
    jest.advanceTimersByTime(1000);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('should not revoke object URL for string URLs', () => {
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);

    const testUrl = 'data:image/jpeg;base64,test';
    const filename = 'test-image.jpg';

    downloadImage(testUrl, filename);

    // Initially, revokeObjectURL should not be called
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();

    // After advancing timers by 1000ms, revokeObjectURL should still not be called for string URLs
    jest.advanceTimersByTime(1000);
    expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  });

  it('should handle different file extensions', () => {
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);

    const testUrl = 'data:image/png;base64,test';
    const filename = 'test-image.png';

    downloadImage(testUrl, filename);

    expect(mockLink.download).toBe('test-image.png');
  });

  describe('iOS Safari fallback', () => {
    const originalUserAgent = navigator.userAgent;

    beforeEach(() => {
      // Mock iOS Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true
      });
    });

    afterEach(() => {
      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });

    it('should use window.open for iOS Safari with string URL', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image.jpg';

      downloadImage(testUrl, filename);

      // Should call window.open instead of creating link
      expect(mockWindowOpen).toHaveBeenCalledWith(testUrl, '_blank');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should use window.open for iOS Safari with Blob', () => {
      const testBlob = new Blob(['test'], { type: 'image/jpeg' });
      const filename = 'test-image.jpg';
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      downloadImage(testBlob, filename);

      // Should call window.open with blob URL
      expect(mockWindowOpen).toHaveBeenCalledWith('blob:test-url', '_blank');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should handle window.open being blocked on iOS Safari', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image.jpg';
      
      // Mock window.open to throw an error (blocked by browser)
      mockWindowOpen.mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      downloadImage(testUrl, filename);

      // Should log warning message
      expect(mockConsoleWarn).toHaveBeenCalledWith('Download blocked by browser. Press and hold image to save.');
    });

    it('should not revoke object URL for string URLs on iOS Safari', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image.jpg';

      downloadImage(testUrl, filename);

      // Initially, revokeObjectURL should not be called
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();

      // After advancing timers by 1000ms, revokeObjectURL should still not be called for string URLs
      jest.advanceTimersByTime(1000);
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('Non-iOS Safari behavior', () => {
    const originalUserAgent = navigator.userAgent;

    beforeEach(() => {
      // Mock non-iOS Safari user agent (Chrome)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });
    });

    afterEach(() => {
      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });

    it('should use standard download link for non-iOS Safari', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image.jpg';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadImage(testUrl, filename);

      // Should use standard download approach
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filename', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = '';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadImage(testUrl, filename);

      expect(mockLink.download).toBe('');
    });

    it('should handle special characters in filename', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image (1).jpg';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadImage(testUrl, filename);

      expect(mockLink.download).toBe('test-image (1).jpg');
    });

    it('should handle very long filenames', () => {
      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'a'.repeat(255) + '.jpg';
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadImage(testUrl, filename);

      expect(mockLink.download).toBe(filename);
    });

    it('should handle Blob with different MIME types', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      const testBlob = new Blob(['test'], { type: 'image/png' });
      const filename = 'test-blob.png';

      downloadImage(testBlob, filename);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(testBlob);
      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toBe(filename);
    });

    it('should handle data URLs with different formats', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      const testUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const filename = 'test-image.gif';

      downloadImage(testUrl, filename);

      expect(mockLink.href).toBe(testUrl);
      expect(mockLink.download).toBe(filename);
    });

    it('should handle relative URLs', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      const testUrl = '/images/test.jpg';
      const filename = 'test-image.jpg';

      downloadImage(testUrl, filename);

      expect(mockLink.href).toBe(testUrl);
      expect(mockLink.download).toBe(filename);
    });

    it('should handle absolute URLs', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      const testUrl = 'https://example.com/images/test.jpg';
      const filename = 'test-image.jpg';

      downloadImage(testUrl, filename);

      expect(mockLink.href).toBe(testUrl);
      expect(mockLink.download).toBe(filename);
    });
  });

  describe('Memory Management', () => {
    it('should revoke object URL even if link creation fails', () => {
      mockCreateElement.mockImplementation(() => {
        throw new Error('Failed to create element');
      });
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      const testBlob = new Blob(['test'], { type: 'image/jpeg' });
      const filename = 'test-blob.jpg';

      expect(() => downloadImage(testBlob, filename)).toThrow('Failed to create element');

      // Should still revoke the object URL (only for Blob inputs)
      jest.advanceTimersByTime(1000);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should revoke object URL even if link click fails', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: () => {
          throw new Error('Click failed');
        },
      };
      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      const testBlob = new Blob(['test'], { type: 'image/jpeg' });
      const filename = 'test-blob.jpg';

      expect(() => downloadImage(testBlob, filename)).toThrow('Click failed');

      // Should still revoke the object URL (only for Blob inputs)
      jest.advanceTimersByTime(1000);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should handle multiple rapid downloads', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      const testBlob = new Blob(['test'], { type: 'image/jpeg' });
      const filename = 'test-blob.jpg';

      // Download multiple times rapidly
      downloadImage(testBlob, filename);
      downloadImage(testBlob, filename);
      downloadImage(testBlob, filename);

      // Should create object URL for each download
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(3);

      // Should revoke all object URLs after delay
      jest.advanceTimersByTime(1000);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(3);
    });

    it('should not revoke object URL for string URLs', () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);

      const testUrl = 'data:image/jpeg;base64,test';
      const filename = 'test-image.jpg';

      downloadImage(testUrl, filename);

      // Should not call createObjectURL or revokeObjectURL for string URLs
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1000);
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });
  });
}); 