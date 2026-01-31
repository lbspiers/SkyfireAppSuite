import React from 'react';
import Button from '../ui/Button';
import styles from './FormNavigationFooter.module.css';

/**
 * FormNavigationFooter - Fixed footer with Prev/Next navigation buttons
 * Stays at bottom of Design Portal forms, content scrolls above it
 */
const FormNavigationFooter = ({
  onPrev,
  onNext,
  showPrev = true,
  showNext = true,
  prevLabel = 'Prev',
  nextLabel = 'Next',
  prevDisabled = false,
  nextDisabled = false,
  centerButton = null, // Optional: { label, onClick } for centered custom button
}) => {
  return (
    <div className={styles.footer}>
      <div className={styles.buttonContainer}>
        {showPrev && (
          <Button
            variant="secondary"
            onClick={onPrev}
            disabled={prevDisabled}
            fixedWidth
          >
            {prevLabel}
          </Button>
        )}
        {centerButton && (
          <Button
            variant="primary"
            onClick={centerButton.onClick}
            className={styles.centerButton}
          >
            {centerButton.label}
          </Button>
        )}
        {showNext && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled}
            fixedWidth
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormNavigationFooter;
