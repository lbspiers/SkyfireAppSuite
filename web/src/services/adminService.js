/**
 * Admin Service - Administrative functions for super admins
 * Handles registration approvals, notifications, and admin-only operations
 */

import axios from '../config/axios';
import apiEndpoints from '../config/apiEndpoints';

/**
 * Get pending user registrations awaiting approval
 * @returns {Promise<Array>} List of pending users
 */
export const getPendingRegistrations = async () => {
  try {
    const response = await axios.get(apiEndpoints.ADMIN.PENDING_REGISTRATIONS);
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error fetching pending registrations:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load pending registrations');
  }
};

/**
 * Approve a pending user registration
 * @param {string|number} userId - User ID to approve
 * @returns {Promise<Object>} Approval result
 */
export const approveRegistration = async (userId) => {
  try {
    // Backend uses PUT, not POST
    const response = await axios.put(apiEndpoints.ADMIN.APPROVE_REGISTRATION(userId));
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error approving registration:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to approve registration');
  }
};

/**
 * Reject a pending user registration
 * @param {string|number} userId - User ID to reject
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<Object>} Rejection result
 */
export const rejectRegistration = async (userId, reason = '') => {
  try {
    // Backend uses PUT, not POST
    const response = await axios.put(
      apiEndpoints.ADMIN.REJECT_REGISTRATION(userId),
      { reason }
    );
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error rejecting registration:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to reject registration');
  }
};

/**
 * Verify current user has super admin access
 * @returns {Promise<Object>} Access verification result
 */
export const verifyAdminAccess = async () => {
  try {
    const response = await axios.get(apiEndpoints.ADMIN.VERIFY_ACCESS);
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error verifying admin access:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Access denied');
  }
};

/**
 * Get admin notifications
 * @returns {Promise<Array>} List of notifications
 */
export const getAdminNotifications = async () => {
  try {
    const response = await axios.get(apiEndpoints.ADMIN.NOTIFICATIONS);
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error fetching notifications:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load notifications');
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Result
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await axios.put(apiEndpoints.ADMIN.MARK_NOTIFICATION_READ(notificationId));
    return response.data;
  } catch (error) {
    console.error('[AdminService] Error marking notification as read:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to mark notification as read');
  }
};

/**
 * Get unread notification count
 * @returns {Promise<number>} - Count of unread notifications
 */
export const getUnreadNotificationCount = async () => {
  try {
    const response = await getAdminNotifications();
    const notifications = response.data || [];
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('[AdminService] Error getting unread count:', error);
    return 0;
  }
};
