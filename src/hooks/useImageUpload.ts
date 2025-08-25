'use client';

// Image Upload Hooks
// Specialized hooks for handling file upload operations with validation and preview management

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useImageValidation,
  useImageMetadata,
  useImageThumbnail,
  processImageForTryon,
  type ImageProcessingResult
} from '../business-layer';
import { fileToBase64 } from '../utils/image';

/**
 * Image metadata interface
 */
interface ImageMetadata {
  dimensions: { width: number; height: number };
  format: string;
  size: number;
}

/**
 * Upload state enum
 */
export enum UploadState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  ERROR = 'error'
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImageMetadata;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  stage: 'validation' | 'processing' | 'thumbnail' | 'complete';
  percentage: number;
  message: string;
}

/**
 * Upload configuration
 */
export interface UploadConfig {
  /** Maximum file size in bytes */
  maxSizeBytes?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Auto-generate thumbnails */
  generateThumbnails?: boolean;
  /** Thumbnail sizes to generate */
  thumbnailSizes?: number[];
  /** Enable drag and drop */
  enableDragDrop?: boolean;
  /** Auto-process after upload */
  autoProcess?: boolean;
  /** Validation options */
  validation?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
    aspectRatioTolerance?: number;
  };
}

/**
 * Uploaded file information
 */
export interface UploadedFile {
  file: File;
  preview: string;
  thumbnails: Record<number, string>;
  metadata?: ImageMetadata;
  processedResult?: ImageProcessingResult;
  uploadId: string;
  uploadTime: number;
}

/**
 * Upload error
 */
export interface UploadError {
  type: 'validation' | 'processing' | 'network' | 'unknown';
  message: string;
  code?: string;
  originalError?: Error;
}

/**
 * Drag and drop state
 */
export interface DragDropState {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  draggedFiles: File[];
}

/**
 * Default upload configuration
 */
const DEFAULT_CONFIG: Required<UploadConfig> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  generateThumbnails: true,
  thumbnailSizes: [150, 300, 600],
  enableDragDrop: true,
  autoProcess: false,
  validation: {
    minWidth: 256,
    minHeight: 256,
    maxWidth: 4096,
    maxHeight: 4096,
    aspectRatio: undefined,
    aspectRatioTolerance: 0.1
  }
};

/**
 * Main image upload hook
 */
