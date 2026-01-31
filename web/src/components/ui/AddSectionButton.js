import React from 'react';
import styles from './AddSectionButton.module.css';

/**
 * AddSectionButton Component
 * Unified "+ Section" button with orange gradient line extending full width
 * Used for adding new sections like Mounting Plane 2, Roofing B, etc.
 *
 * @param {string} label - Button text (e.g., "Mounting Plane 2", "Roofing (B)")
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 */
const AddSectionButton = ({
  label,
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <button
        type="button"
        className={`${styles.addButton} ${disabled ? styles.disabled : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={styles.plus}>+</span>
        <span className={styles.label}>{label}</span>
      </button>
      <div className={styles.gradientLine} />
    </div>
  );
};

export default AddSectionButton;
