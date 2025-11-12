import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
// import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';
// Import background location task so TaskManager.defineTask is registered on startup
import '@/tasks/locationTrackingTask';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      {/* <NotificationProvider> */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      {/* </NotificationProvider> */}
    </AuthProvider>
  );
}