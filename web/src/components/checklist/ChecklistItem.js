import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { STATUS_OPTIONS, SUB_STATUS_LABELS } from '../../constants/checklistConfig';
import { Button } from '../ui';
import styles from './ChecklistPanel.module.css';

/**
 * ChecklistItem - Individual checklist item with status toggles and history
 */
const ChecklistItem = ({
  item,
  data,
  isExpanded,
  onToggle,
  onStatusChange,
  onRevisionSubmit,
  onEditTimestamp,
  onAddTask,
}) => {
  const [revisionNotes, setRevisionNotes] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const { status, subStatus, history = [], revisions = [], tasks = [] } = data;
  const hasSubStatuses = item.subStatuses && item.subStatuses.length > 0;

  // Handle main status change
  const handleStatusClick = (newStatus) => {
    if (status === newStatus) return; // Already selected
    onStatusChange(newStatus, hasSubStatuses ? item.subStatuses[0] : null);
  };

  // Handle sub-status change
  const handleSubStatusClick = (newSubStatus) => {
    onStatusChange(status, newSubStatus);
  };

  // Submit revision notes
  const handleRevisionSubmit = () => {
    if (!revisionNotes.trim()) return;
    onRevisionSubmit(revisionNotes.trim());
    setRevisionNotes('');
  };

  // Start editing a timestamp
  const startEditTimestamp = (recordIndex, timestamp) => {
    const date = new Date(timestamp);
    setEditingRecord(recordIndex);
    setEditDate(date.toISOString().split('T')[0]);
    setEditTime(date.toTimeString().slice(0, 5));
  };

  // Save edited timestamp
  const saveTimestamp = () => {
    if (editingRecord === null) return;
    const newTimestamp = new Date(`${editDate}T${editTime}`).toISOString();
    onEditTimestamp(editingRecord, newTimestamp);
    setEditingRecord(null);
    setEditDate('');
    setEditTime('');
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div className={`${styles.checklistItem} ${styles[`status_${status}`]}`}>
      {/* Item Header - Always visible */}
      <div className={styles.itemHeader} onClick={onToggle}>
        <div className={styles.itemInfo}>
          <span className={styles.itemLabel}>{item.label}</span>
          {data.updatedAt && (
            <span className={styles.lastUpdated}>
              Updated {formatTimestamp(data.updatedAt).date}
            </span>
          )}
        </div>

        <div className={styles.itemControls}>
          {/* Status Toggle Buttons */}
          <div className={styles.statusToggles}>
            {Object.entries(STATUS_OPTIONS).map(([key, option]) => {
              const IconComp = Icons[option.icon] || Icons.Circle;
              const isActive = status === key;

              return (
                <button
                  key={key}
                  className={`${styles.statusBtn} ${isActive ? styles.active : ''}`}
                  style={{
                    '--status-color': option.color,
                    backgroundColor: isActive ? option.color : undefined
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusClick(key);
                  }}
                  title={option.label}
                >
                  <IconComp size={14} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Expand/Collapse chevron */}
          <Icons.ChevronDown
            size={16}
            className={`${styles.itemChevron} ${isExpanded ? styles.rotated : ''}`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.itemContent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Sub-Status Selection (if applicable) */}
            {hasSubStatuses && (
              <div className={styles.subStatusSection}>
                <label className={styles.subStatusLabel}>Status:</label>
                <div className={styles.subStatusOptions}>
                  {item.subStatuses.map((sub) => (
                    <button
                      key={sub}
                      className={`${styles.subStatusBtn} ${subStatus === sub ? styles.active : ''}`}
                      onClick={() => handleSubStatusClick(sub)}
                    >
                      {SUB_STATUS_LABELS[sub] || sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Notes Input (when revision status is selected) */}
            {status === 'revision' && (
              <div className={styles.revisionSection}>
                <label className={styles.revisionLabel}>
                  <Icons.AlertCircle size={14} />
                  Revision Notes
                </label>
                <textarea
                  className={styles.revisionTextarea}
                  placeholder="Enter details about the change order or revision needed..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleRevisionSubmit}
                  disabled={!revisionNotes.trim()}
                >
                  Submit Revision Note
                </Button>
              </div>
            )}

            {/* History/Timeline */}
            {(history.length > 0 || revisions.length > 0) && (
              <div className={styles.historySection}>
                <h4 className={styles.historySectionTitle}>
                  <Icons.Clock size={14} />
                  History
                </h4>
                <div className={styles.historyList}>
                  {/* Combine and sort history + revisions by date */}
                  {[...history, ...revisions]
                    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                    .map((record, index) => {
                      const timestamp = record.updatedAt || record.createdAt;
                      const { date, time } = formatTimestamp(timestamp);
                      const userName = record.updatedBy?.name || record.createdBy?.name || 'Unknown';
                      const isEditing = editingRecord === index;

                      return (
                        <div key={index} className={styles.historyRecord}>
                          {record.type === 'revision_note' ? (
                            // Revision note record
                            <div className={styles.revisionRecord}>
                              <div className={styles.recordHeader}>
                                <Icons.Edit3 size={12} className={styles.recordIcon} />
                                <span className={styles.recordUser}>{userName}</span>
                                <span className={styles.recordTimestamp}>{date} at {time}</span>
                              </div>
                              <p className={styles.revisionText}>{record.notes}</p>
                            </div>
                          ) : (
                            // Status change record
                            <div className={styles.statusRecord}>
                              <div className={styles.recordHeader}>
                                <Icons.CheckCircle size={12} className={styles.recordIcon} />
                                <span className={styles.recordAction}>
                                  Marked as <strong>{record.status}</strong>
                                </span>
                                <span className={styles.recordUser}>by {userName}</span>
                              </div>

                              {isEditing ? (
                                <div className={styles.editTimestamp}>
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className={styles.dateInput}
                                  />
                                  <input
                                    type="time"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className={styles.timeInput}
                                  />
                                  <button
                                    className={styles.saveBtn}
                                    onClick={saveTimestamp}
                                  >
                                    <Icons.Check size={14} />
                                  </button>
                                  <button
                                    className={styles.cancelBtn}
                                    onClick={() => setEditingRecord(null)}
                                  >
                                    <Icons.X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.recordTimestampRow}>
                                  <span className={styles.recordTimestamp}>{date} at {time}</span>
                                  <button
                                    className={styles.editBtn}
                                    onClick={() => startEditTimestamp(index, timestamp)}
                                    title="Edit timestamp"
                                  >
                                    <Icons.Pencil size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tasks Section */}
            <div className={styles.tasksSection}>
              <div className={styles.tasksSectionHeader}>
                <h4 className={styles.tasksSectionTitle}>
                  <Icons.ListTodo size={14} />
                  Tasks
                </h4>
                <button className={styles.addTaskBtn} onClick={onAddTask}>
                  <Icons.Plus size={14} />
                  Task
                </button>
              </div>

              {tasks.length > 0 ? (
                <div className={styles.tasksList}>
                  {tasks.map((task, index) => (
                    <div key={index} className={styles.taskItem}>
                      <Icons.Circle size={12} />
                      <span>{task.title}</span>
                      {task.assignee && (
                        <span className={styles.taskAssignee}>@{task.assignee.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noTasks}>No tasks assigned</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChecklistItem;
