import React from 'react';
import styles from './Note.module.css';

/**
 * Note Component
 * Simple component for displaying note text with standard spacing
 */
const Note = ({ text }) => {
  return (
    <div className={styles.note}>
      {text}
    </div>
  );
};

export default Note;
