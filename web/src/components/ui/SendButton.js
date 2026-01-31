import React from 'react';
import styles from './SendButton.module.css';

/**
 * SendButton - Reusable pill-shaped send button for chatter/forms
 *
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} loading - Whether button is in loading state
 * @param {string} label - Button text (default: "Send")
 * @param {boolean} showIcon - Whether to show the arrow icon (default: true)
 * @param {boolean} compact - Whether to use compact styling
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles override
 */
const SendButton = ({
  onClick,
  disabled = false,
  loading = false,
  label = 'Send',
  showIcon = true,
  compact = false,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${styles.sendButton} ${compact ? styles.sendButtonCompact : ''} ${className}`}
      style={style}
      {...props}
    >
      {loading ? 'Sending...' : label}
      {showIcon && !loading && <span className={styles.sendIcon}>▶</span>}
    </button>
  );
};

export default SendButton;
