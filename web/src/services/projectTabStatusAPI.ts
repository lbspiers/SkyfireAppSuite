import axios from '../config/axios';
import apiEndpoints from '../config/apiEndpoints';

// ============================================
// TYPES
// ============================================

export type TabName = 'survey' | 'site_plan' | 'plan_set' | 'revisions';
export type TabStatus = 'pending' | 'in_progress' | 'draft' | 'complete' | 'needs_attention' | 'none';

export interface ProjectTabStatus {
  tab_name: TabName;
  status: TabStatus;
  status_reason?: string | null;
  updated_at?: string;
}

export interface ProjectTabStatusesResponse {
  success: boolean;
  data: ProjectTabStatus[];
}

export interface SingleTabStatusResponse {
  success: boolean;
  data: ProjectTabStatus;
}

export interface UpdateTabStatusPayload {
  status: TabStatus;
  statusReason?: string | null;
}

export interface BatchTabStatusesRequest {
  projectIds: string[];
}

export interface BatchTabStatusesResponse {
  success: boolean;
  data: Record<string, Record<TabName, ProjectTabStatus | null>>;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all tab statuses for a project
 */
export const getProjectTabStatuses = async (projectId: string): Promise<ProjectTabStatus[]> => {
  const response = await axios.get<ProjectTabStatusesResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.GET_ALL(projectId)
  );
  return response.data.data;
};

/**
 * Get status for a specific tab
 */
export const getTabStatus = async (projectId: string, tabName: TabName): Promise<ProjectTabStatus> => {
  const response = await axios.get<SingleTabStatusResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.GET_ONE(projectId, tabName)
  );
  return response.data.data;
};

/**
 * Update status for a specific tab
 */
export const updateTabStatus = async (
  projectId: string,
  tabName: TabName,
  payload: UpdateTabStatusPayload
): Promise<ProjectTabStatus> => {
  const response = await axios.put<SingleTabStatusResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.UPDATE(projectId, tabName),
    payload
  );
  return response.data.data;
};

/**
 * Initialize tab statuses for a new project
 */
export const initializeTabStatuses = async (projectId: string): Promise<ProjectTabStatus[]> => {
  const response = await axios.post<ProjectTabStatusesResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.INIT(projectId)
  );
  return response.data.data;
};

/**
 * Check for stale statuses that need attention
 * This calls the backend to re-evaluate if any statuses are stale based on business logic
 */
export const checkStaleStatuses = async (projectId: string): Promise<ProjectTabStatus[]> => {
  const response = await axios.get<ProjectTabStatusesResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.CHECK_STALE(projectId)
  );
  return response.data.data;
};

/**
 * Fetch tab statuses for multiple projects at once
 * More efficient for dashboard views
 */
export const getBatchProjectStatuses = async (
  projectIds: string[]
): Promise<Record<string, Record<TabName, ProjectTabStatus | null>>> => {
  const response = await axios.post<BatchTabStatusesResponse>(
    apiEndpoints.PROJECT.TAB_STATUSES.BATCH,
    { projectIds }
  );
  return response.data.data;
};

// Alias for backward compatibility
export const batchGetTabStatuses = getBatchProjectStatuses;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get human-readable label for tab name
 */
export const getTabLabel = (tabName: TabName): string => {
  const labels: Record<TabName, string> = {
    survey: 'Survey',
    site_plan: 'Site Plan',
    plan_set: 'Plan Set',
    revisions: 'Revisions',
  };
  return labels[tabName];
};

/**
 * Get human-readable label for status
 * @param status - The status value
 * @param tabName - Optional tab name for context-specific labels (e.g., 'draft' means 'In Progress' for plan_set, 'Draft' for others)
 */
export const getStatusLabel = (status: TabStatus, tabName?: TabName): string => {
  const labels: Record<TabStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    draft: 'Draft',
    complete: 'Complete',
    needs_attention: 'Needs Attention',
    none: 'None',
  };
  return labels[status];
};

/**
 * Get color theme for status
 */
export const getStatusColor = (status: TabStatus): 'muted' | 'success' | 'warning' | 'info' => {
  const colors: Record<TabStatus, 'muted' | 'success' | 'warning' | 'info'> = {
    pending: 'muted',
    in_progress: 'info',
    draft: 'info',
    complete: 'success',
    needs_attention: 'warning',
    none: 'muted',
  };
  return colors[status];
};
