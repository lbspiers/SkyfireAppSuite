import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDrafterAssignment } from '../../hooks/useDrafterAssignment';
import { useDrafterSocket } from '../../hooks/useDrafterSocket';
import { useSyncedTimer } from '../../hooks/useSyncedTimer';
import { useDrafterKeyboardShortcuts } from '../../hooks/useDrafterKeyboardShortcuts';
import CountdownTimer from './components/CountdownTimer';
import ProjectDetailsPanel from './components/ProjectDetailsPanel';
import FileUploadPanel from './components/FileUploadPanel';
import QAPanel from './components/QAPanel';
import ReleaseModal from './components/ReleaseModal';
import SubmitModal from './components/SubmitModal';
import styles from './DrafterWorkspace.module.css';

const DrafterWorkspace = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const {
    assignment,
    project,
    files,
    questions,
    loading,
    error,
    uploadFile,
    deleteFile,
    askQuestion,
    completeAssignment,
    releaseAssignment
  } = useDrafterAssignment(uuid);

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // for mobile

  // Socket.io integration
  const {
    isConnected: socketConnected,
    markBusy
  } = useDrafterSocket({
    onTimerExpired: () => {
      toast.error('⏱️ Time expired! Project returned to queue.', {
        position: 'top-center',
        autoClose: false
      });
      setTimeout(() => navigate('/drafter-portal'), 3000);
    },
    onQuestionAnswered: () => {
      // Refresh assignment to get updated questions
      window.location.reload();
    }
  });

  // Synced timer
  const {
    remainingSeconds,
    timerState,
    formattedTime,
    isExpired
  } = useSyncedTimer(assignment?.expiresAt, {
    onExpire: () => {
      toast.error('⏱️ Time expired! Project returned to queue.', {
        position: 'top-center',
        autoClose: false
      });
      setTimeout(() => navigate('/drafter-portal'), 3000);
    },
    onWarning: (minutes) => {
      toast.warning(`⏱️ Only ${minutes} minute${minutes > 1 ? 's' : ''} remaining!`, {
        position: 'top-center',
        autoClose: false,
        closeOnClick: true,
        className: 'drafter-toast-warning'
      });
    }
  });

  // Keyboard shortcuts
  useDrafterKeyboardShortcuts({
    onSubmit: () => {
      const canSubmit = files.filter(f =>
        ['site_plan_pdf', 'site_plan_dwg', 'single_line_pdf'].includes(f.fileType)
      ).length === 3;
      if (canSubmit && !showSubmitModal) {
        setShowSubmitModal(true);
      }
    },
    onRelease: () => {
      if (showReleaseModal || showSubmitModal) {
        setShowReleaseModal(false);
        setShowSubmitModal(false);
      } else {
        setShowReleaseModal(true);
      }
    },
    enabled: true
  });

  // Mark as busy when workspace loads
  useEffect(() => {
    if (assignment?.uuid && socketConnected) {
      markBusy(assignment.uuid);
    }
  }, [assignment?.uuid, socketConnected, markBusy]);

  // Check if assignment is expired or completed
  useEffect(() => {
    if (assignment?.status === 'completed' || assignment?.status === 'expired') {
      navigate('/drafter-portal');
    }
  }, [assignment, navigate]);

  const handleRelease = async (reason, notes) => {
    try {
      await releaseAssignment(reason, notes);
      setShowReleaseModal(false);
      toast.success('Project released successfully');
      navigate('/drafter-portal');
    } catch (error) {
      toast.error('Failed to release project');
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      await completeAssignment();
      toast.success('🎉 Project submitted successfully!');
      // Success handled by modal animation
      setTimeout(() => {
        navigate('/drafter-portal');
      }, 2000);
    } catch (error) {
      toast.error('Failed to submit project');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading workspace...</div>
      </div>
    );
  }

  if (error || !assignment || !project) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load assignment</p>
          <button onClick={() => navigate('/drafter-portal')} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const allRequiredFilesUploaded = files.filter(f =>
    ['site_plan_pdf', 'site_plan_dwg', 'single_line_pdf'].includes(f.fileType)
  ).length === 3;

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.projectTitle}>
            {project.address || 'Project'}
          </h1>
          {project.customerName && (
            <div className={styles.customerName}>{project.customerName}</div>
          )}
          {socketConnected && (
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              LIVE
            </div>
          )}
        </div>

        <div className={styles.headerCenter}>
          <CountdownTimer
            remainingSeconds={remainingSeconds}
            timerState={timerState}
            formattedTime={formattedTime}
            totalSeconds={assignment.timeLimitSeconds || 1800}
            showProgress={true}
          />
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={() => setShowReleaseModal(true)}
            className={styles.releaseButton}
          >
            Release Project
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={!allRequiredFilesUploaded}
            className={`${styles.submitButton} ${!allRequiredFilesUploaded ? styles.disabled : ''}`}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className={styles.keyboardHints}>
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> Submit • <kbd>Esc</kbd> Release • <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> Release with confirmation
      </div>

      {/* Mobile Tabs */}
      <div className={styles.mobileTabs}>
        <button
          onClick={() => setActiveTab('details')}
          className={`${styles.mobileTab} ${activeTab === 'details' ? styles.active : ''}`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`${styles.mobileTab} ${activeTab === 'files' ? styles.active : ''}`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`${styles.mobileTab} ${activeTab === 'qa' ? styles.active : ''}`}
        >
          Q&amp;A
        </button>
      </div>

      {/* Three-Panel Layout */}
      <div className={styles.workspace}>
        <div className={`${styles.panel} ${styles.leftPanel} ${activeTab === 'details' ? styles.mobileActive : ''}`}>
          <ProjectDetailsPanel project={project} />
        </div>

        <div className={`${styles.panel} ${styles.centerPanel} ${activeTab === 'files' ? styles.mobileActive : ''}`}>
          <FileUploadPanel
            files={files}
            onUpload={uploadFile}
            onDelete={deleteFile}
          />
        </div>

        <div className={`${styles.panel} ${styles.rightPanel} ${activeTab === 'qa' ? styles.mobileActive : ''}`}>
          <QAPanel
            questions={questions}
            onAskQuestion={askQuestion}
          />
        </div>
      </div>

      {/* Modals */}
      <ReleaseModal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        onRelease={handleRelease}
        releasesRemaining={assignment.releasesRemaining || 0}
      />

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
        files={files}
      />
    </div>
  );
};

export default DrafterWorkspace;
