'use client';

// Image Processing React Query Hooks
// React Query integration for image processing operations with progress tracking

import { useMutation, useQuery, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import {
  processImageForTryon,
  processImageAdvanced,
  processImagesInBatch,
  createImageThumbnail,
  extractImageMetadata,
  convertImageFormat,
  validateImageDimensions,
  ImageFormat,
  type ImageProcessingResult,
  type AdvancedImageProcessingResult,
  type AdvancedImageProcessingOptions,
  type ImageMetadata
} from '../utils/imageProcessing';
import {
  classifyTryonError,
  logAndClassifyError,
  type ClassifiedError
} from '../utils/errorHandling';

/**
 * Image processing operation types
 */
export enum ImageProcessingOperation {
  BASIC_PROCESSING = 'basic_processing',
  ADVANCED_PROCESSING = 'advanced_processing',
  BATCH_PROCESSING = 'batch_processing',
  THUMBNAIL_GENERATION = 'thumbnail_generation',
  METADATA_EXTRACTION = 'metadata_extraction',
  FORMAT_CONVERSION = 'format_conversion',
  VALIDATION = 'validation'
}

/**
 * Processing queue item
 */
export interface ProcessingQueueItem {
  id: string;
  operation: ImageProcessingOperation;
  file: File;
  options?: any;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: ClassifiedError;
  startTime?: number;
  endTime?: number;
  estimatedTime?: number;
}

/**
 * Batch processing configuration
 */
export interface BatchProcessingConfig {
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  progressCallback?: (completed: number, total: number, currentItem: ProcessingQueueItem) => void;
  itemCompleteCallback?: (item: ProcessingQueueItem) => void;
  errorCallback?: (item: ProcessingQueueItem, error: ClassifiedError) => void;
}

/**
 * Image processing stats
 */
export interface ProcessingStats {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  peakMemoryUsage: number;
  cacheHitRate: number;
}

/**
 * Processing queue state
 */
export interface ProcessingQueueState {
  queue: ProcessingQueueItem[];
  activeItems: ProcessingQueueItem[];
  completedItems: ProcessingQueueItem[];
  failedItems: ProcessingQueueItem[];
  isProcessing: boolean;
  totalProgress: number;
}

/**
 * Default batch processing configuration
 */
const DEFAULT_BATCH_CONFIG: BatchProcessingConfig = {
  maxConcurrent: 3,
  retryAttempts: 2,
  retryDelay: 1000
};

/**
 * Query keys for React Query
 */
export const imageProcessingKeys = {
  all: ['imageProcessing'] as const,
  metadata: (fileId: string) => [...imageProcessingKeys.all, 'metadata', fileId] as const,
  thumbnail: (fileId: string, size: number) => [...imageProcessingKeys.all, 'thumbnail', fileId, size] as const,
  validation: (fileId: string) => [...imageProcessingKeys.all, 'validation', fileId] as const,
  processing: (operationId: string) => [...imageProcessingKeys.all, 'processing', operationId] as const,
  stats: () => [...imageProcessingKeys.all, 'stats'] as const
};

/**
 * Basic image processing hook for try-on operations
 */
export function useImageProcessing(): {
  processBasic: (file: File) => Promise<ImageProcessingResult>;
  processAdvanced: (params: { file: File; options?: Partial<AdvancedImageProcessingOptions> }) => Promise<AdvancedImageProcessingResult>;
  isProcessingBasic: boolean;
  isProcessingAdvanced: boolean;
  basicError: ClassifiedError | null;
  advancedError: ClassifiedError | null;
  reset: () => void;
} {
  const queryClient = useQueryClient();

  const basicProcessingMutation = useMutation({
    mutationFn: async (file: File): Promise<ImageProcessingResult> => {
      try {
        return await processImageForTryon(file);
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { operation: 'basic_processing', fileName: file.name });
        throw classifiedError;
      }
    },
    onSuccess: (result, file) => {
      // Cache the result
      queryClient.setQueryData(
        imageProcessingKeys.processing(`basic_${file.name}_${file.lastModified}`),
        result
      );
    },
    onError: (error: ClassifiedError, file) => {
      console.error(`Failed to process image ${file.name}:`, error);
    }
  });

  const advancedProcessingMutation = useMutation({
    mutationFn: async ({
      file,
      options
    }: {
      file: File;
      options?: Partial<AdvancedImageProcessingOptions>;
    }): Promise<AdvancedImageProcessingResult> => {
      try {
        return await processImageAdvanced(file, options);
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { 
          operation: 'advanced_processing', 
          fileName: file.name,
          options 
        });
        throw classifiedError;
      }
    },
    onSuccess: (result, { file }) => {
      // Cache the result
      queryClient.setQueryData(
        imageProcessingKeys.processing(`advanced_${file.name}_${file.lastModified}`),
        result
      );
    }
  });

  return {
    processBasic: basicProcessingMutation.mutateAsync,
    processAdvanced: advancedProcessingMutation.mutateAsync,
    isProcessingBasic: basicProcessingMutation.isPending,
    isProcessingAdvanced: advancedProcessingMutation.isPending,
    basicError: basicProcessingMutation.error as ClassifiedError | null,
    advancedError: advancedProcessingMutation.error as ClassifiedError | null,
    reset: () => {
      basicProcessingMutation.reset();
      advancedProcessingMutation.reset();
    }
  };
}

