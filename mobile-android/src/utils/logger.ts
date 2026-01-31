// src/utils/logger.ts
// CENTRALIZED LOGGING UTILITY
// Provides consistent logging interface with debug mode control

/**
 * Logger configuration
 * DEBUG_ENABLED controls whether debug logs are shown
 * In production (__DEV__ = false), debug logs are suppressed
 */
const DEBUG_ENABLED = __DEV__; // Only in development

/**
 * Logging utility with consistent formatting
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *
 *   logger.debug('Component mounted', { props });    // Only in dev
 *   logger.info('User action', { action });          // Always shown
 *   logger.warn('Deprecated API used');              // Always shown
 *   logger.error('Failed to fetch', error);          // Always shown
 *
 * Benefits:
 * - Single source of truth for logging
 * - Easy to toggle debug logs globally
 * - Consistent formatting
 * - Easy to add external logging services (Sentry, etc.)
 */
export const logger = {
  /**
   * Debug logs - only shown in development
   * Use for verbose logging during development
   */
  debug: (...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - shown in development and production
   * Use for important application events
   */
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Warning logs - always shown
   * Use for deprecated features, potential issues
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - always shown
   * Use for errors, failures, exceptions
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Group logs together (collapsible in dev tools)
   */
  group: (label: string, callback: () => void) => {
    if (DEBUG_ENABLED) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Time measurement for performance debugging
   */
  time: (label: string) => {
    if (DEBUG_ENABLED) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (DEBUG_ENABLED) {
      console.timeEnd(label);
    }
  },
};

/**
 * Component-specific logger factory
 * Creates a logger with a component prefix
 *
 * Usage:
 *   const log = createComponentLogger('DashboardScreen');
 *   log.debug('Component mounted');  // [DEBUG] [DashboardScreen] Component mounted
 */
export function createComponentLogger(componentName: string) {
  return {
    debug: (...args: any[]) => logger.debug(`[${componentName}]`, ...args),
    info: (...args: any[]) => logger.info(`[${componentName}]`, ...args),
    warn: (...args: any[]) => logger.warn(`[${componentName}]`, ...args),
    error: (...args: any[]) => logger.error(`[${componentName}]`, ...args),
    group: (label: string, callback: () => void) =>
      logger.group(`[${componentName}] ${label}`, callback),
    time: (label: string) => logger.time(`[${componentName}] ${label}`),
    timeEnd: (label: string) => logger.timeEnd(`[${componentName}] ${label}`),
  };
}

/**
 * MIGRATION GUIDE:
 *
 * BEFORE:
 * console.log('[DashboardOptimized] Starting hybrid fetch', { isSuperUser, companyId });
 * console.debug('[DashboardOptimized] Fetching projects...');
 * console.log('[DashboardOptimized] Received response:', response);
 * console.log('[DashboardOptimized] Projects loaded:', projects.length);
 *
 * AFTER:
 * import { createComponentLogger } from '../utils/logger';
 * const log = createComponentLogger('DashboardOptimized');
 *
 * log.debug('Starting hybrid fetch', { isSuperUser, companyId });  // Only in dev
 * log.debug('Fetching projects...');                                // Only in dev
 * log.debug('Received response:', response);                        // Only in dev
 * log.info('Projects loaded:', projects.length);                    // Always shown
 *
 * OR keep important logs but comment out verbose ones:
 * // log.debug('Starting hybrid fetch', { isSuperUser, companyId });
 * // log.debug('Fetching projects...');
 * // log.debug('Received response:', response);
 * if (projects.length === 0) {
 *   log.warn('No projects found for user:', userEmail);  // Keep warnings
 * }
 *
 * ERROR HANDLING EXAMPLE:
 * try {
 *   const data = await api.get('/endpoint');
 *   log.debug('Data received:', data);
 * } catch (error) {
 *   log.error('Failed to fetch data:', error);  // Always log errors
 * }
 */

export default logger;
