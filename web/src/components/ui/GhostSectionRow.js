import React from 'react';
import styles from './GhostSectionRow.module.css';

/**
 * GhostSectionRow - A placeholder that looks like a collapsed EquipmentRow header
 * but with a dashed grey border to indicate the section is not yet configured.
 * Clicking it triggers the provided onClick callback to add/show the section.
 *
 * @param {string} label - Section label (e.g., "Solar Panel (Type 2)")
 * @param {function} onClick - Callback when clicked
 * @param {string} className - Additional CSS classes
 */
const GhostSectionRow = ({ label, onClick, className = '' }) => {
  return (
    <div className={`${styles.row} ${className}`}>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
      >
        <span className={styles.icon}>+</span>
        <span className={styles.label}>{label}</span>
      </button>
    </div>
  );
};

export default GhostSectionRow;
