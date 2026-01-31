# API Services

This directory contains service modules for interacting with backend APIs. Each service encapsulates related API calls with proper error handling and TypeScript types.

## Directory Structure

```
src/
  services/
    accountAPI.ts         ✓ User profile & account management
    authService.js        ⚠️ Legacy auth (to be migrated)
    projectService.js     ⚠️ Legacy project (to be migrated)
    equipmentService.js   ⚠️ Legacy equipment (to be migrated)
    chatterService.js     ⚠️ Legacy chatter (to be migrated)
    scheduleService.js    ⚠️ Legacy schedule (to be migrated)
    index.ts              ✓ Barrel exports
    README.md             ✓ This file
```

## Account API Service

The [accountAPI.ts](./accountAPI.ts) service provides user profile and account management functionality.

### Endpoints

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getUserProfile()` | GET | `/user/profile` | Get current user profile |
| `updateUserProfile(data)` | PUT | `/user/profile` | Update profile information |
| `updateUserEmail(email)` | PUT | `/user/email` | Update email address |
| `updateUserPhone(phone)` | PUT | `/user/phone` | Update phone number |
| `changePassword(old, new)` | PUT | `/user/password` | Change password |
| `uploadCompanyLogo(file)` | POST | `/user/company-logo` | Upload company logo |
| `removeCompanyLogo()` | DELETE | `/user/company-logo` | Remove company logo |
| `deleteUserAccount()` | DELETE | `/auth/account` | Delete account permanently |

### Types

```typescript
interface UserProfile {
  id: string;
  uuid: string;
  username: string;
  email: string;
  phone: string;
  displayName: string;
  first_name: string;
  last_name: string;
  profilePhotoUrl: string | null;
  companyId?: string;
  companyName?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}
```

### Validation Helpers

The service includes client-side validation:

```typescript
validateEmail(email: string): boolean
validatePhone(phone: string): boolean
validatePassword(password: string): { isValid: boolean; message: string }
formatPhoneNumber(phone: string): string
getDisplayName(profile: UserProfile): string
getUserInitials(profile: UserProfile): string
```

### Usage Example

```typescript
import {
  getUserProfile,
  updateUserProfile,
  validateEmail,
  getDisplayName,
} from '@/services/accountAPI';

// Fetch profile
try {
  const result = await getUserProfile();
  if (result.status === 'SUCCESS' && result.data) {
    const displayName = getDisplayName(result.data);
    console.log('Welcome,', displayName);
  }
} catch (error) {
  console.error('Failed to load profile:', error.message);
}

// Update profile
try {
  const email = 'new@example.com';

  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  await updateUserProfile({
    email,
    displayName: 'New Name',
  });

  console.log('Profile updated successfully');
} catch (error) {
  console.error('Update failed:', error.message);
}
```

## Error Handling Pattern

All service functions follow this error handling pattern:

1. **Try-Catch Block**: Wrap axios call in try-catch
2. **Success Check**: Verify `response.data.status === "SUCCESS"`
3. **Extract Backend Message**: Check `error?.response?.data?.message` first
4. **404 Handling**: Gracefully handle unimplemented endpoints
5. **Generic Fallback**: Provide user-friendly error message

```typescript
export const exampleFunction = async (): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.get(endpoint);

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Operation failed");
    }
  } catch (error: any) {
    console.error("[service] error:", error?.response?.data || error?.message || error);

    // Handle 404 for unimplemented endpoints
    if (error?.response?.status === 404) {
      throw new Error("This feature will be available soon");
    }

    // Extract backend error message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    // Generic fallback
    throw new Error(error?.message || "Unable to complete operation. Please try again.");
  }
};
```

## Response Format

All backend endpoints return this standard format:

```typescript
{
  status: "SUCCESS" | "ERROR",
  message: string,
  data?: T,  // Present on SUCCESS
  error?: string  // Present on ERROR
}
```

## Integration with Redux

Services use the [axiosInstance](../api/axiosInstance.ts) which:
- Automatically attaches Bearer token from Redux store
- Handles 401 errors by clearing tokens
- Logs requests/responses in development mode

No need to manually handle authentication in service functions.

## Creating New Services

To create a new service:

1. **Create service file**: `src/services/exampleAPI.ts`
2. **Define types**: Export interfaces for requests/responses
3. **Implement functions**: Follow error handling pattern
4. **Export from index**: Add to `src/services/index.ts`
5. **Create hook**: Optional React hook in `src/hooks/`
6. **Document**: Add to this README

### Template

```typescript
// src/services/exampleAPI.ts

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';
import { ApiResponse } from '../api/types';

export interface ExampleData {
  id: string;
  name: string;
}

export const getExample = async (id: string): Promise<ApiResponse<ExampleData>> => {
  try {
    const response = await axiosInstance.get(`/example/${id}`);

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to get example");
    }
  } catch (error: any) {
    console.error("[exampleAPI] getExample error:", error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to load example.");
  }
};
```

## Migration Strategy

Existing JavaScript services will be gradually migrated to TypeScript:

### Priority Order:
1. ✅ **accountAPI** - User profile management
2. 🔄 **authAPI** - Login, registration, password reset (next)
3. 🔄 **projectAPI** - Project CRUD operations
4. 🔄 **equipmentAPI** - Equipment management
5. 🔄 **chatterAPI** - Team communication
6. 🔄 **scheduleAPI** - Scheduling functionality

### Migration Steps:
1. Create new `.ts` file with TypeScript version
2. Add proper types and error handling
3. Update imports in components
4. Test thoroughly
5. Remove old `.js` file

## Best Practices

1. **Always validate input**: Use validation helpers before API calls
2. **Handle all error cases**: 404s, network errors, validation errors
3. **Extract backend messages**: Show actual error from backend to user
4. **Use typed responses**: Define interfaces for all data structures
5. **Log errors**: Include context in console.error for debugging
6. **Provide fallbacks**: Graceful degradation when features unavailable
7. **Keep services thin**: Business logic goes in components/hooks
8. **Document stubs**: Mark unimplemented endpoints with `@stub` comment

## Testing Services

To test service functions:

```typescript
// Mock axios instance
jest.mock('../api/axiosInstance');

import axiosInstance from '../api/axiosInstance';
import { getUserProfile } from './accountAPI';

test('getUserProfile returns user data on success', async () => {
  const mockProfile = {
    id: '1',
    uuid: 'test-uuid',
    email: 'test@example.com',
    // ... other fields
  };

  axiosInstance.get.mockResolvedValue({
    data: {
      status: 'SUCCESS',
      message: 'Profile loaded',
      data: mockProfile,
    },
  });

  const result = await getUserProfile();

  expect(result.status).toBe('SUCCESS');
  expect(result.data).toEqual(mockProfile);
});

test('getUserProfile throws on error', async () => {
  axiosInstance.get.mockRejectedValue({
    response: {
      data: {
        message: 'Profile not found',
      },
    },
  });

  await expect(getUserProfile()).rejects.toThrow('Profile not found');
});
```

## Related Documentation

- [API Configuration](../config/apiEndpoints.ts) - All endpoint definitions
- [Axios Instance](../api/axiosInstance.ts) - HTTP client configuration
- [Redux Store](../store/README.md) - State management
- [React Hooks](../hooks/) - Custom hooks using services
