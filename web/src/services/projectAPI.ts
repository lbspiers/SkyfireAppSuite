// src/services/projectAPI.ts

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';
import { ApiResponse } from '../api/types';

/** URL-encode helper for query/path fragments */
const enc = encodeURIComponent;

// ============================================
// Type Definitions
// ============================================

export interface Project {
  uuid: string;
  id?: string;
  installer_project_id?: string;
  company_id: string;
  company_name?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  apn?: string;
  jurisdiction?: string;
  utility?: string;
  project_notes?: string;
  site_survey_date?: string;
  completed_step?: number;
  project_status?: string;
  installer_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectRequest {
  companyId: string;
  installerProjectId?: string;
  customerFirstName?: string;
  customerLastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface SiteInfoRequest {
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  apn?: string;
  jurisdiction?: string;
  utility?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total?: number;
}

// ============================================
// Core Project CRUD Operations
// ============================================

/**
 * Create a new project
 */
export const createProject = async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
  try {
    const response = await axiosInstance.post(apiEndpoints.PROJECT.ADD_NEW_PROJECT, data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to create project');
    }
  } catch (error: any) {
    console.error('[projectAPI] createProject error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to create project. Please try again.');
  }
};

/**
 * List all projects for a company
 * @param companyId - Company UUID. Pass null/undefined for all projects (superuser mode)
 */
export const listProjects = async (companyId?: string | null): Promise<ApiResponse<ProjectListResponse>> => {
  try {
    const url = companyId
      ? apiEndpoints.PROJECT.LIST_PROJECT(companyId)
      : '/project'; // No companyId = all projects for superusers

    console.debug('[projectAPI] listProjects URL:', url);
    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || response.data.projects) {
      return {
        status: 'SUCCESS',
        message: 'Projects fetched successfully',
        data: {
          projects: response.data.projects || response.data.data?.projects || [],
          total: response.data.total || response.data.data?.total,
        },
      };
    } else {
      throw new Error(response.data.message || 'Failed to fetch projects');
    }
  } catch (error: any) {
    console.error('[projectAPI] listProjects error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch projects. Please try again.');
  }
};

/**
 * Get project details
 */
export const getProjectDetails = async (
  projectId: string,
  companyId?: string
): Promise<ApiResponse<Project>> => {
  try {
    const url = companyId
      ? apiEndpoints.PROJECT.GET_PROJECT_INFO(projectId, companyId)
      : `/project/${projectId}`;

    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || response.data.data) {
      return {
        status: 'SUCCESS',
        message: 'Project fetched successfully',
        data: response.data.data || response.data,
      };
    } else {
      throw new Error(response.data.message || 'Failed to fetch project');
    }
  } catch (error: any) {
    console.error('[projectAPI] getProjectDetails error:', error?.response?.data || error?.message);

    // Handle 404 - project doesn't exist
    if (error?.response?.status === 404) {
      throw new Error('Project not found');
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch project. Please try again.');
  }
};

/**
 * Save/update project information
 */
export const saveProjectInfo = async (
  projectId: string,
  companyId: string,
  data: Partial<Project>
): Promise<ApiResponse<Project>> => {
  try {
    const url = `/project/${projectId}?companyId=${companyId}`;
    const response = await axiosInstance.put(url, data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to save project');
    }
  } catch (error: any) {
    console.error('[projectAPI] saveProjectInfo error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to save project. Please try again.');
  }
};

/**
 * Save site information
 */
export const saveSiteInfo = async (
  projectId: string,
  data: SiteInfoRequest
): Promise<ApiResponse> => {
  try {
    const url = apiEndpoints.PROJECT.SAVE_SITE_INFO(projectId);
    const response = await axiosInstance.put(url, data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to save site info');
    }
  } catch (error: any) {
    console.error('[projectAPI] saveSiteInfo error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to save site info. Please try again.');
  }
};

/**
 * Update project status/completed step
 */
