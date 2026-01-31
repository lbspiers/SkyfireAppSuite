import React from 'react';
import { Tooltip } from './';
import styles from './SolarAPPStatusBadge.module.css';

const STATUS_CONFIG = {
  not_started: {
    color: 'muted',
    label: 'Not Submitted',
    description: 'Project has not been submitted to SolarAPP+ yet',
  },
  eligible: {
    color: 'info',
    label: 'Ready to Submit',
    description: 'All requirements met - ready for SolarAPP+ submission',
  },
  not_eligible: {
    color: 'warning',
    label: 'Not Eligible',
    description: 'Missing required information for SolarAPP+ submission',
  },
  pending: {
    color: 'warning',
    label: 'Pending Review',
    description: 'Submitted to SolarAPP+ and awaiting review',
  },
  approved: {
    color: 'success',
    label: 'Approved',
    description: 'Permit approved by SolarAPP+',
  },
  rejected: {
    color: 'error',
    label: 'Rejected',
    description: 'Permit application rejected - review feedback and resubmit',
  },
  paid: {
    color: 'success',
    label: 'Paid & Approved',
    description: 'Permit fees paid and permit fully approved',
  },
};

const SolarAPPStatusBadge = ({
  status = 'not_started',
  size = 'md',
  pill = true,
  showTooltip = true,
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  const badge = (
    <span
      className={`
        ${styles.badge}
        ${styles[config.color]}
        ${styles[size]}
        ${pill ? styles.pill : ''}
        ${className}
      `.trim()}
    >
      {config.label}
    </span>
  );

  if (showTooltip) {
    return (
      <Tooltip content={config.description} position="bottom">
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default SolarAPPStatusBadge;
