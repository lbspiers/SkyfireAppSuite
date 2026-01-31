const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/drafter-portal`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const drafterProfileService = {
  /**
   * Get profile data
   * @returns {Promise<Object>} Profile data
   */
  getProfile: async () => {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  /**
   * Update profile
   * @param {Object} data - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (data) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  /**
   * Upload profile photo
   * @param {File} file - Image file
   * @returns {Promise<Object>} Photo URL
   */
  uploadPhoto: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE}/profile/photo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload photo');
    return response.json();
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification settings
   * @returns {Promise<Object>} Updated preferences
   */
  updateNotifications: async (preferences) => {
    const response = await fetch(`${API_BASE}/profile/notifications`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update notifications');
    return response.json();
  },

  /**
   * Get account statistics
   * @returns {Promise<Object>} Account stats
   */
  getStats: async () => {
    const response = await fetch(`${API_BASE}/profile/stats`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  /**
   * Submit support ticket
   * @param {string} subject - Ticket subject
   * @param {string} message - Ticket message
   * @param {string} category - Ticket category
   * @returns {Promise<Object>} Ticket confirmation
   */
  submitSupportTicket: async (subject, message, category) => {
    const response = await fetch(`${API_BASE}/support/ticket`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ subject, message, category })
    });
    if (!response.ok) throw new Error('Failed to submit ticket');
    return response.json();
  }
};

export default drafterProfileService;
