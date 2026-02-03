import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import styles from '../../styles/Dashboard.module.css';
import { CSS_GRADIENTS } from '../../styles/gradient';
import { StatusDropdown } from '../ui';

/**
 * Animated number counter component
 */
const AnimatedCounter = ({ value }) => {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  return <span>{displayValue}</span>;
};

/**
 * StatusTabCard - Individual status tab with file folder effect
 *
 * @param {string} label - Status label (e.g., "All", "Design")
 * @param {number} count - Number of projects in this status
 * @param {number} change - Change from last month (can be negative)
 * @param {string} color - Status color (hex)
 * @param {boolean} isSelected - Whether this tab is selected
 * @param {function} onClick - Click handler
 * @param {boolean} loading - Loading state
 * @param {boolean} showMetrics - Whether to show count and change metrics
 * @param {string} customColor - Custom background color for selected tab
 * @param {ReactNode} icon - Optional icon component to display before label
 * @param {string} status - Optional status (pending, in_progress, draft, complete, needs_attention, none)
 * @param {function} onStatusChange - Optional callback when status is manually changed (newStatus, reason)
 * @param {string} tabName - Optional tab name for filtering status options ('survey' | 'site_plan' | 'plan_set' | 'revisions')
 */
const StatusTabCard = ({
  label,
  count = 0,
  change = 0,
  color,
  isSelected = false,
  onClick,
  loading = false,
  showMetrics = true,
  customColor,
  icon,
  status,
  onStatusChange,
  tabName = null
}) => {
  if (loading) {
    return (
      <button
        className={`${styles.statusTab} ${styles.statusTabLoading}`}
        disabled
      >
        <div className={`${styles.skeleton} ${styles.skeletonLabel}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonCount}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonChange}`}></div>
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`${styles.statusTab} ${isSelected ? styles.statusTabSelected : ''}`}
      style={{
        background: isSelected ? (customColor || 'var(--bg-panel)') : undefined,
        position: 'relative'
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isSelected ? {} : undefined}
      transition={{ duration: 0.2 }}
    >
      {/* Status indicator */}
      {status && (
        <div style={{ position: 'absolute', top: '6px', left: '6px', bottom: '-2px', zIndex: 100, display: 'flex', alignItems: 'stretch' }}>
          <StatusDropdown
            currentStatus={status}
            onStatusChange={onStatusChange}
            disabled={!onStatusChange}
            tabName={tabName}
          />
        </div>
      )}

      {/* Status Label */}
      <span className={styles.statusTabLabelWrapper}>
        <span className={styles.statusTabLabelContent}>
          {icon && <span className={styles.statusTabIcon}>{icon}</span>}
          <span className={styles.statusTabLabelText}>
            {label}
          </span>
        </span>
        {isSelected && (
          <span className={styles.statusTabUnderline} />
        )}
      </span>

      {/* Count */}
      {showMetrics && (
        <span className={styles.statusTabCount}>
          <AnimatedCounter value={count} />
        </span>
      )}
    </motion.button>
  );
};

export default StatusTabCard;