/**
 * Image metadata extraction hook
 */
export function useImageMetadata(file: File | null, enabled: boolean = true): UseQueryResult<ImageMetadata> {
  return useQuery({
    queryKey: file ? imageProcessingKeys.metadata(`${file.name}_${file.lastModified}`) : [],
    queryFn: async (): Promise<ImageMetadata> => {
      if (!file) throw new Error('No file provided');
      try {
        return await extractImageMetadata(file);
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { operation: 'metadata_extraction', fileName: file.name });
        throw classifiedError;
      }
    },
    enabled: enabled && !!file,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

/**
 * Image thumbnail generation hook
 */
export function useImageThumbnail(file: File | null, size: number = 150, enabled: boolean = true): UseQueryResult<string> {
  return useQuery({
    queryKey: file ? imageProcessingKeys.thumbnail(`${file.name}_${file.lastModified}`, size) : [],
    queryFn: async (): Promise<string> => {
      if (!file) throw new Error('No file provided');
      try {
        return await createImageThumbnail(file, size);
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { 
          operation: 'thumbnail_generation', 
          fileName: file.name,
          size 
        });
        throw classifiedError;
      }
    },
    enabled: enabled && !!file,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });
}

/**
 * Image validation hook
 */
export function useImageValidation(file: File | null, enabled: boolean = true): UseQueryResult<{ isValid: boolean; errors: string[] }> {
  return useQuery({
    queryKey: file ? imageProcessingKeys.validation(`${file.name}_${file.lastModified}`) : [],
    queryFn: async (): Promise<{ isValid: boolean; errors: string[] }> => {
      if (!file) throw new Error('No file provided');
      
      const errors: string[] = [];
      
      try {
        // Basic file type validation
        if (!file.type.startsWith('image/')) {
          errors.push('File is not an image');
        }
        
        // File size validation (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          errors.push('File size too large (max 10MB)');
        }
        
        // Dimension validation
        try {
          const metadata = await extractImageMetadata(file);
          if (metadata.dimensions.width < 256 || metadata.dimensions.height < 256) {
            errors.push('Image dimensions too small (minimum 256x256)');
          }
          if (metadata.dimensions.width > 4096 || metadata.dimensions.height > 4096) {
            errors.push('Image dimensions too large (maximum 4096x4096)');
          }
        } catch (error) {
          errors.push('Failed to validate image dimensions');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { operation: 'validation', fileName: file.name });
        throw classifiedError;
      }
    },
    enabled: enabled && !!file,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Format conversion hook
 */
export function useFormatConversion(): UseMutationResult<string, ClassifiedError, { file: File; targetFormat: ImageFormat; quality?: number }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      targetFormat,
      quality = 0.9
    }: {
      file: File;
      targetFormat: ImageFormat;
      quality?: number;
    }): Promise<string> => {
      try {
        const imageUrl = URL.createObjectURL(file);
        const { convertImageFormat } = await import('../utils/imageProcessing');
        const result = await convertImageFormat(imageUrl, targetFormat, quality);
        URL.revokeObjectURL(imageUrl);
        return result;
      } catch (error) {
        const classifiedError = classifyTryonError(error);
        logAndClassifyError(error, { 
          operation: 'format_conversion', 
          fileName: file.name,
          targetFormat,
          quality 
        });
        throw classifiedError;
      }
    },
    onSuccess: (result, { file, targetFormat }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: imageProcessingKeys.metadata(`${file.name}_${file.lastModified}`)
      });
    }
  });
}

