import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import styles from '../../styles/Dashboard.module.css';

/**
 * Animated number counter component
 */
const AnimatedNumber = ({ value }) => {
  const spring = useSpring(0, { duration: 1500 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

/**
 * StatCard - Animated KPI card with glass morphism effect
 *
 * @param {string} title - Card title (e.g., "Total Projects")
 * @param {number} value - Numeric value to display
 * @param {string} icon - Icon emoji or character
 * @param {number} change - Percentage change (optional)
 * @param {string} changeLabel - Label for change (e.g., "vs last month")
 * @param {string} trend - 'up', 'down', or 'neutral'
 * @param {boolean} loading - Loading state
 */
const StatCard = ({
  title,
  value = 0,
  icon = '📊',
  change,
  changeLabel = 'vs last month',
  trend = 'neutral',
  loading = false
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getChangeClass = () => {
    if (trend === 'up') return styles.statCardChangePositive;
    if (trend === 'down') return styles.statCardChangeNegative;
    return styles.statCardChangeNeutral;
  };

  if (loading) {
    return (
      <motion.div
        className={styles.statCard}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statCardHeader}>
          <div className={`${styles.skeleton} ${styles.skeletonStatTitle}`}></div>
          <div className={`${styles.skeleton} ${styles.skeletonStatIcon}`}></div>
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonStatValue}`}></div>
        <div className={`${styles.skeleton} ${styles.skeletonStatChange}`}></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.statCard}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <div className={styles.statCardHeader}>
        <div className={styles.statCardTitle}>{title}</div>
        <div className={styles.statCardIcon}>
          {icon}
        </div>
      </div>

      <div className={styles.statCardValue}>
        <AnimatedNumber value={value} />
      </div>

      {change !== undefined && (
        <motion.div
          className={`${styles.statCardChange} ${getChangeClass()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <span>{getTrendIcon()} {Math.abs(change)}%</span>
          <span className={styles.statCardLabel}>{changeLabel}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StatCard;
