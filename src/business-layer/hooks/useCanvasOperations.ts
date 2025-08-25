'use client';

// Canvas Operations Hooks
// React hooks for common canvas operations and patterns

import { useCallback, useRef, useEffect, useState } from 'react';
import { 
  useCanvas, 
  useManagedCanvas, 
  type ManagedCanvas 
} from '../providers/CanvasProvider';
import { 
  AdvancedCanvasOperations,
  CanvasAnimationUtils,
  CanvasPerformanceUtils,
  createAdvancedCanvasOperations,
  createCanvasAnimationUtils,
  BlendMode,
  type CanvasState
} from '../utils/canvasUtils';

/**
 * Hook for advanced canvas operations
 */
export function useAdvancedCanvasOperations(
  width: number,
  height: number,
  canvasId?: string
): {
  canvas: ManagedCanvas;
  operations: AdvancedCanvasOperations;
  saveState: () => CanvasState;
  restoreState: (state: CanvasState) => void;
  clear: () => void;
} {
  const canvas = useManagedCanvas(width, height, canvasId);
  const operationsRef = useRef<AdvancedCanvasOperations | undefined>(undefined);
  
  if (!operationsRef.current) {
    operationsRef.current = createAdvancedCanvasOperations(canvas);
  }

  const saveState = useCallback(() => {
    return operationsRef.current!.saveState();
  }, []);

  const restoreState = useCallback((state: CanvasState) => {
    operationsRef.current!.restoreState(state);
  }, []);

  const clear = useCallback(() => {
    canvas.context.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
  }, [canvas]);

  return {
    canvas,
    operations: operationsRef.current,
    saveState,
    restoreState,
    clear
  };
}

/**
 * Hook for canvas animation support
 */
export function useCanvasAnimation(): {
  isRunning: boolean;
  startAnimation: (callback: (timestamp: number) => void) => void;
  stopAnimation: () => void;
  animateProperty: (
    from: number,
    to: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) => (() => void);
} {
  const [isRunning, setIsRunning] = useState(false);
  const animationUtilsRef = useRef<CanvasAnimationUtils | undefined>(undefined);

  if (!animationUtilsRef.current) {
    animationUtilsRef.current = createCanvasAnimationUtils();
  }

  const startAnimation = useCallback((callback: (timestamp: number) => void) => {
    animationUtilsRef.current!.startAnimation(callback);
    setIsRunning(true);
  }, []);

  const stopAnimation = useCallback(() => {
    animationUtilsRef.current!.stopAnimation();
    setIsRunning(false);
  }, []);

  const animateProperty = useCallback((
    from: number,
    to: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) => {
    return CanvasAnimationUtils.animateProperty(
      from, to, duration, easing, onUpdate, 
      () => {
        onComplete?.();
        setIsRunning(false);
      }
    );
  }, []);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    isRunning,
    startAnimation,
    stopAnimation,
    animateProperty
  };
}

/**
 * Hook for canvas state management with undo/redo functionality
 */
