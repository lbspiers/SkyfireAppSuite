/**
 * TeamSuggestionCard
 * Displays a smart suggestion for team improvements
 */

import React from 'react';
import Button from '../ui/Button';
import styles from './TeamSuggestionCard.module.css';

const TeamSuggestionCard = ({
  suggestion,
  onAction,
  onDismiss,
}) => {
  const { icon, title, message, action, role } = suggestion;

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <i className={icon} />
      </div>

      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.message}>{message}</p>
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAction(role)}
        >
          {action}
        </Button>
        <button
          className={styles.dismissButton}
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
        >
          <i className="ri-close-line" />
        </button>
      </div>
    </div>
  );
};

export default TeamSuggestionCard;
