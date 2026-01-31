/**
 * Analytics Service - Track user interactions, performance, and errors
 *
 * Features:
 * - Session management (start, heartbeat, end)
 * - Event tracking (clicks, navigation, form submissions)
 * - Page view tracking with Web Vitals
 * - Performance monitoring (API calls, resources)
 * - Error tracking (JS errors, API errors, React errors)
 * - Feature usage tracking
 *
 * Usage:
 *   import { analytics } from './services/analyticsService';
 *
 *   analytics.track('button_clicked', { buttonId: 'save-project' });
 *   analytics.trackFeatureUse('stringing_calculator', 'completed', { duration: 1500 });
 */

import axiosInstance from '../api/axiosInstance';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// FEATURE FLAG
// ============================================
// TODO: Set to true when backend analytics endpoints are deployed
const ANALYTICS_ENABLED = false;

// ============================================
// TYPES
// ============================================

interface DeviceInfo {
  deviceId: string;
  touchEnabled: boolean;
  platform: string;
}

interface ScreenInfo {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
}

interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  eventCategory?: string;
  pageUrl?: string;
  pagePath?: string;
  pageTitle?: string;
  componentName?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  eventSequence?: number;
}

interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
}

interface PerformanceMetric {
  resourceType: string;
  url: string;
  method?: string;
  duration: number;
  statusCode?: number;
  responseSize?: number;
  cached?: boolean;
  endpoint?: string;
  isError?: boolean;
  errorMessage?: string;
}

// ============================================
// ANALYTICS SERVICE CLASS
// ============================================

class AnalyticsService {
  private sessionId: string | null = null;
  private currentPageViewId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private eventSequence: number = 0;
  private flushInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionStartTime: number = 0;
  private lastEventTime: number = 0;
  private pageEntryTime: number = 0;
  private scrollDepth: number = 0;
  private interactionCount: number = 0;
  private focusTime: number = 0;
  private isFocused: boolean = true;
  private focusStartTime: number = 0;
  private isInitialized: boolean = false;
  private enabled: boolean = true;

  // Singleton instance
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async init(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Check feature flag
    if (!ANALYTICS_ENABLED) {
      this.enabled = false;
      this.isInitialized = true;
      console.log('[Analytics] Disabled - backend endpoints not yet deployed');
      return;
    }

    try {
      // Check for existing session
      const existingSession = sessionStorage.getItem('analytics_session_id');
      const sessionStart = sessionStorage.getItem('analytics_session_start');

      if (existingSession && sessionStart) {
        this.sessionId = existingSession;
        this.sessionStartTime = parseInt(sessionStart, 10);
        console.log('[Analytics] Resumed session:', this.sessionId);
      } else {
        await this.startSession();
      }

      // Setup automatic tracking
      this.setupEventListeners();
      this.setupPerformanceObserver();
      this.startHeartbeat();
      this.startEventFlush();

      this.isInitialized = true;
      console.log('[Analytics] Service initialized');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
      this.enabled = false;
    }
  }

  async startSession(): Promise<void> {
    if (!ANALYTICS_ENABLED || !this.enabled) return;

    try {
      const deviceInfo = this.getDeviceInfo();
      const screenInfo = this.getScreenInfo();
      const utmParams = this.getUTMParams();

      const response = await axiosInstance.post('/analytics/session/start', {
        deviceInfo,
        screenInfo,
        entryUrl: window.location.href,
        referrer: document.referrer,
        utmParams,
        appVersion: process.env.REACT_APP_VERSION || '1.0.0',
        isPWA: this.isPWA(),
        isMobileApp: false,
      });

      this.sessionId = response.data.sessionId;
      this.sessionStartTime = Date.now();

      sessionStorage.setItem('analytics_session_id', this.sessionId);
      sessionStorage.setItem('analytics_session_start', String(this.sessionStartTime));

      console.log('[Analytics] Session started:', this.sessionId);
    } catch (error) {
      console.error('[Analytics] Failed to start session:', error);
      // Generate local session ID as fallback
      this.sessionId = `local_${uuidv4()}`;
      this.sessionStartTime = Date.now();
    }
  }

