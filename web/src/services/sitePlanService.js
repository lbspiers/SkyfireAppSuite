import axios from '../config/axios';
import logger from './devLogger';

/**
 * Site Plan Service - API methods for site plan upload and management
 * Backend API: /project/:projectUuid/site-plans
 */
const sitePlanService = {
  /**
   * List all site plans for a project
   * @param {string} projectUuid - The project UUID
   * @returns {Promise} Response with site plans array
   */
  async list(projectUuid) {
    try {
      const response = await axios.get(`/project/${projectUuid}/site-plans`);
      logger.log('SitePlanService', `Fetched ${response.data.data?.length || 0} site plans`);
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to list site plans:', error);
      throw error;
    }
  },

  /**
   * Get published site plan version
   * @param {string} projectUuid - The project UUID
   * @returns {Promise} Response with published site plan
   */
  async getPublished(projectUuid) {
    try {
      const response = await axios.get(`/project/${projectUuid}/site-plans/published`);
      logger.log('SitePlanService', 'Fetched published site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to get published site plan:', error);
      throw error;
    }
  },

  /**
   * Get presigned S3 upload URL
   * @param {string} projectUuid - The project UUID
   * @param {string} fileName - Original file name
   * @param {string} fileType - File MIME type
   * @param {number} fileSize - File size in bytes
   * @returns {Promise} Response with uploadUrl, fileKey, and nextVersion
   */
  async getUploadUrl(projectUuid, fileName, fileType, fileSize) {
    try {
      const response = await axios.post(`/project/${projectUuid}/site-plans/upload-url`, {
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
   * @param {string} projectUuid - The project UUID
   * @param {Object} data - Site plan data
   * @param {string} data.fileKey - S3 file key
   * @param {string} data.fileName - Original file name
   * @param {number} data.fileSize - File size in bytes
   * @param {number} data.versionNumber - Version number
   * @param {string} [data.notes] - Optional notes
   * @returns {Promise} Response with created site plan
   */
  async create(projectUuid, data) {
    try {
      const response = await axios.post(`/project/${projectUuid}/site-plans`, data);
      logger.log('SitePlanService', `Created site plan V${data.versionNumber}`);
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to create site plan:', error);
      throw error;
    }
  },

  /**
   * Get presigned download URL for viewing
   * @param {string} projectUuid - The project UUID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response with downloadUrl
   */
  async getDownloadUrl(projectUuid, sitePlanId) {
    try {
      const response = await axios.get(`/project/${projectUuid}/site-plans/${sitePlanId}/download-url`);
      logger.log('SitePlanService', 'Got download URL for site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to get download URL:', error);
      throw error;
    }
  },

  /**
   * Publish a site plan version
   * @param {string} projectUuid - The project UUID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response with published site plan
   */
  async publish(projectUuid, sitePlanId) {
    try {
      const response = await axios.put(`/project/${projectUuid}/site-plans/${sitePlanId}/publish`);
      logger.log('SitePlanService', 'Published site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to publish site plan:', error);
      throw error;
    }
  },

  /**
   * Delete a draft site plan version
   * @param {string} projectUuid - The project UUID
   * @param {string} sitePlanId - Site plan UUID
   * @returns {Promise} Response confirming deletion
   */
  async delete(projectUuid, sitePlanId) {
    try {
      const response = await axios.delete(`/project/${projectUuid}/site-plans/${sitePlanId}`);
      logger.log('SitePlanService', 'Deleted site plan');
      return response.data;
    } catch (error) {
      logger.error('SitePlanService', 'Failed to delete site plan:', error);
      throw error;
    }
  },

  /**
   * Get the converted PNG image URL for a site plan version.
   * Response: { status: 'SUCCESS', data: { imageUrl, conversionStatus } }
   * conversionStatus: 'pending' | 'processing' | 'complete' | 'failed'
   * imageUrl only present when conversionStatus === 'complete'
   */
  async getImageUrl(projectId, sitePlanId) {
    const response = await axios.get(
      `/projects/${projectId}/site-plans/${sitePlanId}/image-url`
    );
    return response.data;
  },

  /**
   * Retry a failed site plan conversion.
   */
  async retryConversion(projectId, sitePlanId) {
    const response = await axios.post(
      `/projects/${projectId}/site-plans/${sitePlanId}/retry-conversion`
    );
    return response.data;
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
