'use client';

// Sticker Management React Hooks
// React hooks for managing stickers on canvas with interaction support

import { useCallback, useRef, useState, useEffect } from 'react';
import { useManagedCanvas, type ManagedCanvas } from '../providers/CanvasProvider';
import {
  StickerManager,
  createStickerManager,
  type Sticker,
  type StickerConfig,
  type StickerTransform,
  type GridSnapConfig,
  type CollisionResult,
  StickerAnchor,
  DEFAULT_STICKER_CONFIG
} from '../utils/stickerPlacement';

/**
 * Sticker interaction event handlers
 */
export interface StickerInteractionHandlers {
  onStickerSelect?: (stickerId: string | null) => void;
  onStickerMove?: (stickerId: string, x: number, y: number) => void;
  onStickerScale?: (stickerId: string, scale: number) => void;
  onStickerRotate?: (stickerId: string, rotation: number) => void;
  onStickerCollision?: (result: CollisionResult) => void;
}

/**
 * Mouse/touch interaction state
 */
interface InteractionState {
  isInteracting: boolean;
  mode: 'none' | 'drag' | 'scale' | 'rotate';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetStickerId: string | null;
  initialTransform?: StickerTransform;
}

/**
 * Hook for managing stickers on canvas
 */
export function useStickerManagement(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string,
  handlers?: StickerInteractionHandlers
): {
  canvas: ManagedCanvas;
  manager: StickerManager;
  stickers: Sticker[];
  selectedStickerId: string | null;
  isInteracting: boolean;
  addSticker: (config: Omit<StickerConfig, 'id'>) => Promise<string>;
  removeSticker: (id: string) => boolean;
  updateSticker: (id: string, updates: Partial<StickerConfig>) => boolean;
  selectSticker: (id: string | null) => void;
  moveSticker: (id: string, x: number, y: number) => boolean;
  scaleSticker: (id: string, scale: number) => boolean;
  rotateSticker: (id: string, rotation: number) => boolean;
  flipSticker: (id: string, flipX?: boolean, flipY?: boolean) => boolean;
  duplicateSticker: (id: string) => Promise<string | null>;
  bringToFront: (id: string) => boolean;
  sendToBack: (id: string) => boolean;
  checkCollisions: (excludeId?: string) => CollisionResult;
  renderAll: () => void;
  clearAll: () => void;
  exportStickers: () => StickerConfig[];
  importStickers: (stickers: StickerConfig[]) => Promise<string[]>;
  setGridConfig: (config: Partial<GridSnapConfig>) => void;
  getGridConfig: () => GridSnapConfig;
} {
  const canvas = useManagedCanvas(canvasWidth, canvasHeight, canvasId);
  const managerRef = useRef<StickerManager>(createStickerManager(canvas));
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>({
    isInteracting: false,
    mode: 'none',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    targetStickerId: null
  });

  const refreshStickers = useCallback(() => {
    setStickers(managerRef.current.getAllStickers());
  }, []);

  const addSticker = useCallback(async (config: Omit<StickerConfig, 'id'>): Promise<string> => {
    const id = await managerRef.current.addSticker(config);
    refreshStickers();
    handlers?.onStickerSelect?.(id);
    return id;
  }, [refreshStickers, handlers]);

  const removeSticker = useCallback((id: string): boolean => {
    const success = managerRef.current.removeSticker(id);
    if (success) {
      refreshStickers();
      if (selectedStickerId === id) {
        setSelectedStickerId(null);
        handlers?.onStickerSelect?.(null);
      }
    }
    return success;
  }, [refreshStickers, selectedStickerId, handlers]);

  const updateSticker = useCallback((id: string, updates: Partial<StickerConfig>): boolean => {
    const success = managerRef.current.updateSticker(id, updates);
    if (success) {
      refreshStickers();
    }
    return success;
  }, [refreshStickers]);

  const selectSticker = useCallback((id: string | null) => {
    managerRef.current.selectSticker(id);
    setSelectedStickerId(id);
    refreshStickers();
    handlers?.onStickerSelect?.(id);
  }, [refreshStickers, handlers]);

  const moveSticker = useCallback((id: string, x: number, y: number): boolean => {
    const success = managerRef.current.moveStickerTo(id, x, y);
    if (success) {
      refreshStickers();
      handlers?.onStickerMove?.(id, x, y);
      
      // Check for collisions
      const collisions = managerRef.current.checkCollisions(id);
      if (collisions.hasCollision) {
        handlers?.onStickerCollision?.(collisions);
      }
    }
    return success;
  }, [refreshStickers, handlers]);

  const scaleSticker = useCallback((id: string, scale: number): boolean => {
    const success = managerRef.current.scaleSticker(id, scale);
    if (success) {
      refreshStickers();
      handlers?.onStickerScale?.(id, scale);
    }
    return success;
  }, [refreshStickers, handlers]);

  const rotateSticker = useCallback((id: string, rotation: number): boolean => {
    const success = managerRef.current.rotateSticker(id, rotation);
    if (success) {
      refreshStickers();
      handlers?.onStickerRotate?.(id, rotation);
    }
    return success;
  }, [refreshStickers, handlers]);

  const flipSticker = useCallback((id: string, flipX?: boolean, flipY?: boolean): boolean => {
    const success = managerRef.current.flipSticker(id, flipX, flipY);
    if (success) {
      refreshStickers();
    }
    return success;
  }, [refreshStickers]);

  const duplicateSticker = useCallback(async (id: string): Promise<string | null> => {
    const sticker = managerRef.current.getSticker(id);
    if (!sticker) return null;

    // Create duplicate with offset position
    const duplicateConfig = {
      ...sticker,
      transform: {
        ...sticker.transform,
        x: sticker.transform.x + 20,
        y: sticker.transform.y + 20
      }
    };

    try {
      const newId = await addSticker(duplicateConfig);
      selectSticker(newId);
      return newId;
    } catch (error) {
      console.error('Failed to duplicate sticker:', error);
      return null;
    }
  }, [addSticker, selectSticker]);

  const bringToFront = useCallback((id: string): boolean => {
    const success = managerRef.current.bringToFront(id);
    if (success) {
      refreshStickers();
    }
    return success;
  }, [refreshStickers]);

  const sendToBack = useCallback((id: string): boolean => {
    const success = managerRef.current.sendToBack(id);
    if (success) {
      refreshStickers();
    }
    return success;
  }, [refreshStickers]);

  const checkCollisions = useCallback((excludeId?: string): CollisionResult => {
    return managerRef.current.checkCollisions(excludeId);
  }, []);

  const renderAll = useCallback(() => {
    managerRef.current.renderAllStickers();
  }, []);

  const clearAll = useCallback(() => {
    managerRef.current.clearAllStickers();
    setStickers([]);
    setSelectedStickerId(null);
    handlers?.onStickerSelect?.(null);
  }, [handlers]);

  const exportStickers = useCallback((): StickerConfig[] => {
    return managerRef.current.exportStickers();
  }, []);

  const importStickers = useCallback(async (stickerConfigs: StickerConfig[]): Promise<string[]> => {
    const importedIds = await managerRef.current.importStickers(stickerConfigs);
    refreshStickers();
    return importedIds;
  }, [refreshStickers]);

  const setGridConfig = useCallback((config: Partial<GridSnapConfig>) => {
    managerRef.current.setGridConfig(config);
  }, []);

  const getGridConfig = useCallback((): GridSnapConfig => {
    return managerRef.current.getGridConfig();
  }, []);

  // Auto-render when stickers change
  useEffect(() => {
    renderAll();
  }, [stickers, renderAll]);

  return {
    canvas,
    manager: managerRef.current,
    stickers,
    selectedStickerId,
    isInteracting: interactionState.isInteracting,
    addSticker,
    removeSticker,
    updateSticker,
    selectSticker,
    moveSticker,
    scaleSticker,
    rotateSticker,
    flipSticker,
    duplicateSticker,
    bringToFront,
    sendToBack,
    checkCollisions,
    renderAll,
    clearAll,
    exportStickers,
    importStickers,
    setGridConfig,
    getGridConfig
  };
}

