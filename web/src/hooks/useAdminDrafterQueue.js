import { useState, useEffect, useCallback, useRef } from 'react';
import { adminDrafterService } from '../services/adminDrafterService';

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook for admin drafter queue management
 * @returns {Object} Queue data and methods
 */
export const useAdminDrafterQueue = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminDrafterService.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch queue
  const fetchQueue = useCallback(async () => {
    try {
      const data = await adminDrafterService.getQueue();
      setQueue(data);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    }
  }, []);

  // Fetch active assignments
  const fetchActiveAssignments = useCallback(async () => {
    try {
      const data = await adminDrafterService.getActiveAssignments();
      setActiveAssignments(data);
    } catch (err) {
      console.error('Failed to fetch active assignments:', err);
    }
  }, []);

  // Fetch pending questions
  const fetchPendingQuestions = useCallback(async () => {
    try {
      const data = await adminDrafterService.getPendingQuestions();
      setPendingQuestions(data);
    } catch (err) {
      console.error('Failed to fetch pending questions:', err);
    }
  }, []);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        fetchStats(),
        fetchQueue(),
        fetchActiveAssignments(),
        fetchPendingQuestions()
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err);
      setLoading(false);
    }
  }, [fetchStats, fetchQueue, fetchActiveAssignments, fetchPendingQuestions]);

  // Add to queue
  const addToQueue = useCallback(async (projectId, notes, timeLimitSeconds) => {
    try {
      await adminDrafterService.addToQueue(projectId, notes, timeLimitSeconds);
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Failed to add to queue:', err);
      throw err;
    }
  }, [fetchAll]);

  // Toggle urgent
  const toggleUrgent = useCallback(async (queueUuid, isUrgent, reason) => {
    try {
      await adminDrafterService.toggleUrgent(queueUuid, isUrgent, reason);
      await fetchQueue();
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Failed to toggle urgent:', err);
      throw err;
    }
  }, [fetchQueue, fetchStats]);

  // Reorder queue
  const reorderQueue = useCallback(async (orderArray) => {
    try {
      await adminDrafterService.reorderQueue(orderArray);
      await fetchQueue();
      return true;
    } catch (err) {
      console.error('Failed to reorder queue:', err);
      throw err;
    }
  }, [fetchQueue]);

  // Remove from queue
  const removeFromQueue = useCallback(async (queueUuid) => {
    try {
      await adminDrafterService.removeFromQueue(queueUuid);
      await fetchAll();
      return true;
    } catch (err) {
      console.error('Failed to remove from queue:', err);
      throw err;
    }
  }, [fetchAll]);

  // Answer question
  const answerQuestion = useCallback(async (questionUuid, answerText) => {
    try {
      await adminDrafterService.answerQuestion(questionUuid, answerText);
      await fetchPendingQuestions();
      return true;
    } catch (err) {
      console.error('Failed to answer question:', err);
      throw err;
    }
  }, [fetchPendingQuestions]);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Set up polling
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchAll();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchAll]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAll();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAll]);

  return {
    stats,
    queue,
    activeAssignments,
    pendingQuestions,
    loading,
    error,
    refresh: fetchAll,
    addToQueue,
    toggleUrgent,
    reorderQueue,
    removeFromQueue,
    answerQuestion
  };
};
