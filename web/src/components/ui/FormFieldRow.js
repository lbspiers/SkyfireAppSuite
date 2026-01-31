import React from 'react';
import styles from './FormFieldRow.module.css';

/**
 * FormFieldRow Component
 *
 * A standardized field row component for displaying label+input patterns
 * inside EquipmentRow sections. Replaces inline-styled field rows across
 * equipment forms.
 *
 * @param {string} label - Field label text
 * @param {React.ReactNode} children - Input element or content
 * @param {boolean} noBorder - Remove bottom border (default: false)
 * @param {string} className - Additional CSS classes
 */
const FormFieldRow = ({
  label,
  children,
  noBorder = false,
  className = ''
}) => (
  <div className={`${styles.fieldRow} ${noBorder ? styles.noBorder : ''} ${className}`}>
    <span className={styles.label}>{label}</span>
    <div className={styles.content}>
      {children}
    </div>
  </div>
);

export default FormFieldRow;
