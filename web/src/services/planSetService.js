import axios from '../config/axios';
import logger from './devLogger';

/**
 * Plan Set Service - API methods for plan set image conversion
 * Backend API: /project/:projectUuid/versions
 */
const planSetService = {
  /**
   * Get the converted PNG image URL for a plan set version.
   * Response: { status: 'SUCCESS', data: { imageUrl, conversionStatus, pages?, pageCount? } }
   * conversionStatus: 'pending' | 'processing' | 'complete' | 'failed'
   * imageUrl only present when conversionStatus === 'complete'
   * For multi-page: pages array with { page, label, imageUrl, imageKey }
   */
  async getImageUrl(projectUuid, versionId) {
    try {
      const endpoint = `/project/${projectUuid}/versions/${versionId}/image-url`;
      logger.log('PlanSetService', `Calling GET ${endpoint}`);
      const response = await axios.get(endpoint);
      logger.log('PlanSetService', 'Fetched image URL for version:', versionId, 'Response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('PlanSetService', `Failed to get image URL for version ${versionId}:`, error.response?.status, error.message);
      throw error;
    }
  },

  /**
   * Retry a failed plan set conversion.
   */
  async retryConversion(projectUuid, versionId) {
    try {
      const response = await axios.post(
        `/project/${projectUuid}/versions/${versionId}/retry-conversion`
      );
      logger.log('PlanSetService', 'Retry conversion for version:', versionId);
      return response.data;
    } catch (error) {
      logger.error('PlanSetService', 'Failed to retry conversion:', error);
      throw error;
    }
  },

  /**
   * Save annotated plan set images back to S3
   * @param {string} projectUuid - Project UUID
   * @param {number} versionId - Version ID
   * @param {Array} pages - Array of { pageNumber, imageData, imageKey }
   * @returns {Promise} Response with status and updated pages count
   */
  async saveAnnotations(projectUuid, versionId, pages) {
    try {
      const endpoint = `/project/${projectUuid}/versions/${versionId}/save-annotations`;
      logger.log('PlanSetService', `Saving ${pages.length} annotated pages for version ${versionId}`);

      const response = await axios.post(endpoint, { pages });

      logger.log('PlanSetService', 'Annotations saved successfully:', response.data);
      return response.data;
    } catch (error) {
      logger.error('PlanSetService', `Failed to save annotations for version ${versionId}:`, error.response?.status, error.message);
      throw error;
    }
  }
};

export default planSetService;
