/**
 * Survey Service - Standardized API endpoints for Survey tab
 * Handles photos, videos, and notes for project surveys
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
    logger.error('SurveyService', 'Failed to get companyId:', error);
    return null;
  }
};

/**
 * Upload file to S3 using presigned URL
 * @param {File} file - File to upload
 * @param {string} projectId - Project UUID for directory path
 * @param {string} directory - Optional directory override (default: 'photos')
 * @returns {Promise<string>} S3 URL of uploaded file
 */
const uploadFileToS3 = async (file, projectId, directory = 'photos') => {
  const companyId = getCompanyId();
  if (!companyId) throw new Error('Company ID not found');

  try {
    // Step 1: Get presigned S3 upload URL using GET with query params
    logger.log('SurveyService', `[S3] Getting presigned URL for ${file.name} (directory: ${directory})`);

    const url = new URL(`${API_BASE}/company/${companyId}/file-upload-url`);
    url.searchParams.append('directory', `projects/${projectId}/${directory}`);
    url.searchParams.append('fileName', file.name);

    const urlResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!urlResponse.ok) {
      throw new Error(`Failed to get upload URL: ${urlResponse.status}`);
    }

    const { upload_url, key } = await urlResponse.json();
    logger.log('SurveyService', `[S3] Got presigned URL, uploading to S3...`);

    // Step 2: Upload file directly to S3
    const s3Response = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!s3Response.ok) {
      throw new Error(`S3 upload failed: ${s3Response.status}`);
    }

    // Step 3: Construct S3 URL from key
    const s3Url = `https://skyfire-media-files.s3.amazonaws.com/${key}`;
    logger.log('SurveyService', `[S3] Upload successful:`, s3Url);

    return s3Url;
  } catch (error) {
    logger.error('SurveyService', '[S3] Upload failed:', error);
    throw error;
  }
};

// Standardized endpoints matching backend (using singular /project/ not /projects/)
const ENDPOINTS = {
  photos: {
    list: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}`,
    upload: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}`,
    bulkDelete: (projectId) =>
      `${API_BASE}/project/${projectId}/photos/bulk-delete`,
    deleteOne: (projectId, photoId) =>
      `${API_BASE}/project/${projectId}/photos/${photoId}`,
    update: (projectId, photoId) =>
      `${API_BASE}/project/${projectId}/photos/${photoId}`,
  },
  videos: {
    // NOTE: Backend stores photos and videos in the same table
    // All video operations use the photos endpoint with type=video
    list: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}&type=video`,
    upload: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}`,
    bulkDelete: (projectId) =>
      `${API_BASE}/project/${projectId}/photos/bulk-delete`,
    deleteOne: (projectId, videoId) =>
      `${API_BASE}/project/${projectId}/photos/${videoId}`,
    update: (projectId, videoId) =>
      `${API_BASE}/project/${projectId}/photos/${videoId}`,
  },
  notes: {
    list: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/survey-notes?companyId=${companyId}`,
    create: (projectId) =>
      `${API_BASE}/project/${projectId}/survey-notes`,
    update: (projectId, noteId) =>
      `${API_BASE}/project/${projectId}/survey-notes/${noteId}`,
    delete: (projectId, noteId) =>
      `${API_BASE}/project/${projectId}/survey-notes/${noteId}`,
  },
  documents: {
    // Documents use the photos table with media_type='document'
    list: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}&type=document`,
    upload: (projectId, companyId) =>
      `${API_BASE}/project/${projectId}/photos?companyId=${companyId}`,
    bulkDelete: (projectId) =>
      `${API_BASE}/project/${projectId}/photos/bulk-delete`,
    deleteOne: (projectId, docId) =>
      `${API_BASE}/project/${projectId}/photos/${docId}`,
    update: (projectId, docId) =>
      `${API_BASE}/project/${projectId}/photos/${docId}`,
  }
};

/**
 * Photos API
 */
