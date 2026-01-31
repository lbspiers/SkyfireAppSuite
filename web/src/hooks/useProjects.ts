// src/hooks/useProjects.ts

import { useState, useEffect, useCallback } from 'react';
import {
  listProjects,
  Project,
  getUniqueInstallers,
  getUniqueCompanies,
} from '../services/projectAPI';
import { useIsAuthenticated } from '../store';

interface UseProjectsOptions {
  companyId?: string | null;
  autoFetch?: boolean;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  // Actions
  refresh: () => Promise<void>;
  // Filters
  installers: string[];
  companies: string[];
  loadingFilters: boolean;
}

export const useProjects = (options: UseProjectsOptions = {}): UseProjectsReturn => {
  const { companyId, autoFetch = true } = options;
  const isAuthenticated = useIsAuthenticated();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter options
  const [installers, setInstallers] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setProjects([]);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await listProjects(companyId);
      setProjects(result.data?.projects || []);
    } catch (err: any) {
      console.error('[useProjects] Fetch error:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, companyId]);

  // Fetch filter options
  const fetchFilters = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingFilters(true);

    try {
      // Fetch installers for the company
      if (companyId) {
        const installerList = await getUniqueInstallers(companyId);
        setInstallers(installerList);
      }

      // Fetch companies (for superusers when no companyId)
      if (!companyId) {
        const companyList = await getUniqueCompanies();
        setCompanies(companyList);
      }
    } catch (err) {
      console.warn('[useProjects] Filter fetch error:', err);
    } finally {
      setLoadingFilters(false);
    }
  }, [isAuthenticated, companyId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchProjects();
      fetchFilters();
    }
  }, [fetchProjects, fetchFilters, autoFetch]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetchProjects(true);
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refreshing,
    refresh,
    installers,
    companies,
    loadingFilters,
  };
};

export default useProjects;
