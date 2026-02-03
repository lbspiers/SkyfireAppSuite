import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import store from '../store/store';
import { clearTokens } from '../store/slices/authSlice';
import { DEPLOYMENT_ID } from '../config/version';

// NOTE: Analytics import removed to prevent circular dependency
// Analytics will be integrated later when backend is ready

// Track if we've already shown the update prompt
let updatePromptShown = false;

// Function to trigger update notification
const triggerUpdateNotification = () => {
  if (updatePromptShown) return;
  updatePromptShown = true;

  // Dispatch custom event that UpdateToast can listen for
  window.dispatchEvent(new CustomEvent('app-update-available', {
    detail: { reason: 'version-mismatch' }
  }));
};

// Helper function to summarize large objects for logging
const summarize = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return `[Array(${obj.length})]`;
  }

  const keys = Object.keys(obj);
  const keyCount = keys.length;
  const firstKeys = keys.slice(0, 5);

  if (keyCount <= 5) {
    return obj;
  }

  const summary: any = {};
  firstKeys.forEach(key => {
    summary[key] = obj[key];
  });
  summary['...'] = `${keyCount - 5} more keys`;

  return summary;
};

// Get base URL from environment
const getBaseURL = () => {
  // Use CRA env variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Default
  return 'https://api.skyfireapp.io';
};

// Check if in development mode
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach authorization token from Redux store OR sessionStorage fallback
    const { auth } = store.getState();
    let token = auth?.accessToken;

    // Fallback to sessionStorage if Redux doesn't have it
    if (!token) {
      token = sessionStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add app version header for version mismatch detection
    config.headers['X-App-Version'] = DEPLOYMENT_ID;

    return config;
  },
  (error) => {
    if (isDevelopment()) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for version mismatch
    const serverVersion = response.headers['x-app-version'];
    if (serverVersion && serverVersion !== DEPLOYMENT_ID && serverVersion !== 'dev') {
      triggerUpdateNotification();
    }

    return response;
  },
  (error: AxiosError) => {
    if (isDevelopment()) {
      console.error('[API Response Error]', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 errors - only clear tokens for auth endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/login') || url.includes('/verify');

      if (isAuthEndpoint) {
        // Clear auth tokens via Redux for authentication endpoints
        console.warn('[API] 401 on auth endpoint, clearing tokens:', url);
        store.dispatch(clearTokens());
      } else {
        // For non-auth endpoints, just log a warning
        console.warn('[Auth] 401 error on non-auth endpoint - user may need to re-authenticate:', url);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { summarize };
