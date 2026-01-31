const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/drafter-portal`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const gamificationService = {
  /**
   * Get all achievements with user progress
   * @returns {Promise<Array>} List of achievements with unlock status
   */
  getAchievements: async () => {
    const response = await fetch(`${API_BASE}/achievements`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch achievements');
    return response.json();
  },

  /**
   * Get leaderboard
   * @param {string} period - 'week' | 'month' | 'all'
   * @returns {Promise<Array>} Leaderboard entries
   */
  getLeaderboard: async (period = 'week') => {
    const response = await fetch(`${API_BASE}/leaderboard?period=${period}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },

  /**
   * Get user's level info
   * @returns {Promise<Object>} Level, XP, and perks info
   */
  getLevelInfo: async () => {
    const response = await fetch(`${API_BASE}/level`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch level info');
    return response.json();
  },

  /**
   * Get XP history
   * @returns {Promise<Array>} XP gain history
   */
  getXPHistory: async () => {
    const response = await fetch(`${API_BASE}/xp-history`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch XP history');
    return response.json();
  }
};

export default gamificationService;
