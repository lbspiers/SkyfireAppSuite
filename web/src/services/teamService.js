/**
 * Team Management API Service
 * Handles team member CRUD and invitation operations
 */

import axios from '../config/axios';

/**
 * Get all users in the current user's company
 * Company is determined by JWT token on backend
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: CompanyUser[] }
 */
export const getCompanyUsers = async () => {
  try {
    const response = await axios.get('/company/users');
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error fetching users:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load team members');
  }
};

/**
 * Add/invite a new user to the company
 * Backend will:
 * - Create user record with status=0 (pending)
 * - Generate invite code (SKY-XXXX-XXXX)
 * - Send email with invite code
 * - Code expires in 24 hours
 *
 * Super admins can specify companyId to invite to a different company.
 * Backend checks for super admin status and uses companyId if provided.
 *
 * @param {Object} userData - User data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.email - Email address
 * @param {string} [userData.phone] - Phone number (optional)
 * @param {number} [userData.roleId] - Role ID (optional, defaults to Team Member on backend)
 * @param {string} [userData.companyId] - Company UUID (optional, for super admins to invite to specific company)
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: CompanyUser }
 */
export const addCompanyUser = async (userData) => {
  try {
    const response = await axios.post('/company/users', {
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone?.trim() || undefined,
      roleId: userData.roleId || undefined,
      companyId: userData.companyId || undefined, // Backend checks if user is super admin
    });
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error adding user:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to add user');
  }
};

/**
 * Delete/remove a user from company (soft delete)
 * Backend should set status=99, company_id=0
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const deleteCompanyUser = async (userUuid) => {
  try {
    console.log('[TeamService] Deleting user:', userUuid);
    const response = await axios.delete(`/company/users/${userUuid}`);
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error deleting user:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to remove user');
  }
};

/**
 * Resend invite code to a user
 * Generates new code, expires in 24 hours
 * @param {string} email - User email
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const resendInviteCode = async (email) => {
  try {
    const response = await axios.post('/company/users/resend-invite', { email });
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error resending invite:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to resend invite');
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (at least 10 digits)
 * @param {string} phone - Phone to validate
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 10;
};

/**
 * Get all available roles grouped by category
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: { solar_ops: [], corporate: [], internal: [] } }
 */
export const getRoles = async () => {
  try {
    const response = await axios.get('/roles');
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error fetching roles:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load roles');
  }
};

/**
 * Update a team member's role
 * @param {string} userUuid - User UUID
 * @param {number} roleId - New role ID
 * @returns {Promise<Object>}
 */
export const updateUserRole = async (userUuid, roleId) => {
  try {
    const response = await axios.patch(`/company/users/${userUuid}/role`, {
      roleId,
    });
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error updating role:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to update role');
  }
};

/**
 * Get roles assigned to a specific user
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Role[] }
 */
export const getUserRoles = async (userUuid) => {
  try {
    const response = await axios.get(`/roles/users/${userUuid}/roles`);
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error fetching user roles:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load user roles');
  }
};

/**
 * Set roles for a user (replaces all existing roles)
 * @param {string} userUuid - User UUID
 * @param {number[]} roleIds - Array of role IDs
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Role[] }
 */
export const setUserRoles = async (userUuid, roleIds) => {
  try {
    const response = await axios.put(`/roles/users/${userUuid}/roles`, { roleIds });
    return response.data;
  } catch (error) {
    console.error('[TeamService] Error setting user roles:', error);
    throw new Error(error?.response?.data?.message || 'Unable to update roles');
  }
};
