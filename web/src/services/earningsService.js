const API_BASE = `${process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io'}/drafter-portal`;

/**
 * Earnings and payments service for drafter portal
 */
export const earningsService = {
  /**
   * Get earnings summary
   * @returns {Promise<Object>} Summary with totalEarnings, thisWeek, pendingPayout, jobsCompleted
   */
  getSummary: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/earnings/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch earnings summary');
    return response.json();
  },

  /**
   * Get paginated transaction history
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter options (dateFrom, dateTo, type)
   * @returns {Promise<Object>} Paginated transactions
   */
  getTransactions: async (page = 1, limit = 20, filters = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await fetch(`${API_BASE}/earnings/transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  /**
   * Get weekly earnings chart data
   * @returns {Promise<Array>} Array of {week, earnings} objects for last 8 weeks
   */
  getWeeklyChart: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/earnings/weekly-chart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch weekly chart');
    return response.json();
  },

  /**
   * Request payout
   * @param {number} amount - Amount to request
   * @param {string} method - Payment method (bank_transfer, paypal, etc.)
   * @returns {Promise<Object>} Payout request details
   */
  requestPayout: async (amount, method = 'bank_transfer') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/earnings/request-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, method })
    });
    if (!response.ok) throw new Error('Failed to request payout');
    return response.json();
  },

  /**
   * Get payout history
   * @returns {Promise<Array>} Array of past payouts
   */
  getPayoutHistory: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/earnings/payouts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch payout history');
    return response.json();
  },

  /**
   * Get invoice details
   * @param {string} uuid - Invoice UUID
   * @returns {Promise<Object>} Invoice details
   */
  getInvoice: async (uuid) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/invoices/${uuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch invoice');
    return response.json();
  }
};

export default earningsService;
