// Image Filter System for Canvas
// Comprehensive image filtering with real-time preview and filter composition

import type { ManagedCanvas } from '../providers/CanvasProvider';
import { BlendMode } from './canvasUtils';

/**
 * Filter types available in the system
 */
export enum FilterType {
  // Basic filters
  Brightness = 'brightness',
  Contrast = 'contrast',
  Saturation = 'saturation',
  Hue = 'hue',
  Gamma = 'gamma',
  Exposure = 'exposure',
  
  // Blur and sharpening
  Blur = 'blur',
  GaussianBlur = 'gaussianBlur',
  MotionBlur = 'motionBlur',
  Sharpen = 'sharpen',
  UnsharpMask = 'unsharpMask',
  
  // Noise and texture
  Noise = 'noise',
  Grain = 'grain',
  
  // Color effects
  Sepia = 'sepia',
  Grayscale = 'grayscale',
  Invert = 'invert',
  Posterize = 'posterize',
  Solarize = 'solarize',
  
  // Artistic filters
  Emboss = 'emboss',
  EdgeDetection = 'edgeDetection',
  Vintage = 'vintage',
  Vignette = 'vignette',
  
  // Color correction
  WhiteBalance = 'whiteBalance',
  ColorBalance = 'colorBalance',
  Levels = 'levels',
  Curves = 'curves',
  
  // Special effects
  Pixelate = 'pixelate',
  Halftone = 'halftone',
  CrossHatch = 'crossHatch',
  OilPainting = 'oilPainting'
}

/**
 * Filter parameter configuration
 */
export interface FilterParameter {
  name: string;
  type: 'number' | 'range' | 'boolean' | 'color' | 'select';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  id: string;
  type: FilterType;
  name: string;
  description: string;
  parameters: Record<string, FilterParameter>;
  enabled: boolean;
  opacity: number;
  blendMode: BlendMode;
}

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  filters: FilterConfig[];
  category: string;
  tags: string[];
}

/**
 * Filter application result
 */
export interface FilterResult {
  success: boolean;
  processedImageData?: ImageData;
  error?: string;
  processingTime: number;
}

/**
 * Filter preview configuration
 */
export interface FilterPreviewConfig {
  enabled: boolean;
  updateInterval: number;
  maxPreviewSize: { width: number; height: number };
  quality: number;
}

/**
 * Default filter parameters for each filter type
 */
