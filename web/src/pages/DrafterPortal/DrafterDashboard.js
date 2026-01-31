import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDrafterStatus } from '../../hooks/useDrafterStatus';
import { useDrafterSocket } from '../../hooks/useDrafterSocket';
import { useDrafterKeyboardShortcuts } from '../../hooks/useDrafterKeyboardShortcuts';
import { useGamification } from '../../hooks/useGamification';
import { drafterPortalService } from '../../services/drafterPortalService';
import MetricCard from './components/MetricCard';
import StatusBanner from './components/StatusBanner';
import LevelProgressBar from './components/achievements/LevelProgressBar';
import styles from './DrafterDashboard.module.css';
import { getTimeBasedGreeting } from '../../utils/constants';

const DrafterDashboard = () => {
  const navigate = useNavigate();
  const { status, loading, error, refresh } = useDrafterStatus();
  const { levelInfo } = useGamification();
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Socket.io connection for real-time updates
  const {
    isConnected: socketConnected,
    nextJob: socketNextJob,
    markAvailable,
    connectionError
  } = useDrafterSocket({
    onJobAvailable: (job) => {
      // Refresh status when new job available
      refresh();
    },
    onJobClaimed: () => {
      // Refresh when job claimed by another drafter
      refresh();
    },
    onAchievementUnlocked: (achievement) => {
      // Refresh to update XP/level display
      refresh();
    }
  });

  // Mark as available when on dashboard and not working
  useEffect(() => {
    if (socketConnected && !status?.activeAssignment) {
      markAvailable();
    }
  }, [socketConnected, status?.activeAssignment, markAvailable]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Keyboard shortcuts
  useDrafterKeyboardShortcuts({
    onClaimProject: () => {
      const canClaim = status?.canClaimProject && !status?.activeAssignment && status?.queueCount > 0;
      if (canClaim && !showClaimModal) {
        handleClaimClick();
      }
    },
    enabled: !status?.activeAssignment // Only enable when not working
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    navigate('/login');
  };

  const handleClaimClick = () => {
    setShowClaimModal(true);
  };

  const handleClaimConfirm = async () => {
    try {
      setClaiming(true);
      const result = await drafterPortalService.claimNextProject();

      // Redirect to workspace
      navigate(`/drafter-portal/workspace/${result.assignment.uuid}`);
    } catch (err) {
      console.error('Failed to claim project:', err);
      toast.error('Failed to claim project. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
      setClaiming(false);
      setShowClaimModal(false);
    }
  };

  const handleClaimCancel = () => {
    setShowClaimModal(false);
  };

  const getCompletionRateColor = (rate) => {
    if (rate >= 98) return 'green';
    if (rate >= 95) return 'yellow';
    return 'red';
  };

  const getDrafterName = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.firstName || user.first_name || 'Drafter';
      } catch (e) {
        return 'Drafter';
      }
    }
    return 'Drafter';
  };

  if (loading && !status) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load dashboard</p>
          <button onClick={refresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = status?.metrics || {};
  const canClaim = status?.canClaimProject && !status?.activeAssignment && status?.queueCount > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{getTimeBasedGreeting(getDrafterName())}</h1>
          {levelInfo && (
            <div className={styles.levelBadge}>
              <LevelProgressBar levelInfo={levelInfo} compact />
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          {socketConnected ? (
            <div className={styles.connectionStatus}>
              <span className={styles.connectedDot}></span>
              Live
            </div>
          ) : (
            <div className={styles.connectionStatus}>
              <span className={styles.disconnectedDot}></span>
              {connectionError || 'Connecting...'}
            </div>
          )}
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {status?.drafterStatus && status.drafterStatus !== 'active' && (
        <StatusBanner
          status={status.drafterStatus}
          releasesRemaining={metrics.releasesRemaining}
        />
      )}

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label="Completion Rate"
          value={`${metrics.completionRate?.toFixed(1) || 0}%`}
          icon={<span>✓</span>}
          color={getCompletionRateColor(metrics.completionRate || 0)}
        />
        <MetricCard
          label="On-Time Rate"
          value={`${metrics.onTimeRate?.toFixed(1) || 0}%`}
          icon={<span>⏱️</span>}
          color={metrics.onTimeRate >= 95 ? 'green' : metrics.onTimeRate >= 90 ? 'yellow' : 'red'}
        />
        <MetricCard
          label="Current Streak"
          value={metrics.currentStreak || 0}
          icon={<span>🔥</span>}
          color="neutral"
        />
        <MetricCard
          label="Releases Remaining"
          value={`${metrics.releasesRemaining || 0}/2`}
          icon={<span>🎯</span>}
          color={metrics.releasesRemaining === 2 ? 'green' : metrics.releasesRemaining === 1 ? 'yellow' : 'red'}
        />
      </div>

      {/* Queue Status Card */}
      <div className={styles.queueCard}>
        <div className={styles.queueHeader}>
          <h2 className={styles.queueTitle}>Project Queue</h2>
          <div className={styles.queueCount}>
            {status?.queueCount || 0} {status?.queueCount === 1 ? 'project' : 'projects'} available
          </div>
        </div>

        {status?.activeAssignment ? (
          <div className={styles.activeAssignment}>
            <p className={styles.activeText}>You have an active project</p>
            <button
              onClick={() => navigate(`/drafter-portal/workspace/${status.activeAssignment.uuid}`)}
              className={styles.goToWorkspaceButton}
            >
              Go to Workspace
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleClaimClick}
              disabled={!canClaim}
              className={`${styles.claimButton} ${!canClaim ? styles.disabled : ''}`}
            >
              {status?.queueCount === 0 ? 'No Projects Available' : 'Assign Me Next'}
            </button>
            {canClaim && (
              <div className={styles.keyboardHint}>
                Press <kbd>Enter</kbd> to claim
              </div>
            )}
          </>
        )}
      </div>

      {/* Additional Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Completed:</span>
          <span className={styles.statValue}>{metrics.totalCompleted || 0}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg Completion Time:</span>
          <span className={styles.statValue}>
            {metrics.avgCompletionSeconds
              ? `${Math.floor(metrics.avgCompletionSeconds / 60)}m ${metrics.avgCompletionSeconds % 60}s`
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Claim Confirmation Modal */}
      {showClaimModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Ready to claim a project?</h2>
            <div className={styles.modalContent}>
              <p>You'll have 30 minutes to complete it.</p>
              <p>Timer starts immediately.</p>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleClaimCancel}
                disabled={claiming}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleClaimConfirm}
                disabled={claiming}
                className={styles.confirmButton}
              >
                {claiming ? 'Claiming...' : 'Claim Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrafterDashboard;
