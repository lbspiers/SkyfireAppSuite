// src/hooks/useStreetViewSmartCaching.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import Toast from 'react-native-toast-message';

import {
  AddressComponents,
  CacheStatus,
  CacheMetadata,
  ConditionalCaptureRequest,
  ConditionalCaptureResponse,
  DataFreshnessIndicator,
  SmartCachingConfig,
  DEFAULT_CACHING_CONFIG,
  CachePerformanceMetrics,
  RefreshRecommendation,
} from '../types/streetViewCaching';

import {
  generateAddressHash,
  createCacheStatus,
  generateRefreshRecommendation,
  formatCacheStatusMessage,
} from '../utils/addressChangeDetection';

import { streetViewAnalyticsService } from '../services/streetViewAnalytics.service';

interface UseStreetViewSmartCachingReturn {
  // Cache status and data
  cacheStatus: CacheStatus | null;
  dataFreshness: DataFreshnessIndicator;
  cachedData: CacheMetadata | null;
  isCheckingCache: boolean;

  // Conditional capture methods
  checkDataFreshness: (projectId: string, address: AddressComponents) => Promise<CacheStatus>;
  conditionalCapture: (projectId: string, companyId: string, address: AddressComponents) => Promise<ConditionalCaptureResponse>;
  forceRefresh: (projectId: string, companyId: string, address: AddressComponents) => Promise<ConditionalCaptureResponse>;

  // Cache management
  clearCache: (projectId: string) => Promise<boolean>;
  getCacheMetadata: (projectId: string) => Promise<CacheMetadata | null>;

  // Performance and configuration
  performanceMetrics: CachePerformanceMetrics;
  updateConfig: (config: Partial<SmartCachingConfig>) => void;
  getRefreshRecommendation: () => RefreshRecommendation | null;