  async endSession(): Promise<void> {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    try {
      // Flush any pending events
      await this.flush();

      // End current page view
      if (this.currentPageViewId) {
        await this.exitPage();
      }

      // End session
      await axiosInstance.post('/analytics/session/end', {
        sessionId: this.sessionId,
      });

      // Clear intervals
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      if (this.flushInterval) clearInterval(this.flushInterval);

      // Clear session storage
      sessionStorage.removeItem('analytics_session_id');
      sessionStorage.removeItem('analytics_session_start');

      console.log('[Analytics] Session ended:', this.sessionId);
    } catch (error) {
      console.error('[Analytics] Failed to end session:', error);
    }
  }

  // ============================================
  // EVENT TRACKING
  // ============================================

  track(
    eventName: string,
    properties: Record<string, any> = {},
    options: {
      eventType?: string;
      eventCategory?: string;
      componentName?: string;
      immediate?: boolean;
    } = {}
  ): void {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    const now = Date.now();

    const event: AnalyticsEvent = {
      eventType: options.eventType || 'custom',
      eventName,
      eventCategory: options.eventCategory,
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      componentName: options.componentName,
      properties: {
        ...properties,
        timeSinceSessionStart: now - this.sessionStartTime,
        timeSinceLastEvent: now - this.lastEventTime,
      },
      timestamp: new Date(),
      eventSequence: ++this.eventSequence,
    };

    this.lastEventTime = now;
    this.interactionCount++;

    if (options.immediate) {
      this.sendEvents([event]);
    } else {
      this.eventQueue.push(event);
      // Auto-flush if queue gets large
      if (this.eventQueue.length >= 20) {
        this.flush();
      }
    }
  }

  // Convenience methods for common events
  trackClick(elementId: string, elementText?: string, properties: Record<string, any> = {}): void {
    this.track(
      'click',
      {
        elementId,
        elementText: elementText?.substring(0, 100),
        ...properties,
      },
      { eventType: 'click' }
    );
  }

  trackNavigation(from: string, to: string, method: 'link' | 'programmatic' | 'browser' = 'link'): void {
    this.track(
      'navigation',
      { from, to, method },
      { eventType: 'navigation', immediate: true }
    );
  }

  trackFormSubmit(formName: string, success: boolean, properties: Record<string, any> = {}): void {
    this.track(
      'form_submit',
      { formName, success, ...properties },
      { eventType: 'form_submit' }
    );
  }

  trackFeatureUse(
    featureName: string,
    action: 'started' | 'completed' | 'abandoned' | 'error',
    properties: Record<string, any> = {}
  ): void {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    this.track(
      `feature_${action}`,
      { featureName, ...properties },
      { eventType: 'feature_usage', eventCategory: 'feature' }
    );

    // Also send to dedicated feature tracking endpoint
    axiosInstance
      .post('/analytics/feature', {
        sessionId: this.sessionId,
        featureName,
        featureCategory: properties.featureCategory,
        action,
        duration: properties.duration,
        projectUuid: properties.projectUuid,
        context: properties.context,
        success: action === 'completed',
        errorMessage: properties.errorMessage,
      })
      .catch((error) => console.error('[Analytics] Feature tracking failed:', error));
  }

  trackSearch(query: string, resultCount: number, category?: string): void {
    this.track('search', { query, resultCount, category }, { eventType: 'search' });
  }

  trackProjectAction(action: string, projectUuid: string, properties: Record<string, any> = {}): void {
    this.track(
      `project_${action}`,
      { projectUuid, ...properties },
      { eventType: 'project', eventCategory: 'project' }
    );
  }

  // ============================================
  // PAGE VIEW TRACKING
  // ============================================

