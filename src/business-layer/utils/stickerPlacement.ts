// Sticker Placement System for Canvas
// Comprehensive sticker management with positioning, scaling, rotation, and layering

import type { ManagedCanvas } from '../providers/CanvasProvider';
import { BlendMode } from './canvasUtils';

/**
 * Sticker anchor points for positioning
 */
export enum StickerAnchor {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  MiddleLeft = 'middle-left',
  MiddleCenter = 'middle-center',
  MiddleRight = 'middle-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right'
}

/**
 * Sticker transformation properties
 */
export interface StickerTransform {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Scale factor (1.0 = original size) */
  scale: number;
  /** Rotation in radians */
  rotation: number;
  /** Horizontal flip */
  flipX: boolean;
  /** Vertical flip */
  flipY: boolean;
  /** Skew X in radians */
  skewX?: number;
  /** Skew Y in radians */
  skewY?: number;
}

/**
 * Sticker visual properties
 */
export interface StickerVisualProps {
  /** Opacity (0-1) */
  opacity: number;
  /** Blend mode */
  blendMode: BlendMode;
  /** Color tint overlay */
  tint?: string;
  /** Shadow configuration */
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  /** Border configuration */
  border?: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

/**
 * Sticker bounds and collision detection
 */
export interface StickerBounds {
  /** Bounding rectangle */
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Rotated corner points */
  corners: Array<{ x: number; y: number }>;
  /** Center point */
  center: { x: number; y: number };
}

/**
 * Sticker configuration
 */
export interface StickerConfig {
  /** Unique identifier */
  id: string;
  /** Sticker image source */
  imageSource: string | HTMLImageElement | HTMLCanvasElement;
  /** Original dimensions */
  originalSize: { width: number; height: number };
  /** Transform properties */
  transform: StickerTransform;
  /** Visual properties */
  visual: StickerVisualProps;
  /** Anchor point for positioning */
  anchor: StickerAnchor;
  /** Z-index for layering */
  zIndex: number;
  /** Whether sticker is locked from editing */
  locked: boolean;
  /** Whether sticker is visible */
  visible: boolean;
  /** Whether sticker maintains aspect ratio when scaling */
  maintainAspectRatio: boolean;
  /** Minimum and maximum scale limits */
  scaleConstraints?: {
    min: number;
    max: number;
  };
  /** Snap to grid configuration */
  snapToGrid?: {
    enabled: boolean;
    gridSize: number;
  };
  /** Metadata */
  metadata?: {
    name?: string;
    category?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Sticker interaction state
 */
export interface StickerInteractionState {
  /** Whether sticker is selected */
  selected: boolean;
  /** Whether sticker is being dragged */
  dragging: boolean;
  /** Whether sticker is being scaled */
  scaling: boolean;
  /** Whether sticker is being rotated */
  rotating: boolean;
  /** Interaction handles visibility */
  showHandles: boolean;
  /** Mouse/touch interaction data */
  interaction?: {
    startX: number;
    startY: number;
    initialTransform: StickerTransform;
    handle?: 'move' | 'scale' | 'rotate' | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br';
  };
}

/**
 * Sticker item with interaction state
 */
export interface Sticker extends StickerConfig {
  /** Cached image element */
  image?: HTMLImageElement;
  /** Current bounds */
  bounds?: StickerBounds;
  /** Interaction state */
  interactionState: StickerInteractionState;
}

/**
 * Grid snap configuration
 */
export interface GridSnapConfig {
  enabled: boolean;
  size: number;
  showGrid: boolean;
  gridColor: string;
  snapThreshold: number;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  hasCollision: boolean;
  collidingStickers: string[];
  suggestedPosition?: { x: number; y: number };
}

/**
 * Default sticker configuration
 */
export const DEFAULT_STICKER_CONFIG: Omit<StickerConfig, 'id' | 'imageSource' | 'originalSize'> = {
  transform: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false
  },
  visual: {
    opacity: 1,
    blendMode: BlendMode.Normal
  },
  anchor: StickerAnchor.MiddleCenter,
  zIndex: 0,
  locked: false,
  visible: true,
  maintainAspectRatio: true
};

/**
 * Sticker placement and management system
 */
export class StickerManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stickers: Map<string, Sticker> = new Map();
  private selectedStickerId: string | null = null;
  private gridConfig: GridSnapConfig = {
    enabled: false,
    size: 20,
    showGrid: false,
    gridColor: 'rgba(0, 0, 0, 0.1)',
    snapThreshold: 10
  };

