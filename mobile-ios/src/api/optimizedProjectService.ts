// src/api/optimizedProjectService.ts
// Optimized project API service with batch operations and caching

import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";
import { 
  processBatches, 
  apiCache, 
  withPerformanceMonitoring,
  ConcurrencyLimiter
} from "../utils/batchApiUtils";

const limiter = new ConcurrencyLimiter(5); // Max 5 concurrent requests

/**
 * Fetch multiple project details in parallel with optimized batching
 * This is the main optimization - instead of N serial calls, we do parallel batched calls
 */
export const getProjectDetailsOptimized = withPerformanceMonitoring(
  async (
    projectIds: string[],
    companyId: string,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      onProgress?: (progress: number, message: string) => void;
      useCache?: boolean;
      fields?: string[]; // Specific fields to fetch
    } = {}
  ) => {
    const {
      batchSize = 10,
      maxConcurrency = 5,
      onProgress,
      useCache = true,
      fields
    } = options;

    console.debug(`[OptimizedAPI] Fetching ${projectIds.length} projects in batches of ${batchSize}`);

    // Process projects in optimized batches
    const results = await processBatches(
      projectIds,
      async (projectId) => {
        // Check cache first
        if (useCache) {
          const cacheKey = `project_${projectId}_${companyId}`;
          return apiCache.get(
            cacheKey,
            async () => {
              // Use limiter to control concurrency
              return limiter.execute(async () => {
                const URL = `${apiEndpoints.BASE_URL}/project/${projectId}?companyId=${companyId}${
                  fields ? `&fields=${fields.join(',')}` : ''
                }`;
                
                const response = await axiosInstance.get(URL);
                return response.data?.data || null;
              });
            }
          );
        }

        // Direct fetch without cache
        return limiter.execute(async () => {
          const URL = `${apiEndpoints.BASE_URL}/project/${projectId}?companyId=${companyId}${
            fields ? `&fields=${fields.join(',')}` : ''
          }`;
          
          const response = await axiosInstance.get(URL);
          return response.data?.data || null;
        });
      },
      {
        batchSize,
        maxConcurrency,
        onProgress,
        retryAttempts: 2,
        retryDelay: 500
      }
    );

    return results.filter(Boolean); // Remove any null results
  },
  'getProjectDetailsOptimized'
);

/**
 * Get projects with enriched data in a single optimized call
 * This attempts to use a batch endpoint if available
 */
