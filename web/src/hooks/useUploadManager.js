/**
 * @fileoverview React hook for Upload Manager
 *
 * Provides reactive state updates for upload progress by subscribing to
 * uploadManager events. Automatically updates component state when files
 * are added, progress changes, or uploads complete.
 *
 * @module hooks/useUploadManager
 *
 * @example
 * import { useUploadManager } from './hooks/useUploadManager';
 *
 * function MyComponent() {
 *   const { status, enqueue, cancel, retryFailed } = useUploadManager();
 *
 *   const handleUpload = (files) => {
 *     enqueue(files, projectUuid);
 *   };
 *
 *   return (
 *     <div>
 *       <p>Uploaded: {status.completed}/{status.total}</p>
 *       {status.failed > 0 && (
 *         <button onClick={retryFailed}>Retry Failed ({status.failed})</button>
 *       )}
 *     </div>
 *   );
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import uploadManager from '../services/uploadManager';

/**
 * Hook for accessing upload manager state and actions
 *
 * @returns {Object} Upload manager interface
 * @returns {Object} status - Current upload status
 * @returns {number} status.total - Total files in batch
 * @returns {number} status.completed - Successfully uploaded files
 * @returns {number} status.failed - Failed uploads
 * @returns {number} status.inProgress - Currently uploading
 * @returns {number} status.queued - Waiting to upload
 * @returns {Array} status.files - Array of file upload states
 * @returns {Function} enqueue - Add files to upload queue
 * @returns {Function} cancel - Cancel remaining uploads
 * @returns {Function} retryFailed - Retry failed uploads
 * @returns {Function} clearCompleted - Clear completed files from state
 * @returns {boolean} hasActiveUploads - True if uploads in progress or queued
 */
export const useUploadManager = () => {
  // Initialize with current status
  const [status, setStatus] = useState(() => uploadManager.getStatus());

  // Subscribe to upload manager events
  useEffect(() => {
    const handleEvent = (event, data) => {
      // Update status on relevant events
      if (
        event === 'upload:start' ||
        event === 'file:update' ||
        event === 'upload:complete' ||
        event === 'upload:cancelled' ||
        event === 'upload:retry' ||
        event === 'upload:cleared'
      ) {
        setStatus(uploadManager.getStatus());
      }
    };

    const unsubscribe = uploadManager.subscribe(handleEvent);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Memoized action functions
  const enqueue = useCallback((files, projectUuid, metadata) => {
    uploadManager.enqueue(files, projectUuid, metadata);
  }, []);

  const cancel = useCallback(() => {
    uploadManager.cancel();
  }, []);

  const retryFailed = useCallback(() => {
    uploadManager.retryFailed();
  }, []);

  const clearCompleted = useCallback(() => {
    uploadManager.clearCompleted();
  }, []);

  const hasActiveUploads = useCallback(() => {
    return uploadManager.hasActiveUploads();
  }, []);

  return {
    status,
    enqueue,
    cancel,
    retryFailed,
    clearCompleted,
    hasActiveUploads: hasActiveUploads(),
  };
};

export default useUploadManager;