/**
 * Hook for handling mouse/touch interactions with stickers
 */
export function useStickerInteraction(
  canvas: HTMLCanvasElement,
  manager: StickerManager,
  onStickerSelect?: (id: string | null) => void,
  onStickerUpdate?: () => void
): {
  isInteracting: boolean;
  startInteraction: (x: number, y: number, mode?: 'drag' | 'scale' | 'rotate') => void;
  updateInteraction: (x: number, y: number) => void;
  endInteraction: () => void;
} {
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionRef = useRef<InteractionState>({
    isInteracting: false,
    mode: 'none',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    targetStickerId: null
  });

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, [canvas]);

  const startInteraction = useCallback((clientX: number, clientY: number, mode: 'drag' | 'scale' | 'rotate' = 'drag') => {
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const stickerId = manager.getStickerAtPosition(x, y);
    
    if (stickerId) {
      const sticker = manager.getSticker(stickerId);
      if (sticker && !sticker.locked) {
        manager.selectSticker(stickerId);
        onStickerSelect?.(stickerId);
        
        interactionRef.current = {
          isInteracting: true,
          mode,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          targetStickerId: stickerId,
          initialTransform: { ...sticker.transform }
        };
        
        setIsInteracting(true);
      }
    } else {
      // Clicked on empty area, deselect
      manager.selectSticker(null);
      onStickerSelect?.(null);
    }
  }, [canvas, manager, onStickerSelect, getCanvasCoordinates]);

  const updateInteraction = useCallback((clientX: number, clientY: number) => {
    if (!interactionRef.current.isInteracting || !interactionRef.current.targetStickerId) return;
    
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const state = interactionRef.current;
    const sticker = state.targetStickerId ? manager.getSticker(state.targetStickerId) : null;
    
    if (!sticker || !state.initialTransform) return;
    
    state.currentX = x;
    state.currentY = y;
    
    const deltaX = x - state.startX;
    const deltaY = y - state.startY;
    
    switch (state.mode) {
      case 'drag':
        if (state.targetStickerId) {
          manager.moveStickerTo(
            state.targetStickerId,
            state.initialTransform.x + deltaX,
            state.initialTransform.y + deltaY
          );
        }
        break;
        
      case 'scale':
        // Calculate scale based on distance from center
        const centerX = state.initialTransform.x;
        const centerY = state.initialTransform.y;
        const initialDistance = Math.sqrt(
          Math.pow(state.startX - centerX, 2) + Math.pow(state.startY - centerY, 2)
        );
        const currentDistance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const scaleFactor = initialDistance > 0 ? currentDistance / initialDistance : 1;
        const newScale = state.initialTransform.scale * scaleFactor;
        
        if (state.targetStickerId) {
          manager.scaleSticker(state.targetStickerId, Math.max(0.1, Math.min(5, newScale)));
        }
        break;
        
      case 'rotate':
        // Calculate rotation based on angle from center
        const centerRotX = state.initialTransform.x;
        const centerRotY = state.initialTransform.y;
        const initialAngle = Math.atan2(state.startY - centerRotY, state.startX - centerRotX);
        const currentAngle = Math.atan2(y - centerRotY, x - centerRotX);
        const rotationDelta = currentAngle - initialAngle;
        const newRotation = state.initialTransform.rotation + rotationDelta;
        
        if (state.targetStickerId) {
          manager.rotateSticker(state.targetStickerId, newRotation);
        }
        break;
    }
    
    onStickerUpdate?.();
  }, [canvas, manager, onStickerUpdate, getCanvasCoordinates]);

  const endInteraction = useCallback(() => {
    interactionRef.current = {
      isInteracting: false,
      mode: 'none',
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      targetStickerId: null
    };
    setIsInteracting(false);
  }, []);

  return {
    isInteracting,
    startInteraction,
    updateInteraction,
    endInteraction
  };
}

