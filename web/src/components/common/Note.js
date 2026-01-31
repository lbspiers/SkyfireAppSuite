import React from 'react';
import styles from './Note.module.css';

/**
 * @deprecated This component is deprecated. Use Alert from '../../ui' instead.
 *
 * Migration example:
 * Old: <Note>Your message</Note>
 * New: <Alert variant="info">Your message</Alert>
 *
 * Reusable Note component for informational messages
 * @param {string} children - The note text content
 */
const Note = ({ children }) => {
  return (
    <div className={styles.note}>
      {children}
    </div>
  );
};

export default Note;
