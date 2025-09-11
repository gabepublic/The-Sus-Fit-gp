import { imageProcessingService, ImageProcessingOptions } from './imageProcessingService';  

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'tiff';
  quality?: number;
  compressionLevel?: number;   // 1-9, higher = better comppression for png only
  withoutEnlargement?: boolean;
}

export interface ImageMetadata {
  name?: string;
  size: number;
  type: string;     // e.g., "image/jpeg", "image/png", "image/webp", "image/tiff"
  width: number;
  height: number;
  format: string;   // e.g., "jpeg", "png", "webp", "tiff"
  hasAlpha?: boolean;
  channels?: number;
  space?: string;
}

export interface ImagesMetadata {
  original: ImageMetadata;
  resized: ImageMetadata;
}

export interface ResizeResult {
  success: boolean;
  resizedB64: string;
  metadata: {
    original: ImageMetadata;
    resized: ImageMetadata;
  };
  resizeInfo: {
    options: ResizeOptions;
    compressionRatio: number;
  };
  error?: string;
}

const initialImageMetadata: ImageMetadata = {
  name: '',
  size: 0,
  type: 'image/png',
  width: 0,
  height: 0,
  format: 'png',
};

export class ImageResizingService {
  /**
   * Log detailed information about a resize result
   */
  static logResizeResult(result: ResizeResult, context?: string): void {
    const prefix = context ? `[${context}] ` : '[ImageResize] ';
    
    if (result.success) {
      console.log(`${prefix}✅ Resize completed successfully`);
      console.log(`${prefix}📊 Original: ${result.metadata.original.width}x${result.metadata.original.height} (${ImageResizingService.formatFileSize(result.metadata.original.size)})`);
      console.log(`${prefix}📊 Resized:  ${result.metadata.resized.width}x${result.metadata.resized.height} (${ImageResizingService.formatFileSize(result.metadata.resized.size)})`);
      console.log(`${prefix}📈 Compression: ${result.resizeInfo.compressionRatio}% reduction`);
      console.log(`${prefix}🎯 Options:`, {
        width: result.resizeInfo.options.width,
        height: result.resizeInfo.options.height,
        fit: result.resizeInfo.options.fit,
        format: result.resizeInfo.options.format,
        quality: result.resizeInfo.options.quality,
        compressionLevel: result.resizeInfo.options.compressionLevel,
        withoutEnlargement: result.resizeInfo.options.withoutEnlargement
      });
      console.log(`${prefix}📝 Format: ${result.metadata.original.format} → ${result.metadata.resized.format}`);
      console.log(`${prefix}📝 Has Alpha: ${result.metadata.original.hasAlpha} → ${result.metadata.resized.hasAlpha}`);
      console.log(`${prefix}📝 Channels: ${result.metadata.original.channels} → ${result.metadata.resized.channels}`);
      console.log(`${prefix}📝 Space: ${result.metadata.original.space} → ${result.metadata.resized.space}`);
      console.log(`${prefix}📦 Resized Base64 length: ${result.resizedB64.length} characters`);
      console.log(`${prefix}🔍 Resized Base64: ${result.resizedB64.substring(0, 50)}...`);
    } else {
      console.error(`${prefix}❌ Resize failed`);
      console.error(`${prefix}🚨 Error: ${result.error || 'Unknown error'}`);
      if (result.metadata.original.size > 0) {
        console.error(`${prefix}📊 Original: ${result.metadata.original.width}x${result.metadata.original.height} (${ImageResizingService.formatFileSize(result.metadata.original.size)})`);
      }
      console.error(`${prefix}🎯 Attempted options:`, result.resizeInfo.options);
    }
  }

