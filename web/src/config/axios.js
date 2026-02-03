import axiosLib from 'axios';
import { toast } from 'react-toastify';
import requestCache from '../services/requestCache';
import { safeGetJSON } from '../utils/safeStorage';

// Configure axios to use the API base URL
// Hardcoded temporarily to bypass env variable caching issues
const API_BASE_URL = 'https://api.skyfireapp.io';

// Create axios instance with base configuration
const axios = axiosLib.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include token and company ID in headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = safeGetJSON('userData', sessionStorage, {});
    const companyId = userData?.company?.uuid;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add x-company-id header for multi-tenancy support
    if (companyId) {
      config.headers['x-company-id'] = companyId;
    }

    // NOTE: Cache-busting headers removed due to CORS preflight restrictions
    // Backend would need to add 'cache-control', 'pragma', 'expires' to Access-Control-Allow-Headers
    // Service worker already skips ALL /api/* endpoints, so no caching occurs anyway

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we've shown a rate limit toast recently
let rateLimitToastShown = false;
let rateLimitToastTimeout = null;

// Add response interceptor for 429 rate limit auto-retry
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 429 error and we haven't exceeded max retries
    if (error.response?.status === 429 && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (error.response?.status === 429 && originalRequest._retryCount < 2) {
      originalRequest._retryCount += 1;

      // Show single toast, not one per request
      if (!rateLimitToastShown) {
        rateLimitToastShown = true;
        const retryAfter = originalRequest._retryCount === 1 ? 2 : 5;
        const serverRetryAfter = error.response.headers['retry-after'];
        const waitTime = serverRetryAfter ? parseInt(serverRetryAfter) : retryAfter;

        toast.info(`Server busy, retrying in ${waitTime}s...`, {
          position: 'top-right',
          toastId: 'rate-limit-global',
          autoClose: waitTime * 1000,
          closeOnClick: false,
        });

        // Reset toast flag after 10 seconds
        clearTimeout(rateLimitToastTimeout);
        rateLimitToastTimeout = setTimeout(() => {
          rateLimitToastShown = false;
        }, 10000);
      }

      // Let requestCache handle the retry timing
      const retryAfter = originalRequest._retryCount === 1 ? 2 : 5;
      const serverRetryAfter = error.response.headers['retry-after'];
      const waitTime = serverRetryAfter ? parseInt(serverRetryAfter) : retryAfter;
      requestCache.setRateLimited(waitTime);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));

      // Retry the request
      return axios(originalRequest);
    }

    // If all retries failed or it's not a 429, reject with error
    return Promise.reject(error);
  }
);

// Create a separate axios instance for external API calls (ngrok, etc.)
// This instance has NO interceptors and does NOT add JWT tokens
export const axiosExternal = axiosLib.create({
  // No baseURL - each call must provide full URL
  // No interceptors - Authorization headers are set explicitly by caller
});

// Export cached fetch helper for GET requests with automatic deduplication
export const cachedGet = (url, config = {}) => {
  return requestCache.fetch(url, { method: 'GET', ...config }, axios);
};

export default axios;