export const updateProjectStatus = async (
  projectId: string,
  companyId: string,
  completedStep: number
): Promise<ApiResponse> => {
  try {
    const url = apiEndpoints.PROJECT.UPDATE_STATUS(projectId, companyId);
    console.debug('[projectAPI] PATCH', url, { completed_step: completedStep });

    const response = await axiosInstance.patch(url, {
      completed_step: completedStep,
    });

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to update status');
    }
  } catch (error: any) {
    console.error('[projectAPI] updateProjectStatus error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to update project status.');
  }
};

// ============================================
// Equipment & Manufacturer APIs
// ============================================

/**
 * Get manufacturers by equipment type
 * NOTE: encode `type` so values like "Solar Panel" & "String Combiner Panel" work
 */
export const getEquipmentManufacturers = async (type: string): Promise<string[]> => {
  try {
    const url = apiEndpoints.PROJECT.MANUFACTURER(enc(type));
    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || Array.isArray(response.data.data)) {
      return response.data.data || response.data.manufacturers || [];
    } else {
      throw new Error(response.data.message || 'Failed to fetch manufacturers');
    }
  } catch (error: any) {
    console.error('[projectAPI] getEquipmentManufacturers error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch manufacturers.');
  }
};

/**
 * Get equipment models by type and manufacturer
 */
export const getEquipmentModels = async (type: string, manufacturer: string): Promise<string[]> => {
  try {
    const url = `/equipment/models?type=${enc(type)}&manufacturer=${enc(manufacturer)}`;
    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success || Array.isArray(response.data.data)) {
      return response.data.data || response.data.models || [];
    } else {
      throw new Error(response.data.message || 'Failed to fetch models');
    }
  } catch (error: any) {
    console.error('[projectAPI] getEquipmentModels error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to fetch models.');
  }
};

/**
 * Get equipment specifications
 */
export const getEquipmentSpecs = async (
  type: string,
  make: string,
  model: string
): Promise<Record<string, any> | null> => {
  try {
    const url = `/equipment/specs?type=${enc(type)}&make=${enc(make)}&model=${enc(model)}`;
    console.debug('[projectAPI] getEquipmentSpecs:', { type, make, model });

    const response = await axiosInstance.get(url);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data.data || null;
    }

    return null;
  } catch (error: any) {
    console.warn('[projectAPI] getEquipmentSpecs error:', error?.message);
    return null; // Non-critical, return null on failure
  }
};

// ============================================
// Location Helpers
// ============================================

/**
 * Get all US states
 */
export const getStates = async (): Promise<string[]> => {
  try {
    const url = apiEndpoints.LOCATION.GET_STATES;
    const response = await axiosInstance.get<string[]>(url);

    return response.data || [];
  } catch (error: any) {
    console.error('[projectAPI] getStates error:', error?.response?.data || error?.message);
    throw new Error(error?.message || 'Unable to fetch states.');
  }
};

/**
 * Get zip codes for a state
 */
export const getZipCodes = async (stateCode: string): Promise<string[]> => {
  try {
    const url = apiEndpoints.LOCATION.GET_ZIPCODES(stateCode);
    const response = await axiosInstance.get<string[]>(url);

    return response.data || [];
  } catch (error: any) {
    console.error('[projectAPI] getZipCodes error:', error?.response?.data || error?.message);
    throw new Error(error?.message || 'Unable to fetch zip codes.');
  }
};

/**
 * Get utilities for a zip code
 */
export const getUtilities = async (zipCode: string): Promise<string[]> => {
  try {
    const url = apiEndpoints.LOCATION.GET_UTILITIES(zipCode);
    const response = await axiosInstance.get<string[]>(url);

    return response.data || [];
  } catch (error: any) {
    console.error('[projectAPI] getUtilities error:', error?.response?.data || error?.message);
    throw new Error(error?.message || 'Unable to fetch utilities.');
  }
};

// ============================================
// Additional Services
// ============================================

/**
 * Get additional services for a project
 */