/**
 * Batch processing hook with queue management
 */
export function useBatchImageProcessing(config: Partial<BatchProcessingConfig> = {}) {
  const processingConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
  const [queueState, setQueueState] = useState<ProcessingQueueState>({
    queue: [],
    activeItems: [],
    completedItems: [],
    failedItems: [],
    isProcessing: false,
    totalProgress: 0
  });
  
  const queueRef = useRef<ProcessingQueueItem[]>([]);
  const activeRef = useRef<Map<string, ProcessingQueueItem>>(new Map());
  const statsRef = useRef<ProcessingStats>({
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
    peakMemoryUsage: 0,
    cacheHitRate: 0
  });

  const generateId = useCallback(() => {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const updateQueueState = useCallback(() => {
    const activeItems = Array.from(activeRef.current.values());
    const completedItems = queueRef.current.filter(item => item.status === 'completed');
    const failedItems = queueRef.current.filter(item => item.status === 'failed');
    const totalItems = queueRef.current.length;
    const totalProgress = totalItems > 0 
      ? (completedItems.length + failedItems.length) / totalItems * 100 
      : 0;

    setQueueState({
      queue: [...queueRef.current],
      activeItems,
      completedItems,
      failedItems,
      isProcessing: activeItems.length > 0,
      totalProgress
    });
  }, []);

  const processQueueItem = useCallback(async (item: ProcessingQueueItem): Promise<void> => {
    item.status = 'processing';
    item.startTime = Date.now();
    activeRef.current.set(item.id, item);
    updateQueueState();

    try {
      let result: any;
      
      switch (item.operation) {
        case ImageProcessingOperation.BASIC_PROCESSING:
          result = await processImageForTryon(item.file, item.options);
          break;
        case ImageProcessingOperation.ADVANCED_PROCESSING:
          result = await processImageAdvanced(item.file, item.options);
          break;
        case ImageProcessingOperation.THUMBNAIL_GENERATION:
          result = await createImageThumbnail(item.file, item.options?.size || 150);
          break;
        case ImageProcessingOperation.METADATA_EXTRACTION:
          result = await extractImageMetadata(item.file);
          break;
        case ImageProcessingOperation.FORMAT_CONVERSION:
          const imageUrl = URL.createObjectURL(item.file);
          result = await convertImageFormat(imageUrl, item.options.targetFormat, item.options.quality);
          URL.revokeObjectURL(imageUrl);
          break;
        default:
          throw new Error(`Unsupported operation: ${item.operation}`);
      }

      item.status = 'completed';
      item.result = result;
      item.endTime = Date.now();
      item.progress = 100;
      
      // Update stats
      const processingTime = item.endTime - (item.startTime || 0);
      statsRef.current.totalProcessed++;
      statsRef.current.totalProcessingTime += processingTime;
      statsRef.current.averageProcessingTime = 
        statsRef.current.totalProcessingTime / statsRef.current.totalProcessed;

      processingConfig.itemCompleteCallback?.(item);
    } catch (error) {
      item.status = 'failed';
      item.endTime = Date.now();
      item.error = classifyTryonError(error);
      
      statsRef.current.totalFailed++;
      
      logAndClassifyError(error, {
        operation: item.operation,
        fileName: item.file.name,
        itemId: item.id
      });

      processingConfig.errorCallback?.(item, item.error);
    } finally {
      activeRef.current.delete(item.id);
      updateQueueState();
      
      // Process next items in queue
      processNextInQueue();
    }
  }, [processingConfig, updateQueueState]);

  const processNextInQueue = useCallback(() => {
    const pendingItems = queueRef.current
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    const availableSlots = processingConfig.maxConcurrent - activeRef.current.size;
    
    for (let i = 0; i < Math.min(availableSlots, pendingItems.length); i++) {
      processQueueItem(pendingItems[i]);
    }
  }, [processingConfig.maxConcurrent, processQueueItem]);

  const addToQueue = useCallback((
    operation: ImageProcessingOperation,
    file: File,
    options?: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): string => {
    const item: ProcessingQueueItem = {
      id: generateId(),
      operation,
      file,
      options,
      priority,
      status: 'pending',
      progress: 0
    };

    queueRef.current.push(item);
    updateQueueState();
    
    // Start processing if under capacity
    if (activeRef.current.size < processingConfig.maxConcurrent) {
      processNextInQueue();
    }

    return item.id;
  }, [generateId, processingConfig.maxConcurrent, updateQueueState, processNextInQueue]);

  const removeFromQueue = useCallback((itemId: string): boolean => {
    const index = queueRef.current.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    const item = queueRef.current[index];
    if (item.status === 'processing') {
      // Cannot remove active items
      return false;
    }

    queueRef.current.splice(index, 1);
    updateQueueState();
    return true;
  }, [updateQueueState]);

  const clearQueue = useCallback((includeActive: boolean = false) => {
    if (includeActive) {
      queueRef.current = [];
      activeRef.current.clear();
    } else {
      queueRef.current = queueRef.current.filter(item => item.status === 'processing');
    }
    updateQueueState();
  }, [updateQueueState]);

  const pauseQueue = useCallback(() => {
    // Implementation would pause processing new items
    // For now, just stop processing new items
  }, []);

  const resumeQueue = useCallback(() => {
    processNextInQueue();
  }, [processNextInQueue]);

  const getStats = useCallback((): ProcessingStats => {
    return { ...statsRef.current };
  }, []);

  return {
    queueState,
    addToQueue,
    removeFromQueue,
    clearQueue,
    pauseQueue,
    resumeQueue,
    getStats,
    processingConfig
  };
}

/**
 * Processing statistics hook
 */
export function useProcessingStats(): UseQueryResult<ProcessingStats> {
  return useQuery({
    queryKey: imageProcessingKeys.stats(),
    queryFn: async (): Promise<ProcessingStats> => {
      // This would typically fetch from a backend or local storage
      return {
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        peakMemoryUsage: 0,
        cacheHitRate: 0
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000 // 2 minutes
  });
}

/**
 * Cache management for image processing
 */
export function useImageProcessingCache() {
  const queryClient = useQueryClient();

  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.toString().includes(pattern)
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: imageProcessingKeys.all
      });
    }
  }, [queryClient]);

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.findAll({ queryKey: imageProcessingKeys.all });
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      stalequeries: queries.filter(q => q.isStale()).length,
      invalidQueries: queries.filter(q => q.isStale() && q.getObserversCount() === 0).length
    };
  }, [queryClient]);

  const preloadMetadata = useCallback(async (files: File[]) => {
    const promises = files.map(file => 
      queryClient.prefetchQuery({
        queryKey: imageProcessingKeys.metadata(`${file.name}_${file.lastModified}`),
        queryFn: () => extractImageMetadata(file)
      })
    );
    
    await Promise.allSettled(promises);
  }, [queryClient]);

  return {
    clearCache,
    getCacheStats,
    preloadMetadata
  };
}