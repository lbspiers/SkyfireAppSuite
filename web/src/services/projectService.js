import axios from '../config/axios';
import logger from './devLogger';
import { getCompanyIdForFetch } from '../utils/adminUtils';

/**
 * List projects - handles super user vs regular user automatically
 * Super users get ALL projects, regular users get only their company's
 * @param {string|undefined} overrideCompanyId - Optional override for company ID
 * @returns {Promise} API response with projects
 */
export const listProjects = async (overrideCompanyId = undefined) => {
  try {
    // If override provided, use it; otherwise use smart detection
    const companyId = overrideCompanyId !== undefined
      ? overrideCompanyId
      : getCompanyIdForFetch();

    const url = companyId
      ? `/project?companyId=${companyId}`
      : '/project'; // No companyId = ALL projects (super user mode)

    logger.debug('projectService', 'listProjects URL:', url);

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    logger.error('projectService', 'Error listing projects:', error);
    throw error;
  }
};

/**
 * List active companies (for super user dropdowns)
 * @returns {Promise} API response with companies
 */
export const listActiveCompanies = async () => {
  try {
    const response = await axios.get('/companies/list-active');
    return response.data;
  } catch (error) {
    logger.error('projectService', 'Error listing companies:', error);
    throw error;
  }
};

/**
 * Create project with company assignment
 * @param {Object} data - Project data
 * @param {string} companyId - Company UUID
 * @returns {Promise} API response
 */
export const createProject = async (data, companyId) => {
  try {
    const payload = {
      ...data,
      companyId, // Required for project creation
    };

    const response = await axios.post('/project', payload);
    return response.data;
  } catch (error) {
    logger.error('projectService', 'Error creating project:', error);
    throw error;
  }
};

/**
 * Update project status (completed_step)
 * @param {string} projectUuid - Project UUID
 * @param {string} companyId - Company UUID
 * @param {number} completedStep - Status value (0-10)
 * @returns {Promise} API response
 */
export const updateProjectStatus = async (projectUuid, companyId, completedStep) => {
  try {
    const response = await axios.patch(
      `/project/${projectUuid}/status?companyId=${companyId}`,
      { completed_step: completedStep }
    );
    return response;
  } catch (error) {
    logger.error('projectService', 'Error updating project status:', error);
    throw error;
  }
};