  constructor(managedCanvas: ManagedCanvas) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
  }

  /**
   * Calculate sticker bounds
   */
  private calculateBounds(sticker: Sticker): StickerBounds {
    const { transform, originalSize, anchor } = sticker;
    const { x, y, scale, rotation } = transform;
    
    const width = originalSize.width * scale;
    const height = originalSize.height * scale;
    
    // Calculate anchor offset
    let anchorOffsetX = 0;
    let anchorOffsetY = 0;
    
    switch (anchor) {
      case StickerAnchor.TopLeft:
        anchorOffsetX = 0;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.TopCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.TopRight:
        anchorOffsetX = -width;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.MiddleLeft:
        anchorOffsetX = 0;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.MiddleCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.MiddleRight:
        anchorOffsetX = -width;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.BottomLeft:
        anchorOffsetX = 0;
        anchorOffsetY = -height;
        break;
      case StickerAnchor.BottomCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = -height;
        break;
      case StickerAnchor.BottomRight:
        anchorOffsetX = -width;
        anchorOffsetY = -height;
        break;
    }
    
    const centerX = x;
    const centerY = y;
    
    // Calculate corner points (before rotation)
    const corners = [
      { x: anchorOffsetX, y: anchorOffsetY }, // top-left
      { x: anchorOffsetX + width, y: anchorOffsetY }, // top-right
      { x: anchorOffsetX + width, y: anchorOffsetY + height }, // bottom-right
      { x: anchorOffsetX, y: anchorOffsetY + height } // bottom-left
    ];
    
    // Apply rotation to corners
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const rotatedCorners = corners.map(corner => ({
      x: centerX + (corner.x * cos - corner.y * sin),
      y: centerY + (corner.x * sin + corner.y * cos)
    }));
    
    // Calculate bounding rectangle
    const minX = Math.min(...rotatedCorners.map(c => c.x));
    const maxX = Math.max(...rotatedCorners.map(c => c.x));
    const minY = Math.min(...rotatedCorners.map(c => c.y));
    const maxY = Math.max(...rotatedCorners.map(c => c.y));
    
    return {
      rect: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      corners: rotatedCorners,
      center: { x: centerX, y: centerY }
    };
  }

  /**
   * Snap position to grid
   */
  private snapToGrid(x: number, y: number): { x: number; y: number } {
    if (!this.gridConfig.enabled) {
      return { x, y };
    }
    
    const { size, snapThreshold } = this.gridConfig;
    const snappedX = Math.round(x / size) * size;
    const snappedY = Math.round(y / size) * size;
    
    const deltaX = Math.abs(x - snappedX);
    const deltaY = Math.abs(y - snappedY);
    
    return {
      x: deltaX <= snapThreshold ? snappedX : x,
      y: deltaY <= snapThreshold ? snappedY : y
    };
  }

