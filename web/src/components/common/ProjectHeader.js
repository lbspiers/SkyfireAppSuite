import React from 'react';
import styles from './ProjectHeader.module.css';

/**
 * ProjectHeader - Displays clean project info header
 * Used in ChatterPanel tabs to show customer name, project ID, and address
 *
 * @param {object} projectData - Full project data object
 */
const ProjectHeader = ({ projectData }) => {
  if (!projectData) return null;

  const site = projectData.site || {};
  const details = projectData.details || {};

  // Build customer name
  const customerName = details.customer_first_name && details.customer_last_name
    ? `${details.customer_first_name} ${details.customer_last_name}`
    : details.customer_first_name || details.customer_last_name || null;

  // Build address
  const address = site.address
    ? `${site.address}, ${site.city || ''}, ${site.state || ''} ${site.zip_code || site.zip || ''}`.trim()
    : null;

  // Project ID - use installer_project_id (same as dashboard table)
  const projectId = projectData.installer_project_id || projectData.project_id || null;

  // Build first line: "Customer Name - Project ID"
  const firstLine = [customerName, projectId].filter(Boolean).join(' - ');

  // Don't render if we have no data
  if (!firstLine && !address) return null;

  return (
    <div className={styles.projectHeader}>
      {firstLine && (
        <div className={styles.headerLine}>{firstLine}</div>
      )}
      {address && (
        <div className={styles.headerLine}>{address}</div>
      )}
      <div className={styles.headerDivider} />
    </div>
  );
};

export default ProjectHeader;
