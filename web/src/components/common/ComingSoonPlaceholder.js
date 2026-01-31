import React from 'react';
import styles from '../../styles/ComingSoonPlaceholder.module.css';

/**
 * ComingSoonPlaceholder - Reusable placeholder component for features under development
 *
 * @param {string} title - Title of the feature
 * @param {string} icon - Emoji or icon to display
 * @param {string} description - Optional description text
 */
const ComingSoonPlaceholder = ({
  title = 'Coming Soon',
  icon = '🚧',
  description = 'This feature is currently under development.'
}) => {
  return (
    <div className={styles.comingSoon}>
      <div className={styles.comingSoonIcon}>{icon}</div>
      <h3 className={styles.comingSoonTitle}>{title}</h3>
      <p className={styles.comingSoonText}>{description}</p>
    </div>
  );
};

export default ComingSoonPlaceholder;
