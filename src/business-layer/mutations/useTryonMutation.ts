'use client';

// Try-On Mutation Hook
// React Query mutation hook for handling try-on API calls with comprehensive error handling

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import type {
  TryonMutationVariables,
  TryonMutationVariablesWithFiles,
  TryonMutationResponse,
  TryonMutationError,
  TryonMutationContext,
  UseTryonMutationReturn,
  UseTryonMutationConfig
} from '../types/tryon.types';
import {
  processImageForTryon,
  ImageProcessingError,
  ImageDimensionError,
  type ImageProcessingOptions
} from '../utils/imageProcessing';
import {
  FileTypeNotSupportedError,
  FileTooLargeError,
  CompressionFailedError
} from '../../utils/image';
import {
  classifyTryonError,
  logAndClassifyError,
  isErrorRetryable as isErrorRetryableFromClassification
} from '../utils/errorHandling';
import {
  getOptimisticUpdatesManager,
  OptimisticUpdatesManager
} from '../utils/optimisticUpdates';
import {
  invalidateCacheAfterMutation
} from '../utils/cacheInvalidation';

/**
 * API endpoint for try-on requests
 */
const TRYON_API_ENDPOINT = '/api/tryon';

/**
 * Default configuration for the try-on mutation
 */
const DEFAULT_CONFIG: Required<Pick<UseTryonMutationConfig, 'enableRetry' | 'maxRetries' | 'initialRetryDelay' | 'enableOptimisticUpdates'>> = {
  enableRetry: true,
  maxRetries: 3,
  initialRetryDelay: 1000,
  enableOptimisticUpdates: false
};

/**
 * Mutation function that calls the try-on API
 */
async function tryonMutationFn(variables: TryonMutationVariables): Promise<TryonMutationResponse> {
  const { modelImage, apparelImages, options } = variables;
  
  // Prepare request payload
  const payload = {
    modelImage,
    apparelImages,
    ...(options?.metadata && { metadata: options.metadata })
  };

  // Configure request options
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  // Add timeout if specified
  if (options?.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    requestInit.signal = controller.signal;
    
    try {
      const response = await fetch(TRYON_API_ENDPOINT, requestInit);
      clearTimeout(timeoutId);
      return handleApiResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Standard request without timeout
  const response = await fetch(TRYON_API_ENDPOINT, requestInit);
  return handleApiResponse(response);
}

/**
 * Handle API response and convert to appropriate format
 */
async function handleApiResponse(response: Response): Promise<TryonMutationResponse> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: TryonMutationError = {
      error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      details: errorData.details,
      code: errorData.code,
      status: response.status,
      retryable: response.status >= 500 || response.status === 408 || response.status === 429
    };
    throw error;
  }

  const data = await response.json();
  
  // Validate response structure
  if (!data.img_generated) {
    throw new Error('Invalid API response: missing img_generated field');
  }

  return {
    img_generated: data.img_generated,
    metadata: data.metadata
  };
}

/**
 * Determine if an error is retryable using comprehensive classification
 */
function isRetryableError(error: unknown): boolean {
  // First check if error has explicit retryable property
  if (error && typeof error === 'object' && 'retryable' in error) {
    return Boolean(error.retryable);
  }
  
  // Use comprehensive error classification
  return isErrorRetryableFromClassification(error);
}

/**
 * Process image inputs if they are File objects
 */
