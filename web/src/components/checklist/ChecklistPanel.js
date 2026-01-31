import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { toast } from 'react-toastify';
import { CHECKLIST_CONFIG, STATUS_OPTIONS, SUB_STATUS_LABELS } from '../../constants/checklistConfig';
import ChecklistItem from './ChecklistItem';
import TaskModal from './TaskModal';
import axiosInstance from '../../api/axiosInstance';
import logger from '../../services/devLogger';
import styles from './ChecklistPanel.module.css';

/**
 * ChecklistPanel - Main container for project workflow checklist
 *
 * @param {string} projectUuid - Project UUID
 * @param {boolean} compact - Compact mode for sidebar display
 */
const ChecklistPanel = ({ projectUuid, compact = false }) => {
  const [checklistData, setChecklistData] = useState({});
  const [expandedSections, setExpandedSections] = useState(['sales']); // Start with Sales expanded
  const [expandedItems, setExpandedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskContext, setTaskContext] = useState(null); // { sectionId, itemId }

  // Fetch checklist data
  useEffect(() => {
    const fetchChecklistData = async () => {
      if (!projectUuid) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/checklist/project/${projectUuid}`);
        if (response.data?.data) {
          setChecklistData(response.data.data);
        }
      } catch (error) {
        logger.error('ChecklistPanel', 'Failed to fetch checklist:', error);
        // Initialize with empty data structure
        setChecklistData({});
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistData();
  }, [projectUuid]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Toggle item expansion
  const toggleItem = (itemId) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Update item status
  const updateItemStatus = async (sectionId, itemId, status, subStatus = null) => {
    const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const timestamp = new Date().toISOString();

    const updateData = {
      status,
      subStatus,
      updatedAt: timestamp,
      updatedBy: {
        uuid: currentUser.uuid,
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Unknown',
      }
    };

    // Optimistic update
    setChecklistData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: {
          ...prev[sectionId]?.[itemId],
          ...updateData,
          history: [
            ...(prev[sectionId]?.[itemId]?.history || []),
            { ...updateData, action: 'status_change' }
          ]
        }
      }
    }));

    try {
      await axiosInstance.put(`/checklist/project/${projectUuid}/${sectionId}/${itemId}`, updateData);
      toast.success('Status updated');
    } catch (error) {
      logger.error('ChecklistPanel', 'Failed to update status:', error);
      toast.error('Failed to update status');
      // Revert on error - refetch data
    }

    // If revision selected, expand the item to show notes
    if (status === 'revision') {
      setExpandedItems(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
    }
  };

  // Submit revision notes
  const submitRevisionNotes = async (sectionId, itemId, notes) => {
    const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const timestamp = new Date().toISOString();

    const revisionRecord = {
      type: 'revision_note',
      notes,
      createdAt: timestamp,
      createdBy: {
        uuid: currentUser.uuid,
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Unknown',
      }
    };

    // Optimistic update
    setChecklistData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: {
          ...prev[sectionId]?.[itemId],
          revisions: [
            ...(prev[sectionId]?.[itemId]?.revisions || []),
            revisionRecord
          ]
        }
      }
    }));

    try {
      await axiosInstance.post(`/checklist/project/${projectUuid}/${sectionId}/${itemId}/revision`, {
        notes
      });
      toast.success('Revision notes saved');
    } catch (error) {
      logger.error('ChecklistPanel', 'Failed to save revision:', error);
      toast.error('Failed to save revision notes');
    }
  };

  // Edit timestamp record
  const editTimestamp = async (sectionId, itemId, recordIndex, newTimestamp) => {
    try {
      await axiosInstance.put(`/checklist/project/${projectUuid}/${sectionId}/${itemId}/history/${recordIndex}`, {
        timestamp: newTimestamp
      });

      // Update local state
      setChecklistData(prev => {
        const history = [...(prev[sectionId]?.[itemId]?.history || [])];
        if (history[recordIndex]) {
          history[recordIndex] = { ...history[recordIndex], updatedAt: newTimestamp };
        }
        return {
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            [itemId]: {
              ...prev[sectionId]?.[itemId],
              history
            }
          }
        };
      });

      toast.success('Timestamp updated');
    } catch (error) {
      logger.error('ChecklistPanel', 'Failed to update timestamp:', error);
      toast.error('Failed to update timestamp');
    }
  };

  // Open task modal
  const openTaskModal = (sectionId, itemId) => {
    setTaskContext({ sectionId, itemId });
    setTaskModalOpen(true);
  };

  // Create task
  const createTask = async (taskData) => {
    if (!taskContext) return;

    const { sectionId, itemId } = taskContext;
    const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

    try {
      await axiosInstance.post(`/checklist/project/${projectUuid}/${sectionId}/${itemId}/tasks`, {
        ...taskData,
        createdBy: currentUser.uuid
      });

      toast.success('Task created');
      setTaskModalOpen(false);
      setTaskContext(null);
    } catch (error) {
      logger.error('ChecklistPanel', 'Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  // Get item data helper
  const getItemData = (sectionId, itemId) => {
    return checklistData[sectionId]?.[itemId] || {
      status: 'pending',
      subStatus: null,
      history: [],
      revisions: [],
      tasks: []
    };
  };

  if (loading) {
    return (
      <div className={styles.checklistPanel}>
        <div className={styles.loadingState}>
          <Icons.Loader className={styles.spinner} size={24} />
          <span>Loading checklist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.checklistPanel} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      {!compact && (
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Icons.CheckSquare size={20} />
            Project Checklist
          </h2>
        </div>
      )}

      {/* Sections */}
      <div className={styles.sectionsContainer}>
        {CHECKLIST_CONFIG.map((section) => {
          const IconComponent = Icons[section.icon] || Icons.Folder;
          const isExpanded = expandedSections.includes(section.id);

          // Calculate section progress
          const sectionItems = section.items;
          const completedCount = sectionItems.filter(item =>
            getItemData(section.id, item.id).status === 'complete'
          ).length;
          const progress = sectionItems.length > 0
            ? Math.round((completedCount / sectionItems.length) * 100)
            : 0;

          return (
            <div key={section.id} className={styles.section}>
              {/* Section Header */}
              <button
                className={`${styles.sectionHeader} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <div className={styles.sectionInfo}>
                  <IconComponent size={18} className={styles.sectionIcon} />
                  <span className={styles.sectionLabel}>{section.label}</span>
                </div>

                <div className={styles.sectionMeta}>
                  <div className={styles.progressBadge}>
                    <span>{completedCount}/{sectionItems.length}</span>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <Icons.ChevronDown
                    size={18}
                    className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
                  />
                </div>
              </button>

              {/* Section Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className={styles.sectionContent}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {section.items.map((item) => {
                      const itemData = getItemData(section.id, item.id);
                      const isItemExpanded = expandedItems.includes(item.id);

                      return (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          data={itemData}
                          isExpanded={isItemExpanded}
                          onToggle={() => toggleItem(item.id)}
                          onStatusChange={(status, subStatus) =>
                            updateItemStatus(section.id, item.id, status, subStatus)
                          }
                          onRevisionSubmit={(notes) =>
                            submitRevisionNotes(section.id, item.id, notes)
                          }
                          onEditTimestamp={(recordIndex, newTimestamp) =>
                            editTimestamp(section.id, item.id, recordIndex, newTimestamp)
                          }
                          onAddTask={() => openTaskModal(section.id, item.id)}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskContext(null);
        }}
        onSubmit={createTask}
        projectUuid={projectUuid}
      />
    </div>
  );
};

export default ChecklistPanel;
