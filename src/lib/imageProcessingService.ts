import sharp from 'sharp';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'tiff';
  quality?: number;
  compressionLevel?: number;   // NOT USED YET!! 1-9, higher = better comppression for png only
  ensureFourChannel?: boolean; // NOT USED YET!! Ensure 4-channel (RGBA) format
  forceFourChannel?: boolean; // NOT USED YET!! Force conversion to 4-channel even if already 4-channel
}

export interface SharpImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  density?: number;
  hasAlpha?: boolean;
  channels?: number;
  space?: string;
}

export interface ProcessedImageResult {
  success: boolean;
  processedB64: string;
  metadata: SharpImageMetadata;
  error?: string;
}

export class ImageProcessingService {

  constructor() {
    //this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    //this.processedDir = path.join(process.cwd(), 'public', 'processed');
    // Ensure directories exist
    //this.ensureDirectoriesExist();
  }


  /**
   * Process an image with the given options
   */
  async processImage(
    imageB64: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageB64, 'base64');

      // Get original image metadata from buffer
      const originalMetadata = await sharp(imageBuffer).metadata();

      // Create Sharp instance with processing options from buffer
      let sharpInstance = sharp(imageBuffer);

      console.log('ImageProcessingService - options', options);
      console.log('ImageProcessingService - original metadata:', originalMetadata);
      
      // Handle 4-channel conversion FIRST (before format conversion)
      if (options.ensureFourChannel || options.forceFourChannel) {
        const hasAlpha = originalMetadata.hasAlpha;
        const channels = originalMetadata.channels;
        
        // Check if conversion is needed
        const needsConversion = options.forceFourChannel || 
          (options.ensureFourChannel && (!hasAlpha || channels !== 4));
        
        if (needsConversion) {
          console.log('Converting to 4-channel (RGBA) format');
          
          // Validate and adjust format to support alpha channels FIRST
          const alphaSupportedFormats = ['png', 'webp', 'tiff'];
          if (!options.format || !alphaSupportedFormats.includes(options.format)) {
            console.log(`Format ${options.format} doesn't support alpha channels, changing to PNG`);
            options.format = 'png';
          }
          
          // Convert to RGBA format explicitly
          if (options.format === 'png') {
            sharpInstance = sharpInstance
              .ensureAlpha()
              .toColorspace('rgba')
              .png({
                force: true,
                palette: false, // <--- critical, stops sharp from optimizing away alpha
              });
          } else {
            sharpInstance = sharpInstance
              .ensureAlpha()
              .toColorspace('rgba')
              .toFormat(options.format, { quality: options.quality || 80 });
          }
          
          console.log(`Applied 4-channel conversion with format: ${options.format}`);
        } else {
          console.log('Image already has 4 channels, no conversion needed');
        }
      }

      // Apply resizing if dimensions are provided
      if (options.width || options.height) {
          console.log('resize with fit', options.fit);
          sharpInstance = sharpInstance.resize({
            width: options.width,
            height: options.height,
            fit: options.fit || 'cover',
            withoutEnlargement: true,
          });
      }

      // Process the image
      const processedBuffer = await sharpInstance.toBuffer();

      // Get processed image metadata
      const processedMetadata = await sharp(processedBuffer).metadata();
      console.log('ImageProcessingService: processed metadata', processedMetadata);

      // Convert processed buffer back to base64
      const processedB64 = processedBuffer.toString('base64');

      return {
        success: true,
        processedB64: processedB64,
        metadata: {
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          format: processedMetadata.format || 'unknown',
          size: processedBuffer.length,
          density: processedMetadata.density,
          hasAlpha: processedMetadata.hasAlpha,
          channels: processedMetadata.channels,
          space: processedMetadata.space,
        },
      };
    } catch (error) {
      return {
        success: false,
        processedB64: '',
        metadata: {
          width: 0,
          height: 0,
          format: 'unknown',
          size: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get image metadata without processing
   */
  async getImageMetadata(imageB64?: string): Promise<{
    success: boolean;
    metadata: SharpImageMetadata | null;
    error?: string;
  }> {
    try {
      let metadata;
      let size = 0;

      if (imageB64) {
        // Get metadata from base64 buffer
        const imageBuffer = Buffer.from(imageB64, 'base64');
        metadata = await sharp(imageBuffer).metadata();
        size = imageBuffer.length;
      } else {
        metadata = {
            width: 0,
            height: 0,
            format: 'unknown',
            size: 0
        };
      }

      return {
        success: true,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: size,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          channels: metadata.channels,
          space: metadata.space,
        },
      };
    } catch (error) {
      return {
        success: false,
        metadata: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }


}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService();