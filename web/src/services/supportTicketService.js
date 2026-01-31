/**
 * Support Ticket Service
 *
 * Handles API calls for the support ticket system with rate limiting,
 * device info collection, and formatting utilities.
 */

import axiosInstance from '../api/axiosInstance';

// ============================================
// CONSTANTS - Color Mappings
// ============================================

export const PRIORITY_COLORS = {
  low: { bg: '#28A745', text: 'var(--text-primary)' },
  medium: { bg: '#FFC107', text: 'var(--gray-900)' },
  high: { bg: 'var(--color-primary)', text: 'var(--text-primary)' },
  urgent: { bg: '#DC3545', text: 'var(--text-primary)' }
};

export const STATUS_COLORS = {
  open: { bg: '#17A2B8', text: 'var(--text-primary)' },
  in_progress: { bg: '#FFC107', text: 'var(--gray-900)' },
  waiting_response: { bg: 'var(--color-primary)', text: 'var(--text-primary)' },
  resolved: { bg: '#28A745', text: 'var(--text-primary)' },
  closed: { bg: '#6C757D', text: 'var(--text-primary)' }
};

export const DEFAULT_OPTIONS = {
  categories: ['bug', 'feature_request', 'general_support', 'account_issue'],
  priorities: ['low', 'medium', 'high', 'urgent'],
  statuses: ['open', 'in_progress', 'waiting_response', 'resolved', 'closed']
};

// ============================================
// RATE LIMITING
// ============================================

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'lastSupportTicketTime';

/**
 * Check if user can create a new ticket (5-minute rate limit)
 * @returns {{ canCreate: boolean, remainingMs: number }}
 */
export const canCreateTicket = () => {
  const lastTicketTime = localStorage.getItem(STORAGE_KEY);

  if (!lastTicketTime) {
    return { canCreate: true, remainingMs: 0 };
  }

  const lastTimestamp = parseInt(lastTicketTime, 10);
  const now = Date.now();
  const elapsed = now - lastTimestamp;
  const remaining = RATE_LIMIT_MS - elapsed;

  if (remaining <= 0) {
    return { canCreate: true, remainingMs: 0 };
  }

  return { canCreate: false, remainingMs: remaining };
};

/**
 * Update the last ticket creation timestamp
 */
export const updateLastTicketTime = () => {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
};

/**
 * Format remaining cooldown time as M:SS
 * @param {number} remainingMs - Milliseconds remaining
 * @returns {string} Formatted time string (e.g., "4:32")
 */
export const getRemainingCooldown = (remainingMs) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// ============================================
// DEVICE INFO
// ============================================

/**
 * Get device information for web browser environment
 * @returns {Object} Device info object
 */
export const getDeviceInfo = () => {
  return {
    brand: 'Web Browser',
    model: navigator.userAgent,
    systemVersion: navigator.platform,
    buildNumber: navigator.appVersion,
    bundleId: window.location.hostname,
    deviceId: `web-${Date.now()}`,
    userAgent: navigator.userAgent
  };
};

// ============================================
// API CALLS
// ============================================

/**
 * Create a new support ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise} API response
 */
export const createTicket = async (ticketData) => {
  const response = await axiosInstance.post('/api/support/tickets', ticketData);
  return response.data;
};

/**
 * Get user's support tickets with pagination
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise} API response
 */
export const getUserTickets = async (page = 1, limit = 20) => {
  const response = await axiosInstance.get('/api/support/tickets/my', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Search user's tickets
 * @param {string} searchTerm - Search query
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} API response
 */
export const searchTickets = async (searchTerm, page = 1, limit = 20) => {
  const response = await axiosInstance.get('/api/support/tickets/my', {
    params: { search: searchTerm, page, limit }
  });
  return response.data;
};

/**
 * Get ticket details by ticket number
 * @param {string} ticketNumber - Ticket number
 * @returns {Promise} API response
 */
export const getTicketDetails = async (ticketNumber) => {
  const response = await axiosInstance.get(`/api/support/tickets/${ticketNumber}`);
  return response.data;
};

/**
 * Get ticket options (categories, priorities, statuses)
 * @returns {Promise} API response
 */
export const getTicketOptions = async () => {
  const response = await axiosInstance.get('/api/support/tickets/options');
  return response.data;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get color for priority badge
 * @param {string} priority - Priority level
 * @returns {Object} Color object with bg and text
 */
export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
};

/**
 * Get color for status badge
 * @param {string} status - Status
 * @returns {Object} Color object with bg and text
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.open;
};

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time (e.g., "Jan 15, 2025 at 3:45 PM")
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get human-readable status label
 * @param {string} status - Status key
 * @returns {string} Formatted label
 */
export const getStatusLabel = (status) => {
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_response: 'Waiting Response',
    resolved: 'Resolved',
    closed: 'Closed'
  };
  return labels[status] || status;
};

/**
 * Get human-readable category label
 * @param {string} category - Category key
 * @returns {string} Formatted label
 */
export const getCategoryLabel = (category) => {
  const labels = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    general_support: 'General Support',
    account_issue: 'Account Issue'
  };
  return labels[category] || category;
};
