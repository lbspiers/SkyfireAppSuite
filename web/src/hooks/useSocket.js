import { useEffect, useCallback, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://api.skyfireapp.io';

// ============ SINGLETON SOCKET MANAGER ============
let socketInstance = null;
let connectionCount = 0;
let disconnectTimer = null;
const DISCONNECT_GRACE_PERIOD = 5000; // 5 seconds

const getSocket = () => {
  // Cancel any pending disconnect
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  if (!socketInstance) {
    // Get user from session storage
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);

      // Join user's notification room if logged in
      if (userData?.uuid) {
        socketInstance.emit('join:user', userData.uuid);
      }

      // Join superadmin room if super admin
      if (userData?.isSuperAdmin) {
        socketInstance.emit('join:superadmin');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketInstance.on('error', (error) => {
      console.error('[Socket] Error:', error);
    });
  }

  connectionCount++;
  return socketInstance;
};

const releaseSocket = () => {
  connectionCount--;

  if (connectionCount <= 0) {
    // Don't disconnect immediately - use grace period
    disconnectTimer = setTimeout(() => {
      if (connectionCount <= 0 && socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        connectionCount = 0;
        disconnectTimer = null;
      } else {
        disconnectTimer = null;
      }
    }, DISCONNECT_GRACE_PERIOD);
  }
};

// ============ HOOK ============
/**
 * useSocket - Socket.io connection hook with singleton pattern
 *
 * Provides real-time communication for:
 * - Notifications (task assignments, mentions, etc.)
 * - PDF generation completion
 * - App updates
 * - Project collaboration
 *
 * Uses reference counting to maintain a single socket connection
 * across all components using this hook.
 */
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = getSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socketRef.current.connected);

    return () => {
      socketRef.current?.off('connect', handleConnect);
      socketRef.current?.off('disconnect', handleDisconnect);
      releaseSocket();
    };
  }, []);

  // Re-join user room when user changes (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      if (socketRef.current?.connected && userData?.uuid) {
        socketRef.current.emit('join:user', userData.uuid);

        // Re-join superadmin room if super admin
        if (userData?.isSuperAdmin) {
          socketRef.current.emit('join:superadmin');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Join a project room for real-time collaboration
   */
  const joinProject = useCallback((projectUuid) => {
    if (socketRef.current?.connected && projectUuid) {
      socketRef.current.emit('join-project', projectUuid);
    }
  }, []);

  /**
   * Leave a project room
   */
  const leaveProject = useCallback((projectUuid) => {
    if (socketRef.current?.connected && projectUuid) {
      socketRef.current.emit('leave-project', projectUuid);
    }
  }, []);

  /**
   * Listen for new notifications
   * @param {Function} callback - Called when notification received
   * @returns {Function} Cleanup function
   */
  const onNotification = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('notification:new', callback);

    return () => {
      socket.off('notification:new', callback);
    };
  }, []);

  /**
   * Listen for automation completion (new project created via webhook)
   * @param {Function} callback - Called when automation completes
   * @returns {Function} Cleanup function
   */
  const onAutomationComplete = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) {
      console.warn('[Socket] onAutomationComplete called but socket not initialized');
      return () => {};
    }

    socket.on('automation:complete', callback);

    return () => {
      socket.off('automation:complete', callback);
    };
  }, []);

  /**
   * Listen for project updates
   * @param {Function} callback - Called when project is updated
   * @returns {Function} Cleanup function
   */
  const onProjectUpdate = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('project:update', callback);
    return () => socket.off('project:update', callback);
  }, []);

  /**
   * Listen for PDF generation completion
   * @param {Function} callback - Called when PDF is ready
   * @returns {Function} Cleanup function
   */
  const onPdfReady = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('pdf-ready', callback);
    return () => socket.off('pdf-ready', callback);
  }, []);

  /**
   * Listen for app updates
   * @param {Function} callback - Called when app update available
   * @returns {Function} Cleanup function
   */
  const onAppUpdate = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('app:update', callback);
    return () => socket.off('app:update', callback);
  }, []);

  /**
   * Listen for task updates
   * @param {Function} callback - Called when task is updated
   * @returns {Function} Cleanup function
   */
  const onTaskUpdate = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('task:update', callback);
    return () => socket.off('task:update', callback);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onNotification,
    onAutomationComplete,
    onProjectUpdate,
    onPdfReady,
    onAppUpdate,
    onTaskUpdate,
    joinProject,
    leaveProject,
  };
};

export default useSocket;
