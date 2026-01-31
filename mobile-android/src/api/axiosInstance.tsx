// src/api/axiosInstance.tsx

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, DEV_API_BASE_URL } from "@env";
import store from "../store/store";
import { clearTokens } from "../store/slices/authSlice";

// In dev use DEV_API_BASE_URL if set, otherwise API_BASE_URL.
const baseURL = __DEV__ ? DEV_API_BASE_URL || API_BASE_URL : API_BASE_URL;
const DEBUG_API = __DEV__;

// Summarize an object by showing count of keys/array length and first few entries
function summarize(obj: any, depth = 1): any {
  if (obj == null || typeof obj !== "object" || depth < 0) return obj;
  if (Array.isArray(obj)) {
    return `[Array(${obj.length})]`;
  }
  const keys = Object.keys(obj);
  const summary: any = { keys: keys.length };
  for (let k of keys.slice(0, 5)) {
    const v = obj[k];
    // Handle null explicitly (typeof null === "object" in JavaScript)
    if (v === null) {
      summary[k] = null;
    } else if (typeof v === "object") {
      summary[k] = Array.isArray(v)
        ? `[Array(${v.length})]`
        : `[Object(${Object.keys(v).length} keys)]`;
    } else {
      summary[k] = v;
    }
  }
  if (keys.length > 5) summary.more = `+${keys.length - 5} more`;
  return summary;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

// Attach auth header and log concise request info
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { auth } = store.getState();
    if (auth?.accessToken) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${auth.accessToken}`;
    }

    if (DEBUG_API) {
      // Truncate long URLs (especially field lists)
      const url = config.url || '';
      const displayUrl = url.length > 100 ? url.substring(0, 100) + '...' : url;

      console.debug(
        "[API Request]",
        config.method?.toUpperCase(),
        displayUrl,
        summarize(config.params)?.keys ? `(${summarize(config.params).keys} params)` : '',
        summarize(config.data)?.keys ? `(${summarize(config.data).keys} fields)` : ''
      );
    }
    return config;
  },
  (error: AxiosError) => {
    if (DEBUG_API) console.warn("[API Request Error]", error.message);
    return Promise.reject(error);
  }
);

// Log concise response info; handle 401
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (DEBUG_API) {
      // Truncate long URLs (especially field lists)
      const url = response.config.url || '';
      const displayUrl = url.length > 100 ? url.substring(0, 100) + '...' : url;

      console.debug(
        "[API Response]",
        displayUrl,
        "→",
        response.status,
        summarize(response.data)
      );
    }
    return response;
  },
  (error: AxiosError) => {
    if (DEBUG_API) {
      console.warn(
        "[API Error]",
        error.config?.url,
        "→",
        error.response?.status,
        "\n  data:",
        summarize(error.response?.data) || error.message
      );
    }
    // Only clear tokens on 401 if it's an authentication endpoint
    // Don't logout users for profile/data fetching 401s (new users might not have all permissions)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/login') || url.includes('/verify');
      
      if (isAuthEndpoint) {
        console.warn('[API] 401 on auth endpoint, clearing tokens:', url);
        store.dispatch(clearTokens());
      } else {
        console.warn('[API] 401 on data endpoint, not logging out user:', url);
        // Don't clear tokens for data fetching endpoints - user might just lack permissions for specific data
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
