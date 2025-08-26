// Image Export and Optimization System
// Final image export utilities with format optimization and quality controls

import type { ManagedCanvas } from '../providers/CanvasProvider';

/**
 * Supported export formats
 */
export enum ExportFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  AVIF = 'image/avif'
}

/**
 * Export quality presets for different use cases
 */
export enum QualityPreset {
  DRAFT = 'draft',           // Low quality, smallest file
  WEB = 'web',              // Balanced quality for web
  SOCIAL = 'social',        // Optimized for social media
  PRINT = 'print',          // High quality for printing
  MAXIMUM = 'maximum'       // Highest quality, largest file
}

/**
 * Export configuration options
 */
export interface ExportConfig {
  format: ExportFormat;
  quality: number; // 0-1 for lossy formats
  preset?: QualityPreset;
  width?: number;
  height?: number;
  backgroundColor?: string;
  dpi?: number;
  metadata?: ExportMetadata;
  watermark?: WatermarkConfig;
  compression?: CompressionConfig;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  title?: string;
  description?: string;
  author?: string;
  copyright?: string;
  keywords?: string[];
  created?: Date;
  modified?: Date;
  software?: string;
  version?: string;
}

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  text?: string;
  image?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size: number;
  color?: string;
  font?: string;
  margin: number;
}

/**
 * Compression configuration
 */
export interface CompressionConfig {
  progressive?: boolean; // For JPEG
  lossless?: boolean;    // For WebP/AVIF
  effort?: number;       // Compression effort (0-6 for WebP)
}

/**
 * Export result
 */
export interface ExportResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  size: number;
  format: ExportFormat;
  dimensions: { width: number; height: number };
  quality: number;
  metadata?: ExportMetadata;
  compressionRatio?: number;
  processingTime: number;
}

/**
 * Batch export configuration
 */
export interface BatchExportConfig {
  formats: ExportFormat[];
  qualities: number[];
  presets?: QualityPreset[];
  nameTemplate: string; // e.g., "{name}_{preset}_{format}"
  parallelExports: number;
  progressCallback?: (completed: number, total: number, current: ExportResult) => void;
}

/**
 * Quality preset configurations
 */
const QUALITY_PRESETS: Record<QualityPreset, Partial<ExportConfig>> = {
  [QualityPreset.DRAFT]: {
    quality: 0.3,
    compression: { progressive: false, effort: 1 }
  },
  [QualityPreset.WEB]: {
    quality: 0.8,
    compression: { progressive: true, effort: 3 }
  },
  [QualityPreset.SOCIAL]: {
    quality: 0.85,
    width: 1080,
    height: 1080,
    compression: { progressive: true, effort: 4 }
  },
  [QualityPreset.PRINT]: {
    quality: 0.95,
    dpi: 300,
    compression: { progressive: true, effort: 5 }
  },
  [QualityPreset.MAXIMUM]: {
    quality: 1.0,
    compression: { lossless: true, effort: 6 }
  }
};

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: ExportFormat.PNG,
  quality: 0.9,
  preset: QualityPreset.WEB,
  backgroundColor: '#ffffff',
  dpi: 72,
  metadata: {
    software: 'TheSusFit Image Editor',
    version: '1.0.0',
    created: new Date()
  }
};

/**
 * Main image export class
 */
