import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { Pause, Play, FileText, X, Copy, Trash2, Timer, RotateCcw, Upload, ArrowLeft, Brain } from 'lucide-react';
import {
  DEV_CATEGORIES,
  DEV_PRIORITIES,
  DEV_STATUSES,
  DEV_USERS,
  DEV_TIME_SCALES,
  DEV_STORAGE_KEY,
} from '../../constants/devPortalConstants';
import {
  getTasks,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
  bulkImportTasks,
  startTasks,
  getAverages,
  resetTimer as resetTimerAPI,
} from '../../services/devTaskService';
import {
  getNotes,
  createNote as createNoteAPI,
  updateNote as updateNoteAPI,
  deleteNote as deleteNoteAPI,
  sendNote as sendNoteAPI,
} from '../../services/devNoteService';
import AnalyticsTab from './AnalyticsTab';
import EquipmentReviewPanel from './EquipmentReviewPanel';
import CSVUploadModal from './CSVUploadModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { FEATURE_FLAGS, getAllFlags, toggleFeature } from '../../constants/featureFlags';
import Toggle from '../ui/Toggle';
import styles from './DevPortal.module.css';

const DevPortal = () => {
  const navigate = useNavigate();

  // Format category names to Title Case
  const formatCategoryName = (category) => {
    if (!category) return category;
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [currentUser, setCurrentUser] = useState(DEV_USERS[0]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, analytics, equipment-review, flags
  const [flagState, setFlagState] = useState(() => getAllFlags());
  const [view, setView] = useState('list'); // list, kanban, history
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [commandInput, setCommandInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSprint, setFilterSprint] = useState('all');
  const [historyTimeScale, setHistoryTimeScale] = useState('week');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [sortBy, setSortBy] = useState('date'); // date, priority, category
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [groupBy, setGroupBy] = useState(null); // null, sprint, category, priority
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPaused, setShowPaused] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [expandedParentTasks, setExpandedParentTasks] = useState(new Set()); // Track which parent tasks are expanded to show subtasks
  const [averages, setAverages] = useState(null); // Historical averages for auto-estimates
  const [inlineAddParentId, setInlineAddParentId] = useState(null); // Track which parent has inline subtask form open

  // Notes panel state
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [notesView, setNotesView] = useState('edit'); // 'edit' or 'list'
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSendingNote, setIsSendingNote] = useState(false);
  const [isNoteInputFocused, setIsNoteInputFocused] = useState(false); // Disable shortcuts when typing in notes

  // CSV Upload and Timer Reset state
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(null); // taskId to reset

  const commandInputRef = useRef(null);
  const taskModalRef = useRef(null);

  // Load tasks and averages from API on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const response = await getTasks();
        if (response.status === 'SUCCESS') {
          setTasks(response.data || []);
        } else {
          // Fallback to localStorage silently
          const stored = localStorage.getItem(DEV_STORAGE_KEY);
          if (stored) {
            try {
              setTasks(JSON.parse(stored));
            } catch (e) {
              console.error('Failed to parse stored tasks:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        // Fallback to localStorage silently (backend may not be ready yet)
        const stored = localStorage.getItem(DEV_STORAGE_KEY);
        if (stored) {
          try {
            setTasks(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse stored tasks:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    const loadAverages = async () => {
      try {
        const response = await getAverages();
        if (response.status === 'SUCCESS') {
          setAverages(response.data);
        }
      } catch (error) {
        console.error('Failed to load averages:', error);
      }
    };

    loadTasks();
    loadAverages();
  }, []);

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await getNotes();
        console.log('[DevPortal] Notes loaded:', response);
        if (response.status === 'SUCCESS') {
          console.log('[DevPortal] Number of notes:', response.data?.length);
          console.log('[DevPortal] Notes:', response.data);
          const loadedNotes = response.data || [];
          setNotes(loadedNotes);

          // Auto-select the most recent draft note if no note is selected
          if (!selectedNoteId && loadedNotes.length > 0) {
            const mostRecentDraft = loadedNotes
              .filter(n => n.status === 'draft')
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

            if (mostRecentDraft) {
              setSelectedNoteId(mostRecentDraft.id);
              setNoteContent(mostRecentDraft.content);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };

    loadNotes();
  }, []);

  // Live elapsed time updates for in-progress tasks
  useEffect(() => {
    const hasInProgressTasks = tasks.some(t => t.status === 'in_progress' && t.startedAt);

    if (!hasInProgressTasks) return;

    // Force re-render every second to update elapsed time display
    const interval = setInterval(() => {
      // Trigger a minimal state update to force re-render
      setTasks(prevTasks => [...prevTasks]);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Socket.io listener for real-time task updates
  useEffect(() => {
    const socket = io('https://api.skyfireapp.io', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      autoConnect: true,
    });

    let errorLogged = false;

    socket.on('connect', () => {
      errorLogged = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('[DevPortal] Socket connected');
      }
    });

    socket.on('dev-tasks:updated', async (data) => {
      // Silently refresh task list (no toast notifications for rapid bug collection)
      try {
        const response = await getTasks();
        if (response.status === 'SUCCESS') {
          setTasks(response.data || []);
        }
      } catch (error) {
        console.error('Failed to refresh tasks:', error);
      }
    });

    socket.on('dev-notes:updated', async (data) => {
      // Silently refresh notes list when new notes are created/sent
      console.log('[DevPortal] dev-notes:updated event received:', data);
      try {
        const response = await getNotes();
        console.log('[DevPortal] Refreshed notes after socket event:', response);
        if (response.status === 'SUCCESS') {
          setNotes(response.data || []);
        }
      } catch (error) {
        console.error('Failed to refresh notes:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DevPortal] Socket disconnected:', reason);
      }
    });

    socket.on('connect_error', (error) => {
      if (!errorLogged) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DevPortal] Socket connection failed, will retry silently');
        }
        errorLogged = true;
      }
    });

    return () => {
      socket.off('dev-tasks:updated');
      socket.off('dev-notes:updated');
      socket.disconnect();
    };
  }, []);

  // No longer using localStorage for primary storage - API is source of truth

  // Subtask Helper Functions
  const getSubtasks = useCallback((parentId) => {
    return tasks
      .filter(t => t.parentId === parentId)
      .sort((a, b) => (a.subtaskOrder || 0) - (b.subtaskOrder || 0));
  }, [tasks]);

  const getParentTask = useCallback((subtaskId) => {
    const subtask = tasks.find(t => t.id === subtaskId);
    if (!subtask?.parentId) return null;
    return tasks.find(t => t.id === subtask.parentId);
  }, [tasks]);

  const hasSubtasks = useCallback((taskId) => {
    return tasks.some(t => t.parentId === taskId);
  }, [tasks]);

  const getSubtaskProgress = useCallback((parentId) => {
    const subtasks = getSubtasks(parentId);
    if (subtasks.length === 0) return null;
    const completed = subtasks.filter(t => t.status === 'complete').length;
    return {
      total: subtasks.length,
      completed,
      percentage: Math.round((completed / subtasks.length) * 100)
    };
  }, [getSubtasks]);

  // Calculate total time for parent including subtasks
  const getParentTotalTime = useCallback((parentId) => {
    const parent = tasks.find(t => t.id === parentId);
    const subtasks = getSubtasks(parentId);

    const parentTime = parent?.workDurationMinutes || 0;
    const subtaskTime = subtasks.reduce((sum, s) => sum + (s.workDurationMinutes || 0), 0);

    return {
      total: parentTime + subtaskTime,
      parentTime,
      subtaskTime,
      hasSubtasks: subtasks.length > 0
    };
  }, [tasks, getSubtasks]);

  const getParentTasks = useCallback(() => {
    return tasks.filter(t => !t.isSubtask && !t.parentId);
  }, [tasks]);

  const toggleParentTaskExpansion = useCallback((taskId) => {
    setExpandedParentTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Sort tasks helper
  const sortTasks = useCallback((tasksToSort) => {
    const sorted = [...tasksToSort];

    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 3, high: 2, low: 1 };
        comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortBy === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else {
        // Default: sort by date (createdAt or completedAt)
        const aDate = new Date(a.completedAt || a.createdAt || 0);
        const bDate = new Date(b.completedAt || b.createdAt || 0);
        comparison = bDate - aDate;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return sorted;
  }, [sortBy, sortOrder]);

  // Filtering functions - defined early so they can be used in selection functions
  const getFilteredTasks = useCallback(() => {
    // Helper to check if a task matches filters (excluding parent/child logic)
    const matchesFilters = (task) => {
      if (filterCategory !== 'all' && task.category !== filterCategory) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterSprint !== 'all' && task.sprint !== filterSprint) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    };

    const matchingTaskIds = new Set();

    // First pass: find all matching tasks
    tasks.forEach(task => {
      if (matchesFilters(task)) {
        matchingTaskIds.add(task.id);
        // If subtask matches, include parent
        if (task.parentId) {
          matchingTaskIds.add(task.parentId);
        }
      }
    });

    // Second pass: include all subtasks of matching parents
    tasks.forEach(task => {
      if (task.parentId && matchingTaskIds.has(task.parentId)) {
        matchingTaskIds.add(task.id);
      }
    });

    // Filter to only parent tasks (subtasks will be shown via their parent)
    const filtered = tasks.filter(t => !t.parentId && matchingTaskIds.has(t.id));

    return sortTasks(filtered);
  }, [tasks, filterCategory, filterPriority, filterStatus, filterSprint, searchQuery, sortTasks]);

  // Grouped tasks logic - only groups parent tasks, subtasks stay with their parent
  const groupedTasks = useMemo(() => {
    if (!groupBy) return null;

    // getFilteredTasks only returns parent tasks, subtasks will render under their parents
    const filtered = getFilteredTasks();
    const activeTasks = filtered.filter(t => t.status !== 'complete' && t.status !== 'paused');

    const groups = {};
    activeTasks.forEach(task => {
      const key = task[groupBy] || `No ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      if (a.startsWith('No ')) return 1;
      if (b.startsWith('No ')) return -1;
      return a.localeCompare(b);
    });
  }, [groupBy, getFilteredTasks]);

  // Selection functions - defined early so keyboard shortcuts can use them
  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    const filteredTasks = getFilteredTasks();
    const visibleIds = filteredTasks.map(t => t.id);
    setSelectedTasks(new Set(visibleIds));
  }, [getFilteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const copyTasks = useCallback(async () => {
    if (selectedTasks.size === 0) {
      toast.warning('No tasks selected');
      return;
    }

    const selected = tasks.filter(t => selectedTasks.has(t.id));

    // Format for Claude prompt
    const formatted = selected.map(task => {
      const priorityIcon = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '⚪';
      return `${priorityIcon} **${task.title}** [${task.category}] (${task.priority})
   ${task.description || 'No description'}
   Status: ${task.status}`;
    }).join('\n\n');

    const header = `## Selected Tasks (${selected.length})\n\n`;
    const clipboardText = header + formatted;

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(clipboardText);
      toast.success(`Copied ${selected.length} tasks to clipboard`);
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy tasks');
    }
  }, [selectedTasks, tasks]);

  const copyAndStartTasks = useCallback(async () => {
    if (selectedTasks.size === 0) {
      toast.warning('No tasks selected');
      return;
    }

    const selected = tasks.filter(t => selectedTasks.has(t.id));

    // Format for Claude prompt
    const formatted = selected.map(task => {
      const priorityIcon = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '⚪';
      return `${priorityIcon} **${task.title}** [${task.category}] (${task.priority})
   ${task.description || 'No description'}
   Status: ${task.status}`;
    }).join('\n\n');

    const header = `## Selected Tasks (${selected.length})\n\n`;
    const clipboardText = header + formatted;

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(clipboardText);

      // Start the tasks (set to in_progress with started_at timestamp)
      const pendingTaskIds = selected
        .filter(t => t.status === 'pending')
        .map(t => t.id);

      if (pendingTaskIds.length > 0) {
        const response = await startTasks(pendingTaskIds);
        if (response.status === 'SUCCESS') {
          setTasks(response.data);
        }
      }

      toast.success(`Copied ${selected.length} tasks & started ${pendingTaskIds.length}`);
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to copy & start:', err);
      toast.error('Failed to copy & start tasks');
    }
  }, [selectedTasks, tasks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip all shortcuts when typing in notes textarea
      if (isNoteInputFocused) return;

      // Ctrl+1 - Switch to Tasks tab
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('tasks');
        return;
      }

      // Ctrl+2 - Switch to Analytics tab
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('analytics');
        return;
      }

      // Ctrl+Shift+C - Copy & Start selected tasks
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyAndStartTasks();
        return;
      }

      // Ctrl+A - Select all visible (only in list view)
      if (e.ctrlKey && e.key === 'a' && view === 'list' && !showCommandPalette && !showTaskModal) {
        e.preventDefault();
        selectAllVisible();
        return;
      }

      // Escape - Collapse expanded row, clear selection, or close modals
      if (e.key === 'Escape') {
        if (expandedTaskId) {
          setExpandedTaskId(null);
          return;
        }
        if (selectedTasks.size > 0) {
          clearSelection();
          return;
        }
        setShowCommandPalette(false);
        setShowTaskModal(false);
        setEditingTask(null);
        return;
      }

      // Ctrl+K - Command palette
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // N - New task - REMOVED (interferes with typing in notes)
      // if (e.key === 'n' && !showCommandPalette && !showTaskModal && activeTab === 'tasks') {
      //   e.preventDefault();
      //   openNewTaskModal();
      //   return;
      // }

      // Shift+Enter - Add subtask to first selected parent task
      if (e.shiftKey && e.key === 'Enter' && !showCommandPalette && !showTaskModal && activeTab === 'tasks' && selectedTasks.size > 0) {
        e.preventDefault();
        const firstSelectedId = Array.from(selectedTasks)[0];
        const parentTask = tasks.find(t => t.id === firstSelectedId && !t.parentId);
        if (parentTask) {
          openNewTaskModal(firstSelectedId);
        }
        return;
      }

      // E or → - Expand subtasks of first selected parent task
      if ((e.key === 'e' || e.key === 'ArrowRight') && !showCommandPalette && !showTaskModal && activeTab === 'tasks' && selectedTasks.size > 0) {
        e.preventDefault();
        const firstSelectedId = Array.from(selectedTasks)[0];
        const parentTask = tasks.find(t => t.id === firstSelectedId && !t.parentId);
        if (parentTask && hasSubtasks(firstSelectedId)) {
          setExpandedParentTasks(prev => new Set([...prev, firstSelectedId]));
        }
        return;
      }

      // C or ← - Collapse subtasks of first selected parent task
      if ((e.key === 'c' || e.key === 'ArrowLeft') && !showCommandPalette && !showTaskModal && activeTab === 'tasks' && selectedTasks.size > 0) {
        e.preventDefault();
        const firstSelectedId = Array.from(selectedTasks)[0];
        setExpandedParentTasks(prev => {
          const next = new Set(prev);
          next.delete(firstSelectedId);
          return next;
        });
        return;
      }

      // S - Cycle sort by - REMOVED (interferes with typing in notes)
      // if (e.key === 's' && !e.shiftKey && !showCommandPalette && !showTaskModal && activeTab === 'tasks') {
      //   e.preventDefault();
      //   const sortOptions = ['date', 'priority', 'category'];
      //   const currentIndex = sortOptions.indexOf(sortBy);
      //   const nextIndex = (currentIndex + 1) % sortOptions.length;
      //   setSortBy(sortOptions[nextIndex]);
      //   return;
      // }

      // Shift+S - Toggle sort order (only if no modal open and in tasks tab)
      if (e.shiftKey && e.key === 'S' && !showCommandPalette && !showTaskModal && activeTab === 'tasks') {
        e.preventDefault();
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        return;
      }

      // 1, 2, 3 - Switch views (only if no modal open and in tasks tab)
      if (!showCommandPalette && !showTaskModal && activeTab === 'tasks') {
        if (e.key === '1') setView('list');
        if (e.key === '2') setView('kanban');
        if (e.key === '3') setView('history');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showTaskModal, selectedTasks, view, expandedTaskId, sortBy, sortOrder, activeTab, copyAndStartTasks, selectAllVisible, clearSelection, tasks, hasSubtasks, isNoteInputFocused]);

  // Focus command input when palette opens
  useEffect(() => {
    if (showCommandPalette && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [showCommandPalette]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const parseCommandPaletteInput = (input) => {
    let title = input;
    let category = null;
    let priority = null;

    // Extract #category
    const categoryMatch = input.match(/#(\w+)/);
    if (categoryMatch) {
      const categoryInput = categoryMatch[1].toLowerCase();
      const foundCategory = DEV_CATEGORIES.find(
        (cat) => cat.id === categoryInput || cat.label.toLowerCase().includes(categoryInput)
      );
      if (foundCategory) {
        category = foundCategory.id;
        title = title.replace(categoryMatch[0], '').trim();
      }
    }

    // Extract !priority
    const priorityMatch = input.match(/!(\w+)/);
    if (priorityMatch) {
      const priorityInput = priorityMatch[1].toLowerCase();
      const foundPriority = DEV_PRIORITIES.find(
        (pri) => pri.id === priorityInput || pri.label.toLowerCase().includes(priorityInput)
      );
      if (foundPriority) {
        priority = foundPriority.id;
        title = title.replace(priorityMatch[0], '').trim();
      }
    }

    return { title, category, priority };
  };

  const handleCommandPaletteSubmit = async (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const { title, category, priority } = parseCommandPaletteInput(commandInput);

    try {
      const response = await createTaskAPI({
        title,
        description: '',
        category: category || DEV_CATEGORIES[0].id,
        priority: priority || 'low',
        status: 'pending',
        createdBy: currentUser.id,
        parentId: null,
      });

      if (response.status === 'SUCCESS') {
        setTasks([response.data, ...tasks]);
        setCommandInput('');
        setShowCommandPalette(false);
        toast.success('Task created successfully');
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  const openNewTaskModal = (parentTask = null) => {
    setEditingTask({
      id: null,
      title: '',
      description: '',
      category: DEV_CATEGORIES[0].id,
      priority: 'low',
      status: 'pending',
      parentId: parentTask?.id || null,
      isSubtask: parentTask !== null,
      subtaskOrder: parentTask ? getSubtasks(parentTask.id).length : null,
      isExpanded: true,
    });
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask({ ...task });
    setShowTaskModal(true);
  };

  const handleTaskModalSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask.title.trim()) return;

    try {
      if (editingTask.id) {
        // Edit existing
        const response = await updateTaskAPI(editingTask.id, {
          title: editingTask.title,
          description: editingTask.description,
          category: editingTask.category,
          priority: editingTask.priority,
          status: editingTask.status,
          sprint: editingTask.sprint || null,
        });

        if (response.status === 'SUCCESS') {
          setTasks(
            tasks.map((t) =>
              t.id === editingTask.id ? response.data : t
            )
          );
          toast.success('Task updated successfully');
        } else {
          toast.error('Failed to update task');
        }
      } else {
        // Create new
        const response = await createTaskAPI({
          title: editingTask.title,
          description: editingTask.description,
          category: editingTask.category,
          priority: editingTask.priority,
          status: editingTask.status,
          sprint: editingTask.sprint || null,
          createdBy: currentUser.id,
          parentId: editingTask.parentId || null,
        });

        if (response.status === 'SUCCESS') {
          // If it's a subtask, ensure parent is expanded
          if (response.data.parentId) {
            setExpandedParentTasks(prev => new Set(prev).add(response.data.parentId));
            setTasks([...tasks, response.data]);
          } else {
            setTasks([response.data, ...tasks]);
          }
          toast.success(response.data.parentId ? 'Subtask created successfully' : 'Task created successfully');
        } else {
          toast.error('Failed to create task');
        }
      }

      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    }
  };

  const cycleTaskStatus = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const statusOrder = ['pending', 'in_progress', 'complete'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];

    try {
      const response = await updateTaskAPI(taskId, {
        status: newStatus,
        completedBy: newStatus === 'complete' ? currentUser.id : null,
        completedAt: newStatus === 'complete' ? new Date().toISOString() : null,
      });

      if (response.status === 'SUCCESS') {
        setTasks(
          tasks.map((t) => (t.id === taskId ? response.data : t))
        );
      } else {
        toast.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const pauseTask = async (taskId) => {
    try {
      const response = await updateTaskAPI(taskId, {
        status: 'paused',
      });

      if (response.status === 'SUCCESS') {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
        toast.success('Task paused');
      } else {
        toast.error('Failed to pause task');
      }
    } catch (error) {
      console.error('Failed to pause task:', error);
      toast.error('Failed to pause task');
    }
  };

  const resumeTask = async (taskId) => {
    try {
      // Check if this is a parent task with subtasks
      const task = tasks.find(t => t.id === taskId);
      const subtasks = tasks.filter(t => t.parentId === taskId);

      // If parent has subtasks, start the first pending subtask instead
      if (task && !task.parentId && subtasks.length > 0) {
        const firstPending = subtasks.find(s => s.status === 'pending');
        if (firstPending) {
          // Start the first pending subtask instead of the parent
          const response = await updateTaskAPI(firstPending.id, {
            status: 'in_progress',
          });

          if (response.status === 'SUCCESS') {
            setTasks(tasks.map((t) => (t.id === firstPending.id ? response.data : t)));
            toast.success(`Started subtask: ${firstPending.title}`);
            return;
          }
        }
      }

      // Otherwise, start/resume the task itself
      const response = await updateTaskAPI(taskId, {
        status: 'in_progress',
      });

      if (response.status === 'SUCCESS') {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
        toast.success('Task resumed');
      } else {
        toast.error('Failed to resume task');
      }
    } catch (error) {
      console.error('Failed to resume task:', error);
      toast.error('Failed to resume task');
    }
  };

  const handleResetTimer = async (taskId) => {
    try {
      const response = await resetTimerAPI(taskId);
      if (response.status === 'SUCCESS') {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
        toast.success('Timer reset successfully');
      } else {
        toast.error('Failed to reset timer');
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
      toast.error(error.response?.data?.message || 'Failed to reset timer');
    }
    setShowResetConfirm(null);
  };

  const handleCSVUploadSuccess = async () => {
    // Reload tasks after bulk completion
    try {
      const response = await getTasks();
      if (response.status === 'SUCCESS') {
        setTasks(response.data || []);
      }
    } catch (error) {
      console.error('Failed to reload tasks:', error);
    }
  };

  const promoteSubtaskToTask = async (subtaskId) => {
    try {
      const response = await updateTaskAPI(subtaskId, {
        parentId: null,
        isSubtask: false,
        subtaskOrder: null
      });

      if (response.status === 'SUCCESS') {
        setTasks(tasks.map((t) => (t.id === subtaskId ? response.data : t)));
        toast.success('Promoted to standalone task');
      } else {
        toast.error('Failed to promote subtask');
      }
    } catch (error) {
      console.error('Failed to promote subtask:', error);
      toast.error('Failed to promote subtask');
    }
  };

  const convertTaskToSubtask = async (taskId, newParentId) => {
    try {
      const subtasks = getSubtasks(taskId);
      if (subtasks.length > 0) {
        toast.error('Cannot convert task with subtasks to a subtask');
        return;
      }

      const response = await updateTaskAPI(taskId, {
        parentId: newParentId,
        isSubtask: true,
        subtaskOrder: getSubtasks(newParentId).length
      });

      if (response.status === 'SUCCESS') {
        setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
        setExpandedParentTasks(prev => new Set(prev).add(newParentId));
        toast.success('Converted to subtask');
      } else {
        toast.error('Failed to convert to subtask');
      }
    } catch (error) {
      console.error('Failed to convert to subtask:', error);
      toast.error('Failed to convert to subtask');
    }
  };

  const deleteTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if task has subtasks
    const subtasks = getSubtasks(taskId);
    if (subtasks.length > 0) {
      // Show confirmation - for now we'll just delete all subtasks
      if (!window.confirm(`This task has ${subtasks.length} subtask(s). Delete task and all subtasks?`)) {
        return;
      }
    }

    try {
      const response = await deleteTaskAPI(taskId);

      if (response.status === 'SUCCESS') {
        // Delete task and all its subtasks
        const subtaskIds = subtasks.map(st => st.id);

        // Delete subtasks from backend
        for (const subtaskId of subtaskIds) {
          await deleteTaskAPI(subtaskId);
        }

        // Remove from state
        setTasks(tasks.filter((t) => t.id !== taskId && !subtaskIds.includes(t.id)));
        toast.success(subtasks.length > 0 ? `Task and ${subtasks.length} subtask(s) deleted` : 'Task deleted successfully');
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Note CRUD Functions
  const createNote = async () => {
    try {
      const response = await createNoteAPI({
        title: 'Untitled Note',
        content: '',
      });

      if (response.status === 'SUCCESS') {
        setNotes([response.data, ...notes]);
        setSelectedNoteId(response.data.id);
        setNoteContent(response.data.content);
        toast.success('Note created');
      }
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note');
    }
  };

  const updateNote = useCallback(async (noteId, updates) => {
    try {
      setIsSavingNote(true);
      const response = await updateNoteAPI(noteId, updates);

      if (response.status === 'SUCCESS') {
        setNotes(notes.map(n => n.id === noteId ? response.data : n));
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  }, [notes]);

  const deleteNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const confirmMessage = note.status === 'sent' || note.status === 'processed'
      ? `This note has been ${note.status}. Are you sure you want to delete it?`
      : 'Are you sure you want to delete this note?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await deleteNoteAPI(noteId);

      if (response.status === 'SUCCESS') {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) {
          setSelectedNoteId(null);
          setNoteContent('');
        }
        toast.success('Note deleted');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const markNoteReady = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Check current input state
    if (!noteContent.trim()) {
      toast.error('Note must have content');
      return;
    }

    // Auto-generate title and mark as ready
    const autoTitle = generateNoteTitle(noteContent);
    await updateNote(noteId, {
      title: autoTitle,
      content: noteContent,
      status: 'ready'
    });
    toast.success('Note marked as ready');
  };

  const sendNote = async (noteId) => {
    try {
      setIsSendingNote(true);

      // Auto-generate title before sending
      const autoTitle = generateNoteTitle(noteContent);
      await updateNote(noteId, {
        title: autoTitle,
        content: noteContent,
      });

      const response = await sendNoteAPI(noteId);

      if (response.status === 'SUCCESS') {
        // Update the sent note's status in the list (keep it visible)
        setNotes(notes.map(n =>
          n.id === noteId
            ? { ...n, status: 'sent', title: autoTitle, content: noteContent }
            : n
        ));

        // Clear content and create new blank note
        setNoteContent('');
        setNoteTitle('');

        // Create a new blank note automatically
        const newNoteResponse = await createNoteAPI({
          title: 'Untitled Note',
          content: '',
        });

        if (newNoteResponse.status === 'SUCCESS') {
          setNotes([newNoteResponse.data, ...notes.map(n =>
            n.id === noteId
              ? { ...n, status: 'sent', title: autoTitle, content: noteContent }
              : n
          )]);
          setSelectedNoteId(newNoteResponse.data.id);
        }

        toast.success('Note sent for processing');

        // Reload tasks to show newly created tasks (no toast here)
        setTimeout(async () => {
          const tasksResponse = await getTasks();
          if (tasksResponse.status === 'SUCCESS') {
            setTasks(tasksResponse.data || []);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send note:', error);
      toast.error('Failed to send note');
    } finally {
      setIsSendingNote(false);
    }
  };

  const copyNoteToClipboard = async (note) => {
    const text = `# ${note.title}\n\n${note.content}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  // Generate title from content (first 50 chars or timestamp)
  const generateNoteTitle = (content) => {
    if (!content || !content.trim()) {
      return `Dev Note - ${new Date().toLocaleString()}`;
    }
    const firstLine = content.trim().split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  // Manual save note function - ONLY saves when button clicked
  const saveNote = async () => {
    if (!selectedNoteId) return;

    const autoTitle = generateNoteTitle(noteContent);
    await updateNote(selectedNoteId, {
      title: autoTitle,
      content: noteContent,
    });
    toast.success('Note saved');
  };

  // CSV parser helper that handles quoted fields
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

        // Find column indices
        const idIndex = headers.indexOf('id');
        const titleIndex = headers.indexOf('title');
        const descIndex = headers.indexOf('description');
        const catIndex = headers.indexOf('category');
        const priIndex = headers.indexOf('priority');
        const sprintIndex = headers.indexOf('sprint');
        const statusIndex = headers.indexOf('status');
        const parentIdIndex = headers.findIndex(h => h.includes('parent'));

        const importedTasks = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = parseCSVLine(line);
            const parentId = parentIdIndex >= 0 ? values[parentIdIndex] : null;

            return {
              title: values[titleIndex] || '',
              description: values[descIndex] || '',
              category: values[catIndex] || DEV_CATEGORIES[0].id,
              priority: values[priIndex] || 'low',
              sprint: values[sprintIndex] || null,
              status: values[statusIndex] || 'pending',
              createdBy: currentUser.id,
              parentId: parentId && parentId.trim() ? parentId.trim() : null,
            };
          })
          .filter(task => task.title.trim()); // Filter out empty tasks

        const response = await bulkImportTasks(importedTasks);

        if (response.status === 'SUCCESS') {
          setTasks([...tasks, ...(response.data || [])]);
          toast.success(`Imported ${response.data?.length || 0} tasks successfully`);
        } else {
          toast.error('Failed to import tasks');
        }
      } catch (error) {
        console.error('Failed to import tasks:', error);
        toast.error('Failed to import tasks');
      }
    };
    reader.readAsText(file);
  };

  const handleCSVExport = () => {
    const escapeCSV = (str) => {
      if (!str) return '';
      const text = String(str);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    // Export in hierarchical order: parent, then its subtasks
    const exportRows = [];
    const parentTasks = getParentTasks();

    parentTasks.forEach(task => {
      // Add parent task
      exportRows.push([
        escapeCSV(task.id),
        escapeCSV(task.title),
        escapeCSV(task.description),
        escapeCSV(task.category),
        escapeCSV(task.priority),
        escapeCSV(task.sprint || ''),
        escapeCSV(task.status),
        '' // No parent_id for parent tasks
      ]);

      // Add subtasks
      const subtasks = getSubtasks(task.id);
      subtasks.forEach(subtask => {
        exportRows.push([
          escapeCSV(subtask.id),
          escapeCSV(subtask.title),
          escapeCSV(subtask.description),
          escapeCSV(subtask.category),
          escapeCSV(subtask.priority),
          escapeCSV(subtask.sprint || ''),
          escapeCSV(subtask.status),
          escapeCSV(subtask.parentId)
        ]);
      });
    });

    const csv = [
      'ID,Title,Description,Category,Priority,Sprint,Status,Parent ID',
      ...exportRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyfire-dev-tasks-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // History filtering
  const getHistoryTasks = useCallback(() => {
    const now = new Date();
    const filtered = tasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);

      switch (historyTimeScale) {
        case 'today':
          return completedDate.toDateString() === now.toDateString();
        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return completedDate.toDateString() === yesterday.toDateString();
        }
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return completedDate >= weekAgo;
        }
        case 'lastweek': {
          const twoWeeksAgo = new Date(now);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return completedDate >= twoWeeksAgo && completedDate < weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return completedDate >= monthAgo;
        }
        case 'lastmonth': {
          const twoMonthsAgo = new Date(now);
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return completedDate >= twoMonthsAgo && completedDate < monthAgo;
        }
        case 'all':
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [tasks, historyTimeScale]);

  const getStats = () => {
    const allTasks = tasks.filter((t) => !t.parentId);
    return {
      total: allTasks.length,
      pending: allTasks.filter((t) => t.status === 'pending').length,
      inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
      paused: allTasks.filter((t) => t.status === 'paused').length,
      complete: allTasks.filter((t) => t.status === 'complete').length,
    };
  };

  const getCategoryColor = (categoryId) => {
    return DEV_CATEGORIES.find((c) => c.id === categoryId)?.color || 'var(--text-muted)';
  };

  const getPriorityColor = (priorityId) => {
    return DEV_PRIORITIES.find((p) => p.id === priorityId)?.color || 'var(--text-muted)';
  };

  const getStatusColor = (statusId) => {
    return DEV_STATUSES.find((s) => s.id === statusId)?.color || 'var(--text-muted)';
  };

  const getStatusIcon = (status) => {
    if (status === 'complete') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="var(--color-success)" />
          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (status === 'in_progress') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="none" stroke="var(--color-warning)" strokeWidth="2" />
          <circle cx="8" cy="8" r="3" fill="var(--color-warning)" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="none" stroke="var(--border-default)" strokeWidth="2" />
      </svg>
    );
  };

  const formatCompletedDate = (completedAt) => {
    if (!completedAt) return '';

    const now = new Date();
    const completed = new Date(completedAt);
    const diffMs = now - completed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    // Format as "Jan 5, 2:30 PM"
    return completed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Parse categories - supports comma-separated string or array
  const parseCategories = (category) => {
    if (!category) return [];

    // Status values that should NOT appear as category badges
    const STATUS_VALUES = ['pending', 'in_progress', 'complete', 'paused'];

    let categories = [];
    if (Array.isArray(category)) {
      categories = category;
    } else {
      categories = category.split(',').map(c => c.trim()).filter(Boolean);
    }

    // Filter out status values from categories
    return categories.filter(cat => !STATUS_VALUES.includes(cat));
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getSuggestedEstimate = (category, priority) => {
    if (!averages) return null;

    // Try exact match first (category + priority)
    const exactKey = `${category}_${priority}`;
    if (averages.byCombo && averages.byCombo[exactKey]) {
      return Math.round(averages.byCombo[exactKey]);
    }

    // Fallback to category average
    if (averages.byCategory && averages.byCategory[category]) {
      return Math.round(averages.byCategory[category]);
    }

    // Fallback to priority average
    if (averages.byPriority && averages.byPriority[priority]) {
      return Math.round(averages.byPriority[priority]);
    }

    // Fallback to overall average
    if (averages.overall) {
      return Math.round(averages.overall);
    }

    return null;
  };

  const SubtaskRow = ({ task }) => {
    const priorityIcons = { urgent: '🔴', high: '🟡', low: '⚪' };
    const statusColors = {
      pending: 'var(--text-muted)',
      in_progress: 'var(--color-primary)',
      paused: 'var(--color-info)',
      complete: 'var(--color-success)'
    };

    return (
      <div className={styles.subtaskRow}>
        {/* Checkbox for completion */}
        <div className={styles.colCheckbox}>
          <input
            type="checkbox"
            checked={task.status === 'complete'}
            onChange={() => cycleTaskStatus(task.id)}
          />
        </div>

        {/* Priority */}
        <div className={styles.colPriority}>
          {priorityIcons[task.priority] || '⚪'}
        </div>

        {/* Title */}
        <div className={styles.colTitle}>
          <span className={styles.taskTitle}>{task.title}</span>
        </div>

        {/* Category */}
        <div className={styles.colCategory}>
          {parseCategories(task.category).map((cat, idx) => (
            <span
              key={idx}
              className={styles.categoryBadge}
              style={{ borderColor: getCategoryColor(cat), color: getCategoryColor(cat) }}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className={styles.colStatus}>
          <button
            className={styles.statusButton}
            style={{ color: statusColors[task.status] }}
            onClick={() => cycleTaskStatus(task.id)}
          >
            {task.status === 'in_progress' ? 'In Progress' : task.status}
          </button>
        </div>

        {/* Time */}
        <div className={styles.colTime}>
          {task.status === 'complete' && task.workDurationMinutes ? (
            // Completed: compare actual vs estimate
            (() => {
              const actual = task.workDurationMinutes;
              const estimate = task.estimatedMinutes;
              if (!estimate) {
                return <span className={styles.duration}>{formatDuration(actual)}</span>;
              }
              const ratio = actual / estimate;
              if (ratio <= 1.0) {
                return <span className={styles.timeOnTarget}>{formatDuration(actual)}</span>;
              } else if (ratio <= 1.2) {
                return <span className={styles.timeNear}>{formatDuration(actual)}</span>;
              } else {
                return <span className={styles.timeOver}>{formatDuration(actual)}</span>;
              }
            })()
          ) : task.status === 'in_progress' && task.startedAt ? (
            // In progress: check if elapsed time exceeds estimate
            (() => {
              const startedAt = new Date(task.startedAt);
              const now = new Date();
              const elapsedMinutes = Math.floor((now - startedAt) / 60000);
              const estimate = task.estimatedMinutes;
              if (estimate && elapsedMinutes > estimate) {
                return (
                  <span className={styles.timeOver}>
                    <Timer size={12} className={styles.timerIcon} /> ⚠️ {formatDuration(elapsedMinutes)}
                  </span>
                );
              }
              return (
                <span className={styles.startedAt}>
                  <Timer size={12} className={styles.timerIcon} /> {formatDuration(elapsedMinutes)}
                </span>
              );
            })()
          ) : task.estimatedMinutes ? (
            <span className={styles.estimate}>~{formatDuration(task.estimatedMinutes)}</span>
          ) : (
            <span className={styles.noTime}>-</span>
          )}
        </div>

        {/* Actions */}
        <div className={styles.colActions}>
          {task.status === 'in_progress' && (
            <>
              <button
                className={styles.resetTimerButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowResetConfirm(task.id);
                }}
                title="Reset timer"
              >
                <RotateCcw size={14} />
              </button>
              <button className={styles.pauseButton} onClick={() => pauseTask(task.id)} title="Pause task">
                <Pause size={14} />
              </button>
            </>
          )}
          {task.status === 'paused' && (
            <button className={styles.resumeButton} onClick={() => resumeTask(task.id)} title="Resume task">
              <Play size={14} />
            </button>
          )}
          <button className={styles.rowAction} onClick={() => promoteSubtaskToTask(task.id)} title="Promote to task">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.rowAction} onClick={() => openEditTaskModal(task)} title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className={styles.rowAction} onClick={() => deleteTask(task.id)} title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const TaskRow = ({ task, isSelected, isExpanded, onToggleSelect, onToggleExpand, onStatusChange, onEdit, onDelete, isCompleted }) => {
    const priorityIcons = { urgent: '🔴', high: '🟡', low: '⚪' };
    const statusColors = {
      pending: 'var(--text-muted)',
      in_progress: 'var(--color-primary)',
      paused: 'var(--color-info)',
      complete: 'var(--color-success)'
    };

    const subtasks = getSubtasks(task.id);
    const subtaskProgress = getSubtaskProgress(task.id);
    const isParentExpanded = expandedParentTasks.has(task.id);

    return (
      <>
        <div
          className={`${styles.tableRow} ${isSelected ? styles.rowSelected : ''} ${isCompleted ? styles.rowCompleted : ''}`}
          onClick={onToggleExpand}
        >
          {/* Checkbox */}
          <div className={styles.colCheckbox} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.preventDefault();
                onToggleSelect();
              }}
            />
          </div>

          {/* Priority with expand/collapse icon if has subtasks */}
          <div className={styles.colPriority}>
            {subtasks.length > 0 ? (
              <button
                className={styles.expandCollapseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleParentTaskExpansion(task.id);
                }}
                title={isParentExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: isParentExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <span>{priorityIcons[task.priority] || '⚪'}</span>
            )}
          </div>

          {/* Title with subtask count badge */}
          <div className={styles.colTitle}>
            <span className={styles.taskTitle}>{task.title}</span>
            {subtaskProgress && (
              <span
                className={styles.subtaskBadge}
                style={{
                  color: subtaskProgress.completed === subtaskProgress.total ? 'var(--color-success)' : 'var(--color-text-secondary)'
                }}
              >
                {subtaskProgress.completed}/{subtaskProgress.total}
              </span>
            )}
          </div>

          {/* Category */}
          <div className={styles.colCategory}>
            {parseCategories(task.category).map((cat, idx) => (
              <span
                key={idx}
                className={styles.categoryBadge}
                style={{ borderColor: getCategoryColor(cat), color: getCategoryColor(cat) }}
              >
                {cat}
              </span>
            ))}
            {task.sprint && task.sprint !== 'pending' && task.sprint !== 'in_progress' && task.sprint !== 'complete' && task.sprint !== 'paused' && (
              <span className={styles.sprintBadge}>{task.sprint}</span>
            )}
          </div>

          {/* Status */}
          <div className={styles.colStatus} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.statusButton}
              style={{ color: statusColors[task.status] }}
              onClick={onStatusChange}
            >
              {task.status === 'in_progress' ? 'In Progress' : task.status}
            </button>
          </div>

          {/* Time */}
          <div className={styles.colTime}>
            {task.status === 'complete' && task.workDurationMinutes ? (
              // Completed: compare actual vs estimate, include subtasks if parent
              (() => {
                const timeData = getParentTotalTime(task.id);
                const actual = timeData.hasSubtasks ? timeData.total : task.workDurationMinutes;
                const estimate = task.estimatedMinutes;

                if (!estimate) {
                  return (
                    <span className={styles.duration} title={timeData.hasSubtasks ? `Total: ${formatDuration(timeData.total)} (Parent: ${formatDuration(timeData.parentTime)}, Subtasks: ${formatDuration(timeData.subtaskTime)})` : undefined}>
                      {formatDuration(actual)}
                    </span>
                  );
                }
                const ratio = actual / estimate;
                const content = formatDuration(actual);
                const tooltip = timeData.hasSubtasks ? `Total: ${formatDuration(timeData.total)} (Parent: ${formatDuration(timeData.parentTime)}, Subtasks: ${formatDuration(timeData.subtaskTime)})` : undefined;

                if (ratio <= 1.0) {
                  return <span className={styles.timeOnTarget} title={tooltip}>{content}</span>;
                } else if (ratio <= 1.2) {
                  return <span className={styles.timeNear} title={tooltip}>{content}</span>;
                } else {
                  return <span className={styles.timeOver} title={tooltip}>{content}</span>;
                }
              })()
            ) : task.status === 'in_progress' && task.startedAt ? (
              // In progress: check if elapsed time exceeds estimate
              (() => {
                const startedAt = new Date(task.startedAt);
                const now = new Date();
                const elapsedMinutes = Math.floor((now - startedAt) / 60000);
                const estimate = task.estimatedMinutes;
                if (estimate && elapsedMinutes > estimate) {
                  return (
                    <span className={styles.timeOver}>
                      <Timer size={12} className={styles.timerIcon} /> ⚠️ {formatDuration(elapsedMinutes)}
                    </span>
                  );
                }
                return (
                  <span className={styles.startedAt}>
                    <Timer size={12} className={styles.timerIcon} /> {formatDuration(elapsedMinutes)}
                  </span>
                );
              })()
            ) : task.estimatedMinutes ? (
              <span className={styles.estimate}>~{formatDuration(task.estimatedMinutes)}</span>
            ) : (
              <span className={styles.noTime}>-</span>
            )}
          </div>

          {/* Actions */}
          <div className={styles.colActions} onClick={(e) => e.stopPropagation()}>
            {/* Add Subtask button */}
            <button
              className={styles.addSubtaskBtn}
              onClick={() => openNewTaskModal(task)}
              title="Add subtask"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {task.status === 'in_progress' && (
              <>
                <button
                  className={styles.resetTimerButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowResetConfirm(task.id);
                  }}
                  title="Reset timer"
                >
                  <RotateCcw size={14} />
                </button>
                <button className={styles.pauseButton} onClick={() => pauseTask(task.id)} title="Pause task">
                  <Pause size={14} />
                </button>
              </>
            )}
            {task.status === 'paused' && (
              <button className={styles.resumeButton} onClick={() => resumeTask(task.id)} title="Resume task">
                <Play size={14} />
              </button>
            )}
            <button className={styles.rowAction} onClick={onEdit} title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className={styles.rowAction} onClick={onDelete} title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className={styles.expandedRow}>
            <div className={styles.expandedContent}>
              {task.description ? (
                <p className={styles.description}>{task.description}</p>
              ) : (
                <p className={styles.noDescription}>No description</p>
              )}
              <div className={styles.metadata}>
                <span>Created by {task.createdBy?.split('@')[0] || task.createdBy} • {formatTimeAgo(task.createdAt)}</span>
                {task.startedAt && <span> • Started {formatTimeAgo(task.startedAt)}</span>}
                {task.completedAt && (
                  <span> • Completed by {task.completedBy?.split('@')[0] || task.completedBy} • {formatDuration(task.workDurationMinutes)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subtasks List */}
        {isParentExpanded && (
          <div className={styles.subtaskContainer}>
            {subtasks.map(subtask => (
              <SubtaskRow
                key={subtask.id}
                task={subtask}
              />
            ))}

            {/* Inline Add Subtask Form */}
            {inlineAddParentId === task.id ? (
              <div className={styles.inlineAddForm}>
                <input
                  type="text"
                  className={styles.inlineAddInput}
                  placeholder="Subtask title..."
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const title = e.target.value.trim();
                      try {
                        const response = await createTaskAPI({
                          title,
                          description: '',
                          category: task.category,
                          priority: 'low',
                          status: 'pending',
                          parentId: task.id,
                        });
                        if (response.status === 'SUCCESS') {
                          setTasks([...tasks, response.data]);
                          toast.success('Subtask created');
                        }
                      } catch (error) {
                        console.error('Failed to create subtask:', error);
                        toast.error('Failed to create subtask');
                      }
                      setInlineAddParentId(null);
                    }
                    if (e.key === 'Escape') {
                      setInlineAddParentId(null);
                    }
                  }}
                  onBlur={() => setInlineAddParentId(null)}
                />
              </div>
            ) : (
              <button
                className={styles.addSubtaskButton}
                onClick={() => setInlineAddParentId(task.id)}
              >
                + Add Subtask
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const TaskItem = ({ task, isSubtask = false }) => {
    const [expanded, setExpanded] = useState(false);
    const subtasks = tasks.filter((t) => t.parentId === task.id);
    const category = DEV_CATEGORIES.find((c) => c.id === task.category);
    const priority = DEV_PRIORITIES.find((p) => p.id === task.priority);
    const isSelected = selectedTasks.has(task.id);

    return (
      <div className={isSubtask ? styles.subtaskItem : styles.taskItem}>
        <div
          className={`${styles.taskRow} ${isSelected ? styles.taskRowSelected : ''}`}
          onClick={(e) => {
            if ((e.ctrlKey || e.metaKey) && !isSubtask) {
              toggleTaskSelection(task.id);
            }
          }}
        >
          {!isSubtask && (
            <input
              type="checkbox"
              className={styles.taskCheckbox}
              checked={isSelected}
              onChange={(e) => {
                e.preventDefault();
                toggleTaskSelection(task.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <button
            className={styles.statusButton}
            onClick={() => cycleTaskStatus(task.id)}
            title={`Status: ${task.status}`}
          >
            {getStatusIcon(task.status)}
          </button>

          <div className={styles.taskContent} onClick={() => openEditTaskModal(task)}>
            <div className={styles.taskTitle}>{task.title}</div>
            {!isSubtask && hasSubtasks(task.id) && (
              <div className={styles.subtaskProgressBar}>
                <div
                  className={styles.subtaskProgressFill}
                  style={{ width: `${getSubtaskProgress(task.id)?.percentage || 0}%` }}
                  title={`${getSubtaskProgress(task.id)?.completed}/${getSubtaskProgress(task.id)?.total} subtasks complete`}
                />
              </div>
            )}
            <div className={styles.taskMeta}>
              <span className={styles.badge} style={{ color: getCategoryColor(task.category) }}>
                {category?.label}
              </span>
              <span className={styles.badge} style={{ color: getPriorityColor(task.priority) }}>
                {priority?.label}
              </span>
              {task.status === 'complete' && task.completedBy && (
                <span className={styles.completionInfo}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="var(--color-success)" />
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Completed by {task.completedBy} {formatCompletedDate(task.completedAt)}
                </span>
              )}
              {task.description && (
                <span className={styles.taskDescription}>{task.description}</span>
              )}
            </div>
          </div>

          {!isSubtask && (
            <button
              className={styles.iconButton}
              onClick={() => openNewTaskModal(task)}
              title="Add subtask"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {subtasks.length > 0 && (
            <button
              className={styles.iconButton}
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <button
            className={styles.iconButton}
            onClick={() => deleteTask(task.id)}
            title="Delete"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {expanded && subtasks.length > 0 && (
          <div className={styles.subtaskList}>
            {subtasks.map((subtask) => (
              <TaskItem key={subtask.id} task={subtask} isSubtask />
            ))}
          </div>
        )}
      </div>
    );
  };

  const KanbanColumn = ({ status, statusLabel }) => {
    const columnTasks = getFilteredTasks().filter((t) => t.status === status);

    return (
      <div className={styles.kanbanColumn}>
        <div className={styles.kanbanHeader}>
          <span>{statusLabel}</span>
          <span className={styles.kanbanCount}>{columnTasks.length}</span>
        </div>
        <div className={styles.kanbanTasks}>
          {columnTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  const stats = getStats();

  return (
    <div className={styles.container}>
      {activeTab === 'tasks' && (
        <>
          <div className={styles.toolbar}>
            {/* Tab Navigation + View Switcher */}
            <div className={styles.viewSwitcher}>
              <button
                className={`${styles.viewButton} ${activeTab === 'tasks' ? styles.viewButtonActive : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                Tasks
              </button>
              <button
                className={`${styles.viewButton} ${activeTab === 'analytics' ? styles.viewButtonActive : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
              <button
                className={`${styles.viewButton} ${activeTab === 'equipment-review' ? styles.viewButtonActive : ''}`}
                onClick={() => setActiveTab('equipment-review')}
                title="Equipment Learning Review"
              >
                <Brain size={16} style={{ display: 'inline', marginRight: '4px' }} />
                Equipment Review
              </button>
              <button
                className={`${styles.viewButton} ${activeTab === 'flags' ? styles.viewButtonActive : ''}`}
                onClick={() => setActiveTab('flags')}
                title="Feature Flags"
              >
                Flags
              </button>
              <button
                className={styles.viewButton}
                onClick={() => setShowNotesPanel(true)}
                title="Dev Notes - Convert ideas to tasks"
              >
                <FileText size={16} style={{ display: 'inline', marginRight: '4px' }} />
                Notes ({notes.length})
              </button>
              <span style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></span>
              <button
                className={`${styles.viewButton} ${view === 'list' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('list')}
              >
                List
              </button>
              <button
                className={`${styles.viewButton} ${view === 'kanban' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('kanban')}
              >
                Kanban
              </button>
              <button
                className={`${styles.viewButton} ${view === 'history' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('history')}
              >
                History
              </button>
            </div>

            <input
              type="text"
              placeholder="Search tasks..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className={styles.filterSelect}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {DEV_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {DEV_PRIORITIES.map((pri) => (
                <option key={pri.id} value={pri.id}>
                  {pri.label}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {DEV_STATUSES.map((sta) => (
                <option key={sta.id} value={sta.id}>
                  {sta.label}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterSprint}
              onChange={(e) => setFilterSprint(e.target.value)}
            >
              <option value="all">All Sprints</option>
              {[...new Set(tasks.filter(t => t.sprint).map(t => t.sprint))].sort().map(sprint => (
                <option key={sprint} value={sprint}>{sprint}</option>
              ))}
            </select>

            <div className={styles.sortControls}>
              <label className={styles.sortLabel}>Sort:</label>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="priority">Priority</option>
                <option value="category">Category</option>
              </select>
              <button
                className={styles.sortOrderButton}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {sortOrder === 'asc' ? (
                    <path d="M8 3v10M5 6l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M8 13V3M5 10l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
            </div>

            <div className={styles.groupControls}>
              <span className={styles.controlLabel}>Group:</span>
              <button
                className={`${styles.viewButton} ${groupBy === null ? styles.viewButtonActive : ''}`}
                onClick={() => setGroupBy(null)}
              >
                None
              </button>
              <button
                className={`${styles.viewButton} ${groupBy === 'sprint' ? styles.viewButtonActive : ''}`}
                onClick={() => setGroupBy('sprint')}
              >
                Sprint
              </button>
              <button
                className={`${styles.viewButton} ${groupBy === 'category' ? styles.viewButtonActive : ''}`}
                onClick={() => setGroupBy('category')}
              >
                Category
              </button>
            </div>

            <button className={styles.primaryButton} onClick={() => openNewTaskModal()}>
              New Task
            </button>

            {/* Stats moved below New Task button */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: 'var(--text-muted)' }}>
                  {stats.pending}
                </span>
                <span className={styles.statLabel}>Pending</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: 'var(--color-warning)' }}>
                  {stats.inProgress}
                </span>
                <span className={styles.statLabel}>In Progress</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: 'var(--color-info)' }}>
                  {stats.paused}
                </span>
                <span className={styles.statLabel}>Paused</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>
                  {stats.complete}
                </span>
                <span className={styles.statLabel}>Complete</span>
              </div>
            </div>

            <button className={styles.secondaryButton} onClick={handleCSVExport}>
              Export CSV
            </button>

            <label className={styles.secondaryButton}>
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                style={{ display: 'none' }}
              />
            </label>

            <button
              className={styles.secondaryButton}
              onClick={() => setShowCSVUploadModal(true)}
              title="Bulk complete tasks from CSV"
            >
              <Upload size={14} style={{ marginRight: 'var(--spacing-xs)' }} />
              Bulk Complete
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => setShowCommandPalette(true)}
              title="Ctrl+K"
            >
              ⌘
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <div className={styles.loadingText}>Loading tasks...</div>
            </div>
          ) : (
            <>
              {view === 'list' && (() => {
                const filteredTasks = getFilteredTasks();
                const activeTasks = filteredTasks.filter(t => t.status !== 'complete' && t.status !== 'paused');
                const pausedTasks = filteredTasks.filter(t => t.status === 'paused');
                const completedTasks = filteredTasks.filter(t => t.status === 'complete');

            return (
              <>
                {/* Selection Toolbar */}
                {selectedTasks.size > 0 && (
                  <div className={styles.selectionToolbar}>
                    <span className={styles.selectionCount}>
                      {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className={styles.selectionActions}>
                      <button
                        className={styles.toolbarButton}
                        onClick={selectAllVisible}
                        title="Select All (Ctrl+A)"
                      >
                        Select All
                      </button>
                      <button
                        className={styles.toolbarButton}
                        onClick={copyTasks}
                        title="Copy to clipboard"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                      </button>
                      <button
                        className={`${styles.toolbarButton} ${styles.primaryButton}`}
                        onClick={copyAndStartTasks}
                        title="Copy to clipboard & start tasks (Ctrl+Shift+C)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy & Start
                      </button>
                      <button
                        className={styles.toolbarButton}
                        onClick={clearSelection}
                        title="Clear Selection (Esc)"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Compact Table */}
                <div className={styles.compactTable}>
                  {/* Table Header */}
                  <div className={styles.tableHeader}>
                    <div className={styles.colCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.size > 0 && selectedTasks.size === activeTasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(new Set(activeTasks.map(t => t.id)));
                          } else {
                            setSelectedTasks(new Set());
                          }
                        }}
                      />
                    </div>
                    <div className={styles.colPriority}>!</div>
                    <div className={styles.colTitle}>Task</div>
                    <div className={styles.colCategory}>Category</div>
                    <div className={styles.colStatus}>Status</div>
                    <div className={styles.colTime}>Time</div>
                    <div className={styles.colActions}></div>
                  </div>

                  {/* Active Tasks */}
                  {groupBy && groupedTasks ? (
                    // Grouped view
                    <div className={styles.groupedView}>
                      {groupedTasks.map(([groupName, groupTasks]) => (
                        <div key={groupName} className={styles.taskGroup}>
                          <div className={styles.groupHeader}>
                            <span className={styles.groupName}>{formatCategoryName(groupName)}</span>
                            <span className={styles.groupCount}>{groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className={styles.groupTasks}>
                            {groupTasks.map(task => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                isSelected={selectedTasks.has(task.id)}
                                isExpanded={expandedTaskId === task.id}
                                onToggleSelect={() => toggleTaskSelection(task.id)}
                                onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                onStatusChange={() => cycleTaskStatus(task.id)}
                                onEdit={() => openEditTaskModal(task)}
                                onDelete={() => deleteTask(task.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Regular list view
                    <div className={styles.tableBody}>
                      {activeTasks.length === 0 ? (
                        <div className={styles.emptyRow}>No active tasks</div>
                      ) : (
                        activeTasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            isSelected={selectedTasks.has(task.id)}
                            isExpanded={expandedTaskId === task.id}
                            onToggleSelect={() => toggleTaskSelection(task.id)}
                            onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                            onStatusChange={() => cycleTaskStatus(task.id)}
                            onEdit={() => openEditTaskModal(task)}
                            onDelete={() => deleteTask(task.id)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Paused Tasks - Collapsible */}
                  {pausedTasks.length > 0 && (
                    <div className={styles.pausedSection}>
                      <button
                        className={styles.pausedToggle}
                        onClick={() => setShowPaused(!showPaused)}
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2"
                          style={{ transform: showPaused ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        Paused ({pausedTasks.length})
                      </button>

                      {showPaused && (
                        <div className={styles.tableBody}>
                          {pausedTasks.map(task => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              isExpanded={expandedTaskId === task.id}
                              onToggleSelect={() => toggleTaskSelection(task.id)}
                              onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                              onStatusChange={() => cycleTaskStatus(task.id)}
                              onEdit={() => openEditTaskModal(task)}
                              onDelete={() => deleteTask(task.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed Tasks - Collapsible */}
                  {completedTasks.length > 0 && (
                    <div className={styles.completedSection}>
                      <button
                        className={styles.completedToggle}
                        onClick={() => setShowCompleted(!showCompleted)}
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2"
                          style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }}
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        Completed ({completedTasks.length})
                      </button>

                      {showCompleted && (
                        <div className={styles.tableBody}>
                          {completedTasks.map(task => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              isSelected={selectedTasks.has(task.id)}
                              isExpanded={expandedTaskId === task.id}
                              onToggleSelect={() => toggleTaskSelection(task.id)}
                              onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                              onStatusChange={() => cycleTaskStatus(task.id)}
                              onEdit={() => openEditTaskModal(task)}
                              onDelete={() => deleteTask(task.id)}
                              isCompleted
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
                );
              })()}

              {view === 'kanban' && (
                <div className={styles.kanbanView}>
                  <KanbanColumn status="pending" statusLabel="Pending" />
                  <KanbanColumn status="in_progress" statusLabel="In Progress" />
                  <KanbanColumn status="complete" statusLabel="Complete" />
                </div>
              )}

              {view === 'history' && (
                <div className={styles.historyView}>
                  <div className={styles.historyToolbar}>
                    <select
                      className={styles.filterSelect}
                      value={historyTimeScale}
                      onChange={(e) => setHistoryTimeScale(e.target.value)}
                    >
                      {DEV_TIME_SCALES.map((scale) => (
                        <option key={scale.id} value={scale.id}>
                          {scale.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.listView}>
                    {getHistoryTasks().map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab selectedTasks={Array.from(selectedTasks).map(id => tasks.find(t => t.id === id)).filter(Boolean)} />
      )}

      {activeTab === 'equipment-review' && (
        <EquipmentReviewPanel />
      )}

      {activeTab === 'flags' && (
        <div style={{ padding: 'var(--spacing)', maxWidth: 600 }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--spacing)' }}>
            Feature Flags
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--spacing)' }}>
            Refresh the page after toggling a flag to apply changes.
          </p>
          {Object.entries(FEATURE_FLAGS).map(([name, key]) => {
            const humanName = name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-tight) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{humanName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{key}</div>
                </div>
                <Toggle
                  checked={!!flagState[key]}
                  onChange={() => {
                    const next = toggleFeature(key);
                    setFlagState(prev => ({ ...prev, [key]: next }));
                    toast.info(`Feature flag "${humanName}" ${next ? 'enabled' : 'disabled'}. Refresh to apply.`);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {showCommandPalette && (
        <div className={styles.modal} onClick={() => setShowCommandPalette(false)}>
          <div className={styles.commandPalette} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCommandPaletteSubmit}>
              <input
                ref={commandInputRef}
                type="text"
                className={styles.commandInput}
                placeholder="Type task... (#category !priority)"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
              />
            </form>
            <div className={styles.commandHelp}>
              <div>Use #category (e.g., #server, #db) and !priority (e.g., !urgent)</div>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && editingTask && (
        <div className={styles.modal} onClick={() => setShowTaskModal(false)}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingTask.id ? 'Edit Task' : editingTask.parentId ? 'New Subtask' : 'New Task'}
            </h2>
            {editingTask.parentId && (() => {
              const parent = getParentTask(editingTask.id) || tasks.find(t => t.id === editingTask.parentId);
              return parent ? (
                <div className={styles.subtaskParentInfo}>
                  Subtask of: <strong>{parent.title}</strong>
                </div>
              ) : null;
            })()}
            <form onSubmit={handleTaskModalSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task title"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Task description (optional)"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.categoryGroup}`}>
                  <label className={styles.formLabel}>Category</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    placeholder="automation, database, interface"
                  />
                  <span className={styles.formHint}>
                    Comma-separated: {DEV_CATEGORIES.map(c => c.id).join(', ')}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    className={styles.formSelect}
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  >
                    {DEV_PRIORITIES.map((pri) => (
                      <option key={pri.id} value={pri.id}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sprint (optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editingTask.sprint || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, sprint: e.target.value })}
                  placeholder="e.g., Sprint 1, v2.1 Release, Q1 2026"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Estimated Time (minutes)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={editingTask.estimatedMinutes || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, estimatedMinutes: parseInt(e.target.value) || null })}
                  placeholder="Enter estimated minutes"
                  min="0"
                />
                {(() => {
                  const suggested = getSuggestedEstimate(editingTask.category, editingTask.priority);
                  if (suggested && suggested !== editingTask.estimatedMinutes) {
                    return (
                      <div className={styles.estimateSuggestion}>
                        Suggested: {formatDuration(suggested)} based on historical data
                        <button
                          type="button"
                          className={styles.useEstimateButton}
                          onClick={() => setEditingTask({ ...editingTask, estimatedMinutes: suggested })}
                        >
                          Use
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.primaryButton}>
                  {editingTask.id ? 'Save' : 'Create'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      {showNotesPanel && (
        <div className={styles.modal} onClick={() => setShowNotesPanel(false)}>
          <div className={styles.notesModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.notesModalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Dev Notes</h2>
                <p className={styles.modalSubtitle}>
                  Convey exact bug fixes or brainstorm ideas - notes will be transformed into actionable tasks
                </p>
              </div>
              <button className={styles.closeButton} onClick={() => setShowNotesPanel(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className={styles.notesModalContent}>
              {selectedNoteId ? (
                <>
                  <textarea
                    className={styles.noteTextarea}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onFocus={() => setIsNoteInputFocused(true)}
                    onBlur={() => setIsNoteInputFocused(false)}
                    placeholder="Describe bugs, features, or ideas..."
                  />

                  <div className={styles.notesModalFooter}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        className={styles.secondaryButton}
                        onClick={saveNote}
                        disabled={isSavingNote}
                      >
                        {isSavingNote ? 'Saving...' : 'Save Draft'}
                      </button>

                      <button
                        className={styles.secondaryButton}
                        onClick={() => deleteNote(selectedNoteId)}
                      >
                        Delete
                      </button>

                      <button
                        className={styles.primaryButton}
                        onClick={() => sendNote(selectedNoteId)}
                        disabled={isSendingNote || !noteContent.trim()}
                      >
                        {isSendingNote ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>

                  {/* Previous Notes List */}
                  {notes.length > 1 && (
                    <div className={styles.previousNotesSection}>
                      <h3 className={styles.previousNotesTitle}>Previous Notes</h3>
                      <div className={styles.previousNotesList}>
                        {notes
                          .filter(n => n.id !== selectedNoteId)
                          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                          .slice(0, 5)
                          .map(note => (
                            <div
                              key={note.id}
                              className={styles.previousNoteItem}
                              onClick={() => {
                                // Switch to note (no auto-save)
                                setSelectedNoteId(note.id);
                                setNoteContent(note.content);
                              }}
                            >
                              <span className={styles.previousNoteTitle}>• {note.title || 'Untitled'}</span>
                              <span className={`${styles.noteStatusBadge} ${styles['noteStatus-' + note.status]}`}>
                                {note.status}
                              </span>
                            </div>
                          ))}
                      </div>
                      {notes.length > 6 && (
                        <button
                          className={styles.secondaryButton}
                          onClick={() => setNotesView('list')}
                          style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}
                        >
                          View All ({notes.length} notes)
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noteEditorEmpty}>
                  <FileText size={48} color="var(--gray-400)" />
                  <p>No note selected</p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                    <button className={styles.primaryButton} onClick={createNote}>
                      Create New Note
                    </button>
                    {notes.length > 0 && (
                      <button className={styles.secondaryButton} onClick={() => setNotesView('list')}>
                        View All Notes ({notes.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Notes List Modal (separate) */}
      {notesView === 'list' && (
        <div className={styles.modal} onClick={() => setNotesView('edit')}>
          <div className={styles.notesModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.notesModalHeader}>
              <h2 className={styles.modalTitle}>All Notes ({notes.length})</h2>
              <button className={styles.closeButton} onClick={() => setNotesView('edit')}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.notesModalContent}>
              <button className={styles.primaryButton} onClick={() => {
                createNote();
                setNotesView('edit');
              }} style={{ marginBottom: 'var(--spacing-md)' }}>
                + New Note
              </button>

              <div className={styles.notesListView}>
                {notes.length === 0 ? (
                  <div className={styles.emptyNotes}>No notes yet</div>
                ) : (
                  notes
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .map(note => (
                      <div
                        key={note.id}
                        className={`${styles.noteListItem} ${selectedNoteId === note.id ? styles.noteListItemActive : ''}`}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                          setNotesView('edit');
                        }}
                      >
                        <div className={styles.noteListItemHeader}>
                          <div className={styles.noteListItemTitle}>{note.title || 'Untitled'}</div>
                          <span className={`${styles.noteStatusBadge} ${styles['noteStatus-' + note.status]}`}>
                            {note.status}
                          </span>
                        </div>
                        <div className={styles.noteListItemPreview}>
                          {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                        </div>
                        <div className={styles.noteListItemDate}>
                          {formatTimeAgo(note.updatedAt)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVUploadModal}
        onClose={() => setShowCSVUploadModal(false)}
        onSuccess={handleCSVUploadSuccess}
      />

      {/* Reset Timer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm !== null}
        onClose={() => setShowResetConfirm(null)}
        onConfirm={() => handleResetTimer(showResetConfirm)}
        title="Reset Timer?"
        message="This will reset the timer and change the task status back to pending."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
};

export default DevPortal;