export const photosApi = {
  /**
   * List all photos for a project
   * @param {string} projectId - Project UUID
   * @param {Object} filters - Optional filters (section, tag)
   * @returns {Promise<Array>} Array of photo objects
   */
  async list(projectId, filters = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      const url = new URL(ENDPOINTS.photos.list(projectId, companyId));
      if (filters.section) url.searchParams.append('section', filters.section);
      if (filters.tag) url.searchParams.append('tag', filters.tag);

      logger.log('SurveyService', `[Photos] Fetching from: ${url.toString()}`);
      logger.log('SurveyService', `[Photos] CompanyId: ${companyId}, ProjectId: ${projectId}`);
      logger.log('SurveyService', `[Photos] Auth Token: ${getAuthToken() ? 'Present' : 'Missing'}`);

      const response = await fetch(url, { headers: getHeaders() });

      logger.log('SurveyService', `[Photos] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Photos] Response data:`, data);

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

      logger.warn('SurveyService', 'Unexpected photos response format:', data);
      return [];
    } catch (error) {
      logger.error('SurveyService', 'Failed to fetch photos:', error);
      throw error;
    }
  },

  /**
   * Upload a photo
   * @param {string} projectId - Project UUID
   * @param {File} file - Photo file
   * @param {Object} metadata - Optional metadata (section, tag, note)
   * @returns {Promise<Object>} Uploaded photo object
   */
  async upload(projectId, file, metadata = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      // 🔥 DIAGNOSTIC: Log when photos.upload is called
      console.log('🔥 surveyService.photos.upload called:', {
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata
      });

      // Step 1: Upload file to S3 using presigned URL
      logger.log('SurveyService', `[Photos] Uploading ${file.name} to S3...`);
      const s3Url = await uploadFileToS3(file, projectId);

      // Step 2: Create photo record in database with S3 URL
      logger.log('SurveyService', `[Photos] Creating photo record at ${ENDPOINTS.photos.upload(projectId, companyId)}`);

      const response = await fetch(ENDPOINTS.photos.upload(projectId, companyId), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: s3Url,
          section: metadata.section || 'general', // Required field - default to 'general'
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          tag: metadata.tag || null,
          note: metadata.note || null,
        }),
      });

      logger.log('SurveyService', `[Photos] Upload response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `[Photos] Upload failed: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Photos] Upload successful:`, data);
      return data.data || data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to upload photo:', error);
      throw error;
    }
  },

  /**
   * Register a server-converted photo (already uploaded to S3 by server)
   * @param {string} projectId - Project UUID
   * @param {Object} photoData - Photo metadata
   * @param {string} photoData.url - S3 URL
   * @param {string} photoData.fileName - File name
   * @param {number} photoData.fileSize - File size in bytes
   * @param {string} photoData.section - Photo section (default: 'general')
   * @returns {Promise<Object>} Created photo object
   */
  async registerServerConverted(projectId, photoData) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Photos] Registering server-converted photo: ${photoData.fileName}`);

      const response = await fetch(ENDPOINTS.photos.upload(projectId, companyId), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: photoData.url,
          section: photoData.section || 'general',
          fileName: photoData.fileName,
          mimeType: 'image/jpeg',
          fileSize: photoData.fileSize,
          tag: photoData.tag || null,
          note: photoData.note || null,
        }),
      });

      logger.log('SurveyService', `[Photos] Register response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `[Photos] Register failed: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Photos] Register successful:`, data);
      return data.data || data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to register server-converted photo:', error);
      throw error;
    }
  },

  /**
   * Bulk delete photos
   * @param {string} projectId - Project UUID
   * @param {Array<string>} photoIds - Array of photo IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async bulkDelete(projectId, photoIds) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Photos] Bulk deleting ${photoIds.length} photos`);

      const response = await fetch(ENDPOINTS.photos.bulkDelete(projectId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          ids: photoIds,
          companyId: companyId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Bulk delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Photos] Bulk delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete photos:', error);
      throw error;
    }
  },

  /**
   * Delete a single photo
   * @param {string} projectId - Project UUID
   * @param {string} photoId - Photo ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(projectId, photoId) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Photos] Deleting photo ${photoId}`);

      const response = await fetch(ENDPOINTS.photos.deleteOne(projectId, photoId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Photos] Delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete photo:', error);
      throw error;
    }
  },

  /**
   * Update photo metadata
   * @param {string} projectId - Project UUID
   * @param {string} photoId - Photo ID
   * @param {Object} updates - Fields to update (section, tag, note)
   * @returns {Promise<Object>} Updated photo object
   */
  async updateMetadata(projectId, photoId, updates) {
    try {
      const response = await fetch(ENDPOINTS.photos.update(projectId, photoId), {
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
      logger.error('SurveyService', 'Failed to update photo:', error);
      throw error;
    }
  },
};

/**
 * Videos API
 */
export const videosApi = {
  /**
   * List all videos for a project
   * NOTE: Backend stores both photos and videos in the same table with media_type column
   * We use the photos endpoint with type=video filter
   * @param {string} projectId - Project UUID
   * @param {Object} filters - Optional filters (section, tag)
   * @returns {Promise<Array>} Array of video objects
   */
  async list(projectId, filters = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      // Use photos endpoint with type=video filter (backend stores both in same table)
      const url = new URL(ENDPOINTS.photos.list(projectId, companyId));
      url.searchParams.append('type', 'video');
      if (filters.section) url.searchParams.append('section', filters.section);
      if (filters.tag) url.searchParams.append('tag', filters.tag);

      logger.log('SurveyService', `[Videos] Fetching from: ${url.toString()}`);
      logger.log('SurveyService', `[Videos] CompanyId: ${companyId}, ProjectId: ${projectId}`);
      logger.log('SurveyService', `[Videos] Auth Token: ${getAuthToken() ? 'Present' : 'Missing'}`);

      const response = await fetch(url, { headers: getHeaders() });

      logger.log('SurveyService', `[Videos] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Videos] Response data:`, data);

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

      logger.warn('SurveyService', 'Unexpected videos response format:', data);
      return [];
    } catch (error) {
      logger.error('SurveyService', 'Failed to fetch videos:', error);
      throw error;
    }
  },

  /**
   * Upload a video
   * @param {string} projectId - Project UUID
   * @param {File} file - Video file
   * @param {Object} metadata - Optional metadata (section, tag, note)
   * @returns {Promise<Object>} Uploaded video object
   */
  async upload(projectId, file, metadata = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Videos] Starting S3 upload for ${file.name}`);

      // Step 1: Upload file to S3 using presigned URL
      const s3Url = await uploadFileToS3(file, projectId);
      logger.log('SurveyService', `[Videos] File uploaded to S3: ${s3Url}`);

      // Step 2: Create video record in database with S3 URL
      logger.log('SurveyService', `[Videos] Creating DB record at ${ENDPOINTS.videos.upload(projectId, companyId)}`);

      const response = await fetch(ENDPOINTS.videos.upload(projectId, companyId), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: s3Url,
          section: metadata.section || 'general', // Required field - default to 'general'
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaType: 'video', // Specify this is a video in the shared photos table
          tag: metadata.tag || null,
          note: metadata.note || null,
        }),
      });

      logger.log('SurveyService', `[Videos] DB record response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `[Videos] DB record creation failed: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Videos] Upload successful:`, data);
      return data.data || data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to upload video:', error);
      throw error;
    }
  },

  /**
   * Bulk delete videos
   * @param {string} projectId - Project UUID
   * @param {Array<string>} videoIds - Array of video IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async bulkDelete(projectId, videoIds) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Videos] Bulk deleting ${videoIds.length} videos`);

      const response = await fetch(ENDPOINTS.videos.bulkDelete(projectId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          ids: videoIds,
          companyId: companyId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Bulk delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Videos] Bulk delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete videos:', error);
      throw error;
    }
  },

  /**
   * Delete a single video
   * @param {string} projectId - Project UUID
   * @param {string} videoId - Video ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(projectId, videoId) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Videos] Deleting video ${videoId}`);

      const response = await fetch(ENDPOINTS.videos.deleteOne(projectId, videoId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Videos] Delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete video:', error);
      throw error;
    }
  },

  /**
   * Update video metadata
   * @param {string} projectId - Project UUID
   * @param {string} videoId - Video ID
   * @param {Object} updates - Fields to update (section, tag, note)
   * @returns {Promise<Object>} Updated video object
   */
  async updateMetadata(projectId, videoId, updates) {
    try {
      const response = await fetch(ENDPOINTS.videos.update(projectId, videoId), {
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
      logger.error('SurveyService', 'Failed to update video:', error);
      throw error;
    }
  },
};

/**
 * Notes API - Currently using mock data
 * TODO: Replace with real API when backend is ready
 */
export const notesApi = {
  /**
   * List all notes for a project
   * @param {string} projectId - Project UUID
   * @param {Object} filters - Optional filters (section)
   * @returns {Promise<Array>} Array of note objects
   */
  async list(projectId, filters = {}) {
    // TODO: Replace with real API when backend is ready
    logger.debug('SurveyService', '[notesApi] Using mock data - backend not implemented');

    try {
      const { mockSurveyNotes, getNotesBySection } = await import('../mockData/surveyMockData');

      if (filters.section) {
        return getNotesBySection(filters.section);
      }
      return mockSurveyNotes;
    } catch (error) {
      logger.error('SurveyService', 'Failed to load mock notes:', error);
      return [];
    }
  },

  /**
   * Create a new note
   * @param {string} projectId - Project UUID
   * @param {Object} noteData - Note content and metadata
   * @returns {Promise<Object>} Created note object
   */
  async create(projectId, noteData) {
    // TODO: Replace with real API
    logger.debug('SurveyService', '[notesApi] Mock create:', noteData);
    return {
      id: `note-${Date.now()}`,
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Update an existing note
   * @param {string} projectId - Project UUID
   * @param {string} noteId - Note ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated note object
   */
  async update(projectId, noteId, updates) {
    // TODO: Replace with real API
    logger.debug('SurveyService', '[notesApi] Mock update:', noteId, updates);
    return {
      id: noteId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete a note
   * @param {string} projectId - Project UUID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(projectId, noteId) {
    // TODO: Replace with real API
    logger.debug('SurveyService', '[notesApi] Mock delete:', noteId);
    return { success: true };
  },
};

/**
 * Documents API
 */
export const documentsApi = {
  /**
   * List all documents for a project
   * NOTE: Backend stores photos, videos, and documents in the same table with media_type column
   * We use the photos endpoint with type=document filter
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} Array of document objects
   */
  async list(projectId) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      const url = new URL(ENDPOINTS.documents.list(projectId, companyId));

      logger.log('SurveyService', `[Documents] Fetching from: ${url.toString()}`);

      const response = await fetch(url, { headers: getHeaders() });

      logger.log('SurveyService', `[Documents] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Documents] Response data:`, data);

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

      logger.warn('SurveyService', 'Unexpected documents response format:', data);
      return [];
    } catch (error) {
      logger.error('SurveyService', 'Failed to fetch documents:', error);
      throw error;
    }
  },

  /**
   * Upload a document
   * @param {string} projectId - Project UUID
   * @param {File} file - Document file
   * @param {Object} metadata - Optional metadata (section, tag, note)
   * @returns {Promise<Object>} Uploaded document object
   */
  async upload(projectId, file, metadata = {}) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      // 🔥 DIAGNOSTIC: Log when documents.upload is called
      console.log('🔥 surveyService.documents.upload called:', {
        projectId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata
      });

      logger.log('SurveyService', `[Documents] Starting S3 upload for ${file.name}`);

      // Step 1: Upload file to S3 using presigned URL (files directory instead of photos)
      const s3Url = await uploadFileToS3(file, projectId, 'files');
      logger.log('SurveyService', `[Documents] File uploaded to S3: ${s3Url}`);

      // Step 2: Create document record in database with S3 URL
      logger.log('SurveyService', `[Documents] Creating DB record at ${ENDPOINTS.documents.upload(projectId, companyId)}`);

      const response = await fetch(ENDPOINTS.documents.upload(projectId, companyId), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          url: s3Url,
          section: metadata.section || 'general', // Required field - default to 'general'
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaType: 'document', // Specify this is a document in the shared photos table
          tag: metadata.tag || null,
          note: metadata.note || null,
        }),
      });

      logger.log('SurveyService', `[Documents] DB record response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `[Documents] DB record creation failed: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Documents] Upload successful:`, data);
      return data.data || data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to upload document:', error);
      throw error;
    }
  },

  /**
   * Bulk delete documents
   * @param {string} projectId - Project UUID
   * @param {Array<string>} docIds - Array of document IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async bulkDelete(projectId, docIds) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Documents] Bulk deleting ${docIds.length} documents`);

      const response = await fetch(ENDPOINTS.documents.bulkDelete(projectId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({
          ids: docIds,
          companyId: companyId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Bulk delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Documents] Bulk delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete documents:', error);
      throw error;
    }
  },

  /**
   * Delete a single document
   * @param {string} projectId - Project UUID
   * @param {string} docId - Document ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(projectId, docId) {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('Company ID not found');

    try {
      logger.log('SurveyService', `[Documents] Deleting document ${docId}`);

      const response = await fetch(ENDPOINTS.documents.deleteOne(projectId, docId), {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SurveyService', `Delete failed: ${response.status} ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.log('SurveyService', `[Documents] Delete successful`);
      return data;
    } catch (error) {
      logger.error('SurveyService', 'Failed to delete document:', error);
      throw error;
    }
  },

  /**
   * Update document metadata
   * @param {string} projectId - Project UUID
   * @param {string} docId - Document ID
   * @param {Object} updates - Fields to update (section, tag, note)
   * @returns {Promise<Object>} Updated document object
   */
  async updateMetadata(projectId, docId, updates) {
    try {
      const response = await fetch(ENDPOINTS.documents.update(projectId, docId), {
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
      logger.error('SurveyService', 'Failed to update document:', error);
      throw error;
    }
  },
};

// Default export with all APIs
export default {
  photos: photosApi,
  videos: videosApi,
  notes: notesApi,
  documents: documentsApi,
};
