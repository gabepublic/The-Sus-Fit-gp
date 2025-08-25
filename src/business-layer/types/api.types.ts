// Business Layer API Types
// Types for external API interactions and responses

// Re-export API schema types
export type { TryonRequest } from '@/app/api/tryon/schema';

// Try-on API response types
export interface TryonResponse {
  success: boolean;
  data?: {
    resultImage: string; // base64 encoded image
    processedAt: string; // ISO timestamp
    processingTime?: number; // milliseconds
  };
  error?: string;
  requestId?: string;
}

// API error response type
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

// API success response type
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Generic API response union type
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Image processing types
export interface ImageProcessingOptions {
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface ProcessedImage {
  data: string; // base64 encoded
  format: string;
  width: number;
  height: number;
  size: number; // bytes
  processedAt: string;
}

// Feature flag types (for future use)
export interface FeatureFlagConfig {
  key: string;
  enabled: boolean;
  value?: string | number | boolean;
  description?: string;
  environment?: string;
}

export interface FeatureFlagResponse {
  flags: Record<string, FeatureFlagConfig>;
  lastUpdated: string;
  version: string;
}