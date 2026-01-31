import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Circle, Clock, AlertCircle, Plus,
  Calendar, User, Filter,
  Trash2, Edit2, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as taskService from '../../services/taskService';
import TaskModal from '../checklist/TaskModal';
import { toast } from 'react-toastify';
import styles from './TasksPanel.module.css';

/**
 * TasksPanel - Task list with subtabs for assigned tasks
 *
 * Props:
 * - projectUuid: string (optional - if provided, shows project-specific tasks)
 * - compact: boolean (for sidebar display)
 */
const TasksPanel = ({ projectUuid = null, compact = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assigned_to_me');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const tabs = [
    { id: 'assigned_to_me', label: 'Assigned to Me', icon: User },
    { id: 'assigned_by_me', label: "Tasks I've Assigned", icon: ExternalLink },
  ];

  const statusOptions = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      const status = statusFilter === 'all' ? null : statusFilter;

      if (projectUuid) {
        response = await taskService.getProjectTasks(projectUuid);
      } else if (activeTab === 'assigned_to_me') {
        response = await taskService.getMyTasks(status);
      } else {
        response = await taskService.getTasksIAssigned(status);
      }

      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, projectUuid]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await taskService.createTask({
        ...taskData,
        projectUuid: projectUuid
      });
      setShowTaskModal(false);
      toast.success('Task created');
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className={styles.statusComplete} />;
      case 'in_progress': return <Clock size={16} className={styles.statusProgress} />;
      case 'overdue': return <AlertCircle size={16} className={styles.statusOverdue} />;
      default: return <Circle size={16} className={styles.statusPending} />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent': return styles.priorityUrgent;
      case 'high': return styles.priorityHigh;
      case 'low': return styles.priorityLow;
      default: return styles.priorityNormal;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, overdue: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', soon: true };
    if (diffDays <= 7) return { text: `Due in ${diffDays}d`, soon: true };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  };

  const navigateToProject = (task) => {
    if (task.projectUuid) {
      navigate(`/project/${task.projectUuid}`);
    }
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Tasks</h3>
        <button className={styles.addButton} onClick={() => setShowTaskModal(true)}>
          <Plus size={16} />
          {!compact && <span>New Task</span>}
        </button>
      </div>

      {/* Subtabs */}
      {!projectUuid && (
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div className={styles.filters}>
        <Filter size={14} className={styles.filterIcon} />
        {statusOptions.map(option => (
          <button
            key={option.id}
            className={`${styles.filterChip} ${statusFilter === option.id ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className={styles.taskList}>
        {loading ? (
          <div className={styles.loading}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle size={32} className={styles.emptyIcon} />
            <p>No tasks found</p>
            <button className={styles.emptyButton} onClick={() => setShowTaskModal(true)}>
              Create your first task
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {tasks.map(task => {
              const dueInfo = formatDate(task.dueDate);

              return (
                <motion.div
                  key={task.id}
                  className={styles.taskItem}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  layout
                >
                  {/* Status Toggle */}
                  <button
                    className={styles.statusToggle}
                    onClick={() => handleStatusChange(
                      task.id,
                      task.status === 'completed' ? 'pending' : 'completed'
                    )}
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  {/* Task Content */}
                  <div className={styles.taskContent}>
                    <div className={styles.taskHeader}>
                      <span className={`${styles.taskTitle} ${task.status === 'completed' ? styles.completed : ''}`}>
                        {task.title}
                      </span>
                      <span className={`${styles.priority} ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className={styles.taskDescription}>{task.description}</p>
                    )}

                    <div className={styles.taskMeta}>
                      {/* Project Link */}
                      {task.projectName && (
                        <button
                          className={styles.projectLink}
                          onClick={() => navigateToProject(task)}
                        >
                          {task.projectName}
                        </button>
                      )}

                      {/* Assignee */}
                      {activeTab === 'assigned_by_me' && task.assignee && (
                        <span className={styles.assignee}>
                          <User size={12} />
                          {task.assignee.name}
                        </span>
                      )}

                      {/* Due Date */}
                      {dueInfo && (
                        <span className={`${styles.dueDate} ${dueInfo.overdue ? styles.overdue : ''} ${dueInfo.urgent ? styles.urgent : ''}`}>
                          <Calendar size={12} />
                          {dueInfo.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.taskActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSubmit={handleCreateTask}
          projectUuid={projectUuid}
          editTask={editingTask}
        />
      )}
    </div>
  );
};

export default TasksPanel;
