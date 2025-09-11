import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import imageSize from 'image-size';

// Types for storage metadata
export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
  density?: number;
}

export interface StoredImage {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  metadata?: ImageMetadata;
  processingStatus: 'uploaded' | 'processing' | 'processed' | 'error';
  errorMessage?: string;
}

export interface StorageConfig {
  uploadDir: string;
  maxFileSize: number;
  allowedTypes: string[];
  enableMetadataExtraction: boolean;
  cleanupInterval: number; // in milliseconds
}

// Default configuration
const DEFAULT_CONFIG: StorageConfig = {
  uploadDir: path.join(process.cwd(), 'public', 'uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  enableMetadataExtraction: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
};

class StorageService {
  private config: StorageConfig;
  private imageRegistry: Map<string, StoredImage> = new Map();
  private registryFile: string;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registryFile = path.join(this.config.uploadDir, '.image-registry.json');
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Ensure upload directory exists
      await fs.mkdir(this.config.uploadDir, { recursive: true });
      
      // Load existing registry if it exists
      await this.loadRegistry();
      
      // Start cleanup interval
      this.startCleanupInterval();
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  private async loadRegistry(): Promise<void> {
    try {
      const registryData = await fs.readFile(this.registryFile, 'utf-8');
      const registry = JSON.parse(registryData);
      
      // Convert date strings back to Date objects
      for (const [, image] of Object.entries(registry)) {
        if (image && typeof image === 'object') {
          (image as StoredImage).uploadedAt = new Date((image as StoredImage).uploadedAt);
        }
      }
      
      this.imageRegistry = new Map(Object.entries(registry));
    } catch {
      // Registry file doesn't exist or is corrupted, start fresh
      this.imageRegistry = new Map();
    }
  }

  private async saveRegistry(): Promise<void> {
    try {
      // Ensure the directory exists before writing the registry file
      await fs.mkdir(this.config.uploadDir, { recursive: true });
      
      const registryData = JSON.stringify(Object.fromEntries(this.imageRegistry), null, 2);
      await fs.writeFile(this.registryFile, registryData, 'utf-8');
    } catch (error) {
      console.error('Failed to save image registry:', error);
    }
  }

  private generateUniqueId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomString}`;
  }

  private generateUniqueFilename(originalName: string): string {
    const extension = path.extname(originalName);
    const id = this.generateUniqueId();
    return `${id}${extension}`;
  }

  private async extractImageMetadata(filePath: string): Promise<ImageMetadata | undefined> {
    if (!this.config.enableMetadataExtraction) {
      return undefined;
    }

    try {
      // Use Sharp for comprehensive metadata extraction
      const sharpInstance = sharp(filePath);
      const metadata = await sharpInstance.metadata();
      
      // Also get basic size info using image-size for additional validation
      const fileBuffer = await fs.readFile(filePath);
      const sizeInfo = imageSize(fileBuffer);
      
      return {
        width: metadata.width || sizeInfo?.width,
        height: metadata.height || sizeInfo?.height,
        format: metadata.format,
        colorSpace: metadata.space,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
      };
    } catch (error) {
      console.warn('Failed to extract image metadata:', error);
      
      // Fallback to basic metadata extraction
      try {
        const fileBuffer = await fs.readFile(filePath);
        const sizeInfo = imageSize(fileBuffer);
        return {
          width: sizeInfo?.width,
          height: sizeInfo?.height,
          format: path.extname(filePath).slice(1).toLowerCase(),
        };
      } catch (fallbackError) {
        console.warn('Fallback metadata extraction also failed:', fallbackError);
        return undefined;
      }
    }
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      await this.cleanupOldFiles();
    }, this.config.cleanupInterval);
  }

  private async cleanupOldFiles(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    for (const [id, image] of this.imageRegistry.entries()) {
      if (image.uploadedAt < cutoffDate && image.processingStatus === 'uploaded') {
        try {
          await fs.unlink(image.path);
          this.imageRegistry.delete(id);
        } catch (error) {
          console.warn(`Failed to cleanup file ${image.filename}:`, error);
        }
      }
    }
    
    await this.saveRegistry();
  }

  async storeImage(file: File, buffer: Buffer): Promise<StoredImage> {
    try {
      // Generate unique identifiers
      const id = this.generateUniqueId();
      const filename = this.generateUniqueFilename(file.name);
      const filePath = path.join(this.config.uploadDir, filename);

      // Write file to disk
      await fs.writeFile(filePath, buffer);

      // Extract metadata
      const metadata = await this.extractImageMetadata(filePath);

      // Create stored image record
      const storedImage: StoredImage = {
        id,
        originalName: file.name,
        filename,
        path: filePath,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        metadata,
        processingStatus: 'uploaded',
      };

      // Add to registry
      this.imageRegistry.set(id, storedImage);
      await this.saveRegistry();

      return storedImage;
    } catch (error) {
      console.error('Failed to store image:', error);
      throw new Error(`Failed to store image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getImage(id: string): Promise<StoredImage | null> {
    return this.imageRegistry.get(id) || null;
  }

  async getAllImages(): Promise<StoredImage[]> {
    return Array.from(this.imageRegistry.values());
  }

  async updateProcessingStatus(id: string, status: StoredImage['processingStatus'], errorMessage?: string): Promise<void> {
    const image = this.imageRegistry.get(id);
    if (image) {
      image.processingStatus = status;
      if (errorMessage) {
        image.errorMessage = errorMessage;
      }
      await this.saveRegistry();
    }
  }

  async deleteImage(id: string): Promise<boolean> {
    const image = this.imageRegistry.get(id);
    if (!image) {
      return false;
    }

    try {
      // Delete file from disk
      await fs.unlink(image.path);
      
      // Remove from registry
      this.imageRegistry.delete(id);
      await this.saveRegistry();
      
      return true;
    } catch (error) {
      console.error(`Failed to delete image ${id}:`, error);
      return false;
    }
  }

  async getImageBuffer(id: string): Promise<Buffer | null> {
    const image = this.imageRegistry.get(id);
    if (!image) {
      return null;
    }

    try {
      return await fs.readFile(image.path);
    } catch (error) {
      console.error(`Failed to read image ${id}:`, error);
      return null;
    }
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    statusCounts: Record<string, number>;
  }> {
    const images = Array.from(this.imageRegistry.values());
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    
    // Initialize all possible status counts to 0
    const statusCounts: Record<string, number> = {
      uploaded: 0,
      processing: 0,
      processed: 0,
      error: 0,
    };
    
    // Count actual statuses
    images.forEach(img => {
      statusCounts[img.processingStatus] = (statusCounts[img.processingStatus] || 0) + 1;
    });

    return {
      totalImages: images.length,
      totalSize,
      statusCounts,
    };
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing
export { StorageService };
