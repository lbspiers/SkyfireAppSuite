// src/hooks/useProject.ts

import { useState, useEffect, useCallback } from 'react';
import {
  getProjectDetails,
  saveProjectInfo,
  saveSiteInfo,
  updateProjectStatus,
  Project,
  SiteInfoRequest,
} from '../services/projectAPI';
import { useIsAuthenticated } from '../store';

interface UseProjectOptions {
  projectId: string;
  companyId?: string;
  autoFetch?: boolean;
}

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  // Actions
  refresh: () => Promise<void>;
  updateProject: (data: Partial<Project>) => Promise<void>;
  updateSiteInfo: (data: SiteInfoRequest) => Promise<void>;
  updateStatus: (completedStep: number) => Promise<void>;
}

export const useProject = (options: UseProjectOptions): UseProjectReturn => {
  const { projectId, companyId, autoFetch = true } = options;
  const isAuthenticated = useIsAuthenticated();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch project details
  const fetchProject = useCallback(async () => {
    if (!isAuthenticated || !projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getProjectDetails(projectId, companyId);
      setProject(result.data || null);
    } catch (err: any) {
      console.error('[useProject] Fetch error:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, projectId, companyId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchProject();
    }
  }, [fetchProject, autoFetch]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetchProject();
  }, [fetchProject]);

  // Update project info
  const updateProject = useCallback(async (data: Partial<Project>) => {
    if (!projectId || !companyId) {
      throw new Error('Project ID and Company ID are required');
    }

    setSaving(true);
    try {
      await saveProjectInfo(projectId, companyId, data);
      // Update local state with new data
      setProject(prev => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      console.error('[useProject] Update error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId, companyId]);

  // Update site info
  const updateSiteInfo = useCallback(async (data: SiteInfoRequest) => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    setSaving(true);
    try {
      await saveSiteInfo(projectId, data);
      // Update local state
      setProject(prev => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      console.error('[useProject] Update site info error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  // Update project status
  const updateStatus = useCallback(async (completedStep: number) => {
    if (!projectId || !companyId) {
      throw new Error('Project ID and Company ID are required');
    }

    setSaving(true);
    try {
      await updateProjectStatus(projectId, companyId, completedStep);
      // Update local state
      setProject(prev => prev ? { ...prev, completed_step: completedStep } : null);
    } catch (err: any) {
      console.error('[useProject] Update status error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectId, companyId]);

  return {
    project,
    loading,
    error,
    saving,
    refresh,
    updateProject,
    updateSiteInfo,
    updateStatus,
  };
};

export default useProject;
