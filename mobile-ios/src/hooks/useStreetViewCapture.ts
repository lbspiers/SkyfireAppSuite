// src/hooks/useStreetViewCapture.ts

import { useState, useCallback, useRef } from 'react';
import Toast from 'react-native-toast-message';

import {
  StreetViewAnalyticsRequest,
  StreetViewCaptureProgress,
  StreetViewCaptureResult,
  BackendGeocodingData,
  BackendStreetViewData,
  BackendAnalyticsData,
  BatchCaptureRequest,
  BatchCaptureResult,
  MarketSummary
} from '../types/streetViewAnalytics';

import { streetViewAnalyticsService } from '../services/streetViewAnalytics.service';

interface UseStreetViewCaptureReturn {
  // Single capture
  captureStreetViewAnalytics: (request: StreetViewAnalyticsRequest) => Promise<StreetViewCaptureResult>;
  isCapturing: boolean;
  progress: StreetViewCaptureProgress | null;
  error: string | null;
  lastCapturedData: { geocoding: BackendGeocodingData; streetView: BackendStreetViewData; analytics: BackendAnalyticsData; } | null;

  // Batch capture
  batchCapture: (request: BatchCaptureRequest) => Promise<BatchCaptureResult>;
  isBatchCapturing: boolean;
  batchProgress: Map<string, StreetViewCaptureProgress>;
  batchResults: BatchCaptureResult | null;

  // Data retrieval
  getProjectAnalytics: (projectId: string) => Promise<any | null>;
  getMarketSummary: (companyId?: string, filters?: Record<string, any>) => Promise<MarketSummary>;

  // Utility methods
  clearError: () => void;
  clearProgress: () => void;
  cancelCapture: () => void;
}

