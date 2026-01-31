const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/drafter-portal`;

// Add auth header helper - uses existing Skyfire auth token
const authHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const drafterPortalService = {
  /**
   * Get drafter dashboard status
   * @returns {Promise<{queueCount: number, activeAssignment: object|null, metrics: object, drafterStatus: string, canClaimProject: boolean}>}
   */
  getStatus: async () => {
    try {
      const response = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching drafter status:', error);
      throw error;
    }
  },

  /**
   * Claim next project from queue
   * @returns {Promise<{assignment: object, project: object}>}
   */
  claimNextProject: async () => {
    try {
      const response = await fetch(`${API_BASE}/claim-next`, {
        method: 'POST',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to claim project: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error claiming project:', error);
      throw error;
    }
  },

  /**
   * Get drafter metrics
   * @returns {Promise<object>}
   */
  getMetrics: async () => {
    try {
      const response = await fetch(`${API_BASE}/metrics`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  },

  /**
   * Get leaderboard data
   * @returns {Promise<Array>}
   */
  getLeaderboard: async () => {
    try {
      const response = await fetch(`${API_BASE}/leaderboard`, {
        method: 'GET',
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
};
