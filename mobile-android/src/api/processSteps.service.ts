// src/api/processSteps.service.ts
import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

export interface ProcessStep {
  id: number;
  project_id: number;
  step_number: number; // 1-6
  step_name: string;
  is_completed: boolean;
  completed_by: number | null;
  completed_at: string | null;
  completed_by_user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * GET /project/:projectId/process-steps
 * Fetches all 6 steps for a project (auto-initializes if needed)
 */
export const GetProcessSteps = async (projectId: string): Promise<ProcessStep[]> => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/process-steps`;
    const response = await axiosInstance.get(URL);
    return response.data;
  } catch (error: any) {
    console.error("[GetProcessSteps] Error:", error);
    throw error;
  }
};

/**
 * PATCH /project/:projectId/process-steps/:stepNumber/toggle
 * Toggles completion status of a specific step
 * API returns: {status: "SUCCESS", keys: 2, step: ProcessStep}
 */
export const ToggleProcessStep = async (
  projectId: string,
  stepNumber: number
): Promise<ProcessStep> => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/process-steps/${stepNumber}/toggle`;
    const response = await axiosInstance.patch(URL);
    // Extract the step object from the response wrapper
    return response.data.step || response.data;
  } catch (error: any) {
    console.error("[ToggleProcessStep] Error:", error);
    throw error;
  }
};

/**
 * PATCH /project/:projectId/process-steps/bulk
 * Bulk update multiple steps
 */
export const BulkUpdateProcessSteps = async (
  projectId: string,
  steps: Array<{ step_number: number; is_completed: boolean }>
): Promise<ProcessStep[]> => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/process-steps/bulk`;
    const response = await axiosInstance.patch(URL, { steps });
    return response.data;
  } catch (error: any) {
    console.error("[BulkUpdateProcessSteps] Error:", error);
    throw error;
  }
};
