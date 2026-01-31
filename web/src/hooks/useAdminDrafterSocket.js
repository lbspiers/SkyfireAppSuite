import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminDrafterSocketService from '../services/adminDrafterSocketService';

export const useAdminDrafterSocket = (options = {}) => {
  const {
    autoConnect = true,
    onStatsUpdate,
    onQueueUpdated,
    onNewQuestion,
    onAssignmentUpdated,
    onDrafterStatus
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    if (!autoConnect) return;

    const socket = adminDrafterSocketService.connect();
    if (!socket) return;

    // Connection status
    const unsubConnect = adminDrafterSocketService.on('connection:status', ({ connected }) => {
      setIsConnected(connected);
    });

    // Real-time stats update
    const unsubStats = adminDrafterSocketService.on('stats:update', (data) => {
      setLiveStats(data);
      onStatsUpdate?.(data);
    });

    // Queue changed
    const unsubQueue = adminDrafterSocketService.on('queue:updated', (data) => {
      onQueueUpdated?.(data);

      if (data.change === 'claimed') {
        toast.info(`Project claimed by ${data.drafterName}`, {
          position: 'bottom-right',
          autoClose: 3000
        });
      }
    });

    // New question asked
    const unsubQuestion = adminDrafterSocketService.on('question:new', (data) => {
      toast.info(
        <div>
          <div style={{ fontWeight: 'bold' }}>New Question</div>
          <div style={{ fontSize: '0.875rem' }}>{data.drafterName}: {data.questionText.substring(0, 50)}...</div>
        </div>,
        {
          position: 'top-right',
          autoClose: 10000
        }
      );

      // Play notification sound
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      onNewQuestion?.(data);
    });

    // Assignment status changed
    const unsubAssignment = adminDrafterSocketService.on('assignment:updated', (data) => {
      if (data.status === 'completed') {
        toast.success(`${data.drafterName} completed ${data.projectAddress}`, {
          position: 'bottom-right',
          autoClose: 5000
        });
      } else if (data.status === 'released') {
        toast.warning(`${data.drafterName} released ${data.projectAddress}`, {
          position: 'bottom-right',
          autoClose: 5000
        });
      } else if (data.status === 'expired') {
        toast.error(`Timer expired for ${data.drafterName} - ${data.projectAddress}`, {
          position: 'bottom-right',
          autoClose: 8000
        });
      }

      onAssignmentUpdated?.(data);
    });

    // Drafter came online/offline
    const unsubDrafterStatus = adminDrafterSocketService.on('drafter:status', (data) => {
      onDrafterStatus?.(data);
    });

    return () => {
      unsubConnect();
      unsubStats();
      unsubQueue();
      unsubQuestion();
      unsubAssignment();
      unsubDrafterStatus();
    };
  }, [autoConnect, onStatsUpdate, onQueueUpdated, onNewQuestion, onAssignmentUpdated, onDrafterStatus]);

  const disconnect = useCallback(() => {
    adminDrafterSocketService.disconnect();
  }, []);

  return {
    isConnected,
    liveStats,
    disconnect
  };
};

export default useAdminDrafterSocket;