  /**
   * Load image from source
   */
  private async loadImage(source: string | HTMLImageElement | HTMLCanvasElement): Promise<HTMLImageElement> {
    if (source instanceof HTMLImageElement) {
      return source;
    }
    
    if (source instanceof HTMLCanvasElement) {
      const img = new Image();
      img.src = source.toDataURL();
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    }
    
    // String URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source;
    });
  }

  /**
   * Add sticker to canvas
   */
  async addSticker(config: Omit<StickerConfig, 'id'> & { id?: string }): Promise<string> {
    const id = config.id || `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const image = await this.loadImage(config.imageSource);
      
      const sticker: Sticker = {
        ...DEFAULT_STICKER_CONFIG,
        ...config,
        id,
        image,
        interactionState: {
          selected: false,
          dragging: false,
          scaling: false,
          rotating: false,
          showHandles: false
        }
      };
      
      // Calculate initial bounds
      sticker.bounds = this.calculateBounds(sticker);
      
      this.stickers.set(id, sticker);
      return id;
    } catch (error) {
      throw new Error(`Failed to load sticker image: ${error}`);
    }
  }

  /**
   * Remove sticker
   */
  removeSticker(id: string): boolean {
    const removed = this.stickers.delete(id);
    if (this.selectedStickerId === id) {
      this.selectedStickerId = null;
    }
    return removed;
  }

  /**
   * Update sticker configuration
   */
  updateSticker(id: string, updates: Partial<StickerConfig>): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker) return false;
    
    Object.assign(sticker, updates);
    
    // Update metadata timestamp
    if (sticker.metadata) {
      sticker.metadata.updatedAt = new Date();
    }
    
    // Recalculate bounds
    sticker.bounds = this.calculateBounds(sticker);
    
    return true;
  }

  /**
   * Get sticker by ID
   */
  getSticker(id: string): Sticker | undefined {
    return this.stickers.get(id);
  }

  /**
   * Get all stickers sorted by z-index
   */
  getAllStickers(): Sticker[] {
    return Array.from(this.stickers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Select sticker
   */
  selectSticker(id: string | null): void {
    // Deselect previous sticker
    if (this.selectedStickerId) {
      const prevSticker = this.stickers.get(this.selectedStickerId);
      if (prevSticker) {
        prevSticker.interactionState.selected = false;
        prevSticker.interactionState.showHandles = false;
      }
    }
    
    this.selectedStickerId = id;
    
    // Select new sticker
    if (id) {
      const sticker = this.stickers.get(id);
      if (sticker && !sticker.locked) {
        sticker.interactionState.selected = true;
        sticker.interactionState.showHandles = true;
      }
    }
  }

  /**
   * Move sticker to position
   */
  moveStickerTo(id: string, x: number, y: number): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker || sticker.locked) return false;
    
    const snapped = this.snapToGrid(x, y);
    sticker.transform.x = snapped.x;
    sticker.transform.y = snapped.y;
    sticker.bounds = this.calculateBounds(sticker);
    
    return true;
  }

  /**
   * Scale sticker
   */
  scaleSticker(id: string, scale: number, maintainAspectRatio?: boolean): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker || sticker.locked) return false;
    
    // Apply scale constraints
    if (sticker.scaleConstraints) {
      scale = Math.max(sticker.scaleConstraints.min, Math.min(sticker.scaleConstraints.max, scale));
    }
    
    sticker.transform.scale = scale;
    sticker.bounds = this.calculateBounds(sticker);
    
    return true;
  }

  /**
   * Rotate sticker
   */
  rotateSticker(id: string, rotation: number): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker || sticker.locked) return false;
    
    // Normalize rotation to 0-2π range
    sticker.transform.rotation = rotation % (2 * Math.PI);
    sticker.bounds = this.calculateBounds(sticker);
    
    return true;
  }

  /**
   * Flip sticker
   */
  flipSticker(id: string, flipX?: boolean, flipY?: boolean): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker || sticker.locked) return false;
    
    if (flipX !== undefined) sticker.transform.flipX = flipX;
    if (flipY !== undefined) sticker.transform.flipY = flipY;
    sticker.bounds = this.calculateBounds(sticker);
    
    return true;
  }

  /**
   * Set sticker z-index
   */
  setStickerZIndex(id: string, zIndex: number): boolean {
    const sticker = this.stickers.get(id);
    if (!sticker) return false;
    
    sticker.zIndex = zIndex;
    return true;
  }

  /**
   * Bring sticker to front
   */
  bringToFront(id: string): boolean {
    const maxZ = Math.max(0, ...Array.from(this.stickers.values()).map(s => s.zIndex));
    return this.setStickerZIndex(id, maxZ + 1);
  }

  /**
   * Send sticker to back
   */
  sendToBack(id: string): boolean {
    const minZ = Math.min(0, ...Array.from(this.stickers.values()).map(s => s.zIndex));
    return this.setStickerZIndex(id, minZ - 1);
  }

  /**
   * Check collision between stickers
   */
  checkCollisions(excludeId?: string): CollisionResult {
    const stickers = this.getAllStickers().filter(s => s.id !== excludeId && s.visible);
    const collidingStickers: string[] = [];
    
    for (let i = 0; i < stickers.length; i++) {
      for (let j = i + 1; j < stickers.length; j++) {
        const a = stickers[i];
        const b = stickers[j];
        
        if (!a.bounds || !b.bounds) continue;
        
        // Simple bounding box collision detection
        const aRect = a.bounds.rect;
        const bRect = b.bounds.rect;
        
        if (aRect.x < bRect.x + bRect.width &&
            aRect.x + aRect.width > bRect.x &&
            aRect.y < bRect.y + bRect.height &&
            aRect.y + aRect.height > bRect.y) {
          
          if (!collidingStickers.includes(a.id)) collidingStickers.push(a.id);
          if (!collidingStickers.includes(b.id)) collidingStickers.push(b.id);
        }
      }
    }
    
    return {
      hasCollision: collidingStickers.length > 0,
      collidingStickers
    };
  }

  /**
   * Find sticker at position
   */
  getStickerAtPosition(x: number, y: number): string | null {
    const stickers = this.getAllStickers()
      .filter(s => s.visible)
      .reverse(); // Check from top to bottom
    
    for (const sticker of stickers) {
      if (!sticker.bounds) continue;
      
      const { rect } = sticker.bounds;
      if (x >= rect.x && x <= rect.x + rect.width &&
          y >= rect.y && y <= rect.y + rect.height) {
        return sticker.id;
      }
    }
    
    return null;
  }

  /**
   * Render grid
   */
  private renderGrid(): void {
    if (!this.gridConfig.enabled || !this.gridConfig.showGrid) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = this.gridConfig.gridColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    
    const { size } = this.gridConfig;
    const { width, height } = this.canvas;
    
    // Vertical lines
    for (let x = 0; x <= width; x += size) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += size) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Render sticker with all transforms
   */
  private renderSticker(sticker: Sticker): void {
    if (!sticker.visible || !sticker.image) return;
    
    const { transform, visual, originalSize } = sticker;
    const { x, y, scale, rotation, flipX, flipY } = transform;
    
    this.ctx.save();
    
    // Apply global alpha and blend mode
    this.ctx.globalAlpha = visual.opacity;
    this.ctx.globalCompositeOperation = visual.blendMode;
    
    // Apply shadow if configured
    if (visual.shadow) {
      this.ctx.shadowColor = visual.shadow.color;
      this.ctx.shadowOffsetX = visual.shadow.offsetX;
      this.ctx.shadowOffsetY = visual.shadow.offsetY;
      this.ctx.shadowBlur = visual.shadow.blur;
    }
    
    // Transform context
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.scale(flipX ? -scale : scale, flipY ? -scale : scale);
    
    const width = originalSize.width;
    const height = originalSize.height;
    
    // Apply anchor offset
    let anchorOffsetX = 0;
    let anchorOffsetY = 0;
    
    switch (sticker.anchor) {
      case StickerAnchor.TopLeft:
        anchorOffsetX = 0;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.TopCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.TopRight:
        anchorOffsetX = -width;
        anchorOffsetY = 0;
        break;
      case StickerAnchor.MiddleLeft:
        anchorOffsetX = 0;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.MiddleCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.MiddleRight:
        anchorOffsetX = -width;
        anchorOffsetY = -height / 2;
        break;
      case StickerAnchor.BottomLeft:
        anchorOffsetX = 0;
        anchorOffsetY = -height;
        break;
      case StickerAnchor.BottomCenter:
        anchorOffsetX = -width / 2;
        anchorOffsetY = -height;
        break;
      case StickerAnchor.BottomRight:
        anchorOffsetX = -width;
        anchorOffsetY = -height;
        break;
    }
    
    // Draw the sticker
    this.ctx.drawImage(sticker.image, anchorOffsetX, anchorOffsetY, width, height);
    
    // Apply tint overlay
    if (visual.tint) {
      this.ctx.globalCompositeOperation = 'source-atop';
      this.ctx.fillStyle = visual.tint;
      this.ctx.fillRect(anchorOffsetX, anchorOffsetY, width, height);
    }
    
    this.ctx.restore();
    
    // Draw border if configured
    if (visual.border && sticker.bounds) {
      this.ctx.save();
      this.ctx.strokeStyle = visual.border.color;
      this.ctx.lineWidth = visual.border.width;
      
      if (visual.border.style === 'dashed') {
        this.ctx.setLineDash([5, 5]);
      } else if (visual.border.style === 'dotted') {
        this.ctx.setLineDash([2, 2]);
      }
      
      const { corners } = sticker.bounds;
      this.ctx.beginPath();
      this.ctx.moveTo(corners[0].x, corners[0].y);
      corners.forEach(corner => this.ctx.lineTo(corner.x, corner.y));
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  /**
   * Render selection handles
   */
  private renderSelectionHandles(sticker: Sticker): void {
    if (!sticker.interactionState.showHandles || !sticker.bounds) return;
    
    const { corners, center } = sticker.bounds;
    const handleSize = 8;
    const handleColor = '#4A90E2';
    const handleBorderColor = '#FFFFFF';
    
    this.ctx.save();
    
    // Draw corner handles
    corners.forEach(corner => {
      this.ctx.fillStyle = handleColor;
      this.ctx.strokeStyle = handleBorderColor;
      this.ctx.lineWidth = 2;
      
      this.ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
    
    // Draw rotation handle
    const rotationHandleY = corners[0].y - 30;
    this.ctx.beginPath();
    this.ctx.arc(center.x, rotationHandleY, handleSize / 2, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.fill();
    this.ctx.strokeStyle = handleBorderColor;
    this.ctx.stroke();
    
    // Draw line to rotation handle
    this.ctx.beginPath();
    this.ctx.moveTo(center.x, corners[0].y);
    this.ctx.lineTo(center.x, rotationHandleY);
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * Render all stickers
   */
  renderAllStickers(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render grid
    this.renderGrid();
    
    // Render stickers in z-index order
    const sortedStickers = this.getAllStickers();
    
    sortedStickers.forEach(sticker => {
      this.renderSticker(sticker);
      
      // Render selection handles for selected sticker
      if (sticker.interactionState.selected) {
        this.renderSelectionHandles(sticker);
      }
    });
  }

  /**
   * Configure grid settings
   */
  setGridConfig(config: Partial<GridSnapConfig>): void {
    Object.assign(this.gridConfig, config);
  }

  /**
   * Get grid configuration
   */
  getGridConfig(): GridSnapConfig {
    return { ...this.gridConfig };
  }

  /**
   * Export stickers data
   */
  exportStickers(): StickerConfig[] {
    return this.getAllStickers().map(sticker => {
      const { image, bounds, interactionState, ...config } = sticker;
      return config;
    });
  }

  /**
   * Import stickers data
   */
  async importStickers(stickers: StickerConfig[]): Promise<string[]> {
    const importedIds: string[] = [];
    
    for (const stickerConfig of stickers) {
      try {
        const id = await this.addSticker(stickerConfig);
        importedIds.push(id);
      } catch (error) {
        console.error(`Failed to import sticker ${stickerConfig.id}:`, error);
      }
    }
    
    return importedIds;
  }

  /**
   * Clear all stickers
   */
  clearAllStickers(): void {
    this.stickers.clear();
    this.selectedStickerId = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

/**
 * Factory function to create sticker manager
 */
export function createStickerManager(managedCanvas: ManagedCanvas): StickerManager {
  return new StickerManager(managedCanvas);
}