'use client';

// Bridge Layer Component Interfaces
// Clean, declarative APIs that hide business logic complexity from React components

import { useCallback } from 'react';
import { useTryonWorkflow, type WorkflowConfig, type TryonWorkflowState, type TryonWorkflowActions } from './useTryonWorkflow';
import { useSingleImageUpload, type UploadConfig, type UploadedFile, type UploadError } from './useImageUpload';
import { useToast } from './index';

/**
 * Simplified component state interface
 * Abstracts away complex business logic and provides only what UI components need
 */
export interface SimplifiedTryonState {
  // Core UI state
  isLoading: boolean;
  isReady: boolean;
  showResult: boolean;

  // User feedback
  resultImage: string | null;
  errorMessage: string | null;
  successMessage: string | null;

  // Upload state
  hasUserImage: boolean;
  hasApparelImage: boolean;
  userImagePreview: string | null;
  apparelImagePreview: string | null;

  // Progress
  progress: number;
  progressMessage: string;

  // Interaction state
  canGenerate: boolean;
  canRetry: boolean;
  canReset: boolean;
}

/**
 * Simplified component actions interface
 * Provides clean, semantic actions for UI components
 */
export interface SimplifiedTryonActions {
  // File upload actions
  uploadUserImage: (file: File) => Promise<void>;
  uploadApparelImage: (file: File) => Promise<void>;
  removeUserImage: () => void;
  removeApparelImage: () => void;

  // Generation actions
  generate: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;

  // UI actions
  hideResult: () => void;
  clearError: () => void;
  downloadResult: () => void;
  shareResult: () => Promise<void>;
}

/**
 * Configuration for the simplified bridge layer
 */
export interface BridgeLayerConfig {
  // Workflow configuration
  workflow?: WorkflowConfig;

  // Upload configuration
  upload?: UploadConfig;

  // UI behavior
  ui?: {
    autoHideMessages?: boolean;
    messageTimeoutMs?: number;
    enableShare?: boolean;
    enableDownload?: boolean;
    showDetailedProgress?: boolean;
  };

  // Callbacks
  callbacks?: {
    onGenerationStart?: () => void;
    onGenerationComplete?: (imageUrl: string) => void;
    onError?: (error: string) => void;
    onSuccess?: (message: string) => void;
  };
}

/**
 * Default bridge layer configuration
 */
const DEFAULT_BRIDGE_CONFIG: Required<BridgeLayerConfig> = {
  workflow: {
    timeoutMs: 60000,
    compressionLimitKB: 2048,
    autoRetry: false,
    maxRetries: 3,
    debug: process.env.NODE_ENV === 'development'
  },
  upload: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnails: true,
    thumbnailSizes: [150, 300],
    enableDragDrop: true,
    autoProcess: false,
    validation: {
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096
    }
  },
  ui: {
    autoHideMessages: true,
    messageTimeoutMs: 5000,
    enableShare: true,
    enableDownload: true,
    showDetailedProgress: true
  },
  callbacks: {}
};

/**
 * Main bridge layer hook that provides simplified interface for UI components
 */
