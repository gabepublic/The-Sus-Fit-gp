'use client';

// Image Export React Hooks
// React hooks for managing image export operations with progress tracking and optimization

import { useCallback, useRef, useState } from 'react';
import { useManagedCanvas } from '../providers/CanvasProvider';
import {
  ImageExporter,
  BatchExportManager,
  createImageExporter,
  createBatchExportManager,
  ExportFormat,
  QualityPreset,
  type ExportConfig,
  type ExportResult,
  DEFAULT_EXPORT_CONFIG,
  estimateFileSize
} from '../utils/imageExport';
import {
  classifyTryonError,
  logAndClassifyError,
  type ClassifiedError
} from '../utils/errorHandling';

/**
 * Export hook options
 */
export interface UseImageExportOptions {
  /** Default export configuration */
  defaultConfig?: Partial<ExportConfig>;
  /** Enable auto-download after export */
  autoDownload?: boolean;
  /** Callback when export completes */
  onExportComplete?: (result: ExportResult) => void;
  /** Callback when export fails */
  onExportError?: (error: ClassifiedError) => void;
  /** Callback for export progress */
  onProgress?: (progress: number) => void;
}

/**
 * Export state
 */
export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentExport: string | null;
  completedExports: ExportResult[];
  failedExports: Array<{ config: Partial<ExportConfig>; error: ClassifiedError }>;
  totalExports: number;
}

/**
 * Main image export hook
 */
export function useImageExport(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string,
  options: UseImageExportOptions = {}
): {
  canvas: HTMLCanvasElement;
  exporter: ImageExporter;
  state: ExportState;
  exportImage: (config?: Partial<ExportConfig>) => Promise<ExportResult>;
  exportWithPreset: (preset: QualityPreset) => Promise<ExportResult>;
  exportMultiple: (configs: Partial<ExportConfig>[]) => Promise<ExportResult[]>;
  downloadLastExport: () => void;
  clearHistory: () => void;
  getOptimalConfig: (useCase: 'web' | 'social' | 'print' | 'archive') => ExportConfig;
  estimateSize: (config?: Partial<ExportConfig>) => number;
} {
  const canvas = useManagedCanvas(canvasWidth, canvasHeight, canvasId);
  const exporterRef = useRef<ImageExporter | undefined>(undefined);
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    currentExport: null,
    completedExports: [],
    failedExports: [],
    totalExports: 0
  });

  // Initialize exporter
  if (!exporterRef.current) {
    exporterRef.current = createImageExporter(canvas);
  }

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
    options.onProgress?.(progress);
  }, [options]);

  const exportImage = useCallback(async (config: Partial<ExportConfig> = {}): Promise<ExportResult> => {
    if (!exporterRef.current) throw new Error('Exporter not initialized');

    const finalConfig = { ...options.defaultConfig, ...config };
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      currentExport: exportId,
      totalExports: prev.totalExports + 1
    }));

    try {
      updateProgress(25);
      
      const result = await exporterRef.current.exportImage(finalConfig);
      
      updateProgress(75);

      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        currentExport: null,
        completedExports: [...prev.completedExports, result]
      }));

      updateProgress(100);

      // Auto-download if enabled
      if (options.autoDownload) {
        exporterRef.current!.downloadImage(result);
      }

      options.onExportComplete?.(result);
      return result;
    } catch (error) {
      const classifiedError = classifyTryonError(error);
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 0,
        currentExport: null,
        failedExports: [...prev.failedExports, { config: finalConfig, error: classifiedError }]
      }));

      logAndClassifyError(error, {
        operation: 'image_export',
        config: finalConfig,
        exportId
      });

      options.onExportError?.(classifiedError);
      throw classifiedError;
    }
  }, [options, updateProgress]);

  const exportWithPreset = useCallback(async (preset: QualityPreset): Promise<ExportResult> => {
    return exportImage({ preset });
  }, [exportImage]);

  const exportMultiple = useCallback(async (configs: Partial<ExportConfig>[]): Promise<ExportResult[]> => {
    if (!exporterRef.current) throw new Error('Exporter not initialized');

    setState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      totalExports: prev.totalExports + configs.length
    }));

    const results: ExportResult[] = [];
    const totalConfigs = configs.length;

    try {
      for (let i = 0; i < configs.length; i++) {
        const config = { ...options.defaultConfig, ...configs[i] };
        updateProgress((i / totalConfigs) * 100);
        
        const result = await exporterRef.current.exportImage(config);
        results.push(result);
        
        setState(prev => ({
          ...prev,
          completedExports: [...prev.completedExports, result]
        }));
      }

      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100
      }));

      updateProgress(100);
      return results;
    } catch (error) {
      const classifiedError = classifyTryonError(error);
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        progress: 0,
        failedExports: [...prev.failedExports, { config: configs[results.length], error: classifiedError }]
      }));

      logAndClassifyError(error, {
        operation: 'batch_export',
        completedCount: results.length,
        totalCount: totalConfigs
      });

      options.onExportError?.(classifiedError);
      throw classifiedError;
    }
  }, [options, updateProgress]);

  const downloadLastExport = useCallback(() => {
    if (!exporterRef.current || state.completedExports.length === 0) return;
    
    const lastExport = state.completedExports[state.completedExports.length - 1];
    exporterRef.current.downloadImage(lastExport);
  }, [state.completedExports]);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedExports: [],
      failedExports: [],
      totalExports: 0
    }));
  }, []);

  const getOptimalConfig = useCallback((useCase: 'web' | 'social' | 'print' | 'archive'): ExportConfig => {
    const baseConfig = { ...DEFAULT_EXPORT_CONFIG, ...options.defaultConfig };

    switch (useCase) {
      case 'web':
        return {
          ...baseConfig,
          format: ExportFormat.WEBP,
          preset: QualityPreset.WEB,
          quality: 0.8
        };
      case 'social':
        return {
          ...baseConfig,
          format: ExportFormat.JPEG,
          preset: QualityPreset.SOCIAL,
          quality: 0.85,
          width: 1080,
          height: 1080
        };
      case 'print':
        return {
          ...baseConfig,
          format: ExportFormat.PNG,
          preset: QualityPreset.PRINT,
          quality: 1.0,
          dpi: 300
        };
      case 'archive':
        return {
          ...baseConfig,
          format: ExportFormat.PNG,
          preset: QualityPreset.MAXIMUM,
          quality: 1.0
        };
      default:
        return baseConfig;
    }
  }, [options.defaultConfig]);

  const estimateSize = useCallback((config: Partial<ExportConfig> = {}): number => {
    const finalConfig = { ...DEFAULT_EXPORT_CONFIG, ...options.defaultConfig, ...config };
    
    return estimateFileSize(
      finalConfig.width || canvasWidth,
      finalConfig.height || canvasHeight,
      finalConfig.format,
      finalConfig.quality
    );
  }, [canvasWidth, canvasHeight, options.defaultConfig]);

  return {
    canvas: canvas.canvas,
    exporter: exporterRef.current!,
    state,
    exportImage,
    exportWithPreset,
    exportMultiple,
    downloadLastExport,
    clearHistory,
    getOptimalConfig,
    estimateSize
  };
}

