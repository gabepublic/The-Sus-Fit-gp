// Undo/Redo Stack Management for Image Editing
// Immutable state management for tracking and reverting image editing operations

import type { ManagedCanvas } from '../providers/CanvasProvider';

/**
 * Operation types that can be undone/redone
 */
export enum OperationType {
  IMAGE_LOAD = 'image_load',
  IMAGE_RESIZE = 'image_resize',
  FILTER_APPLY = 'filter_apply',
  TEXT_ADD = 'text_add',
  TEXT_EDIT = 'text_edit',
  TEXT_REMOVE = 'text_remove',
  STICKER_ADD = 'sticker_add',
  STICKER_MOVE = 'sticker_move',
  STICKER_SCALE = 'sticker_scale',
  STICKER_ROTATE = 'sticker_rotate',
  STICKER_REMOVE = 'sticker_remove',
  CANVAS_CLEAR = 'canvas_clear',
  COMPOSITE_OPERATION = 'composite_operation'
}

/**
 * Base operation interface
 */
export interface BaseOperation {
  id: string;
  type: OperationType;
  timestamp: number;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Canvas snapshot for state preservation
 */
export interface CanvasSnapshot {
  imageData: ImageData;
  width: number;
  height: number;
  timestamp: number;
  compressed?: boolean;
  compressionLevel?: number;
}

/**
 * Operation with state data
 */
export interface Operation extends BaseOperation {
  /** State before the operation */
  beforeState: CanvasSnapshot;
  /** State after the operation */
  afterState: CanvasSnapshot;
  /** Additional operation-specific data */
  operationData?: Record<string, unknown>;
  /** Memory usage in bytes */
  memoryUsage?: number;
}

/**
 * Composite operation containing multiple sub-operations
 */
export interface CompositeOperation extends BaseOperation {
  operations: Operation[];
  beforeState: CanvasSnapshot;
  afterState: CanvasSnapshot;
}

/**
 * Undo/Redo stack configuration
 */
export interface UndoRedoConfig {
  /** Maximum number of operations to keep in history */
  maxHistorySize: number;
  /** Enable automatic snapshot compression */
  enableCompression: boolean;
  /** Compression quality (0-1) */
  compressionQuality: number;
  /** Memory usage limit in MB */
  memoryLimit: number;
  /** Auto-cleanup threshold in minutes */
  autoCleanupThreshold: number;
  /** Enable performance monitoring */
  enablePerfMonitoring: boolean;
}

/**
 * Undo/Redo stack state
 */
export interface UndoRedoState {
  /** Current position in the stack */
  currentIndex: number;
  /** Operations stack */
  operations: (Operation | CompositeOperation)[];
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
  /** Total memory usage */
  memoryUsage: number;
  /** Stack statistics */
  stats: {
    totalOperations: number;
    undoCount: number;
    redoCount: number;
    memoryPeakUsage: number;
    lastCleanup: number;
  };
}

/**
 * Performance metrics for operations
 */
export interface OperationPerformance {
  executionTime: number;
  memoryBefore: number;
  memoryAfter: number;
  snapshotTime: number;
  compressionTime?: number;
  compressionRatio?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_UNDO_REDO_CONFIG: UndoRedoConfig = {
  maxHistorySize: 50,
  enableCompression: true,
  compressionQuality: 0.8,
  memoryLimit: 100, // 100MB
  autoCleanupThreshold: 30, // 30 minutes
  enablePerfMonitoring: true
};

/**
 * Undo/Redo stack manager
 */
export class UndoRedoManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: UndoRedoConfig;
  private state: UndoRedoState;
  private currentComposite: CompositeOperation | null = null;
  private lastSnapshot: CanvasSnapshot | null = null;

  constructor(managedCanvas: ManagedCanvas, config: Partial<UndoRedoConfig> = {}) {
    this.canvas = managedCanvas.canvas;
    this.ctx = managedCanvas.context;
    this.config = { ...DEFAULT_UNDO_REDO_CONFIG, ...config };
    this.state = {
      currentIndex: -1,
      operations: [],
      canUndo: false,
      canRedo: false,
      memoryUsage: 0,
      stats: {
        totalOperations: 0,
        undoCount: 0,
        redoCount: 0,
        memoryPeakUsage: 0,
        lastCleanup: Date.now()
      }
    };

    // Setup automatic cleanup
    if (this.config.autoCleanupThreshold > 0) {
      this.setupAutoCleanup();
    }
  }

  /**
   * Create canvas snapshot
   */
  private createSnapshot(compress: boolean = false): CanvasSnapshot {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    const snapshot: CanvasSnapshot = {
      imageData,
      width: this.canvas.width,
      height: this.canvas.height,
      timestamp: Date.now()
    };

    // Note: Compression disabled for synchronous operation
    // if (compress) {
    //   snapshot = await this.compressSnapshot(snapshot);
    // }

    return snapshot;
  }

