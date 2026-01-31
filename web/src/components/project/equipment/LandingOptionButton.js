import React from 'react';
import styles from './LandingOptionButton.module.css';

/**
 * LandingOptionButton - Selectable button for each landing destination option
 * Supports highlighting for special options (AC coupling, SMS connections)
 */
const LandingOptionButton = ({
  label,
  description,
  highlighted = false,
  selected = false,
  onClick,
  disabled = false,
  type = 'panel',
}) => {
  const classNames = [
    styles.button,
    selected && styles.selected,
    highlighted && styles.highlighted,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.content}>
        <div className={styles.labelRow}>
          {highlighted && <span className={styles.highlightDot} />}
          <span className={styles.label}>{label}</span>
        </div>
        <div className={styles.description}>{description}</div>
      </div>
    </button>
  );
};

export default LandingOptionButton;
