import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="driver-login" />
      {/* Phone-based auth flow */}
      <Stack.Screen name="phone-signup" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="enter-pin" />
    </Stack>
  );
}