  async trackPageView(customProps: Record<string, any> = {}): Promise<void> {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    // Exit previous page
    if (this.currentPageViewId) {
      await this.exitPage();
    }

    this.pageEntryTime = Date.now();
    this.scrollDepth = 0;
    this.interactionCount = 0;
    this.focusTime = 0;
    this.focusStartTime = Date.now();

    // Extract project UUID from URL if present
    const projectMatch = window.location.pathname.match(/\/project\/([a-f0-9-]+)/i);
    const projectUuid = projectMatch?.[1] || customProps.projectUuid;

    // Detect portal type from URL
    const portalType = this.detectPortalType(window.location.pathname);

    try {
      const webVitals = await this.getWebVitals();

      const response = await axiosInstance.post('/analytics/pageview', {
        sessionId: this.sessionId,
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        referrerPath: document.referrer ? new URL(document.referrer).pathname : null,
        navigationType: this.getNavigationType(),
        projectUuid,
        portalType,
        webVitals,
      });

      this.currentPageViewId = response.data.pageViewId;
    } catch (error) {
      console.error('[Analytics] Page view tracking failed:', error);
    }
  }

  private async exitPage(): Promise<void> {
    if (!this.currentPageViewId) return;

    // Calculate focus time
    if (this.isFocused) {
      this.focusTime += Date.now() - this.focusStartTime;
    }

    try {
      await axiosInstance.post('/analytics/pageview/exit', {
        pageViewId: this.currentPageViewId,
        timeOnPage: Date.now() - this.pageEntryTime,
        scrollDepth: this.scrollDepth,
        interactionCount: this.interactionCount,
        focusTime: this.focusTime,
      });
    } catch (error) {
      console.error('[Analytics] Page exit tracking failed:', error);
    }
  }

  private detectPortalType(path: string): string | null {
    if (path.includes('/design')) return 'design';
    if (path.includes('/install')) return 'install';
    if (path.includes('/permitting')) return 'permitting';
    if (path.includes('/sales')) return 'sales';
    if (path.includes('/scheduling')) return 'scheduling';
    if (path.includes('/drafter')) return 'drafter';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/account')) return 'account';
    return null;
  }

