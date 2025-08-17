// History Integration Utilities
// Utilities for integrating try-on mutations with history tracking

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type {
  TryonMutationResponse,
  TryonMutationVariables,
  TryonMutationContext,
  TryonMutationError,
  UseTryonMutationConfig
} from '../types/tryon.types';
import type {
  CreateTryonHistoryEntryOptions,
  TryonHistoryService,
  TryonHistoryEntry
} from '../types/history.types';
import { defaultHistoryService } from '../services/tryonHistoryService';
import { HISTORY_QUERY_KEYS } from '../hooks/useTryonHistory';

/**
 * Configuration for history integration
 */
export interface HistoryIntegrationConfig {
  /** History service to use (defaults to defaultHistoryService) */
  historyService?: TryonHistoryService;
  /** Whether to automatically save successful try-ons to history */
  autoSave?: boolean;
  /** Whether to track errors in history metadata */
  trackErrors?: boolean;
  /** Additional tags to add to history entries */
  defaultTags?: string[];
  /** Transform function for customizing history entry creation */
  transformHistoryEntry?: (
    data: TryonMutationResponse,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => Partial<CreateTryonHistoryEntryOptions>;
}

/**
 * Default configuration for history integration
 */
const DEFAULT_HISTORY_CONFIG: Required<HistoryIntegrationConfig> = {
  historyService: defaultHistoryService,
  autoSave: true,
  trackErrors: true,
  defaultTags: [],
  transformHistoryEntry: () => ({})
};

/**
 * Create enhanced mutation callbacks that integrate with history tracking
 */
export function createHistoryIntegratedCallbacks(
  config: HistoryIntegrationConfig = {},
  userConfig?: UseTryonMutationConfig
): Pick<UseTryonMutationConfig, 'onSuccess' | 'onError' | 'onSettled'> {
  const historyConfig = { ...DEFAULT_HISTORY_CONFIG, ...config };

  const onSuccess = async (
    data: TryonMutationResponse,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => {
    // Auto-save to history if enabled
    if (historyConfig.autoSave) {
      try {
        // Calculate processing time
        const processingTime = context.startTime ? Date.now() - context.startTime : undefined;
        
        // Create base history entry options
        const baseHistoryEntry: CreateTryonHistoryEntryOptions = {
          generatedImage: data.img_generated,
          modelImage: variables.modelImage,
          apparelImages: variables.apparelImages,
          processingTime,
          metadata: {
            modelVersion: data.metadata?.modelVersion,
            appliedQuality: data.metadata?.appliedQuality,
            processingConfig: {
              imageProcessing: variables.options?.imageProcessing,
              requestOptions: {
                timeout: variables.options?.timeout,
                quality: variables.options?.quality
              }
            },
            imageProcessingResults: context.imageProcessingResults
          },
          tags: [...historyConfig.defaultTags],
          isFavorite: false
        };

        // Apply custom transformation if provided
        const customizations = historyConfig.transformHistoryEntry(data, variables, context);
        const finalHistoryEntry = { ...baseHistoryEntry, ...customizations };

        // Save to history
        await historyConfig.historyService.addEntry(finalHistoryEntry);
        
        console.log('Successfully saved try-on result to history');
      } catch (error) {
        console.error('Failed to save try-on result to history:', error);
        // Don't throw - history saving shouldn't break the main flow
      }
    }

    // Call user-provided onSuccess callback
    if (userConfig?.onSuccess) {
      userConfig.onSuccess(data, variables, context);
    }
  };

  const onError = (
    error: unknown, // Using unknown for better type safety
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => {
    // Track errors in history metadata if enabled
    if (historyConfig.trackErrors && context.previousError) {
      // This could be enhanced to create error-only history entries or update metadata
      console.log('Error tracked for history integration:', {
        error: (error as Record<string, unknown>)?.error || (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString(),
        retryAttempt: context.retryCount
      });
    }

    // Call user-provided onError callback
    if (userConfig?.onError) {
      userConfig.onError(error as TryonMutationError, variables, context);
    }
  };

  const onSettled = (
    data: TryonMutationResponse | undefined,
    error: unknown,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => {
    // Additional settled handling could go here
    // For example, updating analytics or logging

    // Call user-provided onSettled callback
    if (userConfig?.onSettled) {
      userConfig.onSettled(data, error as TryonMutationError | null, variables, context);
    }
  };

  return {
    onSuccess,
    onError,
    onSettled
  };
}

/**
 * Hook for creating history-integrated mutation configuration
 */
export function useHistoryIntegratedMutationConfig(
  historyConfig: HistoryIntegrationConfig = {},
  userConfig: UseTryonMutationConfig = {}
): UseTryonMutationConfig {
  const queryClient = useQueryClient();

  // Create history-integrated callbacks
  const historyCallbacks = createHistoryIntegratedCallbacks(historyConfig, userConfig);

  // Enhanced onSuccess that also invalidates history queries
  const enhancedOnSuccess = useCallback((
    data: TryonMutationResponse,
    variables: TryonMutationVariables,
    context: TryonMutationContext
  ) => {
    // Invalidate history queries to ensure fresh data
    queryClient.invalidateQueries({ 
      queryKey: HISTORY_QUERY_KEYS.all,
      exact: false 
    });

    // Call the history-integrated onSuccess
    if (historyCallbacks.onSuccess) {
      historyCallbacks.onSuccess(data, variables, context);
    }
  }, [queryClient, historyCallbacks]);

  return {
    ...userConfig,
    onSuccess: enhancedOnSuccess,
    onError: historyCallbacks.onError,
    onSettled: historyCallbacks.onSettled
  };
}

/**
 * Utility function to create a history entry from mutation results
 * Can be used for manual history entry creation
 */
export async function createHistoryEntryFromMutation(
  data: TryonMutationResponse,
  variables: TryonMutationVariables,
  context: TryonMutationContext,
  options: {
    historyService?: TryonHistoryService;
    additionalTags?: string[];
    notes?: string;
    isFavorite?: boolean;
  } = {}
): Promise<void> {
  const historyService = options.historyService || defaultHistoryService;
  
  const processingTime = context.startTime ? Date.now() - context.startTime : undefined;
  
  const historyEntry: CreateTryonHistoryEntryOptions = {
    generatedImage: data.img_generated,
    modelImage: variables.modelImage,
    apparelImages: variables.apparelImages,
    processingTime,
    metadata: {
      modelVersion: data.metadata?.modelVersion,
      appliedQuality: data.metadata?.appliedQuality,
      processingConfig: {
        imageProcessing: variables.options?.imageProcessing,
        requestOptions: {
          timeout: variables.options?.timeout,
          quality: variables.options?.quality
        }
      },
      imageProcessingResults: context.imageProcessingResults
    },
    tags: options.additionalTags || [],
    notes: options.notes,
    isFavorite: options.isFavorite || false
  };

  await historyService.addEntry(historyEntry);
}

/**
 * Utility function to extract shareable data from a history entry
 */
export function createShareableHistoryEntry(entry: TryonHistoryEntry) {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    generatedImage: entry.generatedImage,
    processingTime: entry.processingTime,
    tags: entry.tags,
    isFavorite: entry.isFavorite,
    notes: entry.notes,
    // Don't include original images for privacy in sharing
    metadata: {
      modelVersion: entry.metadata?.modelVersion,
      appliedQuality: entry.metadata?.appliedQuality,
      processingTime: entry.processingTime
    }
  };
}