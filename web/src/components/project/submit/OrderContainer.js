import React from 'react';
import styles from './OrderContainer.module.css';

/**
 * OrderContainer - Parent container for Submit form sections
 * Groups Print Draft, Order PE Stamps, and Order Permits sections
 * Matches RoofContainer/MountingPlanesContainer styling with orange border and inline label
 */
const OrderContainer = ({ title, children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>{title}</span>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default OrderContainer;