export class ImageExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(managedCanvas: ManagedCanvas) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
  }

  /**
   * Export image with specified configuration
   */
  async exportImage(config: Partial<ExportConfig> = {}): Promise<ExportResult> {
    const startTime = performance.now();
    const finalConfig = this.mergeConfig(config);
    
    // Create export canvas if dimensions specified
    const exportCanvas = this.createExportCanvas(finalConfig);
    const exportCtx = exportCanvas.getContext('2d')!;

    // Apply background if specified
    this.applyBackground(exportCtx, exportCanvas, finalConfig.backgroundColor!);

    // Draw main content
    exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    // Apply watermark if specified
    if (finalConfig.watermark) {
      await this.applyWatermark(exportCtx, exportCanvas, finalConfig.watermark);
    }

    // Generate export blob
    const blob = await this.canvasToBlob(exportCanvas, finalConfig);
    const dataUrl = await this.canvasToDataUrl(exportCanvas, finalConfig);
    
    // Generate filename
    const filename = this.generateFilename(finalConfig);
    
    // Calculate compression ratio
    const originalSize = this.estimateOriginalSize(exportCanvas);
    const compressionRatio = originalSize > 0 ? blob.size / originalSize : 1;

    const processingTime = performance.now() - startTime;

    return {
      blob,
      dataUrl,
      filename,
      size: blob.size,
      format: finalConfig.format,
      dimensions: { width: exportCanvas.width, height: exportCanvas.height },
      quality: finalConfig.quality,
      metadata: finalConfig.metadata,
      compressionRatio,
      processingTime
    };
  }

  /**
   * Batch export with multiple configurations
   */
  async batchExport(configs: Partial<ExportConfig>[]): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const config of configs) {
      try {
        const result = await this.exportImage(config);
        results.push(result);
      } catch (error) {
        console.error('Failed to export with config:', config, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Export with preset configurations
   */
  async exportWithPresets(presets: QualityPreset[]): Promise<ExportResult[]> {
    const configs = presets.map(preset => ({ preset }));
    return this.batchExport(configs);
  }

  /**
   * Download exported image
   */
  downloadImage(result: ExportResult): void {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Merge configuration with defaults and presets
   */
  private mergeConfig(config: Partial<ExportConfig>): ExportConfig {
    let finalConfig = { ...DEFAULT_EXPORT_CONFIG, ...config };

    // Apply preset if specified
    if (config.preset && QUALITY_PRESETS[config.preset]) {
      const presetConfig = QUALITY_PRESETS[config.preset];
      finalConfig = { ...finalConfig, ...presetConfig, ...config };
    }

    // Set dimensions to canvas size if not specified
    if (!finalConfig.width) finalConfig.width = this.canvas.width;
    if (!finalConfig.height) finalConfig.height = this.canvas.height;

    return finalConfig;
  }

  /**
   * Create export canvas with specified dimensions
   */
  private createExportCanvas(config: ExportConfig): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = config.width!;
    canvas.height = config.height!;
    
    // Handle high DPI displays
    const dpiScale = (config.dpi || 72) / 72;
    if (dpiScale !== 1) {
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      canvas.width *= dpiScale;
      canvas.height *= dpiScale;
      
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpiScale, dpiScale);
    }

    return canvas;
  }

  /**
   * Apply background color to canvas
   */
  private applyBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, backgroundColor: string): void {
    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Apply watermark to canvas
   */
  private async applyWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, watermark: WatermarkConfig): Promise<void> {
    ctx.save();
    ctx.globalAlpha = watermark.opacity;

    if (watermark.text) {
      // Text watermark
      const fontSize = Math.min(canvas.width, canvas.height) * (watermark.size / 100);
      ctx.font = `${fontSize}px ${watermark.font || 'Arial'}`;
      ctx.fillStyle = watermark.color || '#000000';
      
      const textMetrics = ctx.measureText(watermark.text);
      const { x, y } = this.calculateWatermarkPosition(
        canvas, 
        textMetrics.width, 
        fontSize, 
        watermark.position, 
        watermark.margin
      );
      
      ctx.fillText(watermark.text, x, y);
    } else if (watermark.image) {
      // Image watermark
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = watermark.image!;
      });
      
      const watermarkSize = Math.min(canvas.width, canvas.height) * (watermark.size / 100);
      const aspectRatio = img.width / img.height;
      const width = aspectRatio >= 1 ? watermarkSize : watermarkSize * aspectRatio;
      const height = aspectRatio >= 1 ? watermarkSize / aspectRatio : watermarkSize;
      
      const { x, y } = this.calculateWatermarkPosition(
        canvas, 
        width, 
        height, 
        watermark.position, 
        watermark.margin
      );
      
      ctx.drawImage(img, x, y, width, height);
    }

    ctx.restore();
  }

  /**
   * Calculate watermark position based on alignment
   */
  private calculateWatermarkPosition(
    canvas: HTMLCanvasElement, 
    width: number, 
    height: number, 
    position: WatermarkConfig['position'], 
    margin: number
  ): { x: number; y: number } {
    switch (position) {
      case 'top-left':
        return { x: margin, y: margin + height };
      case 'top-right':
        return { x: canvas.width - width - margin, y: margin + height };
      case 'bottom-left':
        return { x: margin, y: canvas.height - margin };
      case 'bottom-right':
        return { x: canvas.width - width - margin, y: canvas.height - margin };
      case 'center':
      default:
        return { 
          x: (canvas.width - width) / 2, 
          y: (canvas.height - height) / 2 + height 
        };
    }
  }

  /**
   * Convert canvas to blob with format and quality
   */
  private async canvasToBlob(canvas: HTMLCanvasElement, config: ExportConfig): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        config.format,
        config.quality
      );
    });
  }

  /**
   * Convert canvas to data URL
   */
  private async canvasToDataUrl(canvas: HTMLCanvasElement, config: ExportConfig): Promise<string> {
    return canvas.toDataURL(config.format, config.quality);
  }

  /**
   * Generate filename based on configuration
   */
  private generateFilename(config: ExportConfig): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const extension = this.getFileExtension(config.format);
    const preset = config.preset ? `_${config.preset}` : '';
    const dimensions = `_${config.width}x${config.height}`;
    
    return `exported_image${preset}${dimensions}_${timestamp}.${extension}`;
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PNG:
        return 'png';
      case ExportFormat.JPEG:
        return 'jpg';
      case ExportFormat.WEBP:
        return 'webp';
      case ExportFormat.AVIF:
        return 'avif';
      default:
        return 'png';
    }
  }

  /**
   * Estimate original (uncompressed) size for compression ratio calculation
   */
  private estimateOriginalSize(canvas: HTMLCanvasElement): number {
    // Estimate as 4 bytes per pixel (RGBA) for uncompressed bitmap
    return canvas.width * canvas.height * 4;
  }
}

