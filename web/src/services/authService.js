import axios from 'axios';

/**
 * Auth Service - Handles all authentication-related API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

/**
 * Login user and retrieve authentication token
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: credentials.email,
      password: credentials.password,
    });

    // Check if user must change password
    if (response.data.mustChangePassword) {
      sessionStorage.setItem('mustChangePassword', 'true');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user data using the auth token
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} User data including isSuperAdmin flag
 */
export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user (clear local storage and session)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
  delete axios.defaults.headers.common.Authorization;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
};

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null
 */
export const getUserData = () => {
  const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set authentication token in axios defaults
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

/**
 * Check if user is a super admin
 * @returns {boolean} True if user is super admin
 */
export const isSuperAdmin = () => {
  const userData = getUserData();
  return userData?.isSuperAdmin === true;
};

/**
 * Self-registration (creates company + user, requires approval)
 * User will NOT be able to login until admin approves
 *
 * @param {Object} data - Registration data
 * @param {string} data.companyName - Company name
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email address
 * @param {string} data.password - Password (min 8 chars)
 * @param {string} data.phone - Phone number
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const register = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/sign-up`, {
      companyName: data.companyName.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phoneNo: data.phone.trim(),
    });
    return response.data;
  } catch (error) {
    console.error('[AuthService] Registration error:', error);
    throw error;
  }
};

/**
 * Validate invite code and get pre-filled user data
 * @param {string} code - Invite code (SKY-XXXX-XXXX format)
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: { email, firstName, lastName, phone, companyName, companyUuid, expiresAt } }
 */
export const validateInviteCode = async (code) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/validate-invite-code`, { code });
    return response.data;
  } catch (error) {
    console.error('[AuthService] Validate invite code error:', error);
    throw error;
  }
};

/**
 * Redeem invite code and create account (instant access - no approval needed)
 * User will be logged in immediately after success
 *
 * @param {Object} data - Redemption data
 * @param {string} data.code - Invite code
 * @param {string} data.email - Email address
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.phone - Phone number
 * @param {string} data.password - Password (min 8 chars)
 * @returns {Promise<Object>} - { status: 'SUCCESS', accessToken: string, refreshToken: string }
 */
export const redeemInviteCode = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/redeem-invite-code`, {
      code: data.code,
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim(),
      password: data.password,
    });
    return response.data;
  } catch (error) {
    console.error('[AuthService] Redeem invite code error:', error);
    throw error;
  }
};

/**
 * Resend verification email to a user
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const resendVerificationEmail = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  } catch (error) {
    console.error('[AuthService] Resend verification error:', error);
    throw error;
  }
};

/**
 * Force change password for users with mustChangePassword flag
 * @param {string} newPassword - New password (min 8 chars)
 * @param {string} token - Temporary access token
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const forceChangePassword = async (newPassword, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/force-change-password`,
      { newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('[AuthService] Force change password error:', error);
    throw error;
  }
};
