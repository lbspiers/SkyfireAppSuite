import React from 'react';
import styles from './StatusBanner.module.css';

/**
 * Warning/restricted status alert banner
 * @param {Object} props
 * @param {string} props.status - Status type: 'warning', 'restricted', 'suspended'
 * @param {number} props.releasesRemaining - Number of releases remaining
 */
const StatusBanner = ({ status, releasesRemaining }) => {
  const getMessage = () => {
    switch (status) {
      case 'warning':
        return `Your completion rate is below 98%. Be careful with releases. (${releasesRemaining}/2 remaining)`;
      case 'restricted':
        return 'Account restricted. Complete assigned projects to restore access.';
      case 'suspended':
        return 'Account suspended. Contact support.';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'warning':
        return '⚠️';
      case 'restricted':
        return '🚫';
      case 'suspended':
        return '⛔';
      default:
        return '';
    }
  };

  if (!status || status === 'active') {
    return null;
  }

  return (
    <div className={`${styles.statusBanner} ${styles[status]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{getMessage()}</span>
    </div>
  );
};

export default StatusBanner;
