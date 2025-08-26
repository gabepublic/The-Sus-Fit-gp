// Business Layer Mutation Types
// Types for React Query mutations and state management

import type { 
  TryonRequest, 
  TryonResponse, 
  ImageProcessingOptions, 
  ProcessedImage 
} from './api.types';
import type { BusinessLayerError } from './error.types';

// Try-on mutation types
export interface TryonMutationVariables extends TryonRequest {
  options?: {
    retryOnFailure?: boolean;
    timeout?: number;
    processingOptions?: ImageProcessingOptions;
  };
}

export interface TryonMutationData extends TryonResponse {
  metadata?: {
    startTime: string;
    endTime: string;
    processingDuration: number;
    retryCount: number;
  };
}

// Image upload mutation types
export interface ImageUploadVariables {
  file: File;
  options?: {
    maxSize?: number; // bytes
    allowedTypes?: string[];
    resize?: {
      width: number;
      height: number;
      maintainAspectRatio?: boolean;
    };
    quality?: number; // 0-100
  };
}

export interface ImageUploadData {
  imageData: string; // base64 encoded
  metadata: {
    originalName: string;
    size: number;
    type: string;
    width: number;
    height: number;
    uploadedAt: string;
  };
  processed?: ProcessedImage;
}

// Generic mutation state types
export interface MutationState<TData = unknown, TError = BusinessLayerError> {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: TError | null;
  data: TData | undefined;
}

// Mutation options type for configuration
export interface BusinessMutationOptions<TData, TVariables, TError = BusinessLayerError> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: TError, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void | Promise<void>;
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
  retry?: number | boolean | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
}

// Export commonly used mutation variable and data types
export type { 
  TryonMutationVariables as TryonVariables,
  TryonMutationData as TryonData,
  ImageUploadVariables as UploadVariables,
  ImageUploadData as UploadData
};