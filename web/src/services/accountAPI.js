/**
 * Account API Service
 * Handles all account-related API calls
 */

import axios from '../config/axios';

// Profile
export const getUserProfile = async () => {
  const response = await axios.get('/api/user/profile');
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await axios.put('/api/user/profile', data);
  return response.data;
};

export const updateUserEmail = async (email) => {
  const response = await axios.put('/api/user/email', { email });
  return response.data;
};

export const updateUserPhone = async (phone) => {
  const response = await axios.put('/api/user/phone', { phone });
  return response.data;
};

// Security
export const changePassword = async (oldPassword, newPassword) => {
  const response = await axios.put('/api/user/password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
};

// Team
export const getCompanyUsers = async () => {
  const response = await axios.get('/api/company/users');
  return response.data;
};

export const addCompanyUser = async (userData) => {
  const response = await axios.post('/api/company/users', userData);
  return response.data;
};

export const deleteCompanyUser = async (userUuid) => {
  const response = await axios.delete(`/api/company/users/${userUuid}`);
  return response.data;
};

export const resendInviteCode = async (email) => {
  const response = await axios.post('/api/company/users/resend-invite', { email });
  return response.data;
};

// Account
export const deleteUserAccount = async () => {
  const response = await axios.delete('/api/user/account');
  return response.data;
};

// Logo
export const uploadCompanyLogo = async (formData) => {
  const response = await axios.post('/api/company/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const removeCompanyLogo = async () => {
  const response = await axios.delete('/api/company/logo');
  return response.data;
};

// Billing (stubs for now)
export const getProjectBalance = async () => {
  // TODO: Implement when billing API is ready
  return { balance: 0, currency: 'USD' };
};

export const getPurchaseHistory = async () => {
  // TODO: Implement when billing API is ready
  return [];
};

export const getPaymentMethods = async () => {
  // TODO: Implement when billing API is ready
  return [];
};

export const purchaseProjectCredits = async (tierId) => {
  // TODO: Implement when payment integration is ready
  const response = await axios.post('/api/billing/purchase', { tier_id: tierId });
  return response.data;
};
