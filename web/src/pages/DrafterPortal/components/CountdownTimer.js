import React from 'react';
import styles from './CountdownTimer.module.css';

/**
 * Countdown timer display component
 * Receives time data from useSyncedTimer hook
 *
 * @param {number} remainingSeconds - Seconds remaining
 * @param {string} timerState - 'active' | 'warning' | 'critical' | 'expired'
 * @param {string} formattedTime - Pre-formatted time string (MM:SS)
 * @param {number} totalSeconds - Total time limit for progress calculation
 * @param {boolean} showProgress - Whether to show progress bar
 */
const CountdownTimer = ({
  remainingSeconds = 0,
  timerState = 'active',
  formattedTime = '00:00',
  totalSeconds = 1800,
  showProgress = true
}) => {
  const getProgressPercentage = () => {
    if (!totalSeconds || remainingSeconds === undefined) return 0;
    return Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100);
  };

  if (timerState === 'expired') {
    return (
      <div className={`${styles.timer} ${styles.expired}`}>
        <div className={styles.expiredText}>TIME EXPIRED</div>
      </div>
    );
  }

  return (
    <div className={`${styles.timer} ${styles[timerState]}`}>
      <div className={styles.timeDisplay}>{formattedTime}</div>
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}
      <div className={styles.label}>Time Remaining</div>
    </div>
  );
};

export default CountdownTimer;
