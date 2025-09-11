import { imageProcessingService } from '@/lib/imageProcessingService';

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    metadata: jest.fn(),
    ensureAlpha: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toColorspace: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(),
  }));
  
  return mockSharp;
});

describe('ImageProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('4-channel conversion', () => {
    it('should convert 3-channel image to 4-channel when ensureFourChannel is true', async () => {
      const mockImageB64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
      
      // Mock sharp instance
      const mockSharpInstance = {
        metadata: jest.fn(),
        ensureAlpha: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toColorspace: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      // Mock sharp constructor
      const sharp = require('sharp');
      sharp.mockReturnValue(mockSharpInstance);

      // Mock original metadata (3-channel JPEG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'jpeg',
        hasAlpha: false,
        channels: 3,
        space: 'srgb',
      });

      // Mock processed metadata (4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed buffer
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('processed-image-data'));

      const result = await imageProcessingService.processImage(mockImageB64, {
        ensureFourChannel: true,
        format: 'jpeg', // This should be changed to PNG
      });

      expect(result.success).toBe(true);
      expect(result.metadata.channels).toBe(4);
      expect(result.metadata.hasAlpha).toBe(true);
      expect(result.metadata.format).toBe('png'); // Should be changed from jpeg to png
      
      // Verify ensureAlpha was called
      expect(mockSharpInstance.ensureAlpha).toHaveBeenCalled();
      
      // Verify png method was called (since format was changed to PNG)
      expect(mockSharpInstance.png).toHaveBeenCalledWith({
        force: true,
        palette: false,
      });
    });

    it('should not convert when image already has 4 channels', async () => {
      const mockImageB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // Mock sharp instance
      const mockSharpInstance = {
        metadata: jest.fn(),
        ensureAlpha: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toColorspace: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      // Mock sharp constructor
      const sharp = require('sharp');
      sharp.mockReturnValue(mockSharpInstance);

      // Mock original metadata (4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed metadata (same 4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed buffer
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('processed-image-data'));

      const result = await imageProcessingService.processImage(mockImageB64, {
        ensureFourChannel: true,
        format: 'png',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.channels).toBe(4);
      expect(result.metadata.hasAlpha).toBe(true);
      expect(result.metadata.format).toBe('png');
      
      // Verify ensureAlpha was NOT called since image already has 4 channels
      expect(mockSharpInstance.ensureAlpha).not.toHaveBeenCalled();
    });

    it('should force conversion to 4-channel when forceFourChannel is true', async () => {
      const mockImageB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // Mock sharp instance
      const mockSharpInstance = {
        metadata: jest.fn(),
        ensureAlpha: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toColorspace: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      // Mock sharp constructor
      const sharp = require('sharp');
      sharp.mockReturnValue(mockSharpInstance);

      // Mock original metadata (4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed metadata (4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed buffer
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('processed-image-data'));

      const result = await imageProcessingService.processImage(mockImageB64, {
        forceFourChannel: true,
        format: 'png',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.channels).toBe(4);
      expect(result.metadata.hasAlpha).toBe(true);
      
      // Verify ensureAlpha was called even though image already has 4 channels
      expect(mockSharpInstance.ensureAlpha).toHaveBeenCalled();
    });

    it('should change format to PNG when requested format does not support alpha', async () => {
      const mockImageB64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
      
      // Mock sharp instance
      const mockSharpInstance = {
        metadata: jest.fn(),
        ensureAlpha: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toFormat: jest.fn().mockReturnThis(),
        toColorspace: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        toBuffer: jest.fn(),
      };

      // Mock sharp constructor
      const sharp = require('sharp');
      sharp.mockReturnValue(mockSharpInstance);

      // Mock original metadata (3-channel JPEG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'jpeg',
        hasAlpha: false,
        channels: 3,
        space: 'srgb',
      });

      // Mock processed metadata (4-channel PNG)
      mockSharpInstance.metadata.mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: 'png',
        hasAlpha: true,
        channels: 4,
        space: 'srgb',
      });

      // Mock processed buffer
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('processed-image-data'));

      const result = await imageProcessingService.processImage(mockImageB64, {
        ensureFourChannel: true,
        format: 'jpeg', // JPEG doesn't support alpha
      });

      expect(result.success).toBe(true);
      expect(result.metadata.channels).toBe(4);
      expect(result.metadata.hasAlpha).toBe(true);
      expect(result.metadata.format).toBe('png'); // Should be changed to PNG
      
      // Verify ensureAlpha was called
      expect(mockSharpInstance.ensureAlpha).toHaveBeenCalled();
      
      // Verify png method was called (since format was changed to PNG)
      expect(mockSharpInstance.png).toHaveBeenCalledWith({
        force: true,
        palette: false,
      });
    });
  });
});
