import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

class DrafterSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(namespace = '/drafter') {
    if (this.socket?.connected) {
      console.log('[DrafterSocket] Already connected');
      return this.socket;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[DrafterSocket] No auth token available');
      return null;
    }

    console.log('[DrafterSocket] Connecting to', SOCKET_URL + namespace);

    this.socket = io(SOCKET_URL + namespace, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupCoreListeners();
    return this.socket;
  }

  setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[DrafterSocket] Connected:', this.socket.id);
      this.reconnectAttempts = 0;
      // Notify all listeners of connection
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[DrafterSocket] Disconnected:', reason);
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[DrafterSocket] Connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('connection:error', { error: error.message, attempts: this.reconnectAttempts });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[DrafterSocket] Reconnected after', attemptNumber, 'attempts');
      this.emit('connection:status', { connected: true, reconnected: true });
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('[DrafterSocket] Error:', error);
      this.emit('socket:error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[DrafterSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit to internal listeners (not socket)
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('[DrafterSocket] Listener error:', err);
        }
      });
    }
  }

  // Send to server
  send(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[DrafterSocket] Cannot send, not connected');
    }
  }

  // Drafter-specific methods
  markAvailable() {
    this.send('drafter:available', {});
  }

  markBusy(assignmentUuid) {
    this.send('drafter:busy', { assignmentUuid });
  }

  sendHeartbeat() {
    this.send('drafter:heartbeat', { timestamp: Date.now() });
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const drafterSocketService = new DrafterSocketService();
export default drafterSocketService;
