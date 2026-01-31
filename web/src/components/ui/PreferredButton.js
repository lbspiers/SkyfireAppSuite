/**
 * PreferredButton - Small button to open preferred equipment modal
 *
 * Placed next to equipment section titles for quick access.
 */

import React from 'react';
import styles from './PreferredButton.module.css';

const PreferredButton = ({ onClick, label = 'Preferred', disabled = false }) => {
  return (
    <button
      type="button"
      className={styles.preferredButton}
      onClick={onClick}
      disabled={disabled}
      title="Select from preferred equipment"
    >
      <span>{label}</span>
    </button>
  );
};

export default PreferredButton;
