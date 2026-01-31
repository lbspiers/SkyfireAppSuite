import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = ({
  variant = 'text',  // text, circular, rectangular
  width,
  height,
  lines = 1,         // For text variant
  className = '',
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`${styles.textGroup} ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.text} ${i === lines - 1 ? styles.textLineLastLine : styles.textLineDefault}`}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Pre-built skeleton patterns
const SkeletonCard = ({ className = '' }) => (
  <div className={`${styles.card} ${className}`}>
    <Skeleton variant="rectangular" height={120} />
    <div className={styles.cardContent}>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" lines={2} />
    </div>
  </div>
);

const SkeletonAvatar = ({ size = 40, withText = false, className = '' }) => (
  <div className={`${styles.avatarRow} ${className}`}>
    <Skeleton variant="circular" width={size} height={size} />
    {withText && (
      <div className={styles.avatarText}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width={80} />
      </div>
    )}
  </div>
);

const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`${styles.table} ${className}`}>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className={styles.tableRow}>
        {Array.from({ length: columns }).map((_, col) => (
          <Skeleton key={col} variant="text" width={`${60 + Math.random() * 40}%`} />
        ))}
      </div>
    ))}
  </div>
);

Skeleton.Card = SkeletonCard;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Table = SkeletonTable;

export default Skeleton;
