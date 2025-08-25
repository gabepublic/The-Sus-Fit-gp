'use client';

// Undo/Redo React Hooks
// React hooks for managing undo/redo operations with keyboard shortcuts

import { useCallback, useEffect, useRef, useState } from 'react';
import { useManagedCanvas, type ManagedCanvas } from '../providers/CanvasProvider';
import {
  UndoRedoManager,
  createUndoRedoManager,
  OperationType,
  type UndoRedoConfig,
  type UndoRedoState,
  type Operation,
  type CompositeOperation,
  DEFAULT_UNDO_REDO_CONFIG
} from '../utils/undoRedoStack';

/**
 * Undo/Redo hook options
 */
export interface UseUndoRedoOptions {
  /** Undo/Redo configuration */
  config?: Partial<UndoRedoConfig>;
  /** Enable keyboard shortcuts (Ctrl+Z, Ctrl+Y) */
  enableKeyboardShortcuts?: boolean;
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: {
    undo?: string[];
    redo?: string[];
  };
  /** Callback when operation is executed */
  onOperationExecuted?: (operation: Operation | CompositeOperation) => void;
  /** Callback when undo is performed */
  onUndo?: (operation: Operation | CompositeOperation) => void;
  /** Callback when redo is performed */
  onRedo?: (operation: Operation | CompositeOperation) => void;
  /** Callback when history is cleared */
  onHistoryCleared?: () => void;
}

/**
 * Default keyboard shortcuts
 */
const DEFAULT_SHORTCUTS = {
  undo: ['ctrl+z', 'cmd+z'],
  redo: ['ctrl+y', 'cmd+y', 'ctrl+shift+z', 'cmd+shift+z']
};

/**
 * Main undo/redo hook
 */
