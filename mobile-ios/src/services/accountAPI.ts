// src/services/accountAPI.ts

import axiosInstance from "../api/axiosInstance";
import apiEndpoints from "../config/apiEndPoint";

/** Type definitions for Account API */
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
  createdAt?: string;  // Camel case version
  created_at?: string; // Snake case version from backend
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  status: "SUCCESS" | "ERROR";
  message: string;
  data?: T; // Only present on success
}

/** Get current user profile */
export const getUserProfile = async (): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await axiosInstance.get(apiEndpoints.ACCOUNT.GET_PROFILE);
    
    // Backend returns the response in the format: { status, message, data? }
    if (response.data.status === "SUCCESS" && response.data.data) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to load profile");
    }
  } catch (error: any) {
    console.error("[accountAPI] getUserProfile error:", error?.response?.data || error?.message || error);
    
    // If it's a backend error with a structured response, extract the message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // For network or other errors
    throw new Error(error?.message || "Unable to load profile. Please check your connection.");
  }
};

/** Update user profile information */
export const updateUserProfile = async (
  data: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_PROFILE, data);
    
    // Backend returns the response in the format: { status, message, data? }
    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update profile");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserProfile error:", error?.response?.data || error?.message || error);
    
    // If it's a backend error with a structured response, extract the message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // For network or other errors
    throw new Error(error?.message || "Unable to update profile. Please check your connection.");
  }
};

/** Update user email */
export const updateUserEmail = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_EMAIL, { email });
    
    // Backend returns the response in the format: { status, message, data? }
    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update email");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserEmail error:", error?.response?.data || error?.message || error);
    
    // If it's a backend error with a structured response, extract the message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // For network or other errors
    throw new Error(error?.message || "Unable to update email. Please check your connection.");
  }
};

/** Update user phone number */
export const updateUserPhone = async (phone: string): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.put(apiEndpoints.ACCOUNT.UPDATE_PHONE, { phone });
    
    // Backend returns the response in the format: { status, message, data? }
    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to update phone number");
    }
  } catch (error: any) {
    console.error("[accountAPI] updateUserPhone error:", error?.response?.data || error?.message || error);
    
    // If it's a backend error with a structured response, extract the message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // For network or other errors
    throw new Error(error?.message || "Unable to update phone number. Please check your connection.");
  }
};

/** Change user password - STUB: Will implement later */
export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse> => {
  // TODO: Implement when backend endpoint is ready
  throw new Error("Password change functionality will be available soon");
};

/** Upload company logo - STUB: Will implement later */
export const uploadCompanyLogo = async (imageFile: FormData): Promise<ApiResponse<{photoUrl: string}>> => {
  // TODO: Implement when backend endpoint is ready
  throw new Error("Company logo upload functionality will be available soon");
};

/** Remove company logo - STUB: Will implement later */
export const removeCompanyLogo = async (): Promise<ApiResponse> => {
  // TODO: Implement when backend endpoint is ready
  throw new Error("Company logo removal functionality will be available soon");
};

/** Delete user account - Removes personal data by replacing with anonymized values */
export const deleteUserAccount = async (): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.delete(apiEndpoints.ACCOUNT.DELETE_ACCOUNT);
    
    // Backend returns the response in the format: { status, message, data? }
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
    
    // If it's a backend error with a structured response, extract the message
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    // For network or other errors
    throw new Error(error?.message || "Unable to delete account. Please check your connection.");
  }
};

/** Validate email format */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/** Validate phone number format */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/** Validate password strength */
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