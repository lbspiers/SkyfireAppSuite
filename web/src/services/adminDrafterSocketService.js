import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

class AdminDrafterSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[AdminDrafterSocket] No auth token');
      return null;
    }

    console.log('[AdminDrafterSocket] Connecting...');

    this.socket = io(SOCKET_URL + '/admin/drafter', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupListeners();
    return this.socket;
  }

  setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[AdminDrafterSocket] Connected');
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[AdminDrafterSocket] Disconnected:', reason);
      this.emit('connection:status', { connected: false });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

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

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const adminDrafterSocketService = new AdminDrafterSocketService();
export default adminDrafterSocketService;
