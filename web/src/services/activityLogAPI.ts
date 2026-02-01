import axios from '../config/axios';

/**
 * Activity Log API Service
 * Handles all API calls related to project activity logging and change tracking
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface ActivityLogEntry {
  uuid: string;
  project_uuid: string;
  projectUuid: string;
  user_uuid: string;
  userUuid: string;
  action_type: 'create' | 'update' | 'delete' | 'revert';
  actionType: 'create' | 'update' | 'delete' | 'revert';
  section: string;
  field_name: string;
  fieldName: string;
  field_label?: string;
  fieldLabel?: string;
  old_value: string | null;
  oldValue: string | null;
  new_value: string | null;
  newValue: string | null;
  old_value_display?: string | null;
  oldValueDisplay?: string | null;
  new_value_display?: string | null;
  newValueDisplay?: string | null;
  description?: string | null;
  change_notes: string | null;
  changeNotes: string | null;
  batch_id?: string | null;
  batchId?: string | null;
  source: 'web' | 'mobile' | 'api' | 'system';
  project_number: string | null;
  projectNumber: string | null;
  homeowner_name: string | null;
  homeownerName: string | null;
  is_reverted: boolean;
  isReverted: boolean;
  reverted_at: string | null;
  revertedAt: string | null;
  reverted_by_uuid: string | null;
  revertedByUuid: string | null;
  reverted_by_name: string | null;
  revertedByName: string | null;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface ActivitySummary {
  totalChanges: number;
  uniqueUsers: number;
  lastActivity: string | null;
  changesBySection: {
    [section: string]: number;
  };
}

export interface GetActivityLogOptions {
  limit?: number;
  offset?: number;
  section?: string;
  actionType?: 'create' | 'update' | 'delete' | 'revert';
  userUuid?: string;
  search?: string;
  includeReverted?: boolean;
}

export interface GetActivityLogResponse {
  status: 'success' | 'error' | 'SUCCESS' | 'ERROR' | string;
  data: {
    logs: ActivityLogEntry[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface GetActivitySummaryResponse {
  status: 'success' | 'error' | 'SUCCESS' | 'ERROR' | string;
  data: ActivitySummary;
  message?: string;
}

export interface FieldChange {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface LogFieldChangesPayload {
  changes: FieldChange[];
  source?: 'web' | 'mobile' | 'api' | 'system';
  projectNumber?: string;
  homeownerName?: string;
}

export interface LogFieldChangesResponse {
  status: 'success' | 'error' | 'SUCCESS' | 'ERROR' | string;
  data: {
    created: number;
    logs: ActivityLogEntry[];
  };
  message?: string;
}

export interface RevertChangeResponse {
  status: 'success' | 'error' | 'SUCCESS' | 'ERROR' | string;
  data: {
    reverted: ActivityLogEntry;
    newEntry: ActivityLogEntry;
  };
  message?: string;
}

export interface UpdateLogNotesResponse {
  status: 'success' | 'error' | 'SUCCESS' | 'ERROR' | string;
  data: ActivityLogEntry;
  message?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get activity log entries for a project
 * @param projectUuid - The project UUID
 * @param options - Optional filters and pagination
 * @returns Promise with activity log entries
 */
export const getActivityLog = async (
  projectUuid: string,
  options?: GetActivityLogOptions
): Promise<GetActivityLogResponse> => {
  const params = new URLSearchParams();

  if (options?.limit !== undefined) params.append('limit', options.limit.toString());
  if (options?.offset !== undefined) params.append('offset', options.offset.toString());
  if (options?.section) params.append('section', options.section);
  if (options?.actionType) params.append('actionType', options.actionType);
  if (options?.userUuid) params.append('userUuid', options.userUuid);
  if (options?.search) params.append('search', options.search);
  if (options?.includeReverted !== undefined) {
    params.append('includeReverted', options.includeReverted.toString());
  }

  const response = await axios.get(
    `/api/projects/${projectUuid}/activity-log?${params.toString()}`
  );

  return response.data;
};

/**
 * Get activity summary for a project
 * @param projectUuid - The project UUID
 * @returns Promise with activity summary data
 */
export const getActivitySummary = async (
  projectUuid: string
): Promise<GetActivitySummaryResponse> => {
  const response = await axios.get(`/api/projects/${projectUuid}/activity-log/summary`);
  return response.data;
};

/**
 * Log field changes for a project
 * @param projectUuid - The project UUID
 * @param changes - Array of field changes
 * @param source - Source of the change (web, mobile, api, system)
 * @param projectNumber - Optional project number
 * @param homeownerName - Optional homeowner name
 * @returns Promise with created log entries
 */
export const logFieldChanges = async (
  projectUuid: string,
  changes: FieldChange[],
  source?: 'web' | 'mobile' | 'api' | 'system',
  projectNumber?: string,
  homeownerName?: string
): Promise<LogFieldChangesResponse> => {
  const payload: LogFieldChangesPayload = {
    changes,
    source: source || 'web',
    projectNumber,
    homeownerName,
  };

  const response = await axios.post(`/api/projects/${projectUuid}/activity-log`, payload);
  return response.data;
};

/**
 * Revert a change (undo)
 * @param projectUuid - The project UUID
 * @param logUuid - The activity log entry UUID to revert
 * @param changeNotes - Optional notes about the revert
 * @returns Promise with revert result
 */
export const revertChange = async (
  projectUuid: string,
  logUuid: string,
  changeNotes?: string
): Promise<RevertChangeResponse> => {
  const payload = changeNotes ? { changeNotes } : {};
  const response = await axios.post(
    `/api/projects/${projectUuid}/activity-log/${logUuid}/revert`,
    payload
  );
  return response.data;
};

/**
 * Update notes for an activity log entry
 * @param projectUuid - The project UUID
 * @param logUuid - The activity log entry UUID
 * @param changeNotes - New notes for the log entry
 * @returns Promise with updated log entry
 */
export const updateLogNotes = async (
  projectUuid: string,
  logUuid: string,
  changeNotes: string
): Promise<UpdateLogNotesResponse> => {
  const response = await axios.put(
    `/api/projects/${projectUuid}/activity-log/${logUuid}/notes`,
    { changeNotes }
  );
  return response.data;
};
