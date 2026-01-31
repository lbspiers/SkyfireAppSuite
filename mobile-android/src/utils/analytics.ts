// Analytics and Monitoring Utilities
// Comprehensive tracking for password reset flow and user behavior

import {
  PasswordResetAnalytics,
  PasswordResetEventType,
  PasswordResetStep,
} from './passwordResetTypes';
import { getDeviceInfo } from './deviceInfo';

// Analytics configuration
interface AnalyticsConfig {
  enableAnalytics: boolean;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enableAnalytics: true,
  enableConsoleLogging: __DEV__,
  enableRemoteLogging: !__DEV__,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
};

// Event queue for batching
let eventQueue: PasswordResetAnalytics[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let sessionStartTime: number | null = null;

// Session tracking
let currentSession: {
  sessionId: string;
  startTime: number;
  events: PasswordResetAnalytics[];
  abandonmentPoint?: PasswordResetStep;
} | null = null;

/**
 * Initialize analytics system
 */
export const initializeAnalytics = (config: Partial<AnalyticsConfig> = {}): void => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('📊 [ANALYTICS] Initializing with config:', finalConfig);

  // Start flush timer if remote logging is enabled
  if (finalConfig.enableRemoteLogging && !flushTimer) {
    flushTimer = setInterval(() => {
      flushEventQueue();
    }, finalConfig.flushInterval);
  }
};

/**
 * Start a new password reset session
 */
export const startPasswordResetSession = (email?: string): string => {
  const sessionId = generateSessionId();
  sessionStartTime = Date.now();

  currentSession = {
    sessionId,
    startTime: sessionStartTime,
    events: [],
  };

  // Track session start
  trackPasswordResetEvent({
    eventType: 'reset_initiated',
    timestamp: Date.now(),
    email: email || '',
    step: 'EMAIL_INPUT',
    success: true,
  });

  console.log('📊 [ANALYTICS] Started password reset session:', sessionId);
  return sessionId;
};

/**
 * End password reset session
 */
export const endPasswordResetSession = (success: boolean, completionTime?: number): void => {
  if (!currentSession) {
    console.warn('📊 [ANALYTICS] No active session to end');
    return;
  }

  const sessionDuration = Date.now() - currentSession.startTime;
  const timeToComplete = completionTime || sessionDuration;

  // Track session end
  trackPasswordResetEvent({
    eventType: success ? 'reset_completed' : 'reset_abandoned',
    timestamp: Date.now(),
    email: '',
    step: success ? 'SUCCESS' : (currentSession.abandonmentPoint || 'EMAIL_INPUT'),
    success,
    timeToComplete,
    abandonmentPoint: success ? undefined : currentSession.abandonmentPoint,
  });

  console.log(`📊 [ANALYTICS] Ended session ${currentSession.sessionId}:`, {
    success,
    duration: sessionDuration,
    eventCount: currentSession.events.length,
  });

  // Flush remaining events
  flushEventQueue();

  currentSession = null;
  sessionStartTime = null;
};

/**
 * Track password reset event
 */
export const trackPasswordResetEvent = async (
  event: Omit<PasswordResetAnalytics, 'userAgent' | 'deviceInfo'>
): Promise<void> => {
  try {
    // Enhance event with device info
    const deviceInfo = await getDeviceInfo();

    const enhancedEvent: PasswordResetAnalytics = {
      ...event,
      deviceInfo,
      userAgent: deviceInfo.userAgent,
    };

    // Add to current session
    if (currentSession) {
      currentSession.events.push(enhancedEvent);

      // Update abandonment point
      if (!event.success && event.step) {
        currentSession.abandonmentPoint = event.step;
      }
    }

    // Add to event queue
    eventQueue.push(enhancedEvent);

    // Console logging for development
    if (DEFAULT_CONFIG.enableConsoleLogging) {
      console.log('📊 [ANALYTICS] Event:', {
        type: event.eventType,
        step: event.step,
        success: event.success,
        error: event.errorCode,
      });
    }

    // Auto-flush if queue is full
    if (eventQueue.length >= DEFAULT_CONFIG.batchSize) {
      flushEventQueue();
    }

  } catch (error) {
    console.warn('📊 [ANALYTICS] Failed to track event:', error);
  }
};

/**
 * Track specific password reset events (convenience functions)
 */
export const trackEmailSubmitted = (email: string, success: boolean, errorCode?: string) => {
  trackPasswordResetEvent({
    eventType: 'email_submitted',
    timestamp: Date.now(),
    email,
    step: 'EMAIL_INPUT',
    success,
    errorCode,
  });
};

export const trackCodeSent = (email: string, method: 'email' | 'sms' = 'email') => {
  trackPasswordResetEvent({
    eventType: 'code_sent',
    timestamp: Date.now(),
    email,
    step: 'CODE_SENT',
    success: true,
  });
};

export const trackCodeEntered = (email: string, success: boolean, retryCount?: number, errorCode?: string) => {
  trackPasswordResetEvent({
    eventType: 'code_entered',
    timestamp: Date.now(),
    email,
    step: 'CODE_INPUT',
    success,
    retryCount,
    errorCode,
  });
};

export const trackPasswordSet = (email: string, success: boolean, passwordStrength?: number, errorCode?: string) => {
  trackPasswordResetEvent({
    eventType: 'password_set',
    timestamp: Date.now(),
    email,
    step: 'NEW_PASSWORD',
    success,
    errorCode,
  });
};

