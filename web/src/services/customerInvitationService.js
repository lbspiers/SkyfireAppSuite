/**
 * Customer Invitation Service
 * For super admins to invite new companies/customers
 */

import axios from '../config/axios';

/**
 * Invite a new customer/company
 * @param {Object} data - Invitation data
 * @param {string} data.companyName - Company name
 * @param {string} data.contactEmail - Contact email
 * @param {string} data.contactFirstName - Contact first name
 * @param {string} data.contactLastName - Contact last name
 * @param {string} [data.contactPhone] - Contact phone (optional)
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: { inviteCode, email } }
 */
export const inviteCustomer = async (data) => {
  try {
    const response = await axios.post('/admin/invite-customer', {
      companyName: data.companyName.trim(),
      contactEmail: data.contactEmail.trim().toLowerCase(),
      contactFirstName: data.contactFirstName.trim(),
      contactLastName: data.contactLastName.trim(),
      contactPhone: data.contactPhone?.trim() || undefined,
    });
    return response.data;
  } catch (error) {
    console.error('[CustomerInvitationService] Error inviting customer:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to send customer invitation');
  }
};

/**
 * Get list of pending customer invitations
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Invitation[] }
 */
export const getPendingCustomerInvitations = async () => {
  try {
    const response = await axios.get('/admin/pending-customer-invitations');
    return response.data;
  } catch (error) {
    console.error('[CustomerInvitationService] Error fetching invitations:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load pending invitations');
  }
};

/**
 * Resend customer invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const resendCustomerInvitation = async (invitationId) => {
  try {
    const response = await axios.post(`/admin/invite-customer/${invitationId}/resend`);
    return response.data;
  } catch (error) {
    console.error('[CustomerInvitationService] Error resending invitation:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to resend invitation');
  }
};

/**
 * Cancel customer invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const cancelCustomerInvitation = async (invitationId) => {
  try {
    const response = await axios.delete(`/admin/invite-customer/${invitationId}`);
    return response.data;
  } catch (error) {
    console.error('[CustomerInvitationService] Error canceling invitation:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to cancel invitation');
  }
};
