/**
 * Comprehensive Error Handling Utilities
 * Type-safe error categorization, user-friendly messages, and logging
 */

import { toast } from 'react-toastify';
import type { ApiError, ApiErrorType, ValidationError } from '../types/authTypes';

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Categorize error based on status code and message
 */
export function categorizeError(error: unknown): ApiError {
  // Handle axios errors
  if (isAxiosError(error)) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    const message = responseData?.message || error.message;

    // Authentication errors
    if (statusCode === 401) {
      return {
        type: 'AUTHENTICATION_ERROR',
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
      };
    }

    // Authorization errors
    if (statusCode === 403) {
      return {
        type: 'AUTHORIZATION_ERROR',
        message: "You don't have permission to perform this action.",
        statusCode: 403,
      };
    }

    // Not found errors
    if (statusCode === 404) {
      return {
        type: 'NOT_FOUND',
        message: 'The requested resource was not found.',
        statusCode: 404,
      };
    }

    // Validation errors
    if (statusCode === 400 || statusCode === 422) {
      return {
        type: 'VALIDATION_ERROR',
        message: message || 'Please check your input and try again.',
        statusCode: statusCode,
        details: (responseData?.errors || responseData?.details) as Record<string, unknown> | undefined,
      };
    }

    // Rate limiting
    if (statusCode === 429) {
      return {
        type: 'RATE_LIMIT',
        message: 'Too many requests. Please wait a moment and try again.',
        statusCode: 429,
      };
    }

    // Server errors
    if (statusCode && statusCode >= 500) {
      return {
        type: 'SERVER_ERROR',
        message: 'Server error occurred. Our team has been notified.',
        statusCode: statusCode,
      };
    }

    // Check for specific error messages
    const lowerMessage = message?.toLowerCase() || '';

    if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
      return {
        type: 'DUPLICATE_ENTRY',
        message: 'This entry already exists. Please use a different value.',
        statusCode: statusCode || 409,
      };
    }

    if (lowerMessage.includes('unauthorized')) {
      return {
        type: 'AUTHORIZATION_ERROR',
        message: "You don't have permission to perform this action.",
        statusCode: 403,
      };
    }
  }

  // Handle network errors
  if (isNetworkError(error)) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  // Handle timeout errors
  if (isTimeoutError(error)) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Request timed out. Please try again.',
    };
  }

  // Handle AbortController cancellation
  if (isAbortError(error)) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Request was cancelled.',
    };
  }

  // Generic error
  return {
    type: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  };
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: unknown;
      details?: unknown;
    };
  };
  message: string;
  code?: string;
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    'message' in error
  );
}

function isNetworkError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return (
    error.code === 'ERR_NETWORK' ||
    error.message?.toLowerCase().includes('network') ||
    !error.response
  );
}

function isTimeoutError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return (
    error.code === 'ECONNABORTED' ||
    error.message?.toLowerCase().includes('timeout')
  );
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'CanceledError')
  );
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Get user-friendly error message for display
 */
export function getUserErrorMessage(error: ApiError, context?: string): string {
  const baseMessage = error.message;

  // Add context if provided
  if (context) {
    return `${context}: ${baseMessage}`;
  }

  return baseMessage;
}

/**
 * Get detailed error message for developers (console logging)
 */
export function getDetailedErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const parts = [
      `Status: ${error.response?.status || 'unknown'}`,
      `Message: ${error.message}`,
    ];

    if (error.response?.data) {
      parts.push(`Response: ${JSON.stringify(error.response.data)}`);
    }

    return parts.join(' | ');
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }

  return String(error);
}

// ============================================================================
// ERROR DISPLAY UTILITIES
// ============================================================================

/**
 * Display error to user via toast notification
 */
export function showErrorToast(error: unknown, context?: string): void {
  const apiError = categorizeError(error);
  const message = getUserErrorMessage(apiError, context);

  // Log detailed error for developers
  console.error('[Error]', getDetailedErrorMessage(error));

  // Show user-friendly message
  toast.error(message, {
    autoClose: apiError.type === 'NETWORK_ERROR' ? 7000 : 5000,
    position: 'top-right',
  });
}

/**
 * Display success message
 */
export function showSuccessToast(message: string, autoClose?: number): void {
  toast.success(message, {
    autoClose: autoClose || 4000,
    position: 'top-right',
  });
}

/**
 * Display warning message
 */
export function showWarningToast(message: string): void {
  toast.warning(message, {
    autoClose: 5000,
    position: 'top-right',
  });
}

/**
 * Display info message
 */
export function showInfoToast(message: string): void {
  toast.info(message, {
    autoClose: 4000,
    position: 'top-right',
  });
}

// ============================================================================
// VALIDATION ERROR HANDLING
// ============================================================================

/**
 * Extract validation errors from API response
 */
export function extractValidationErrors(
  error: ApiError
): Record<string, string> {
  const validationErrors: Record<string, string> = {};

  if (error.type !== 'VALIDATION_ERROR') {
    return validationErrors;
  }

  // Handle different validation error formats
  const details = error.details as ValidationError[] | Record<string, unknown> | undefined;

  if (Array.isArray(details)) {
    // Array format: [{ field: 'email', message: 'Invalid email' }]
    details.forEach((err: ValidationError) => {
      if (err.field) {
        validationErrors[err.field] = err.message;
      }
    });
  } else if (details && typeof details === 'object') {
    // Object format: { email: 'Invalid email', password: 'Too short' }
    Object.entries(details).forEach(([field, message]) => {
      validationErrors[field] = String(message);
    });
  }

  return validationErrors;
}

/**
 * Display field-specific validation errors
 */
export function handleValidationErrors(
  error: ApiError,
  setFieldError?: (field: string, message: string) => void
): void {
  const errors = extractValidationErrors(error);

  if (setFieldError) {
    Object.entries(errors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
  }

  // If no field-specific errors, show general message
  if (Object.keys(errors).length === 0) {
    showErrorToast(error, 'Validation Error');
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: ApiError) => boolean;
}

/**
 * Retry failed request with exponential backoff
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'exponential',
    shouldRetry = (error) => error.type === 'NETWORK_ERROR' || error.type === 'SERVER_ERROR',
  } = config;

  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = categorizeError(error);

      // Don't retry if error type shouldn't be retried
      if (!shouldRetry(lastError)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Calculate delay
      const delay =
        backoff === 'exponential'
          ? delayMs * Math.pow(2, attempt - 1)
          : delayMs * attempt;

      console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// ERROR BOUNDARY SUPPORT
// ============================================================================

/**
 * Log error for error boundary
 */
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }): void {
  console.error('[Error Boundary]', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  });

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
  }
}

// ============================================================================
// SESSION EXPIRATION HANDLING
// ============================================================================

/**
 * Check if error is session expiration and handle appropriately
 */
export function handleSessionExpiration(error: ApiError): boolean {
  if (error.type === 'AUTHENTICATION_ERROR' && error.statusCode === 401) {
    // Clear session data
    localStorage.clear();
    sessionStorage.clear();

    // Show message
    showWarningToast('Your session has expired. Please log in again.');

    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);

    return true;
  }

  return false;
}
