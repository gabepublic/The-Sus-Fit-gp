/**
 * @fileoverview UploadAngle Hooks - Isolated React hooks for the Upload Your Angle View component
 * @module @/mobile/components/UploadAngle/hooks
 * @version 1.0.0
 */

// Core hooks exports
export { useAngleUpload, default as useAngleUploadDefault } from './useAngleUpload';
export { useImageProcessing, default as useImageProcessingDefault } from './useImageProcessing';

// Re-export types that hooks consumers might need
export type {
  UseUploadReturn,
  UseImageProcessingReturn,
  UploadResult,
  UploadConfig,
  ImageValidationResult,
  ValidationFunction,
  ProgressCallback,
  UploadFunction,
  ImageMetadata
} from '../types/upload.types';