/**
 * Batch export hook with queue management
 */
export function useBatchImageExport(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string,
  concurrency: number = 2
): {
  canvas: HTMLCanvasElement;
  batchManager: BatchExportManager;
  queueExport: (config: Partial<ExportConfig>) => Promise<ExportResult>;
  queueMultiple: (configs: Partial<ExportConfig>[]) => Promise<ExportResult[]>;
  clearQueue: () => void;
  queueStatus: { pending: number; processing: boolean };
  exportPresets: (presets: QualityPreset[]) => Promise<ExportResult[]>;
} {
  const canvas = useManagedCanvas(canvasWidth, canvasHeight, canvasId);
  const exporterRef = useRef<ImageExporter | undefined>(undefined);
  const batchManagerRef = useRef<BatchExportManager | undefined>(undefined);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, processing: false });

  // Initialize exporter and batch manager
  if (!exporterRef.current) {
    exporterRef.current = createImageExporter(canvas);
    batchManagerRef.current = createBatchExportManager(exporterRef.current, concurrency);
  }

  const updateQueueStatus = useCallback(() => {
    if (batchManagerRef.current) {
      setQueueStatus(batchManagerRef.current.getQueueStatus());
    }
  }, []);

  const queueExport = useCallback(async (config: Partial<ExportConfig>): Promise<ExportResult> => {
    if (!batchManagerRef.current) throw new Error('Batch manager not initialized');
    
    updateQueueStatus();
    const result = await batchManagerRef.current.queueExport(config);
    updateQueueStatus();
    
    return result;
  }, [updateQueueStatus]);

  const queueMultiple = useCallback(async (configs: Partial<ExportConfig>[]): Promise<ExportResult[]> => {
    if (!batchManagerRef.current) throw new Error('Batch manager not initialized');
    
    const promises = configs.map(config => queueExport(config));
    return Promise.all(promises);
  }, [queueExport]);

  const clearQueue = useCallback(() => {
    if (batchManagerRef.current) {
      batchManagerRef.current.clearQueue();
      updateQueueStatus();
    }
  }, [updateQueueStatus]);

  const exportPresets = useCallback(async (presets: QualityPreset[]): Promise<ExportResult[]> => {
    const configs = presets.map(preset => ({ preset }));
    return queueMultiple(configs);
  }, [queueMultiple]);

  return {
    canvas: canvas.canvas,
    batchManager: batchManagerRef.current!,
    queueExport,
    queueMultiple,
    clearQueue,
    queueStatus,
    exportPresets
  };
}

/**
 * Simple export hook with common presets
 */
export function useSimpleImageExport(
  canvasWidth: number,
  canvasHeight: number,
  canvasId?: string
): {
  canvas: HTMLCanvasElement;
  exportForWeb: () => Promise<ExportResult>;
  exportForSocial: () => Promise<ExportResult>;
  exportForPrint: () => Promise<ExportResult>;
  exportPNG: () => Promise<ExportResult>;
  exportJPEG: (quality?: number) => Promise<ExportResult>;
  isExporting: boolean;
  lastExport: ExportResult | null;
  downloadLast: () => void;
} {
  const {
    canvas,
    state,
    exportImage,
    downloadLastExport,
    getOptimalConfig
  } = useImageExport(canvasWidth, canvasHeight, canvasId, { autoDownload: true });

  const exportForWeb = useCallback(() => {
    return exportImage(getOptimalConfig('web'));
  }, [exportImage, getOptimalConfig]);

  const exportForSocial = useCallback(() => {
    return exportImage(getOptimalConfig('social'));
  }, [exportImage, getOptimalConfig]);

  const exportForPrint = useCallback(() => {
    return exportImage(getOptimalConfig('print'));
  }, [exportImage, getOptimalConfig]);

  const exportPNG = useCallback(() => {
    return exportImage({ format: ExportFormat.PNG, quality: 1.0 });
  }, [exportImage]);

  const exportJPEG = useCallback((quality: number = 0.9) => {
    return exportImage({ format: ExportFormat.JPEG, quality });
  }, [exportImage]);

  return {
    canvas,
    exportForWeb,
    exportForSocial,
    exportForPrint,
    exportPNG,
    exportJPEG,
    isExporting: state.isExporting,
    lastExport: state.completedExports[state.completedExports.length - 1] || null,
    downloadLast: downloadLastExport
  };
}