/**
 * API Request Utilities
 * Cancellable requests, timeout handling, and request deduplication
 */

import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { categorizeError, handleSessionExpiration, showErrorToast } from './errorHandling';

// ============================================================================
// REQUEST CANCELLATION MANAGER
// ============================================================================

class RequestCancellationManager {
  private pendingRequests: Map<string, AbortController>;

  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Create a unique key for the request
   */
  private getRequestKey(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${method}:${url}:${params}`;
  }

  /**
   * Cancel pending request if it exists
   */
  cancelPending(config: AxiosRequestConfig): void {
    const key = this.getRequestKey(config);
    const controller = this.pendingRequests.get(key);

    if (controller) {
      console.log(`[Request] Cancelling pending request: ${key}`);
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Register a new request
   */
  register(config: AxiosRequestConfig): AbortController {
    const key = this.getRequestKey(config);

    // Cancel any existing request with same key
    this.cancelPending(config);

    // Create new AbortController
    const controller = new AbortController();
    this.pendingRequests.set(key, controller);

    return controller;
  }

  /**
   * Unregister a completed request
   */
  unregister(config: AxiosRequestConfig): void {
    const key = this.getRequestKey(config);
    this.pendingRequests.delete(key);
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    console.log(`[Request] Cancelling ${this.pendingRequests.size} pending requests`);
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestManager = new RequestCancellationManager();

// ============================================================================
// REQUEST WRAPPER WITH CANCELLATION SUPPORT
// ============================================================================

interface RequestOptions extends AxiosRequestConfig {
  timeout?: number;
  cancelPrevious?: boolean; // Cancel previous identical request
  showErrorToast?: boolean; // Automatically show error toast
  handleSessionExpiration?: boolean; // Automatically handle 401
}

/**
 * Make API request with cancellation support
 */
export async function makeRequest<T = unknown>(
  config: RequestOptions
): Promise<AxiosResponse<T>> {
  const {
    timeout = 30000, // 30 second default timeout
    cancelPrevious = false,
    showErrorToast: showToast = true,
    handleSessionExpiration: handleSession = true,
    ...axiosConfig
  } = config;

  try {
    // Cancel previous request if requested
    if (cancelPrevious) {
      requestManager.cancelPending(axiosConfig);
    }

    // Register request and get AbortController
    const controller = requestManager.register(axiosConfig);

    // Make request with timeout and abort signal
    const response = await axios({
      ...axiosConfig,
      timeout,
      signal: controller.signal,
    });

    // Unregister on success
    requestManager.unregister(axiosConfig);

    return response;
  } catch (error) {
    // Unregister on error
    requestManager.unregister(config);

    // Categorize error
    const apiError = categorizeError(error);

    // Handle session expiration
    if (handleSession && handleSessionExpiration(apiError)) {
      throw error;
    }

    // Show error toast if requested
    if (showToast) {
      showErrorToast(error);
    }

    throw error;
  }
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

export const api = {
  /**
   * GET request
   */
  get: <T = unknown>(
    url: string,
    config?: RequestOptions
  ): Promise<AxiosResponse<T>> => {
    return makeRequest<T>({ ...config, method: 'GET', url });
  },

  /**
   * POST request
   */
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestOptions
  ): Promise<AxiosResponse<T>> => {
    return makeRequest<T>({ ...config, method: 'POST', url, data });
  },

  /**
   * PUT request
   */
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestOptions
  ): Promise<AxiosResponse<T>> => {
    return makeRequest<T>({ ...config, method: 'PUT', url, data });
  },

  /**
   * PATCH request
   */
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestOptions
  ): Promise<AxiosResponse<T>> => {
    return makeRequest<T>({ ...config, method: 'PATCH', url, data });
  },

  /**
   * DELETE request
   */
  delete: <T = unknown>(
    url: string,
    config?: RequestOptions
  ): Promise<AxiosResponse<T>> => {
    return makeRequest<T>({ ...config, method: 'DELETE', url });
  },
};

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

class RequestDeduplicator {
  private cache: Map<string, Promise<AxiosResponse>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Create cache key from request config
   */
  private getCacheKey(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${method}:${url}:${params}:${data}`;
  }

  /**
   * Get or create request
   */
  async request<T = unknown>(
    config: AxiosRequestConfig,
    ttl = 5000
  ): Promise<AxiosResponse<T>> {
    const key = this.getCacheKey(config);

    // Return cached promise if exists
    if (this.cache.has(key)) {
      console.log(`[Request] Using cached request: ${key}`);
      return this.cache.get(key) as Promise<AxiosResponse<T>>;
    }

    // Create new request
    const promise = makeRequest<T>(config);

    // Cache the promise
    this.cache.set(key, promise);

    // Remove from cache after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    // Remove from cache on completion (success or error)
    promise
      .then(() => {
        setTimeout(() => this.cache.delete(key), ttl);
      })
      .catch(() => {
        this.cache.delete(key); // Remove immediately on error
      });

    return promise;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
}

export const deduplicator = new RequestDeduplicator();

// ============================================================================
// POLLING UTILITIES
// ============================================================================

interface PollingOptions<T> {
  request: () => Promise<AxiosResponse<T>>;
  interval: number; // Milliseconds between polls
  maxAttempts?: number; // Max number of polls (0 = infinite)
  onData?: (data: T) => void; // Called on each successful response
  onError?: (error: unknown) => void; // Called on error
  shouldStop?: (data: T) => boolean; // Return true to stop polling
}

/**
 * Poll endpoint at regular intervals
 */
export function startPolling<T = unknown>(options: PollingOptions<T>): () => void {
  const {
    request,
    interval,
    maxAttempts = 0,
    onData,
    onError,
    shouldStop,
  } = options;

  let attempt = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;

    try {
      attempt++;
      const response = await request();

      if (onData) {
        onData(response.data);
      }

      // Check if should stop
      if (shouldStop && shouldStop(response.data)) {
        console.log('[Polling] Stop condition met');
        stopped = true;
        return;
      }

      // Check max attempts
      if (maxAttempts > 0 && attempt >= maxAttempts) {
        console.log('[Polling] Max attempts reached');
        stopped = true;
        return;
      }

      // Schedule next poll
      if (!stopped) {
        timeoutId = setTimeout(poll, interval);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.error('[Polling] Error:', error);
      }

      // Continue polling on error (unless stopped)
      if (!stopped && (maxAttempts === 0 || attempt < maxAttempts)) {
        timeoutId = setTimeout(poll, interval);
      }
    }
  };

  // Start polling
  poll();

  // Return stop function
  return () => {
    stopped = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

// ============================================================================
// BATCH REQUESTS
// ============================================================================

/**
 * Execute multiple requests in parallel
 */
export async function batchRequests<T = unknown>(
  requests: Array<() => Promise<AxiosResponse<T>>>
): Promise<AxiosResponse<T>[]> {
  return Promise.all(requests.map((fn) => fn()));
}

/**
 * Execute multiple requests sequentially
 */
export async function sequentialRequests<T = unknown>(
  requests: Array<() => Promise<AxiosResponse<T>>>
): Promise<AxiosResponse<T>[]> {
  const results: AxiosResponse<T>[] = [];

  for (const request of requests) {
    const result = await request();
    results.push(result);
  }

  return results;
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Cancel all pending requests (call on component unmount)
 */
export function cancelAllRequests(): void {
  requestManager.cancelAll();
}

/**
 * Clear request cache
 */
export function clearRequestCache(): void {
  deduplicator.clear();
}
