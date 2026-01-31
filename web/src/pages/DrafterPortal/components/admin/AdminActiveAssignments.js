import React, { useState, useEffect } from 'react';
import styles from './AdminActiveAssignments.module.css';

/**
 * Admin active assignments view
 * @param {Object} props
 * @param {Array} props.assignments - Active assignments
 */
const AdminActiveAssignments = ({ assignments = [] }) => {
  const [timers, setTimers] = useState({});

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};

      assignments.forEach(assignment => {
        if (assignment.expiresAt) {
          const now = new Date().getTime();
          const expiry = new Date(assignment.expiresAt).getTime();
          const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
          newTimers[assignment.uuid] = remaining;
        }
      });

      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignments]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (seconds, totalSeconds) => {
    const percentage = (seconds / totalSeconds) * 100;
    if (percentage > 50) return 'green';
    if (percentage > 16) return 'yellow';
    return 'red';
  };

  const getProgressPercentage = (seconds, totalSeconds) => {
    return ((totalSeconds - seconds) / totalSeconds) * 100;
  };

  // Sort by expiring soonest first
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aRemaining = timers[a.uuid] || 0;
    const bRemaining = timers[b.uuid] || 0;
    return aRemaining - bRemaining;
  });

  if (sortedAssignments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No active assignments</p>
      </div>
    );
  }

  return (
    <div className={styles.assignmentsList}>
      {sortedAssignments.map(assignment => {
        const remaining = timers[assignment.uuid] || 0;
        const total = assignment.timeLimitSeconds || 1800;
        const color = getTimerColor(remaining, total);
        const progress = getProgressPercentage(remaining, total);

        return (
          <div key={assignment.uuid} className={styles.assignmentCard}>
            <div className={styles.header}>
              <div className={styles.address}>
                {assignment.projectAddress || 'Unknown Address'}
              </div>
              <div className={`${styles.timer} ${styles[color]}`}>
                {formatTime(remaining)}
              </div>
            </div>

            <div className={styles.drafter}>
              <span className={styles.drafterLabel}>Drafter:</span>
              <span className={styles.drafterName}>
                {assignment.drafterName || 'Unknown'}
              </span>
            </div>

            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${styles[color]}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {assignment.filesUploaded !== undefined && (
              <div className={styles.filesInfo}>
                Files: {assignment.filesUploaded || 0}/3
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminActiveAssignments;
