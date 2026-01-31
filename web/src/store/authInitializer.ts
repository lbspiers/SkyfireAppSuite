import store from './store';
import { hydrateAuth } from './slices/authSlice';

// Check if in development mode
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Initialize auth state from localStorage on app startup.
 * Call this once in your app's entry point (main.tsx or App.tsx).
 */
export const initializeAuth = (): void => {
  const accessToken = localStorage.getItem('skyfire_access_token');
  const refreshToken = localStorage.getItem('skyfire_refresh_token');
  const rememberMe = localStorage.getItem('skyfire_remember_me') === 'true';

  if (accessToken) {
    store.dispatch(hydrateAuth({
      accessToken,
      refreshToken,
      rememberMe,
      isAuthenticated: true,
    }));

    if (isDevelopment()) {
      console.debug('[Auth] Hydrated auth state from localStorage');
    }
  }
};

export default initializeAuth;
