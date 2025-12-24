import { Stack } from 'expo-router';

export default function JourneysLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Ensure that when navigating back to this stack, it goes to index
        animation: 'default',
      }} 
      initialRouteName="index"
    >
      <Stack.Screen 
        name="index" 
        options={{
          // Ensure index is the default route
        }}
      />
      <Stack.Screen name="assign" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="live-tracking" />
      <Stack.Screen name="client-view" />
    </Stack>
  );
}