import React from 'react';
import styles from './ProjectHeader.module.css';
import flameIcon from '../../assets/images/Skyfire Flame Icon.png';

const ProjectHeader = ({
  customerName,
  address,
  projectId,
  ahj,
  utility,
  showIcon = true,
  size = 'default' // 'compact' | 'default' | 'large'
}) => (
  <div className={`${styles.header} ${styles[size]}`}>
    <h1 className={styles.title}>
      {showIcon && <img src={flameIcon} alt="" className={styles.icon} />}
      {customerName}
    </h1>
    {address && <p className={styles.address}>{address}</p>}
    {projectId && <p className={styles.projectId}>Project: {projectId}</p>}
    {/* Commented out AHJ and Utility - can be restored if needed */}
    {/* {ahj && <p className={styles.projectId}>AHJ: {ahj}</p>} */}
    {/* {utility && <p className={styles.projectId}>Utility: {utility}</p>} */}
  </div>
);

export default ProjectHeader;
