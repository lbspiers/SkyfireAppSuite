import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { StatusBadge, Button, EquipmentRow } from '../ui';
import { useDevNotes } from '../../hooks/useDevNotes';
import logger from '../../services/devLogger';
import styles from './DevNotesPanel.module.css';

/**
 * DevNotesPanel - Admin panel for managing dev notes and support tickets
 * Displays support tickets (urgent) at top, development notes below
 */
const DevNotesPanel = () => {
  const { notes, isLoading, fetchNotes } = useDevNotes();
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  const [processingTickets, setProcessingTickets] = useState(new Set());

  // Separate support tickets from development notes
  const supportTickets = notes.filter(note => note.category === 'support_ticket' && note.status !== 'processed');
  const processedTickets = notes.filter(note => note.category === 'support_ticket' && note.status === 'processed');
  const devNotes = notes.filter(note => note.category === 'development');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const toggleTicketExpanded = (ticketId) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleMarkComplete = async (ticketId) => {
    try {
      setProcessingTickets(prev => new Set(prev).add(ticketId));

      const response = await fetch(`/api/dev-notes/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-company-id': localStorage.getItem('companyId') || '',
        },
        body: JSON.stringify({ status: 'processed' }),
      });

      if (!response.ok) throw new Error('Failed to update ticket status');

      await fetchNotes(); // Refresh the list
      toast.success('Support ticket marked as complete');
    } catch (error) {
      logger.error('DevNotesPanel', 'Failed to mark ticket complete:', error);
      toast.error('Failed to update ticket status');
    } finally {
      setProcessingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  const getTicketStatusVariant = (status) => {
    switch (status) {
      case 'processed':
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={styles.devNotesPanel}>
        <div className={styles.loadingState}>Loading dev notes...</div>
      </div>
    );
  }

  return (
    <div className={styles.devNotesPanel}>
      {/* Support Tickets Section (Urgent) */}
      <div className={styles.urgentSection}>
        <div className={styles.urgentHeader}>
          <div className={styles.urgentHeaderTitle}>
            <span className={styles.urgentIcon}>🚨</span>
            <h2 className={styles.urgentTitle}>Support Tickets</h2>
            <span className={styles.urgentBadge}>
              {supportTickets.length}
            </span>
          </div>
          <p className={styles.urgentSubtitle}>
            Customer revision requests requiring immediate attention
          </p>
        </div>

        {supportTickets.length === 0 ? (
          <div className={styles.emptyTickets}>
            <span className={styles.emptyIcon}>✅</span>
            <p className={styles.emptyText}>All caught up! No pending support tickets.</p>
          </div>
        ) : (
          <div className={styles.ticketList}>
            {supportTickets.map(ticket => {
              const isExpanded = expandedTickets.has(ticket.id);
              const isProcessing = processingTickets.has(ticket.id);
              const metadata = ticket.metadata || {};

              return (
                <div key={ticket.id} className={styles.ticketCard}>
                  <div
                    className={styles.ticketHeader}
                    onClick={() => toggleTicketExpanded(ticket.id)}
                  >
                    <div className={styles.ticketHeaderLeft}>
                      <span className={styles.expandIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div className={styles.ticketTitleGroup}>
                        <div className={styles.ticketMainTitle}>
                          <span className={`${styles.revisionTypeBadge} ${styles[metadata.revisionType]}`}>
                            {metadata.revisionType?.toUpperCase() || 'REVISION'}
                          </span>
                          <span className={styles.ticketProjectName}>
                            {metadata.projectName || 'Unknown Project'}
                          </span>
                        </div>
                        <div className={styles.ticketMetaRow}>
                          <span className={styles.ticketCompany}>
                            {metadata.companyName || 'Unknown Company'}
                          </span>
                          <span className={styles.ticketDivider}>•</span>
                          <span className={styles.ticketDate}>
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.ticketHeaderRight}>
                      <StatusBadge
                        status={getTicketStatusVariant(ticket.status)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.ticketContent}>
                      <div className={styles.ticketDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Document:</span>
                          <span className={styles.detailValue}>
                            {metadata.documentFilename || 'N/A'}
                          </span>
                        </div>

                        {metadata.reviewerName && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Reviewer:</span>
                            <span className={styles.detailValue}>
                              {metadata.reviewerName}
                              {metadata.reviewerEmail && ` (${metadata.reviewerEmail})`}
                            </span>
                          </div>
                        )}

                        {metadata.reviewerPhone && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Phone:</span>
                            <span className={styles.detailValue}>
                              {metadata.reviewerPhone}
                            </span>
                          </div>
                        )}

                        {ticket.content && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Notes:</span>
                            <span className={styles.detailValue}>
                              {ticket.content}
                            </span>
                          </div>
                        )}

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Revision ID:</span>
                          <span className={styles.detailValue}>
                            {metadata.revisionId || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {ticket.status !== 'processed' && (
                        <div className={styles.ticketActions}>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkComplete(ticket.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : '✓ Mark Complete'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Processed Tickets Section */}
      {processedTickets.length > 0 && (
        <div className={styles.processedSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Completed Support Tickets</h3>
            <span className={styles.noteCount}>
              {processedTickets.length} completed
            </span>
          </div>

          <div className={styles.processedList}>
            {processedTickets.map(ticket => {
              const metadata = ticket.metadata || {};

              return (
                <div key={ticket.id} className={styles.processedTicketCard}>
                  <div className={styles.processedTicketHeader}>
                    <span className={`${styles.revisionTypeBadge} ${styles[metadata.revisionType]}`}>
                      {metadata.revisionType?.toUpperCase() || 'REVISION'}
                    </span>
                    <span className={styles.processedTicketProject}>
                      {metadata.projectName || 'Unknown Project'}
                    </span>
                    <span className={styles.processedTicketCompany}>
                      {metadata.companyName || 'Unknown Company'}
                    </span>
                  </div>
                  <div className={styles.processedTicketMeta}>
                    <span className={styles.processedTicketDate}>
                      Completed: {formatDate(ticket.updatedAt || ticket.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Development Notes Section */}
      <div className={styles.devNotesSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Development Notes</h3>
          <span className={styles.noteCount}>
            {devNotes.length} note{devNotes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {devNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📝</span>
            <p className={styles.emptyText}>No development notes yet</p>
          </div>
        ) : (
          <div className={styles.noteList}>
            {devNotes.map(note => (
              <div key={note.id} className={styles.noteCard}>
                <div className={styles.noteHeader}>
                  <span className={styles.noteTitle}>{note.title || 'Untitled Note'}</span>
                  <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
                </div>
                {note.content && (
                  <div className={styles.noteContent}>
                    {note.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevNotesPanel;
