import React from 'react';
import styles from './ActionButton.module.css';

/**
 * ActionButton - Square action button with icon
 * Used for edit, camera, delete actions in EquipmentRow
 *
 * @param {string} icon - Icon source (image path or 'trash' for SVG)
 * @param {string} label - Aria label for accessibility
 * @param {function} onClick - Click handler
 * @param {string} variant - 'default' or 'danger'
 */
const ActionButton = ({ icon, label, onClick, variant = 'default' }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick && onClick();
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${variant === 'danger' ? styles.danger : ''}`}
      onClick={handleClick}
      aria-label={label}
    >
      {icon === 'trash' ? (
        <TrashIcon />
      ) : (
        <img src={icon} alt={label} className={styles.icon} />
      )}
    </button>
  );
};

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

export default ActionButton;
