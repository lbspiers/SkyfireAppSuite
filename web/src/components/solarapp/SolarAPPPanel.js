import React from 'react';
import { Button, Progress, LoadingSpinner, Alert } from '../ui';
import SolarAPPStatusBadge from '../ui/SolarAPPStatusBadge';
import SolarAPPEligibilitySection from './SolarAPPEligibilitySection';
import AttestationForm from './AttestationForm';
import useSolarAppEligibility from '../../hooks/useSolarAppEligibility';
import styles from './SolarAPPPanel.module.css';

/**
 * SolarAPPPanel - Main container for SolarAPP+ integration
 *
 * Displays:
 * - Header with SolarAPP+ logo/title and status badge
 * - Eligibility checklist (collapsible sections)
 * - Progress bar showing overall completion %
 * - Action buttons
 *
 * @param {string} projectUuid - Project UUID
 * @param {Object} projectData - Project data object
 */
const SolarAPPPanel = ({ projectUuid, projectData }) => {
  const {
    isEligible,
    sections,
    percentComplete,
    missingFields,
    completedFields,
    loading,
    error,
    refetch,
  } = useSolarAppEligibility(projectUuid);

  const handleCheckEligibility = () => {
    refetch();
  };

  const handleSubmit = () => {
    // Phase 2: Implement actual submission
    alert('SolarAPP+ submission will be implemented in Phase 2');
  };

  const handleNavigateToSection = (sectionKey) => {
    // Phase 2: Implement navigation to specific form sections
    console.log('Navigate to section:', sectionKey);
  };

  // Determine current status based on eligibility
  const getCurrentStatus = () => {
    if (isEligible) return 'eligible';
    if (percentComplete === 0) return 'not_started';
    return 'not_eligible';
  };

  const currentStatus = getCurrentStatus();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p className={styles.loadingText}>Checking SolarAPP+ eligibility...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Alert variant="error" title="Error Loading Eligibility Data">
          {error}
        </Alert>
        <Button onClick={refetch} variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>☀️</span>
            <h2 className={styles.title}>SolarAPP+</h2>
          </div>
          <p className={styles.subtitle}>Automated Solar Permitting</p>
        </div>
        <SolarAPPStatusBadge status={currentStatus} size="lg" />
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Eligibility Progress</span>
          <span className={styles.progressPercent}>{percentComplete}% Complete</span>
        </div>
        <Progress
          value={percentComplete}
          max={100}
          variant={isEligible ? 'success' : 'warning'}
          size="lg"
        />
        <div className={styles.progressStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{completedFields.length}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statValueWarning}`}>
              {missingFields.length}
            </span>
            <span className={styles.statLabel}>Remaining</span>
          </div>
        </div>
      </div>

      {/* Eligibility Checklist */}
      <div className={styles.checklistSection}>
        <h3 className={styles.sectionTitle}>Requirements Checklist</h3>

        {sections.projectInfo && (
          <SolarAPPEligibilitySection
            title="Project Information"
            fields={sections.projectInfo.fields}
            complete={sections.projectInfo.complete}
            onNavigate={handleNavigateToSection}
          />
        )}

        {sections.equipment && (
          <SolarAPPEligibilitySection
            title="Equipment"
            fields={sections.equipment.fields}
            complete={sections.equipment.complete}
            onNavigate={handleNavigateToSection}
          />
        )}

        {sections.electrical && (
          <SolarAPPEligibilitySection
            title="Electrical"
            fields={sections.electrical.fields}
            complete={sections.electrical.complete}
            onNavigate={handleNavigateToSection}
          />
        )}

        {sections.structural && (
          <SolarAPPEligibilitySection
            title="Structural"
            fields={sections.structural.fields}
            complete={sections.structural.complete}
            onNavigate={handleNavigateToSection}
          />
        )}

        {sections.documents && (
          <SolarAPPEligibilitySection
            title="Documents"
            fields={sections.documents.fields}
            complete={sections.documents.complete}
            onNavigate={handleNavigateToSection}
          />
        )}

        {sections.attestations && (
          <SolarAPPEligibilitySection
            title="Attestations"
            fields={sections.attestations.fields}
            complete={sections.attestations.complete}
            onNavigate={handleNavigateToSection}
          >
            <AttestationForm projectUuid={projectUuid} />
          </SolarAPPEligibilitySection>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={handleCheckEligibility}
        >
          Refresh Eligibility
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isEligible}
        >
          {isEligible ? 'Submit to SolarAPP+' : 'Complete Requirements to Submit'}
        </Button>
      </div>

      {/* Info Alert */}
      {!isEligible && missingFields.length > 0 && (
        <Alert variant="info" className={styles.infoAlert}>
          Complete the {missingFields.length} remaining requirement{missingFields.length !== 1 ? 's' : ''} above to become eligible for SolarAPP+ submission.
        </Alert>
      )}

      {isEligible && (
        <Alert variant="success" className={styles.successAlert}>
          All requirements met! This project is ready for SolarAPP+ submission.
        </Alert>
      )}
    </div>
  );
};

export default SolarAPPPanel;
