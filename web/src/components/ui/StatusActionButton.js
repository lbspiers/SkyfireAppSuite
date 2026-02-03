import React from 'react';
import styles from './StatusActionButton.module.css';
import { getStatusConfig } from '../../constants/tabStatusConfig';

/**
 * StatusActionButton - Small square status indicator button
 * Based on ActionButton styling but for status display
 *
 * @param {string} status - Status type: 'pending', 'in_progress', 'draft', 'complete', 'needs_attention', 'none'
 * @param {function} onClick - Optional click handler
 * @param {boolean} disabled - Disabled state
 */
const StatusActionButton = ({ status, onClick, disabled = false }) => {
  const getStatusDisplay = (status) => {
    const labelMap = {
      pending: 'P',
      in_progress: 'I',
      draft: 'D',
      complete: 'C',
      needs_attention: '!',
      none: '-',
    };
    return labelMap[status] || '?';
  };

  const statusConfig = getStatusConfig(status);
  const config = {
    label: getStatusDisplay(status),
    color: '#FFFFFF',
    bgColor: statusConfig.hex,
    ariaLabel: statusConfig.label,
  };

  // Use div when disabled to avoid nesting button inside button
  const Element = disabled ? 'div' : 'button';

  return (
    <Element
      type={!disabled ? "button" : undefined}
      className={`${styles.button} ${disabled ? styles.disabled : ''}`}
      onClick={!disabled ? onClick : undefined}
      aria-label={config.ariaLabel}
      disabled={!disabled ? disabled : undefined}
      style={{
        '--status-color': config.color,
        '--status-bg-color': config.bgColor
      }}
    >
      <span className={styles.label}>{config.label}</span>
    </Element>
  );
};

export default StatusActionButton;