  /**
   * Format file size in human-readable format
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Resize an image using custom options
   */
  async resizeImage(imageB64: string, options: ResizeOptions): Promise<ResizeResult> {
    try {
      // Get original image metadata from base64 data
      const originalMetadata = await imageProcessingService.getImageMetadata(imageB64);
      if (!originalMetadata.success || !originalMetadata.metadata) {
        const errorResult = {
          success: false,
          resizedB64: '',
          metadata: {
            original: initialImageMetadata,
            resized: initialImageMetadata,
          },
          resizeInfo: { options, compressionRatio: 0 },
          error: originalMetadata.error || 'Failed to get original image metadata',
        };
        ImageResizingService.logResizeResult(errorResult, 'resizeImage');
        return errorResult;
      }

      // Convert resize options to processing options
      // Default to PNG format when ensuring 4-channel to support alpha
      const defaultFormat = options.format || 'png';
      const processingOptions: ImageProcessingOptions = {
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        format: defaultFormat,
        quality: options.quality || 80,
        compressionLevel: options.compressionLevel || 9,
        ensureFourChannel: true,
        forceFourChannel: true,
      };

      // Process the image
      //const result = await imageProcessingService.processImage(imageB64, inputPath, processingOptions);
      const result = await imageProcessingService.processImage(imageB64, processingOptions);

      if (!result.success) {
        const errorResult = {
          success: false,
          resizedB64: '',
          metadata: {
            original: {
              name: '',
              size: originalMetadata.metadata.size,
              type: 'image/' + originalMetadata.metadata.format,
              width: originalMetadata.metadata.width,
              height: originalMetadata.metadata.height,
              format: originalMetadata.metadata.format,
              hasAlpha: originalMetadata.metadata.hasAlpha,
              channels: originalMetadata.metadata.channels,
              space: originalMetadata.metadata.space,
            },
            resized: {
              name: '',
              size: 0,
              type: 'image/' + originalMetadata.metadata.format,
              width: 0, 
              height: 0, 
              format: 'unknown'
            },
          },
          resizeInfo: { options, compressionRatio: 0 },
          error: result.error || 'Image processing failed',
        };
        ImageResizingService.logResizeResult(errorResult, 'resizeImage');
        return errorResult;
      }

      // Calculate compression ratio
      const compressionRatio = originalMetadata.metadata.size > 0 
        ? (1 - result.metadata.size / originalMetadata.metadata.size) * 100 
        : 0;

      const successResult = {
        success: true,
        resizedB64: result.processedB64,
        metadata: {
          original: {
            name: '',
            size: originalMetadata.metadata.size,
            type: `image/${originalMetadata.metadata.format}`,
            width: originalMetadata.metadata.width,
            height: originalMetadata.metadata.height,
            format: originalMetadata.metadata.format,
            hasAlpha: originalMetadata.metadata.hasAlpha,
            channels: originalMetadata.metadata.channels,
            space: originalMetadata.metadata.space,
          },
          resized: {
            name: '',
            size: result.metadata.size,
            type: `image/${result.metadata.format}`,
            width: result.metadata.width,
            height: result.metadata.height,
            format: result.metadata.format,
            hasAlpha: result.metadata.hasAlpha,
            channels: result.metadata.channels,
            space: result.metadata.space,
          },
        },
        resizeInfo: {
          options,
          compressionRatio: Math.round(compressionRatio * 100) / 100,
        },
      };
      ImageResizingService.logResizeResult(successResult, 'resizeImage');
      return successResult;
    } catch (error) {
      const errorResult = {
        success: false,
        resizedB64: '',
        metadata: {
          original: initialImageMetadata,
          resized: initialImageMetadata,
        },
        resizeInfo: { options, compressionRatio: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      ImageResizingService.logResizeResult(errorResult, 'resizeImage');
      return errorResult;
    }
  }


  /**
   * Resize image to fit within specified dimensions while maintaining aspect ratio
   */
  async resizeToFit(imageB64: string, inputPath: string, maxWidth: number, maxHeight: number, options: Partial<ResizeOptions> = {}): Promise<ResizeResult> {
    try {
      // Get original image metadata from base64 data
      const originalMetadata = await imageProcessingService.getImageMetadata(imageB64);
      if (!originalMetadata.success || !originalMetadata.metadata) {
        throw new Error('Failed to get original image metadata');
      }

      const { width: originalWidth, height: originalHeight } = originalMetadata.metadata;

      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      let newWidth = maxWidth;
      let newHeight = maxHeight;

      if (aspectRatio > 1) {
        // Landscape image
        newHeight = Math.round(maxWidth / aspectRatio);
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspectRatio);
        }
      } else {
        // Portrait or square image
        newWidth = Math.round(maxHeight * aspectRatio);
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspectRatio);
        }
      }

      const result = await this.resizeImage(imageB64, {
        width: newWidth,
        height: newHeight,
        fit: 'contain',
        quality: options.quality || 85,
        format: options.format || 'png', // Default to PNG for 4-channel support
        ...options,
      });
      ImageResizingService.logResizeResult(result, 'resizeToFit');
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        resizedB64: '',
        metadata: {
          original: initialImageMetadata,
          resized: initialImageMetadata,
        },
        resizeInfo: { options: {}, compressionRatio: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      ImageResizingService.logResizeResult(errorResult, 'resizeToFit');
      return errorResult;
    }
  }
}

// Export singleton instance
export const imageResizingService = new ImageResizingService();

// Export standalone logging function for convenience
export const logResizeResult = (result: ResizeResult, context?: string): void => {
  ImageResizingService.logResizeResult(result, context);
};
