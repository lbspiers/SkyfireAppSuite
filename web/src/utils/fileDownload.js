/**
 * File Download Utility
 * Provides reusable functions for downloading files from S3 URLs using blob-fetch pattern
 * This ensures files are downloaded rather than opened in browser tabs
 */

import logger from '../services/devLogger';
import { toast } from 'react-toastify';

/**
 * Download a single file from URL
 * Uses blob-fetch pattern to force download instead of browser open
 *
 * @param {string} fileUrl - The URL to download from (S3 URL)
 * @param {string} fileName - The name to save the file as
 * @param {string} componentName - Component name for logging (optional)
 * @returns {Promise<boolean>} - True if successful, false if failed
 */
export const downloadFile = async (fileUrl, fileName, componentName = 'FileDownload') => {
  if (!fileUrl) {
    logger.warn(componentName, 'Download failed: No URL provided');
    toast.warning('Download not available for this file');
    return false;
  }

  try {
    logger.log(componentName, `[Download] Starting download: ${fileName}`);

    // Add cache-busting parameter to prevent CORS issues from cached responses
    const cacheBustUrl = fileUrl.includes('?')
      ? `${fileUrl}&_cb=${Date.now()}`
      : `${fileUrl}?_cb=${Date.now()}`;

    logger.log(componentName, `[Download] Fetching with cache-busting: ${cacheBustUrl}`);

    // Fetch the file as a blob to force download
    const response = await fetch(cacheBustUrl);

    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: cacheBustUrl,
        headers: Object.fromEntries(response.headers.entries()),
      };
      logger.error(componentName, `[Download] HTTP Error for ${fileName}:`, errorDetails);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check response content type
    const contentType = response.headers.get('content-type');
    logger.log(componentName, `[Download] Content-Type: ${contentType} for ${fileName}`);

    const blob = await response.blob();
    logger.log(componentName, `[Download] Blob created - Size: ${blob.size} bytes, Type: ${blob.type}`);

    // Create object URL and trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL
    window.URL.revokeObjectURL(downloadUrl);

    logger.log(componentName, `[Download] Success: ${fileName}`);
    return true;
  } catch (error) {
    // Enhanced error logging with more details
    const errorInfo = {
      fileName,
      originalUrl: fileUrl,
      cacheBustUrl: fileUrl.includes('?') ? `${fileUrl}&_cb=...` : `${fileUrl}?_cb=...`,
      errorMessage: error.message,
      errorType: error.name,
      stack: error.stack,
    };
    logger.error(componentName, `[Download] Failed for ${fileName}:`, errorInfo);

    // Show more specific error message to user
    const userMessage = error.message.includes('HTTP 403')
      ? 'Access denied - file may have expired or been moved'
      : error.message.includes('HTTP 404')
      ? 'File not found - it may have been deleted'
      : error.message.includes('CORS')
      ? 'Download blocked by security policy'
      : 'Failed to download file';

    toast.error(userMessage);
    return false;
  }
};

/**
 * Download multiple files sequentially
 * Adds delay between downloads to avoid overwhelming browser/network
 *
 * @param {Array<Object>} files - Array of file objects with url and name properties
 * @param {Object} options - Configuration options
 * @param {number} options.delayMs - Delay between downloads in milliseconds (default: 300)
 * @param {Function} options.getUrl - Function to extract URL from file object (default: file => file.url || file.s3_url || file.photo_url)
 * @param {Function} options.getName - Function to extract filename from file object (default: file => file.name || file.fileName || file.original_filename || 'download')
 * @param {string} options.componentName - Component name for logging (default: 'FileDownload')
 * @param {boolean} options.showToasts - Whether to show toast notifications (default: true)
 * @returns {Promise<Object>} - Object with success/failure counts
 */
export const downloadMultipleFiles = async (files, options = {}) => {
  const {
    delayMs = 300,
    getUrl = (file) => file.url || file.s3_url || file.photo_url,
    getName = (file) => file.name || file.fileName || file.original_filename || 'download',
    componentName = 'FileDownload',
    showToasts = true,
  } = options;

  if (!files || files.length === 0) {
    if (showToasts) {
      toast.warning('No files selected');
    }
    return { success: 0, failed: 0, total: 0 };
  }

  logger.log(componentName, `[Bulk Download] Starting download of ${files.length} files`);

  if (showToasts) {
    toast.info(`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`);
  }

  let successCount = 0;
  let failedCount = 0;

  // Download files sequentially to avoid overwhelming the browser
  for (const file of files) {
    const fileUrl = getUrl(file);
    const fileName = getName(file);

    const success = await downloadFile(fileUrl, fileName, componentName);

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }

    // Add delay between downloads (skip delay after last file)
    if (files.indexOf(file) < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  logger.log(componentName, `[Bulk Download] Complete - Success: ${successCount}, Failed: ${failedCount}`);

  // Show final result toast
  if (showToasts) {
    if (failedCount === 0) {
      toast.success(`Downloaded ${successCount} file${successCount > 1 ? 's' : ''}`);
    } else if (successCount === 0) {
      toast.error(`Failed to download ${failedCount} file${failedCount > 1 ? 's' : ''}`);
    } else {
      toast.warning(`Downloaded ${successCount} file${successCount > 1 ? 's' : ''}, ${failedCount} failed`);
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    total: files.length,
  };
};

/**
 * Download a file object using common field names
 * Convenience wrapper that handles common file object structures
 *
 * @param {Object} file - File object with url/name properties
 * @param {string} componentName - Component name for logging (optional)
 * @returns {Promise<boolean>} - True if successful, false if failed
 */
export const downloadFileObject = async (file, componentName = 'FileDownload') => {
  const fileUrl = file.url || file.s3_url || file.photo_url;
  const fileName = file.name || file.fileName || file.original_filename || file.file_name || 'download';

  return downloadFile(fileUrl, fileName, componentName);
};

export default {
  downloadFile,
  downloadMultipleFiles,
  downloadFileObject,
};