  private getNavigationType(): string {
    if (!window.performance) return 'navigate';
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return nav?.type || 'navigate';
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  trackPerformance(metrics: PerformanceMetric | PerformanceMetric[]): void {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
    this.performanceQueue.push(...metricsArray);

    // Auto-flush if queue gets large
    if (this.performanceQueue.length >= 10) {
      this.flushPerformance();
    }
  }

  trackAPICall(
    url: string,
    method: string,
    duration: number,
    statusCode: number,
    responseSize?: number,
    error?: string
  ): void {
    this.trackPerformance({
      resourceType: 'api_call',
      url,
      method,
      duration,
      statusCode,
      responseSize,
      isError: statusCode >= 400,
      errorMessage: error,
      endpoint: this.extractEndpoint(url),
    });
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  // ============================================
  // ERROR TRACKING
  // ============================================

  trackError(
    errorType: string,
    errorName: string,
    errorMessage: string,
    errorStack?: string,
    componentName?: string,
    actionContext?: string
  ): void {
    if (!ANALYTICS_ENABLED || !this.enabled || !this.sessionId) return;

    axiosInstance
      .post('/analytics/error', {
        sessionId: this.sessionId,
        pageViewId: this.currentPageViewId,
        errorType,
        errorName,
        errorMessage,
        errorStack,
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        componentName,
        actionContext,
      })
      .catch((error) => console.error('[Analytics] Error tracking failed:', error));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getDeviceInfo(): DeviceInfo {
    let deviceId = localStorage.getItem('analytics_device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('analytics_device_id', deviceId);
    }

    return {
      deviceId,
      touchEnabled: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      platform: navigator.platform,
    };
  }

  private getScreenInfo(): ScreenInfo {
    return {
      width: window.screen.width,
      height: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    };
  }

  private getUTMParams(): UTMParams {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
  }

  private isPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  private async getWebVitals(): Promise<WebVitals> {
    return new Promise((resolve) => {
      if (!window.performance) {
        resolve({});
        return;
      }

      // Wait a bit for metrics to be available
      setTimeout(() => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

        resolve({
          fcp: fcp ? Math.round(fcp.startTime) : undefined,
          ttfb: navTiming ? Math.round(navTiming.responseStart - navTiming.requestStart) : undefined,
        });
      }, 100);
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  private setupEventListeners(): void {
    if (!ANALYTICS_ENABLED || !this.enabled) return;

    // Track scroll depth
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const newScrollDepth = Math.round(
          ((scrollTop + windowHeight) / documentHeight) * 100
        );
        this.scrollDepth = Math.max(this.scrollDepth, newScrollDepth);
      }, 150);
    });

    // Track focus/blur for focus time calculation
    window.addEventListener('focus', () => {
      this.isFocused = true;
      this.focusStartTime = Date.now();
    });

    window.addEventListener('blur', () => {
      if (this.isFocused) {
        this.focusTime += Date.now() - this.focusStartTime;
      }
      this.isFocused = false;
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
      if (this.currentPageViewId) {
        // Send synchronous request on unload
        this.exitPage();
      }
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private setupPerformanceObserver(): void {
    if (!ANALYTICS_ENABLED || !this.enabled || !window.PerformanceObserver) return;

    try{
      // Observe resource timing for API calls
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        const apiCalls = entries.filter(
          (entry) => entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest'
        );

        if (apiCalls.length > 0) {
          const metrics = apiCalls.map((entry) => ({
            resourceType: 'api_call',
            url: entry.name,
            method: 'GET', // Not available from PerformanceResourceTiming
            duration: Math.round(entry.duration),
            responseSize: entry.transferSize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          }));

          this.trackPerformance(metrics);
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('[Analytics] Performance observer setup failed:', error);
    }
  }

  // ============================================
  // BACKGROUND TASKS
  // ============================================

  private startHeartbeat(): void {
    if (!ANALYTICS_ENABLED || !this.enabled) return;

    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.sessionId && !document.hidden) {
        axiosInstance
          .post('/analytics/session/heartbeat', {
            sessionId: this.sessionId,
            currentPage: window.location.pathname,
            currentProject: this.extractProjectUUID(),
          })
          .catch((error) => console.error('[Analytics] Heartbeat failed:', error));
      }
    }, 30000);
  }

  private startEventFlush(): void {
    if (!ANALYTICS_ENABLED || !this.enabled) return;

    // Flush events every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
      this.flushPerformance();
    }, 10000);
  }

  private async flush(synchronous: boolean = false): Promise<void> {
    if (!ANALYTICS_ENABLED || !this.enabled || this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('[Analytics] Event flush failed:', error);
      // Re-queue events if flush fails (with limit)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  private async flushPerformance(): Promise<void> {
    if (!ANALYTICS_ENABLED || !this.enabled || this.performanceQueue.length === 0) return;

    const metrics = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await axiosInstance.post('/analytics/performance', {
        sessionId: this.sessionId,
        pageViewId: this.currentPageViewId,
        metrics,
      });
    } catch (error) {
      console.error('[Analytics] Performance flush failed:', error);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.sessionId || events.length === 0) return;

    await axiosInstance.post('/analytics/events/batch', {
      sessionId: this.sessionId,
      events,
    });
  }

  private extractProjectUUID(): string | null {
    const match = window.location.pathname.match(/\/project\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  isEnabled(): boolean {
    return this.enabled;
  }

  disable(): void {
    this.enabled = false;
    console.log('[Analytics] Service disabled');
  }

  enable(): void {
    this.enabled = true;
    console.log('[Analytics] Service enabled');
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// ============================================
// EXPORTS
// ============================================

export const analytics = AnalyticsService.getInstance();
export default AnalyticsService;
