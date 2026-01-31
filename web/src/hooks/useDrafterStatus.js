import { useState, useEffect, useCallback, useRef } from 'react';
import { drafterPortalService } from '../services/drafterPortalService';

const POLL_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook for fetching and auto-refreshing drafter status
 * @returns {{status: object|null, loading: boolean, error: Error|null, refresh: Function}}
 */
export const useDrafterStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await drafterPortalService.getStatus();
      setStatus(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch drafter status:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Set up polling
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchStatus]);

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchStatus();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus
  };
};