/**
 * Hook for sticker library management
 */
export function useStickerLibrary(): {
  categories: string[];
  getStickersInCategory: (category: string) => StickerConfig[];
  addStickerToLibrary: (sticker: StickerConfig, category: string) => void;
  removeStickerFromLibrary: (stickerId: string) => void;
  searchStickers: (query: string) => StickerConfig[];
  getFavoriteStickers: () => StickerConfig[];
  addToFavorites: (stickerId: string) => void;
  removeFromFavorites: (stickerId: string) => void;
} {
  const [library, setLibrary] = useState<Map<string, StickerConfig[]>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categories = Array.from(library.keys());

  const getStickersInCategory = useCallback((category: string): StickerConfig[] => {
    return library.get(category) || [];
  }, [library]);

  const addStickerToLibrary = useCallback((sticker: StickerConfig, category: string) => {
    setLibrary(prev => {
      const newLibrary = new Map(prev);
      const categoryStickers = newLibrary.get(category) || [];
      newLibrary.set(category, [...categoryStickers, sticker]);
      return newLibrary;
    });
  }, []);

  const removeStickerFromLibrary = useCallback((stickerId: string) => {
    setLibrary(prev => {
      const newLibrary = new Map();
      prev.forEach((stickers, category) => {
        newLibrary.set(category, stickers.filter(s => s.id !== stickerId));
      });
      return newLibrary;
    });
  }, []);

  const searchStickers = useCallback((query: string): StickerConfig[] => {
    const results: StickerConfig[] = [];
    const lowerQuery = query.toLowerCase();
    
    library.forEach(stickers => {
      stickers.forEach(sticker => {
        if (sticker.metadata?.name?.toLowerCase().includes(lowerQuery) ||
            sticker.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
          results.push(sticker);
        }
      });
    });
    
    return results;
  }, [library]);

  const getFavoriteStickers = useCallback((): StickerConfig[] => {
    const favoriteStickers: StickerConfig[] = [];
    
    library.forEach(stickers => {
      stickers.forEach(sticker => {
        if (favorites.has(sticker.id)) {
          favoriteStickers.push(sticker);
        }
      });
    });
    
    return favoriteStickers;
  }, [library, favorites]);

  const addToFavorites = useCallback((stickerId: string) => {
    setFavorites(prev => new Set(prev).add(stickerId));
  }, []);

  const removeFromFavorites = useCallback((stickerId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      newFavorites.delete(stickerId);
      return newFavorites;
    });
  }, []);

  return {
    categories,
    getStickersInCategory,
    addStickerToLibrary,
    removeStickerFromLibrary,
    searchStickers,
    getFavoriteStickers,
    addToFavorites,
    removeFromFavorites
  };
}