export const DEFAULT_FILTER_PARAMETERS: Record<FilterType, Record<string, FilterParameter>> = {
  [FilterType.Brightness]: {
    amount: { name: 'Brightness', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Adjust image brightness' }
  },
  [FilterType.Contrast]: {
    amount: { name: 'Contrast', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Adjust image contrast' }
  },
  [FilterType.Saturation]: {
    amount: { name: 'Saturation', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Adjust color saturation' }
  },
  [FilterType.Hue]: {
    angle: { name: 'Hue Shift', type: 'range', value: 0, min: -180, max: 180, step: 1, description: 'Shift hue in degrees' }
  },
  [FilterType.Gamma]: {
    gamma: { name: 'Gamma', type: 'range', value: 1, min: 0.1, max: 3, step: 0.1, description: 'Gamma correction' }
  },
  [FilterType.Exposure]: {
    stops: { name: 'Exposure', type: 'range', value: 0, min: -3, max: 3, step: 0.1, description: 'Exposure in stops' }
  },
  [FilterType.Blur]: {
    radius: { name: 'Radius', type: 'range', value: 5, min: 0, max: 50, step: 1, description: 'Blur radius in pixels' }
  },
  [FilterType.GaussianBlur]: {
    radius: { name: 'Radius', type: 'range', value: 5, min: 0, max: 50, step: 1, description: 'Gaussian blur radius' }
  },
  [FilterType.MotionBlur]: {
    distance: { name: 'Distance', type: 'range', value: 10, min: 0, max: 100, step: 1, description: 'Motion blur distance' },
    angle: { name: 'Angle', type: 'range', value: 0, min: 0, max: 360, step: 1, description: 'Motion blur angle' }
  },
  [FilterType.Sharpen]: {
    amount: { name: 'Amount', type: 'range', value: 50, min: 0, max: 200, step: 1, description: 'Sharpening amount' }
  },
  [FilterType.UnsharpMask]: {
    amount: { name: 'Amount', type: 'range', value: 100, min: 0, max: 500, step: 1, description: 'Unsharp mask amount' },
    radius: { name: 'Radius', type: 'range', value: 1, min: 0.1, max: 10, step: 0.1, description: 'Unsharp mask radius' },
    threshold: { name: 'Threshold', type: 'range', value: 3, min: 0, max: 255, step: 1, description: 'Unsharp mask threshold' }
  },
  [FilterType.Noise]: {
    amount: { name: 'Amount', type: 'range', value: 25, min: 0, max: 100, step: 1, description: 'Noise amount' },
    type: { name: 'Type', type: 'select', value: 'uniform', options: ['uniform', 'gaussian'], description: 'Noise type' }
  },
  [FilterType.Grain]: {
    amount: { name: 'Amount', type: 'range', value: 25, min: 0, max: 100, step: 1, description: 'Grain amount' },
    size: { name: 'Size', type: 'range', value: 1, min: 0.5, max: 5, step: 0.1, description: 'Grain size' }
  },
  [FilterType.Sepia]: {
    amount: { name: 'Amount', type: 'range', value: 100, min: 0, max: 100, step: 1, description: 'Sepia effect amount' }
  },
  [FilterType.Grayscale]: {
    method: { name: 'Method', type: 'select', value: 'luminance', options: ['average', 'luminance', 'desaturation'], description: 'Grayscale conversion method' }
  },
  [FilterType.Invert]: {},
  [FilterType.Posterize]: {
    levels: { name: 'Levels', type: 'range', value: 8, min: 2, max: 64, step: 1, description: 'Number of color levels' }
  },
  [FilterType.Solarize]: {
    threshold: { name: 'Threshold', type: 'range', value: 128, min: 0, max: 255, step: 1, description: 'Solarization threshold' }
  },
  [FilterType.Emboss]: {
    strength: { name: 'Strength', type: 'range', value: 1, min: 0.1, max: 5, step: 0.1, description: 'Emboss strength' }
  },
  [FilterType.EdgeDetection]: {
    threshold: { name: 'Threshold', type: 'range', value: 50, min: 0, max: 255, step: 1, description: 'Edge detection threshold' }
  },
  [FilterType.Vintage]: {
    warmth: { name: 'Warmth', type: 'range', value: 20, min: 0, max: 100, step: 1, description: 'Vintage warmth' },
    vignette: { name: 'Vignette', type: 'range', value: 30, min: 0, max: 100, step: 1, description: 'Vignette strength' }
  },
  [FilterType.Vignette]: {
    strength: { name: 'Strength', type: 'range', value: 50, min: 0, max: 100, step: 1, description: 'Vignette strength' },
    size: { name: 'Size', type: 'range', value: 50, min: 10, max: 90, step: 1, description: 'Vignette size' }
  },
  [FilterType.WhiteBalance]: {
    temperature: { name: 'Temperature', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Color temperature' },
    tint: { name: 'Tint', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Green/Magenta tint' }
  },
  [FilterType.ColorBalance]: {
    shadows: { name: 'Shadows', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Shadow color balance' },
    midtones: { name: 'Midtones', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Midtone color balance' },
    highlights: { name: 'Highlights', type: 'range', value: 0, min: -100, max: 100, step: 1, description: 'Highlight color balance' }
  },
  [FilterType.Levels]: {
    inputBlack: { name: 'Input Black', type: 'range', value: 0, min: 0, max: 255, step: 1, description: 'Input black point' },
    inputWhite: { name: 'Input White', type: 'range', value: 255, min: 0, max: 255, step: 1, description: 'Input white point' },
    gamma: { name: 'Gamma', type: 'range', value: 1, min: 0.1, max: 3, step: 0.1, description: 'Gamma correction' }
  },
  [FilterType.Curves]: {
    points: { name: 'Curve Points', type: 'number', value: '0,0;255,255', description: 'Curve control points' }
  },
  [FilterType.Pixelate]: {
    size: { name: 'Pixel Size', type: 'range', value: 8, min: 2, max: 32, step: 1, description: 'Pixel block size' }
  },
  [FilterType.Halftone]: {
    size: { name: 'Dot Size', type: 'range', value: 4, min: 1, max: 20, step: 1, description: 'Halftone dot size' },
    angle: { name: 'Angle', type: 'range', value: 45, min: 0, max: 90, step: 1, description: 'Halftone angle' }
  },
  [FilterType.CrossHatch]: {
    strength: { name: 'Strength', type: 'range', value: 50, min: 0, max: 100, step: 1, description: 'Cross-hatch strength' }
  },
  [FilterType.OilPainting]: {
    radius: { name: 'Radius', type: 'range', value: 4, min: 1, max: 20, step: 1, description: 'Oil painting radius' },
    intensity: { name: 'Intensity', type: 'range', value: 55, min: 1, max: 255, step: 1, description: 'Oil painting intensity' }
  }
};

/**
 * Image filter engine class
 */
export class ImageFilterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImageData: ImageData | null = null;
  private currentImageData: ImageData | null = null;

  constructor(managedCanvas: ManagedCanvas) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
  }

  /**
   * Set original image data for filtering
   */
  setOriginalImage(imageData: ImageData): void {
    this.originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    this.currentImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
  }

  /**
   * Apply brightness filter
   */
  private applyBrightness(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const brightnessFactor = amount / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + brightnessFactor * 255));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightnessFactor * 255)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightnessFactor * 255)); // B
    }
    
    return imageData;
  }

  /**
   * Apply contrast filter
   */
  private applyContrast(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const contrastFactor = (amount + 100) / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * contrastFactor) + 128));     // R
      data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * contrastFactor) + 128)); // G
      data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * contrastFactor) + 128)); // B
    }
    
    return imageData;
  }

  /**
   * Apply saturation filter
   */
  private applySaturation(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const saturationFactor = (amount + 100) / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate grayscale value
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply saturation
      data[i] = Math.max(0, Math.min(255, gray + saturationFactor * (r - gray)));
      data[i + 1] = Math.max(0, Math.min(255, gray + saturationFactor * (g - gray)));
      data[i + 2] = Math.max(0, Math.min(255, gray + saturationFactor * (b - gray)));
    }
    
    return imageData;
  }

  /**
   * Apply hue shift filter
   */
  private applyHueShift(imageData: ImageData, angle: number): ImageData {
    const data = imageData.data;
    const hueShift = (angle * Math.PI) / 180;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Convert RGB to HSV
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = (h * 60 + hueShift * 180 / Math.PI) % 360;
      if (h < 0) h += 360;
      
      const s = max === 0 ? 0 : delta / max;
      const v = max;
      
      // Convert HSV back to RGB
      const c = v * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;
      
      let rNew = 0, gNew = 0, bNew = 0;
      if (h >= 0 && h < 60) { rNew = c; gNew = x; bNew = 0; }
      else if (h >= 60 && h < 120) { rNew = x; gNew = c; bNew = 0; }
      else if (h >= 120 && h < 180) { rNew = 0; gNew = c; bNew = x; }
      else if (h >= 180 && h < 240) { rNew = 0; gNew = x; bNew = c; }
      else if (h >= 240 && h < 300) { rNew = x; gNew = 0; bNew = c; }
      else if (h >= 300 && h < 360) { rNew = c; gNew = 0; bNew = x; }
      
      data[i] = Math.round((rNew + m) * 255);
      data[i + 1] = Math.round((gNew + m) * 255);
      data[i + 2] = Math.round((bNew + m) * 255);
    }
    
    return imageData;
  }

  /**
   * Apply blur filter
   */
  private applyBlur(imageData: ImageData, radius: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    const kernelSize = Math.floor(radius) * 2 + 1;
    const half = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3];
              count++;
            }
          }
        }
        
        const idx = (y * width + x) * 4;
        newData[idx] = r / count;
        newData[idx + 1] = g / count;
        newData[idx + 2] = b / count;
        newData[idx + 3] = a / count;
      }
    }
    
    return new ImageData(newData, width, height);
  }

  /**
   * Apply sharpen filter
   */
  private applySharpen(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    const kernel = [
      0, -amount / 100, 0,
      -amount / 100, 1 + 4 * amount / 100, -amount / 100,
      0, -amount / 100, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          newData[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    return new ImageData(newData, width, height);
  }

  /**
   * Apply sepia filter
   */
  private applySepia(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const intensity = amount / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const sepiaR = (r * 0.393 + g * 0.769 + b * 0.189);
      const sepiaG = (r * 0.349 + g * 0.686 + b * 0.168);
      const sepiaB = (r * 0.272 + g * 0.534 + b * 0.131);
      
      data[i] = Math.min(255, r + intensity * (sepiaR - r));
      data[i + 1] = Math.min(255, g + intensity * (sepiaG - g));
      data[i + 2] = Math.min(255, b + intensity * (sepiaB - b));
    }
    
    return imageData;
  }

  /**
   * Apply grayscale filter
   */
  private applyGrayscale(imageData: ImageData, method: string): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      let gray: number;
      switch (method) {
        case 'average':
          gray = (r + g + b) / 3;
          break;
        case 'luminance':
          gray = 0.299 * r + 0.587 * g + 0.114 * b;
          break;
        case 'desaturation':
          gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
          break;
        default:
          gray = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    return imageData;
  }

  /**
   * Apply invert filter
   */
  private applyInvert(imageData: ImageData): ImageData {
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];         // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
    }
    
    return imageData;
  }

  /**
   * Apply vignette filter
   */
  private applyVignette(imageData: ImageData, strength: number, size: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const vignetteRadius = maxRadius * (size / 100);
    const vignetteStrength = strength / 100;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const vignetteFactor = Math.max(0, 1 - (distance / vignetteRadius) * vignetteStrength);
        
        const idx = (y * width + x) * 4;
        data[idx] *= vignetteFactor;         // R
        data[idx + 1] *= vignetteFactor;     // G
        data[idx + 2] *= vignetteFactor;     // B
      }
    }
    
    return imageData;
  }

  /**
   * Apply single filter to image data
   */
  applyFilter(filterConfig: FilterConfig, sourceImageData?: ImageData): FilterResult {
    const startTime = performance.now();
    
    try {
      const imageData = sourceImageData || this.currentImageData;
      if (!imageData) {
        return {
          success: false,
          error: 'No image data available',
          processingTime: performance.now() - startTime
        };
      }

      // Create a copy of the image data
      const processedData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );

      if (!filterConfig.enabled) {
        return {
          success: true,
          processedImageData: processedData,
          processingTime: performance.now() - startTime
        };
      }

      // Apply the specific filter based on type
      let result: ImageData;
      const params = filterConfig.parameters;

      switch (filterConfig.type) {
        case FilterType.Brightness:
          result = this.applyBrightness(processedData, params.amount?.value || 0);
          break;
        case FilterType.Contrast:
          result = this.applyContrast(processedData, params.amount?.value || 0);
          break;
        case FilterType.Saturation:
          result = this.applySaturation(processedData, params.amount?.value || 0);
          break;
        case FilterType.Hue:
          result = this.applyHueShift(processedData, params.angle?.value || 0);
          break;
        case FilterType.Blur:
          result = this.applyBlur(processedData, params.radius?.value || 5);
          break;
        case FilterType.Sharpen:
          result = this.applySharpen(processedData, params.amount?.value || 50);
          break;
        case FilterType.Sepia:
          result = this.applySepia(processedData, params.amount?.value || 100);
          break;
        case FilterType.Grayscale:
          result = this.applyGrayscale(processedData, params.method?.value || 'luminance');
          break;
        case FilterType.Invert:
          result = this.applyInvert(processedData);
          break;
        case FilterType.Vignette:
          result = this.applyVignette(processedData, params.strength?.value || 50, params.size?.value || 50);
          break;
        default:
          result = processedData;
          console.warn(`Filter type ${filterConfig.type} not implemented`);
      }

      // Apply opacity if less than 100%
      if (filterConfig.opacity < 1 && sourceImageData) {
        const originalData = sourceImageData.data;
        const filteredData = result.data;
        
        for (let i = 0; i < originalData.length; i += 4) {
          filteredData[i] = originalData[i] + filterConfig.opacity * (filteredData[i] - originalData[i]);
          filteredData[i + 1] = originalData[i + 1] + filterConfig.opacity * (filteredData[i + 1] - originalData[i + 1]);
          filteredData[i + 2] = originalData[i + 2] + filterConfig.opacity * (filteredData[i + 2] - originalData[i + 2]);
        }
      }

      return {
        success: true,
        processedImageData: result,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Apply multiple filters in sequence
   */
  applyFilterChain(filters: FilterConfig[]): FilterResult {
    const startTime = performance.now();
    
    if (!this.originalImageData) {
      return {
        success: false,
        error: 'No original image data available',
        processingTime: performance.now() - startTime
      };
    }

    try {
      let currentData = new ImageData(
        new Uint8ClampedArray(this.originalImageData.data),
        this.originalImageData.width,
        this.originalImageData.height
      );

      // Sort filters by enabled status and apply only enabled filters
      const enabledFilters = filters.filter(f => f.enabled);

      for (const filter of enabledFilters) {
        const result = this.applyFilter(filter, currentData);
        if (!result.success || !result.processedImageData) {
          return {
            success: false,
            error: `Failed to apply filter ${filter.name}: ${result.error}`,
            processingTime: performance.now() - startTime
          };
        }
        currentData = result.processedImageData;
      }

      this.currentImageData = currentData;

      return {
        success: true,
        processedImageData: currentData,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Reset to original image
   */
  resetToOriginal(): void {
    if (this.originalImageData) {
      this.currentImageData = new ImageData(
        new Uint8ClampedArray(this.originalImageData.data),
        this.originalImageData.width,
        this.originalImageData.height
      );
    }
  }

  /**
   * Get current processed image data
   */
  getCurrentImageData(): ImageData | null {
    return this.currentImageData;
  }

  /**
   * Render current image data to canvas
   */
  renderToCanvas(): void {
    if (this.currentImageData) {
      this.ctx.putImageData(this.currentImageData, 0, 0);
    }
  }
}

/**
 * Filter preset library
 */
export class FilterPresetLibrary {
  private presets: Map<string, FilterPreset> = new Map();

  constructor() {
    this.initializeDefaultPresets();
  }

  /**
   * Initialize default filter presets
   */
  private initializeDefaultPresets(): void {
    // Vintage preset
    this.addPreset({
      id: 'vintage',
      name: 'Vintage',
      description: 'Classic vintage film look',
      category: 'Retro',
      tags: ['vintage', 'retro', 'film'],
      filters: [
        this.createFilterConfig(FilterType.Sepia, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Sepia].amount, value: 30 } }),
        this.createFilterConfig(FilterType.Contrast, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Contrast].amount, value: -10 } }),
        this.createFilterConfig(FilterType.Saturation, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Saturation].amount, value: -20 } }),
        this.createFilterConfig(FilterType.Vignette, { 
          strength: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Vignette].strength, value: 40 },
          size: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Vignette].size, value: 60 }
        })
      ]
    });

    // Black and White preset
    this.addPreset({
      id: 'blackwhite',
      name: 'Black & White',
      description: 'Classic black and white with enhanced contrast',
      category: 'Classic',
      tags: ['bw', 'monochrome', 'classic'],
      filters: [
        this.createFilterConfig(FilterType.Grayscale, { method: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Grayscale].method, value: 'luminance' } }),
        this.createFilterConfig(FilterType.Contrast, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Contrast].amount, value: 20 } })
      ]
    });

    // Dramatic preset
    this.addPreset({
      id: 'dramatic',
      name: 'Dramatic',
      description: 'High contrast dramatic effect',
      category: 'Artistic',
      tags: ['dramatic', 'contrast', 'bold'],
      filters: [
        this.createFilterConfig(FilterType.Contrast, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Contrast].amount, value: 40 } }),
        this.createFilterConfig(FilterType.Saturation, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Saturation].amount, value: 20 } }),
        this.createFilterConfig(FilterType.Sharpen, { amount: { ...DEFAULT_FILTER_PARAMETERS[FilterType.Sharpen].amount, value: 30 } })
      ]
    });
  }

  /**
   * Create filter configuration helper
   */
  private createFilterConfig(type: FilterType, params: Record<string, FilterParameter>): FilterConfig {
    return {
      id: `filter-${type}-${Date.now()}`,
      type,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      description: `${type} filter`,
      parameters: { ...DEFAULT_FILTER_PARAMETERS[type], ...params },
      enabled: true,
      opacity: 1,
      blendMode: BlendMode.Normal
    };
  }

  /**
   * Add preset to library
   */
  addPreset(preset: FilterPreset): void {
    this.presets.set(preset.id, preset);
  }

  /**
   * Get preset by ID
   */
  getPreset(id: string): FilterPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * Get all presets
   */
  getAllPresets(): FilterPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: string): FilterPreset[] {
    return this.getAllPresets().filter(preset => preset.category === category);
  }

  /**
   * Search presets by tags
   */
  searchPresets(query: string): FilterPreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPresets().filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Remove preset
   */
  removePreset(id: string): boolean {
    return this.presets.delete(id);
  }
}

/**
 * Factory function to create image filter engine
 */
export function createImageFilterEngine(managedCanvas: ManagedCanvas): ImageFilterEngine {
  return new ImageFilterEngine(managedCanvas);
}

/**
 * Factory function to create filter preset library
 */
export function createFilterPresetLibrary(): FilterPresetLibrary {
  return new FilterPresetLibrary();
}