export const getProjectsWithDetails = withPerformanceMonitoring(
  async (
    companyId: string,
    options: {
      includeDetails?: boolean;
      includeSite?: boolean;
      includeEquipment?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) => {
    const {
      includeDetails = true,
      includeSite = true,
      includeEquipment = false,
      limit,
      offset
    } = options;

    try {
      // Build query parameters for enriched data
      const params = new URLSearchParams({
        companyId,
        ...(includeDetails && { include: 'details' }),
        ...(includeSite && { include: 'site' }),
        ...(includeEquipment && { include: 'equipment' }),
        ...(limit && { limit: limit.toString() }),
        ...(offset && { offset: offset.toString() })
      });

      const URL = `${apiEndpoints.BASE_URL}/project?${params.toString()}`;
      console.debug('[OptimizedAPI] Fetching enriched projects:', URL);

      const response = await axiosInstance.get(URL);
      
      if (response.status === 200) {
        return response.data?.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('[OptimizedAPI] Failed to fetch enriched projects:', error);
      throw error;
    }
  },
  'getProjectsWithDetails'
);

/**
 * Fetch project summaries optimized for dashboard display
 * Uses minimal fields to reduce payload size
 */
export const getProjectSummariesBatch = withPerformanceMonitoring(
  async (
    projectIds: string[],
    companyId: string
  ): Promise<any[]> => {
    // Fields needed for dashboard display
    const summaryFields = [
      'uuid',
      'installer_project_id',
      'customer_first_name',
      'customer_last_name',
      'address',
      'city',
      'state',
      'zip_code',
      'completed_step',
      'project_status',
      'created_at',
      'updated_at'
    ];

    return getProjectDetailsOptimized(
      projectIds,
      companyId,
      {
        batchSize: 15,
        maxConcurrency: 8,
        fields: summaryFields,
        useCache: true
      }
    );
  },
  'getProjectSummariesBatch'
);

/**
 * Hybrid approach: Get basic list first, then enrich with details
 * This is the recommended approach for the dashboard
 *
 * @param companyId - Company ID to filter by, or null/undefined for all projects (superadmin)
 * @param onProgress - Progress callback
 */
/**
 * Fetch a single page of projects with pagination support
 */
export const getProjectsPage = async (
  companyId: string | null | undefined,
  page: number = 1,
  limit: number = 100
): Promise<{ projects: any[], pagination: any }> => {
  try {
    const baseURL = companyId
      ? `${apiEndpoints.BASE_URL}/project?companyId=${companyId}`
      : `${apiEndpoints.BASE_URL}/project`;

    console.log(`🌐 [OptimizedAPI] Fetching page ${page} (limit: ${limit})`);

    const response = await axiosInstance.get(baseURL);

    const projects = response.data?.data || [];
    const pagination = response.data?.pagination || null;

    console.log(`✅ [OptimizedAPI] Page ${page}: Got ${projects.length} projects`);
    if (pagination) {
      console.log(`📄 [OptimizedAPI] Pagination:`, {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        hasMore: pagination.currentPage < pagination.totalPages
      });
    }

    return { projects, pagination };
  } catch (error) {
    console.error('[OptimizedAPI] Failed to fetch projects page:', error);
    throw error;
  }
};

export const getProjectsHybrid = withPerformanceMonitoring(
  async (
    companyId: string | null | undefined,
    onProgress?: (progress: number, message: string) => void
  ) => {
    try {
      // Step 1: Get basic project list (single API call)
      if (onProgress) onProgress(0, 'Fetching project list...');

      // For superadmins: Fetch all projects (no companyId filter)
      // For regular users: Fetch only their company's projects
      const listURL = companyId
        ? `${apiEndpoints.BASE_URL}/project?companyId=${companyId}`
        : `${apiEndpoints.BASE_URL}/project`;

      console.log('🌐 [OptimizedAPI] List URL:', listURL);

      const listResponse = await axiosInstance.get(listURL);

      console.log('🌐 [OptimizedAPI] Response status:', listResponse.status);
      console.log('🌐 [OptimizedAPI] Response data keys:', Object.keys(listResponse.data || {}));

      if (listResponse.status !== 200) {
        throw new Error('Failed to fetch project list');
      }

      const projects = listResponse.data?.data || [];
      const pagination = listResponse.data?.pagination || null;
      const projectCount = projects.length;

      console.log(`🌐 [OptimizedAPI] Got ${projectCount} projects from API`);

      if (pagination) {
        console.warn('⚠️ [OptimizedAPI] PAGINATION DETECTED - Backend is limiting results!');
        console.warn('📄 [OptimizedAPI] Pagination info:', pagination);
        console.warn(`⚠️ [OptimizedAPI] Only showing ${projectCount} of ${pagination.totalItems || 'unknown'} total projects!`);
        console.warn('⚠️ [OptimizedAPI] The backend API at /project needs to be updated to:');
        console.warn('   1. Return ALL projects for super users (no pagination), OR');
        console.warn('   2. Accept page/limit parameters to fetch all pages');
      }

      if (projectCount === 0) {
        console.log('⚠️ [OptimizedAPI] No projects returned from API!');
        return [];
      }

      if (onProgress) onProgress(10, `Found ${projectCount} projects`);

      // Step 2: Check if projects already have required data
      const firstProject = projects[0];
      const hasEnrichedData = firstProject.details && firstProject.site;

      if (hasEnrichedData) {
        console.debug('[OptimizedAPI] Projects already have enriched data');
        return projects;
      }

      // Step 3: Fetch details in parallel batches
      if (onProgress) onProgress(20, `Loading project details...`);
      
      const projectIds = projects.map((p: any) => p.uuid);
      const enrichedData = await getProjectDetailsOptimized(
        projectIds,
        companyId,
        {
          batchSize: 10,
          maxConcurrency: 5,
          onProgress: (progress, message) => {
            // Scale progress from 20-100%
            const scaledProgress = 20 + (progress * 0.8);
            if (onProgress) onProgress(scaledProgress, message);
          },
          useCache: true
        }
      );

      // Step 4: Merge enriched data with basic data
      const enrichedProjects = projects.map((basic: any) => {
        const enriched = enrichedData.find((e: any) => e.uuid === basic.uuid);
        
        if (enriched) {
          return {
            ...basic,
            ...enriched,
            details: enriched.details || basic.details || {},
            site: enriched.site || basic.site || {},
            system_details: enriched.system_details || basic.system_details || {}
          };
        }
        
        return basic;
      });

      return enrichedProjects;
    } catch (error) {
      console.error('[OptimizedAPI] Hybrid fetch failed:', error);
      throw error;
    }
  },
  'getProjectsHybrid'
);

/**
 * Clear project cache for a specific company or all
 */
export function clearProjectCache(companyId?: string) {
  if (companyId) {
    apiCache.clear(`project_.*_${companyId}`);
  } else {
    apiCache.clear('project_');
  }
}

/**
 * Prefetch projects for better perceived performance
 */
export async function prefetchProjects(
  projectIds: string[],
  companyId: string
) {
  // Fire and forget - don't await
  getProjectDetailsOptimized(projectIds, companyId, {
    useCache: true,
    batchSize: 20,
    maxConcurrency: 10
  }).catch(error => {
    console.warn('[OptimizedAPI] Prefetch failed:', error);
  });
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    size: apiCache.size(),
    // Add more stats as needed
  };
}