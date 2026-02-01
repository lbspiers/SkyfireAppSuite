import { useState, useEffect, useCallback } from 'react';
import {
  getActivityLog,
  ActivityLogEntry,
  GetActivityLogOptions,
} from '../services/activityLogAPI';

/**
 * Hook for managing activity log state with infinite scroll
 */

interface UseActivityLogReturn {
  logs: ActivityLogEntry[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 50;

export const useActivityLog = (projectUuid: string): UseActivityLogReturn => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);

  /**
   * Fetch activity logs
   */
  const fetchLogs = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const options: GetActivityLogOptions = {
          limit: PAGE_SIZE,
          offset: currentOffset,
          includeReverted: false, // Don't show reverted entries
        };

        const response = await getActivityLog(projectUuid, options);

        // Backend returns status: 'SUCCESS' (uppercase)
        if (response.status === 'success' || response.status === 'SUCCESS') {
          const newLogs = response.data.logs;

          if (append) {
            setLogs((prev) => [...prev, ...newLogs]);
          } else {
            setLogs(newLogs);
          }

          setHasMore(response.data.hasMore);
          setOffset(currentOffset + newLogs.length);
        } else {
          throw new Error(response.message || 'Failed to fetch activity logs');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load activity logs';
        setError(errorMessage);
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectUuid]
  );

  /**
   * Load more logs (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    await fetchLogs(offset, true);
  }, [hasMore, loadingMore, loading, offset, fetchLogs]);

  /**
   * Refresh logs from beginning
   */
  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchLogs(0, false);
  }, [fetchLogs]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchLogs(0, false);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

export default useActivityLog;
