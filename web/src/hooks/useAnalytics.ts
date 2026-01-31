/**
 * useAnalytics Hook
 *
 * Provides analytics tracking functionality for React components
 *
 * Features:
 * - Automatic page view tracking on mount/route change
 * - Automatic page exit tracking on unmount
 * - Event tracking helpers
 * - Feature usage tracking
 * - Component-scoped tracking
 *
 * Usage:
 *   const { trackEvent, trackFeature, trackClick } = useAnalytics('ComponentName');
 *
 *   trackEvent('button_clicked', { buttonId: 'save' });
 *   trackFeature('stringing_calculator', 'completed', { duration: 1500 });
 *   trackClick('save-button', 'Save Project');
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analyticsService';

interface UseAnalyticsOptions {
  trackPageView?: boolean; // Auto-track page view on mount (default: true)
  componentName?: string;  // Component name for context
}

interface UseAnalyticsReturn {
  trackEvent: (
    eventName: string,
    properties?: Record<string, any>,
    options?: { immediate?: boolean }
  ) => void;
  trackClick: (elementId: string, elementText?: string, properties?: Record<string, any>) => void;
  trackFormSubmit: (formName: string, success: boolean, properties?: Record<string, any>) => void;
  trackFeature: (
    featureName: string,
    action: 'started' | 'completed' | 'abandoned' | 'error',
    properties?: Record<string, any>
  ) => void;
  trackSearch: (query: string, resultCount: number, category?: string) => void;
  trackProjectAction: (action: string, projectUuid: string, properties?: Record<string, any>) => void;
  trackPerformance: (
    name: string,
    duration: number,
    properties?: Record<string, any>
  ) => void;
}

export function useAnalytics(
  componentNameOrOptions?: string | UseAnalyticsOptions
): UseAnalyticsReturn {
  const location = useLocation();
  const previousPathRef = useRef<string>('');

  // Parse options
  const options: UseAnalyticsOptions =
    typeof componentNameOrOptions === 'string'
      ? { componentName: componentNameOrOptions, trackPageView: true }
      : { trackPageView: true, ...componentNameOrOptions };

  const { trackPageView, componentName } = options;

  // Track page views automatically
  useEffect(() => {
    if (!trackPageView) return;

    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    // Track navigation if path changed
    if (previousPath && previousPath !== currentPath) {
      analytics.trackNavigation(previousPath, currentPath, 'programmatic');
    }

    // Track page view
    analytics.trackPageView();

    // Update ref
    previousPathRef.current = currentPath;
  }, [location.pathname, trackPageView]);

  // Wrapped tracking methods with component context
  const trackEvent = useCallback(
    (
      eventName: string,
      properties: Record<string, any> = {},
      eventOptions: { immediate?: boolean } = {}
    ) => {
      analytics.track(eventName, properties, {
        ...eventOptions,
        componentName,
      });
    },
    [componentName]
  );

  const trackClick = useCallback(
    (elementId: string, elementText?: string, properties: Record<string, any> = {}) => {
      analytics.trackClick(elementId, elementText, {
        ...properties,
        componentName,
      });
    },
    [componentName]
  );

  const trackFormSubmit = useCallback(
    (formName: string, success: boolean, properties: Record<string, any> = {}) => {
      analytics.trackFormSubmit(formName, success, {
        ...properties,
        componentName,
      });
    },
    [componentName]
  );

  const trackFeature = useCallback(
    (
      featureName: string,
      action: 'started' | 'completed' | 'abandoned' | 'error',
      properties: Record<string, any> = {}
    ) => {
      analytics.trackFeatureUse(featureName, action, {
        ...properties,
        componentName,
      });
    },
    [componentName]
  );

  const trackSearch = useCallback(
    (query: string, resultCount: number, category?: string) => {
      analytics.trackSearch(query, resultCount, category);
    },
    []
  );

  const trackProjectAction = useCallback(
    (action: string, projectUuid: string, properties: Record<string, any> = {}) => {
      analytics.trackProjectAction(action, projectUuid, {
        ...properties,
        componentName,
      });
    },
    [componentName]
  );

  const trackPerformance = useCallback(
    (name: string, duration: number, properties: Record<string, any> = {}) => {
      analytics.trackPerformance({
        resourceType: 'custom',
        url: name,
        duration,
        ...properties,
      });
    },
    []
  );

  return {
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackFeature,
    trackSearch,
    trackProjectAction,
    trackPerformance,
  };
}

/**
 * useFeatureTracking Hook
 *
 * Specialized hook for tracking feature usage with automatic lifecycle management
 *
 * Usage:
 *   const { startFeature, completeFeature, abandonFeature, errorFeature } = useFeatureTracking('stringing_calculator');
 *
 *   useEffect(() => {
 *     startFeature({ projectUuid });
 *     return () => abandonFeature();
 *   }, []);
 */
export function useFeatureTracking(featureName: string, featureCategory?: string) {
  const startTimeRef = useRef<number>(0);

  const startFeature = useCallback(
    (context?: Record<string, any>) => {
      startTimeRef.current = Date.now();
      analytics.trackFeatureUse(featureName, 'started', {
        featureCategory,
        context,
      });
    },
    [featureName, featureCategory]
  );

  const completeFeature = useCallback(
    (context?: Record<string, any>) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
      analytics.trackFeatureUse(featureName, 'completed', {
        featureCategory,
        duration,
        context,
      });
      startTimeRef.current = 0;
    },
    [featureName, featureCategory]
  );

  const abandonFeature = useCallback(
    (context?: Record<string, any>) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
      analytics.trackFeatureUse(featureName, 'abandoned', {
        featureCategory,
        duration,
        context,
      });
      startTimeRef.current = 0;
    },
    [featureName, featureCategory]
  );

  const errorFeature = useCallback(
    (errorMessage: string, context?: Record<string, any>) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
      analytics.trackFeatureUse(featureName, 'error', {
        featureCategory,
        duration,
        errorMessage,
        context,
      });
      startTimeRef.current = 0;
    },
    [featureName, featureCategory]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startTimeRef.current) {
        abandonFeature({ reason: 'component_unmount' });
      }
    };
  }, [abandonFeature]);

  return {
    startFeature,
    completeFeature,
    abandonFeature,
    errorFeature,
  };
}

export default useAnalytics;
