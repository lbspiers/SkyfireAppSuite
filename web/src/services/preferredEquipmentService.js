/**
 * Preferred Equipment API Service
 * Handles CRUD operations for company preferred equipment
 */

import axios from '../config/axios';

/**
 * Get preferred equipment for a company and equipment type
 * @param {string} companyId - Company UUID
 * @param {string} equipmentType - Equipment category ID (e.g., 'solar-panels')
 * @returns {Promise<Array>} - Array of preferred equipment items
 */
export const getPreferredEquipment = async (companyId, equipmentType) => {
  try {
    const response = await axios.get('/api/preferred-equipment', {
      params: {
        company_id: companyId,
        equipment_type: equipmentType,
      },
    });
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error fetching:', error);
    throw error;
  }
};

/**
 * Create a new preferred equipment entry
 * @param {Object} data - Equipment data
 * @param {string} data.equipmentType - Category ID
 * @param {string} data.make - Manufacturer name
 * @param {string} data.model - Model name (optional for some categories)
 * @param {string} data.companyId - Company UUID
 * @param {string} data.createdBy - User UUID
 * @param {boolean} data.isDefault - Whether this is the default selection
 * @returns {Promise<Object>} - Created equipment record
 */
export const createPreferredEquipment = async (data) => {
  try {
    const response = await axios.post('/api/preferred-equipment', {
      equipment_type: data.equipmentType,
      make: data.make,
      model: data.model || '',
      company_id: data.companyId,
      created_by: data.createdBy,
      is_default: data.isDefault || false,
    });
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error creating:', error);
    throw error;
  }
};

/**
 * Update preferred equipment (e.g., set as default)
 * @param {string} uuid - Equipment UUID
 * @param {Object} data - Update data
 * @param {boolean} data.is_default - Set as default
 * @returns {Promise<Object>} - Updated equipment record
 */
export const updatePreferredEquipment = async (uuid, data) => {
  try {
    const response = await axios.patch(`/api/preferred-equipment/${uuid}`, data);
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error updating:', error);
    throw error;
  }
};

/**
 * Delete preferred equipment
 * @param {string} uuid - Equipment UUID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deletePreferredEquipment = async (uuid) => {
  try {
    const response = await axios.delete(`/api/preferred-equipment/${uuid}`);
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error deleting:', error);
    throw error;
  }
};

/**
 * Get equipment manufacturers by type
 * @param {string} equipmentType - Equipment type for API (e.g., 'Solar Panel')
 * @returns {Promise<Array>} - Array of manufacturer names
 */
export const getEquipmentManufacturers = async (equipmentType) => {
  try {
    const response = await axios.get('/equipment/manufacturers', {
      params: { type: equipmentType },
    });
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error fetching manufacturers:', error);
    throw error;
  }
};

/**
 * Get equipment models by manufacturer
 * @param {string} equipmentType - Equipment type
 * @param {string} manufacturer - Manufacturer name
 * @param {number|null} pmax - Optional wattage filter for solar panels
 * @returns {Promise<Array>} - Array of model names
 */
export const getEquipmentModels = async (equipmentType, manufacturer, pmax = null) => {
  try {
    const params = { type: equipmentType, manufacturer };
    if (pmax) params.pmax = pmax;

    const response = await axios.get('/equipment/models', { params });
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error fetching models:', error);
    throw error;
  }
};

/**
 * Get all companies (for super users)
 * @returns {Promise<Array>} - Array of company objects
 */
export const getAllCompanies = async () => {
  try {
    const response = await axios.get('/org/companies');
    return response.data;
  } catch (error) {
    console.error('[PreferredEquipment] Error fetching companies:', error);
    throw error;
  }
};
