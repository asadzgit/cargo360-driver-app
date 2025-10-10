import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';
// Import background location task so TaskManager.defineTask is registered on startup
import '@/tasks/locationTrackingTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME, startBackgroundLocationTracking } from '@/tasks/locationTrackingTask';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const resumeIfNeeded = async () => {
      try {
        const shipmentIdStr = await AsyncStorage.getItem('tracking.currentShipmentId');
        const shipmentId = shipmentIdStr ? parseInt(shipmentIdStr, 10) : null;
        if (!shipmentId) return;

        // Ensure background permissions are granted
        const bg = await Location.getBackgroundPermissionsAsync();
        if (bg.status !== 'granted') {
          // Try requesting again silently
          await Location.requestBackgroundPermissionsAsync();
        }

        const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!running) {
          await startBackgroundLocationTracking(shipmentId);
        }
      } catch (e) {
        console.error('Failed to resume background tracking:', e);
      }
    };

    resumeIfNeeded();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </NotificationProvider>
    </AuthProvider>
  );
}