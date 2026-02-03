import { useState, useEffect } from 'react';
import { getBatchProjectStatuses, ProjectTabStatus, TabName } from '../services/projectTabStatusAPI';

interface UseBatchProjectStatusesReturn {
  statuses: Record<string, Record<TabName, ProjectTabStatus | null>>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch tab statuses for multiple projects at once
 * Optimized for dashboard views where many projects are displayed
 *
 * @param projectIds - Array of project UUIDs
 * @returns Object with statuses keyed by project ID, loading state, and error
 *
 * @example
 * ```tsx
 * const projectIds = projects.map(p => p.uuid);
 * const { statuses, loading } = useBatchProjectStatuses(projectIds);
 *
 * // Access statuses for a specific project
 * const projectStatuses = statuses[project.uuid];
 * const surveyStatus = projectStatuses?.survey;
 * ```
 */
export const useBatchProjectStatuses = (projectIds: string[]): UseBatchProjectStatusesReturn => {
  const [statuses, setStatuses] = useState<Record<string, Record<TabName, ProjectTabStatus | null>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectIds.length === 0) {
      setStatuses({});
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getBatchProjectStatuses(projectIds)
      .then(setStatuses)
      .catch((err) => {
        console.error('[useBatchProjectStatuses] Error fetching batch statuses:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to fetch project statuses');
        setStatuses({});
      })
      .finally(() => setLoading(false));
  }, [projectIds.join(',')]); // Use join to create stable dependency

  return { statuses, loading, error };
};

export default useBatchProjectStatuses;
