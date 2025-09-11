import { useState, useCallback } from 'react';
import { ResizeService, ResizeOptions, ResizeResponse } from '@/lib/resizeService';

export interface ResizeState {
  isResizing: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  result: ResizeResponse | null;
}

export interface UseImageResizeReturn {
  resizeState: ResizeState;
  resizeImage: (imageB64: string, options: ResizeOptions) => Promise<ResizeResponse>;
  resetResizeState: () => void;
  clearError: () => void;
}

const initialResizeState: ResizeState = {
  isResizing: false,
  isSuccess: false,
  isError: false,
  error: null,
  result: null,
};

export const useImageResize = (): UseImageResizeReturn => {
  const [resizeState, setResizeState] = useState<ResizeState>(initialResizeState);

  const resetResizeState = useCallback(() => {
    setResizeState(initialResizeState);
  }, []);

  const clearError = useCallback(() => {
    setResizeState(prev => ({
      ...prev,
      isError: false,
      error: null,
    }));
  }, []);

  const resizeImage = useCallback(async (imageB64: string, options: ResizeOptions): Promise<ResizeResponse> => {
    // Validate options
    const validation = ResizeService.validateResizeOptions(options);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      setResizeState({
        isResizing: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        result: null,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Reset state and start resizing
    setResizeState({
      isResizing: true,
      isSuccess: false,
      isError: false,
      error: null,
      result: null,
    });

    try {
      const result = await ResizeService.resizeImage(imageB64, options);

      if (result.success) {
        setResizeState({
          isResizing: false,
          isSuccess: true,
          isError: false,
          error: null,
          result,
        });
      } else {
        setResizeState({
          isResizing: false,
          isSuccess: false,
          isError: true,
          error: result.error || 'Resize failed',
          result: null,
        });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resize failed';
      setResizeState({
        isResizing: false,
        isSuccess: false,
        isError: true,
        error: errorMessage,
        result: null,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  return {
    resizeState,
    resizeImage,
    resetResizeState,
    clearError,
  };
};
