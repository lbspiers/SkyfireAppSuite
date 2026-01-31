import React from 'react';
import styles from './MetricCard.module.css';

/**
 * Reusable metric display card for drafter dashboard
 * @param {Object} props
 * @param {string} props.label - Metric label
 * @param {string|number} props.value - Metric value
 * @param {React.ReactNode} props.icon - Icon component (optional)
 * @param {string} props.trend - Trend indicator: 'up', 'down', 'neutral' (optional)
 * @param {string} props.color - Color theme: 'green', 'yellow', 'red', 'neutral'
 */
const MetricCard = ({ label, value, icon, trend, color = 'neutral' }) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case 'up':
        return <span className={styles.trendUp}>↑</span>;
      case 'down':
        return <span className={styles.trendDown}>↓</span>;
      case 'neutral':
        return <span className={styles.trendNeutral}>→</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.metricCard} ${styles[color]}`}>
      <div className={styles.header}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.label}>{label}</div>
      </div>
      <div className={styles.valueContainer}>
        <div className={styles.value}>{value}</div>
        {getTrendIcon()}
      </div>
    </div>
  );
};

export default MetricCard;