/**
 * Batch export manager for processing multiple exports
 */
export class BatchExportManager {
  private exporter: ImageExporter;
  private queue: Array<{ config: Partial<ExportConfig>; resolve: (result: ExportResult) => void; reject: (error: Error) => void }> = [];
  private processing = false;
  private concurrency: number;

  constructor(exporter: ImageExporter, concurrency: number = 2) {
    this.exporter = exporter;
    this.concurrency = concurrency;
  }

  /**
   * Add export to queue
   */
  async queueExport(config: Partial<ExportConfig>): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process export queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const activePromises: Promise<void>[] = [];

    while (this.queue.length > 0 || activePromises.length > 0) {
      // Start new exports up to concurrency limit
      while (activePromises.length < this.concurrency && this.queue.length > 0) {
        const item = this.queue.shift()!;
        const promise = this.processExport(item);
        activePromises.push(promise);
      }

      // Wait for at least one to complete
      if (activePromises.length > 0) {
        await Promise.race(activePromises);
        // Remove completed promises
        for (let i = activePromises.length - 1; i >= 0; i--) {
          if (await Promise.allSettled([activePromises[i]]).then(results => results[0].status === 'fulfilled')) {
            activePromises.splice(i, 1);
          }
        }
      }
    }

    this.processing = false;
  }

  /**
   * Process individual export
   */
  private async processExport(item: { config: Partial<ExportConfig>; resolve: (result: ExportResult) => void; reject: (error: Error) => void }): Promise<void> {
    try {
      const result = await this.exporter.exportImage(item.config);
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Clear the export queue
   */
  clearQueue(): void {
    this.queue.forEach(item => item.reject(new Error('Export cancelled')));
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.processing
    };
  }
}

/**
 * Factory function to create image exporter
 */
export function createImageExporter(managedCanvas: ManagedCanvas): ImageExporter {
  return new ImageExporter(managedCanvas);
}

/**
 * Factory function to create batch export manager
 */
export function createBatchExportManager(exporter: ImageExporter, concurrency?: number): BatchExportManager {
  return new BatchExportManager(exporter, concurrency);
}

/**
 * Utility function to get optimal format for use case
 */
export function getOptimalFormat(useCase: 'web' | 'social' | 'print' | 'archive'): ExportFormat {
  switch (useCase) {
    case 'web':
      return ExportFormat.WEBP;
    case 'social':
      return ExportFormat.JPEG;
    case 'print':
      return ExportFormat.PNG;
    case 'archive':
      return ExportFormat.PNG;
    default:
      return ExportFormat.PNG;
  }
}

/**
 * Utility function to estimate file size
 */
export function estimateFileSize(
  width: number, 
  height: number, 
  format: ExportFormat, 
  quality: number = 0.9
): number {
  const pixels = width * height;
  
  switch (format) {
    case ExportFormat.PNG:
      // PNG is lossless, roughly 3-4 bytes per pixel with compression
      return pixels * 3.5;
    case ExportFormat.JPEG:
      // JPEG compression varies greatly with quality
      const baseSize = pixels * 0.5; // Very rough estimate
      return baseSize * quality * 2;
    case ExportFormat.WEBP:
      // WebP is more efficient than JPEG
      const webpBaseSize = pixels * 0.3;
      return webpBaseSize * quality * 1.5;
    case ExportFormat.AVIF:
      // AVIF is even more efficient
      const avifBaseSize = pixels * 0.2;
      return avifBaseSize * quality * 1.2;
    default:
      return pixels * 3;
  }
}