export const trackResendRequested = (email: string, resendCount: number) => {
  trackPasswordResetEvent({
    eventType: 'resend_requested',
    timestamp: Date.now(),
    email,
    step: 'CODE_SENT',
    success: true,
    resendCount,
  });
};

export const trackHelpViewed = (email: string, step: PasswordResetStep) => {
  trackPasswordResetEvent({
    eventType: 'help_viewed',
    timestamp: Date.now(),
    email,
    step,
    success: true,
    helpUsed: true,
  });
};

export const trackSuspiciousActivity = (email: string, step: PasswordResetStep, riskScore: number) => {
  trackPasswordResetEvent({
    eventType: 'error_occurred',
    timestamp: Date.now(),
    email,
    step,
    success: false,
    suspiciousActivity: true,
    riskScore,
    errorCode: 'SUSPICIOUS_ACTIVITY',
  });
};

/**
 * Flush event queue to remote analytics service
 */
const flushEventQueue = async (): Promise<void> => {
  if (eventQueue.length === 0) {
    return;
  }

  const eventsToFlush = [...eventQueue];
  eventQueue = [];

  try {
    if (DEFAULT_CONFIG.enableRemoteLogging) {
      // Send to analytics service
      await sendEventsToAnalyticsService(eventsToFlush);
    }

    console.log(`📊 [ANALYTICS] Flushed ${eventsToFlush.length} events`);

  } catch (error) {
    console.error('📊 [ANALYTICS] Failed to flush events:', error);

    // Re-add events to queue for retry
    eventQueue = [...eventsToFlush, ...eventQueue];
  }
};

/**
 * Send events to remote analytics service
 */
const sendEventsToAnalyticsService = async (events: PasswordResetAnalytics[]): Promise<void> => {
  // This would integrate with your analytics service (e.g., Mixpanel, Amplitude, custom)
  // For now, we'll simulate the API call

  console.log('📊 [ANALYTICS] Sending events to remote service...', events.length);

  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve();
      } else {
        reject(new Error('Analytics service unavailable'));
      }
    }, 1000);
  });

  // Real implementation would look like:
  /*
  const response = await fetch('/api/analytics/password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      events,
      timestamp: Date.now(),
      source: 'mobile-app',
    }),
  });

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }
  */
};

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `reset-${timestamp}-${randomPart}`;
};

/**
 * Get analytics summary for current session
 */
export const getSessionSummary = (): {
  sessionId: string;
  duration: number;
  eventCount: number;
  currentStep: PasswordResetStep;
  events: PasswordResetAnalytics[];
} | null => {
  if (!currentSession || !sessionStartTime) {
    return null;
  }

  return {
    sessionId: currentSession.sessionId,
    duration: Date.now() - sessionStartTime,
    eventCount: currentSession.events.length,
    currentStep: currentSession.events[currentSession.events.length - 1]?.step || 'EMAIL_INPUT',
    events: [...currentSession.events],
  };
};

/**
 * Get completion rate analytics (for admin dashboard)
 */
export const getCompletionRateMetrics = (events: PasswordResetAnalytics[]): {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageTimeToComplete: number;
  abandonmentPoints: Record<PasswordResetStep, number>;
} => {
  const sessions = new Map<string, PasswordResetAnalytics[]>();

  // Group events by session
  events.forEach(event => {
    const sessionId = event.userId || 'unknown';
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    sessions.get(sessionId)!.push(event);
  });

  let completedSessions = 0;
  let totalTimeToComplete = 0;
  const abandonmentPoints: Record<PasswordResetStep, number> = {} as any;

  sessions.forEach(sessionEvents => {
    const hasCompletion = sessionEvents.some(e => e.eventType === 'reset_completed');
    const hasAbandonment = sessionEvents.some(e => e.eventType === 'reset_abandoned');

    if (hasCompletion) {
      completedSessions++;
      const completionEvent = sessionEvents.find(e => e.eventType === 'reset_completed');
      if (completionEvent?.timeToComplete) {
        totalTimeToComplete += completionEvent.timeToComplete;
      }
    } else if (hasAbandonment) {
      const abandonmentEvent = sessionEvents.find(e => e.eventType === 'reset_abandoned');
      if (abandonmentEvent?.abandonmentPoint) {
        const point = abandonmentEvent.abandonmentPoint;
        abandonmentPoints[point] = (abandonmentPoints[point] || 0) + 1;
      }
    }
  });

  const totalSessions = sessions.size;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const averageTimeToComplete = completedSessions > 0 ? totalTimeToComplete / completedSessions : 0;

  return {
    totalSessions,
    completedSessions,
    completionRate,
    averageTimeToComplete,
    abandonmentPoints,
  };
};

/**
 * Cleanup analytics system
 */
export const cleanupAnalytics = (): void => {
  // Flush any remaining events
  flushEventQueue();

  // Clear timers
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // End current session if active
  if (currentSession) {
    endPasswordResetSession(false);
  }

  // Clear queues
  eventQueue = [];

  console.log('📊 [ANALYTICS] Cleanup completed');
};

// Auto-initialize analytics
initializeAnalytics();

// Export everything
export default {
  initializeAnalytics,
  startPasswordResetSession,
  endPasswordResetSession,
  trackPasswordResetEvent,
  trackEmailSubmitted,
  trackCodeSent,
  trackCodeEntered,
  trackPasswordSet,
  trackResendRequested,
  trackHelpViewed,
  trackSuspiciousActivity,
  getSessionSummary,
  getCompletionRateMetrics,
  cleanupAnalytics,
};