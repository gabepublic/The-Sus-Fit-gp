// Text Overlay System for Canvas
// Comprehensive text rendering with styling, positioning, and measurement

import type { ManagedCanvas } from '../providers/CanvasProvider';

/**
 * Text alignment options
 */
export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Start = 'start',
  End = 'end'
}

/**
 * Text baseline options
 */
export enum TextBaseline {
  Top = 'top',
  Hanging = 'hanging',
  Middle = 'middle',
  Alphabetic = 'alphabetic',
  Ideographic = 'ideographic',
  Bottom = 'bottom'
}

/**
 * Text decoration styles
 */
export interface TextDecoration {
  underline?: boolean;
  overline?: boolean;
  lineThrough?: boolean;
  color?: string;
  thickness?: number;
}

/**
 * Text shadow configuration
 */
export interface TextShadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

/**
 * Text outline/stroke configuration
 */
export interface TextOutline {
  color: string;
  width: number;
}

/**
 * Gradient text configuration
 */
export interface TextGradient {
  type: 'linear' | 'radial';
  colors: Array<{ offset: number; color: string }>;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  r1?: number;
  r2?: number;
}

/**
 * Comprehensive text styling options
 */
export interface TextStyle {
  /** Font family */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;
  /** Font style */
  fontStyle?: 'normal' | 'italic' | 'oblique';
  /** Text color */
  color?: string;
  /** Text alignment */
  textAlign?: TextAlign;
  /** Text baseline */
  textBaseline?: TextBaseline;
  /** Line height multiplier */
  lineHeight?: number;
  /** Letter spacing in pixels */
  letterSpacing?: number;
  /** Text decoration */
  decoration?: TextDecoration;
  /** Text shadow */
  shadow?: TextShadow;
  /** Text outline/stroke */
  outline?: TextOutline;
  /** Gradient fill */
  gradient?: TextGradient;
  /** Global alpha/opacity */
  opacity?: number;
  /** Text transform */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Text positioning and layout options
 */
export interface TextPosition {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Maximum width for text wrapping */
  maxWidth?: number;
  /** Maximum height for text overflow */
  maxHeight?: number;
  /** Padding around text */
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Text rotation in radians */
  rotation?: number;
  /** Anchor point for positioning */
  anchor?: {
    x: 'left' | 'center' | 'right';
    y: 'top' | 'middle' | 'bottom';
  };
}

/**
 * Text wrapping configuration
 */
export interface TextWrapOptions {
  /** Enable word wrapping */
  enabled: boolean;
  /** Break long words */
  breakWords?: boolean;
  /** Hyphenation character */
  hyphenChar?: string;
  /** Minimum characters before hyphenation */
  minCharsBeforeHyphen?: number;
}

/**
 * Text measurement result
 */
export interface TextMeasurement {
  /** Text width */
  width: number;
  /** Text height */
  height: number;
  /** Line height */
  lineHeight: number;
  /** Number of lines */
  lineCount: number;
  /** Individual line measurements */
  lines: Array<{
    text: string;
    width: number;
    y: number;
  }>;
  /** Bounding box */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Text overlay configuration
 */
export interface TextOverlayConfig {
  /** Text content */
  text: string;
  /** Text styling */
  style: TextStyle;
  /** Text positioning */
  position: TextPosition;
  /** Text wrapping options */
  wrap?: TextWrapOptions;
  /** Background configuration */
  background?: {
    color?: string;
    gradient?: TextGradient;
    padding?: number;
    borderRadius?: number;
    opacity?: number;
  };
  /** Animation configuration */
  animation?: {
    type: 'none' | 'fadeIn' | 'slideIn' | 'typewriter' | 'pulse';
    duration?: number;
    delay?: number;
    easing?: (t: number) => number;
  };
}

/**
 * Default text style
 */
export const DEFAULT_TEXT_STYLE: Required<Omit<TextStyle, 'decoration' | 'shadow' | 'outline' | 'gradient'>> = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  textAlign: TextAlign.Left,
  textBaseline: TextBaseline.Top,
  lineHeight: 1.2,
  letterSpacing: 0,
  opacity: 1,
  textTransform: 'none'
};

/**
 * Text overlay renderer class
 */
export class TextOverlayRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(managedCanvas: ManagedCanvas) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
  }

  /**
   * Apply text transform
   */
  private applyTextTransform(text: string, transform: TextStyle['textTransform']): string {
    switch (transform) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text.replace(/\b\w/g, l => l.toUpperCase());
      default:
        return text;
    }
  }

  /**
   * Build font string from style
   */
  private buildFontString(style: TextStyle): string {
    const fontStyle = style.fontStyle || DEFAULT_TEXT_STYLE.fontStyle;
    const fontWeight = style.fontWeight || DEFAULT_TEXT_STYLE.fontWeight;
    const fontSize = style.fontSize || DEFAULT_TEXT_STYLE.fontSize;
    const fontFamily = style.fontFamily || DEFAULT_TEXT_STYLE.fontFamily;
    
    return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  /**
   * Apply text styling to context
   */
  private applyTextStyle(style: TextStyle): void {
    this.ctx.font = this.buildFontString(style);
    this.ctx.textAlign = style.textAlign || DEFAULT_TEXT_STYLE.textAlign;
    this.ctx.textBaseline = style.textBaseline || DEFAULT_TEXT_STYLE.textBaseline;
    this.ctx.globalAlpha = style.opacity || DEFAULT_TEXT_STYLE.opacity;

    // Handle gradient fill
    if (style.gradient) {
      this.ctx.fillStyle = this.createTextGradient(style.gradient);
    } else {
      this.ctx.fillStyle = style.color || DEFAULT_TEXT_STYLE.color;
    }

    // Handle outline
    if (style.outline) {
      this.ctx.strokeStyle = style.outline.color;
      this.ctx.lineWidth = style.outline.width;
    }
  }

  /**
   * Create gradient for text
   */
  private createTextGradient(gradient: TextGradient): CanvasGradient {
    let canvasGradient: CanvasGradient;

    if (gradient.type === 'linear') {
      canvasGradient = this.ctx.createLinearGradient(
        gradient.x1 || 0,
        gradient.y1 || 0,
        gradient.x2 || 100,
        gradient.y2 || 0
      );
    } else {
      canvasGradient = this.ctx.createRadialGradient(
        gradient.x1 || 0,
        gradient.y1 || 0,
        gradient.r1 || 0,
        gradient.x2 || 0,
        gradient.y2 || 0,
        gradient.r2 || 100
      );
    }

    gradient.colors.forEach(stop => {
      canvasGradient.addColorStop(stop.offset, stop.color);
    });

    return canvasGradient;
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, maxWidth: number, style: TextStyle, wrapOptions?: TextWrapOptions): string[] {
    if (!wrapOptions?.enabled || !maxWidth) {
      return [text];
    }

    this.applyTextStyle(style);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        // Handle long words
        if (wrapOptions.breakWords && this.ctx.measureText(currentLine).width > maxWidth) {
          const chars = currentLine.split('');
          let charLine = '';
          
          for (const char of chars) {
            const testCharLine = charLine + char;
            if (this.ctx.measureText(testCharLine).width > maxWidth && charLine) {
              lines.push(charLine);
              charLine = char;
            } else {
              charLine = testCharLine;
            }
          }
          currentLine = charLine;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Measure text dimensions
   */
  measureText(text: string, style: TextStyle, position: TextPosition, wrapOptions?: TextWrapOptions): TextMeasurement {
    this.applyTextStyle(style);
    
    const transformedText = this.applyTextTransform(text, style.textTransform);
    const lines = this.wrapText(transformedText, position.maxWidth || 0, style, wrapOptions);
    const lineHeight = (style.fontSize || DEFAULT_TEXT_STYLE.fontSize) * (style.lineHeight || DEFAULT_TEXT_STYLE.lineHeight);
    
    let maxWidth = 0;
    const lineData = lines.map((line, index) => {
      const metrics = this.ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
      
      return {
        text: line,
        width: metrics.width,
        y: index * lineHeight
      };
    });

    const totalHeight = lines.length * lineHeight;
    
    // Calculate bounding box based on anchor
    const anchor = position.anchor || { x: 'left', y: 'top' };
    let boundingX = position.x;
    let boundingY = position.y;
    
    if (anchor.x === 'center') {
      boundingX -= maxWidth / 2;
    } else if (anchor.x === 'right') {
      boundingX -= maxWidth;
    }
    
    if (anchor.y === 'middle') {
      boundingY -= totalHeight / 2;
    } else if (anchor.y === 'bottom') {
      boundingY -= totalHeight;
    }

    return {
      width: maxWidth,
      height: totalHeight,
      lineHeight,
      lineCount: lines.length,
      lines: lineData,
      boundingBox: {
        x: boundingX,
        y: boundingY,
        width: maxWidth,
        height: totalHeight
      }
    };
  }

  /**
   * Draw text shadow
   */
  private drawTextShadow(text: string, x: number, y: number, shadow: TextShadow): void {
    this.ctx.save();
    this.ctx.shadowColor = shadow.color;
    this.ctx.shadowOffsetX = shadow.offsetX;
    this.ctx.shadowOffsetY = shadow.offsetY;
    this.ctx.shadowBlur = shadow.blur;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * Draw text decoration (underline, overline, strikethrough)
   */
  private drawTextDecoration(text: string, x: number, y: number, width: number, style: TextStyle): void {
    if (!style.decoration) return;

    const fontSize = style.fontSize || DEFAULT_TEXT_STYLE.fontSize;
    const thickness = style.decoration.thickness || 1;
    const color = style.decoration.color || style.color || DEFAULT_TEXT_STYLE.color;

    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = thickness;
    this.ctx.beginPath();

    if (style.decoration.underline) {
      const underlineY = y + fontSize * 0.1;
      this.ctx.moveTo(x, underlineY);
      this.ctx.lineTo(x + width, underlineY);
    }

    if (style.decoration.overline) {
      const overlineY = y - fontSize * 0.8;
      this.ctx.moveTo(x, overlineY);
      this.ctx.lineTo(x + width, overlineY);
    }

    if (style.decoration.lineThrough) {
      const lineThroughY = y - fontSize * 0.3;
      this.ctx.moveTo(x, lineThroughY);
      this.ctx.lineTo(x + width, lineThroughY);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Draw background for text
   */
  private drawTextBackground(measurement: TextMeasurement, background: NonNullable<TextOverlayConfig['background']>): void {
    const padding = background.padding || 0;
    const x = measurement.boundingBox.x - padding;
    const y = measurement.boundingBox.y - padding;
    const width = measurement.boundingBox.width + padding * 2;
    const height = measurement.boundingBox.height + padding * 2;

    this.ctx.save();
    this.ctx.globalAlpha = background.opacity || 1;

    if (background.gradient) {
      this.ctx.fillStyle = this.createTextGradient(background.gradient);
    } else {
      this.ctx.fillStyle = background.color || 'rgba(255, 255, 255, 0.8)';
    }

    if (background.borderRadius) {
      this.drawRoundedRect(x, y, width, height, background.borderRadius);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(x, y, width, height);
    }

    this.ctx.restore();
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
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
   * Render text overlay
   */
  renderText(config: TextOverlayConfig): TextMeasurement {
    const { text, style, position, wrap, background } = config;
    
    this.ctx.save();
    
    // Apply rotation if specified
    if (position.rotation) {
      this.ctx.translate(position.x, position.y);
      this.ctx.rotate(position.rotation);
      this.ctx.translate(-position.x, -position.y);
    }

    // Measure text
    const measurement = this.measureText(text, style, position, wrap);

    // Draw background if specified
    if (background) {
      this.drawTextBackground(measurement, background);
    }

    // Apply text styling
    this.applyTextStyle(style);

    // Calculate starting position based on anchor
    const anchor = position.anchor || { x: 'left', y: 'top' };
    let startX = position.x;
    let startY = position.y;

    if (anchor.x === 'center') {
      startX -= measurement.width / 2;
    } else if (anchor.x === 'right') {
      startX -= measurement.width;
    }

    if (anchor.y === 'middle') {
      startY -= measurement.height / 2;
    } else if (anchor.y === 'bottom') {
      startY -= measurement.height;
    }

    // Draw each line
    measurement.lines.forEach((line, index) => {
      const lineX = startX;
      const lineY = startY + line.y;

      // Adjust line position based on text alignment
      let adjustedX = lineX;
      if (style.textAlign === TextAlign.Center) {
        adjustedX = startX + (measurement.width - line.width) / 2;
      } else if (style.textAlign === TextAlign.Right) {
        adjustedX = startX + measurement.width - line.width;
      }

      // Draw shadow first if specified
      if (style.shadow) {
        this.drawTextShadow(line.text, adjustedX, lineY, style.shadow);
      }

      // Draw text outline if specified
      if (style.outline) {
        this.ctx.strokeText(line.text, adjustedX, lineY);
      }

      // Draw main text
      this.ctx.fillText(line.text, adjustedX, lineY);

      // Draw text decoration if specified
      if (style.decoration) {
        this.drawTextDecoration(line.text, adjustedX, lineY, line.width, style);
      }
    });

    this.ctx.restore();
    return measurement;
  }

  /**
   * Clear text from specific area
   */
  clearText(measurement: TextMeasurement, padding: number = 0): void {
    const { x, y, width, height } = measurement.boundingBox;
    this.ctx.clearRect(
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2
    );
  }
}

/**
 * Text overlay utilities
 */
export class TextOverlayUtils {
  /**
   * Calculate optimal font size to fit text in area
   */
  static calculateOptimalFontSize(
    text: string,
    maxWidth: number,
    maxHeight: number,
    style: TextStyle,
    canvas: HTMLCanvasElement
  ): number {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    let fontSize = style.fontSize || 16;
    const testStyle = { ...style, fontSize };
    
    // Binary search for optimal font size
    let minSize = 1;
    let maxSize = 200;

    while (minSize < maxSize - 1) {
      fontSize = Math.floor((minSize + maxSize) / 2);
      testStyle.fontSize = fontSize;
      
      ctx.font = `${testStyle.fontStyle || 'normal'} ${testStyle.fontWeight || 'normal'} ${fontSize}px ${testStyle.fontFamily || 'Arial'}`;
      const metrics = ctx.measureText(text);
      const textHeight = fontSize * (testStyle.lineHeight || 1.2);

      if (metrics.width <= maxWidth && textHeight <= maxHeight) {
        minSize = fontSize;
      } else {
        maxSize = fontSize;
      }
    }

    return minSize;
  }

  /**
   * Create text preset configurations
   */
  static createPresets() {
    return {
      title: {
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 32,
          fontWeight: 'bold',
          color: '#2c3e50'
        }
      },
      subtitle: {
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 24,
          fontWeight: '600',
          color: '#34495e'
        }
      },
      body: {
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 16,
          color: '#2c3e50',
          lineHeight: 1.5
        }
      },
      caption: {
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 12,
          color: '#7f8c8d',
          fontStyle: 'italic'
        }
      },
      watermark: {
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.7)',
          shadow: {
            color: 'rgba(0, 0, 0, 0.3)',
            offsetX: 1,
            offsetY: 1,
            blur: 2
          }
        }
      }
    };
  }
}

/**
 * Factory function to create text overlay renderer
 */
export function createTextOverlayRenderer(managedCanvas: ManagedCanvas): TextOverlayRenderer {
  return new TextOverlayRenderer(managedCanvas);
}