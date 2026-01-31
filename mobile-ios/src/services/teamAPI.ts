// src/services/teamAPI.ts

import axiosInstance from "../api/axiosInstance";
import apiEndpoints from "../config/apiEndPoint";

/** Type definitions for Team/User Management API */
export interface CompanyUser {
  id: string;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  role?: string;
}

export interface AddUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ApiResponse<T = any> {
  status: "SUCCESS" | "ERROR";
  message: string;
  data?: T;
}

/** Get all users in the current user's company */
export const getCompanyUsers = async (): Promise<
  ApiResponse<CompanyUser[]>
> => {
  try {
    console.log("🌐 [teamAPI] getCompanyUsers - Calling endpoint:", apiEndpoints.TEAM.GET_USERS);
    const response = await axiosInstance.get(apiEndpoints.TEAM.GET_USERS);
    console.log("🌐 [teamAPI] getCompanyUsers - Response received:", {
      status: response.status,
      dataStatus: response.data?.status,
      dataLength: response.data?.data?.length || 0
    });

    if (response.data.status === "SUCCESS") {
      console.log("✅ [teamAPI] getCompanyUsers - Success! Returning data");
      return response.data;
    } else {
      console.warn("⚠️ [teamAPI] getCompanyUsers - Non-success status:", response.data);
      throw new Error(response.data.message || "Failed to load users");
    }
  } catch (error: any) {
    console.error(
      "❌ [teamAPI] getCompanyUsers error:",
      error?.response?.data || error?.message || error
    );
    console.error("❌ [teamAPI] Error response status:", error?.response?.status);
    console.error("❌ [teamAPI] Error response data:", error?.response?.data);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(
      error?.message || "Unable to load users. Please check your connection."
    );
  }
};

/** Add a new user to the company */
export const addCompanyUser = async (
  userData: AddUserRequest
): Promise<ApiResponse<CompanyUser>> => {
  try {
    const response = await axiosInstance.post(
      apiEndpoints.TEAM.ADD_USER,
      userData
    );

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to add user");
    }
  } catch (error: any) {
    console.error(
      "[teamAPI] addCompanyUser error:",
      error?.response?.data || error?.message || error
    );

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(
      error?.message || "Unable to add user. Please check your connection."
    );
  }
};

/**
 * Delete/remove a user from the company (Soft Delete)
 *
 * Backend should:
 * - Set user status to 99 (inactive/deleted)
 * - Set user company_id to 0 (unlink from company)
 * - Keep user record for audit purposes
 * - Prevent user from logging in
 *
 * This is a permanent action that cannot be undone.
 */
export const deleteCompanyUser = async (
  userUuid: string
): Promise<ApiResponse> => {
  try {
    console.log("🗑️ [teamAPI] deleteCompanyUser - Calling endpoint:", apiEndpoints.TEAM.DELETE_USER(userUuid));
    console.log("🗑️ [teamAPI] deleteCompanyUser - User UUID:", userUuid);
    console.log("🗑️ [teamAPI] deleteCompanyUser - Expected backend action: Set status=99, company_id=0");

    const response = await axiosInstance.delete(
      apiEndpoints.TEAM.DELETE_USER(userUuid)
    );

    console.log("🗑️ [teamAPI] deleteCompanyUser - Response received:", {
      status: response.status,
      dataStatus: response.data?.status,
      message: response.data?.message
    });

    if (response.data.status === "SUCCESS") {
      console.log("✅ [teamAPI] deleteCompanyUser - Success!");
      return response.data;
    } else {
      console.warn("⚠️ [teamAPI] deleteCompanyUser - Non-success status:", response.data);
      throw new Error(response.data.message || "Failed to remove user");
    }
  } catch (error: any) {
    console.error(
      "❌ [teamAPI] deleteCompanyUser error:",
      error?.response?.data || error?.message || error
    );
    console.error("❌ [teamAPI] Error response status:", error?.response?.status);
    console.error("❌ [teamAPI] Error response data:", error?.response?.data);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(
      error?.message || "Unable to remove user. Please check your connection."
    );
  }
};

/** Resend invite code to a user */
export const resendInviteCode = async (
  email: string
): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.post(
      apiEndpoints.TEAM.RESEND_INVITE,
      { email }
    );

    if (response.data.status === "SUCCESS") {
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to resend invite");
    }
  } catch (error: any) {
    console.error(
      "[teamAPI] resendInviteCode error:",
      error?.response?.data || error?.message || error
    );

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(
      error?.message || "Unable to resend invite. Please check your connection."
    );
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
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
};
