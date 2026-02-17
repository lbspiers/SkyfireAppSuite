import TableRowButton from '../ui/TableRowButton';
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
          <TableRowButton
            variant="outline"
            onClick={onPrev}
            disabled={prevDisabled}
            label={prevLabel}
          />
        )}
        {centerButton && (
          <TableRowButton
            variant="outline"
            active
            onClick={centerButton.onClick}
            label={centerButton.label}
            className={styles.centerButton}
          />
        )}
        {showNext && (
          <TableRowButton
            variant="outline"
            active
            onClick={onNext}
            disabled={nextDisabled}
            label={nextLabel}
          />
        )}
      </div>
    </div>
  );
};

export default FormNavigationFooter;
