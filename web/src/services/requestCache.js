/**
 * Request Cache with In-Flight Deduplication
 *
 * Features:
 * 1. Caches responses with configurable TTL
 * 2. Deduplicates simultaneous requests (multiple callers share one network call)
 * 3. Global rate limit tracking
 */

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
    this.rateLimitedUntil = null;

    // Default TTLs by endpoint pattern
    this.ttlConfig = {
      '/equipment/manufacturers': 10 * 60 * 1000, // 10 minutes
      '/api/solar-panels/manufacturers': 10 * 60 * 1000,
      '/api/inverters/manufacturers': 10 * 60 * 1000,
      '/api/batteries/manufacturers': 10 * 60 * 1000,
      '/api/solar-panels/models': 10 * 60 * 1000,
      '/api/inverters/models': 10 * 60 * 1000,
      '/api/batteries/models': 10 * 60 * 1000,
      '/equipment/models': 10 * 60 * 1000,
      'default': 60 * 1000 // 1 minute default
    };
  }

  getTTL(url) {
    for (const [pattern, ttl] of Object.entries(this.ttlConfig)) {
      if (pattern !== 'default' && url.includes(pattern)) {
        return ttl;
      }
    }
    return this.ttlConfig.default;
  }

  getCacheKey(url, options = {}) {
    return `${options.method || 'GET'}:${url}`;
  }

  isRateLimited() {
    if (!this.rateLimitedUntil) return false;
    if (Date.now() < this.rateLimitedUntil) return true;
    this.rateLimitedUntil = null;
    return false;
  }

  setRateLimited(retryAfterSeconds = 60) {
    this.rateLimitedUntil = Date.now() + (retryAfterSeconds * 1000);
    console.warn(`[RequestCache] Rate limited until ${new Date(this.rateLimitedUntil).toISOString()}`);
  }

  async fetch(url, options = {}, axiosInstance) {
    const cacheKey = this.getCacheKey(url, options);
    const method = (options.method || 'GET').toUpperCase();

    // Only cache GET requests
    if (method !== 'GET') {
      return axiosInstance.request({ url, ...options });
    }

    // Check if rate limited
    if (this.isRateLimited()) {
      const waitTime = this.rateLimitedUntil - Date.now();
      console.log(`[RequestCache] Waiting ${Math.ceil(waitTime/1000)}s for rate limit to clear`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`[RequestCache] Cache HIT: ${url}`);
      return cached.data;
    }

    // Check if request is already in flight (DEDUPLICATION)
    if (this.inFlight.has(cacheKey)) {
      console.log(`[RequestCache] Joining in-flight request: ${url}`);
      return this.inFlight.get(cacheKey);
    }

    // Make the request
    console.log(`[RequestCache] Cache MISS, fetching: ${url}`);
    const promise = axiosInstance.request({ url, ...options })
      .then(response => {
        // Cache the response
        const ttl = this.getTTL(url);
        this.cache.set(cacheKey, {
          data: response,
          expiresAt: Date.now() + ttl
        });
        return response;
      })
      .catch(error => {
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          this.setRateLimited(retryAfter);
        }
        throw error;
      })
      .finally(() => {
        this.inFlight.delete(cacheKey);
      });

    // Store in-flight promise for deduplication
    this.inFlight.set(cacheKey, promise);
    return promise;
  }

  // Clear all caches
  clear() {
    this.cache.clear();
    this.inFlight.clear();
    this.rateLimitedUntil = null;
  }

  // Clear specific cache entry
  invalidate(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.delete(cacheKey);
  }

  // Debug: get cache stats
  getStats() {
    return {
      cacheSize: this.cache.size,
      inFlightSize: this.inFlight.size,
      rateLimitedUntil: this.rateLimitedUntil,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const requestCache = new RequestCache();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.__requestCache = requestCache;
}

export default requestCache;

// Helper function for easy usage
export const cachedFetch = (url, options = {}, axiosInstance) => {
  return requestCache.fetch(url, options, axiosInstance);
};
