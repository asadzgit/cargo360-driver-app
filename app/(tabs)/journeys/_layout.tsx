import { Stack } from 'expo-router';

export default function JourneysLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="assign" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="live-tracking" />
      <Stack.Screen name="client-view" />
    </Stack>
  );
}