import React, { useEffect, useRef, useState } from 'react';
import { safeGetJSON } from '../../utils/safeStorage';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import logger from '../../services/devLogger';
import ChatterThread from './ChatterThread';
import ChatterInput from './ChatterInput';
import ChatterSearch from './ChatterSearch';
import ChatterFilesTab from './ChatterFilesTab';
import ActivityLogTab from './ActivityLogTab';
import useChatter from '../../hooks/useChatter';
import ProjectOverviewDisplay from '../project/ProjectOverviewDisplay';
import ProjectHeader from '../common/ProjectHeader';
import { useSystemDetails } from '../../hooks';
import axios from '../../config/axios';
import ProjectPanelTabs from '../common/ProjectPanelTabs';
import { ChecklistPanel } from '../checklist';
import TasksPanel from '../tasks/TasksPanel';
import UtilityValidationModal from '../modals/UtilityValidationModal';
import { toast } from 'react-toastify';
import styles from '../../styles/Chatter.module.css';

/**
 * ChatterPanel - Main container for project communication
 *
 * @param {string} projectUuid - The project UUID (required)
 * @param {object} projectInfo - Project info for displaying context header
 * @param {boolean} isDrawer - If true, renders as slide-out drawer; if false, inline
 * @param {boolean} isInline - If true, renders inline mode with project header
 * @param {boolean} hideTabs - If true, hides internal tabs and shows only chat content
 * @param {function} onClose - Callback when drawer is closed
 * @param {function} onSwitchToNewProject - Callback to switch to New Project mode
 * @param {string} maxHeight - CSS max-height for inline mode
 * @param {string} projectName - Project name to display in header
 */
// Tab configuration for ChatterPanel
const CHATTER_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'notes', label: 'Chat' },
  { key: 'files', label: 'Files' },
  { key: 'activity', label: 'Activity' },
];

