/**
 * UploadContext - Isolated upload state management
 * Prevents full app re-renders during file uploads by isolating state to only components that need it.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import uploadManager from '../services/uploadManager';

const UploadContext = createContext(null);

// Throttle helper - limits state updates during rapid file uploads
const throttle = (func, limit) => {
  let inThrottle = false;
  let lastArgs = null;
  let pendingCall = false;

  const throttled = (...args) => {
    lastArgs = args;
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (pendingCall) {
          pendingCall = false;
          throttled(...lastArgs);
        }
      }, limit);
    } else {
      pendingCall = true;
    }
  };
  return throttled;
};

export const UploadProvider = ({ children }) => {
  const [status, setStatus] = useState(() => uploadManager.getStatus());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusRef = useRef(status);
  const isModalOpenRef = useRef(isModalOpen);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isModalOpenRef.current = isModalOpen; }, [isModalOpen]);

  // Throttled status update (max once per 250ms) - KEY OPTIMIZATION
  const throttledSetStatus = useCallback(
    throttle((newStatus) => setStatus(newStatus), 250),
    []
  );

  useEffect(() => {
    const handleEvent = (event, data) => {
      const newStatus = uploadManager.getStatus();

      // For file progress updates, use throttled update
      if (event === 'file:update') {
        throttledSetStatus(newStatus);
        return;
      }

      // For important state transitions, update immediately
      if (['upload:start', 'upload:complete', 'upload:cancelled', 'upload:retry', 'upload:cleared'].includes(event)) {
        setStatus(newStatus);
      }
    };

    const unsubscribe = uploadManager.subscribe(handleEvent);
    return unsubscribe;
  }, [throttledSetStatus]);

  const hasActiveUploads = status.inProgress > 0 || status.queued > 0;
  const isComplete = !hasActiveUploads && status.total > 0 &&
                     status.completed + status.failed === status.total;

  // Auto-open modal when uploads start
  useEffect(() => {
    if (hasActiveUploads && !isModalOpenRef.current && status.total > 0) {
      setIsModalOpen(true);
    }
  }, [hasActiveUploads, status.total]);

  // Re-open modal for large batches or failures
  useEffect(() => {
    if (isComplete && !isModalOpenRef.current && (status.total >= 10 || status.failed > 0)) {
      setIsModalOpen(true);
    }
  }, [isComplete, status.total, status.failed]);

  const value = {
    status,
    hasActiveUploads,
    isComplete,
    isModalOpen,
    openModal: useCallback(() => setIsModalOpen(true), []),
    closeModal: useCallback(() => setIsModalOpen(false), []),
    enqueue: useCallback((files, projectUuid, metadata) => uploadManager.enqueue(files, projectUuid, metadata), []),
    cancel: useCallback(() => uploadManager.cancel(), []),
    retryFailed: useCallback(() => uploadManager.retryFailed(), []),
    clearCompleted: useCallback(() => uploadManager.clearCompleted(), []),
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUploadContext must be used within UploadProvider');
  return context;
};

export default UploadContext;
