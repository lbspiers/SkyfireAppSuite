import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

// Check if in development mode
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Middleware to persist auth state to localStorage
const authPersistMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);

  // Persist auth state on relevant actions
  if (action.type.startsWith('auth/')) {
    const { auth } = store.getState();

    if (auth.isAuthenticated && auth.accessToken) {
      // Store tokens
      localStorage.setItem('skyfire_access_token', auth.accessToken);
      if (auth.refreshToken) {
        localStorage.setItem('skyfire_refresh_token', auth.refreshToken);
      }
      localStorage.setItem('skyfire_remember_me', String(auth.rememberMe));
    } else if (action.type === 'auth/clearTokens') {
      // Clear stored tokens on logout
      localStorage.removeItem('skyfire_access_token');
      localStorage.removeItem('skyfire_refresh_token');
      localStorage.removeItem('skyfire_remember_me');
    }
  }

  return result;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    // We'll add more slices as needed:
    // theme: themeReducer,
    // profile: profileReducer,
    // project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
      },
    }).concat(authPersistMiddleware),
  devTools: isDevelopment(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
