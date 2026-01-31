import React from 'react';
import styles from './LaunchButton.module.css';

/**
 * LaunchButton - Reusable pill-shaped button for launching/navigating to projects
 *
 * @param {function} onClick - Click handler
 * @param {string} label - Button text (default: "Launch")
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles override
 */
const LaunchButton = ({
  onClick,
  label = 'Launch',
  className = '',
  style = {},
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.launchButton} ${className}`}
      style={style}
      {...props}
    >
      {label}
    </button>
  );
};

export default LaunchButton;
