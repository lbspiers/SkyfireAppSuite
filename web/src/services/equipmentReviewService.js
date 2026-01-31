/**
 * Equipment Review Service
 *
 * Communicates with the automation server to manage equipment
 * learning/alias review queue for the AI-powered equipment normalizer.
 */

import axios from 'axios';

const AUTOMATION_BASE_URL = 'https://api.skyfireapp.io';

// Create axios instance for automation server
const automationAPI = axios.create({
  baseURL: AUTOMATION_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ============================================================================
// API Functions - Connected to Real Backend
// ============================================================================

export const getPendingReviewItems = async () => {
  const response = await automationAPI.get('/api/equipment-review/pending');
  return response.data;
};

export const getApprovedAliases = async () => {
  const response = await automationAPI.get('/api/equipment-review/approved');
  return response.data;
};

export const getRejectedItems = async () => {
  const response = await automationAPI.get('/api/equipment-review/rejected');
  return response.data;
};

export const approveItem = async (originalPattern, canonicalManufacturer, canonicalModel = null, equipmentId = null) => {
  const response = await automationAPI.post('/api/equipment-review/approve', {
    original_pattern: originalPattern,
    canonical_manufacturer: canonicalManufacturer,
    canonical_model: canonicalModel,
    equipment_id: equipmentId,
  });
  return response.data;
};

export const rejectItem = async (originalPattern, reason = '') => {
  const response = await automationAPI.post('/api/equipment-review/reject', {
    original_pattern: originalPattern,
    reason,
  });
  return response.data;
};

export const getReviewStats = async () => {
  const response = await automationAPI.get('/api/equipment-review/stats');
  return response.data;
};

export const getManufacturers = async (equipmentType = null) => {
  const params = equipmentType ? { type: equipmentType } : {};
  const response = await automationAPI.get('/api/equipment-review/manufacturers', { params });
  return response.data;
};

export const getModelsForManufacturer = async (manufacturer, equipmentType = null) => {
  const params = { manufacturer };
  if (equipmentType) params.type = equipmentType;
  const response = await automationAPI.get('/api/equipment-review/models', { params });
  return response.data;
};

export const searchEquipment = async (query, equipmentType = null) => {
  const params = { q: query };
  if (equipmentType) params.type = equipmentType;
  const response = await automationAPI.get('/api/equipment-review/search', { params });
  return response.data;
};

export const bulkApprove = async (items) => {
  const response = await automationAPI.post('/api/equipment-review/bulk-approve', { items });
  return response.data;
};

export const removeApprovedAlias = async (originalPattern) => {
  const response = await automationAPI.delete('/api/equipment-review/approved', {
    data: { original_pattern: originalPattern }
  });
  return response.data;
};

export default {
  getPendingReviewItems,
  getApprovedAliases,
  getRejectedItems,
  approveItem,
  rejectItem,
  getReviewStats,
  getManufacturers,
  getModelsForManufacturer,
  searchEquipment,
  bulkApprove,
  removeApprovedAlias,
};
