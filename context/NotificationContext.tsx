import { createContext, useContext, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface NotificationContextType {
  sendNotification: (type: string, data: any) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Skip permissions on web
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  };

  const sendNotification = async (type: string, data: any) => {
    try {
      // In a real app, this would send to your backend API
      // which would then push to the client app
      console.log('Sending notification:', { type, data });
      
      // For demo purposes, show local notification
      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: getNotificationTitle(type),
            body: data.message,
            data: { type, ...data },
          },
          trigger: null, // Send immediately
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  };

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'journey_started':
        return 'Journey Started';
      case 'milestone_reached':
        return 'Milestone Update';
      case 'journey_completed':
        return 'Journey Completed';
      default:
        return 'TruckTracker Update';
    }
  };

  return (
    <NotificationContext.Provider value={{
      sendNotification,
      requestPermissions,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}