'use client';

// Try-on Workflow Coordination Hook
// Bridge layer hook that coordinates the complete try-on generation process

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useTryonMutation,
  useImageProcessing,
  processImageForTryon,
  resizeImageTo1024x1536,
  type TryonMutationVariables,
  type TryonMutationResponse
} from '../business-layer';
import { fileToBase64, compressBase64, CompressionFailedError } from '../utils/image';
import { errorToMessage } from '../lib/errorToMessage';

/**
 * Workflow state enum for better type safety
 */
export enum WorkflowState {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  GENERATING = 'generating',
  COMPLETE = 'complete',
  ERROR = 'error'
}

/**
 * Error types that can occur during workflow
 */
export type WorkflowError = {
  type: 'validation' | 'upload' | 'processing' | 'generation' | 'timeout' | 'compression' | 'unknown';
  message: string;
  originalError?: Error;
  retryable: boolean;
};

/**
 * Workflow configuration options
 */
export interface WorkflowConfig {
  /** Timeout for generation in milliseconds */
  timeoutMs?: number;
  /** Base64 compression limit in KB */
  compressionLimitKB?: number;
  /** Auto-retry failed operations */
  autoRetry?: boolean;
  /** Number of retry attempts */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Image processing options */
  imageProcessing?: {
    targetWidth?: number;
    targetHeight?: number;
    quality?: number;
  };
}

/**
 * Workflow state interface (backward compatible with existing page state)
 */
export interface TryonWorkflowState {
  // Core workflow state
  workflowState: WorkflowState;
  
  // Backward compatible state (maintains existing page.tsx structure)
  isCapturing: boolean;
  showPolaroid: boolean;
  generatedImage: string | null;
  hasError: boolean;
  
  // File management
  userImageFile: File | null;
  apparelImageFile: File | null;
  leftCardImage: string | null;
  rightCardImage: string | null;
  
  // Progress and error tracking
  progress: number;
  error: WorkflowError | null;
  
  // Operation tracking
  retryCount: number;
  lastOperationTime: number | null;
}

/**
 * Workflow actions interface
 */
export interface TryonWorkflowActions {
  // File upload handlers (backward compatible)
  handleUserFileUpload: (file: File) => void;
  handleApparelFileUpload: (file: File) => void;
  handleLeftCardImageUpload: (imageUrl: string) => Promise<void>;
  handleRightCardImageUpload: (imageUrl: string) => Promise<void>;
  
  // Main workflow actions
  startGeneration: () => Promise<void>;
  retryGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  
  // State management
  resetWorkflow: () => void;
  closePolaroid: () => void;
  clearError: () => void;
  
  // Validation
  validateFiles: () => { isValid: boolean; errors: string[] };
  canGenerate: () => boolean;
}

/**
 * Toast notification function type
 */
type ToastFunction = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<WorkflowConfig> = {
  timeoutMs: 60000, // 60 seconds
  compressionLimitKB: 2048, // 2MB
  autoRetry: false,
  maxRetries: 3,
  debug: process.env.NODE_ENV === 'development',
  imageProcessing: {
    targetWidth: 1024,
    targetHeight: 1536,
    quality: 0.9
  }
};

/**
 * Main try-on workflow hook
 */
