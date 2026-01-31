import React, { useState, useEffect } from 'react';
import { Button, LoadingSpinner, Alert } from '../ui';
import axios from '../../config/axios';
import styles from './AttestationForm.module.css';

/**
 * AttestationForm - SolarAPP+ compliance attestations
 *
 * Collects boolean confirmations from installer regarding code compliance
 * Required before project can be submitted to SolarAPP+
 */

// Attestation categories with their fields
const ATTESTATION_CATEGORIES = [
  {
    key: 'general',
    title: 'General',
    fields: [
      { key: 'general_licensed_contractor', label: 'I am a licensed contractor in this jurisdiction' },
      { key: 'general_permit_authority', label: 'I have authority to apply for this permit' },
      { key: 'general_accurate_info', label: 'All information provided is accurate and complete' },
    ],
  },
  {
    key: 'structural',
    title: 'Structural',
    fields: [
      { key: 'structural_roof_condition', label: 'Roof is in good condition and can support the system' },
      { key: 'structural_attachment_compliant', label: 'Attachment method complies with manufacturer specs' },
      { key: 'structural_load_path', label: 'Load path to foundation is continuous' },
    ],
  },
  {
    key: 'electrical',
    title: 'Electrical',
    fields: [
      { key: 'electrical_nec_compliant', label: 'Installation will comply with current NEC requirements' },
      { key: 'electrical_utility_approval', label: 'System meets utility interconnection requirements' },
      { key: 'electrical_grounding', label: 'Grounding and bonding will meet code requirements' },
      { key: 'electrical_rapid_shutdown', label: 'Rapid shutdown requirements will be met' },
    ],
  },
  {
    key: 'fire',
    title: 'Fire Safety',
    fields: [
      { key: 'fire_setbacks', label: 'Fire setbacks and pathways will be maintained' },
      { key: 'fire_marking', label: 'Required labeling and marking will be installed' },
    ],
  },
];

const AttestationForm = ({ projectUuid }) => {
  const [attestations, setAttestations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load existing attestations
  useEffect(() => {
    if (!projectUuid) {
      setLoading(false);
      return;
    }

    const fetchAttestations = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/solarapp/project/${projectUuid}/attestations`);

        if (response.data.status === 'SUCCESS' && response.data.data) {
          setAttestations(response.data.data);
        } else {
          // Initialize with all false if no data
          const initialAttestations = {};
          Object.values(ATTESTATION_CATEGORIES).forEach(category => {
            category.fields.forEach(field => {
              initialAttestations[field.key] = false;
            });
          });
          setAttestations(initialAttestations);
        }
      } catch (err) {
        console.error('[AttestationForm] Error loading attestations:', err);
        setError(err.response?.data?.message || 'Failed to load attestations');

        // Initialize with all false on error
        const initialAttestations = {};
        Object.values(ATTESTATION_CATEGORIES).forEach(category => {
          category.fields.forEach(field => {
            initialAttestations[field.key] = false;
          });
        });
        setAttestations(initialAttestations);
      } finally {
        setLoading(false);
      }
    };

    fetchAttestations();
  }, [projectUuid]);

  // Toggle individual attestation
  const handleToggleAttestation = (key) => {
    setAttestations(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const allFields = ATTESTATION_CATEGORIES.flatMap(cat => cat.fields);
    const completed = allFields.filter(field => attestations[field.key]).length;
    const total = allFields.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  // Save attestations
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const userUuid = userData.uuid || userData.id;

      await axios.post(`/solarapp/project/${projectUuid}/attestations`, {
        attestations,
        userUuid,
      });

      // Show success message
      setError(null);
    } catch (err) {
      console.error('[AttestationForm] Error saving attestations:', err);
      setError(err.response?.data?.message || 'Failed to save attestations');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <p className={styles.loadingText}>Loading attestations...</p>
      </div>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <div className={styles.container}>
      {/* Header with overall progress */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Compliance Attestations</h3>
          <p className={styles.subtitle}>
            Confirm all requirements are met before submitting to SolarAPP+
          </p>
        </div>
        <div className={styles.progressBadge}>
          <span className={styles.progressText}>
            {overallProgress.completed}/{overallProgress.total}
          </span>
          <span className={styles.progressLabel}>Complete</span>
        </div>
      </div>

      {error && (
        <Alert variant="error" className={styles.alert}>
          {error}
        </Alert>
      )}

      {/* Attestation Categories */}
      <div className={styles.categories}>
        {ATTESTATION_CATEGORIES.map((category) => (
          <div key={category.key}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>{category.title}</div>

            {/* Attestation Checkboxes */}
            {category.fields.map(field => (
              <label key={field.key} className={styles.attestationItem}>
                <input
                  type="checkbox"
                  checked={attestations[field.key] || false}
                  onChange={() => handleToggleAttestation(field.key)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>{field.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
          loading={saving}
        >
          {saving ? 'Saving...' : 'Save Attestations'}
        </Button>
      </div>

      {/* Info Alert */}
      {overallProgress.completed < overallProgress.total && (
        <Alert variant="info" className={styles.infoAlert}>
          Complete all {overallProgress.total} attestations to become eligible for SolarAPP+ submission.
        </Alert>
      )}

      {overallProgress.completed === overallProgress.total && (
        <Alert variant="success" className={styles.successAlert}>
          All attestations complete! You can now submit this project to SolarAPP+.
        </Alert>
      )}
    </div>
  );
};

export default AttestationForm;
