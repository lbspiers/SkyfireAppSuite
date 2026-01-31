import React from 'react';
import styles from './GridSizeToggle.module.css';
import Grid2x2Icon from '../../assets/icons/grid-2x2.svg';
import Grid3x3Icon from '../../assets/icons/grid-3x3.svg';
import Grid4x4Icon from '../../assets/icons/grid-4x4.svg';

const GridSizeToggle = ({ value, onChange }) => {
  return (
    <div className={styles.gridSizeToggle}>
      <button
        type="button"
        className={`${styles.gridSizeBtn} ${value === 'large' ? styles.selected : ''}`}
        onClick={() => onChange('large')}
        title="Large grid (2-3 per row)"
      >
        <img src={Grid2x2Icon} alt="Large grid" className={styles.icon} />
      </button>
      <button
        type="button"
        className={`${styles.gridSizeBtn} ${value === 'medium' ? styles.selected : ''}`}
        onClick={() => onChange('medium')}
        title="Medium grid (4-5 per row)"
      >
        <img src={Grid3x3Icon} alt="Medium grid" className={styles.icon} />
      </button>
      <button
        type="button"
        className={`${styles.gridSizeBtn} ${value === 'small' ? styles.selected : ''}`}
        onClick={() => onChange('small')}
        title="Small grid (6-8 per row)"
      >
        <img src={Grid4x4Icon} alt="Small grid" className={styles.icon} />
      </button>
    </div>
  );
};

export default GridSizeToggle;
