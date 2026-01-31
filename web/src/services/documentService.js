/**
 * Document Service - Standardized API endpoints for project documents
 * Handles sales proposals, supporting docs, contracts, permits, etc.
 */

import logger from './devLogger';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Standardized headers
const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

const getMultipartHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  // Don't set Content-Type for multipart - browser sets it with boundary
});

// Helper to get companyId from session
const getCompanyId = () => {
  try {
    const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
    return companyData.uuid;
  } catch (error) {
    logger.error('DocumentService', 'Failed to get companyId:', error);
    return null;
  }
};

// Standardized endpoints matching backend (using singular /project/ not /projects/)
const ENDPOINTS = {
  documents: {
    list: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/documents?companyId=${companyId}`,
    upload: (projectId) =>
      `${API_BASE}/project/${projectId}/documents/upload`,
    bulkDelete: (projectId) =>
      `${API_BASE}/project/${projectId}/documents/bulk`,
    deleteOne: (projectId, documentId) =>
      `${API_BASE}/project/${projectId}/documents/${documentId}`,
    update: (projectId, documentId) =>
      `${API_BASE}/project/${projectId}/documents/${documentId}`,
  }
};

/**
 * Documents API
 */
export const documentsApi = {
  /**
   * List all documents for a project
   * @param {string} projectId - Project UUID
   * @param {Object} filters - Optional filters (documentType, category)
   * @returns {Promise<Array>} Array of document objects
   */
  async list(projectId, filters = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      const url = new URL(ENDPOINTS.documents.list(projectId, companyId));
      if (filters.documentType) url.searchParams.append('documentType', filters.documentType);
      if (filters.category) url.searchParams.append('category', filters.category);

      logger.log('DocumentService', `[Documents] Fetching from: ${url.toString()}`);
      logger.log('DocumentService', `[Documents] CompanyId: ${companyId}, ProjectId: ${projectId}`);
      logger.log('DocumentService', `[Documents] Auth Token: ${getAuthToken() ? 'Present' : 'Missing'}`);

      const response = await fetch(url, { headers: getHeaders() });

      logger.log('DocumentService', `[Documents] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('DocumentService', `[Documents] Response data:`, data);

      // Handle different response formats
      if (data.status === 'SUCCESS') {
        return data.data || [];
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }

      logger.warn('DocumentService', 'Unexpected documents response format:', data);
      return [];
    } catch (error) {
      logger.error('DocumentService', 'Failed to fetch documents:', error);
      throw error;
    }
  },

  /**
   * Upload a document
   * @param {string} projectId - Project UUID
   * @param {File} file - Document file
   * @param {Object} metadata - Optional metadata (documentType, category, note)
   * @returns {Promise<Object>} Uploaded document object
   */
  async upload(projectId, file, metadata = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      // 🔥 DIAGNOSTIC: Log when documentService.upload is called
      console.log('🔥 documentService.upload called:', {
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata
      });

      const formData = new FormData();
      formData.append('document', file);  // Backend expects 'document' field name
      formData.append('companyId', companyId);
      formData.append('projectId', projectId);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('mimeType', file.type);
      if (metadata.documentType) formData.append('documentType', metadata.documentType);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.note) formData.append('note', metadata.note);

      logger.log('DocumentService', `[Documents] Uploading document with field name 'document'`);

      const response = await fetch(ENDPOINTS.documents.upload(projectId), {
        method: 'POST',
        headers: getMultipartHeaders(),
        body: formData,
      });

      logger.log('DocumentService', `[Documents] Upload response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('DocumentService', `[Documents] Upload successful:`, data);
      return data.data || data;
    } catch (error) {
      logger.error('DocumentService', 'Failed to upload document:', error);
      throw error;
    }
  },

  /**
   * Upload multiple documents (bulk)
   * @param {string} projectId - Project UUID
   * @param {Array<File>} files - Array of document files
   * @param {Object} metadata - Optional metadata applied to all (documentType, category, note)
   * @returns {Promise<Array>} Array of uploaded document objects
   */
  async uploadBulk(projectId, files, metadata = {}) {
    try {
      logger.log('DocumentService', `[Documents] Bulk uploading ${files.length} documents`);

      const uploadPromises = files.map(file => this.upload(projectId, file, metadata));
      const results = await Promise.all(uploadPromises);

      logger.log('DocumentService', `[Documents] Bulk upload successful: ${results.length} documents`);
      return results;
    } catch (error) {
      logger.error('DocumentService', 'Failed to bulk upload documents:', error);
      throw error;
    }
  },

  /**
   * Bulk delete documents
   * @param {string} projectId - Project UUID
   * @param {Array<string>} documentIds - Array of document IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async bulkDelete(projectId, documentIds) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('DocumentService', `[Documents] Bulk deleting ${documentIds.length} documents`);

      const response = await fetch(ENDPOINTS.documents.bulkDelete(projectId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          ids: documentIds,
          companyId: companyId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('DocumentService', `Bulk delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('DocumentService', `[Documents] Bulk delete successful`);
      return data;
    } catch (error) {
      logger.error('DocumentService', 'Failed to delete documents:', error);
      throw error;
    }
  },

  /**
   * Delete a single document
   * @param {string} projectId - Project UUID
   * @param {string} documentId - Document ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(projectId, documentId) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('DocumentService', `[Documents] Deleting document ${documentId}`);

      const response = await fetch(ENDPOINTS.documents.deleteOne(projectId, documentId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('DocumentService', `Delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('DocumentService', `[Documents] Delete successful`);
      return data;
    } catch (error) {
      logger.error('DocumentService', 'Failed to delete document:', error);
      throw error;
    }
  },

  /**
   * Update document metadata
   * @param {string} projectId - Project UUID
   * @param {string} documentId - Document ID
   * @param {Object} updates - Fields to update (documentType, category, note)
   * @returns {Promise<Object>} Updated document object
   */
  async updateMetadata(projectId, documentId, updates) {
    try {
      const response = await fetch(ENDPOINTS.documents.update(projectId, documentId), {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('DocumentService', 'Failed to update document:', error);
      throw error;
    }
  },
};

// Default export
export default {
  documents: documentsApi,
};
