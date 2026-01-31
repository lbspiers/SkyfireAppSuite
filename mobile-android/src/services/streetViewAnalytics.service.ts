// src/services/streetViewAnalytics.service.ts

import {
  StreetViewAnalyticsRequest,
  StreetViewCaptureResult,
  StreetViewCaptureProgress,
  StreetViewAnalyticsResponse,
  BackendGeocodingData,
  BackendStreetViewData,
  BackendAnalyticsData,
  BatchCaptureRequest,
  BatchCaptureResult,
  MarketSummary
} from '../types/streetViewAnalytics';

import {
  CacheMetadata,
  ConditionalCaptureRequest,
  ConditionalCaptureResponse,
  AddressComponents,
} from '../types/streetViewCaching';

import {
  calculateBearing,
  calculateOptimalHeading,
  calculateDataQualityScore,
  extractAddressComponents,
  classifyRegion,
  generateStreetViewImageUrl,
  generateS3Key,
  validateCoordinates,
  calculateProcessingTime,
  determineStreetOrientation
} from '../utils/geoCalculations';

// Environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBTIEUeUnP1QWoLBzmdWE1x0R_N4UlN4dQ';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Street View Analytics Service
 * Handles comprehensive geocoding, Street View analysis, and data capture
 */
export class StreetViewAnalyticsService {
  private apiKey: string;
  private baseUrl: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // milliseconds

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || GOOGLE_MAPS_API_KEY;
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Main capture method - simplified to work with actual backend API
   */
  async captureStreetViewAnalytics(
    request: StreetViewAnalyticsRequest,
    progressCallback?: (progress: StreetViewCaptureProgress) => void
  ): Promise<StreetViewCaptureResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Progress: Starting analysis
      progressCallback?.({
        stage: 'geocoding',
        progress: 10,
        message: 'Analyzing address and coordinates...',
        startTime,
      });

      // Build full address string
      const fullAddress = [request.address, request.city, request.state, request.zipCode]
        .filter(Boolean)
        .join(', ');

      // Progress: Sending to backend
      progressCallback?.({
        stage: 'streetview_metadata',
        progress: 50,
        message: 'Processing Street View analytics...',
        startTime,
      });

