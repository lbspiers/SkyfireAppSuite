/**
 * useMediaSocket - Real-time updates for survey media uploads
 * Connects to Socket.io server and listens for new photo/video uploads
 *
 * Usage:
 *   const { handleNewMedia } = useMediaSocket(projectUuid, (newItem) => {
 *     setMedia(prev => [newItem, ...prev]);
 *   });
 */

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import logger from '../services/devLogger';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

export const useMediaSocket = (projectUuid, onNewMedia) => {
  useEffect(() => {
    if (!projectUuid) {
      logger.debug('MediaSocket', 'No projectUuid provided, skipping socket connection');
      return;
    }

    logger.debug('MediaSocket', `[useMediaSocket] Initializing connection for project: ${projectUuid}`);

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      logger.log('MediaSocket', `[useMediaSocket] Socket connected, joining project room: ${projectUuid}`);
      socket.emit('join-project', projectUuid);
    });

    socket.on('disconnect', (reason) => {
      logger.log('MediaSocket', `[useMediaSocket] Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      logger.error('MediaSocket', '[useMediaSocket] Socket connection error:', error);
    });

    // Listen for media upload events
    const handleMediaUploaded = (data) => {
      logger.log('MediaSocket', '[useMediaSocket] Media uploaded notification:', data);

      // Only handle events for this project
      if (data.projectId === projectUuid || data.projectUuid === projectUuid) {
        logger.log('MediaSocket', `[useMediaSocket] New ${data.mediaType} received for project`);

        if (onNewMedia && data.media) {
          onNewMedia(data);
        }
      }
    };

    // Listen for all media-related events
    socket.on('photo:uploaded', handleMediaUploaded);
    socket.on('video:uploaded', handleMediaUploaded);
    socket.on('media:uploaded', handleMediaUploaded);

    // Cleanup on unmount
    return () => {
      logger.log('MediaSocket', `[useMediaSocket] Cleaning up, leaving project room: ${projectUuid}`);
      socket.emit('leave-project', projectUuid);
      socket.off('photo:uploaded', handleMediaUploaded);
      socket.off('video:uploaded', handleMediaUploaded);
      socket.off('media:uploaded', handleMediaUploaded);
      socket.disconnect();
    };
  }, [projectUuid, onNewMedia]);
};

export default useMediaSocket;
