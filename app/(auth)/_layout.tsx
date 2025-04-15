import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />{/* Corresponds to (auth)/index.tsx */}
      <Stack.Screen name="parent-sign-up" /> {/* Add sign up screen */}
      <Stack.Screen name="parent-login" /> {/* Add login screen */}
      <Stack.Screen name="child-login" /> {/* Add child login screen */}
      {/* Add other auth-related screens like login/signup later */}
    </Stack>
  );
} 