      // Call the working backend API
      const response = await this.withRetry(async () => {
        const apiResponse = await fetch(`${this.baseUrl}/analytics/streetview/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: request.projectId,
            companyId: request.companyId,
            address: fullAddress,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
        }

        return apiResponse.json();
      });

      const analyticsResponse: StreetViewAnalyticsResponse = response;

      // Progress: Processing complete
      progressCallback?.({
        stage: 'complete',
        progress: 100,
        message: 'Street View analytics capture complete',
        startTime,
        warnings,
      });

      // Handle backend response
      if (analyticsResponse.success && analyticsResponse.data) {
        return {
          success: true,
          data: analyticsResponse.data,
          warnings,
          processingTimeMs: calculateProcessingTime(startTime),
        };
      } else {
        return {
          success: false,
          error: analyticsResponse.error || 'Backend processing failed',
          warnings,
          processingTimeMs: calculateProcessingTime(startTime),
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      progressCallback?.({
        stage: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
        startTime,
        errors: [errorMessage],
        warnings,
      });

      return {
        success: false,
        error: errorMessage,
        warnings,
        processingTimeMs: calculateProcessingTime(startTime),
      };
    }
  }

  /**
   * Check cache status using the new backend endpoint
   */
  async checkCache(projectId: string): Promise<import('../types/streetViewCaching').CacheCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/streetview/check/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cache check failed: ${response.status} ${response.statusText}`);
      }

      return response.json();

    } catch (error) {
      console.error('Error checking cache:', error);
      // Return fallback response indicating cache miss with error
      return {
        exists: false,
        shouldRefresh: true,
        reason: 'error_fallback',
      };
    }
  }

  /**
   * Get cache metadata for a project (for smart caching)
   */
  async getCacheMetadata(projectId: string): Promise<CacheMetadata | null> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/streetview/metadata/${projectId}`);

      if (response.status === 404) {
        return null; // No cached data exists
      }

      if (!response.ok) {
        throw new Error(`Failed to get cache metadata: ${response.status}`);
      }

      return response.json();

    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return null;
    }
  }

  /**
   * Conditional Street View capture - implements cache-first approach
   */
  async conditionalStreetViewCapture(
    projectId: string,
    companyId: string,
    address: string,
    forceRefresh: boolean = false
  ): Promise<ConditionalCaptureResponse> {
    try {
      // Step 1: Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cacheCheck = await this.checkCache(projectId);

        if (cacheCheck.exists && !cacheCheck.shouldRefresh) {
          // Use cached data
          return {
            success: true,
            cached: true,
            dataAge: cacheCheck.lastUpdated || new Date().toISOString(),
            source: 'cached',
            message: 'Using cached Street View data',
          };
        }
      }

      // Step 2: Capture fresh data if cache miss or refresh needed
      const captureResult = await this.captureStreetViewAnalytics({
        projectId,
        companyId,
        address,
        city: '', // Will be extracted from full address
        state: '',
        zipCode: '',
      });

      if (captureResult.success && captureResult.data) {
        return {
          success: true,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          data: captureResult.data,
          message: 'Fresh Street View data captured',
        };
      } else {
        return {
          success: false,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          error: captureResult.error || 'Capture failed',
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conditional capture failed';

      return {
        success: false,
        cached: false,
        dataAge: new Date().toISOString(),
        source: 'fresh_api',
        error: errorMessage,
      };
    }
  }

  /**
   * Conditional capture - checks cache first, only calls API if needed
   */
  async conditionalCaptureAnalytics(
    request: ConditionalCaptureRequest
  ): Promise<ConditionalCaptureResponse> {
    try {
      const response = await this.withRetry(async () => {
        const apiResponse = await fetch(`${this.baseUrl}/analytics/streetview/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!apiResponse.ok) {
          throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
        }

        return apiResponse.json();
      });

      return response as ConditionalCaptureResponse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conditional capture failed';

      return {
        success: false,
        cached: false,
        dataAge: new Date().toISOString(),
        source: 'fresh_api',
        error: errorMessage,
      };
    }
  }

  /**
   * Clear cache for a specific project
   */
  async clearProjectCache(projectId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/streetview/cache/${projectId}`, {
        method: 'DELETE',
      });

      return response.ok;

    } catch (error) {
      console.error('Error clearing project cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics for performance monitoring
   */
  async getCacheStatistics(companyId?: string): Promise<import('../types/streetViewCaching').BackendCacheStats> {
    try {
      const params = companyId ? `?companyId=${companyId}` : '';
      const response = await fetch(`${this.baseUrl}/analytics/streetview/cache/stats${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get cache statistics: ${response.status}`);
      }

      return response.json();

    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return {
        totalProjects: 0,
        cachedProjects: 0,
        cacheHitRate: 0,
        avgDataAge: 0,
        totalApiCallsSaved: 0,
      };
    }
  }

  /**
   * Batch capture for multiple projects (simplified version)
   */
  async batchCapture(
    request: BatchCaptureRequest,
    progressCallback?: (projectId: string, progress: StreetViewCaptureProgress) => void
  ): Promise<BatchCaptureResult> {
    const startTime = Date.now();
    const results: BatchCaptureResult['results'] = [];
    const concurrency = Math.min(request.concurrency || 2, 2); // Limit to 2 concurrent requests

    // Process in small batches to avoid overwhelming the backend
    for (let i = 0; i < request.projects.length; i += concurrency) {
      const batch = request.projects.slice(i, i + concurrency);

      const batchPromises = batch.map(async (project) => {
        try {
          const result = await this.captureStreetViewAnalytics(
            project,
            (progress) => progressCallback?.(project.projectId, progress)
          );

          return {
            projectId: project.projectId,
            success: result.success,
            data: result.data as any, // Cast to match expected type
            error: result.error,
          };

        } catch (error) {
          return {
            projectId: project.projectId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches to be respectful to backend
      if (i + concurrency < request.projects.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      totalProjects: request.projects.length,
      successful,
      failed,
      results,
      totalProcessingTimeMs: calculateProcessingTime(startTime),
    };
  }

  /**
   * Retrieve analytics data for a project (placeholder - not yet implemented in backend)
   */
  async getProjectAnalytics(projectId: string): Promise<any | null> {
    try {
      // TODO: Implement when backend endpoint is ready
      console.log('getProjectAnalytics called for project:', projectId);
      console.log('Note: Backend endpoint not yet implemented');

      // For now, return null indicating no data found
      return null;

    } catch (error) {
      console.error('Error retrieving project analytics:', error);
      return null;
    }
  }

  /**
   * Get market summary analytics (placeholder - not yet implemented in backend)
   */
  async getMarketSummary(
    companyId?: string,
    filters?: Record<string, any>
  ): Promise<MarketSummary> {
    try {
      // TODO: Implement when backend endpoint is ready
      console.log('getMarketSummary called for company:', companyId);
      console.log('Note: Backend endpoint not yet implemented');

      // Return placeholder data structure
      return {
        total_projects: 0,
        by_market_type: {},
        by_region: {},
        avg_data_quality_score: 0,
        streetview_availability_rate: 0,
        geocoding_accuracy_distribution: {},
      };

    } catch (error) {
      console.error('Error getting market summary:', error);
      throw error;
    }
  }

  /**
   * Utility method for API calls with retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.retryAttempts
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.withRetry(operation, attempts - 1);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const streetViewAnalyticsService = new StreetViewAnalyticsService();