import io, { Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';

const BASE_URL = 'https://cargo360-api.onrender.com';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    type: string;
    shipmentId?: number;
    updateType?: string;
    status?: string;
    truckerId?: number;
    truckerName?: string;
    driverId?: number;
    driverName?: string;
    [key: string]: any;
  };
  timestamp?: string;
}

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, EventCallback[]> = new Map();
  private apiUrl: string = BASE_URL;

  /**
   * Connect to Socket.IO server
   * @param {string} accessToken - JWT access token
   * @param {string} apiUrl - Optional API base URL (defaults to BASE_URL)
   */
  connect(accessToken: string, apiUrl?: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    if (apiUrl) {
      this.apiUrl = apiUrl;
    }

    this.socket = io(this.apiUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.emit('connection', { connected: true });
    });

    // Server confirms connection
    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
      // data: { message, userId, timestamp }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { connected: false });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.emit('error', error);
    });

    // Real-time notifications
    this.socket.on('notification', (notification: NotificationPayload) => {
      console.log('Notification received:', notification);
      this.emit('notification', notification);
    });

    // Ping/Pong for connection health
    this.socket.on('pong', (data) => {
      console.log('Pong received:', data);
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Reconnect with new token (after token refresh)
   * @param {string} newToken - New JWT token
   */
  async reconnect(newToken: string) {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connect(newToken, this.apiUrl);
  }

  /**
   * Send ping to server
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event: string, callback: EventCallback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to registered listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;