export const useStreetViewCapture = (): UseStreetViewCaptureReturn => {
  // Single capture state
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState<StreetViewCaptureProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCapturedData, setLastCapturedData] = useState<{ geocoding: BackendGeocodingData; streetView: BackendStreetViewData; analytics: BackendAnalyticsData; } | null>(null);

  // Batch capture state
  const [isBatchCapturing, setIsBatchCapturing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<Map<string, StreetViewCaptureProgress>>(new Map());
  const [batchResults, setBatchResults] = useState<BatchCaptureResult | null>(null);

  // Cancellation support
  const cancelRef = useRef(false);

  /**
   * Main capture method with comprehensive error handling and user feedback
   */
  const captureStreetViewAnalytics = useCallback(async (
    request: StreetViewAnalyticsRequest
  ): Promise<StreetViewCaptureResult> => {
    if (isCapturing) {
      const errorMsg = 'Capture already in progress';
      Toast.show({
        text1: 'Capture In Progress',
        text2: errorMsg,
        type: 'info'
      });
      return { success: false, error: errorMsg, processingTimeMs: 0 };
    }

    setIsCapturing(true);
    setError(null);
    setProgress(null);
    cancelRef.current = false;

    try {
      const result = await streetViewAnalyticsService.captureStreetViewAnalytics(
        request,
        (progressUpdate) => {
          // Check for cancellation
          if (cancelRef.current) {
            throw new Error('Capture cancelled by user');
          }

          setProgress(progressUpdate);

          // Show progress toasts for major milestones
          if (progressUpdate.stage === 'geocoding' && progressUpdate.progress === 10) {
            Toast.show({
              text1: 'Street View Analytics',
              text2: 'Analyzing address coordinates...',
              type: 'info',
              visibilityTime: 2000
            });
          } else if (progressUpdate.stage === 'streetview_metadata' && progressUpdate.progress === 30) {
            Toast.show({
              text1: 'Street View Analytics',
              text2: 'Checking Street View availability...',
              type: 'info',
              visibilityTime: 2000
            });
          } else if (progressUpdate.stage === 'image_generation' && progressUpdate.progress === 50) {
            Toast.show({
              text1: 'Street View Analytics',
              text2: 'Capturing and uploading images...',
              type: 'info',
              visibilityTime: 2000
            });
          }
        }
      );

      if (result.success && result.data) {
        setLastCapturedData(result.data);

        // Show meaningful data from the actual backend response
        const { analytics, streetView } = result.data;
        const qualityScore = analytics.dataQualityScore || 0;
        const streetViewStatus = analytics.streetViewAvailable ? 'Available' : 'Not Available';

        Toast.show({
          text1: 'Analytics Captured',
          text2: `Quality: ${qualityScore}/10, Street View: ${streetViewStatus}`,
          type: 'success',
          visibilityTime: 3000
        });

        // Show warnings if any
        if (result.warnings?.length) {
          setTimeout(() => {
            Toast.show({
              text1: 'Analytics Warnings',
              text2: result.warnings![0], // Show first warning
              type: 'info',
              visibilityTime: 4000
            });
          }, 3500);
        }
      } else {
        setError(result.error || 'Unknown error occurred');

        Toast.show({
          text1: 'Capture Failed',
          text2: result.error || 'Failed to capture Street View analytics',
          type: 'error',
          visibilityTime: 4000
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      if (!cancelRef.current) {
        Toast.show({
          text1: 'Capture Error',
          text2: errorMessage,
          type: 'error',
          visibilityTime: 4000
        });
      }

      return {
        success: false,
        error: errorMessage,
        processingTimeMs: 0
      };

    } finally {
      setIsCapturing(false);
      // Keep progress visible for a moment, then clear
      setTimeout(() => {
        if (!cancelRef.current) {
          setProgress(null);
        }
      }, 2000);
    }
  }, [isCapturing]);

  /**
   * Batch capture with progress tracking for multiple projects
   */
  const batchCapture = useCallback(async (
    request: BatchCaptureRequest
  ): Promise<BatchCaptureResult> => {
    if (isBatchCapturing) {
      const errorMsg = 'Batch capture already in progress';
      Toast.show({
        text1: 'Batch Capture In Progress',
        text2: errorMsg,
        type: 'info'
      });
      return {
        totalProjects: 0,
        successful: 0,
        failed: 0,
        results: [],
        totalProcessingTimeMs: 0
      };
    }

    setIsBatchCapturing(true);
    setBatchProgress(new Map());
    setBatchResults(null);
    setError(null);
    cancelRef.current = false;

    Toast.show({
      text1: 'Batch Capture Started',
      text2: `Processing ${request.projects.length} projects...`,
      type: 'info',
      visibilityTime: 3000
    });

    try {
      const result = await streetViewAnalyticsService.batchCapture(
        request,
        (projectId, progressUpdate) => {
          if (cancelRef.current) {
            throw new Error('Batch capture cancelled by user');
          }

          setBatchProgress(prev => {
            const newMap = new Map(prev);
            newMap.set(projectId, progressUpdate);
            return newMap;
          });
        }
      );

      setBatchResults(result);

      Toast.show({
        text1: 'Batch Capture Complete',
        text2: `${result.successful} successful, ${result.failed} failed`,
        type: result.failed === 0 ? 'success' : 'info',
        visibilityTime: 4000
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch capture failed';
      setError(errorMessage);

      if (!cancelRef.current) {
        Toast.show({
          text1: 'Batch Capture Error',
          text2: errorMessage,
          type: 'error',
          visibilityTime: 4000
        });
      }

      return {
        totalProjects: request.projects.length,
        successful: 0,
        failed: request.projects.length,
        results: [],
        totalProcessingTimeMs: 0
      };

    } finally {
      setIsBatchCapturing(false);
    }
  }, [isBatchCapturing]);

  /**
   * Retrieve analytics data for a specific project
   */
  const getProjectAnalytics = useCallback(async (
    projectId: string
  ): Promise<any | null> => {
    try {
      return await streetViewAnalyticsService.getProjectAnalytics(projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve analytics';
      setError(errorMessage);

      Toast.show({
        text1: 'Retrieval Error',
        text2: errorMessage,
        type: 'error',
        visibilityTime: 3000
      });

      return null;
    }
  }, []);

  /**
   * Get market summary analytics
   */
  const getMarketSummary = useCallback(async (
    companyId?: string,
    filters?: Record<string, any>
  ): Promise<MarketSummary> => {
    try {
      return await streetViewAnalyticsService.getMarketSummary(companyId, filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get market summary';
      setError(errorMessage);

      Toast.show({
        text1: 'Market Summary Error',
        text2: errorMessage,
        type: 'error',
        visibilityTime: 3000
      });

      throw error;
    }
  }, []);

  /**
   * Cancel ongoing capture operation
   */
  const cancelCapture = useCallback(() => {
    cancelRef.current = true;
    setIsCapturing(false);
    setIsBatchCapturing(false);
    setProgress(null);
    setBatchProgress(new Map());

    Toast.show({
      text1: 'Capture Cancelled',
      text2: 'Street View analytics capture was cancelled',
      type: 'info',
      visibilityTime: 2000
    });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear progress state
   */
  const clearProgress = useCallback(() => {
    setProgress(null);
    setBatchProgress(new Map());
  }, []);

  return {
    // Single capture
    captureStreetViewAnalytics,
    isCapturing,
    progress,
    error,
    lastCapturedData,

    // Batch capture
    batchCapture,
    isBatchCapturing,
    batchProgress,
    batchResults,

    // Data retrieval
    getProjectAnalytics,
    getMarketSummary,

    // Utility methods
    clearError,
    clearProgress,
    cancelCapture,
  };
};

/**
 * Hook for simplified analytics capture with minimal UI feedback
 * Useful for background/automatic capture scenarios
 */
export const useStreetViewCaptureSimple = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAnalytics = useCallback(async (
    request: StreetViewAnalyticsRequest
  ): Promise<boolean> => {
    if (isCapturing) return false;

    setIsCapturing(true);
    try {
      const result = await streetViewAnalyticsService.captureStreetViewAnalytics(request);
      return result.success;
    } catch (error) {
      console.error('Street View analytics capture error:', error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    captureAnalytics,
    isCapturing
  };
};

/**
 * Hook for analytics data queries only (no capture functionality)
 */
export const useStreetViewAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectAnalytics = useCallback(async (
    projectId: string
  ): Promise<StreetViewAnalyticsData | null> => {
    setLoading(true);
    setError(null);

    try {
      return await streetViewAnalyticsService.getProjectAnalytics(projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve analytics';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMarketSummary = useCallback(async (
    companyId?: string,
    filters?: Record<string, any>
  ): Promise<MarketSummary | null> => {
    setLoading(true);
    setError(null);

    try {
      return await streetViewAnalyticsService.getMarketSummary(companyId, filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get market summary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getProjectAnalytics,
    getMarketSummary,
    loading,
    error
  };
};