// Advanced Canvas API Utilities
// Extended canvas operations for image processing and manipulation

import type { ManagedCanvas } from '../providers/CanvasProvider';

/**
 * Blend modes for canvas operations
 */
export enum BlendMode {
  Normal = 'source-over',
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  SoftLight = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion'
}

/**
 * Canvas transformation matrix
 */
export interface Transform {
  a: number; // horizontal scaling
  b: number; // horizontal skewing
  c: number; // vertical skewing
  d: number; // vertical scaling
  e: number; // horizontal translation
  f: number; // vertical translation
}

/**
 * Canvas drawing state snapshot
 */
export interface CanvasState {
  imageData: ImageData;
  transform: Transform;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  globalAlpha: number;
  globalCompositeOperation: GlobalCompositeOperation;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

/**
 * Advanced canvas operations class
 */
export class AdvancedCanvasOperations {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(managedCanvas: ManagedCanvas) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
  }

  /**
   * Save current canvas state
   */
  saveState(): CanvasState {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const transform = this.ctx.getTransform();
    
    return {
      imageData,
      transform: {
        a: transform.a,
        b: transform.b,
        c: transform.c,
        d: transform.d,
        e: transform.e,
        f: transform.f
      },
      fillStyle: this.ctx.fillStyle,
      strokeStyle: this.ctx.strokeStyle,
      lineWidth: this.ctx.lineWidth,
      lineCap: this.ctx.lineCap,
      lineJoin: this.ctx.lineJoin,
      globalAlpha: this.ctx.globalAlpha,
      globalCompositeOperation: this.ctx.globalCompositeOperation,
      font: this.ctx.font,
      textAlign: this.ctx.textAlign,
      textBaseline: this.ctx.textBaseline
    };
  }

  /**
   * Restore canvas state
   */
  restoreState(state: CanvasState): void {
    this.ctx.putImageData(state.imageData, 0, 0);
    this.ctx.setTransform(state.transform.a, state.transform.b, state.transform.c, 
                         state.transform.d, state.transform.e, state.transform.f);
    this.ctx.fillStyle = state.fillStyle;
    this.ctx.strokeStyle = state.strokeStyle;
    this.ctx.lineWidth = state.lineWidth;
    this.ctx.lineCap = state.lineCap;
    this.ctx.lineJoin = state.lineJoin;
    this.ctx.globalAlpha = state.globalAlpha;
    this.ctx.globalCompositeOperation = state.globalCompositeOperation;
    this.ctx.font = state.font;
    this.ctx.textAlign = state.textAlign;
    this.ctx.textBaseline = state.textBaseline;
  }

  /**
   * Apply image filter using pixel manipulation
   */
  applyPixelFilter(filterFn: (r: number, g: number, b: number, a: number) => [number, number, number, number]): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = filterFn(data[i], data[i + 1], data[i + 2], data[i + 3]);
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = Math.max(0, Math.min(255, a));
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Draw image with blend mode
   */
  drawImageWithBlendMode(
    image: CanvasImageSource,
    x: number,
    y: number,
    width?: number,
    height?: number,
    blendMode: BlendMode = BlendMode.Normal,
    opacity: number = 1
  ): void {
    const originalCompositeOperation = this.ctx.globalCompositeOperation;
    const originalAlpha = this.ctx.globalAlpha;

    this.ctx.globalCompositeOperation = blendMode;
    this.ctx.globalAlpha = opacity;

    if (width !== undefined && height !== undefined) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }

    this.ctx.globalCompositeOperation = originalCompositeOperation;
    this.ctx.globalAlpha = originalAlpha;
  }

  /**
   * Create radial gradient
   */
  createRadialGradient(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = this.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    stops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
  }

  /**
   * Create linear gradient
   */
  createLinearGradient(
    x1: number, y1: number, x2: number, y2: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    return gradient;
  }

  /**
   * Draw rounded rectangle
   */
  roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Get pixel color at coordinates
   */
  getPixelColor(x: number, y: number): { r: number; g: number; b: number; a: number } {
    const imageData = this.ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3]
    };
  }

  /**
   * Set pixel color at coordinates
   */
  setPixelColor(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    const imageData = this.ctx.createImageData(1, 1);
    imageData.data[0] = r;
    imageData.data[1] = g;
    imageData.data[2] = b;
    imageData.data[3] = a;
    this.ctx.putImageData(imageData, x, y);
  }

  /**
   * Crop canvas to specified rectangle
   */
  crop(x: number, y: number, width: number, height: number): void {
    const imageData = this.ctx.getImageData(x, y, width, height);
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Flip canvas horizontally or vertically
   */
  flip(horizontal: boolean = true, vertical: boolean = false): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
    this.ctx.translate(horizontal ? -this.canvas.width : 0, vertical ? -this.canvas.height : 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
  }

  /**
   * Rotate canvas by angle in radians
   */
  rotate(angle: number, centerX?: number, centerY?: number): void {
    const cx = centerX ?? this.canvas.width / 2;
    const cy = centerY ?? this.canvas.height / 2;
    
    this.ctx.translate(cx, cy);
    this.ctx.rotate(angle);
    this.ctx.translate(-cx, -cy);
  }
}

/**
 * Canvas performance utilities
 */
export class CanvasPerformanceUtils {
  /**
   * Measure canvas operation performance
   */
  static measureOperation<T>(operation: () => T, name: string = 'Canvas Operation'): T {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Debounce canvas operations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle canvas operations
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if canvas size is within memory limits
   */
  static isCanvasSizeSafe(width: number, height: number, maxPixels: number = 16777216): boolean {
    return width * height <= maxPixels;
  }

  /**
   * Optimize canvas for performance
   */
  static optimizeCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Disable image smoothing for better performance in some cases
      ctx.imageSmoothingEnabled = false;
      
      // Set text baseline for consistent text rendering
      ctx.textBaseline = 'top';
    }
  }
}

/**
 * Canvas animation utilities
 */
export class CanvasAnimationUtils {
  private animationId: number | null = null;
  private isRunning: boolean = false;

  /**
   * Start animation loop
   */
  startAnimation(callback: (timestamp: number) => void): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    const animate = (timestamp: number) => {
      if (!this.isRunning) return;
      
      callback(timestamp);
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stopAnimation(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Animate property with easing
   */
  static animateProperty(
    from: number,
    to: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): () => void {
    const startTime = performance.now();
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = from + (to - from) * easedProgress;

      onUpdate(currentValue);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);

    // Return cancel function
    return () => cancelAnimationFrame(animationId);
  }

  /**
   * Common easing functions
   */
  static easing = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  };
}

/**
 * Factory function to create advanced canvas operations
 */
export function createAdvancedCanvasOperations(managedCanvas: ManagedCanvas): AdvancedCanvasOperations {
  return new AdvancedCanvasOperations(managedCanvas);
}

/**
 * Factory function to create canvas animation utils
 */
export function createCanvasAnimationUtils(): CanvasAnimationUtils {
  return new CanvasAnimationUtils();
}