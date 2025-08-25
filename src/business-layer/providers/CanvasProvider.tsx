'use client';

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

/**
 * Canvas instance with metadata
 */
export interface ManagedCanvas {
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** 2D rendering context */
  context: CanvasRenderingContext2D;
  /** Unique identifier for this canvas */
  id: string;
  /** Canvas dimensions */
  dimensions: { width: number; height: number };
  /** Device pixel ratio for high-DPI displays */
  pixelRatio: number;
  /** Whether the canvas is currently in use */
  inUse: boolean;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Canvas pool for efficient canvas management
 */
export interface CanvasPool {
  /** Get or create a canvas with specified dimensions */
  getCanvas: (width: number, height: number, id?: string) => ManagedCanvas;
  /** Return a canvas to the pool */
  releaseCanvas: (id: string) => void;
  /** Clear all canvases from the pool */
  clearPool: () => void;
  /** Get canvas by ID */
  getCanvasById: (id: string) => ManagedCanvas | null;
  /** Get all active canvases */
  getActiveCanvases: () => ManagedCanvas[];
}

/**
 * Canvas utilities for common operations
 */
export interface CanvasUtils {
  /** Create canvas with proper device pixel ratio setup */
  createCanvas: (width: number, height: number) => HTMLCanvasElement;
  /** Get 2D context with error handling */
  getContext2D: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D;
  /** Load image onto canvas */
  loadImageToCanvas: (canvas: HTMLCanvasElement, imageUrl: string) => Promise<void>;
  /** Convert canvas to data URL with options */
  canvasToDataURL: (canvas: HTMLCanvasElement, format?: string, quality?: number) => string;
  /** Clear canvas */
  clearCanvas: (canvas: HTMLCanvasElement) => void;
  /** Resize canvas maintaining content */
  resizeCanvas: (canvas: HTMLCanvasElement, newWidth: number, newHeight: number) => void;
  /** Clone canvas content to new canvas */
  cloneCanvas: (sourceCanvas: HTMLCanvasElement) => HTMLCanvasElement;
}

/**
 * Canvas context interface
 */
export interface CanvasContextValue {
  /** Canvas pool for efficient management */
  pool: CanvasPool;
  /** Canvas utilities */
  utils: CanvasUtils;
  /** Current device pixel ratio */
  devicePixelRatio: number;
  /** Whether canvas is supported */
  isSupported: boolean;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

/**
 * Canvas provider component props
 */
export interface CanvasProviderProps {
  children: React.ReactNode;
  /** Maximum number of canvases to keep in pool */
  maxPoolSize?: number;
  /** Whether to enable high-DPI support */
  enableHighDPI?: boolean;
}

/**
 * Canvas provider component that manages canvas instances and utilities
 */
export function CanvasProvider({ 
  children, 
  maxPoolSize = 10,
  enableHighDPI = true 
}: CanvasProviderProps): React.JSX.Element {
  const canvasPoolRef = useRef<Map<string, ManagedCanvas>>(new Map());
  const devicePixelRatio = enableHighDPI ? window.devicePixelRatio || 1 : 1;

  // Check canvas support
  const isSupported = useCallback(() => {
    try {
      const testCanvas = document.createElement('canvas');
      return !!(testCanvas.getContext && testCanvas.getContext('2d'));
    } catch {
      return false;
    }
  }, []);

  // Canvas utilities implementation
  const utils: CanvasUtils = {
    createCanvas: useCallback((width: number, height: number) => {
      const canvas = document.createElement('canvas');
      
      // Set display size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Set actual size for high-DPI
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      
      // Scale context for high-DPI
      const ctx = canvas.getContext('2d');
      if (ctx && devicePixelRatio !== 1) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      
      return canvas;
    }, [devicePixelRatio]),

    getContext2D: useCallback((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context from canvas');
      }
      return ctx;
    }, []),

    loadImageToCanvas: useCallback((canvas: HTMLCanvasElement, imageUrl: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const ctx = utils.getContext2D(canvas);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
            resolve();
          } catch (error) {
            reject(new Error(`Failed to draw image to canvas: ${error}`));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      });
    }, [devicePixelRatio]),

    canvasToDataURL: useCallback((canvas: HTMLCanvasElement, format = 'image/png', quality = 0.9) => {
      return canvas.toDataURL(format, quality);
    }, []),

