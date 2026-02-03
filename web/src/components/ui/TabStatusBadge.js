import React from 'react';
import styles from './StatusBadge.module.css';

/**
 * TabStatusBadge - Display component for project tab statuses
 *
 * @param {string} status - Tab status: 'pending', 'draft', 'complete', 'needs_attention', 'none'
 * @param {string} label - Override default label
 * @param {string} size - Badge size: 'sm', 'md', 'lg' (default: 'sm')
 * @param {boolean} pill - Rounded pill shape (default: true)
 * @param {boolean} dot - Show as dot only, no text (default: false)
 * @param {string} statusReason - Optional reason for needs_attention status (shown in title)
 * @param {string} className - Additional CSS classes
 *
 * @example
 * ```jsx
 * <TabStatusBadge status="complete" />
 * <TabStatusBadge status="needs_attention" statusReason="Missing documents" />
 * <TabStatusBadge status="draft" size="md" />
 * ```
 */
const TabStatusBadge = ({
  status,
  label,
  size = 'sm',
  pill = true,
  dot = false,
  statusReason,
  className = '',
}) => {
  // Map tab statuses to color variants
  const STATUS_CONFIG = {
    pending: {
      color: 'muted',
      label: 'Pending',
    },
    draft: {
      color: 'info',
      label: 'Draft',
    },
    complete: {
      color: 'success',
      label: 'Complete',
    },
    needs_attention: {
      color: 'warning',
      label: 'Needs Attention',
    },
    none: {
      color: 'muted',
      label: 'None',
    },
  };

  const config = STATUS_CONFIG[status] || { color: 'muted', label: status };
  const displayLabel = label || config.label;

  // Build title attribute (show reason if provided)
  const title = statusReason ? `${displayLabel}: ${statusReason}` : displayLabel;

  if (dot) {
    return (
      <span
        className={`${styles.dot} ${styles[config.color]} ${className}`}
        title={title}
        aria-label={displayLabel}
      />
    );
  }

  return (
    <span
      className={`
        ${styles.badge}
        ${styles[config.color]}
        ${styles[size]}
        ${pill ? styles.pill : ''}
        ${className}
      `.trim()}
      title={title}
    >
      {displayLabel}
    </span>
  );
};

export default TabStatusBadge;