export function useUndoRedo(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string,
  options: UseUndoRedoOptions = {}
): {
  canvas: ManagedCanvas;
  manager: UndoRedoManager;
  state: UndoRedoState;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;
  executeOperation: (
    type: OperationType,
    description: string,
    operationFn: () => void | Promise<void>,
    operationData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) => Promise<string>;
  startComposite: (description: string, metadata?: Record<string, unknown>) => string;
  endComposite: () => void;
  jumpToOperation: (index: number) => boolean;
  clearHistory: () => void;
  getHistory: () => (Operation | CompositeOperation)[];
  getOperation: (id: string) => Operation | CompositeOperation | null;
  cleanup: (targetMemoryMB?: number) => void;
  exportHistory: () => string;
  importHistory: (historyData: string) => boolean;
  updateConfig: (newConfig: Partial<UndoRedoConfig>) => void;
} {
  const canvas = useManagedCanvas(canvasWidth, canvasHeight, canvasId);
  const managerRef = useRef<UndoRedoManager | undefined>(undefined);
  const [state, setState] = useState<UndoRedoState>({
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
  });

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = createUndoRedoManager(canvas, options.config);
  }

  const updateState = useCallback(() => {
    if (managerRef.current) {
      setState(managerRef.current.getState());
    }
  }, []);

  const executeOperation = useCallback(async (
    type: OperationType,
    description: string,
    operationFn: () => void | Promise<void>,
    operationData?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<string> => {
    if (!managerRef.current) throw new Error('Manager not initialized');
    
    const operationId = await managerRef.current.executeOperation(
      type,
      description,
      operationFn,
      operationData,
      metadata
    );
    
    updateState();
    
    const operation = managerRef.current.getOperation(operationId);
    if (operation) {
      options.onOperationExecuted?.(operation);
    }
    
    return operationId;
  }, [updateState, options]);

  const undo = useCallback((): boolean => {
    if (!managerRef.current) return false;
    
    const currentOperation = state.currentIndex >= 0 
      ? managerRef.current.getHistory()[state.currentIndex] 
      : null;
    
    const success = managerRef.current.undo();
    if (success) {
      updateState();
      if (currentOperation) {
        options.onUndo?.(currentOperation);
      }
    }
    return success;
  }, [state.currentIndex, updateState, options]);

  const redo = useCallback((): boolean => {
    if (!managerRef.current) return false;
    
    const nextOperation = state.currentIndex + 1 < state.operations.length
      ? state.operations[state.currentIndex + 1]
      : null;
    
    const success = managerRef.current.redo();
    if (success) {
      updateState();
      if (nextOperation) {
        options.onRedo?.(nextOperation);
      }
    }
    return success;
  }, [state.currentIndex, state.operations, updateState, options]);

  const startComposite = useCallback((description: string, metadata?: Record<string, unknown>): string => {
    if (!managerRef.current) throw new Error('Manager not initialized');
    return managerRef.current.startCompositeOperation(description, metadata);
  }, []);

  const endComposite = useCallback((): void => {
    if (!managerRef.current) return;
    managerRef.current.endCompositeOperation();
    updateState();
  }, [updateState]);

  const jumpToOperation = useCallback((index: number): boolean => {
    if (!managerRef.current) return false;
    const success = managerRef.current.jumpToOperation(index);
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  const clearHistory = useCallback((): void => {
    if (!managerRef.current) return;
    managerRef.current.clearHistory();
    updateState();
    options.onHistoryCleared?.();
  }, [updateState, options]);

  const getHistory = useCallback((): (Operation | CompositeOperation)[] => {
    return managerRef.current?.getHistory() || [];
  }, []);

  const getOperation = useCallback((id: string): Operation | CompositeOperation | null => {
    return managerRef.current?.getOperation(id) || null;
  }, []);

  const cleanup = useCallback((targetMemoryMB?: number): void => {
    if (!managerRef.current) return;
    managerRef.current.cleanup(targetMemoryMB);
    updateState();
  }, [updateState]);

  const exportHistory = useCallback((): string => {
    return managerRef.current?.exportHistory() || '';
  }, []);

  const importHistory = useCallback((historyData: string): boolean => {
    if (!managerRef.current) return false;
    const success = managerRef.current.importHistory(historyData);
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  const updateConfig = useCallback((newConfig: Partial<UndoRedoConfig>): void => {
    if (!managerRef.current) return;
    managerRef.current.updateConfig(newConfig);
    updateState();
  }, [updateState]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!options.enableKeyboardShortcuts) return;

    const shortcuts = { ...DEFAULT_SHORTCUTS, ...options.keyboardShortcuts };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = `${event.ctrlKey || event.metaKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;
      const cmdKey = `${event.ctrlKey || event.metaKey ? 'cmd+' : ''}${event.shiftKey ? 'shift+' : ''}${event.key.toLowerCase()}`;

      if (shortcuts.undo.includes(key) || shortcuts.undo.includes(cmdKey)) {
        event.preventDefault();
        undo();
      } else if (shortcuts.redo.includes(key) || shortcuts.redo.includes(cmdKey)) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options.enableKeyboardShortcuts, options.keyboardShortcuts, undo, redo]);

  // Update state when operations change
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    canvas,
    manager: managerRef.current,
    state,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undo,
    redo,
    executeOperation,
    startComposite,
    endComposite,
    jumpToOperation,
    clearHistory,
    getHistory,
    getOperation,
    cleanup,
    exportHistory,
    importHistory,
    updateConfig
  };
}

/**
 * Hook for simple undo/redo operations without full state management
 */
export function useSimpleUndoRedo<T>(
  initialState: T,
  maxHistorySize: number = 50
): {
  state: T;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (newState: T) => void;
  clearHistory: () => void;
  getHistory: () => T[];
} {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const state = history[currentIndex];

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const pushState = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any states after current index
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Enforce max history size
      if (newHistory.length > maxHistorySize) {
        newHistory.splice(0, newHistory.length - maxHistorySize);
        setCurrentIndex(maxHistorySize - 1);
        return newHistory;
      }
      
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex, maxHistorySize]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  const getHistory = useCallback(() => {
    return [...history];
  }, [history]);

  return {
    state,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory,
    getHistory
  };
}

/**
 * Hook for operation batching and atomic commits
 */
export function useOperationBatching(
  undoRedoManager: UndoRedoManager,
  autoCommitDelay: number = 1000
): {
  startBatch: (description: string) => string;
  addOperation: (
    type: OperationType,
    description: string,
    operationFn: () => void | Promise<void>,
    operationData?: Record<string, unknown>
  ) => Promise<string>;
  commitBatch: () => void;
  discardBatch: () => void;
  isBatching: boolean;
  batchOperationCount: number;
} {
  const [isBatching, setIsBatching] = useState(false);
  const [batchOperationCount, setBatchOperationCount] = useState(0);
  const batchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentBatchRef = useRef<string | null>(null);

  const startBatch = useCallback((description: string): string => {
    if (currentBatchRef.current) {
      commitBatch();
    }

    const batchId = undoRedoManager.startCompositeOperation(description);
    currentBatchRef.current = batchId;
    setIsBatching(true);
    setBatchOperationCount(0);

    // Auto-commit after delay
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      commitBatch();
    }, autoCommitDelay);

    return batchId;
  }, [autoCommitDelay]);

  const addOperation = useCallback(async (
    type: OperationType,
    description: string,
    operationFn: () => void | Promise<void>,
    operationData?: Record<string, unknown>
  ): Promise<string> => {
    const operationId = await undoRedoManager.executeOperation(
      type,
      description,
      operationFn,
      operationData
    );

    setBatchOperationCount(prev => prev + 1);
    return operationId;
  }, [undoRedoManager]);

  const commitBatch = useCallback(() => {
    if (currentBatchRef.current) {
      undoRedoManager.endCompositeOperation();
      currentBatchRef.current = null;
      setIsBatching(false);
      setBatchOperationCount(0);

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = undefined;
      }
    }
  }, [undoRedoManager]);

  const discardBatch = useCallback(() => {
    if (currentBatchRef.current) {
      // Note: In a real implementation, you'd need to revert operations
      // For now, we just clear the batch state
      currentBatchRef.current = null;
      setIsBatching(false);
      setBatchOperationCount(0);

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = undefined;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    startBatch,
    addOperation,
    commitBatch,
    discardBatch,
    isBatching,
    batchOperationCount
  };
}

/**
 * Hook for history persistence
 */
export function useHistoryPersistence(
  undoRedoManager: UndoRedoManager,
  storageKey: string = 'canvas-history'
): {
  saveHistory: () => boolean;
  loadHistory: () => boolean;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  lastSaved: Date | null;
} {
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveHistory = useCallback((): boolean => {
    try {
      const historyData = undoRedoManager.exportHistory();
      localStorage.setItem(storageKey, historyData);
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('Failed to save history:', error);
      return false;
    }
  }, [undoRedoManager, storageKey]);

  const loadHistory = useCallback((): boolean => {
    try {
      const historyData = localStorage.getItem(storageKey);
      if (historyData) {
        const success = undoRedoManager.importHistory(historyData);
        if (success) {
          setLastSaved(new Date());
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Failed to load history:', error);
      return false;
    }
  }, [undoRedoManager, storageKey]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const handleBeforeUnload = () => {
      saveHistory();
    };

    const autoSaveInterval = setInterval(() => {
      saveHistory();
    }, 30000); // Save every 30 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [autoSave, saveHistory]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    saveHistory,
    loadHistory,
    autoSave,
    setAutoSave,
    lastSaved
  };
}