  /**
   * Compress snapshot to reduce memory usage
   */
  private async compressSnapshot(snapshot: CanvasSnapshot): Promise<CanvasSnapshot> {
    const startTime = performance.now();
    
    try {
      // Create temporary canvas for compression
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = snapshot.width;
      tempCanvas.height = snapshot.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        return snapshot; // Return uncompressed if context unavailable
      }
      
      // Draw image data to temporary canvas
      tempCtx.putImageData(snapshot.imageData, 0, 0);
      
      // Convert to compressed data URL
      const dataUrl = tempCanvas.toDataURL('image/jpeg', this.config.compressionQuality);
      
      // Convert back to image data (this simulates compression)
      const img = new Image();
      return new Promise<CanvasSnapshot>((resolve) => {
        img.onload = () => {
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(img, 0, 0);
          const compressedImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          const compressionTime = performance.now() - startTime;
          const originalSize = snapshot.imageData.data.length;
          const compressedSize = compressedImageData.data.length;
          
          resolve({
            imageData: compressedImageData,
            width: tempCanvas.width,
            height: tempCanvas.height,
            timestamp: snapshot.timestamp,
            compressed: true,
            compressionLevel: this.config.compressionQuality
          });
        };
        img.src = dataUrl;
      });
    } catch (error) {
      console.warn('Snapshot compression failed, using uncompressed:', error);
      return snapshot;
    }
  }

  /**
   * Calculate memory usage of snapshot
   */
  private calculateSnapshotMemory(snapshot: CanvasSnapshot): number {
    const imageDataSize = snapshot.imageData.data.length * 4; // 4 bytes per pixel (RGBA)
    const metadataSize = 100; // Approximate metadata size
    return imageDataSize + metadataSize;
  }

