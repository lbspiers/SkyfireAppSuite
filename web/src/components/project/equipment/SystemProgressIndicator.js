import React from 'react';
import styles from './SystemProgressIndicator.module.css';

/**
 * SystemProgressIndicator - Shows which system is being configured
 * Allows jumping back to edit completed systems
 */
const SystemProgressIndicator = ({
  currentStep,
  totalSteps,
  completedSystems = [],
  activeSystems = [],
  onSystemSelect,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.stepText}>
        Configuring System {currentStep} of {totalSteps}
      </div>
      <div className={styles.pillsContainer}>
        {activeSystems.map((systemNum) => {
          const isCurrent = systemNum === currentStep;
          const isCompleted = completedSystems.includes(systemNum);
          const isFuture = systemNum > currentStep && !isCompleted;

          let pillClass = styles.pill;
          if (isCurrent) {
            pillClass = `${styles.pill} ${styles.current}`;
          } else if (isCompleted) {
            pillClass = `${styles.pill} ${styles.completed}`;
          } else if (isFuture) {
            pillClass = `${styles.pill} ${styles.future}`;
          }

          return (
            <div key={systemNum} className={styles.pillWrapper}>
              <button
                type="button"
                onClick={() => !isFuture && onSystemSelect && onSystemSelect(systemNum)}
                className={pillClass}
                disabled={isFuture}
              >
                System {systemNum}
              </button>
              {isCompleted && !isCurrent && (
                <div className={styles.editBadge}>
                  <svg className={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemProgressIndicator;