async function processImageInputs(
  variables: TryonMutationVariables | TryonMutationVariablesWithFiles,
  imageProcessingOptions?: ImageProcessingOptions
): Promise<{
  processedVariables: TryonMutationVariables;
  imageProcessingResults?: {
    modelImageResult?: import('../utils/imageProcessing').ImageProcessingResult;
    apparelImageResults?: import('../utils/imageProcessing').ImageProcessingResult[];
    totalProcessingTime: number;
  };
}> {
  const startTime = Date.now();
  
  // Check if we have File objects to process
  const hasFileInputs = variables.modelImage instanceof File || 
    variables.apparelImages.some(img => img instanceof File);
  
  if (!hasFileInputs) {
    // All inputs are already base64 strings
    return {
      processedVariables: variables as TryonMutationVariables
    };
  }
  
  try {
    let modelImageResult: import('../utils/imageProcessing').ImageProcessingResult | undefined;
    const apparelImageResults: import('../utils/imageProcessing').ImageProcessingResult[] = [];
    let processedModelImage: string;
    const processedApparelImages: string[] = [];
    
    // Process model image if it's a File
    if (variables.modelImage instanceof File) {
      const processedImage = await processImageForTryon(variables.modelImage, imageProcessingOptions);
      modelImageResult = processedImage;
      processedModelImage = processedImage.processedImage;
    } else {
      processedModelImage = variables.modelImage;
    }
    
    // Process apparel images
    for (let i = 0; i < variables.apparelImages.length; i++) {
      const image = variables.apparelImages[i];
      if (image instanceof File) {
        const processedImage = await processImageForTryon(image, imageProcessingOptions);
        apparelImageResults.push(processedImage);
        processedApparelImages.push(processedImage.processedImage);
      } else {
        processedApparelImages.push(image);
      }
    }
    
    const totalProcessingTime = Date.now() - startTime;
    
    return {
      processedVariables: {
        modelImage: processedModelImage,
        apparelImages: processedApparelImages,
        options: variables.options
      },
      imageProcessingResults: {
        modelImageResult,
        apparelImageResults: apparelImageResults.length > 0 ? apparelImageResults : undefined,
        totalProcessingTime
      }
    };
  } catch (error) {
    // Re-throw known image processing errors
    if (error instanceof FileTypeNotSupportedError ||
        error instanceof FileTooLargeError ||
        error instanceof CompressionFailedError ||
        error instanceof ImageProcessingError ||
        error instanceof ImageDimensionError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new ImageProcessingError(
      'Unexpected error during image processing',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Create mutation context for lifecycle tracking
 */
function createMutationContext(
  variables: TryonMutationVariables,
  retryCount = 0,
  previousError?: Error,
  imageProcessingResults?: {
    modelImageResult?: import('../utils/imageProcessing').ImageProcessingResult;
    apparelImageResults?: import('../utils/imageProcessing').ImageProcessingResult[];
    totalProcessingTime: number;
  }
): TryonMutationContext {
  return {
    variables,
    startTime: Date.now(),
    retryCount,
    previousError,
    imageProcessingResults
  };
}

/**
 * React Query mutation hook for try-on functionality
 * 
 * @param config - Optional configuration for the mutation
 * @returns UseTryonMutationReturn object with mutation state and functions
 */
export function useTryonMutation(config: UseTryonMutationConfig = {}): UseTryonMutationReturn {
  const queryClient = useQueryClient();
  
  // Merge configuration with defaults
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  // Get optimistic updates manager instance
  const optimisticManager = useMemo(() => {
    try {
      return getOptimisticUpdatesManager();
    } catch {
      // Initialize if not already initialized
      return new OptimisticUpdatesManager(queryClient);
    }
  }, [queryClient]);

  // Track active optimistic updates
  const activeOptimisticUpdates = useMemo(() => new Map<string, string>(), []);

  // Define lifecycle callbacks with useCallback
  const onMutateCallback = useCallback(async (variables: TryonMutationVariables | TryonMutationVariablesWithFiles) => {
    try {
      // Extract image processing options from config and variables (variables take precedence)
      const configOptions = mergedConfig.imageProcessing ? {
        targetWidth: mergedConfig.imageProcessing.targetWidth,
        targetHeight: mergedConfig.imageProcessing.targetHeight,
        maxSizeKB: mergedConfig.imageProcessing.maxSizeKB,
        quality: mergedConfig.imageProcessing.compressionQuality,
        preserveAspectRatio: mergedConfig.imageProcessing.preserveAspectRatio
      } : undefined;
      
      const variableOptions = variables.options?.imageProcessing ? {
        targetWidth: variables.options.imageProcessing.targetWidth,
        targetHeight: variables.options.imageProcessing.targetHeight,
        maxSizeKB: variables.options.imageProcessing.maxSizeKB,
        quality: variables.options.imageProcessing.compressionQuality,
        preserveAspectRatio: variables.options.imageProcessing.preserveAspectRatio
      } : undefined;
      
      // Merge options with variable options taking precedence
      const imageProcessingOptions: ImageProcessingOptions | undefined = 
        configOptions || variableOptions ? {
          ...configOptions,
          ...variableOptions
        } : undefined;
      
      // Process images if needed
      const { processedVariables, imageProcessingResults } = await processImageInputs(
        variables, 
        imageProcessingOptions
      );
      
      // Create context with processed variables and image processing results
      const context = createMutationContext(
        processedVariables,
        0,
        undefined,
        imageProcessingResults
      );

      // Start optimistic updates if enabled
      let optimisticId: string | undefined;
      if (mergedConfig.enableOptimisticUpdates) {
        try {
          const optimisticContext = optimisticManager.startOptimisticUpdate(
            processedVariables,
            mergedConfig.optimisticConfig
          );
          optimisticId = optimisticContext.optimisticId;
          if (optimisticId) {
            activeOptimisticUpdates.set(processedVariables.modelImage + processedVariables.apparelImages.join(''), optimisticId);
          }
          
          // Add optimistic ID to context for tracking
          context.optimisticId = optimisticId;
        } catch (error) {
          console.warn('Failed to start optimistic updates:', error);
        }
      }
      
      // Call user-provided onMutate if available
      if (mergedConfig.onMutate) {
        const userContext = await mergedConfig.onMutate(processedVariables);
        if (userContext) {
          return { ...context, ...userContext };
        }
      }
      
      return context;
    } catch (error) {
      // If image processing fails, still allow user's onMutate to be called
      // The user's onMutate can decide how to handle the failure
      let context;
      
      const hasFileInputs = variables.modelImage instanceof File || 
        variables.apparelImages.some(img => img instanceof File);
      
      if (hasFileInputs) {
        // Create context manually for File inputs since createMutationContext expects strings
        context = {
          variables: variables as TryonMutationVariablesWithFiles,
          startTime: Date.now(),
          retryCount: 0
        } as TryonMutationContext;
      } else {
        // All inputs are base64 strings, safe to cast
        context = createMutationContext(variables as TryonMutationVariables);
      }
      
      if (mergedConfig.onMutate && !hasFileInputs) {
        try {
          // onMutate expects TryonMutationVariables (strings only), so only call if no File inputs
          const userContext = await mergedConfig.onMutate(variables as TryonMutationVariables);
          if (userContext) {
            context = { ...context, ...userContext };
          }
        } catch {
          // If onMutate also fails, prefer the original processing error
          console.warn('onMutate failed during error handling');
        }
      }
      
      // Always re-throw the error so mutation fails appropriately
      throw error;
    }
  }, [mergedConfig, optimisticManager, activeOptimisticUpdates]);

  const onSuccessCallback = useCallback(async (
    data: TryonMutationResponse,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => {
    // Complete optimistic updates if they were started
    const optimisticId = context.optimisticId;
    if (optimisticId && mergedConfig.enableOptimisticUpdates) {
      try {
        optimisticManager.completeOptimisticUpdate(optimisticId, data, context);
        
        // Clean up tracking
        const trackingKey = variables.modelImage + variables.apparelImages.join('');
        activeOptimisticUpdates.delete(trackingKey);
      } catch (error) {
        console.warn('Failed to complete optimistic update:', error);
      }
    }

    // Advanced cache invalidation with configurable strategies
    try {
      await invalidateCacheAfterMutation(
        queryClient,
        data,
        variables,
        context,
        mergedConfig.cacheInvalidationConfig
      );
    } catch (error) {
      console.warn('Failed to invalidate cache after mutation:', error);
      
      // Fallback to basic invalidation
      await Promise.allSettled([
        queryClient.invalidateQueries({ 
          queryKey: ['tryon-history'],
          exact: false 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['user-data'],
          exact: false 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['tryon-stats'],
          exact: false 
        })
      ]);
    }
    
    // Call user-provided onSuccess with processed variables
    if (mergedConfig.onSuccess) {
      mergedConfig.onSuccess(data, context.variables, context);
    }
  }, [mergedConfig, queryClient, optimisticManager, activeOptimisticUpdates]);

  const onErrorCallback = useCallback((
    error: unknown,
    variables: TryonMutationVariables,
    context: TryonMutationContext | undefined
  ) => {
    // Rollback optimistic updates if they were started
    const optimisticId = context?.optimisticId;
    if (optimisticId && mergedConfig.enableOptimisticUpdates) {
      try {
        optimisticManager.rollbackOptimisticUpdate(optimisticId, error);
        
        // Clean up tracking
        const trackingKey = variables.modelImage + variables.apparelImages.join('');
        activeOptimisticUpdates.delete(trackingKey);
      } catch (rollbackError) {
        console.warn('Failed to rollback optimistic update:', rollbackError);
      }
    }

    // Classify and log the error comprehensively
    const classifiedError = logAndClassifyError(error, {
      mutationVariables: variables,
      mutationContext: context,
      timestamp: new Date().toISOString()
    });

    // Format error for mutation system compatibility
    const formattedError: TryonMutationError = {
      error: classifiedError.userMessage,
      details: classifiedError.technicalMessage,
      code: classifiedError.errorCode,
      retryable: classifiedError.retryable,
      // Add classified error information
      category: classifiedError.category,
      severity: classifiedError.severity,
      recoveryActions: classifiedError.recoveryActions
    };

    // Call user-provided onError with enhanced error information
    if (mergedConfig.onError && context) {
      mergedConfig.onError(formattedError, variables, context);
    }
  }, [mergedConfig, optimisticManager, activeOptimisticUpdates]);

  const onSettledCallback = useCallback((
    data: TryonMutationResponse | undefined,
    error: unknown,
    variables: TryonMutationVariables,
    context: TryonMutationContext | undefined
  ) => {
    // Format error with comprehensive classification if error exists
    let formattedError: TryonMutationError | null = null;
    
    if (error) {
      const classifiedError = classifyTryonError(error, {
        mutationVariables: variables,
        mutationContext: context,
        settled: true,
        timestamp: new Date().toISOString()
      });

      formattedError = {
        error: classifiedError.userMessage,
        details: classifiedError.technicalMessage,
        code: classifiedError.errorCode,
        retryable: classifiedError.retryable,
        category: classifiedError.category,
        severity: classifiedError.severity,
        recoveryActions: classifiedError.recoveryActions
      };
    }

    // Final cleanup of any remaining optimistic updates
    if (context) {
      const optimisticId = context.optimisticId;
      if (optimisticId) {
        const trackingKey = variables.modelImage + variables.apparelImages.join('');
        activeOptimisticUpdates.delete(trackingKey);
      }
    }

    // Call user-provided onSettled
    if (mergedConfig.onSettled && context) {
      mergedConfig.onSettled(data, formattedError, variables, context);
    }
  }, [mergedConfig, activeOptimisticUpdates]);

  // Cleanup effect for optimistic updates on unmount
  useEffect(() => {
    return () => {
      // Rollback any remaining optimistic updates when component unmounts
      activeOptimisticUpdates.forEach((optimisticId) => {
        try {
          optimisticManager.rollbackOptimisticUpdate(optimisticId, new Error('Component unmounted'));
        } catch (error) {
          console.warn('Failed to cleanup optimistic update on unmount:', error);
        }
      });
      activeOptimisticUpdates.clear();
    };
  }, [optimisticManager, activeOptimisticUpdates]);

  // Mutation configuration
  const mutationConfig = useMemo(() => ({
    mutationFn: tryonMutationFn,
    
    // Custom retry logic
    retry: mergedConfig.enableRetry ? (failureCount: number, error: unknown) => {
      if (failureCount >= mergedConfig.maxRetries) {
        return false;
      }
      return isRetryableError(error);
    } : false,
    
    // Exponential backoff delay
    retryDelay: (attemptIndex: number) => {
      return mergedConfig.initialRetryDelay * Math.pow(2, attemptIndex);
    },

    // Lifecycle callbacks
    onMutate: onMutateCallback,
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    onSettled: onSettledCallback
  }), [mergedConfig, onMutateCallback, onSuccessCallback, onErrorCallback, onSettledCallback]);

  // Use React Query mutation
  const mutation = useMutation(mutationConfig);

  // Return hook interface
  return useMemo<UseTryonMutationReturn>(() => ({
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    data: mutation.data,
    error: mutation.error as TryonMutationError | null,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    isIdle: mutation.isIdle,
    status: mutation.status === 'pending' ? 'loading' : mutation.status,
    reset: mutation.reset,
    context: mutation.context as TryonMutationContext | undefined
  }), [mutation]);
}