export function useCanvasHistory(
  canvas: ManagedCanvas,
  maxHistorySize: number = 20
): {
  canUndo: boolean;
  canRedo: boolean;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  historySize: number;
} {
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const operationsRef = useRef<AdvancedCanvasOperations>(
    createAdvancedCanvasOperations(canvas)
  );

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const saveState = useCallback(() => {
    const state = operationsRef.current.saveState();
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(state);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= maxHistorySize ? maxHistorySize - 1 : newIndex;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const newIndex = currentIndex - 1;
    const state = history[newIndex];
    
    if (state) {
      operationsRef.current.restoreState(state);
      setCurrentIndex(newIndex);
    }
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const newIndex = currentIndex + 1;
    const state = history[newIndex];
    
    if (state) {
      operationsRef.current.restoreState(state);
      setCurrentIndex(newIndex);
    }
  }, [canRedo, currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Save initial state
  useEffect(() => {
    if (history.length === 0) {
      saveState();
    }
  }, []);

  return {
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    clear,
    historySize: history.length
  };
}

/**
 * Hook for performance monitoring of canvas operations
 */
export function useCanvasPerformance(): {
  measureOperation: <T>(operation: () => T, name?: string) => T;
  debounce: <T extends (...args: unknown[]) => unknown>(func: T, wait: number) => (...args: Parameters<T>) => void;
  throttle: <T extends (...args: unknown[]) => unknown>(func: T, limit: number) => (...args: Parameters<T>) => void;
  isCanvasSizeSafe: (width: number, height: number) => boolean;
} {
  const measureOperation = useCallback(<T>(operation: () => T, name?: string) => {
    return CanvasPerformanceUtils.measureOperation(operation, name);
  }, []);

  const debounce = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, wait: number) => {
    return CanvasPerformanceUtils.debounce(func, wait);
  }, []);

  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(func: T, limit: number) => {
    return CanvasPerformanceUtils.throttle(func, limit);
  }, []);

  const isCanvasSizeSafe = useCallback((width: number, height: number) => {
    return CanvasPerformanceUtils.isCanvasSizeSafe(width, height);
  }, []);

  return {
    measureOperation,
    debounce,
    throttle,
    isCanvasSizeSafe
  };
}

/**
 * Hook for image loading and drawing on canvas
 */
export function useCanvasImageLoader(
  canvas: ManagedCanvas
): {
  loadImage: (url: string) => Promise<HTMLImageElement>;
  drawImage: (
    image: HTMLImageElement,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    blendMode?: BlendMode,
    opacity?: number
  ) => void;
  loadAndDrawImage: (
    url: string,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    blendMode?: BlendMode,
    opacity?: number
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { utils } = useCanvas();
  const operationsRef = useRef<AdvancedCanvasOperations>(
    createAdvancedCanvasOperations(canvas)
  );

  const loadImage = useCallback(async (url: string): Promise<HTMLImageElement> => {
    setIsLoading(true);
    setError(null);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      setIsLoading(false);
      return img;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading image';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  const drawImage = useCallback((
    image: HTMLImageElement,
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number,
    blendMode: BlendMode = BlendMode.Normal,
    opacity: number = 1
  ) => {
    operationsRef.current.drawImageWithBlendMode(
      image, x, y, width, height, blendMode, opacity
    );
  }, []);

  const loadAndDrawImage = useCallback(async (
    url: string,
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number,
    blendMode: BlendMode = BlendMode.Normal,
    opacity: number = 1
  ) => {
    const image = await loadImage(url);
    drawImage(image, x, y, width, height, blendMode, opacity);
  }, [loadImage, drawImage]);

  return {
    loadImage,
    drawImage,
    loadAndDrawImage,
    isLoading,
    error
  };
}

/**
 * Hook for canvas resize handling
 */
export function useCanvasResize(
  canvas: ManagedCanvas,
  maintainContent: boolean = true
): {
  resize: (newWidth: number, newHeight: number) => void;
  autoResize: (container: HTMLElement) => void;
  dimensions: { width: number; height: number };
} {
  const [dimensions, setDimensions] = useState(canvas.dimensions);
  const { utils } = useCanvas();

  const resize = useCallback((newWidth: number, newHeight: number) => {
    if (maintainContent) {
      utils.resizeCanvas(canvas.canvas, newWidth, newHeight);
    } else {
      canvas.canvas.width = newWidth;
      canvas.canvas.height = newHeight;
      canvas.canvas.style.width = `${newWidth}px`;
      canvas.canvas.style.height = `${newHeight}px`;
    }
    
    canvas.dimensions = { width: newWidth, height: newHeight };
    setDimensions({ width: newWidth, height: newHeight });
  }, [canvas, maintainContent, utils]);

  const autoResize = useCallback((container: HTMLElement) => {
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        resize(width, height);
      }
    });

    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [resize]);

  return {
    resize,
    autoResize,
    dimensions
  };
}