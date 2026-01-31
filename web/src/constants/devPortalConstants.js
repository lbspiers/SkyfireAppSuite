// Categories with their associated colors from tokens.css
export const DEV_CATEGORIES = [
  { id: 'automation', label: 'Automation', color: 'var(--color-accent-purple)' },
  { id: 'database', label: 'Database', color: 'var(--color-accent-cyan)' },
  { id: 'interface', label: 'Interface', color: 'var(--color-accent-pink)' },
  { id: 'server', label: 'Server', color: 'var(--color-warning)' },
  { id: 'autocad', label: 'AutoCAD', color: 'var(--color-success)' },
  { id: 'feature', label: 'Feature', color: 'var(--color-success)' },
  { id: 'admin', label: 'Admin', color: 'var(--color-accent-indigo)' },
  { id: 'infrastructure', label: 'Infrastructure', color: 'var(--color-accent-yellow)' },
  { id: 'security', label: 'Security', color: 'var(--color-error)' },
];

export const DEV_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'var(--text-muted)' },
  { id: 'high', label: 'High', color: 'var(--color-warning)' },
  { id: 'urgent', label: 'Urgent', color: 'var(--color-error)' },
];

export const DEV_STATUSES = [
  { id: 'pending', label: 'Pending', color: 'var(--text-muted)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--color-warning)' },
  { id: 'paused', label: 'Paused', color: 'var(--color-info)' },
  { id: 'complete', label: 'Complete', color: 'var(--color-success)' },
];

export const DEV_USERS = [
  { id: 'logan', name: 'Logan', initials: 'LG', color: '#FD7332' },
  { id: 'eli', name: 'Eli', initials: 'EL', color: '#3B82F6' },
  { id: 'stan', name: 'Stan', initials: 'ST', color: '#10B981' },
];

export const DEV_TIME_SCALES = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'lastweek', label: 'Last Week' },
  { id: 'month', label: 'This Month' },
  { id: 'lastmonth', label: 'Last Month' },
  { id: 'all', label: 'All Time' },
];

export const DEV_STORAGE_KEY = 'skyfire_dev_tasks';

// Users allowed to access Dev Portal
export const DEV_PORTAL_ALLOWED_EMAILS = [
  'logan@skyfiresd.com',
  'eli@skyfiresd.com',
];

// Helper function to check access
export const canAccessDevPortal = (userEmail) => {
  if (!userEmail) return false;
  return DEV_PORTAL_ALLOWED_EMAILS.some(
    allowed => allowed.toLowerCase() === userEmail.toLowerCase()
  );
};