const ChatterPanel = ({
  projectUuid,
  projectInfo,
  isDrawer = false,
  isInline = false,
  onClose,
  onSwitchToNewProject,
  maxHeight = '600px',
  projectName = 'Project',
  hideTabs = false,
}) => {
  const {
    notes,
    loading,
    error,
    sendNote,
    sendReply,
    addReaction,
    updateNote,
    deleteNote,
    updateReply,
    deleteReply,
    readReceipts,
    markAsRead,
    fetchReadReceipts,
  } = useChatter(projectUuid);

  // Fetch system details for Overview tab
  const { data: systemDetails } = useSystemDetails({ projectUuid });

  // State for full project data
  const [fullProjectData, setFullProjectData] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // Get saved tab state or default to 'overview'
  const getSavedTab = () => {
    const saved = sessionStorage.getItem('chatterActiveTab');
    return saved || 'overview';
  };

  const [activeTab, setActiveTab] = useState(getSavedTab());
  const [showNewThread, setShowNewThread] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const threadListRef = useRef(null);
  const currentUser = safeGetJSON('userData', sessionStorage, {});

  // Override tab state when projectInfo.defaultTab is provided
  useEffect(() => {
    if (projectInfo?.defaultTab) {
      setActiveTab(projectInfo.defaultTab);
      sessionStorage.setItem('chatterActiveTab', projectInfo.defaultTab);
    }
  }, [projectInfo?.defaultTab]);

  // Fetch full project data for Overview tab
  const fetchProjectData = async () => {
    setLoadingProject(true);
    try {
      const userData = safeGetJSON('userData', sessionStorage, {});
      const companyId = userData?.company?.uuid;

      // Use same endpoint format as Design Portal
      const endpoint = companyId
        ? `/project/${projectUuid}?companyId=${companyId}`
        : `/project/${projectUuid}`;

      logger.log('ChatterPanel', 'Fetching project data from:', endpoint);

      const response = await axios.get(endpoint);

      // Extract project data (API returns data nested in response.data.data)
      const projectData = response.data.data || response.data;

      if (projectData) {
        logger.log('ChatterPanel', 'Project data received:', projectData);
        logger.log('ChatterPanel', 'Site data:', projectData.site);
        logger.log('ChatterPanel', 'Details data:', projectData.details);
        setFullProjectData(projectData);
      } else {
        logger.warn('ChatterPanel', 'No project data found in response');
      }
    } catch (err) {
      logger.error('ChatterPanel', 'Failed to fetch project data:', err);
      if (err.response?.data) {
        logger.error('ChatterPanel', 'Error details:', err.response.data);
      }
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    if (!projectUuid) return;
    fetchProjectData();
  }, [projectUuid]);

  // Save tab state when it changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('chatterActiveTab', tab);
  };

  // Auto-scroll to bottom when new threads arrive
  useEffect(() => {
    if (threadListRef.current) {
      threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
    }
  }, [notes]);

  const handleReply = async (threadId, content, mentions = [], attachments = []) => {
    await sendReply(threadId, content, mentions, attachments);
  };

  const handleReact = async (threadId, emoji) => {
    await addReaction(threadId, emoji);
  };

  const handleEditThread = async (threadId, content) => {
    await updateNote(threadId, content);
  };

  const handleDeleteThread = async (threadId) => {
    console.log('[ChatterPanel] handleDeleteThread called with threadId:', threadId);
    try {
      await deleteNote(threadId);
      console.log('[ChatterPanel] deleteNote completed successfully');
    } catch (error) {
      console.error('[ChatterPanel] Error in handleDeleteThread:', error);
      throw error;
    }
  };

  const handleEditReply = async (threadId, replyId, content) => {
    await updateReply(threadId, replyId, content);
  };

  const handleDeleteReply = async (threadId, replyId) => {
    await deleteReply(threadId, replyId);
  };

  // Handle utility click from overview
  const handleUtilityClick = () => {
    console.log('[ChatterPanel] Utility field clicked, opening modal');
    setShowUtilityModal(true);
  };

  // Handle utility save from modal
  const handleUtilitySave = async (selectedUtility) => {
    console.log('[ChatterPanel] Utility save requested:', selectedUtility);
    try {
      const userData = safeGetJSON('userData', sessionStorage, {});
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        toast.error('Company information not found', {
          position: 'top-center',
          autoClose: 3000
        });
        return;
      }

      const payload = {
        companyId,
        address: fullProjectData?.site?.address || '',
        city: fullProjectData?.site?.city || '',
        state: fullProjectData?.site?.state || '',
        zipCode: fullProjectData?.site?.zip_code,
        ahj: fullProjectData?.site?.ahj || '',
        utility: selectedUtility,
        apn: fullProjectData?.site?.apn || '',
        squareFootage: fullProjectData?.site?.squareFootage ? parseFloat(fullProjectData.site.squareFootage) : null
      };

      const response = await axios.put(`/project/${projectUuid}/site-info`, payload);
      toast.success('Utility saved successfully', {
        position: 'top-center',
        autoClose: 2000
      });

      // Update local projectData to reflect the change
      if (fullProjectData && fullProjectData.site) {
        fullProjectData.site.utility = selectedUtility;
      }

      // Close utility modal and refresh project data
      setShowUtilityModal(false);

      // Refresh the full project data
      fetchProjectData();

    } catch (error) {
      console.error('[UtilitySave] Error:', error);
      toast.error(`Failed to save utility: ${error.response?.data?.message || error.message}`, {
        position: 'top-center',
        autoClose: 3000
      });
    }
  };

  const renderThreads = () => {
    if (loading) {
      return (
        <>
          {[1, 2, 3].map(i => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonMessage}`} />
          ))}
        </>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <div className={styles.emptyStateTitle}>Error loading threads</div>
          <div className={styles.emptyStateText}>{error}</div>
        </div>
      );
    }

    if (notes.length === 0 && !showNewThread) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>💬</div>
          <div className={styles.emptyStateTitle}>No chats yet</div>
          <div className={styles.emptyStateText}>
            Start a conversation with your team
          </div>
          <button
            className={styles.startThreadBtn}
            onClick={() => setShowNewThread(true)}
          >
            + Start New Chat
          </button>
        </div>
      );
    }

    return notes.map((thread) => (
      <motion.div
        key={thread.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChatterThread
          thread={thread}
          // onReact={handleReact} // Temporarily disabled
          onReply={handleReply}
          onEditThread={handleEditThread}
          onDeleteThread={handleDeleteThread}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
          currentUserUuid={currentUser.uuid}
          projectUuid={projectUuid}
          readReceipts={readReceipts[thread.id]}
          fetchReadReceipts={fetchReadReceipts}
          markAsRead={markAsRead}
        />
      </motion.div>
    ));
  };

  const panelContent = (
    <>
      {/* Drawer Header */}
      {isDrawer && (
        <div className={styles.chatterHeader}>
          <div className={styles.chatterTitle}>
            💬 {projectName} Chatter
          </div>
          <button className={styles.chatterCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>
      )}

      {/* Unified Tab Panel - Uses shared ProjectPanelTabs component */}
      {isInline && !hideTabs && (
        <ProjectPanelTabs
          tabs={CHATTER_TABS}
          selectedTab={activeTab}
          onTabChange={handleTabChange}
        >
          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <div className={styles.overviewTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              {loadingProject ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>⏳</div>
                  <div className={styles.emptyStateTitle}>Loading Overview...</div>
                  <div className={styles.emptyStateText}>
                    Fetching project data
                  </div>
                </div>
              ) : fullProjectData ? (
                <ProjectOverviewDisplay
                  projectData={fullProjectData}
                  systemDetails={systemDetails}
                  onUtilityClick={handleUtilityClick}
                />
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📊</div>
                  <div className={styles.emptyStateTitle}>No Data Available</div>
                  <div className={styles.emptyStateText}>
                    Unable to load project data
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'checklist' ? (
            <div className={styles.checklistTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              <ChecklistPanel
                projectUuid={projectUuid}
                compact={true}
              />
            </div>
          ) : activeTab === 'tasks' ? (
            <div className={styles.tasksTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              <TasksPanel
                projectUuid={projectUuid}
                compact={true}
              />
            </div>
          ) : activeTab === 'notes' ? (
            <div className={styles.notesTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              {/* Search Component */}
              {showSearch && (
                <ChatterSearch
                  projectUuid={projectUuid}
                  onResultClick={(threadUuid) => {
                    setShowSearch(false);
                    // Scroll to thread and highlight it
                    const threadElement = document.getElementById(`thread-${threadUuid}`);
                    if (threadElement) {
                      threadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      threadElement.classList.add(styles.highlightThread);
                      setTimeout(() => threadElement.classList.remove(styles.highlightThread), 2000);
                    }
                  }}
                  onClose={() => setShowSearch(false)}
                />
              )}

              {/* Thread List */}
              <div
                ref={threadListRef}
                className={styles.threadList}
                style={!isDrawer ? { maxHeight: isInline ? 'calc(100vh - 240px)' : maxHeight } : undefined}
              >
                {renderThreads()}
              </div>

              {/* Chat Footer with New Chat Button or Input */}
              <div className={styles.chatFooter}>
                {showNewThread ? (
                  <div className={styles.newThreadContainer}>
                    <ChatterInput
                      projectUuid={projectUuid}
                      onSend={async (content, mentions, attachments) => {
                        try {
                          await sendNote(content, mentions, attachments);
                          setShowNewThread(false);
                        } catch (error) {
                          logger.error('Chatter', 'Failed to create chat:', error);
                        }
                      }}
                      onCancel={() => setShowNewThread(false)}
                      placeholder="Write your message... (@ to mention someone)"
                    />
                  </div>
                ) : notes.length > 0 ? (
                  <div className={styles.chatFooterActions}>
                    <button
                      className={styles.chatterToolBtn}
                      onClick={() => setShowSearch(!showSearch)}
                      title="Search messages"
                    >
                      <Search size={18} />
                    </button>
                    <button
                      className={styles.floatingNewThreadBtn}
                      onClick={() => setShowNewThread(true)}
                      title="Start new chat"
                    >
                      + Chat
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : activeTab === 'files' ? (
            <div className={styles.filesTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              <ChatterFilesTab
                projectUuid={projectUuid}
                onNavigateToThread={(threadUuid) => {
                  // Switch to notes tab and scroll to thread
                  handleTabChange('notes');
                  setTimeout(() => {
                    const threadElement = document.getElementById(`thread-${threadUuid}`);
                    if (threadElement) {
                      threadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      threadElement.classList.add(styles.highlightThread);
                      setTimeout(() => threadElement.classList.remove(styles.highlightThread), 2000);
                    }
                  }, 100);
                }}
              />
            </div>
          ) : activeTab === 'activity' ? (
            <div className={styles.activityTabContent}>
              {/* Project Header */}
              {fullProjectData && <ProjectHeader projectData={fullProjectData} />}

              <ActivityLogTab projectUuid={projectUuid} />
            </div>
          ) : null}
        </ProjectPanelTabs>
      )}

      {/* Render just chat content when hideTabs is true */}
      {isInline && hideTabs && (
        <div className={styles.notesTabContent}>
          {/* Search Component */}
          {showSearch && (
            <ChatterSearch
              projectUuid={projectUuid}
              onResultClick={(threadUuid) => {
                setShowSearch(false);
                // Scroll to thread and highlight it
                const threadElement = document.getElementById(`thread-${threadUuid}`);
                if (threadElement) {
                  threadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  threadElement.classList.add(styles.highlightThread);
                  setTimeout(() => threadElement.classList.remove(styles.highlightThread), 2000);
                }
              }}
              onClose={() => setShowSearch(false)}
            />
          )}

          {/* Thread List */}
          <div
            ref={threadListRef}
            className={styles.threadList}
          >
            {renderThreads()}
          </div>

          {/* Chat Footer with New Chat Button or Input */}
          <div className={styles.chatFooter}>
            {showNewThread ? (
              <div className={styles.newThreadContainer}>
                <ChatterInput
                  projectUuid={projectUuid}
                  onSend={async (content, mentions, attachments) => {
                    try {
                      await sendNote(content, mentions, attachments);
                      setShowNewThread(false);
                    } catch (error) {
                      logger.error('Chatter', 'Failed to create chat:', error);
                    }
                  }}
                  onCancel={() => setShowNewThread(false)}
                  placeholder="Write your message... (@ to mention someone)"
                />
              </div>
            ) : notes.length > 0 ? (
              <div className={styles.chatFooterActions}>
                <button
                  className={styles.chatterToolBtn}
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search messages"
                >
                  <Search size={18} />
                </button>
                <button
                  className={styles.floatingNewThreadBtn}
                  onClick={() => setShowNewThread(true)}
                  title="Start new chat"
                >
                  + Chat
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Utility Validation Modal */}
      <UtilityValidationModal
        isOpen={showUtilityModal}
        onClose={() => setShowUtilityModal(false)}
        onSave={handleUtilitySave}
        zipCode={fullProjectData?.site?.zip_code}
        projectUuid={projectUuid}
      />
    </>
  );

  if (isDrawer) {
    return (
      <>
        {/* Overlay */}
        {onClose && (
          <motion.div
            className={`${styles.chatterOverlay} ${styles.chatterOverlayVisible}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div className={`${styles.chatterDrawer} ${styles.chatterDrawerOpen}`}>
          {panelContent}
        </div>
      </>
    );
  }

  // Inline mode
  return (
    <div className={styles.chatterInline}>
      {panelContent}
    </div>
  );
};

export default ChatterPanel;
