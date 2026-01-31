import React from 'react';
import styles from './TableRowButton.module.css';

/**
 * TableRowButton - Reusable pill-shaped button that fits in table rows
 * Based on LaunchButton but more versatile for various use cases
 *
 * @param {function} onClick - Click handler
 * @param {string} label - Button text
 * @param {string} variant - 'primary' | 'secondary' | 'outline' (default: 'outline')
 * @param {boolean} active - Whether button is in active state
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles override
 */
const TableRowButton = ({
  onClick,
  label,
  variant = 'outline',
  active = false,
  className = '',
  style = {},
  disabled = false,
  ...props
}) => {
  const variantClass = styles[`variant-${variant}`] || styles['variant-outline'];
  const activeClass = active ? styles.active : '';
  const disabledClass = disabled ? styles.disabled : '';

  return (
    <button
      onClick={onClick}
      className={`${styles.tableRowButton} ${variantClass} ${activeClass} ${disabledClass} ${className}`}
      style={style}
      disabled={disabled}
      type="button"
      {...props}
    >
      {label}
    </button>
  );
};

export default TableRowButton;
