/**
 * Admin API Service
 * Handles admin-only operations including pending user approvals
 */

import axios from '../config/axios';

const adminAPI = {
  /**
   * Verify if current user has admin access
   */
  verifyAdminAccess: async () => {
    try {
      const response = await axios.get('/org/verify-access');
      return response.data;
    } catch (error) {
      console.error('[Admin API] Verify access failed:', error);
      throw error;
    }
  },

  /**
   * Get list of pending users awaiting approval
   */
  getPendingUsers: async () => {
    try {
      const response = await axios.get('/org/pending-users');
      return response.data;
    } catch (error) {
      console.error('[Admin API] Get pending users failed:', error);
      throw error;
    }
  },

  /**
   * Approve a pending user
   * @param {string} userId - User ID to approve
   */
  approveUser: async (userId) => {
    try {
      const response = await axios.put(`/org/approve-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[Admin API] Approve user failed:', error);
      throw error;
    }
  },

  /**
   * Reject a pending user
   * @param {string} userUuid - User UUID to reject
   */
  rejectUser: async (userUuid) => {
    try {
      const response = await axios.put(`/org/reject-user/${userUuid}`);
      return response.data;
    } catch (error) {
      console.error('[Admin API] Reject user failed:', error);
      throw error;
    }
  },

  /**
   * Get admin metrics including pending user count
   */
  getMetrics: async () => {
    try {
      const response = await axios.get('/org/metrics');
      return response.data;
    } catch (error) {
      console.error('[Admin API] Get metrics failed:', error);
      throw error;
    }
  },

  /**
   * Register and approve a new user directly (super admin)
   * @param {object} userData - User data (company_name, first_name, last_name, email, phone_no)
   */
  registerUser: async (userData) => {
    try {
      const response = await axios.post('/org/register-user', userData);
      return response.data;
    } catch (error) {
      console.error('[Admin API] Register user failed:', error);
      throw error;
    }
  }
};

export default adminAPI;
