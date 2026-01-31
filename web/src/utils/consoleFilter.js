/**
 * Console Error Filter
 * Suppresses known browser extension errors that flood the console
 * Only active in development mode
 */

const SUPPRESSED_PATTERNS = [
  // Browser extension message channel errors
  /message channel closed before a response was received/i,
  /A listener indicated an asynchronous response/i,
  // React DevTools noise
  /Download the React DevTools/i,
  // Other common extension noise
  /Extension context invalidated/i,
  /runtime\.lastError/i,
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  // ServiceWorker 404 errors (dev server issue, doesn't affect functionality)
  /Failed to update a ServiceWorker.*sw\.js/i,
  /A bad HTTP response code \(404\) was received when fetching the script/i,
];

export const initConsoleFilter = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');
    if (SUPPRESSED_PATTERNS.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    if (SUPPRESSED_PATTERNS.some(pattern => pattern.test(message))) {
      return; // Suppress
    }
    originalWarn.apply(console, args);
  };

  console.log('[ConsoleFilter] Browser extension error suppression active');
};
