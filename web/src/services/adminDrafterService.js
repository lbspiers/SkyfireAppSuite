const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/admin/drafter-portal`;

const authHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const adminDrafterService = {
  /**
   * Get dashboard overview stats
   * @returns {Promise<{queueCount: number, inProgress: number, onlineDrafters: number, completedToday: number, urgentCount: number}>}
   */
  getDashboard: async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  /**
   * Get queue list
   * @returns {Promise<Array>}
   */
  getQueue: async () => {
    try {
      const response = await fetch(`${API_BASE}/queue`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch queue: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching queue:', error);
      throw error;
    }
  },

  /**
   * Add project to queue
   * @param {string} projectId - Project ID
   * @param {string} notes - Optional notes for drafter
   * @param {number} timeLimitSeconds - Time limit in seconds (default 1800)
   * @returns {Promise<object>}
   */
  addToQueue: async (projectId, notes = '', timeLimitSeconds = 1800) => {
    try {
      const response = await fetch(`${API_BASE}/queue`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ projectId, notes, timeLimitSeconds })
      });

      if (!response.ok) {
        throw new Error(`Failed to add to queue: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  },

  /**
   * Toggle urgent status
   * @param {string} queueUuid - Queue item UUID
   * @param {boolean} isUrgent - Urgent status
   * @param {string} reason - Optional reason for urgency
   * @returns {Promise<object>}
   */
  toggleUrgent: async (queueUuid, isUrgent, reason = '') => {
    try {
      const response = await fetch(`${API_BASE}/queue/${queueUuid}/urgent`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isUrgent, reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle urgent: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error toggling urgent:', error);
      throw error;
    }
  },

  /**
   * Reorder queue
   * @param {Array<string>} orderArray - Array of queue UUIDs in new order
   * @returns {Promise<object>}
   */
  reorderQueue: async (orderArray) => {
    try {
      const response = await fetch(`${API_BASE}/queue/reorder`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ order: orderArray })
      });

      if (!response.ok) {
        throw new Error(`Failed to reorder queue: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error reordering queue:', error);
      throw error;
    }
  },

  /**
   * Remove from queue
   * @param {string} queueUuid - Queue item UUID
   * @returns {Promise<object>}
   */
  removeFromQueue: async (queueUuid) => {
    try {
      const response = await fetch(`${API_BASE}/queue/${queueUuid}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to remove from queue: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  },

  /**
   * Get active assignments
   * @returns {Promise<Array>}
   */
  getActiveAssignments: async () => {
    try {
      const response = await fetch(`${API_BASE}/assignments/active`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active assignments: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching active assignments:', error);
      throw error;
    }
  },

  /**
   * Get drafters list
   * @returns {Promise<Array>}
   */
  getDrafters: async () => {
    try {
      const response = await fetch(`${API_BASE}/drafters`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drafters: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching drafters:', error);
      throw error;
    }
  },

  /**
   * Update drafter status
   * @param {string} drafterUuid - Drafter UUID
   * @param {string} status - Status (active, restricted, suspended)
   * @returns {Promise<object>}
   */
  updateDrafterStatus: async (drafterUuid, status) => {
    try {
      const response = await fetch(`${API_BASE}/drafters/${drafterUuid}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update drafter status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating drafter status:', error);
      throw error;
    }
  },

  /**
   * Get pending questions
   * @returns {Promise<Array>}
   */
  getPendingQuestions: async () => {
    try {
      const response = await fetch(`${API_BASE}/questions/pending`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending questions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching pending questions:', error);
      throw error;
    }
  },

  /**
   * Answer question
   * @param {string} questionUuid - Question UUID
   * @param {string} answerText - Answer text
   * @returns {Promise<object>}
   */
  answerQuestion: async (questionUuid, answerText) => {
    try {
      const response = await fetch(`${API_BASE}/questions/${questionUuid}/answer`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ answerText })
      });

      if (!response.ok) {
        throw new Error(`Failed to answer question: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error answering question:', error);
      throw error;
    }
  }
};
