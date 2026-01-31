import React from 'react';
import styles from './Progress.module.css';

const Progress = ({
  value = 0,           // 0-100
  max = 100,
  size = 'md',         // sm, md, lg
  variant = 'primary', // primary, success, warning, error, info
  showLabel = false,
  label,               // Override default percentage label
  animated = false,
  striped = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label !== undefined ? label : `${Math.round(percentage)}%`;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div
        className={`${styles.track} ${styles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`
            ${styles.bar}
            ${styles[variant]}
            ${animated ? styles.animated : ''}
            ${striped ? styles.striped : ''}
          `.trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className={styles.label}>{displayLabel}</span>}
    </div>
  );
};

const CircularProgress = ({
  value = 0,
  max = 100,
  size = 'md',         // sm, md, lg
  variant = 'primary',
  showLabel = false,
  strokeWidth,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = { sm: 40, md: 64, lg: 96 };
  const strokes = { sm: 4, md: 6, lg: 8 };

  const diameter = sizes[size];
  const stroke = strokeWidth || strokes[size];
  const radius = (diameter - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`${styles.circular} ${className}`} style={{ width: diameter, height: diameter }}>
      <svg width={diameter} height={diameter}>
        <circle
          className={styles.circularTrack}
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className={`${styles.circularBar} ${styles[variant]}`}
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
      </svg>
      {showLabel && (
        <span className={styles.circularLabel}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

Progress.Circular = CircularProgress;
export default Progress;