export function useImageUpload(
  config: UploadConfig = {},
  onUpload?: (file: UploadedFile) => void,
  onError?: (error: UploadError) => void
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [uploadState, setUploadState] = useState<UploadState>(UploadState.IDLE);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    draggedFiles: []
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIdCounter = useRef(0);

  // Business layer hooks
  const { data: validationResult } = useImageValidation(currentFile?.file || null, false);
  const { data: metadata } = useImageMetadata(currentFile?.file || null, false);
  const { data: thumbnail } = useImageThumbnail(currentFile?.file || null, 150, false);

  // Generate unique upload ID
  const generateUploadId = useCallback(() => {
    return `upload_${Date.now()}_${++uploadIdCounter.current}`;
  }, []);

  // Update progress
  const updateProgress = useCallback((stage: UploadProgress['stage'], percentage: number, message: string) => {
    setProgress({ stage, percentage, message });
  }, []);

  // Handle errors
  const handleError = useCallback((error: unknown, type: UploadError['type'] = 'unknown') => {
    const uploadError: UploadError = {
      type,
      message: error instanceof Error ? error.message : String(error),
      originalError: error instanceof Error ? error : undefined
    };

    setError(uploadError);
    setUploadState(UploadState.ERROR);
    onError?.(uploadError);
  }, [onError]);

  // Validate file
  const validateFile = useCallback(async (file: File): Promise<FileValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File type validation
    if (!finalConfig.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Allowed types: ${finalConfig.allowedTypes.join(', ')}`);
    }

    // File size validation
    if (file.size > finalConfig.maxSizeBytes) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(finalConfig.maxSizeBytes / 1024 / 1024).toFixed(2)}MB`);
    }

    // Image dimension validation (requires metadata)
    try {
      const imageMetadata = await new Promise<ImageMetadata>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            format: file.type,
            size: file.size
          });
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const { width, height } = imageMetadata.dimensions;
      const { validation } = finalConfig;

      if ((validation.minWidth && width < validation.minWidth) || (validation.minHeight && height < validation.minHeight)) {
        errors.push(`Image dimensions ${width}x${height} are too small. Minimum: ${validation.minWidth || 0}x${validation.minHeight || 0}`);
      }

      if ((validation.maxWidth && width > validation.maxWidth) || (validation.maxHeight && height > validation.maxHeight)) {
        errors.push(`Image dimensions ${width}x${height} are too large. Maximum: ${validation.maxWidth || 'unlimited'}x${validation.maxHeight || 'unlimited'}`);
      }

      if (validation.aspectRatio) {
        const aspectRatio = width / height;
        const targetRatio = validation.aspectRatio;
        const tolerance = validation.aspectRatioTolerance || 0.1;
        
        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
          warnings.push(`Image aspect ratio ${aspectRatio.toFixed(2)} differs from recommended ${targetRatio.toFixed(2)}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: imageMetadata
      };
    } catch (error) {
      errors.push('Failed to validate image dimensions');
      return { isValid: false, errors, warnings };
    }
  }, [finalConfig]);

  // Generate thumbnails
  const generateThumbnails = useCallback(async (file: File): Promise<Record<number, string>> => {
    const thumbnails: Record<number, string> = {};

    if (!finalConfig.generateThumbnails) {
      return thumbnails;
    }

    try {
      for (const size of finalConfig.thumbnailSizes) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let width = size;
        let height = size;

        if (aspectRatio > 1) {
          height = size / aspectRatio;
        } else {
          width = size * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        thumbnails[size] = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(img.src);
      }
    } catch (error) {
      console.warn('Failed to generate thumbnails:', error);
    }

    return thumbnails;
  }, [finalConfig.generateThumbnails, finalConfig.thumbnailSizes]);

  // Process uploaded file
  const processFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const uploadId = generateUploadId();
    
    setUploadState(UploadState.VALIDATING);
    updateProgress('validation', 10, 'Validating file...');

    // Validate file
    const validation = await validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    updateProgress('processing', 30, 'Processing image...');

    // Generate preview
    const preview = URL.createObjectURL(file);

    updateProgress('thumbnail', 60, 'Generating thumbnails...');

    // Generate thumbnails
    const thumbnails = await generateThumbnails(file);

    updateProgress('complete', 80, 'Finalizing...');

    // Auto-process if enabled
    let processedResult: ImageProcessingResult | undefined;
    if (finalConfig.autoProcess) {
      try {
        processedResult = await processImageForTryon(file);
      } catch (error) {
        console.warn('Auto-processing failed:', error);
      }
    }

    const uploadedFile: UploadedFile = {
      file,
      preview,
      thumbnails,
      metadata: validation.metadata,
      processedResult,
      uploadId,
      uploadTime: Date.now()
    };

    updateProgress('complete', 100, 'Upload complete');
    setUploadState(UploadState.COMPLETE);

    return uploadedFile;
  }, [generateUploadId, updateProgress, validateFile, generateThumbnails, finalConfig.autoProcess]);

  // Handle file upload
  const uploadFile = useCallback(async (file: File) => {
    try {
      setError(null);
      const uploadedFile = await processFile(file);
      
      setUploadedFiles(prev => [...prev, uploadedFile]);
      setCurrentFile(uploadedFile);
      onUpload?.(uploadedFile);
      
      return uploadedFile;
    } catch (error) {
      handleError(error, 'processing');
      throw error;
    }
  }, [processFile, onUpload, handleError]);

  // Handle multiple file uploads
  const uploadFiles = useCallback(async (files: File[]) => {
    const results: UploadedFile[] = [];
    
    for (const file of files) {
      try {
        const result = await uploadFile(file);
        results.push(result);
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
      }
    }
    
    return results;
  }, [uploadFile]);

  // Remove uploaded file
  const removeFile = useCallback((uploadId: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.uploadId !== uploadId);
      const removedFile = prev.find(f => f.uploadId === uploadId);
      
      if (removedFile) {
        URL.revokeObjectURL(removedFile.preview);
        Object.values(removedFile.thumbnails).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      }
      
      return updated;
    });
    
    if (currentFile?.uploadId === uploadId) {
      setCurrentFile(null);
    }
  }, [currentFile]);

  // Clear all files
  const clearFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
      Object.values(file.thumbnails).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    });
    
    setUploadedFiles([]);
    setCurrentFile(null);
    setError(null);
    setUploadState(UploadState.IDLE);
    setProgress(null);
  }, [uploadedFiles]);

  // Trigger file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    // Reset input to allow same file selection
    event.target.value = '';
  }, [uploadFiles]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    const hasValidFiles = files.some(file => finalConfig.allowedTypes.includes(file.type));
    
    setDragDropState({
      isDragActive: true,
      isDragAccept: hasValidFiles,
      isDragReject: !hasValidFiles,
      draggedFiles: files
    });
  }, [finalConfig.allowedTypes]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setDragDropState({
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
      draggedFiles: []
    });
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files).filter(file => 
      finalConfig.allowedTypes.includes(file.type)
    );
    
    setDragDropState({
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
      draggedFiles: []
    });
    
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [finalConfig.allowedTypes, uploadFiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        URL.revokeObjectURL(file.preview);
        Object.values(file.thumbnails).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      });
    };
  }, []);

  return {
    // State
    uploadState,
    uploadedFiles,
    currentFile,
    progress,
    error,
    dragDropState,
    
    // Actions
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    openFilePicker,
    
    // File input props
    fileInputProps: {
      ref: fileInputRef,
      type: 'file',
      accept: finalConfig.allowedTypes.join(','),
      multiple: true,
      onChange: handleFileInputChange,
      style: { display: 'none' }
    },
    
    // Drag and drop props (only if enabled)
    ...(finalConfig.enableDragDrop ? {
      dragDropProps: {
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop
      }
    } : {}),
    
    // Utils
    validateFile,
    generateThumbnails
  };
}

/**
 * Simplified hook for single file upload
 */
export function useSingleImageUpload(
  config: UploadConfig = {},
  onUpload?: (file: UploadedFile) => void,
  onError?: (error: UploadError) => void
) {
  const upload = useImageUpload(config, onUpload, onError);
  
  const uploadSingleFile = useCallback(async (file: File) => {
    upload.clearFiles(); // Clear previous files
    return upload.uploadFile(file);
  }, [upload]);
  
  return {
    ...upload,
    uploadFile: uploadSingleFile,
    file: upload.currentFile
  };
}

/**
 * Hook for drag and drop only upload
 */
export function useDropzoneUpload(
  config: UploadConfig = {},
  onUpload?: (files: UploadedFile[]) => void,
  onError?: (error: UploadError) => void
) {
  const upload = useImageUpload(
    { ...config, enableDragDrop: true },
    undefined,
    onError
  );
  
  // Handle batch upload completion
  useEffect(() => {
    if (upload.uploadedFiles.length > 0 && upload.uploadState === UploadState.COMPLETE) {
      onUpload?.(upload.uploadedFiles);
    }
  }, [upload.uploadedFiles, upload.uploadState, onUpload]);
  
  return {
    dragDropState: upload.dragDropState,
    dragDropProps: upload.dragDropProps,
    uploadedFiles: upload.uploadedFiles,
    progress: upload.progress,
    error: upload.error,
    clearFiles: upload.clearFiles,
    removeFile: upload.removeFile
  };
}