export function useBridgeLayer(config: BridgeLayerConfig = {}): {
  state: SimplifiedTryonState;
  actions: SimplifiedTryonActions;
  advanced: {
    workflow: TryonWorkflowState & TryonWorkflowActions;
    uploads: {
      user: ReturnType<typeof useSingleImageUpload>;
      apparel: ReturnType<typeof useSingleImageUpload>;
    };
  };
} {
  const finalConfig = { ...DEFAULT_BRIDGE_CONFIG, ...config };
  const { showToast } = useToast();

  // Initialize underlying hooks
  const workflow = useTryonWorkflow(
    finalConfig.workflow,
    showToast
  );

  const userUpload = useSingleImageUpload(
    finalConfig.upload,
    (file: UploadedFile) => {
      workflow.handleUserFileUpload(file.file);
    },
    (error: UploadError) => {
      finalConfig.callbacks.onError?.(error.message);
      showToast(error.message, 'error');
    }
  );

  const apparelUpload = useSingleImageUpload(
    finalConfig.upload,
    (file: UploadedFile) => {
      workflow.handleApparelFileUpload(file.file);
    },
    (error: UploadError) => {
      finalConfig.callbacks.onError?.(error.message);
      showToast(error.message, 'error');
    }
  );

  // Simplified state mapping
  const simplifiedState: SimplifiedTryonState = {
    // Core UI state
    isLoading: workflow.isCapturing ||
               userUpload.uploadState === 'processing' ||
               apparelUpload.uploadState === 'processing',
    isReady: workflow.canGenerate(),
    showResult: workflow.showPolaroid,

    // User feedback
    resultImage: workflow.generatedImage,
    errorMessage: workflow.error?.message || null,
    successMessage: workflow.generatedImage ? 'Try-on generated successfully!' : null,

    // Upload state
    hasUserImage: !!workflow.userImageFile || !!userUpload.file,
    hasApparelImage: !!workflow.apparelImageFile || !!apparelUpload.file,
    userImagePreview: workflow.leftCardImage || userUpload.file?.preview || null,
    apparelImagePreview: workflow.rightCardImage || apparelUpload.file?.preview || null,

    // Progress
    progress: workflow.progress,
    progressMessage: getProgressMessage(workflow.workflowState, workflow.progress),

    // Interaction state
    canGenerate: workflow.canGenerate(),
    canRetry: workflow.hasError && workflow.error?.retryable === true,
    canReset: workflow.workflowState !== 'idle' || !!userUpload.file || !!apparelUpload.file
  };

  // Simplified actions
  const simplifiedActions: SimplifiedTryonActions = {
    // File upload actions
    uploadUserImage: useCallback(async (file: File) => {
      try {
        await userUpload.uploadFile(file);
        if (finalConfig.ui.showDetailedProgress) {
          showToast('User image uploaded successfully', 'success');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upload user image';
        finalConfig.callbacks.onError?.(message);
        throw error;
      }
    }, [userUpload, finalConfig.callbacks, finalConfig.ui.showDetailedProgress, showToast]),

    uploadApparelImage: useCallback(async (file: File) => {
      try {
        await apparelUpload.uploadFile(file);
        if (finalConfig.ui.showDetailedProgress) {
          showToast('Apparel image uploaded successfully', 'success');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upload apparel image';
        finalConfig.callbacks.onError?.(message);
        throw error;
      }
    }, [apparelUpload, finalConfig.callbacks, finalConfig.ui.showDetailedProgress, showToast]),

    removeUserImage: useCallback(() => {
      userUpload.clearFiles();
      workflow.resetWorkflow();
    }, [userUpload, workflow]),

    removeApparelImage: useCallback(() => {
      apparelUpload.clearFiles();
      workflow.resetWorkflow();
    }, [apparelUpload, workflow]),

    // Generation actions
    generate: useCallback(async () => {
      try {
        finalConfig.callbacks.onGenerationStart?.();
        await workflow.startGeneration();

        if (workflow.generatedImage) {
          const message = 'Try-on generated successfully!';
          finalConfig.callbacks.onGenerationComplete?.(workflow.generatedImage);
          finalConfig.callbacks.onSuccess?.(message);

          if (finalConfig.ui.showDetailedProgress) {
            showToast(message, 'success');
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate try-on';
        finalConfig.callbacks.onError?.(message);
        throw error;
      }
    }, [workflow, finalConfig.callbacks, finalConfig.ui.showDetailedProgress, showToast]),

    retry: useCallback(async () => {
      try {
        await workflow.retryGeneration();

        if (workflow.generatedImage) {
          const message = 'Try-on generated successfully!';
          finalConfig.callbacks.onGenerationComplete?.(workflow.generatedImage);
          finalConfig.callbacks.onSuccess?.(message);

          if (finalConfig.ui.showDetailedProgress) {
            showToast(message, 'success');
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retry generation';
        finalConfig.callbacks.onError?.(message);
        throw error;
      }
    }, [workflow, finalConfig.callbacks, finalConfig.ui.showDetailedProgress, showToast]),

    reset: useCallback(() => {
      workflow.resetWorkflow();
      userUpload.clearFiles();
      apparelUpload.clearFiles();
    }, [workflow, userUpload, apparelUpload]),

    // UI actions
    hideResult: useCallback(() => {
      workflow.closePolaroid();
    }, [workflow]),

    clearError: useCallback(() => {
      workflow.clearError();
    }, [workflow]),

    downloadResult: useCallback(() => {
      if (!workflow.generatedImage || !finalConfig.ui.enableDownload) return;

      try {
        const link = document.createElement('a');
        link.href = workflow.generatedImage;
        link.download = `tryon-result-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Image downloaded successfully', 'success');
      } catch (error) {
        showToast('Failed to download image', 'error');
      }
    }, [workflow.generatedImage, finalConfig.ui.enableDownload, showToast]),

    shareResult: useCallback(async () => {
      if (!workflow.generatedImage || !finalConfig.ui.enableShare) return;

      try {
        if (navigator.share) {
          // Use native share API if available
          const response = await fetch(workflow.generatedImage);
          const blob = await response.blob();
          const file = new File([blob], 'tryon-result.png', { type: 'image/png' });

          await navigator.share({
            title: 'My Try-On Result',
            text: 'Check out my virtual try-on!',
            files: [file]
          });
        } else {
          // Fallback to copying URL
          await navigator.clipboard.writeText(workflow.generatedImage);
          showToast('Image URL copied to clipboard', 'success');
        }
      } catch (error) {
        showToast('Failed to share image', 'error');
      }
    }, [workflow.generatedImage, finalConfig.ui.enableShare, showToast])
  };

  return {
    state: simplifiedState,
    actions: simplifiedActions,
    advanced: {
      workflow,
      uploads: {
        user: userUpload,
        apparel: apparelUpload
      }
    }
  };
}

/**
 * Helper function to generate user-friendly progress messages
 */
function getProgressMessage(workflowState: string, progress: number): string {
  switch (workflowState) {
    case 'idle':
      return 'Ready to generate';
    case 'uploading':
      return 'Uploading images...';
    case 'processing':
      return 'Processing images...';
    case 'generating':
      if (progress < 30) return 'Preparing images...';
      if (progress < 80) return 'Generating try-on...';
      return 'Finalizing result...';
    case 'complete':
      return 'Generation complete!';
    case 'error':
      return 'Generation failed';
    default:
      return `Processing... ${progress}%`;
  }
}

/**
 * Specialized hook for simple try-on generation (most basic use case)
 */
export function useSimpleTryon(config: BridgeLayerConfig = {}) {
  const { state, actions } = useBridgeLayer(config);

  return {
    // Minimal state for simple components
    isLoading: state.isLoading,
    result: state.resultImage,
    error: state.errorMessage,
    canGenerate: state.canGenerate,

    // Essential actions
    uploadUserImage: actions.uploadUserImage,
    uploadApparelImage: actions.uploadApparelImage,
    generate: actions.generate,
    reset: actions.reset
  };
}

/**
 * Hook for components that need upload progress tracking
 */
export function useTryonWithProgress(config: BridgeLayerConfig = {}) {
  const { state, actions } = useBridgeLayer(config);

  return {
    ...state,
    ...actions,

    // Additional progress information
    uploadProgress: {
      user: state.hasUserImage ? 100 : 0,
      apparel: state.hasApparelImage ? 100 : 0
    },

    overallProgress: calculateOverallProgress(state)
  };
}

/**
 * Helper function to calculate overall progress
 */
function calculateOverallProgress(state: SimplifiedTryonState): number {
  let progress = 0;

  // Upload progress (40% of total)
  if (state.hasUserImage) progress += 20;
  if (state.hasApparelImage) progress += 20;

  // Generation progress (60% of total)
  if (state.isLoading || state.progress > 0) {
    progress += (state.progress * 0.6);
  }

  if (state.resultImage) progress = 100;

  return Math.round(progress);
}
