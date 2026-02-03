/**
 * Tab Status Configuration
 * Defines colors, labels, and which statuses are available per tab
 */

// Master status definitions
export const STATUS_CONFIG = {
  pending: {
    value: 'pending',
    label: 'Pending',
    color: 'var(--tab-status-pending)',
    hex: '#2F3E4E',
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    color: 'var(--tab-status-in-progress)',
    hex: '#E85D04',
  },
  draft: {
    value: 'draft',
    label: 'Draft',
    color: 'var(--tab-status-draft)',
    hex: '#1E4D8C',
  },
  complete: {
    value: 'complete',
    label: 'Complete',
    color: 'var(--tab-status-complete)',
    hex: '#1B4332',
  },
  needs_attention: {
    value: 'needs_attention',
    label: 'Needs Attention',
    color: 'var(--tab-status-needs-attention)',
    hex: '#7B1E1E',
  },
  none: {
    value: 'none',
    label: 'None',
    color: 'var(--tab-status-none)',
    hex: '#6C757D',
  },
};

// Tab-specific available statuses
export const TAB_STATUS_OPTIONS = {
  survey: ['pending', 'in_progress', 'complete'],
  site_plan: ['pending', 'in_progress', 'complete'],
  plan_set: ['pending', 'in_progress', 'draft', 'complete'],
  revisions: ['none', 'pending', 'in_progress', 'needs_attention', 'complete'],
};

/**
 * Get available status options for a specific tab
 * @param {string} tabName - 'survey' | 'site_plan' | 'plan_set' | 'revisions'
 * @returns {Array} Array of status config objects
 */
export const getStatusOptionsForTab = (tabName) => {
  const allowedStatuses = TAB_STATUS_OPTIONS[tabName] || Object.keys(STATUS_CONFIG);
  return allowedStatuses.map(status => STATUS_CONFIG[status]);
};

/**
 * Get status config by value
 * @param {string} status - Status value
 * @returns {Object} Status config object
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.none;
};

/**
 * Get color for a status
 * @param {string} status - Status value
 * @returns {string} CSS color value (hex)
 */
export const getStatusColor = (status) => {
  return STATUS_CONFIG[status]?.hex || STATUS_CONFIG.none.hex;
};

/**
 * Get label for a status
 * @param {string} status - Status value
 * @returns {string} Display label
 */
export const getStatusLabel = (status) => {
  return STATUS_CONFIG[status]?.label || 'Unknown';
};