    clearCanvas: useCallback((canvas: HTMLCanvasElement) => {
      const ctx = utils.getContext2D(canvas);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []),

    resizeCanvas: useCallback((canvas: HTMLCanvasElement, newWidth: number, newHeight: number) => {
      // Save current content
      const imageData = canvas.toDataURL();
      
      // Resize canvas
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      canvas.width = newWidth * devicePixelRatio;
      canvas.height = newHeight * devicePixelRatio;
      
      // Scale context for high-DPI
      const ctx = utils.getContext2D(canvas);
      if (devicePixelRatio !== 1) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      
      // Restore content
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      };
      img.src = imageData;
    }, [devicePixelRatio]),

    cloneCanvas: useCallback((sourceCanvas: HTMLCanvasElement) => {
      const clone = utils.createCanvas(
        sourceCanvas.width / devicePixelRatio,
        sourceCanvas.height / devicePixelRatio
      );
      const cloneCtx = utils.getContext2D(clone);
      cloneCtx.drawImage(sourceCanvas, 0, 0);
      return clone;
    }, [])
  };

  // Canvas pool implementation
  const pool: CanvasPool = {
    getCanvas: useCallback((width: number, height: number, id?: string) => {
      const canvasId = id || `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if canvas with this ID already exists
      const existing = canvasPoolRef.current.get(canvasId);
      if (existing && !existing.inUse) {
        // Resize existing canvas if dimensions don't match
        if (existing.dimensions.width !== width || existing.dimensions.height !== height) {
          utils.resizeCanvas(existing.canvas, width, height);
          existing.dimensions = { width, height };
        }
        existing.inUse = true;
        return existing;
      }

      // Create new canvas
      const canvas = utils.createCanvas(width, height);
      const context = utils.getContext2D(canvas);
      
      const managedCanvas: ManagedCanvas = {
        canvas,
        context,
        id: canvasId,
        dimensions: { width, height },
        pixelRatio: devicePixelRatio,
        inUse: true,
        createdAt: Date.now()
      };

      // Add to pool, removing oldest if at capacity
      if (canvasPoolRef.current.size >= maxPoolSize) {
        const oldestEntry = Array.from(canvasPoolRef.current.entries())
          .filter(([, canvas]) => !canvas.inUse)
          .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
        
        if (oldestEntry) {
          canvasPoolRef.current.delete(oldestEntry[0]);
        }
      }

      canvasPoolRef.current.set(canvasId, managedCanvas);
      return managedCanvas;
    }, [maxPoolSize, devicePixelRatio]),

    releaseCanvas: useCallback((id: string) => {
      const canvas = canvasPoolRef.current.get(id);
      if (canvas) {
        canvas.inUse = false;
        // Clear the canvas for reuse
        utils.clearCanvas(canvas.canvas);
      }
    }, []),

    clearPool: useCallback(() => {
      canvasPoolRef.current.clear();
    }, []),

    getCanvasById: useCallback((id: string) => {
      return canvasPoolRef.current.get(id) || null;
    }, []),

    getActiveCanvases: useCallback(() => {
      return Array.from(canvasPoolRef.current.values()).filter(canvas => canvas.inUse);
    }, [])
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pool.clearPool();
    };
  }, []);

  const contextValue: CanvasContextValue = {
    pool,
    utils,
    devicePixelRatio,
    isSupported: isSupported()
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
}

/**
 * Hook to access canvas context
 */
export function useCanvas(): CanvasContextValue {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

/**
 * Hook to get a managed canvas instance
 */
export function useManagedCanvas(
  width: number,
  height: number,
  id?: string
): ManagedCanvas {
  const { pool } = useCanvas();
  
  const canvasRef = useRef<ManagedCanvas | null>(null);
  
  useEffect(() => {
    // Get canvas on mount
    canvasRef.current = pool.getCanvas(width, height, id);
    
    // Release canvas on unmount
    return () => {
      if (canvasRef.current) {
        pool.releaseCanvas(canvasRef.current.id);
      }
    };
  }, [width, height, id, pool]);
  
  if (!canvasRef.current) {
    throw new Error('Canvas not initialized');
  }
  
  return canvasRef.current;
}

/**
 * Hook for canvas utilities
 */
export function useCanvasUtils(): CanvasUtils {
  const { utils } = useCanvas();
  return utils;
}