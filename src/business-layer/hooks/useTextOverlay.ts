'use client';

// Text Overlay React Hooks
// React hooks for managing text overlays on canvas

import { useCallback, useRef, useState } from 'react';
import { useManagedCanvas, type ManagedCanvas } from '../providers/CanvasProvider';
import {
  TextOverlayRenderer,
  TextOverlayUtils,
  createTextOverlayRenderer,
  type TextOverlayConfig,
  type TextMeasurement,
  type TextStyle,
  type TextPosition
} from '../utils/textOverlay';

/**
 * Text overlay item with unique ID
 */
export interface TextOverlayItem {
  id: string;
  config: TextOverlayConfig;
  measurement?: TextMeasurement;
  visible: boolean;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Text overlay manager state
 */
export interface TextOverlayState {
  overlays: TextOverlayItem[];
  activeOverlayId: string | null;
  isEditing: boolean;
}

/**
 * Hook for managing text overlays on a canvas
 */
export function useTextOverlay(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string
): {
  canvas: ManagedCanvas;
  renderer: TextOverlayRenderer;
  overlays: TextOverlayItem[];
  activeOverlayId: string | null;
  isEditing: boolean;
  addTextOverlay: (config: Omit<TextOverlayConfig, 'text'> & { text: string }) => string;
  updateTextOverlay: (id: string, config: Partial<TextOverlayConfig>) => void;
  removeTextOverlay: (id: string) => void;
  setActiveOverlay: (id: string | null) => void;
  setOverlayVisibility: (id: string, visible: boolean) => void;
  setOverlayLocked: (id: string, locked: boolean) => void;
  renderAllOverlays: () => void;
  clearAllOverlays: () => void;
  getOverlayById: (id: string) => TextOverlayItem | undefined;
  duplicateOverlay: (id: string) => string | null;
  moveOverlay: (id: string, newPosition: Partial<TextPosition>) => void;
  exportOverlays: () => TextOverlayItem[];
  importOverlays: (overlays: TextOverlayItem[]) => void;
  startEditing: () => void;
  stopEditing: () => void;
} {
  const canvas = useManagedCanvas(canvasWidth, canvasHeight, canvasId);
  const [state, setState] = useState<TextOverlayState>({
    overlays: [],
    activeOverlayId: null,
    isEditing: false
  });

  const rendererRef = useRef<TextOverlayRenderer>(createTextOverlayRenderer(canvas));

  const generateId = useCallback(() => {
    return `text-overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addTextOverlay = useCallback((config: Omit<TextOverlayConfig, 'text'> & { text: string }): string => {
    const id = generateId();
    const now = new Date();
    
    const newOverlay: TextOverlayItem = {
      id,
      config: config as TextOverlayConfig,
      visible: true,
      locked: false,
      createdAt: now,
      updatedAt: now
    };

    setState(prev => ({
      ...prev,
      overlays: [...prev.overlays, newOverlay],
      activeOverlayId: id
    }));

    return id;
  }, [generateId]);

  const updateTextOverlay = useCallback((id: string, configUpdate: Partial<TextOverlayConfig>) => {
    setState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay => 
        overlay.id === id 
          ? {
              ...overlay,
              config: { ...overlay.config, ...configUpdate },
              updatedAt: new Date()
            }
          : overlay
      )
    }));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      overlays: prev.overlays.filter(overlay => overlay.id !== id),
      activeOverlayId: prev.activeOverlayId === id ? null : prev.activeOverlayId
    }));
  }, []);

  const setActiveOverlay = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeOverlayId: id }));
  }, []);

  const setOverlayVisibility = useCallback((id: string, visible: boolean) => {
    setState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay =>
        overlay.id === id ? { ...overlay, visible, updatedAt: new Date() } : overlay
      )
    }));
  }, []);

  const setOverlayLocked = useCallback((id: string, locked: boolean) => {
    setState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay =>
        overlay.id === id ? { ...overlay, locked, updatedAt: new Date() } : overlay
      )
    }));
  }, []);

  const renderAllOverlays = useCallback(() => {
    // Clear previous overlays
    canvas.context.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);

    // Render visible overlays in order
    const visibleOverlays = state.overlays
      .filter(overlay => overlay.visible)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    visibleOverlays.forEach(overlay => {
      const measurement = rendererRef.current.renderText(overlay.config);
      
      // Update overlay with measurement
      setState(prev => ({
        ...prev,
        overlays: prev.overlays.map(o => 
          o.id === overlay.id ? { ...o, measurement } : o
        )
      }));
    });
  }, [canvas, state.overlays]);

  const clearAllOverlays = useCallback(() => {
    canvas.context.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
    setState(prev => ({ ...prev, overlays: [], activeOverlayId: null }));
  }, [canvas]);

  const getOverlayById = useCallback((id: string): TextOverlayItem | undefined => {
    return state.overlays.find(overlay => overlay.id === id);
  }, [state.overlays]);

  const duplicateOverlay = useCallback((id: string): string | null => {
    const overlay = getOverlayById(id);
    if (!overlay) return null;

    const newId = generateId();
    const now = new Date();
    
    // Offset position slightly
    const newConfig = {
      ...overlay.config,
      position: {
        ...overlay.config.position,
        x: overlay.config.position.x + 20,
        y: overlay.config.position.y + 20
      }
    };

    const duplicatedOverlay: TextOverlayItem = {
      id: newId,
      config: newConfig,
      visible: true,
      locked: false,
      createdAt: now,
      updatedAt: now
    };

    setState(prev => ({
      ...prev,
      overlays: [...prev.overlays, duplicatedOverlay],
      activeOverlayId: newId
    }));

    return newId;
  }, [getOverlayById, generateId]);

  const moveOverlay = useCallback((id: string, newPosition: Partial<TextPosition>) => {
    setState(prev => ({
      ...prev,
      overlays: prev.overlays.map(overlay =>
        overlay.id === id
          ? {
              ...overlay,
              config: {
                ...overlay.config,
                position: { ...overlay.config.position, ...newPosition }
              },
              updatedAt: new Date()
            }
          : overlay
      )
    }));
  }, []);

  const exportOverlays = useCallback((): TextOverlayItem[] => {
    return JSON.parse(JSON.stringify(state.overlays));
  }, [state.overlays]);

  const importOverlays = useCallback((overlays: TextOverlayItem[]) => {
    setState(prev => ({
      ...prev,
      overlays: overlays.map(overlay => ({
        ...overlay,
        id: generateId(), // Generate new IDs to avoid conflicts
        createdAt: new Date(overlay.createdAt),
        updatedAt: new Date(overlay.updatedAt)
      })),
      activeOverlayId: null
    }));
  }, [generateId]);

  const startEditing = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: true }));
  }, []);

  const stopEditing = useCallback(() => {
    setState(prev => ({ ...prev, isEditing: false }));
  }, []);

  return {
    canvas,
    renderer: rendererRef.current,
    overlays: state.overlays,
    activeOverlayId: state.activeOverlayId,
    isEditing: state.isEditing,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    setActiveOverlay,
    setOverlayVisibility,
    setOverlayLocked,
    renderAllOverlays,
    clearAllOverlays,
    getOverlayById,
    duplicateOverlay,
    moveOverlay,
    exportOverlays,
    importOverlays,
    startEditing,
    stopEditing
  };
}

/**
 * Hook for text style presets and utilities
 */
export function useTextPresets(): {
  presets: ReturnType<typeof TextOverlayUtils.createPresets>;
  calculateOptimalFontSize: (
    text: string,
    maxWidth: number,
    maxHeight: number,
    style: TextStyle,
    canvas: HTMLCanvasElement
  ) => number;
  createCustomPreset: (name: string, style: TextStyle) => void;
  getCustomPresets: () => Record<string, { style: TextStyle }>;
  removeCustomPreset: (name: string) => void;
} {
  const [customPresets, setCustomPresets] = useState<Record<string, { style: TextStyle }>>({});

  const presets = TextOverlayUtils.createPresets();

  const calculateOptimalFontSize = useCallback((
    text: string,
    maxWidth: number,
    maxHeight: number,
    style: TextStyle,
    canvas: HTMLCanvasElement
  ) => {
    return TextOverlayUtils.calculateOptimalFontSize(text, maxWidth, maxHeight, style, canvas);
  }, []);

  const createCustomPreset = useCallback((name: string, style: TextStyle) => {
    setCustomPresets(prev => ({
      ...prev,
      [name]: { style }
    }));
  }, []);

  const getCustomPresets = useCallback(() => {
    return customPresets;
  }, [customPresets]);

  const removeCustomPreset = useCallback((name: string) => {
    setCustomPresets(prev => {
      const { [name]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    presets,
    calculateOptimalFontSize,
    createCustomPreset,
    getCustomPresets,
    removeCustomPreset
  };
}

/**
 * Hook for interactive text editing
 */
export function useInteractiveTextEditor(
  canvas: ManagedCanvas,
  overlayId: string,
  onUpdate: (config: Partial<TextOverlayConfig>) => void
): {
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
  updateText: (text: string) => void;
  updateStyle: (style: Partial<TextStyle>) => void;
  updatePosition: (position: Partial<TextPosition>) => void;
} {
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const updateText = useCallback((text: string) => {
    onUpdate({ text });
  }, [onUpdate]);

  const updateStyle = useCallback((style: Partial<TextStyle>) => {
    onUpdate({ style });
  }, [onUpdate]);

  const updatePosition = useCallback((position: Partial<TextPosition>) => {
    onUpdate({ position: { x: 0, y: 0, ...position } });
  }, [onUpdate]);

  return {
    isEditing,
    startEditing,
    stopEditing,
    updateText,
    updateStyle,
    updatePosition
  };
}