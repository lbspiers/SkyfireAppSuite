import { useState, useEffect, useCallback, useRef } from 'react';
import drafterSocketService from '../services/drafterSocketService';

/**
 * Timer hook that syncs with server via Socket.io
 * Prevents timer drift and ensures consistency across tabs
 */
export const useSyncedTimer = (expiresAt, options = {}) => {
  const {
    onExpire,
    onWarning,
    warningThresholds = [5, 1] // minutes
  } = options;

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerState, setTimerState] = useState('active'); // active, warning, critical, expired

  const [lastSyncTime, setLastSyncTime] = useState(null);

  const warnedRef = useRef(new Set());
  const tickIntervalRef = useRef(null);
  const expireCallbackRef = useRef(onExpire);
  const warningCallbackRef = useRef(onWarning);

  // Update refs when callbacks change
  useEffect(() => {
    expireCallbackRef.current = onExpire;
    warningCallbackRef.current = onWarning;
  }, [onExpire, onWarning]);

  // Calculate remaining seconds from expiresAt
  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expiry - now) / 1000));
  }, [expiresAt]);

  // Determine timer state based on remaining time
  const getTimerState = useCallback((seconds) => {
    if (seconds <= 0) return 'expired';
    if (seconds < 60) return 'critical'; // < 1 minute
    if (seconds < 300) return 'warning'; // < 5 minutes
    return 'active';
  }, []);

  // Check and trigger warnings
  const checkWarnings = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);

    warningThresholds.forEach(threshold => {
      if (minutes === threshold && !warnedRef.current.has(threshold)) {
        warnedRef.current.add(threshold);
        warningCallbackRef.current?.(threshold);
      }
    });
  }, [warningThresholds]);

  // Local tick (between syncs)
  useEffect(() => {
    if (!expiresAt) return;

    // Initial calculation
    const initial = calculateRemaining();
    setRemainingSeconds(initial);
    setTimerState(getTimerState(initial));

    // Tick every second
    tickIntervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = Math.max(0, prev - 1);

        // Update state
        setTimerState(getTimerState(newValue));

        // Check warnings
        checkWarnings(newValue);

        // Check expiration
        if (newValue === 0 && prev > 0) {
          expireCallbackRef.current?.();
        }

        return newValue;
      });
    }, 1000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [expiresAt, calculateRemaining, getTimerState, checkWarnings]);

  // Sync with server
  useEffect(() => {
    const unsubSync = drafterSocketService.on('timer:sync', (data) => {
      if (data.remainingSeconds !== undefined) {
        // Server sync - authoritative time
        setRemainingSeconds(data.remainingSeconds);
        setTimerState(getTimerState(data.remainingSeconds));
        setLastSyncTime(new Date(data.serverTime));

        console.log('[Timer] Synced with server:', data.remainingSeconds, 'seconds remaining');
      }
    });

    return () => unsubSync();
  }, [getTimerState]);

  // Format time for display
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Format as hours:minutes:seconds for long timers
  const formatTimeLong = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    remainingSeconds,
    timerState,
    lastSyncTime,
    formattedTime: formatTime(remainingSeconds),
    formattedTimeLong: formatTimeLong(remainingSeconds),
    isExpired: timerState === 'expired',
    isWarning: timerState === 'warning',
    isCritical: timerState === 'critical',
    percentRemaining: expiresAt
      ? (remainingSeconds / (new Date(expiresAt).getTime() - Date.now() + remainingSeconds * 1000)) * 100
      : 0
  };
};

export default useSyncedTimer;
