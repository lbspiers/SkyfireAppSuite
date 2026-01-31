# Backend API Infrastructure

This directory contains the foundational API layer for connecting the Skyfire web app to the backend API at `https://api.skyfireapp.io`.

## Directory Structure

```
src/
  api/
    axiosInstance.ts      # Axios config with interceptors
    types.ts              # Shared API types
    index.ts              # Re-exports for easy importing
  config/
    apiEndpoints.ts       # All API endpoint definitions
```

## Files

### 1. `axiosInstance.ts`

Pre-configured axios instance with:
- **Base URL**: Reads from `REACT_APP_API_URL` environment variable (fallback to `https://api.skyfireapp.io`)
- **Timeout**: 10 seconds
- **Request Interceptor**:
  - Auto-attaches `Authorization: Bearer <token>` header from `localStorage.skyfire_access_token`
  - Debug logs all requests in development mode
- **Response Interceptor**:
  - Debug logs all responses in development mode
  - Smart 401 handling:
    - For auth endpoints (`/auth/`, `/login`, `/verify`): Clears auth tokens
    - For other endpoints: Just logs a warning (doesn't logout user)
- **Helper Function**: `summarize()` truncates large objects for cleaner logs

### 2. `types.ts`

Shared TypeScript types:
- `ApiResponse<T>`: Standard API response wrapper
- `AuthTokens`: Access/refresh token structure
- `UserProfile`: User profile data structure

### 3. `apiEndpoints.ts`

Comprehensive endpoint configuration with these sections:
- `AUTH`: Login, register, password reset, OTP verification
- `INVENTORY_MODULE`: Equipment types, manufacturers, models, inventory management
- `SOLAR_EQUIPMENT`: Solar panels and inverters (search, stats, compatibility)
- `PROJECT`: Project CRUD, site info, equipment, photos, system details
- `COMPANY`: File uploads
- `INTRO_MODULE`: Company address, service territories
- `LOCATION`: States, zip codes, utilities
- `ACCOUNT`: User profile management
- `TEAM`: Team member management
- `DEMO`: Demo booking system

## Usage Examples

### Basic API Call

```typescript
import axiosInstance from '@/api/axiosInstance';
import apiEndpoints from '@/config/apiEndpoints';

// GET request
const response = await axiosInstance.get(apiEndpoints.AUTH.LOGIN);

// POST request
const response = await axiosInstance.post(apiEndpoints.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password123',
});
```

### Using Dynamic Endpoints

```typescript
import axiosInstance from '@/api/axiosInstance';
import apiEndpoints from '@/config/apiEndpoints';

// Endpoint with parameters
const companyId = 'company-123';
const projectId = 'project-456';

const response = await axiosInstance.get(
  apiEndpoints.PROJECT.LIST_PROJECT(companyId)
);

const siteInfo = await axiosInstance.post(
  apiEndpoints.PROJECT.SAVE_SITE_INFO(projectId),
  { address: '123 Main St' }
);
```

### Using Types

```typescript
import axiosInstance from '@/api/axiosInstance';
import { ApiResponse, UserProfile } from '@/api/types';
import apiEndpoints from '@/config/apiEndpoints';

const fetchProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get<ApiResponse<UserProfile>>(
    apiEndpoints.ACCOUNT.GET_PROFILE
  );

  if (response.data.status === 'SUCCESS' && response.data.data) {
    return response.data.data;
  }

  throw new Error(response.data.message);
};
```

### Importing via Index

```typescript
// Import everything from the api barrel export
import { axiosInstance, ApiResponse, UserProfile } from '@/api';
```

## Environment Variables

Add to your `.env` file:

```env
REACT_APP_API_URL=https://api.skyfireapp.io
```

The code supports both Create React App (`REACT_APP_*`) and Vite (`VITE_*`) environment variables.

## Authentication Flow

1. **Login**: User authenticates via `AUTH.LOGIN` endpoint
2. **Store Token**: Save `accessToken` to `localStorage.skyfire_access_token`
3. **Automatic Injection**: All subsequent requests automatically include the token
4. **401 Handling**:
   - Auth endpoints: Clear tokens and require re-login
   - Other endpoints: Log warning but keep user logged in

## Development

The axios instance automatically logs all requests and responses in development mode:

```
[API Request] { method: 'GET', url: '/user/profile', params: {...}, data: {...} }
[API Response] { status: 200, url: '/user/profile', data: {...} }
```

Large objects are summarized to prevent console spam.

## Testing

A test file is included at `src/api/test-import.ts` to verify all imports work correctly. You can delete this file after verification.

## Next Steps

In Phase 2, we'll:
1. Create Redux slices for auth state management
2. Replace `localStorage` token access with Redux selectors
3. Add refresh token logic
4. Create typed API service hooks using React Query
