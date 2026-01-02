import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
// import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import NotificationBanner from '@/components/NotificationBanner';
// Import i18n configuration
import '@/i18n';
// Import background location task so TaskManager.defineTask is registered on startup
import '@/tasks/locationTrackingTask';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <LanguageProvider>
      <AuthProvider>
        {/* <NotificationProvider> */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <NotificationBanner />
        {/* </NotificationProvider> */}
      </AuthProvider>
    </LanguageProvider>
  );
}