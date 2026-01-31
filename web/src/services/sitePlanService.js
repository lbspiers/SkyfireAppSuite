import axios from '../config/axios';
import logger from './devLogger';

/**
 * Site Plan Service - API methods for site plan upload and management
 * Backend API: /project/:projectId/site-plans
 */
const sitePlanService = {
  /**
   * List all site plans for a project
   * @param {number} projectId - The project ID
   * @returns {Promise} Response with site plans array
   */
  async list(projectId) {
    try {
      const response = await axios.get(`/project/${projectId}/site-plans`);
      logger.log('SitePlanService', `Fetched ${response.data.data?.length || 0} site plans`);
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to list site plans:', error);
      throw error;
    }
  },

  /**
   * Get published site plan version
   * @param {number} projectId - The project ID
   * @returns {Promise} Response with published site plan
   */
  async getPublished(projectId) {
    try {
      const response = await axios.get(`/project/${projectId}/site-plans/published`);
      logger.log('SitePlanService', 'Fetched published site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to get published site plan:', error);
      throw error;
    }
  },

  /**
   * Get presigned S3 upload URL
   * @param {number} projectId - The project ID
   * @param {string} fileName - Original file name
   * @param {string} fileType - File MIME type
   * @param {number} fileSize - File size in bytes
   * @returns {Promise} Response with uploadUrl, fileKey, and nextVersion
   */
  async getUploadUrl(projectId, fileName, fileType, fileSize) {
    try {
      const response = await axios.post(`/project/${projectId}/site-plans/upload-url`, {
        fileName,
        fileType,
        fileSize
      });
      logger.log('SitePlanService', `Got upload URL for V${response.data.data?.nextVersion}`);
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to get upload URL:', error);
      throw error;
    }
  },

  /**
   * Create site plan record after S3 upload
   * @param {number} projectId - The project ID
   * @param {Object} data - Site plan data
   * @param {string} data.fileKey - S3 file key
   * @param {string} data.fileName - Original file name
   * @param {number} data.fileSize - File size in bytes
   * @param {number} data.versionNumber - Version number
   * @param {string} [data.notes] - Optional notes
   * @returns {Promise} Response with created site plan
   */
  async create(projectId, data) {
    try {
      const response = await axios.post(`/project/${projectId}/site-plans`, data);
      logger.log('SitePlanService', `Created site plan V${data.versionNumber}`);
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to create site plan:', error);
      throw error;
    }
  },

  /**
   * Get presigned download URL for viewing
   * @param {number} projectId - The project ID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response with downloadUrl
   */
  async getDownloadUrl(projectId, sitePlanId) {
    try {
      const response = await axios.get(`/project/${projectId}/site-plans/${sitePlanId}/download-url`);
      logger.log('SitePlanService', 'Got download URL for site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to get download URL:', error);
      throw error;
    }
  },

  /**
   * Publish a site plan version
   * @param {number} projectId - The project ID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response with published site plan
   */
  async publish(projectId, sitePlanId) {
    try {
      const response = await axios.put(`/project/${projectId}/site-plans/${sitePlanId}/publish`);
      logger.log('SitePlanService', 'Published site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to publish site plan:', error);
      throw error;
    }
  },

  /**
   * Delete a draft site plan version
   * @param {number} projectId - The project ID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response confirming deletion
   */
  async delete(projectId, sitePlanId) {
    try {
      const response = await axios.delete(`/project/${projectId}/site-plans/${sitePlanId}`);
      logger.log('SitePlanService', 'Deleted site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to delete site plan:', error);
      throw error;
    }
  },

  /**
   * Upload file directly to S3 using presigned URL
   * @param {string} presignedUrl - Presigned S3 URL
   * @param {File} file - File to upload
   * @param {Function} onProgress - Progress callback (percent: number)
   * @returns {Promise} Resolves when upload completes
   */
  async uploadToS3(presignedUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // Handle successful upload
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          logger.log('SitePlanService', 'File uploaded successfully to S3');
          resolve();
        } else {
          logger.error('SitePlanService', `Upload failed with status: ${xhr.status}`);
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        logger.error('SitePlanService', 'Upload network error');
        reject(new Error('Upload failed due to network error'));
      });

      // Handle upload abort
      xhr.addEventListener('abort', () => {
        logger.warn('SitePlanService', 'Upload aborted by user');
        reject(new Error('Upload aborted'));
      });

      // Start upload
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }
};

export default sitePlanService;
