import React from 'react';
import styles from './StatusBadge.module.css';

const STATUS_VARIANTS = {
  // Project/Task Status
  completed: { color: 'success', label: 'Completed' },
  'in-progress': { color: 'info', label: 'In Progress' },
  'in progress': { color: 'info', label: 'In Progress' },
  active: { color: 'info', label: 'Active' },
  planned: { color: 'purple', label: 'Planned' },
  pending: { color: 'warning', label: 'Pending' },
  cancelled: { color: 'error', label: 'Cancelled' },
  inactive: { color: 'muted', label: 'Inactive' },

  // Team member status
  'invite-sent': { color: 'warning', label: 'Invite Sent' },
  deactivated: { color: 'error', label: 'Deactivated' },
  online: { color: 'success', label: 'Online' },
  offline: { color: 'muted', label: 'Offline' },

  // Priority
  urgent: { color: 'error', label: 'Urgent' },
  high: { color: 'warning', label: 'High' },
  medium: { color: 'info', label: 'Medium' },
  low: { color: 'muted', label: 'Low' },

  // Generic
  success: { color: 'success', label: 'Success' },
  warning: { color: 'warning', label: 'Warning' },
  error: { color: 'error', label: 'Error' },
  info: { color: 'info', label: 'Info' },
};

const StatusBadge = ({
  status,
  label,        // Override default label
  size = 'md',  // sm, md, lg
  pill = true,  // Rounded pill shape
  dot = false,  // Show as dot only (no text)
  className = '',
}) => {
  const variant = STATUS_VARIANTS[status?.toLowerCase()] || { color: 'muted', label: status };
  const displayLabel = label || variant.label;

  if (dot) {
    return (
      <span
        className={`${styles.dot} ${styles[variant.color]} ${className}`}
        title={displayLabel}
        aria-label={displayLabel}
      />
    );
  }

  return (
    <span
      className={`
        ${styles.badge}
        ${styles[variant.color]}
        ${styles[size]}
        ${pill ? styles.pill : ''}
        ${className}
      `.trim()}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