export function useTryonWorkflow(
  config: WorkflowConfig = {},
  showToast?: ToastFunction
): TryonWorkflowState & TryonWorkflowActions {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Business layer hooks
  const tryonMutation = useTryonMutation();
  const { processBasic } = useImageProcessing();
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Core state
  const [state, setState] = useState<TryonWorkflowState>({
    workflowState: WorkflowState.IDLE,
    isCapturing: false,
    showPolaroid: false,
    generatedImage: null,
    hasError: false,
    userImageFile: null,
    apparelImageFile: null,
    leftCardImage: null,
    rightCardImage: null,
    progress: 0,
    error: null,
    retryCount: 0,
    lastOperationTime: null
  });

  // Debug logging
  const log = useCallback((...args: any[]) => {
    if (finalConfig.debug) {
      console.log('[useTryonWorkflow]', ...args);
    }
  }, [finalConfig.debug]);

  // Error handler
  const handleError = useCallback((error: unknown, type: WorkflowError['type'] = 'unknown'): WorkflowError => {
    let workflowError: WorkflowError;
    
    if (error instanceof CompressionFailedError) {
      workflowError = {
        type: 'compression',
        message: 'Image is too large even after compression. Please upload a smaller file.',
        originalError: error,
        retryable: false
      };
    } else if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('AbortError'))) {
      workflowError = {
        type: 'timeout',
        message: `Request timed out after ${finalConfig.timeoutMs}ms`,
        originalError: error,
        retryable: true
      };
    } else if (error instanceof Error && error.message.includes('API request failed:')) {
      const statusMatch = error.message.match(/API request failed: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : undefined;
      workflowError = {
        type: 'generation',
        message: errorToMessage(status),
        originalError: error,
        retryable: status ? status >= 500 : true
      };
    } else {
      workflowError = {
        type,
        message: error instanceof Error ? error.message : String(error),
        originalError: error instanceof Error ? error : undefined,
        retryable: type !== 'validation'
      };
    }

    log('Error occurred:', workflowError);
    
    setState(prev => ({
      ...prev,
      workflowState: WorkflowState.ERROR,
      hasError: true,
      isCapturing: false,
      error: workflowError,
      progress: 0
    }));

    // Show toast notification
    if (showToast) {
      showToast(workflowError.message, 'error');
    }

    return workflowError;
  }, [finalConfig.timeoutMs, log, showToast]);

  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  // Validation helper
  const validateFiles = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!state.userImageFile && !state.leftCardImage) {
      errors.push('Please upload model photo');
    }
    
    if (!state.apparelImageFile && !state.rightCardImage) {
      errors.push('Please upload apparel photo');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state.userImageFile, state.apparelImageFile, state.leftCardImage, state.rightCardImage]);

  // Check if generation can start
  const canGenerate = useCallback((): boolean => {
    const { isValid } = validateFiles();
    return isValid && state.workflowState !== WorkflowState.GENERATING;
  }, [validateFiles, state.workflowState]);

  // Utility function to resize and create file from URL
  const createFileFromImageUrl = useCallback(async (imageUrl: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch (error) {
      log('Failed to create file from URL:', error);
      throw new Error('Failed to create file from image URL');
    }
  }, [log]);

  // Resize image utility
  const resizeImage = useCallback(async (imageUrl: string): Promise<string> => {
    const { targetWidth, targetHeight, quality } = finalConfig.imageProcessing;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = targetWidth || 1024;
        canvas.height = targetHeight || 1536;
        ctx.drawImage(img, 0, 0, targetWidth || 1024, targetHeight || 1536);
        
        const resizedImageUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedImageUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = imageUrl;
    });
  }, [finalConfig.imageProcessing]);

  // File upload handlers
  const handleUserFileUpload = useCallback((file: File) => {
    log('User file uploaded:', file.name, file.size);
    setState(prev => ({ ...prev, userImageFile: file }));
  }, [log]);

  const handleApparelFileUpload = useCallback((file: File) => {
    log('Apparel file uploaded:', file.name, file.size);
    setState(prev => ({ ...prev, apparelImageFile: file }));
  }, [log]);

  const handleLeftCardImageUpload = useCallback(async (imageUrl: string) => {
    try {
      log('Left card image upload started');
      setState(prev => ({ ...prev, workflowState: WorkflowState.PROCESSING }));
      
      const resizedImageUrl = await resizeImage(imageUrl);
      const file = await createFileFromImageUrl(imageUrl, 'user-image.jpg');
      
      setState(prev => ({
        ...prev,
        leftCardImage: resizedImageUrl,
        userImageFile: file,
        workflowState: WorkflowState.IDLE
      }));
      
      log('Left card image processed successfully');
    } catch (error) {
      handleError(error, 'processing');
      // Fallback to original image
      setState(prev => ({
        ...prev,
        leftCardImage: imageUrl,
        workflowState: WorkflowState.IDLE
      }));
    }
  }, [log, resizeImage, createFileFromImageUrl, handleError]);

  const handleRightCardImageUpload = useCallback(async (imageUrl: string) => {
    try {
      log('Right card image upload started');
      setState(prev => ({ ...prev, workflowState: WorkflowState.PROCESSING }));
      
      const resizedImageUrl = await resizeImage(imageUrl);
      const file = await createFileFromImageUrl(imageUrl, 'apparel-image.jpg');
      
      setState(prev => ({
        ...prev,
        rightCardImage: resizedImageUrl,
        apparelImageFile: file,
        workflowState: WorkflowState.IDLE
      }));
      
      log('Right card image processed successfully');
    } catch (error) {
      handleError(error, 'processing');
      // Fallback to original image
      setState(prev => ({
        ...prev,
        rightCardImage: imageUrl,
        workflowState: WorkflowState.IDLE
      }));
    }
  }, [log, resizeImage, createFileFromImageUrl, handleError]);

  // Main generation function
  const startGeneration = useCallback(async () => {
    try {
      log('Starting generation workflow');
      
      // Validate files
      const validation = validateFiles();
      if (!validation.isValid) {
        const message = validation.errors.length === 2 
          ? 'Please upload model photo and apparel photo before generating your fit.'
          : validation.errors[0];
        
        if (showToast) {
          showToast(message, 'warning');
        }
        return;
      }

      // Set initial state
      setState(prev => ({
        ...prev,
        workflowState: WorkflowState.GENERATING,
        isCapturing: true,
        showPolaroid: true,
        hasError: false,
        error: null,
        progress: 0,
        lastOperationTime: Date.now()
      }));

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(), 
        finalConfig.timeoutMs
      );

      try {
        updateProgress(10);

        // Convert and compress images
        const [modelB64, apparelB64] = await Promise.all([
          fileToBase64(state.userImageFile!).then(b64 => compressBase64(b64, finalConfig.compressionLimitKB)),
          fileToBase64(state.apparelImageFile!).then(b64 => compressBase64(b64, finalConfig.compressionLimitKB))
        ]);

        log('Images converted to base64 successfully');
        updateProgress(30);

        // Make API request
        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            modelImage: modelB64, 
            apparelImages: [apparelB64] 
          }),
          signal: abortControllerRef.current.signal
        });

        clearTimeout(timeoutId);
        updateProgress(80);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const { img_generated } = await response.json();
        log('Generation completed successfully');
        
        updateProgress(100);

        // Update state with success
        setState(prev => ({
          ...prev,
          workflowState: WorkflowState.COMPLETE,
          isCapturing: false,
          generatedImage: img_generated,
          progress: 100,
          retryCount: 0
        }));

      } catch (error) {
        clearTimeout(timeoutId);
        handleError(error, 'generation');
      }

    } catch (error) {
      handleError(error, 'unknown');
    }
  }, [
    log, 
    validateFiles, 
    showToast, 
    state.userImageFile, 
    state.apparelImageFile, 
    finalConfig.timeoutMs, 
    finalConfig.compressionLimitKB, 
    updateProgress, 
    handleError
  ]);

  // Retry generation
  const retryGeneration = useCallback(async () => {
    log('Retrying generation');
    setState(prev => ({ 
      ...prev, 
      retryCount: prev.retryCount + 1,
      hasError: false,
      error: null,
      generatedImage: null
    }));
    
    // Small delay before retry
    setTimeout(() => {
      setState(prev => ({ ...prev, showPolaroid: false }));
    }, 100);
    
    await startGeneration();
  }, [log, startGeneration]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    log('Cancelling generation');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      workflowState: WorkflowState.IDLE,
      isCapturing: false,
      progress: 0
    }));
  }, [log]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    log('Resetting workflow');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      workflowState: WorkflowState.IDLE,
      isCapturing: false,
      showPolaroid: false,
      generatedImage: null,
      hasError: false,
      userImageFile: null,
      apparelImageFile: null,
      leftCardImage: null,
      rightCardImage: null,
      progress: 0,
      error: null,
      retryCount: 0,
      lastOperationTime: null
    });
  }, [log]);

  // Close polaroid
  const closePolaroid = useCallback(() => {
    log('Closing polaroid');
    setState(prev => ({ ...prev, showPolaroid: false }));
  }, [log]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      hasError: false, 
      error: null,
      workflowState: WorkflowState.IDLE
    }));
  }, []);

  // Auto-retry logic
  useEffect(() => {
    if (
      finalConfig.autoRetry && 
      state.error?.retryable && 
      state.retryCount < finalConfig.maxRetries
    ) {
      const delay = Math.min(1000 * Math.pow(2, state.retryCount), 10000); // Exponential backoff
      log(`Auto-retrying in ${delay}ms (attempt ${state.retryCount + 1}/${finalConfig.maxRetries})`);
      
      const timeoutId = setTimeout(() => {
        retryGeneration();
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.error, state.retryCount, finalConfig.autoRetry, finalConfig.maxRetries, retryGeneration, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    handleUserFileUpload,
    handleApparelFileUpload,
    handleLeftCardImageUpload,
    handleRightCardImageUpload,
    startGeneration,
    retryGeneration,
    cancelGeneration,
    resetWorkflow,
    closePolaroid,
    clearError,
    validateFiles,
    canGenerate
  };
}