import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import drafterSocketService from '../services/drafterSocketService';

export const useDrafterSocket = (options = {}) => {
  const {
    autoConnect = true,
    onJobAvailable,
    onJobClaimed,
    onTimerSync,
    onTimerWarning,
    onTimerExpired,
    onQuestionAnswered,
    onAchievementUnlocked
  } = options;

  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [nextJob, setNextJob] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const heartbeatRef = useRef(null);

  // Connect on mount
  useEffect(() => {
    if (!autoConnect) return;

    const socket = drafterSocketService.connect();
    if (!socket) return;

    // Connection status
    const unsubConnect = drafterSocketService.on('connection:status', ({ connected }) => {
      setIsConnected(connected);
      setConnectionError(null);

      if (connected) {
        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          drafterSocketService.sendHeartbeat();
        }, 30000);
      } else {
        // Stop heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
        }
      }
    });

    const unsubError = drafterSocketService.on('connection:error', ({ error }) => {
      setConnectionError(error);
    });

    // Job available broadcast
    const unsubJobAvailable = drafterSocketService.on('job:available', (data) => {
      console.log('[DrafterSocket] Job available:', data);
      setNextJob(data);

      // Play notification sound
      playNotificationSound();

      // Show toast
      toast.info(`New job available: ${data.city}, ${data.state}`, {
        position: 'top-center',
        autoClose: 5000
      });

      onJobAvailable?.(data);
    });

    // Job claimed by someone else
    const unsubJobClaimed = drafterSocketService.on('job:claimed', (data) => {
      console.log('[DrafterSocket] Job claimed by another:', data);
      setNextJob(null);

      toast.warning('Job was claimed by another drafter', {
        position: 'top-center',
        autoClose: 3000
      });

      onJobClaimed?.(data);
    });

    // Timer sync
    const unsubTimerSync = drafterSocketService.on('timer:sync', (data) => {
      onTimerSync?.(data);
    });

    // Timer warning
    const unsubTimerWarning = drafterSocketService.on('timer:warning', (data) => {
      console.log('[DrafterSocket] Timer warning:', data);

      // Play warning sound
      playWarningSound();

      // Show prominent toast
      toast.warning(`⏱️ Only ${data.remainingMinutes} minute${data.remainingMinutes > 1 ? 's' : ''} remaining!`, {
        position: 'top-center',
        autoClose: false,
        closeOnClick: true
      });

      // Browser notification
      showBrowserNotification(
        'Time Warning!',
        `Only ${data.remainingMinutes} minute${data.remainingMinutes > 1 ? 's' : ''} remaining on your assignment!`
      );

      onTimerWarning?.(data);
    });

    // Timer expired
    const unsubTimerExpired = drafterSocketService.on('timer:expired', (data) => {
      console.log('[DrafterSocket] Timer expired:', data);

      toast.error('⏱️ Time expired! Project returned to queue.', {
        position: 'top-center',
        autoClose: false
      });

      // Redirect to dashboard after delay
      setTimeout(() => {
        navigate('/drafter-portal');
      }, 3000);

      onTimerExpired?.(data);
    });

    // Question answered
    const unsubQuestionAnswered = drafterSocketService.on('question:answered', (data) => {
      console.log('[DrafterSocket] Question answered:', data);

      toast.success('Your question has been answered!', {
        position: 'top-right',
        autoClose: 5000
      });

      // Play notification sound
      playNotificationSound();

      onQuestionAnswered?.(data);
    });

    // Achievement unlocked
    const unsubAchievement = drafterSocketService.on('achievement:unlocked', (data) => {
      console.log('[DrafterSocket] Achievement unlocked:', data);

      // Show achievement toast with animation
      toast.success(
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>{data.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold' }}>Achievement Unlocked!</div>
            <div>{data.name}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>+{data.xpEarned} XP</div>
          </div>
        </div>,
        {
          position: 'top-center',
          autoClose: 8000,
          className: 'achievement-toast'
        }
      );

      // Play achievement sound
      playAchievementSound();

      onAchievementUnlocked?.(data);
    });

    // Cleanup
    return () => {
      unsubConnect();
      unsubError();
      unsubJobAvailable();
      unsubJobClaimed();
      unsubTimerSync();
      unsubTimerWarning();
      unsubTimerExpired();
      unsubQuestionAnswered();
      unsubAchievement();

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [autoConnect, navigate, onJobAvailable, onJobClaimed, onTimerSync, onTimerWarning, onTimerExpired, onQuestionAnswered, onAchievementUnlocked]);

  // Mark as available (when on dashboard, ready to claim)
  const markAvailable = useCallback(() => {
    drafterSocketService.markAvailable();
  }, []);

  // Mark as busy (when working on assignment)
  const markBusy = useCallback((assignmentUuid) => {
    drafterSocketService.markBusy(assignmentUuid);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    drafterSocketService.disconnect();
  }, []);

  return {
    isConnected,
    connectionError,
    nextJob,
    markAvailable,
    markBusy,
    disconnect
  };
};

// Helper functions
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
}

function playWarningSound() {
  try {
    const audio = new Audio('/sounds/warning.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (e) {}
}

function playAchievementSound() {
  try {
    const audio = new Audio('/sounds/achievement.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (e) {}
}

function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200]
    });
  }
}

export default useDrafterSocket;