export const getAdditionalServices = async (
  projectId: string,
  companyId: string
): Promise<ApiResponse> => {
  try {
    const url = apiEndpoints.PROJECT.GET_ADDITIONAL_SERVICES(projectId, companyId);
    const response = await axiosInstance.get(url);

    return {
      status: 'SUCCESS',
      message: 'Additional services fetched',
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    console.error('[projectAPI] getAdditionalServices error:', error?.response?.data || error?.message);

    // 404 is normal - no services configured yet
    if (error?.response?.status === 404) {
      return { status: 'SUCCESS', message: 'No additional services', data: null };
    }

    throw new Error(error?.message || 'Unable to fetch additional services.');
  }
};

/**
 * Save additional services for a project
 */
export const saveAdditionalServices = async (
  projectId: string,
  companyId: string,
  data: Record<string, any>
): Promise<ApiResponse> => {
  try {
    const url = apiEndpoints.PROJECT.SAVE_ADDITIONAL_SERVICES(projectId, companyId);
    const response = await axiosInstance.patch(url, data);

    if (response.data.status === 'SUCCESS' || response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to save additional services');
    }
  } catch (error: any) {
    console.error('[projectAPI] saveAdditionalServices error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to save additional services.');
  }
};

// ============================================
// Unique Filters (for dropdowns)
// ============================================

/**
 * Get unique installer names for a company
 */
export const getUniqueInstallers = async (companyId: string): Promise<string[]> => {
  try {
    // Try dedicated endpoint first
    const url = `/project/installers?companyId=${companyId}`;
    const response = await axiosInstance.get(url);

    if (response.data.installers) {
      return response.data.installers;
    }

    // Fallback: extract from all projects
    const projectsResponse = await listProjects(companyId);
    if (projectsResponse.data?.projects) {
      const uniqueNames = new Set(
        projectsResponse.data.projects
          .map((p: Project) => p.installer_name)
          .filter((name): name is string => !!name && name.trim() !== '')
      );
      const installers = Array.from(uniqueNames).sort();
      return installers;
    }

    return [];
  } catch (error: any) {
    console.warn('[projectAPI] getUniqueInstallers error, using fallback:', error?.message);

    // Fallback on any error
    try {
      const projectsResponse = await listProjects(companyId);
      if (projectsResponse.data?.projects) {
        const uniqueNames = new Set(
          projectsResponse.data.projects
            .map((p: Project) => p.installer_name)
            .filter((name): name is string => !!name && name.trim() !== '')
        );
        const installers = Array.from(uniqueNames).sort();
        return installers;
      }
    } catch {
      // Silent fallback failure
    }

    return [];
  }
};

/**
 * Get unique company names (for superusers)
 */
export const getUniqueCompanies = async (): Promise<string[]> => {
  try {
    const url = '/project/companies';
    const response = await axiosInstance.get(url);

    if (response.data.companies) {
      return response.data.companies;
    }

    // Fallback: extract from all projects
    const projectsResponse = await listProjects(null);
    if (projectsResponse.data?.projects) {
      const uniqueNames = new Set(
        projectsResponse.data.projects
          .map((p: Project) => p.company_name)
          .filter((name): name is string => !!name && name.trim() !== '')
      );
      const companies = Array.from(uniqueNames).sort();
      return companies;
    }

    return [];
  } catch (error: any) {
    console.warn('[projectAPI] getUniqueCompanies error:', error?.message);
    return [];
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get customer display name
 */
export const getCustomerName = (project: Project): string => {
  if (project.customer_first_name && project.customer_last_name) {
    return `${project.customer_first_name} ${project.customer_last_name}`;
  }
  if (project.customer_first_name) return project.customer_first_name;
  if (project.customer_last_name) return project.customer_last_name;
  return 'Unknown Customer';
};

/**
 * Get full address string
 */
export const getFullAddress = (project: Project): string => {
  const parts = [
    project.address,
    project.city,
    project.state,
    project.zip_code,
  ].filter(Boolean);

  return parts.join(', ') || 'No address';
};

/**
 * Get project status label
 */
export const getStatusLabel = (completedStep?: number): string => {
  if (!completedStep || completedStep === 0) return 'Not Started';
  if (completedStep === 1) return 'Site Info';
  if (completedStep === 2) return 'Equipment';
  if (completedStep === 3) return 'Electrical';
  if (completedStep === 4) return 'Structural';
  if (completedStep >= 5) return 'Complete';
  return 'In Progress';
};
