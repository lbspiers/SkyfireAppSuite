import React from 'react';
import styles from './MountingPlanesContainer.module.css';

/**
 * MountingPlanesContainer - Parent container for all Mounting Plane sections
 * Groups all mounting planes together with orange border and inline label
 * Matches RoofContainer/SystemContainer styling
 */
const MountingPlanesContainer = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Mounting Planes</span>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default MountingPlanesContainer;
