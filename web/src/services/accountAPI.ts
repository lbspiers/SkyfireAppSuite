// src/services/accountAPI.ts

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';
import { ApiResponse } from '../api/types';

/** User Profile from backend */
export interface UserProfile {
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
  created_at?: string; // Snake case version from backend
  updatedAt?: string;
}

/** Request payload for profile updates */
export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

/** Request payload for password change */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await axiosInstance.get(apiEndpoints.ACCOUNT.GET_PROFILE);

    if (response.data.status === "SUCCESS" && response.data.data) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to load profile");
    }
  } catch (error: any) {
    console.error("[accountAPI] getUserProfile error:", error?.response?.data || error?.message || error);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to load profile. Please check your connection.");
  }
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  data: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> => {
  try {
    // Transform camelCase to snake_case for backend
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      display_name: data.displayName,
    };

    console.log('[accountAPI] Updating profile with payload:', payload);

    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_PROFILE, payload);

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update profile");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserProfile error:", error?.response?.data || error?.message || error);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to update profile. Please check your connection.");
  }
};

/**
 * Update user email address
 */
export const updateUserEmail = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_EMAIL, { email });

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update email");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserEmail error:", error?.response?.data || error?.message || error);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to update email. Please check your connection.");
  }
};

/**
 * Update user phone number
 */
export const updateUserPhone = async (phone: string): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_PHONE, { phone });

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update phone number");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserPhone error:", error?.response?.data || error?.message || error);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to update phone number. Please check your connection.");
  }
};

/**
 * Change user password
 * @stub Will implement when backend endpoint is ready
 */
export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to change password");
    }
  } catch (error: any) {
    console.error("[accountAPI] changePassword error:", error?.response?.data || error?.message || error);

    // Handle 404 - endpoint may not be implemented yet
    if (error?.response?.status === 404) {
      throw new Error("Password change functionality will be available soon");
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to change password. Please try again.");
  }
};

/**
 * Upload company logo
 * @stub Will implement when backend endpoint is ready
 */
export const uploadCompanyLogo = async (file: File): Promise<ApiResponse<{ photoUrl: string }>> => {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await axiosInstance.post(apiEndpoints.ACCOUNT.UPLOAD_COMPANY_LOGO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to upload logo");
    }
  } catch (error: any) {
    console.error("[accountAPI] uploadCompanyLogo error:", error?.response?.data || error?.message || error);

    if (error?.response?.status === 404) {
      throw new Error("Company logo upload functionality will be available soon");
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to upload logo. Please try again.");
  }
};

/**
 * Remove company logo
 */
export const removeCompanyLogo = async (): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.delete(apiEndpoints.ACCOUNT.REMOVE_COMPANY_LOGO);

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to remove logo");
    }
  } catch (error: any) {
    console.error("[accountAPI] removeCompanyLogo error:", error?.response?.data || error?.message || error);

    if (error?.response?.status === 404) {
      throw new Error("Company logo removal functionality will be available soon");
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to remove logo. Please try again.");
  }
};

/**
 * Delete user account permanently
 * Removes personal data by replacing with anonymized values
 */
export const deleteUserAccount = async (): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.delete(apiEndpoints.ACCOUNT.DELETE_ACCOUNT);

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to delete account");
    }
  } catch (error: any) {
    console.error("[accountAPI] deleteUserAccount error:", error?.response?.data || error?.message || error);

    // Handle specific 404 route not found error
    if (error?.response?.status === 404 && error?.response?.data?.message?.includes("Route not found")) {
      throw new Error("Account deletion is temporarily unavailable. Please contact support to delete your account.");
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || "Unable to delete account. Please check your connection.");
  }
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  message: string;
} => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long"
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter"
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter"
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number"
    };
  }

  return {
    isValid: true,
    message: "Password is strong"
  };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Get user's display name from profile
 */
export const getDisplayName = (profile: UserProfile): string => {
  if (profile.displayName) return profile.displayName;
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  if (profile.first_name) return profile.first_name;
  if (profile.username) return profile.username;
  return profile.email;
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (profile: UserProfile): string => {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  }
  if (profile.first_name) {
    return profile.first_name.slice(0, 2).toUpperCase();
  }
  if (profile.email) {
    return profile.email.slice(0, 2).toUpperCase();
  }
  return 'U';
};
