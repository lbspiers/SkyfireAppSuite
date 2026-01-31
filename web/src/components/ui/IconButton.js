import React from 'react';
import styles from '../../styles/Login.module.css';

/**
 * IconButton - Reusable icon button component with image and label
 *
 * @param {Object} props
 * @param {string} props.icon - Path to icon image
 * @param {string} props.label - Button label text
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.primary - Whether this is a primary button (orange styling)
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.type - Button type (button, submit)
 */
const IconButton = ({
  icon,
  label,
  onClick,
  primary = false,
  disabled = false,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      className={styles.iconButton}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <img
        src={icon}
        alt={label}
        className={`${styles.iconButtonImage} ${primary ? styles.primaryIcon : ''}`}
      />
      <span className={`${styles.iconButtonLabel} ${primary ? styles.primary : ''}`}>
        {label}
      </span>
    </button>
  );
};

export default IconButton;
