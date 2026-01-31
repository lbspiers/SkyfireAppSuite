/**
 * Revision Service - API endpoints for revision requests
 * Handles AHJ and Utility revision submissions with S3 file uploads
 */

import logger from './devLogger';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

/**
 * Revision Service API
 */
const revisionService = {
  /**
   * Get presigned URL for uploading a revision document
   * @param {string} projectId - Project UUID
   * @param {string} fileName - Original filename
   * @returns {Promise<{uploadUrl: string, s3Key: string, expiresIn: number}>}
   */
  async getUploadUrl(projectId, fileName) {
    const url = `${API_BASE}/project/${projectId}/revisions/upload-url?fileName=${encodeURIComponent(fileName)}`;

    logger.log('RevisionService', `[Upload] Getting presigned URL for ${fileName}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('RevisionService', `[Upload] Failed to get URL: ${errorText}`);
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Failed to get upload URL');
    }

    logger.log('RevisionService', `[Upload] Got presigned URL, key: ${data.data.s3Key}`);
    return data.data;
  },

  /**
   * Upload file to S3 using presigned URL
   * @param {string} uploadUrl - Presigned S3 URL
   * @param {File} file - File to upload
   */
  async uploadToS3(uploadUrl, file) {
    logger.log('RevisionService', `[Upload] Uploading ${file.name} to S3 (${file.size} bytes)...`);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/pdf',
      },
      body: file,
    });

    if (!response.ok) {
      logger.error('RevisionService', `[Upload] S3 upload failed: ${response.status}`);
      throw new Error(`S3 upload failed: ${response.status}`);
    }

    logger.log('RevisionService', `[Upload] S3 upload successful`);
  },

  /**
   * Create a revision request record
   * @param {string} projectId - Project UUID
   * @param {Object} revisionData - Revision data
   * @returns {Promise<Object>} Created revision
   */
  async create(projectId, revisionData) {
    const url = `${API_BASE}/project/${projectId}/revisions`;

    logger.log('RevisionService', `[Create] Creating revision for project ${projectId}`, revisionData);

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(revisionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('RevisionService', `[Create] Failed: ${errorText}`);
      throw new Error(`Failed to create revision: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Failed to create revision');
    }

    logger.log('RevisionService', `[Create] Success:`, data.data);
    return data.data;
  },

  /**
   * Full upload flow: get presigned URL → upload to S3 → create revision record
   * @param {string} projectId - Project UUID
   * @param {File} file - PDF file to upload
   * @param {Object} metadata - Revision metadata (revisionType, reviewerName, etc.)
   * @returns {Promise<Object>} Created revision
   */
  async submitRevision(projectId, file, metadata) {
    logger.log('RevisionService', `[Submit] Starting revision submission for ${metadata.revisionType}`);

    // Step 1: Get presigned upload URL
    const { uploadUrl, s3Key } = await this.getUploadUrl(projectId, file.name);

    // Step 2: Upload file to S3
    await this.uploadToS3(uploadUrl, file);

    // Step 3: Create revision record with S3 reference
    const revision = await this.create(projectId, {
      revisionType: metadata.revisionType,
      documentUrl: s3Key,
      documentFilename: file.name,
      documentSize: file.size,
      reviewerName: metadata.reviewerName || null,
      reviewerPhone: metadata.reviewerPhone || null,
      reviewerEmail: metadata.reviewerEmail || null,
      userNotes: metadata.notes || null,
    });

    logger.log('RevisionService', `[Submit] Revision submitted successfully:`, revision.id);
    return revision;
  },

  /**
   * List revisions for a project
   * @param {string} projectId - Project UUID
   * @param {Object} filters - Optional filters {type: 'ahj'|'utility', status: 'pending'|'in_progress'|'complete'}
   * @returns {Promise<Array>} Array of revisions
   */
  async list(projectId, filters = {}) {
    const url = new URL(`${API_BASE}/project/${projectId}/revisions`);

    if (filters.type) url.searchParams.append('type', filters.type);
    if (filters.status) url.searchParams.append('status', filters.status);

    logger.log('RevisionService', `[List] Fetching revisions for project ${projectId}`, filters);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('RevisionService', `[List] Failed: ${errorText}`);
      throw new Error(`Failed to list revisions: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Failed to list revisions');
    }

    logger.log('RevisionService', `[List] Found ${data.data?.length || 0} revisions`);
    return data.data || [];
  },

  /**
   * Get a single revision
   * @param {string} projectId - Project UUID
   * @param {string} revisionId - Revision UUID
   * @returns {Promise<Object>} Revision details
   */
  async getOne(projectId, revisionId) {
    const url = `${API_BASE}/project/${projectId}/revisions/${revisionId}`;

    logger.log('RevisionService', `[Get] Fetching revision ${revisionId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get revision: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Update revision status or notes
   * @param {string} projectId - Project UUID
   * @param {string} revisionId - Revision UUID
   * @param {Object} updates - Fields to update {status, userNotes, etc.}
   * @returns {Promise<Object>} Updated revision
   */
  async update(projectId, revisionId, updates) {
    const url = `${API_BASE}/project/${projectId}/revisions/${revisionId}`;

    logger.log('RevisionService', `[Update] Updating revision ${revisionId}`, updates);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update revision: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Delete a revision
   * @param {string} projectId - Project UUID
   * @param {string} revisionId - Revision UUID
   * @returns {Promise<void>}
   */
  async delete(projectId, revisionId) {
    const url = `${API_BASE}/project/${projectId}/revisions/${revisionId}`;

    logger.log('RevisionService', `[Delete] Deleting revision ${revisionId}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete revision: ${response.status}`);
    }

    logger.log('RevisionService', `[Delete] Success`);
  },

  /**
   * Get presigned URL for viewing/downloading document
   * @param {string} projectId - Project UUID
   * @param {string} revisionId - Revision UUID
   * @returns {Promise<{downloadUrl: string, filename: string, expiresIn: number}>}
   */
  async getDocumentUrl(projectId, revisionId) {
    const url = `${API_BASE}/project/${projectId}/revisions/${revisionId}/document-url`;

    logger.log('RevisionService', `[Document] Getting download URL for revision ${revisionId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get document URL: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'SUCCESS') {
      throw new Error(data.message || 'Failed to get document URL');
    }

    logger.log('RevisionService', `[Document] Got download URL for ${data.data.filename}`);
    return data.data;
  },
};

export default revisionService;
