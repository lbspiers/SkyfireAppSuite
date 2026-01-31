// src/utils/apiRetry.ts
// Utility for API calls with timeout and retry logic

interface RetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  retryOn?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  timeoutMs: 30000, // 30 seconds
  retryDelayMs: 1000, // 1 second
  retryOn: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response?.status;
    return status >= 500 && status < 600; // Server error
  },
};

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry logic and timeout
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      console.log(`[ApiRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1}`);

      // Execute with timeout
      const result = await withTimeout(fn(), opts.timeoutMs);

      if (attempt > 0) {
        console.log(`[ApiRetry] Success on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      console.warn(`[ApiRetry] Attempt ${attempt + 1} failed:`, {
        message: error?.message,
        status: error?.response?.status,
        isTimeout: error.message?.includes('timed out'),
      });

      // Check if we should retry
      const isLastAttempt = attempt === opts.maxRetries;
      const shouldRetry = !isLastAttempt && opts.retryOn(error);

      if (!shouldRetry) {
        console.error(`[ApiRetry] Giving up after ${attempt + 1} attempts`);
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = opts.retryDelayMs * Math.pow(2, attempt);
      console.log(`[ApiRetry] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Enhanced error message for user display
 */
export function getErrorMessage(error: any): string {
  // Timeout
  if (error.message?.includes('timed out')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  // Network error
  if (!error.response) {
    return 'Network error. Please check your internet connection.';
  }

  // Server error
  const status = error.response?.status;
  if (status >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  // Client error
  if (status >= 400 && status < 500) {
    return error.response?.data?.message || 'Request failed. Please try again.';
  }

  // Unknown error
  return error.message || 'An unexpected error occurred.';
}
