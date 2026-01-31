const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/drafter-portal`;

// Add auth header helper - uses existing Skyfire auth token
const authHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const drafterAssignmentService = {
  /**
   * Get assignment details
   * @param {string} uuid - Assignment UUID
   * @returns {Promise<{assignment: object, project: object}>}
   */
  getAssignment: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  /**
   * Complete assignment (submit)
   * @param {string} uuid - Assignment UUID
   * @returns {Promise<object>}
   */
  completeAssignment: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/complete`, {
        method: 'POST',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to complete assignment: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw error;
    }
  },

  /**
   * Release assignment back to queue
   * @param {string} uuid - Assignment UUID
   * @param {string} reason - Release reason
   * @param {string} notes - Optional notes
   * @returns {Promise<object>}
   */
  releaseAssignment: async (uuid, reason, notes = '') => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/release`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason, notes })
      });

      if (!response.ok) {
        throw new Error(`Failed to release assignment: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error releasing assignment:', error);
      throw error;
    }
  },

  /**
   * Get files for assignment
   * @param {string} uuid - Assignment UUID
   * @returns {Promise<Array>}
   */
  getFiles: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/files`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  /**
   * Get presigned upload URL
   * @param {string} uuid - Assignment UUID
   * @param {string} fileName - File name
   * @param {string} fileType - File type (site_plan_pdf, site_plan_dwg, single_line_pdf)
   * @param {string} contentType - MIME type
   * @returns {Promise<{uploadUrl: string, fileKey: string}>}
   */
  getUploadUrl: async (uuid, fileName, fileType, contentType) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/files/upload-url`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fileName, fileType, contentType })
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  },

  /**
   * Register uploaded file
   * @param {string} uuid - Assignment UUID
   * @param {object} fileData - File metadata
   * @returns {Promise<object>}
   */
  registerFile: async (uuid, fileData) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/files`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        throw new Error(`Failed to register file: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error registering file:', error);
      throw error;
    }
  },

  /**
   * Delete file
   * @param {string} uuid - Assignment UUID
   * @param {string} fileUuid - File UUID
   * @returns {Promise<object>}
   */
  deleteFile: async (uuid, fileUuid) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/files/${fileUuid}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Get questions for assignment
   * @param {string} uuid - Assignment UUID
   * @returns {Promise<Array>}
   */
  getQuestions: async (uuid) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/questions`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  /**
   * Ask a new question
   * @param {string} uuid - Assignment UUID
   * @param {string} questionText - Question text
   * @returns {Promise<object>}
   */
  askQuestion: async (uuid, questionText) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/${uuid}/questions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ questionText })
      });

      if (!response.ok) {
        throw new Error(`Failed to ask question: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  }
};
