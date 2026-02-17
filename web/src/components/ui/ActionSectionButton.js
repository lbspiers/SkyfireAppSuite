import React from 'react';
import styles from './ActionSectionButton.module.css';

/**
 * ActionSectionButton - Rectangular button for triggering modals or adding sections
 * Used for actions like Inventory, + Solar Panel (Type 2), etc.
 * Different from TableRowButton which is pill-shaped for data entry.
 *
 * @param {string} label - Button text
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} variant - Button variant: 'primary' (electric blue), 'orange' (Skyfire orange), 'secondary' (gray)
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 */
const ActionSectionButton = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  style = {}
}) => {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[`variant-${variant}`]} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </button>
  );
};

export default ActionSectionButton;
