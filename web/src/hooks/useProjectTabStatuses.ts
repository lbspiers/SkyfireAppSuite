import { useState, useEffect, useCallback } from 'react';
import {
  getProjectTabStatuses,
  getTabStatus,
  updateTabStatus as updateTabStatusAPI,
  checkStaleStatuses as checkStaleStatusesAPI,
  ProjectTabStatus,
  TabName,
  TabStatus,
  UpdateTabStatusPayload,
} from '../services/projectTabStatusAPI';

interface UseProjectTabStatusesOptions {
  autoFetch?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds (default: 1 hour = 3600000ms)
}

interface UseProjectTabStatusesReturn {
  statuses: Record<TabName, ProjectTabStatus | null>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStatus: (tabName: TabName, status: TabStatus, statusReason?: string | null) => Promise<void>;
  getStatus: (tabName: TabName) => ProjectTabStatus | null;
  hasStatus: (tabName: TabName) => boolean;
  checkStale: () => Promise<void>;
}

/**
 * Hook to manage project tab statuses
 *
 * @param projectId - Project UUID
 * @param options - Configuration options
 * @returns Tab statuses and management functions
 *
 * @example
 * ```tsx
 * const { statuses, loading, updateStatus, getStatus } = useProjectTabStatuses(projectUuid);
 *
 * // Get status for a specific tab
 * const surveyStatus = getStatus('survey');
 *
 * // Update status
 * await updateStatus('survey', 'complete');
 * ```
 */
export const useProjectTabStatuses = (
  projectId: string | null | undefined,
  options: UseProjectTabStatusesOptions = {}
): UseProjectTabStatusesReturn => {
  const { autoFetch = true, enablePolling = false, pollingInterval = 3600000 } = options;

  const [statuses, setStatuses] = useState<Record<TabName, ProjectTabStatus | null>>({
    survey: null,
    site_plan: null,
    plan_set: null,
    revisions: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all tab statuses for the project
   */
  const refresh = useCallback(async () => {
    if (!projectId) {
      setStatuses({
        survey: null,
        site_plan: null,
        plan_set: null,
        revisions: null,
      });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getProjectTabStatuses(projectId);

      // Convert to object format for easier access
      const statusMap: Record<TabName, ProjectTabStatus | null> = {
        survey: null,
        site_plan: null,
        plan_set: null,
        revisions: null,
      };

      // Handle different response formats
      let actualData = data;

      // If data has a 'statuses' property, use that instead
      if (data && typeof data === 'object' && 'statuses' in data) {
        actualData = (data as any).statuses;
      }

      if (Array.isArray(actualData)) {
        // Array format: [{ tab_name: 'survey', status: 'complete' }, ...]
        actualData.forEach((item) => {
          if (item.tab_name) {
            statusMap[item.tab_name] = item;
          }
        });
      } else if (typeof actualData === 'object' && actualData !== null) {
        // Object format: { survey: {...}, site_plan: {...}, ... }
        Object.keys(actualData).forEach((key) => {
          const tabName = key as TabName;
          if (actualData[tabName]) {
            statusMap[tabName] = actualData[tabName];
          }
        });
      }

      setStatuses(statusMap);
    } catch (err: any) {
      console.error('[useProjectTabStatuses] Error fetching tab statuses:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch tab statuses');
      setStatuses({
        survey: null,
        site_plan: null,
        plan_set: null,
        revisions: null,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /**
   * Update status for a specific tab
   */
  const updateStatus = useCallback(
    async (tabName: TabName, status: TabStatus, statusReason?: string | null) => {
      if (!projectId) {
        throw new Error('Project ID is required to update tab status');
      }

      try {
        const payload: UpdateTabStatusPayload = {
          status,
          statusReason: statusReason || null,
        };

        const updatedStatus = await updateTabStatusAPI(projectId, tabName, payload);

        // Update local state
        setStatuses((prevStatuses) => ({
          ...prevStatuses,
          [tabName]: updatedStatus,
        }));
      } catch (err: any) {
        console.error(`[useProjectTabStatuses] Error updating ${tabName} status:`, err);
        throw new Error(err?.response?.data?.message || err.message || 'Failed to update tab status');
      }
    },
    [projectId]
  );

  /**
   * Get status for a specific tab
   */
  const getStatus = useCallback(
    (tabName: TabName): ProjectTabStatus | null => {
      return statuses[tabName] || null;
    },
    [statuses]
  );

  /**
   * Check if a tab has a status
   */
  const hasStatus = useCallback(
    (tabName: TabName): boolean => {
      return statuses[tabName] !== null;
    },
    [statuses]
  );

  /**
   * Check for stale statuses
   * Calls backend to re-evaluate business logic and updates local state
   */
  const checkStale = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      const updatedData = await checkStaleStatusesAPI(projectId);

      // Convert to object format
      const statusMap: Record<TabName, ProjectTabStatus | null> = {
        survey: null,
        site_plan: null,
        plan_set: null,
        revisions: null,
      };

      if (Array.isArray(updatedData)) {
        updatedData.forEach((item) => {
          if (item.tab_name) {
            statusMap[item.tab_name] = item;
          }
        });
      } else if (typeof updatedData === 'object' && updatedData !== null) {
        Object.keys(updatedData).forEach((key) => {
          const tabName = key as TabName;
          if (updatedData[tabName]) {
            statusMap[tabName] = updatedData[tabName];
          }
        });
      }

      setStatuses(statusMap);
    } catch (err: any) {
      console.error('[useProjectTabStatuses] Error checking stale statuses:', err);
      // Don't throw - stale check failure shouldn't block UI
    }
  }, [projectId]);

  // Auto-fetch on mount if enabled and projectId is provided
  useEffect(() => {
    if (autoFetch && projectId) {
      refresh();
    }
  }, [autoFetch, projectId, refresh]);

  // Check for stale statuses on mount
  // DISABLED: This was causing statuses to reset to null after loading
  // useEffect(() => {
  //   if (projectId) {
  //     checkStale();
  //   }
  // }, [projectId, checkStale]);

  // Set up polling if enabled
  useEffect(() => {
    if (!enablePolling || !projectId) {
      return;
    }

    const intervalId = setInterval(() => {
      checkStale();
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enablePolling, projectId, pollingInterval, checkStale]);

  return {
    statuses,
    loading,
    error,
    refresh,
    updateStatus,
    getStatus,
    hasStatus,
    checkStale,
  };
};
