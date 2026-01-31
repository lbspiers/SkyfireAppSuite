import React, { useState } from 'react';
import { useAdminDrafterQueue } from '../../hooks/useAdminDrafterQueue';
import { useAdminDrafterSocket } from '../../hooks/useAdminDrafterSocket';
import AdminQueueStats from './components/admin/AdminQueueStats';
import AdminQueueList from './components/admin/AdminQueueList';
import AdminActiveAssignments from './components/admin/AdminActiveAssignments';
import AdminPendingQuestions from './components/admin/AdminPendingQuestions';
import AddToQueueModal from './components/admin/AddToQueueModal';
import styles from './AdminDrafterQueue.module.css';

const AdminDrafterQueue = () => {
  const {
    stats,
    queue,
    activeAssignments,
    pendingQuestions,
    loading,
    error,
    refresh,
    addToQueue,
    toggleUrgent,
    reorderQueue,
    removeFromQueue,
    answerQuestion
  } = useAdminDrafterQueue();

  // Socket.io integration for real-time updates
  const {
    isConnected: socketConnected,
    liveStats
  } = useAdminDrafterSocket({
    onStatsUpdate: (data) => {
      // Stats updated in real-time via liveStats
    },
    onQueueUpdated: () => {
      refresh();
    },
    onNewQuestion: () => {
      refresh();
    },
    onAssignmentUpdated: () => {
      refresh();
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // queue, assignments, questions

  // Use live stats if available, otherwise fall back to REST stats
  const displayStats = liveStats || stats;

  if (loading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading admin queue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load queue data</p>
          <button onClick={refresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Drafter Queue Management</h1>
          {socketConnected ? (
            <div className={styles.liveBadge}>
              <span className={styles.liveDot}></span>
              LIVE
            </div>
          ) : (
            <div className={styles.offlineBadge}>
              OFFLINE
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          + Add Project
        </button>
      </div>

      {/* Stats */}
      <AdminQueueStats stats={displayStats} />

      {/* Mobile Tabs */}
      <div className={styles.mobileTabs}>
        <button
          onClick={() => setActiveTab('queue')}
          className={`${styles.mobileTab} ${activeTab === 'queue' ? styles.active : ''}`}
        >
          Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`${styles.mobileTab} ${activeTab === 'assignments' ? styles.active : ''}`}
        >
          Active ({activeAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`${styles.mobileTab} ${activeTab === 'questions' ? styles.active : ''}`}
        >
          Questions ({pendingQuestions.length})
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Queue Section */}
        <div className={`${styles.section} ${activeTab === 'queue' ? styles.mobileActive : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Project Queue</h2>
            <div className={styles.sectionCount}>{queue.length} projects</div>
          </div>
          <AdminQueueList
            queue={queue}
            onToggleUrgent={toggleUrgent}
            onReorder={reorderQueue}
            onRemove={removeFromQueue}
          />
        </div>

        {/* Active Assignments Section */}
        <div className={`${styles.section} ${activeTab === 'assignments' ? styles.mobileActive : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Assignments</h2>
            <div className={styles.sectionCount}>{activeAssignments.length} in progress</div>
          </div>
          <AdminActiveAssignments assignments={activeAssignments} />
        </div>
      </div>

      {/* Pending Questions Section (Full Width) */}
      {pendingQuestions.length > 0 && (
        <div className={`${styles.questionsSection} ${activeTab === 'questions' ? styles.mobileActive : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pending Questions</h2>
            <div className={`${styles.sectionCount} ${styles.warning}`}>
              {pendingQuestions.length} awaiting response
            </div>
          </div>
          <AdminPendingQuestions
            questions={pendingQuestions}
            onAnswer={answerQuestion}
          />
        </div>
      )}

      {/* Add to Queue Modal */}
      <AddToQueueModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addToQueue}
      />
    </div>
  );
};

export default AdminDrafterQueue;
