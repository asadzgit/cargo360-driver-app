import { useEffect, useState, useCallback } from 'react';
import socketService, { NotificationPayload } from '@/services/socketService';
import { useRouter } from 'expo-router';

export interface Notification extends NotificationPayload {
  id: string;
  read: boolean;
  createdAt: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Listen for connection status
    const handleConnection = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    };

    // Listen for notifications
    const handleNotification = (notification: NotificationPayload) => {
      console.log('New notification:', notification);

      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
        createdAt: Date.now(),
      };

      // Add to notifications list
      setNotifications((prev) => [newNotification, ...prev]);

      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
    };

    // Listen for errors
    const handleError = (error: any) => {
      console.error('Socket error:', error);
    };

    // Register listeners
    socketService.on('connection', handleConnection);
    socketService.on('notification', handleNotification);
    socketService.on('error', handleError);

    // Get initial connection status
    setIsConnected(socketService.getConnectionStatus().connected);

    // Cleanup
    return () => {
      socketService.off('connection', handleConnection);
      socketService.off('notification', handleNotification);
      socketService.off('error', handleError);
    };
  }, []);

  /**
   * Navigate based on notification type
   */
  const handleNotificationNavigation = useCallback(
    (notification: NotificationPayload) => {
      const { type, shipmentId, updateType } = notification.data || {};

      switch (type) {
        case 'shipment_update':
          if (shipmentId) {
            // Navigate to shipment/journey details
            router.push(`/(tabs)/journeys/${shipmentId}`);
          }
          break;

        case 'profile_updated':
          // Navigate to profile or refresh profile data
          router.push('/(tabs)/profile');
          break;

        default:
          // Handle other notification types
          break;
      }
    },
    [router]
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}


