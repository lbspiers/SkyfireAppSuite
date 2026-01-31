/**
 * Super Admin API Service
 * Handles super admin specific operations
 */

import axios from '../config/axios';

/**
 * Get all companies (super admin only)
 * Returns companies with owner info
 * @returns {Promise<Object>} - { data: [{ company: {...}, user: {...} }] }
 */
export const getCompanies = async () => {
  try {
    const response = await axios.get('/api/admin/companies');

    // Transform the response to match expected format
    // Backend returns { data: [{ company: {...}, user: {...} }] }
    if (response.data?.data) {
      return {
        status: 'SUCCESS',
        data: response.data.data.map(item => ({
          id: item.company.uuid,
          name: item.company.name,
          company_name: item.company.name,
          logo: item.company.logo,
          status: item.company.status,
          createdAt: item.company.createdAt,
          owner: {
            uuid: item.user.uuid,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            email: item.user.email,
          }
        }))
      };
    }

    return response.data;
  } catch (error) {
    console.error('[SuperAdminService] Error fetching companies:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load companies');
  }
};

/**
 * Get company details by ID (super admin only)
 * @param {string} companyId - Company UUID
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Company }
 */
export const getCompanyById = async (companyId) => {
  try {
    const response = await axios.get(`/api/admin/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('[SuperAdminService] Error fetching company:', error);
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.message || 'Unable to load company');
  }
};
