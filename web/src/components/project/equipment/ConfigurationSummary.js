import React from 'react';
import styles from './ConfigurationSummary.module.css';

/**
 * ConfigurationSummary - Displays the completed configuration
 * Allows editing individual systems and finalizing
 */
const ConfigurationSummary = ({
  systemLandings = {},
  activeSystems = [],
  onEdit,
  onSave,
  configData = {},
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Landing Destinations</h3>
      </div>

      <div className={styles.rows}>
        {activeSystems.map((systemNum) => {
          const landing = systemLandings[`system${systemNum}`];
          return (
            <div key={systemNum} className={styles.row}>
              <div className={styles.systemLabel}>System {systemNum}</div>
              <div className={styles.landingValue}>{landing || 'Not configured'}</div>
              <button
                type="button"
                onClick={() => onEdit && onEdit(systemNum)}
                className={styles.editButton}
                aria-label={`Edit System ${systemNum}`}
              >
                <svg className={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConfigurationSummary;