  /**
   * Apply snapshot to canvas
   */
  private applySnapshot(snapshot: CanvasSnapshot): void {
    // Resize canvas if needed
    if (this.canvas.width !== snapshot.width || this.canvas.height !== snapshot.height) {
      this.canvas.width = snapshot.width;
      this.canvas.height = snapshot.height;
    }

    // Apply image data
    this.ctx.putImageData(snapshot.imageData, 0, 0);
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update stack state
   */
  private updateState(): void {
    this.state.canUndo = this.state.currentIndex >= 0;
    this.state.canRedo = this.state.currentIndex < this.state.operations.length - 1;
    
    // Calculate total memory usage
    this.state.memoryUsage = this.state.operations.reduce((total, op) => {
      if ('operations' in op) {
        // Composite operation
        return total + this.calculateSnapshotMemory(op.beforeState) + 
               this.calculateSnapshotMemory(op.afterState);
      } else {
        // Regular operation
        return total + this.calculateSnapshotMemory(op.beforeState) + 
               this.calculateSnapshotMemory(op.afterState);
      }
    }, 0);

    // Update peak memory usage
    if (this.state.memoryUsage > this.state.stats.memoryPeakUsage) {
      this.state.stats.memoryPeakUsage = this.state.memoryUsage;
    }

    // Check memory limit
    if (this.state.memoryUsage > this.config.memoryLimit * 1024 * 1024) {
      this.cleanup();
    }
  }

  /**
   * Start composite operation
   */
  startCompositeOperation(description: string, metadata?: Record<string, unknown>): string {
    if (this.currentComposite) {
      throw new Error('Composite operation already in progress');
    }

    const id = this.generateOperationId();
    this.currentComposite = {
      id,
      type: OperationType.COMPOSITE_OPERATION,
      timestamp: Date.now(),
      description,
      metadata,
      operations: [],
      beforeState: this.createSnapshot(),
      afterState: this.createSnapshot() // Will be updated when completed
    };

    return id;
  }

  /**
   * End composite operation
   */
  endCompositeOperation(): void {
    if (!this.currentComposite) {
      throw new Error('No composite operation in progress');
    }

    // Update after state
    this.currentComposite.afterState = this.createSnapshot();

    // Add to operations stack if it contains sub-operations
    if (this.currentComposite.operations.length > 0) {
      this.addOperationToStack(this.currentComposite);
    }

    this.currentComposite = null;
  }

  /**
   * Add operation to stack
   */
  private addOperationToStack(operation: Operation | CompositeOperation): void {
    // Remove any operations after current index (for redo scenarios)
    this.state.operations = this.state.operations.slice(0, this.state.currentIndex + 1);

    // Add new operation
    this.state.operations.push(operation);
    this.state.currentIndex = this.state.operations.length - 1;

    // Enforce history size limit
    if (this.state.operations.length > this.config.maxHistorySize) {
      const removeCount = this.state.operations.length - this.config.maxHistorySize;
      this.state.operations.splice(0, removeCount);
      this.state.currentIndex -= removeCount;
    }

    this.state.stats.totalOperations++;
    this.updateState();
  }

  /**
   * Execute operation with automatic state tracking
   */
  executeOperation(
    type: OperationType,
    description: string,
    operationFn: () => void | Promise<void>,
    operationData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      const memoryBefore = this.state.memoryUsage;
      
      try {
        // Capture before state
        const beforeState = this.createSnapshot();
        
        // Execute the operation
        await operationFn();
        
        // Capture after state
        const afterState = this.createSnapshot();
        
        // Create operation record
        const operation: Operation = {
          id: this.generateOperationId(),
          type,
          timestamp: Date.now(),
          description,
          beforeState,
          afterState,
          operationData,
          metadata
        };

        // Calculate memory usage
        operation.memoryUsage = this.calculateSnapshotMemory(beforeState) + 
                               this.calculateSnapshotMemory(afterState);

        // Add to current composite or directly to stack
        if (this.currentComposite) {
          this.currentComposite.operations.push(operation);
        } else {
          this.addOperationToStack(operation);
        }

        // Record performance metrics
        if (this.config.enablePerfMonitoring) {
          const performance: OperationPerformance = {
            executionTime: Date.now() - startTime,
            memoryBefore,
            memoryAfter: this.state.memoryUsage,
            snapshotTime: 0 // Would be calculated in real implementation
          };
          
          if (metadata) {
            metadata.performance = performance;
          }
        }

        resolve(operation.id);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    if (!this.state.canUndo) {
      return false;
    }

    const operation = this.state.operations[this.state.currentIndex];
    this.applySnapshot(operation.beforeState);
    
    this.state.currentIndex--;
    this.state.stats.undoCount++;
    this.updateState();

    return true;
  }

  /**
   * Redo next operation
   */
  redo(): boolean {
    if (!this.state.canRedo) {
      return false;
    }

    this.state.currentIndex++;
    const operation = this.state.operations[this.state.currentIndex];
    this.applySnapshot(operation.afterState);
    
    this.state.stats.redoCount++;
    this.updateState();

    return true;
  }

  /**
   * Jump to specific operation in history
   */
  jumpToOperation(index: number): boolean {
    if (index < -1 || index >= this.state.operations.length) {
      return false;
    }

    if (index === -1) {
      // Jump to initial state (before any operations)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      const operation = this.state.operations[index];
      this.applySnapshot(operation.afterState);
    }

    this.state.currentIndex = index;
    this.updateState();

    return true;
  }

  /**
   * Clear entire history
   */
  clearHistory(): void {
    this.state.operations = [];
    this.state.currentIndex = -1;
    this.state.memoryUsage = 0;
    this.currentComposite = null;
    this.updateState();
  }

  /**
   * Cleanup old operations to free memory
   */
  cleanup(targetMemoryMB?: number): void {
    const targetMemory = (targetMemoryMB || this.config.memoryLimit * 0.7) * 1024 * 1024;
    
    while (this.state.memoryUsage > targetMemory && this.state.operations.length > 10) {
      // Remove oldest operation
      this.state.operations.shift();
      if (this.state.currentIndex > 0) {
        this.state.currentIndex--;
      }
    }

    this.state.stats.lastCleanup = Date.now();
    this.updateState();
  }

  /**
   * Setup automatic cleanup
   */
  private setupAutoCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastCleanup = now - this.state.stats.lastCleanup;
      const thresholdMs = this.config.autoCleanupThreshold * 60 * 1000;

      if (timeSinceLastCleanup > thresholdMs) {
        this.cleanup();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Get operation history
   */
  getHistory(): (Operation | CompositeOperation)[] {
    return [...this.state.operations];
  }

  /**
   * Get operation by ID
   */
  getOperation(id: string): Operation | CompositeOperation | null {
    return this.state.operations.find(op => op.id === id) || null;
  }

  /**
   * Get current state
   */
  getState(): UndoRedoState {
    return { ...this.state };
  }

  /**
   * Get configuration
   */
  getConfig(): UndoRedoConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UndoRedoConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply new limits
    if (this.state.operations.length > this.config.maxHistorySize) {
      const removeCount = this.state.operations.length - this.config.maxHistorySize;
      this.state.operations.splice(0, removeCount);
      this.state.currentIndex = Math.max(-1, this.state.currentIndex - removeCount);
    }

    this.updateState();
  }

  /**
   * Export history for persistence
   */
  exportHistory(): string {
    return JSON.stringify({
      operations: this.state.operations.map(op => ({
        ...op,
        beforeState: { ...op.beforeState, imageData: null }, // Exclude image data
        afterState: { ...op.afterState, imageData: null }
      })),
      currentIndex: this.state.currentIndex,
      stats: this.state.stats
    });
  }

  /**
   * Import history from persistence
   */
  importHistory(historyData: string): boolean {
    try {
      const data = JSON.parse(historyData);
      // Note: This is a simplified implementation
      // In practice, you'd need to restore the image data
      this.state.stats = data.stats || this.state.stats;
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }
}

/**
 * Factory function to create undo/redo manager
 */
export function createUndoRedoManager(
  managedCanvas: ManagedCanvas, 
  config?: Partial<UndoRedoConfig>
): UndoRedoManager {
  return new UndoRedoManager(managedCanvas, config);
}