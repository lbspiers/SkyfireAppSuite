import React from 'react';
import styles from './AdminQueueStats.module.css';

/**
 * Admin queue stats cards
 * @param {Object} props
 * @param {Object} props.stats - Stats data
 */
const AdminQueueStats = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const { queueCount, inProgress, onlineDrafters, completedToday, urgentCount } = stats;

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>Queue</div>
        <div className={styles.statValue}>{queueCount || 0}</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>In Progress</div>
        <div className={styles.statValue}>{inProgress || 0}</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>Online Drafters</div>
        <div className={styles.statValue}>{onlineDrafters || 0}</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statLabel}>Completed Today</div>
        <div className={styles.statValue}>{completedToday || 0}</div>
      </div>

      {urgentCount > 0 && (
        <div className={`${styles.statCard} ${styles.urgent}`}>
          <div className={styles.statLabel}>Urgent Items</div>
          <div className={styles.statValue}>
            🔥 {urgentCount}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueueStats;
