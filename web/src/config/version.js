/**
 * App Version Configuration
 * Auto-updated by deploy.ps1 script
 *
 * DEPLOYMENT_NUMBER increments with each deployment
 * DEPLOYMENT_VERSION format: yyyy.MM.dd.HHmm (unique per deployment)
 */
export const DEPLOYMENT_NUMBER = 72; // Auto-incremented by deploy script
export const DEPLOYMENT_VERSION = '2026.02.14.2341'; // Auto-updated by deploy script
export const BUILD_DATE = '2026-02-14'; // Auto-updated by deploy script
export const BUILD_TIME = '23:41'; // Auto-updated by deploy script
export const BUILD_SIZE = '8.4 MB'; // Auto-calculated by deploy script

// Legacy version for compatibility
export const APP_VERSION = '1.0.0';

// Generate a unique deployment identifier
export const DEPLOYMENT_ID = `#${DEPLOYMENT_NUMBER} (${DEPLOYMENT_VERSION})`;

/**
 * Check if current version matches cached version
 * Useful for debugging update issues
 */
export function getVersionInfo() {
  return {
    deploymentNumber: DEPLOYMENT_NUMBER,
    deploymentVersion: DEPLOYMENT_VERSION,
    deploymentId: DEPLOYMENT_ID,
    buildDate: BUILD_DATE,
    buildTime: BUILD_TIME,
    buildSize: BUILD_SIZE,
    appVersion: APP_VERSION,
    serviceWorkerActive: 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
  };
}
