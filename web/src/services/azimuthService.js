import logger from './devLogger';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://api.skyfireapp.io';

const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

const getCompanyId = () => {
  try {
    // Try companyData first (matches surveyService.js pattern)
    const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
    if (companyData.uuid) {
      return companyData.uuid;
    }

    // Fallback to userData.company.uuid
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    return userData?.company?.uuid;
  } catch {
    logger.error('AzimuthService', 'Failed to get company ID from session storage');
    return null;
  }
};

const getMultipartHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  // Don't set Content-Type - browser sets it with boundary for multipart/form-data
});

export const azimuthService = {
  /**
   * Get presigned S3 upload URL for azimuth map
   * @param {string} projectUuid - Project UUID
   * @param {string} fileName - Name of the file
   * @returns {Promise<{uploadUrl: string, fileKey: string}>} Presigned URL and S3 key
   */
  async getUploadUrl(projectUuid, fileName) {
    try {
      logger.log('AzimuthService', `Getting upload URL for ${fileName}`);

      const url = `${API_BASE}/project/${projectUuid}/files/upload-url?fileName=${encodeURIComponent(fileName)}&fileType=azimuth_map&contentType=image/png`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AzimuthService', `Failed to get upload URL: ${response.status} ${errorText}`);
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      logger.log('AzimuthService', 'Upload URL retrieved successfully');
      return data.data;
    } catch (error) {
      logger.error('AzimuthService', 'Error getting upload URL:', error);
      throw error;
    }
  },

  /**
   * Register uploaded file with project
   * @param {string} projectUuid - Project UUID
   * @param {Object} fileData - File metadata
   * @returns {Promise<Object>} Registered file data
   */
  async registerFile(projectUuid, fileData) {
    try {
      logger.log('AzimuthService', `Registering file ${fileData.fileName}`);

      const response = await fetch(`${API_BASE}/project/${projectUuid}/files`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fileData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AzimuthService', `Failed to register file: ${response.status} ${errorText}`);
        throw new Error('Failed to register file');
      }

      const data = await response.json();
      logger.log('AzimuthService', 'File registered successfully');
      return data;
    } catch (error) {
      logger.error('AzimuthService', 'Error registering file:', error);
      throw error;
    }
  },

  /**
   * Save azimuth measurements to project
   * NOTE: This endpoint may not exist yet on the backend - gracefully handle 404
   * @param {string} projectUuid - Project UUID
   * @param {Array} measurements - Array of measurement objects
   * @returns {Promise<Object|null>} Save response or null if endpoint doesn't exist
   */
  async saveMeasurements(projectUuid, measurements) {
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        logger.warn('AzimuthService', 'Company ID not found - skipping measurements save');
        return null;
      }

      logger.log('AzimuthService', `Attempting to save ${measurements.length} measurements`);

      const response = await fetch(`${API_BASE}/project/${projectUuid}/azimuth`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          companyId,
          measurements,
        }),
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet (404), just log and continue
        if (response.status === 404) {
          logger.warn('AzimuthService', 'Measurements endpoint not implemented yet - image saved but measurements not persisted');
          return null;
        }

        const errorText = await response.text();
        logger.error('AzimuthService', `Failed to save measurements: ${response.status} ${errorText}`);
        throw new Error('Failed to save measurements');
      }

      const data = await response.json();
      logger.log('AzimuthService', 'Measurements saved successfully');
      return data;
    } catch (error) {
      // Don't throw - measurements save is optional (image is more important)
      logger.error('AzimuthService', 'Error saving measurements (non-fatal):', error);
      return null;
    }
  },

  /**
   * Get azimuth measurements for project
   * @param {string} projectUuid - Project UUID
   * @returns {Promise<Array>} Array of measurements
   */
  async getMeasurements(projectUuid) {
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        throw new Error('Company information not found');
      }

      logger.log('AzimuthService', `Fetching measurements for project ${projectUuid}`);

      const response = await fetch(
        `${API_BASE}/project/${projectUuid}/azimuth?companyId=${companyId}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        // If 404, return empty array (no measurements yet)
        if (response.status === 404) {
          logger.log('AzimuthService', 'No measurements found for this project');
          return [];
        }

        const errorText = await response.text();
        logger.error('AzimuthService', `Failed to get measurements: ${response.status} ${errorText}`);
        throw new Error('Failed to get measurements');
      }

      const data = await response.json();
      const measurements = data.data?.measurements || [];
      logger.log('AzimuthService', `Retrieved ${measurements.length} measurements`);
      return measurements;
    } catch (error) {
      logger.error('AzimuthService', 'Error getting measurements:', error);
      throw error;
    }
  },
};

export default azimuthService;
