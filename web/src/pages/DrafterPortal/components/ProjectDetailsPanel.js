import React from 'react';
import styles from './ProjectDetailsPanel.module.css';

/**
 * Project details panel for workspace
 * @param {Object} props
 * @param {Object} props.project - Project data
 */
const ProjectDetailsPanel = ({ project }) => {
  if (!project) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Loading project details...</div>
      </div>
    );
  }

  const getGoogleMapsLink = () => {
    if (!project.address) return null;
    const address = `${project.address}, ${project.city || ''}, ${project.state || ''} ${project.zipCode || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Project Details</h2>

      <div className={styles.detailsGrid}>
        {/* Customer Name */}
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Customer</div>
          <div className={styles.detailValue}>{project.customerName || 'N/A'}</div>
        </div>

        {/* Project Number */}
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Project #</div>
          <div className={styles.detailValue}>{project.projectNumber || project.uuid || 'N/A'}</div>
        </div>

        {/* Address */}
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>Address</div>
          <div className={styles.detailValue}>
            {project.address ? (
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.addressLink}
              >
                {project.address}
                {project.city && `, ${project.city}`}
                {project.state && `, ${project.state}`}
                {project.zipCode && ` ${project.zipCode}`}
                <span className={styles.mapIcon}>🗺️</span>
              </a>
            ) : (
              'N/A'
            )}
          </div>
        </div>

        {/* System Size */}
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>System Size</div>
          <div className={styles.detailValue}>
            {project.systemSize ? `${project.systemSize} kW` : 'N/A'}
          </div>
        </div>

        {/* Additional Details */}
        {project.utilityCompany && (
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Utility</div>
            <div className={styles.detailValue}>{project.utilityCompany}</div>
          </div>
        )}

        {project.moduleCount && (
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Module Count</div>
            <div className={styles.detailValue}>{project.moduleCount}</div>
          </div>
        )}

        {project.inverterType && (
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Inverter Type</div>
            <div className={styles.detailValue}>{project.inverterType}</div>
          </div>
        )}

        {/* Special Notes */}
        {project.specialNotes && (
          <div className={`${styles.detailItem} ${styles.fullWidth}`}>
            <div className={styles.detailLabel}>Special Notes</div>
            <div className={`${styles.detailValue} ${styles.notes}`}>
              {project.specialNotes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPanel;
