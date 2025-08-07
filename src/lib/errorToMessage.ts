/**
 * Error to Message Mapping Utility
 * 
 * Translates HTTP status codes and error types to user-friendly messages
 * for display in toast notifications.
 */

export const errorToMessage = (status?: number | string): string => {
  // Convert string numbers to actual numbers for comparison
  const numericStatus = typeof status === 'string' && !isNaN(Number(status)) 
    ? Number(status) 
    : status;

  switch (numericStatus) {
    case 400:
      return 'Invalid images uploaded.';
    case 429:
      return 'OpenAI rate limit reached, try later.';
    case 'TIMEOUT':
      return 'Request timed out, please retry.';
    case 500:
      return 'Server error, please try again.';
    case 503:
      return 'Service temporarily unavailable.';
    default:
      return 'Unexpected error, please retry.';
  }
};
