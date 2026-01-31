import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { StatusBadge } from '../ui';
import revisionService from '../../services/revisionService';
import logger from '../../services/devLogger';
import { useSocket } from '../../hooks/useSocket';
import styles from './RevisionsPanel.module.css';

/**
 * SupportTicketsPanel - Shows support tickets linked to project's revisions
 * Displayed in the third sub-tab of the Revisions panel
 */
const SupportTicketsPanel = ({ projectUuid, projectData }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { joinProject, leaveProject, socket } = useSocket();

  const loadTickets = useCallback(async () => {
    if (!projectUuid) return;

    try {
      setLoading(true);
      setError(null);

      const revisions = await revisionService.list(projectUuid);

      const ticketData = revisions
        .filter(rev => rev.supportTicketId)
        .map(rev => ({
          id: rev.supportTicketId,
          revisionId: rev.id,
          revisionType: rev.revisionType,
          status: rev.status,
          documentFilename: rev.documentFilename,
          createdAt: rev.createdAt,
          completedAt: rev.completedAt,
        }));

      setTickets(ticketData);
    } catch (err) {
      logger.error('SupportTicketsPanel', 'Failed to load tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Socket.IO: Join project room and listen for revision status changes
  useEffect(() => {
    if (!projectUuid || !socket) return;

    // Join project room
    joinProject(projectUuid);

    // Listen for revision status changes
    const handleRevisionStatusChanged = (data) => {
      logger.log('SupportTicketsPanel', 'Revision status changed:', data);

      // Update local state for the ticket
      setTickets(prev =>
        prev.map(ticket =>
          ticket.revisionId === data.revisionId
            ? {
                ...ticket,
                status: data.newStatus,
                completedAt: data.newStatus === 'complete' ? new Date().toISOString() : ticket.completedAt,
              }
            : ticket
        )
      );

      // Show toast notification
      if (data.newStatus === 'complete') {
        toast.success(`Support ticket for ${data.revisionType.toUpperCase()} revision has been resolved!`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } else if (data.newStatus === 'in_progress') {
        toast.info('Our team is now working on your revision', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    socket.on('revision:statusChanged', handleRevisionStatusChanged);

    // Cleanup
    return () => {
      socket.off('revision:statusChanged', handleRevisionStatusChanged);
      leaveProject(projectUuid);
    };
  }, [projectUuid, socket, joinProject, leaveProject]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'complete':
        return 'completed';
      case 'in_progress':
        return 'in-progress';
      case 'pending':
      default:
        return 'pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={styles.subTabContent}>
        <div className={styles.loadingState}>Loading support tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.subTabContent}>
        <div className={styles.errorState}>
          <span>{error}</span>
          <button onClick={loadTickets} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.subTabContent}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Support Tickets</h3>
        <span className={styles.ticketCount}>
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyText}>
            No support tickets yet
          </div>
          <div className={styles.emptyHint}>
            Support tickets will appear here when revisions are submitted and processed by our team.
          </div>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {tickets.map(ticket => (
            <div key={ticket.revisionId} className={styles.ticketCard}>
              <div className={styles.ticketCardHeader}>
                <div className={styles.ticketCardTitle}>
                  <span className={`${styles.revisionTypeBadge} ${styles[ticket.revisionType]}`}>
                    {ticket.revisionType.toUpperCase()}
                  </span>
                  <span className={styles.ticketFilename}>{ticket.documentFilename}</span>
                </div>
                <StatusBadge status={getStatusVariant(ticket.status)} size="sm" />
              </div>

              <div className={styles.ticketCardMeta}>
                <span>Submitted: {formatDate(ticket.createdAt)}</span>
                {ticket.completedAt && (
                  <span>Completed: {formatDate(ticket.completedAt)}</span>
                )}
              </div>

              <div className={styles.ticketCardStatus}>
                {ticket.status === 'pending' && (
                  <span className={styles.statusMessage}>⏳ Awaiting review by our team</span>
                )}
                {ticket.status === 'in_progress' && (
                  <span className={styles.statusMessage}>🔧 Our team is working on this</span>
                )}
                {ticket.status === 'complete' && (
                  <span className={styles.statusMessage}>✅ Revision has been addressed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPanel;
