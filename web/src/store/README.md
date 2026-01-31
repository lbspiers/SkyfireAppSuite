# Redux Store - Auth State Management

This directory contains the Redux Toolkit setup for managing application state, starting with authentication.

## Directory Structure

```
src/
  store/
    slices/
      authSlice.ts        # Auth state management slice
    store.ts              # Redux store configuration
    hooks.ts              # Typed React-Redux hooks
    index.ts              # Barrel exports
    authInitializer.ts    # Hydrate auth from localStorage
    README.md             # This file
```

## Files

### 1. `slices/authSlice.ts`

Authentication state slice with the following structure:

**State:**
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token (optional)
- `rememberMe`: Whether user wants to stay logged in
- `loading`: Loading state for auth operations
- `isAuthenticated`: Derived from presence of accessToken
- `resetToken`: Temporary token for password reset flow

**Actions:**
- `setTokens(payload)`: Store access/refresh tokens and set authenticated
- `clearTokens()`: Logout user and clear all tokens
- `setResetToken(token)`: Store temp token for password reset
- `clearResetToken()`: Clear password reset token
- `setLoading(bool)`: Set loading state
- `hydrateAuth(state)`: Restore state from localStorage on app init

### 2. `store.ts`

Redux store configuration with:

**Reducers:**
- `auth`: Authentication state (more to be added)

**Middleware:**
- `authPersistMiddleware`: Automatically syncs auth state to localStorage
  - On `setTokens`: Saves tokens to localStorage
  - On `clearTokens`: Removes tokens from localStorage

**DevTools:** Enabled in development mode

### 3. `hooks.ts`

Typed React-Redux hooks:

- `useAppDispatch()`: Typed dispatch hook
- `useAppSelector()`: Typed selector hook
- `useAuth()`: Convenience hook for entire auth state
- `useIsAuthenticated()`: Convenience hook for auth status
- `useAccessToken()`: Convenience hook for access token

### 4. `authInitializer.ts`

Initialization function that:
- Reads tokens from localStorage on app startup
- Dispatches `hydrateAuth` to restore Redux state
- Must be called before app renders

### 5. `index.ts`

Barrel exports for clean imports throughout the app.

## Integration with Axios

The [axios instance](../api/axiosInstance.ts) is connected to Redux:

1. **Request Interceptor**: Reads `accessToken` from Redux store and attaches as Bearer token
2. **Response Interceptor**: Dispatches `clearTokens()` on 401 errors from auth endpoints

## Usage Examples

### Login Flow

```typescript
import { useAppDispatch } from '@/store';
import { setTokens } from '@/store';
import axiosInstance from '@/api/axiosInstance';
import apiEndpoints from '@/config/apiEndpoints';

function LoginForm() {
  const dispatch = useAppDispatch();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post(apiEndpoints.AUTH.LOGIN, {
        email,
        password,
      });

      if (response.data.status === 'SUCCESS') {
        dispatch(setTokens({
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          rememberMe: true,
        }));

        // User is now authenticated, tokens are in Redux and localStorage
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // ... form JSX
  );
}
```

### Logout Flow

```typescript
import { useAppDispatch } from '@/store';
import { clearTokens } from '@/store';

function LogoutButton() {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearTokens());
    // Tokens are cleared from Redux and localStorage
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protected Routes

```typescript
import { useIsAuthenticated } from '@/store';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### Accessing Auth State

```typescript
import { useAuth, useAccessToken } from '@/store';

function ProfileHeader() {
  const { isAuthenticated, loading } = useAuth();
  const accessToken = useAccessToken();

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome back!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Password Reset Flow

```typescript
import { useAppDispatch } from '@/store';
import { setResetToken, clearResetToken } from '@/store';

function ResetPasswordForm() {
  const dispatch = useAppDispatch();

  const handleRequestReset = async (email: string) => {
    const response = await axiosInstance.post(
      apiEndpoints.AUTH.RESET_PASSWORD_GET_OTP,
      { email }
    );

    if (response.data.status === 'SUCCESS') {
      dispatch(setResetToken(response.data.data.resetToken));
      navigate('/reset-password/verify');
    }
  };

  const handleCompleteReset = async (newPassword: string) => {
    // ... reset password with token
    dispatch(clearResetToken());
    navigate('/login');
  };

  return (
    // ... form JSX
  );
}
```

## Token Persistence

Tokens are persisted to localStorage automatically:

**Stored Keys:**
- `skyfire_access_token`: JWT access token
- `skyfire_refresh_token`: JWT refresh token (optional)
- `skyfire_remember_me`: "true" or "false"

**Hydration Flow:**
1. App starts (`index.js` entry point)
2. `initializeAuth()` is called before rendering
3. Tokens are read from localStorage
4. Redux state is hydrated via `hydrateAuth` action
5. App renders with authenticated state

## Redux DevTools

Redux DevTools are enabled in development mode:

1. Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools-extension)
2. Open browser DevTools > Redux tab
3. View state, actions, and time-travel debug

**Useful Actions to Monitor:**
- `auth/setTokens`: User logged in
- `auth/clearTokens`: User logged out
- `auth/hydrateAuth`: App initialized from localStorage
- `auth/setLoading`: Auth operation in progress

## Adding More State

To add new state slices (e.g., profile, projects, theme):

1. Create new slice in `slices/` directory
2. Import and add to `store.ts` reducers
3. Create typed hooks in `hooks.ts`
4. Export from `index.ts`

Example:

```typescript
// slices/profileSlice.ts
import { createSlice } from "@reduxjs/toolkit";

const profileSlice = createSlice({
  name: "profile",
  initialState: { user: null },
  reducers: {
    setProfile(state, action) {
      state.user = action.payload;
    },
  },
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;
```

```typescript
// store.ts
import profileReducer from "./slices/profileSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,  // Add here
  },
  // ...
});
```

## Testing

To test the auth flow:

1. **Start dev server**: `npm start`
2. **Open Redux DevTools** in browser
3. **Dispatch test action** in console:
   ```javascript
   window.store.dispatch({
     type: 'auth/setTokens',
     payload: {
       accessToken: 'test-token',
       rememberMe: true
     }
   });
   ```
4. **Verify localStorage**: Check Application > Local Storage in DevTools
5. **Refresh page**: Confirm state is restored from localStorage

## Troubleshooting

**Issue:** State not persisting across refreshes
- Check that `initializeAuth()` is called in `index.js` before rendering
- Verify localStorage contains tokens: `localStorage.getItem('skyfire_access_token')`

**Issue:** Axios requests missing Bearer token
- Check Redux state in DevTools: `state.auth.accessToken` should be set
- Verify axios instance import: `import axiosInstance from '@/api/axiosInstance'`

**Issue:** Redux DevTools not showing
- Install Redux DevTools browser extension
- Check that `NODE_ENV=development` or app is running via `npm start`

## Next Steps

Future enhancements:
1. Add refresh token rotation logic
2. Create profile slice for user data
3. Add theme slice for UI preferences
4. Implement RTK Query for API caching
5. Add token expiration tracking