  // UI helpers
  formatLastUpdated: () => string;
  shouldShowRefreshButton: () => boolean;
  getCacheStatusMessage: () => string;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useStreetViewSmartCaching = (
  initialConfig: Partial<SmartCachingConfig> = {}
): UseStreetViewSmartCachingReturn => {
  // Configuration
  const [config, setConfig] = useState<SmartCachingConfig>({
    ...DEFAULT_CACHING_CONFIG,
    ...initialConfig,
  });

  // State management
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [cachedData, setCachedData] = useState<CacheMetadata | null>(null);
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState<CachePerformanceMetrics>({
    cacheHits: 0,
    cacheMisses: 0,
    apiCallsSaved: 0,
    totalChecks: 0,
    averageCheckTime: 0,
    lastResetDate: new Date(),
  });

  // Cache for current check to avoid duplicate requests
  const currentCheckRef = useRef<Map<string, Promise<CacheStatus>>>(new Map());

  /**
   * Derived data freshness indicator
   */
  const dataFreshness: DataFreshnessIndicator = {
    status: isCheckingCache ? 'checking' :
             cacheStatus?.exists ?
               (cacheStatus.isFresh ? 'fresh' : 'stale') :
               'missing',
    lastUpdated: cacheStatus?.lastUpdated,
    streetViewDate: cacheStatus?.cachedData?.streetViewDate,
    dataQuality: cacheStatus?.cachedData?.qualityScore,
    addressChanged: cacheStatus?.addressChanged,
    recommendsRefresh: cacheStatus?.recommendRefresh,
    message: cacheStatus ? formatCacheStatusMessage(cacheStatus) : undefined,
  };

  /**
   * Get cache metadata from backend
   */
  const getCacheMetadata = useCallback(async (projectId: string): Promise<CacheMetadata | null> => {
    const startTime = Date.now();

    try {
      // Call backend metadata endpoint
      const response = await fetch(`${streetViewAnalyticsService['baseUrl']}/analytics/streetview/metadata/${projectId}`);

      const responseTime = Date.now() - startTime;

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        totalChecks: prev.totalChecks + 1,
        averageCheckTime: (prev.averageCheckTime * (prev.totalChecks - 1) + responseTime) / prev.totalChecks,
      }));

      if (response.status === 404) {
        // No cached data exists
        setPerformanceMetrics(prev => ({
          ...prev,
          cacheMisses: prev.cacheMisses + 1,
        }));
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get cache metadata: ${response.status}`);
      }

      const metadata: CacheMetadata = await response.json();

      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHits: prev.cacheHits + 1,
      }));

      return metadata;

    } catch (error) {
      console.error('Error getting cache metadata:', error);
      setError(error instanceof Error ? error.message : 'Failed to check cache');

      setPerformanceMetrics(prev => ({
        ...prev,
        cacheMisses: prev.cacheMisses + 1,
      }));

      return null;
    }
  }, []);

  /**
   * Check data freshness for a project and address
   */
  const checkDataFreshness = useCallback(async (
    projectId: string,
    address: AddressComponents
  ): Promise<CacheStatus> => {
    const cacheKey = `${projectId}-${generateAddressHash(address)}`;

    // Check if we're already checking this project/address combination
    if (currentCheckRef.current.has(cacheKey)) {
      return currentCheckRef.current.get(cacheKey)!;
    }

    setIsCheckingCache(true);
    setError(null);

    const checkPromise = (async (): Promise<CacheStatus> => {
      try {
        const metadata = await getCacheMetadata(projectId);
        const status = createCacheStatus(address, metadata, config);

        setCacheStatus(status);
        setCachedData(metadata);

        return status;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Cache check failed';
        setError(errorMessage);

        // Return a default cache status indicating error
        return {
          exists: false,
          isFresh: false,
          lastUpdated: new Date(),
          addressChanged: false,
          recommendRefresh: true,
          reason: 'first_capture',
        };
      } finally {
        setIsCheckingCache(false);
        currentCheckRef.current.delete(cacheKey);
      }
    })();

    currentCheckRef.current.set(cacheKey, checkPromise);
    return checkPromise;
  }, [config, getCacheMetadata]);

  /**
   * Conditional capture - only calls API if needed
   */
  const conditionalCapture = useCallback(async (
    projectId: string,
    companyId: string,
    address: AddressComponents
  ): Promise<ConditionalCaptureResponse> => {
    setError(null);

    try {
      // First check cache status
      const status = await checkDataFreshness(projectId, address);

      // If data is fresh and address hasn't changed, return cached data
      if (status.isFresh && !status.recommendRefresh && status.cachedData) {
        setPerformanceMetrics(prev => ({
          ...prev,
          apiCallsSaved: prev.apiCallsSaved + 1,
        }));

        Toast.show({
          text1: 'Using Cached Data',
          text2: formatCacheStatusMessage(status),
          type: 'info',
          visibilityTime: 2000,
        });

        return {
          success: true,
          cached: true,
          dataAge: status.lastUpdated.toISOString(),
          source: 'cached',
          cacheStatus: status,
        };
      }

      // Build full address string
      const fullAddress = [address.address, address.city, address.state, address.zipCode]
        .filter(Boolean)
        .join(', ');

      // Call backend with conditional capture request
      const request: ConditionalCaptureRequest = {
        projectId,
        companyId,
        address: fullAddress,
        forceRefresh: false,
        currentAddressComponents: address,
      };

      const result = await streetViewAnalyticsService.captureStreetViewAnalytics({
        projectId,
        companyId,
        address: fullAddress,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      });

      if (result.success && result.data) {
        // Update cache status after successful capture
        await checkDataFreshness(projectId, address);

        Toast.show({
          text1: 'Data Updated',
          text2: `Quality: ${result.data.analytics.dataQualityScore}/10`,
          type: 'success',
          visibilityTime: 3000,
        });

        return {
          success: true,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          data: result.data,
          cacheStatus: cacheStatus,
        };
      } else {
        return {
          success: false,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          error: result.error || 'Capture failed',
          cacheStatus: status,
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conditional capture failed';
      setError(errorMessage);

      return {
        success: false,
        cached: false,
        dataAge: new Date().toISOString(),
        source: 'fresh_api',
        error: errorMessage,
      };
    }
  }, [checkDataFreshness, cacheStatus]);

  /**
   * Force refresh - always calls API regardless of cache status
   */
  const forceRefresh = useCallback(async (
    projectId: string,
    companyId: string,
    address: AddressComponents
  ): Promise<ConditionalCaptureResponse> => {
    setError(null);

    Toast.show({
      text1: 'Refreshing Data',
      text2: 'Forcing fresh Street View capture...',
      type: 'info',
      visibilityTime: 2000,
    });

    try {
      // Build full address string
      const fullAddress = [address.address, address.city, address.state, address.zipCode]
        .filter(Boolean)
        .join(', ');

      const result = await streetViewAnalyticsService.captureStreetViewAnalytics({
        projectId,
        companyId,
        address: fullAddress,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      });

      if (result.success && result.data) {
        // Update cache status after successful refresh
        await checkDataFreshness(projectId, address);

        Toast.show({
          text1: 'Data Refreshed',
          text2: `New quality score: ${result.data.analytics.dataQualityScore}/10`,
          type: 'success',
          visibilityTime: 3000,
        });

        return {
          success: true,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          data: result.data,
          cacheStatus: cacheStatus,
        };
      } else {
        return {
          success: false,
          cached: false,
          dataAge: new Date().toISOString(),
          source: 'fresh_api',
          error: result.error || 'Force refresh failed',
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force refresh failed';
      setError(errorMessage);

      return {
        success: false,
        cached: false,
        dataAge: new Date().toISOString(),
        source: 'fresh_api',
        error: errorMessage,
      };
    }
  }, [checkDataFreshness, cacheStatus]);

  /**
   * Clear cache for a specific project
   */
  const clearCache = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      // Call backend to clear cache (if implemented)
      const response = await fetch(
        `${streetViewAnalyticsService['baseUrl']}/analytics/streetview/cache/${projectId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setCacheStatus(null);
        setCachedData(null);

        Toast.show({
          text1: 'Cache Cleared',
          text2: 'Street View data cache cleared',
          type: 'info',
          visibilityTime: 2000,
        });

        return true;
      }

      return false;

    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<SmartCachingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Get refresh recommendation based on current cache status
   */
  const getRefreshRecommendation = useCallback((): RefreshRecommendation | null => {
    if (!cacheStatus) return null;
    return generateRefreshRecommendation(cacheStatus, config);
  }, [cacheStatus, config]);

  /**
   * Format last updated date for display
   */
  const formatLastUpdated = useCallback((): string => {
    if (!cacheStatus?.lastUpdated) return 'Never';

    const now = new Date();
    const diff = now.getTime() - cacheStatus.lastUpdated.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return `${days} days ago`;
    }
  }, [cacheStatus]);

  /**
   * Determine if refresh button should be shown
   */
  const shouldShowRefreshButton = useCallback((): boolean => {
    const recommendation = getRefreshRecommendation();
    return recommendation?.shouldRefresh === true;
  }, [getRefreshRecommendation]);

  /**
   * Get cache status message for display
   */
  const getCacheStatusMessage = useCallback((): string => {
    return cacheStatus ? formatCacheStatusMessage(cacheStatus) : 'No cache data';
  }, [cacheStatus]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Cache status and data
    cacheStatus,
    dataFreshness,
    cachedData,
    isCheckingCache,

    // Conditional capture methods
    checkDataFreshness,
    conditionalCapture,
    forceRefresh,

    // Cache management
    clearCache,
    getCacheMetadata,

    // Performance and configuration
    performanceMetrics,
    updateConfig,
    getRefreshRecommendation,

    // UI helpers
    formatLastUpdated,
    shouldShowRefreshButton,
    getCacheStatusMessage,

    // Error handling
    error,
    clearError,
  };
};