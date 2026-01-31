import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import RevisionRequestForm from './RevisionRequestForm';
import RevisionRequestList from './RevisionRequestList';
import revisionService from '../../services/revisionService';
import logger from '../../services/devLogger';
import { useSocket } from '../../hooks/useSocket';
import styles from './RevisionsPanel.module.css';

/**
 * UtilityRevisionsPanel - Utility revision requests sub-tab content
 * Mirrors AHJRevisionsPanel with revision_type = 'utility'
 */
const UtilityRevisionsPanel = ({ projectUuid, projectData }) => {
  const [revisions, setRevisions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { joinProject, leaveProject, socket } = useSocket();

  const loadRevisions = useCallback(async () => {
    if (!projectUuid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await revisionService.list(projectUuid, { type: 'utility' });
      setRevisions(data);
    } catch (err) {
      logger.error('UtilityRevisionsPanel', 'Failed to load revisions:', err);
      setError('Failed to load revisions');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  // Socket.IO: Join project room and listen for revision status changes
  useEffect(() => {
    if (!projectUuid || !socket) return;

    // Join project room
    joinProject(projectUuid);

    // Listen for revision status changes
    const handleRevisionStatusChanged = (data) => {
      logger.log('UtilityRevisionsPanel', 'Revision status changed:', data);

      // Update local state if this is a Utility revision
      if (data.revisionType === 'utility') {
        setRevisions(prev =>
          prev.map(rev =>
            rev.id === data.revisionId
              ? { ...rev, status: data.newStatus }
              : rev
          )
        );

        // Show toast notification
        if (data.newStatus === 'complete') {
          toast.success('Utility revision has been completed!', {
            position: 'top-right',
            autoClose: 5000,
          });
        } else if (data.newStatus === 'in_progress') {
          toast.info('Utility revision is now being processed', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    };

    socket.on('revision:statusChanged', handleRevisionStatusChanged);

    // Cleanup
    return () => {
      socket.off('revision:statusChanged', handleRevisionStatusChanged);
      leaveProject(projectUuid);
    };
  }, [projectUuid, socket, joinProject, leaveProject]);

  const handleSubmit = async (formData) => {
    if (!projectUuid) {
      toast.error('Project ID not found', { position: 'top-right' });
      return;
    }

    setSubmitting(true);

    try {
      const newRevision = await revisionService.submitRevision(
        projectUuid,
        formData.file,
        {
          revisionType: 'utility',
          reviewerName: formData.reviewerName,
          reviewerPhone: formData.reviewerPhone,
          reviewerEmail: formData.reviewerEmail,
          notes: formData.notes,
        }
      );

      setRevisions(prev => [newRevision, ...prev]);

      logger.log('UtilityRevisionsPanel', 'Revision submitted:', newRevision.id);
      toast.success('Utility revision request submitted successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

    } catch (err) {
      logger.error('UtilityRevisionsPanel', 'Failed to submit revision:', err);
      toast.error('Failed to submit revision request. Please try again.', {
        position: 'top-right',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (revision) => {
    try {
      const { downloadUrl, filename } = await revisionService.getDocumentUrl(
        projectUuid,
        revision.id
      );

      window.open(downloadUrl, '_blank');

      logger.log('UtilityRevisionsPanel', `Opened document: ${filename}`);
    } catch (err) {
      logger.error('UtilityRevisionsPanel', 'Failed to get document URL:', err);
      toast.error('Failed to load document. Please try again.', {
        position: 'top-right',
      });
    }
  };

  return (
    <div className={styles.subTabContent}>
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Submit Utility Revision</h3>
        <RevisionRequestForm
          revisionType="utility"
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.listSection}>
        {loading ? (
          <div className={styles.loadingState}>Loading revisions...</div>
        ) : error ? (
          <div className={styles.errorState}>
            <span>{error}</span>
            <button onClick={loadRevisions} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <RevisionRequestList
            revisions={revisions}
            onViewDocument={handleViewDocument}
            emptyMessage="No utility revision requests submitted yet"
          />
        )}
      </div>
    </div>
  );
};

export default UtilityRevisionsPanel;
