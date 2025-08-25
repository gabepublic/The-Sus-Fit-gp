// Business Layer Error Types

export interface BusinessLayerError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ApiError extends BusinessLayerError {
  endpoint?: string;
  method?: string;
  requestData?: unknown;
}

export interface ValidationError extends BusinessLayerError {
  field?: string;
  value?: unknown;
  constraint?: string;
}

export interface NetworkError extends BusinessLayerError {
  isNetworkError: true;
  isRetryable?: boolean;
}

export interface TimeoutError extends BusinessLayerError {
  isTimeout: true;
  duration?: number;
}

// Error factory functions
export const createBusinessLayerError = (
  message: string,
  code?: string,
  details?: Record<string, unknown>
): BusinessLayerError => ({
  name: 'BusinessLayerError',
  message,
  code,
  details,
  timestamp: new Date().toISOString(),
});

export const createApiError = (
  message: string,
  status: number,
  endpoint?: string,
  method?: string,
  requestData?: unknown
): ApiError => ({
  ...createBusinessLayerError(message, `API_ERROR_${status}`),
  name: 'ApiError',
  status,
  endpoint,
  method,
  requestData,
});

export const createValidationError = (
  message: string,
  field?: string,
  value?: unknown,
  constraint?: string
): ValidationError => ({
  ...createBusinessLayerError(message, 'VALIDATION_ERROR'),
  name: 'ValidationError',
  field,
  value,
  constraint,
});

export const createNetworkError = (
  message: string,
  isRetryable = true
): NetworkError => ({
  ...createBusinessLayerError(message, 'NETWORK_ERROR'),
  name: 'NetworkError',
  isNetworkError: true,
  isRetryable,
});

export const createTimeoutError = (
  message: string,
  duration?: number
): TimeoutError => ({
  ...createBusinessLayerError(message, 'TIMEOUT_ERROR'),
  name: 'TimeoutError',
  isTimeout: true,
  duration,
});